'use strict';
const {app,BrowserWindow,ipcMain,dialog,shell,nativeImage} = require('electron');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const engine=require('./engine.cjs');
const project=path.resolve(__dirname,'../..');
const adminRoot=path.join(project,'.champagne-admin','modpack-tool');
fs.mkdirSync(path.join(adminRoot,'app-data'),{recursive:true});
app.setName('VillaWolf Administrador');
app.setPath('userData',path.join(adminRoot,'app-data'));
let win,source='',plan=null,prepared=null,busy=false,output=null;
let background=null;
function progress(message) { if(win&&!win.isDestroyed()) win.webContents.send('admin-progress',message); }
function guard(event) { if(!win || event.sender!==win.webContents || event.senderFrame!==win.webContents.mainFrame) throw new Error('Solicitud no autorizada.'); }
function handle(name,action) {ipcMain.handle(name,async(event,...args)=>{
  guard(event); if(busy) return {ok:false,error:'Espera a que termine la operación actual.'};
  busy=true; try{return {ok:true,...await action(...args)};}catch(error){return{ok:false,error:error.message};}finally{busy=false;}
});}
handle('admin-info',async()=>{
  try{source=JSON.parse(fs.readFileSync(path.join(adminRoot,'settings.json'),'utf8')).source;}catch{
    try{source=JSON.parse(fs.readFileSync(path.join(project,'tools','curseforge-local.json'),'utf8')).source;}catch{}
  }
  return {source,repository:engine.REPO,branch:engine.BRANCH};
});
handle('admin-folder',async()=>{
  const choice=await dialog.showOpenDialog(win,{title:'Selecciona tu instancia de CurseForge',defaultPath:source||undefined,properties:['openDirectory']});
  if(!choice.canceled){source=choice.filePaths[0];plan=prepared=null;output=null;fs.writeFileSync(path.join(adminRoot,'settings.json'),JSON.stringify({source}));}return{source};
});
handle('admin-analyze',async()=>{
  plan=prepared=null;output=null;
  plan=await engine.analyze(source,progress);background=plan.design.background;return {report:engine.report(plan)};
});
handle('admin-history',async()=>({history:await engine.history()}));
handle('admin-restore',async version=>{prepared=null;output=null;plan=await engine.restore(version,progress);background=plan.design.background;return{report:engine.report(plan)};});
handle('admin-image',async()=>{
  const selected=await dialog.showOpenDialog(win,{title:'Elegir fondo del modpack',properties:['openFile'],filters:[{name:'Imágenes PNG/JPG',extensions:['png','jpg','jpeg']}]});
  if(selected.canceled)return{cancelled:true};
  const file=selected.filePaths[0],st=fs.lstatSync(file);
  if(!st.isFile()||st.isSymbolicLink()||st.size>16*1024*1024)throw Error('Selecciona una imagen normal de hasta 16 MB.');
  const image=nativeImage.createFromPath(file);
  if(image.isEmpty())throw Error('No se pudo leer la imagen.');
  const size=image.getSize();const optimized=size.width>1920?image.resize({width:1920}):image;
  const bytes=optimized.toJPEG(88);
  if(bytes.length>4*1024*1024)throw Error('La imagen optimizada supera 4 MB.');
  background={mime:'image/jpeg',sha256:engine.hash(bytes),base64:bytes.toString('base64')};prepared=null;
  return{preview:'data:image/jpeg;base64,'+background.base64};
});
handle('admin-clear-image',async()=>{background=null;prepared=null;return{};});
handle('admin-prepare',async({version,selected,packName,notes})=>{
  if(!plan)throw new Error('Primero analiza la carpeta.');
  prepared=null; engine.assertSourceUnchanged(plan);
  plan.design={packName,background,...(typeof notes==='string'&&notes.trim()?{notes:{title:'Actualización '+version,text:notes.trim(),publishedAt:new Date().toISOString()}}:{})};
  const manifest=engine.buildManifest(plan,version,selected);
  await engine.validatePackage(manifest,progress);
  const out=path.join(adminRoot,'preparados',version+'-'+crypto.randomUUID());
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'modpack-'+version+'.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(path.join(out,'revision.json'),JSON.stringify({version,game:manifest.game,presentation:{notes:manifest.presentation?.notes||null,background:manifest.presentation?.background?{mime:manifest.presentation.background.mime,sha256:manifest.presentation.background.sha256}:null},restoredFrom:manifest.restoredFrom||null,mods:manifest.files.length,content:manifest.content.files.map(e=>e.path),changes:plan.modChanges,excluded:plan.current.excluded,baseCommit:plan.base.head},null,2)+'\n',{flag:'wx'});
  prepared=manifest; output=out;
  return {output:out,version,content:manifest.content.files.length,removedContent:plan.base.manifest.content.files.filter(e=>!selected.includes(e.path)).map(e=>e.path)};
});
handle('admin-output',async()=>{if(!output)throw new Error('No hay paquete preparado.');await shell.openPath(output);return{};});
handle('admin-publish',async({token,tested,reviewed})=>{
  if(!prepared||!plan)throw new Error('Prepara la actualización antes de publicarla.');
  if(!tested||!reviewed)throw new Error('Confirma las pruebas y la revisión del contenido.');
  const answer=await dialog.showMessageBox(win,{type:'warning',title:'Publicar actualización del modpack',
    message:'¿Activar '+prepared.game.packName+' '+prepared.version+' para los jugadores?',
    detail:`Se actualizará updates/stable-v2.json en ${engine.REPO}, rama ${engine.BRANCH}. Contiene ${prepared.files.length} mods y ${prepared.content.files.length} archivos de contenido. Los jugadores la recibirán al pulsar JUGAR. Revisa que los archivos seleccionados puedan publicarse y no contengan datos personales.`,
    buttons:['Cancelar','Verificar y publicar'],defaultId:0,cancelId:0,noLink:true});
  if(answer.response!==1)return{cancelled:true};
  const result=await engine.publish(plan,prepared,{token,tested,reviewed,onProgress:progress});
  fs.writeFileSync(path.join(output,'publicacion.json'),JSON.stringify(result,null,2)+'\n');
  plan=prepared=null; return{result};
});
app.whenReady().then(()=>{
  win=new BrowserWindow({width:1120,height:820,minWidth:850,minHeight:650,backgroundColor:'#0c1018',title:'VillaWolf — Administrador del modpack',
    icon:path.join(project,'src/assets/villawolf-icon.png'),autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.loadFile(path.join(__dirname,'index.html'));
  win.on('close',event=>{if(busy){event.preventDefault();progress('Espera a que termine la operación antes de cerrar.');}});
});
app.on('window-all-closed',()=>app.quit());
