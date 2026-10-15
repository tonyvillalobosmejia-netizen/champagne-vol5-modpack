const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('admin',{
  communityLoad:()=>ipcRenderer.invoke('admin-community-load'),communityCheck:input=>ipcRenderer.invoke('admin-community-check',input),communitySave:input=>ipcRenderer.invoke('admin-community-save',input),
  wizardLoad:()=>ipcRenderer.invoke('admin-wizard-load'),wizardSave:input=>ipcRenderer.invoke('admin-wizard-save',input),
  wizardFolder:input=>ipcRenderer.invoke('admin-wizard-folder',input),wizardInspect:input=>ipcRenderer.invoke('admin-wizard-inspect',input),
  wizardAnalyze:input=>ipcRenderer.invoke('admin-wizard-analyze',input),wizardDiscord:input=>ipcRenderer.invoke('admin-wizard-discord',input),
  wizardImage:()=>ipcRenderer.invoke('admin-wizard-image'),wizardCreate:input=>ipcRenderer.invoke('admin-wizard-create',input),
  deletePack:()=>ipcRenderer.invoke('admin-delete-pack'),
  packs:()=>ipcRenderer.invoke('admin-packs'),selectPack:id=>ipcRenderer.invoke('admin-select-pack',id),createPack:input=>ipcRenderer.invoke('admin-create-pack',input),
  authStatus:()=>ipcRenderer.invoke('admin-auth-status'),login:()=>ipcRenderer.invoke('admin-auth-login'),logout:()=>ipcRenderer.invoke('admin-auth-logout'),cancelLogin:()=>ipcRenderer.invoke('admin-auth-cancel'),
  checkUpdates:()=>ipcRenderer.invoke('admin-update-check'),onUpdateState:callback=>ipcRenderer.on('admin-update-state',(_event,state)=>callback(state)),
  tokenStatus:()=>ipcRenderer.invoke('admin-token-status'),saveToken:token=>ipcRenderer.invoke('admin-token-save',token),forgetToken:()=>ipcRenderer.invoke('admin-token-clear'),
  publishDesign:input=>ipcRenderer.invoke('admin-publish-design',input),
  design:()=>ipcRenderer.invoke('admin-design'),info:()=>ipcRenderer.invoke('admin-info'),folder:()=>ipcRenderer.invoke('admin-folder'),saveSource:input=>ipcRenderer.invoke('admin-source-save',input),analyze:input=>ipcRenderer.invoke('admin-analyze',input),
  prepare:input=>ipcRenderer.invoke('admin-prepare',input),publish:input=>ipcRenderer.invoke('admin-publish',input),output:()=>ipcRenderer.invoke('admin-output'),
  history:()=>ipcRenderer.invoke('admin-history'),restore:version=>ipcRenderer.invoke('admin-restore',version),image:()=>ipcRenderer.invoke('admin-image'),clearImage:()=>ipcRenderer.invoke('admin-clear-image'),
  onProgress:callback=>ipcRenderer.on('admin-progress',(_event,message)=>callback(message))
});
