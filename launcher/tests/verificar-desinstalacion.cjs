const {test}=require('node:test'),assert=require('node:assert/strict');
const {uninstallPlan}=require('../src/champagne-uninstall');
const base={roaming:'C:\\Users\\jugador\\AppData\\Roaming',userData:'C:\\Users\\jugador\\AppData\\Roaming\\mi-launcher-forge',gameRoot:'C:\\Users\\jugador\\AppData\\Roaming\\MiLauncher',launcherExe:'C:\\Apps\\VillaWolf\\VillaWolf Launcher.exe',uninstaller:'C:\\Apps\\VillaWolf\\Uninstall VillaWolf Launcher.exe'};
test('desinstalar conserva datos por defecto y borrar requiere una elección booleana explícita',()=>{
 assert.equal(uninstallPlan(base).removeData,false);assert.equal(uninstallPlan({...base,removeData:'true'}).removeData,false);assert.equal(uninstallPlan({...base,removeData:true}).removeData,true);
});
test('desinstalar rechaza carpetas ajenas, rutas raíz y otros ejecutables',()=>{
 for(const changed of [{gameRoot:'C:\\'},{gameRoot:base.roaming+'\\CurseForge'},{userData:base.roaming},{uninstaller:'C:\\Apps\\Otro\\Uninstall VillaWolf Launcher.exe'},{uninstaller:'C:\\Apps\\VillaWolf\\evil.exe'},{launcherExe:'C:\\Apps\\VillaWolf\\otro.exe'},{gameRoot:'relative'}])assert.throws(()=>uninstallPlan({...base,...changed}));
});
