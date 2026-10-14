'use strict';
const {app,BrowserWindow,ipcMain,safeStorage,Tray,Menu,clipboard}=require('electron'),path=require('node:path'),crypto=require('node:crypto');
const endpoint='https://villawolf-auth.tony-villalobos-mejia-973.workers.dev';
app.setName('VillaWolf Bot');app.setAppUserModelId('com.villawolf.rolesbot');app.setPath('userData',path.join(app.getPath('appData'),'VillaWolf Bot'));
if(!app.requestSingleInstanceLock()){app.quit();}else{
 let win,tray,bot,status='Configuración pendiente',store,credentials,stopping=false;
 const publicState=()=>({tokenSaved:!!credentials?.token,endpoint,status,running:!!bot});
 function notify(message){status=message;require('node:fs').writeFileSync(path.join(app.getPath('userData'),'status.json'),JSON.stringify(publicState()));if(win&&!win.isDestroyed())win.webContents.send('bot-state',publicState());}
 function start(){if(bot||!credentials?.token)return;bot=require('./bridge.cjs').startRoleBot({token:credentials.token,key:credentials.syncKey,endpoint,guildIds:['1007732653035880589'],onStatus:notify});notify('Conectando con Discord y VillaWolf…');}
 function guard(event){if(event.sender!==win?.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Solicitud no permitida.');}
 ipcMain.handle('bot-status',e=>{guard(e);return publicState();});
 ipcMain.handle('bot-save',async(e,token)=>{guard(e);if(typeof token!=='string'||!/[A-Za-z0-9_]/.test(token)||!/^[-A-Za-z0-9_.]{40,300}$/.test(token))return{ok:false,message:'Introduce la clave del bot de Discord. No la envíes al chat.'};try{if(bot){await bot.stop();bot=null;}credentials={...credentials,token};store.save(credentials);start();return{ok:true,...publicState()};}catch{return{ok:false,message:'Windows no pudo proteger la configuración.'};}});
 ipcMain.handle('bot-copy-link-key',e=>{guard(e);clipboard.writeText(credentials.syncKey);return{ok:true,message:'Clave de conexión copiada. Pégala sólo en ROLE_BOT_KEY de Cloudflare.'};});
 ipcMain.handle('bot-start',e=>{guard(e);start();return publicState();});
 ipcMain.handle('bot-stop',async e=>{guard(e);if(bot){await bot.stop();bot=null;}notify('Bot detenido. VillaWolf usará la comprobación directa con Discord.');return publicState();});
 app.whenReady().then(()=>{store=require('../../src/champagne-session-store').createSessionStore({directory:app.getPath('userData'),safeStorage,scope:'villawolf-roles-bot|'+endpoint,filename:'bot-credentials.bin'});credentials=store.load();if(!credentials){credentials={syncKey:crypto.randomBytes(32).toString('hex'),token:null};store.save(credentials);}
  win=new BrowserWindow({width:660,height:610,minWidth:560,minHeight:520,title:'VillaWolf · Bot de roles',backgroundColor:'#0c1018',autoHideMenuBar:true,icon:path.resolve(__dirname,'../../tools/admin-modpack/assets/villawolf-admin-transparent.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile(path.join(__dirname,'index.html'));
  tray=new Tray(path.resolve(__dirname,'../../tools/admin-modpack/assets/villawolf-admin-transparent.ico'));tray.setToolTip('VillaWolf · Bot de roles');tray.setContextMenu(Menu.buildFromTemplate([{label:'Abrir VillaWolf Bot',click:()=>win.show()},{label:'Detener y salir',click:async()=>{stopping=true;if(bot)await bot.stop();app.quit();}}]));tray.on('double-click',()=>win.show());
  win.on('close',e=>{if(!stopping){e.preventDefault();win.hide();}});notify(status);start();
 });
 app.on('second-instance',()=>{win?.show();win?.focus();});app.on('window-all-closed',()=>{});
}
