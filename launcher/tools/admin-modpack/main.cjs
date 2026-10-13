'use strict';
const {app,BrowserWindow,ipcMain,dialog,shell,nativeImage} = require('electron');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const engineModule=require('./engine.cjs');
let engine=engineModule;
const {validateCatalog}=require('../../src/champagne-pack-catalog');
let activePack=null,adminPacks=[];
const draftFile=()=>path.join(adminRoot,'modpacks.json');
function drafts(){try{return validateCatalog(JSON.parse(fs.readFileSync(draftFile(),'utf8'))).packs;}catch{return[];}}
function resetPack(){plan=prepared=designPlan=null;background=null;output=null;source='';}
async function loadPacks(){const r=await adminCatalogAccess.catalog();adminPacks=validateCatalog(r.catalog).packs.map(p=>({...p,published:true}));for(const p of drafts())if(!adminPacks.some(e=>e.id===p.id))adminPacks.push({...p,published:false});return{packs:adminPacks.filter(p=>p.enabled),selectedId:activePack?.id||null};}
function packSettings(){return path.join(adminRoot,activePack?'settings-'+activePack.id+'.json':'settings.json');}
handle('admin-packs',loadPacks);
handle('admin-select-pack',async id=>{await loadPacks();const pack=adminPacks.find(p=>p.id===id);if(!pack)throw Error('Modpack no disponible.');resetPack();activePack=pack;engine=engineModule.createEngine(pack);try{source=JSON.parse(fs.readFileSync(packSettings(),'utf8')).source||'';}catch{}return{packs:adminPacks.filter(p=>p.enabled),selectedId:activePack.id,source,packName:pack.name};});
handle('admin-create-pack',async input=>{if(typeof input?.name!=='string'||!input.name.trim()||input.name.length>80||!/^\d{17,20}$/.test(input.roleId||''))throw Error('Escribe el nombre y el ID del rol de Discord.');await loadPacks();if(adminPacks.length>=50)throw Error('Máximo 50 modpacks.');const id='pack-'+crypto.randomBytes(8).toString('hex'),pack={id,name:input.name.trim(),roleId:input.roleId,enabled:true,manifestPath:'updates/packs/'+id+'/stable.json'};const local=drafts();local.push(pack);fs.writeFileSync(draftFile(),JSON.stringify({schemaVersion:1,packs:local},null,2));adminPacks.push(pack);resetPack();activePack=pack;engine=engineModule.createEngine(pack);return{packs:adminPacks,selectedId:id,source:'',packName:pack.name};});
const {createAuthClient}=require('../../src/champagne-auth');
const {createSessionStore}=require('../../src/champagne-session-store');
const {confirmPublication}=require('./confirmation.cjs');
const project=path.resolve(__dirname,'../..');
const adminRoot=app.isPackaged?path.join(app.getPath('appData'),'VillaWolf Administrador'):path.join(project,'.champagne-admin','modpack-tool');
fs.mkdirSync(path.join(adminRoot,'app-data'),{recursive:true});
app.setName('VillaWolf Administrador');
app.setAppUserModelId('com.villawolf.administrador');
app.setPath('userData',path.join(adminRoot,'app-data'));
let win,source='',plan=null,prepared=null,busy=false,output=null;
let background=null,designPlan=null;
const adminAuth=createAuthClient({baseUrl:require('../../src/config').authServerUrl,provider:'discord',required:true,purpose:'admin',openBrowser:url=>shell.openExternal(url),sessionStore:createSessionStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,scope:'admin|'+require('../../src/config').authServerUrl,filename:'discord-admin-session.bin'})});
const adminCatalogAccess=require('./catalog-access.cjs').createAdminCatalogAccess(adminAuth);
const publicActions=new Set(['admin-info','admin-auth-status','admin-auth-login','admin-auth-logout','admin-update-check']);
handle('admin-auth-status',async()=>{try{if(adminAuth.status().user)await adminCatalogAccess.status();return{...adminAuth.status(),authorized:!!adminAuth.status().user};}catch(error){return{...adminAuth.status(),authorized:false,message:error.message,retryAfter:error.retryAfter||0};}});
handle('admin-auth-login',async()=>{const result=await adminAuth.loginDiscord();if(!result.ok)throw Error(result.message);return{...result,authorized:true};});
handle('admin-auth-logout',async()=>{plan=prepared=designPlan=null;background=null;output=null;adminCatalogAccess.clear();return adminAuth.logout();});
ipcMain.handle('admin-auth-cancel',event=>{guard(event);return adminAuth.cancelDiscordLogin();});
const adminUpdates=require('./admin-updates.cjs').createAdminUpdates({app,feed:"https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/preparacion-paso97/updates/admin",loadUpdater:()=>require('electron-updater').autoUpdater,isBusy:()=>busy,status:()=>{},onState:state=>{if(win&&!win.isDestroyed())win.webContents.send('admin-update-state',state);},progress:state=>{if(win&&!win.isDestroyed())win.webContents.send('admin-update-state',{phase:'downloading',message:'Descargando actualización del Administrador…',percent:state.totalBytes?Math.round(state.bytes/state.totalBytes*100):null});}});
handle('admin-update-check',async()=>adminUpdates.check());
const tokenStore=require('./token-store.cjs').createAdminTokenStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,repository:engine.REPO,branch:engine.BRANCH});
function progress(message) { if(win&&!win.isDestroyed()) win.webContents.send('admin-progress',message); }
function guard(event) { if(!win || event.sender!==win.webContents || event.senderFrame!==win.webContents.mainFrame) throw new Error('Solicitud no autorizada.'); }
function handle(name,action) {ipcMain.handle(name,async(event,...args)=>{
  guard(event); if(busy) return {ok:false,error:'Espera a que termine la operación actual.'};
  busy=true; try{if(!publicActions.has(name)){if(!['admin-packs','admin-select-pack','admin-create-pack','admin-token-status'].includes(name))await adminAuth.verifiedUsername();if(!activePack&&!['admin-packs','admin-select-pack','admin-create-pack','admin-token-status','admin-token-save','admin-token-clear'].includes(name))throw Error('Selecciona un modpack antes de continuar.');}return {ok:true,...await action(...args)};}catch(error){return{ok:false,error:error.message,retryAfter:error.retryAfter||0};}finally{busy=false;}
});}
handle('admin-token-status',async()=>tokenStore.status());
handle('admin-token-save',async token=>tokenStore.save(token));
handle('admin-token-clear',async()=>tokenStore.clear());
handle('admin-info',async()=>{
  try{source=JSON.parse(fs.readFileSync(packSettings(),'utf8')).source;}catch{
    if(!app.isPackaged){try{source=JSON.parse(fs.readFileSync(path.join(project,'tools','curseforge-local.json'),'utf8')).source;}catch{}}
  }
  return {source,repository:engine.REPO,branch:engine.BRANCH,packName:activePack?.name||'modpack',appVersion:app.isPackaged?app.getVersion():require('./version.json').version,updateState:adminUpdates.getState()};
});
handle('admin-folder',async()=>{
  const choice=await dialog.showOpenDialog(win,{title:'Selecciona tu instancia de CurseForge',defaultPath:source||undefined,properties:['openDirectory']});
  if(!choice.canceled){source=choice.filePaths[0];plan=prepared=null;output=null;fs.writeFileSync(packSettings(),JSON.stringify({source}));}return{source};
});
handle('admin-analyze',async()=>{
  plan=prepared=null;output=null;
  plan=await engine.analyze(source,progress);background=plan.design.background;return {report:engine.report(plan)};
});
handle('admin-design',async()=>{prepared=null;output=null;plan=await engine.presentationPlan(progress);designPlan=plan;background=plan.design.background;return{report:engine.report(plan)};});
handle('admin-history',async()=>({history:await engine.history()}));
handle('admin-restore',async version=>{prepared=null;output=null;plan=await engine.restore(version,progress);background=plan.design.background;return{report:engine.report(plan)};});
handle('admin-delete-pack',async()=>{
 if(!activePack)throw Error('Selecciona un lanzador.');const answer=await confirmPublication(win,{title:'Eliminar lanzador',message:'¿Retirar '+activePack.name+'?',detail:'Se ocultará del catálogo para los jugadores. Se conservan sus mundos, la carpeta original de CurseForge y el historial de versiones. Esta acción no desinstala el Launcher.',buttons:['Cancelar','Eliminar lanzador']});if(answer.response!==1)return{cancelled:true};
 let result={retired:true,packName:activePack.name};const entry=adminPacks.find(p=>p.id===activePack.id);if(entry?.published)result=await engine.disablePack({token:tokenStore.resolve(''),onProgress:progress,authorize:()=>adminAuth.verifiedUsername()});
 const local=drafts();for(const p of local)if(p.id===activePack.id)p.enabled=false;fs.writeFileSync(draftFile(),JSON.stringify({schemaVersion:1,packs:local},null,2));resetPack();activePack=null;engine=engineModule;return{...await loadPacks(),result};
});
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
handle('admin-prepare',async({version,selected,packName,notes,news,updates})=>{
  if(!plan)throw new Error('Primero analiza la carpeta.');
  prepared=null; engine.assertSourceUnchanged(plan);
  plan.design={packName,background,news,updates,...(typeof notes==='string'&&notes.trim()?{notes:{title:'Actualización '+version,text:notes.trim(),publishedAt:new Date().toISOString()}}:{})};
  const manifest=engine.buildManifest(plan,version,selected);
  await engine.validatePackage(manifest,progress);
  const out=path.join(adminRoot,'preparados',version+'-'+crypto.randomUUID());
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'modpack-'+version+'.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(path.join(out,'revision.json'),JSON.stringify({version,game:manifest.game,presentation:{news:manifest.presentation?.news||null,updates:manifest.presentation?.updates||null,notes:manifest.presentation?.notes||null,background:manifest.presentation?.background?{mime:manifest.presentation.background.mime,sha256:manifest.presentation.background.sha256}:null},restoredFrom:manifest.restoredFrom||null,mods:manifest.files.length,content:manifest.content.files.map(e=>e.path),changes:plan.modChanges,excluded:plan.current.excluded,baseCommit:plan.base.head},null,2)+'\n',{flag:'wx'});
  prepared=manifest; output=out;
  return {review:{version,packName:manifest.game.packName,minecraft:manifest.game.minecraftVersion,forge:manifest.game.forgeVersion,mods:manifest.files.length,changes:plan.modChanges,contentChanges:{added:manifest.content.files.filter(e=>!plan.base.manifest.content.files.some(p=>p.path===e.path)).map(e=>e.path),changed:manifest.content.files.filter(e=>plan.base.manifest.content.files.some(p=>p.path===e.path&&p.sha256!==e.sha256)).map(e=>e.path),removed:plan.base.manifest.content.files.filter(e=>!manifest.content.files.some(p=>p.path===e.path)).map(e=>e.path)},content:manifest.content.files.length,news:manifest.presentation?.news,updates:manifest.presentation?.updates,backgroundChanged:manifest.presentation?.background?.sha256!==plan.base.manifest.presentation?.background?.sha256},output:out,version,content:manifest.content.files.length,removedContent:plan.base.manifest.content.files.filter(e=>!selected.includes(e.path)).map(e=>e.path)};
});
handle('admin-publish-design',async({packName,news,updates})=>{
  if(!designPlan)throw Error('Primero carga el diseño publicado.');
  const design={packName,news,updates,background};engine.buildPresentationManifest(designPlan,design);
  const token=tokenStore.resolve('');
  const answer=await confirmPublication(win,{type:'question',title:'Publicar cambios de interfaz',message:'¿Publicar el diseño de '+packName+'?',detail:'Cambiará únicamente el nombre, el fondo y las tarjetas de noticias y actualizaciones. Se conservan la versión, Minecraft, Forge, mods y configuraciones.',buttons:['Cancelar','Publicar cambios'],defaultId:0,cancelId:0,noLink:true});
  if(answer.response!==1)return{cancelled:true};
  const result=await engine.publishPresentation(designPlan,design,{token,onProgress:progress,authorize:()=>adminAuth.verifiedUsername()});designPlan=null;return{result};
});
handle('admin-output',async()=>{if(!output)throw new Error('No hay paquete preparado.');await shell.openPath(output);return{};});
handle('admin-publish',async({token,tested,reviewed})=>{
  token=tokenStore.resolve(token);
  if(!prepared||!plan)throw new Error('Prepara la actualización antes de publicarla.');
  if(!tested||!reviewed)throw new Error('Confirma las pruebas y la revisión del contenido.');
  const answer=await confirmPublication(win,{type:'warning',title:'Publicar actualización del modpack',
    message:'¿Activar '+prepared.game.packName+' '+prepared.version+' para los jugadores?',
    detail:`Se actualizará ${engine.locations?.channel||'updates/stable-v2.json'} en ${engine.REPO}, rama ${engine.BRANCH}. Contiene ${prepared.files.length} mods y ${prepared.content.files.length} archivos de contenido. Los jugadores la recibirán al pulsar JUGAR. Revisa que los archivos seleccionados puedan publicarse y no contengan datos personales.`,
    buttons:['Cancelar','Verificar y publicar'],defaultId:0,cancelId:0,noLink:true});
  if(answer.response!==1)return{cancelled:true};
  const result=await engine.publish(plan,prepared,{token,tested,reviewed,onProgress:progress,authorize:()=>adminAuth.verifiedUsername()});
  fs.writeFileSync(path.join(output,'publicacion.json'),JSON.stringify(result,null,2)+'\n');
  plan=prepared=null; return{result};
});
app.whenReady().then(()=>{
  win=new BrowserWindow({width:1120,height:820,minWidth:850,minHeight:650,backgroundColor:'#0c1018',title:'VillaWolf — Administrador del modpack',
    icon:path.join(__dirname,'assets/villawolf-admin-transparent.ico'),autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.once('did-finish-load',()=>adminUpdates.check());
  win.on('close',event=>{if(busy){event.preventDefault();progress('Espera a que termine la operación antes de cerrar.');}});
});
app.on('window-all-closed',()=>app.quit());
