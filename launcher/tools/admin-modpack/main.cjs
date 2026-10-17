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
async function loadPacks(){syncPendingEvents().catch(()=>{});const r=await adminCatalogAccess.catalog();adminPacks=validateCatalog(r.catalog).packs.map(p=>({...p,published:true}));for(const p of drafts())if(!adminPacks.some(e=>e.id===p.id))adminPacks.push({...p,published:false});return{packs:adminPacks,selectedId:activePack?.id||null};}
handle('admin-packs',loadPacks);
handle('admin-select-pack',async id=>{await loadPacks();const pack=adminPacks.find(p=>p.id===id);if(!pack)throw Error('Modpack no disponible.');resetPack();activePack=pack;engine=engineModule.createEngine(pack);source=packSourceStore.load(activePack.id);return{packs:adminPacks,selectedId:activePack.id,source,packName:pack.name};});
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
const packSourceStore=require('./pack-source-store.cjs').createPackSourceStore(adminRoot);
const draftStore=require('./draft-store.cjs').createDraftStore(adminRoot);
const announcementDrafts=require('./announcement-drafts.cjs').createStore(adminRoot);
require('./manual-announcements.cjs').register({handle,getPack:()=>activePack&&({...activePack,published:activePack.published??adminPacks.find(p=>p.id===activePack.id)?.published??false}),auth:{manualAnnouncement:(...args)=>adminAuth.manualAnnouncement(...args)},store:announcementDrafts,confirm:options=>confirmPublication(win,options),chooseImage:async()=>{const result=await dialog.showOpenDialog(win,{title:'Imagen para el anuncio',properties:['openFile'],filters:[{name:'Imágenes PNG o JPG',extensions:['png','jpg','jpeg']}]});if(result.canceled)return undefined;return require('./announcement-drafts.cjs').prepareImage(result.filePaths[0],nativeImage);}});
const wizardModel=require('./wizard-model.cjs');
const community=require('../../src/champagne-community');

let win,source='',plan=null,prepared=null,busy=false,output=null;
let background=null,designPlan=null;
const adminAuth=createAuthClient({baseUrl:require('../../src/config').authServerUrl,provider:'discord',required:true,purpose:'admin',openBrowser:url=>shell.openExternal(url),sessionStore:createSessionStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,scope:'admin|'+require('../../src/config').authServerUrl,filename:'discord-admin-session.bin'})});
const adminActivity=[];
const problemReporter=require('../../src/champagne-problem-reporter').createProblemReporter({app:'admin',version:require('./version.json').version,store:createSessionStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,scope:'admin-errors',filename:'application-errors.bin'}),account:()=>adminAuth.status().user,send:report=>adminAuth.reportProblem(report)});
require('../../src/champagne-problem-monitor').monitorProblems({app,reporter:problemReporter,activity:()=>adminActivity.join('\n')});

let publicationConnection;
const sharedConnection=(refresh=false)=>publicationConnection.shared(refresh);
const publicationToken=()=>publicationConnection.token();
async function officialFetch(url,options={}){if(require('../../src/champagne-curseforge-api').isCurseForgeFile(url))return new Response(await adminAuth.downloadCurseforge({url}),{status:200});const prefix='https://api.github.com/repos/'+engineModule.REPO;if(String(url).startsWith(prefix+'/')&&await sharedConnection()){const r=await adminAuth.githubRequest({path:String(url).slice(prefix.length),method:options.method||'GET',...(options.body?{body:JSON.parse(options.body)}:{})});return new Response(JSON.stringify(r.data),{status:r.upstreamStatus,headers:{'Content-Type':'application/json'}});}return fetch(url,options);}
const adminCatalogAccess=require('./catalog-access.cjs').createAdminCatalogAccess(adminAuth);
const localActions=new Set(['admin-folder','admin-source-save','admin-analyze','admin-design','admin-history','admin-restore','admin-image','admin-clear-image','admin-prepare','admin-output','admin-wizard-load','admin-wizard-save','admin-wizard-folder','admin-wizard-inspect','admin-wizard-analyze','admin-wizard-discord','admin-wizard-image','admin-wizard-create']);
const publicActions=new Set(['admin-info','admin-auth-status','admin-auth-login','admin-auth-logout','admin-update-check']);
for(const name of ['admin-announcement-load','admin-announcement-save','admin-announcement-image'])localActions.add(name);
handle('admin-auth-status',async()=>{try{if(adminAuth.status().user)await adminCatalogAccess.status();return{...adminAuth.status(),authorized:!!adminAuth.status().user};}catch(error){return{...adminAuth.status(),authorized:false,message:error.message,retryAfter:error.retryAfter||0};}});
handle('admin-auth-login',async()=>{const result=await adminAuth.loginDiscord();if(!result.ok)throw Error(result.message);return{...result,authorized:true};});
handle('admin-auth-logout',async()=>{publicationConnection.clear();plan=prepared=designPlan=null;background=null;output=null;adminCatalogAccess.clear();return adminAuth.logout();});
ipcMain.handle('admin-auth-cancel',event=>{guard(event);return adminAuth.cancelDiscordLogin();});
const adminUpdates=require('./admin-updates.cjs').createAdminUpdates({app,feed:"https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/preparacion-paso97/updates/admin",loadUpdater:()=>require('electron-updater').autoUpdater,isBusy:()=>busy,status:()=>{},onState:state=>{if(win&&!win.isDestroyed())win.webContents.send('admin-update-state',state);},progress:state=>{if(win&&!win.isDestroyed())win.webContents.send('admin-update-state',{phase:'downloading',message:'Descargando actualización del Administrador…',percent:state.totalBytes?Math.round(state.bytes/state.totalBytes*100):null});}});
handle('admin-update-check',async()=>adminUpdates.check());
const tokenStore=require('./token-store.cjs').createAdminTokenStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,repository:engine.REPO,branch:engine.BRANCH});
publicationConnection=require('./publication-connection.cjs').createPublicationConnection(adminAuth,tokenStore);
function progress(message) { adminActivity.push(require('../../src/champagne-diagnostic').clean(message,600));if(adminActivity.length>100)adminActivity.shift(); if(win&&!win.isDestroyed()) win.webContents.send('admin-progress',message); }
function guard(event) { if(!win || event.sender!==win.webContents || event.senderFrame!==win.webContents.mainFrame) throw new Error('Solicitud no autorizada.'); }
function handle(name,action) {ipcMain.handle(name,async(event,...args)=>{
  guard(event); if(busy) return {ok:false,error:'Espera a que termine la operación actual.'};
  busy=true; try{if(name==='admin-prepare'&&plan?.unresolved?.length)throw Error('Faltan fuentes oficiales exactas de '+plan.unresolved.length+' mods. Vuelve a analizar después de resolverlas.');if(!publicActions.has(name)){if(!['admin-packs','admin-select-pack','admin-create-pack','admin-token-status'].includes(name))await (localActions.has(name)?adminCatalogAccess.authorizeLocal():adminAuth.verifiedUsername());if(!activePack&&!name.startsWith('admin-wizard-')&&!['admin-packs','admin-select-pack','admin-create-pack','admin-token-status','admin-token-save','admin-token-clear'].includes(name))throw Error('Selecciona un modpack antes de continuar.');}return {ok:true,...await action(...args)};}catch(error){problemReporter.capture(error,{operation:name,log:adminActivity.join('\n')});return{ok:false,error:error.message,retryAfter:error.retryAfter||0,...(error.fields?{fields:error.fields}:{})};}finally{busy=false;}
});}

function completeDraft(input){const v=wizardModel.validate(input,{complete:true});if(!v.valid)throw Object.assign(Error('Revisa los campos del lanzador.'),{fields:v.errors});return v.value;}
function inspectDraft(source){try{const current=engineModule.scan(source),parts=current.mc.split('.').map(Number),javaMajor=parts[1]>20||parts[1]===20&&(parts[2]||0)>=5?21:17;require('../../src/champagne-game-profile').validateGame({serverId:'draft-preview',loader:'forge',packName:'Borrador',minecraftVersion:current.mc,forgeVersion:current.forge,javaMajor,forgeInstallerSha1:'0'.repeat(40)}, {}, '99.0.0');return {current,game:{minecraftVersion:current.mc,forgeVersion:current.forge,javaMajor,loader:'forge'}};}catch(error){throw Object.assign(Error(error.message),{fields:{source:error.message}});}}

function communityInput(input){if(input?.packId!==activePack.id)throw Error('El lanzador cambió. Recarga sus ajustes de Discord.');const candidate={...activePack,guildId:input.guildId,roleId:input.roleId,announcements:community.announcements(input.announcements)};return validateCatalog({schemaVersion:1,packs:[candidate]}).packs[0];}
handle('admin-community-load',async()=>({packId:activePack.id,guildId:community.guildForPack(activePack),roleId:activePack.roleId,announcements:community.announcements(activePack.announcements)}));
handle('admin-community-check',async input=>{const candidate=communityInput(input);return adminAuth.validateCommunity({guildId:community.guildForPack(candidate),roleId:candidate.roleId,announcements:candidate.announcements});});
handle('admin-community-save',async input=>{
 const candidate=communityInput(input);await adminAuth.validateCommunity({guildId:community.guildForPack(candidate),roleId:candidate.roleId,announcements:candidate.announcements});
 const answer=await confirmPublication(win,{type:'question',title:'Guardar Discord del lanzador',message:'¿Guardar servidor, rol y anuncios de '+candidate.name+'?',detail:'El rol determina quién puede ver, descargar y jugar. Se conservan mods, mundos, archivos y versión. La preparación abierta deberá analizarse de nuevo.',buttons:['Cancelar','Guardar ajustes'],defaultId:0,cancelId:0,noLink:true});if(answer.response!==1)return{cancelled:true};
 const candidateEngine=engineModule.createEngine(candidate),candidatePlan=await candidateEngine.presentationPlan(progress);
 if(candidatePlan.base.unpublished){const draft=draftStore.read(candidate.id);if(!draft)throw Error('Falta el borrador de este lanzador.');draftStore.write(candidate.id,{...draft,guildId:candidate.guildId,roleId:candidate.roleId,serverMode:candidate.guildId===community.OFFICIAL_GUILD_ID?'official':'external',announcements:candidate.announcements});const local=drafts().map(p=>p.id===candidate.id?candidate:p);fs.writeFileSync(draftFile(),JSON.stringify({schemaVersion:1,packs:local},null,2));activePack=candidate;engine=candidateEngine;plan=prepared=designPlan=null;auditSaved('draft_saved',candidate.name,draft.initialVersion);return{draft:true};}
 const token=await publicationToken();const result=await candidateEngine.publishPresentation(candidatePlan,candidatePlan.design,{token,onProgress:progress,fetcher:officialFetch,authorize:()=>adminAuth.verifiedUsername()});activePack=candidate;engine=candidateEngine;plan=prepared=designPlan=null;await publicationRecorded(result,'presentation');return{result};
});

handle('admin-wizard-load',async()=>{const draft=draftStore.read('session');const image=draftStore.loadImage(draft?.imageHash);return{draft,preview:image?'data:'+image.mime+';base64,'+image.base64:null};});
handle('admin-wizard-save',async input=>({draft:draftStore.write('session',input)}));
handle('admin-wizard-folder',async input=>{const r=await dialog.showOpenDialog(win,{title:'Selecciona tu instancia original de CurseForge',defaultPath:typeof input?.source==='string'?input.source:undefined,properties:['openDirectory']});if(r.canceled)return{cancelled:true};const selected=r.filePaths[0];try{return{source:selected,game:inspectDraft(selected).game};}catch(e){return{source:selected,game:null,compatibilityError:e.message};}});
handle('admin-wizard-inspect',async input=>{const parsed=wizardModel.validate(input),result=inspectDraft(parsed.value.source);return{game:result.game,summary:{mods:result.current.mods.length,content:result.current.content.length}};});
handle('admin-wizard-analyze',async input=>{const value=completeDraft(input),id='pack-'+crypto.randomBytes(8).toString('hex'),context={id,...wizardModel.publishedFields(value),enabled:true,manifestPath:'updates/packs/'+id+'/stable.json'},candidate=engineModule.createEngine(context),p=await candidate.analyze(value.source,progress,officialFetch,files=>adminAuth.curseforgeMatches(files));let verified=false;if(!p.unresolved.length){const selected=p.contentCandidates.filter(e=>e.entry).map(e=>e.path);const manifest=candidate.buildManifest(p,value.initialVersion,selected);await candidate.validatePackage(manifest,progress,officialFetch);await candidate.verifyDirect(manifest,progress,officialFetch);verified=true;}return{game:p.game,verified,unresolved:p.unresolved.length,message:verified?'Fuentes y hashes remotos comprobados. Falta revisar, preparar y probar el juego antes de publicar.':'Hay '+p.unresolved.length+' mods sin fuente exacta. No se podrá publicar hasta resolverlos.'};});
handle('admin-wizard-discord',async input=>{const value=completeDraft(input);try{return await adminAuth.validateCommunity({guildId:value.guildId,roleId:value.roleId,announcements:community.announcements(value.announcements)});}catch(error){if(error.status===404)throw Error('La verificación de comunidades necesita activar la próxima versión del servicio. Puedes guardar el borrador; no publicarlo todavía.');throw error;}});
handle('admin-wizard-image',async()=>{const r=await dialog.showOpenDialog(win,{title:'Imagen inicial del lanzador',properties:['openFile'],filters:[{name:'PNG/JPG',extensions:['png','jpg','jpeg']}]});if(r.canceled)return{cancelled:true};const file=r.filePaths[0],s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.size>16*1024*1024)throw Error('Selecciona una imagen normal de hasta 16 MB.');const image=nativeImage.createFromPath(file);if(image.isEmpty())throw Error('No se pudo leer la imagen.');const optimized=image.getSize().width>1920?image.resize({width:1920}):image,bytes=optimized.toJPEG(88),imageHash=draftStore.image(bytes);return{imageHash,preview:'data:image/jpeg;base64,'+bytes.toString('base64')};});
handle('admin-wizard-create',async input=>{const value=completeDraft(input);inspectDraft(value.source);await loadPacks();if(adminPacks.length>=50)throw Error('Máximo 50 modpacks.');const id='pack-'+crypto.randomBytes(8).toString('hex'),pack={id,...wizardModel.publishedFields(value),enabled:true,manifestPath:'updates/packs/'+id+'/stable.json'};draftStore.write(id,value);const local=drafts();local.push(pack);fs.writeFileSync(draftFile(),JSON.stringify({schemaVersion:1,packs:local},null,2));packSourceStore.save(id,value.source);draftStore.record('created',id,adminAuth.status().user,{outcome:'draft_saved'});resetPack();activePack=pack;engine=engineModule.createEngine(pack);source=value.source;auditSaved('draft_created',pack.name,value.initialVersion);return{selectedId:id,source,packName:pack.name,packs:[...adminPacks,pack],draft:true};});
async function ensureCommunity(){if(activePack?.guildId||activePack?.announcements){await adminAuth.validateCommunity({packId:activePack.id,guildId:community.guildForPack(activePack),roleId:activePack.roleId,announcements:community.announcements(activePack.announcements)});}}
let eventSync=null;
const syncPendingEvents=require('./pending-events.cjs').createPendingEventSync({store:draftStore,account:adminAuth,onPending:count=>progress('Quedan '+count+' registros pendientes. Los demás se sincronizaron; se reintentará automáticamente.')});
function auditSaved(action,name,version){try{const user=adminAuth.status().user;draftStore.enqueue({type:'audit',packId:activePack.id,actorId:user?.discordId||user?.id?.replace(/^discord:/,''),action,name,version});syncPendingEvents().catch(()=>{});}catch{progress('Registro central pendiente; revisa la cola local antes de otra publicación.');}}
async function publicationRecorded(result,kind='modpack'){draftStore.record('published',activePack.id,adminAuth.status().user,result);const user=adminAuth.status().user;draftStore.enqueue({type:'publication',packId:activePack.id,actorId:user?.discordId||user?.id?.replace(/^discord:/,''),commit:result.commit,kind});await syncPendingEvents();const pending=draftStore.pending().some(e=>e.type==='publication'&&e.commit===result.commit);if(pending)progress('Publicación confirmada. Anuncio y registro central guardados para sincronizar después.');return pending;}

handle('admin-token-status',()=>publicationConnection.status());
handle('admin-token-save',async token=>tokenStore.save(token));
handle('admin-token-clear',async()=>tokenStore.clear());
handle('admin-info',async()=>{
  source=activePack?packSourceStore.load(activePack.id):'';
  return {source,repository:engine.REPO,branch:engine.BRANCH,packName:activePack?.name||'modpack',appVersion:app.isPackaged?app.getVersion():require('./version.json').version,updateState:adminUpdates.getState()};
});
handle('admin-folder',async()=>{
  const choice=await dialog.showOpenDialog(win,{title:'Selecciona tu instancia de CurseForge',defaultPath:source||undefined,properties:['openDirectory']});
  if(!choice.canceled){source=packSourceStore.save(activePack.id,choice.filePaths[0]);plan=prepared=designPlan=null;background=null;output=null;}return{source};
});
handle('admin-source-save',async input=>{if(input?.packId!==activePack?.id)throw Error('El lanzador cambió. Vuelve a elegir su carpeta.');source=packSourceStore.save(activePack.id,input.source);plan=prepared=designPlan=null;background=null;output=null;return{source};});
handle('admin-analyze',async input=>{
  if(input?.source!==undefined){if(input.packId!==activePack.id)throw Error('El lanzador cambió.');source=packSourceStore.save(activePack.id,input.source);}
  plan=prepared=null;output=null;
  plan=await engine.analyze(source,progress,officialFetch,files=>adminAuth.curseforgeMatches(files));const draft=draftStore.read(activePack.id);if(plan.base.unpublished&&draft){plan.suggestedVersion=draft.initialVersion;plan.design={...plan.design,packName:draft.name,background:draftStore.loadImage(draft.imageHash),...(draft.notes?{notes:{title:'Primera versión',text:draft.notes}}:{})};}if(plan.base.unpublished){const saved=draftStore.loadDesign(activePack.id);if(saved)plan.design={...plan.design,...saved};}background=plan.design.background;return {report:engine.report(plan)};
});
handle('admin-design',async()=>{prepared=null;output=null;plan=await engine.presentationPlan(progress);const draft=draftStore.read(activePack.id);if(plan.base.unpublished&&draft)plan.design={...plan.design,packName:draft.name,background:draftStore.loadImage(draft.imageHash),...draftStore.loadDesign(activePack.id)};designPlan=plan;background=plan.design.background;return{report:{...engine.report(plan),draft:!!plan.base.unpublished}};});
handle('admin-history',async()=>({history:await engine.history()}));
handle('admin-restore',async version=>{prepared=null;output=null;plan=await engine.restore(version,progress);background=plan.design.background;return{report:engine.report(plan)};});
handle('admin-delete-pack',async()=>{
 if(!activePack)throw Error('Selecciona un lanzador.');const target={...activePack};const answer=await confirmPublication(win,{title:'Eliminar lanzador definitivamente',message:'¿Eliminar definitivamente '+target.name+'?',detail:'Se borrará del catálogo, su canal publicado y su historial de archivos. Los Launchers actualizados eliminarán sus instalaciones, mods, configuraciones, capturas y mundos al conectarse, esperando a que Minecraft se cierre. No se puede deshacer desde VillaWolf. La carpeta original de CurseForge se conserva. GitHub conserva los commits históricos y las copias externas no se pueden borrar desde esta aplicación.',buttons:['Cancelar','Eliminar definitivamente']});if(answer.response!==1)return{cancelled:true};
 let result={deleted:true,packId:target.id};const entry=adminPacks.find(p=>p.id===target.id);if(entry?.published){progress('Eliminando el lanzador y notificando a los jugadores…');result=await adminAuth.deletePublishedPack({packId:target.id,confirmName:target.name});}
 const local=drafts().filter(p=>p.id!==target.id);fs.writeFileSync(draftFile(),JSON.stringify({schemaVersion:1,packs:local},null,2));packSourceStore.forget(target.id);require('./pack-cleanup.cjs').cleanPreparedPack(adminRoot,target.id);resetPack();activePack=null;engine=engineModule;adminPacks=adminPacks.filter(p=>p.id!==target.id);return{packs:adminPacks,selectedId:null,result};
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
  await engine.validatePackage(manifest,progress,officialFetch);
  const out=path.join(adminRoot,'preparados',activePack.id,version+'-'+crypto.randomUUID());
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'modpack-'+version+'.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(path.join(out,'revision.json'),JSON.stringify({version,game:manifest.game,presentation:{news:manifest.presentation?.news||null,updates:manifest.presentation?.updates||null,notes:manifest.presentation?.notes||null,background:manifest.presentation?.background?{mime:manifest.presentation.background.mime,sha256:manifest.presentation.background.sha256}:null},restoredFrom:manifest.restoredFrom||null,mods:manifest.files.length,content:manifest.content.files.map(e=>e.path),changes:plan.modChanges,excluded:plan.current.excluded,baseCommit:plan.base.head},null,2)+'\n',{flag:'wx'});
  prepared=manifest; output=out;
  return {review:{version,packName:manifest.game.packName,minecraft:manifest.game.minecraftVersion,forge:manifest.game.forgeVersion,mods:manifest.files.length,changes:plan.modChanges,contentChanges:{added:manifest.content.files.filter(e=>!plan.base.manifest.content.files.some(p=>p.path===e.path)).map(e=>e.path),changed:manifest.content.files.filter(e=>plan.base.manifest.content.files.some(p=>p.path===e.path&&p.sha256!==e.sha256)).map(e=>e.path),removed:plan.base.manifest.content.files.filter(e=>!manifest.content.files.some(p=>p.path===e.path)).map(e=>e.path)},content:manifest.content.files.length,news:manifest.presentation?.news,updates:manifest.presentation?.updates,backgroundChanged:manifest.presentation?.background?.sha256!==plan.base.manifest.presentation?.background?.sha256},output:out,version,content:manifest.content.files.length,removedContent:plan.base.manifest.content.files.filter(e=>!selected.includes(e.path)).map(e=>e.path)};
});
handle('admin-publish-design',async({packName,news,updates})=>{
  if(!designPlan)throw Error('Primero carga el diseño publicado.');
  const design={packName,news,updates,background};if(designPlan.base.unpublished){draftStore.saveDesign(activePack.id,design);const draft=draftStore.read(activePack.id);draftStore.write(activePack.id,{...draft,name:packName});draftStore.record('draft_design_saved',activePack.id,adminAuth.status().user);auditSaved('draft_saved',packName,draft.initialVersion);designPlan=null;return{result:{draft:true}};}engine.buildPresentationManifest(designPlan,design);
  const token=await publicationToken();
  const answer=await confirmPublication(win,{type:'question',title:'Publicar cambios de interfaz',message:'¿Publicar el diseño de '+packName+'?',detail:'Cambiará únicamente el nombre, el fondo y las tarjetas de noticias y actualizaciones. Se conservan la versión, Minecraft, Forge, mods y configuraciones.',buttons:['Cancelar','Publicar cambios'],defaultId:0,cancelId:0,noLink:true});
  if(answer.response!==1)return{cancelled:true};
  await ensureCommunity();const result=await engine.publishPresentation(designPlan,design,{token,onProgress:progress,fetcher:officialFetch,authorize:()=>adminAuth.verifiedUsername()});const announcementPending=await publicationRecorded(result,'presentation');designPlan=null;return{result,announcementPending};
});
handle('admin-output',async()=>{if(!output)throw new Error('No hay paquete preparado.');await shell.openPath(output);return{};});
handle('admin-publish',async({token,tested,reviewed})=>{
  token=await publicationConnection.token(token);
  if(!prepared||!plan)throw new Error('Prepara la actualización antes de publicarla.');
  if(!tested||!reviewed)throw new Error('Confirma las pruebas y la revisión del contenido.');
  const answer=await confirmPublication(win,{type:'warning',title:'Publicar actualización del modpack',
    message:'¿Activar '+prepared.game.packName+' '+prepared.version+' para los jugadores?',
    detail:`Se actualizará ${engine.locations?.channel||'updates/stable-v2.json'} en ${engine.REPO}, rama ${engine.BRANCH}. Contiene ${prepared.files.length} mods y ${prepared.content.files.length} archivos de contenido. Los jugadores la recibirán al pulsar JUGAR. Revisa que los archivos seleccionados puedan publicarse y no contengan datos personales.`,
    buttons:['Cancelar','Verificar y publicar'],defaultId:0,cancelId:0,noLink:true});
  if(answer.response!==1)return{cancelled:true};
  await ensureCommunity();const result=await engine.publish(plan,prepared,{token,tested,reviewed,onProgress:progress,fetcher:officialFetch,authorize:()=>adminAuth.verifiedUsername()});
  fs.writeFileSync(path.join(output,'publicacion.json'),JSON.stringify(result,null,2)+'\n');
  const announcementPending=await publicationRecorded(result);plan=prepared=null;return{result,announcementPending};
});
app.whenReady().then(()=>{
  const eventRetry=setInterval(()=>{if(!busy)syncPendingEvents().catch(()=>{});},120000);eventRetry.unref?.();app.on('quit',()=>clearInterval(eventRetry));
  win=new BrowserWindow({width:1120,height:820,minWidth:600,minHeight:560,backgroundColor:'#0c1018',title:'VillaWolf — Administrador del modpack',
    icon:path.join(__dirname,'assets/villawolf-admin-transparent.ico'),autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.once('did-finish-load',()=>adminUpdates.check());
  win.on('close',event=>{if(busy){event.preventDefault();progress('Espera a que termine la operación antes de cerrar.');}});
});
app.on('window-all-closed',()=>app.quit());
