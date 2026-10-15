'use strict';
const {app,BrowserWindow,ipcMain,safeStorage,Tray,Menu,clipboard,shell}=require('electron'),path=require('node:path'),crypto=require('node:crypto');
const endpoint='https://villawolf-auth.tony-villalobos-mejia-973.workers.dev';
app.setName('VillaWolf Bot');app.setAppUserModelId('com.villawolf.rolesbot');app.setPath('userData',path.join(app.getPath('appData'),'VillaWolf Bot'));
if(!app.requestSingleInstanceLock()){app.quit();}else{
 const botVersion=require('./package.json').version;const updates=require('./updates.cjs').createBotUpdates({version:botVersion,openBrowser:url=>shell.openExternal(url)});
 let access,win,tray,bot,status='Configuración pendiente',store,credentials,stopping=false;
 const publicState=()=>({version:botVersion,authorized:!!access?.user(),account:access?.user()?.username||null,tokenSaved:!!credentials?.token,endpoint,status,running:!!bot});
 function notify(message){status=message;require('node:fs').writeFileSync(path.join(app.getPath('userData'),'status.json'),JSON.stringify(publicState()));if(win&&!win.isDestroyed())win.webContents.send('bot-state',publicState());}
 function start(){if(!access?.user())throw Error('Acceso de administrador no verificado.');if(bot||!credentials?.token)return;bot=require('./bridge.cjs').startRoleBot({token:credentials.token,key:credentials.syncKey,endpoint,guildIds:['1007732653035880589'],syncAllGuilds:true,notificationsEnabled:true,onStatus:notify});notify('Conectando con Discord y VillaWolf…');}
 function guard(event){if(event.sender!==win?.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Solicitud no permitida.');}
 ipcMain.handle('bot-login',async e=>{guard(e);try{await access.login();notify('Acceso autorizado.');return publicState();}catch(error){return{...publicState(),message:error.message};}});
 ipcMain.handle('bot-logout',async e=>{guard(e);if(bot){await bot.stop();bot=null;}await access.logout();notify('Sesión cerrada.');return publicState();});
 ipcMain.handle('bot-update-check',e=>{guard(e);return updates.check();});
 ipcMain.handle('bot-update-download',e=>{guard(e);return updates.download();});
 ipcMain.handle('bot-status',e=>{guard(e);return publicState();});
 ipcMain.handle('bot-save',async(e,token)=>{guard(e);try{await access.verify();}catch(error){return{ok:false,message:error.message};}if(typeof token!=='string'||!/[A-Za-z0-9_]/.test(token)||!/^[-A-Za-z0-9_.]{40,300}$/.test(token))return{ok:false,message:'Introduce la clave del bot de Discord. No la envíes al chat.'};try{if(bot){await bot.stop();bot=null;}credentials={...credentials,token};store.save(credentials);start();return{ok:true,...publicState()};}catch{return{ok:false,message:'Windows no pudo proteger la configuración.'};}});
 ipcMain.handle('bot-copy-link-key',async e=>{guard(e);await access.verify();clipboard.writeText(credentials.syncKey);return{ok:true,message:'Clave de conexión copiada. Pégala sólo en ROLE_BOT_KEY de Cloudflare.'};});
 ipcMain.handle('bot-start',async e=>{guard(e);await access.verify();start();return publicState();});
 ipcMain.handle('bot-stop',async e=>{guard(e);if(bot){await bot.stop();bot=null;}notify('Bot detenido. VillaWolf usará la comprobación directa con Discord.');return publicState();});
 app.whenReady().then(()=>{store=require('../../src/champagne-session-store').createSessionStore({directory:app.getPath('userData'),safeStorage,scope:'villawolf-roles-bot|'+endpoint,filename:'bot-credentials.bin'});credentials=store.load();if(!credentials){credentials={syncKey:crypto.randomBytes(32).toString('hex'),token:null};store.save(credentials);}
  access=require('./access.cjs').createAccess(require('../../src/champagne-auth').createAuthClient({baseUrl:endpoint,provider:'discord',required:true,purpose:'admin',openBrowser:url=>shell.openExternal(url),sessionStore:require('../../src/champagne-session-store').createSessionStore({directory:app.getPath('userData'),safeStorage,scope:'bot-admin|'+endpoint,filename:'discord-bot-session.bin'})}));
  win=new BrowserWindow({width:660,height:610,minWidth:560,minHeight:520,title:'VillaWolf · Bot de roles',backgroundColor:'#0c1018',autoHideMenuBar:true,icon:path.resolve(__dirname,'../../tools/admin-modpack/assets/villawolf-admin-transparent.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile(path.join(__dirname,'index.html'));
  tray=new Tray(path.resolve(__dirname,'../../tools/admin-modpack/assets/villawolf-admin-transparent.ico'));tray.setToolTip('VillaWolf · Bot de roles');tray.setContextMenu(Menu.buildFromTemplate([{label:'Abrir VillaWolf Bot',click:()=>win.show()},{label:'Detener y salir',click:async()=>{stopping=true;if(bot)await bot.stop();app.quit();}}]));tray.on('double-click',()=>win.show());
  win.on('close',e=>{if(!stopping){e.preventDefault();win.hide();}});notify('Inicia sesión con Discord para administrar el bot.');access.verify().then(()=>{notify('Acceso autorizado.');start();}).catch(()=>{});
 });
 app.on('second-instance',()=>{win?.show();win?.focus();});app.on('window-all-closed',()=>{});
}
