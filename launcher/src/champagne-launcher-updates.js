"use strict";
function createLauncherUpdates({ app, feed, loadUpdater, isBusy, status, onState = () => {}, progress = () => {}, setIntervalFn = setInterval, clearIntervalFn = clearInterval }) {
  let updater, checking = null, timer, polling, ready = false, applying = false, requiredVersion = null;
  let state = { phase:'idle', message:'Las actualizaciones del launcher se comprueban al abrirlo.' };
  function change(phase,message,extra={}) { state={phase,message,...(requiredVersion?{requiredVersion}:{}),...extra}; status(message,'info'); onState({...state}); }
  function installWhenIdle() {
    if (!ready || applying || isBusy()) return false;
    applying = true;
    change('restarting','Instalando la actualización del launcher. Se volverá a abrir automáticamente.');
    try { updater.quitAndInstall(true,true); return true; }
    catch(error) { applying=false; ready=false; change('error','No se pudo instalar el launcher: '+error.message); return false; }
  }
  function init() {
    if (updater) return true;
    if (!app.isPackaged) { state={phase:'development',message:'El programa se actualiza automáticamente en la versión instalada.'}; return false; }
    updater=loadUpdater();
    updater.autoDownload=true; updater.autoInstallOnAppQuit=false; updater.allowDowngrade=false;
    updater.disableDifferentialDownload=true;
    updater.setFeedURL({provider:'generic',url:feed});
    updater.on('checking-for-update',()=>change('checking','Buscando actualizaciones del launcher…'));
    updater.on('update-not-available',info=>{if(requiredVersion&&!require('./champagne-game-profile').atLeast(app.getVersion(),requiredVersion))change('blocked','La versión que necesita este modpack todavía no está disponible. Puedes volver a buscarla en unos momentos.',{version:info.version});else change('current','Launcher actualizado ('+info.version+').',{version:info.version});});
    updater.on('update-available',info=>change('downloading','Descargando launcher '+info.version+'…',{version:info.version}));
    updater.on('download-progress',info=>{state={...state,phase:'downloading',percent:Number.isFinite(info.percent)?Math.min(100,Math.max(0,info.percent)):null,bytes:info.transferred,totalBytes:info.total};onState({...state});progress({phase:'launcher-download',label:'Actualizando VillaWolf',bytes:info.transferred,totalBytes:info.total,bytesPerSecond:info.bytesPerSecond});});
    updater.on('update-downloaded',info=>{ready=true;change('waiting','Launcher '+info.version+' listo. Se instalará cuando el juego y las descargas terminen.',{version:info.version});});
    updater.on('error',error=>{ready=false;applying=false;change('error','No se pudo actualizar el launcher: '+error.message);});
    timer=setIntervalFn(installWhenIdle,5000);timer?.unref?.();
    polling=setIntervalFn(()=>{if(!isBusy()&&!ready)check();},30*60*1000);polling?.unref?.();
    app.on('before-quit',event=>{if(ready&&!applying&&!isBusy()){event.preventDefault();installWhenIdle();}});
    app.on('quit',()=>{clearIntervalFn(timer);clearIntervalFn(polling);});
    return true;
  }
  async function check() {
    try {
      if (!init()) return {ok:true,...state};
      if (checking) return checking;
      if (ready || state.phase==='downloading') return {ok:true,...state};
      checking=Promise.resolve().then(()=>updater.checkForUpdates()).then(()=>({ok:true,...state})).catch(error=>{
        change('error','No se pudo comprobar el launcher: '+error.message);return {ok:false,...state};
      }).finally(()=>{checking=null;});
      return checking;
    } catch(error) { change('error','No se pudo comprobar el launcher: '+error.message); return {ok:false,...state}; }
  }
  async function requireVersion(version){requiredVersion=version;const result=await check();if(state.phase==='development')change('blocked','Este modpack necesita VillaWolf '+version+'. Prueba la actualización desde la aplicación instalada.');return {...result,...state};}
  return {check, requireVersion, getState:()=>({...state}), installWhenIdle, get ready(){return ready;}};
}
module.exports={createLauncherUpdates};
