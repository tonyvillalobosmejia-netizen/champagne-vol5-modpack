"use strict";
const path=require('node:path').win32;
function uninstallPlan({roaming,userData,gameRoot,launcherExe,uninstaller,removeData=false}) {
  const absolute=value=>{if(typeof value!=='string'||!path.isAbsolute(value))throw Error('Ruta de desinstalación inválida');return path.normalize(value);};
  const root=absolute(roaming),data=absolute(userData),game=absolute(gameRoot),exe=absolute(launcherExe),uninstall=absolute(uninstaller);
  const equal=(a,b)=>a.toLowerCase()===b.toLowerCase();
  if(!equal(game,path.join(root,'MiLauncher'))||!['mi-launcher-forge','VillaWolf Launcher'].some(name=>equal(data,path.join(root,name))))throw Error('Los datos no están en las carpetas de VillaWolf');
  if(!equal(path.dirname(exe),path.dirname(uninstall))||!equal(path.basename(exe),'VillaWolf Launcher.exe')||!['Uninstall VillaWolf Launcher.exe','Uninstall Mi Launcher.exe'].some(name=>equal(path.basename(uninstall),name)))throw Error('Desinstalador desconocido');
  return {roaming:root,userData:data,gameRoot:game,uninstaller:uninstall,removeData:removeData===true};
}
module.exports={uninstallPlan};
