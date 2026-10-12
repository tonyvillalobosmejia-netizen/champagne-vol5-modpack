const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('admin',{
  info:()=>ipcRenderer.invoke('admin-info'),folder:()=>ipcRenderer.invoke('admin-folder'),analyze:()=>ipcRenderer.invoke('admin-analyze'),
  prepare:input=>ipcRenderer.invoke('admin-prepare',input),publish:input=>ipcRenderer.invoke('admin-publish',input),output:()=>ipcRenderer.invoke('admin-output'),
  history:()=>ipcRenderer.invoke('admin-history'),restore:version=>ipcRenderer.invoke('admin-restore',version),image:()=>ipcRenderer.invoke('admin-image'),clearImage:()=>ipcRenderer.invoke('admin-clear-image'),
  onProgress:callback=>ipcRenderer.on('admin-progress',(_event,message)=>callback(message))
});
