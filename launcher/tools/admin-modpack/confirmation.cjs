'use strict';
const {BrowserWindow,ipcMain}=require('electron');const path=require('node:path');
function confirmPublication(parent,options){return new Promise((resolve,reject)=>{
 const modal=new BrowserWindow({parent,modal:true,show:false,width:680,height:470,resizable:false,autoHideMenuBar:true,title:options.title,backgroundColor:'#0c1018',icon:path.join(__dirname,'assets/villawolf-admin-transparent.ico'),webPreferences:{preload:path.join(__dirname,'confirmation-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 let settled=false,answer=0;const finish=value=>{if(settled)return;answer=value?1:0;modal.close();};
 const guard=event=>{if(event.sender!==modal.webContents||event.senderFrame!==modal.webContents.mainFrame)throw Error('Solicitud no autorizada.');};
 ipcMain.handle('admin-confirmation-data',event=>{guard(event);return{title:options.title,message:options.message,detail:options.detail,accept:options.buttons[1]};});
 ipcMain.handle('admin-confirmation-answer',(event,value)=>{guard(event);finish(value===true);});
 modal.webContents.setWindowOpenHandler(()=>({action:'deny'}));modal.webContents.on('will-navigate',event=>event.preventDefault());
 modal.once('ready-to-show',()=>modal.show());modal.once('closed',()=>{ipcMain.removeHandler('admin-confirmation-data');ipcMain.removeHandler('admin-confirmation-answer');if(!settled){settled=true;resolve({response:answer});}});
 modal.loadFile(path.join(__dirname,'confirmation.html')).catch(error=>{if(!settled){settled=true;reject(error);}modal.close();});
});}
module.exports={confirmPublication};
