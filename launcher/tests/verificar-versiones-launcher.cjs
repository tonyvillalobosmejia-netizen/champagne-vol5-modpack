const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {validateGame,pathsForGame,atLeast}=require('../src/champagne-game-profile');
const {createLauncherUpdates}=require('../src/champagne-launcher-updates');
const base={serverId:'champagne-vol5',loader:'forge',packName:'Champagne',minecraftVersion:'1.20.1',forgeVersion:'47.4.10',javaMajor:17,forgeInstallerSha1:'a'.repeat(40)};
test('Minecraft, Forge y servidor distintos tienen instancias distintas; se conserva principal',()=>{
 const root='C:/fixture';
 const current=pathsForGame(root,base);
 assert.ok(current.instanceDir.endsWith('principal'));
 const java21=validateGame({...base,serverId:'otro-servidor',minecraftVersion:'1.21.1',forgeVersion:'52.1.0',javaMajor:21,minLauncherVersion:'0.1.4'},base,'0.1.4');
 const target=pathsForGame(root,java21);
 assert.notEqual(current.instanceDir,target.instanceDir);assert.notEqual(current.metadataDir,target.metadataDir);
 assert.notEqual(current.instanceDir,pathsForGame(root,{...base,forgeVersion:'47.4.11'}).instanceDir);
 assert.deepEqual(validateGame(undefined,base,'0.1.4'),base);
});
test('perfil incompatible o con ruta inyectada se bloquea antes de preparar el juego',()=>{
 for(const changed of [{serverId:'../saves'},{minecraftVersion:'1.20.1/../'},{forgeVersion:'47.4.10/evil'},{javaMajor:8},{loader:'neoforge'},{minLauncherVersion:'1.0.0'},{minLauncherVersion:'evil'}]){
  assert.throws(()=>validateGame({...base,...changed},base,'0.1.4'));
 }
 assert.equal(atLeast('0.1.10','0.1.4'),true);assert.equal(atLeast('0.1.4','0.2.0'),false);
});
function updaterFixture(){
 const app=new EventEmitter();app.isPackaged=true;
 const updater=new EventEmitter();let installs=0,checks=0,busy=true;
 updater.setFeedURL=()=>{};updater.checkForUpdates=async()=>{checks++;updater.emit('checking-for-update');};
 updater.quitAndInstall=(silent,reopen)=>{assert.equal(silent,true);assert.equal(reopen,true);installs++;};
 const manager=createLauncherUpdates({app,feed:'https://example.invalid',loadUpdater:()=>updater,isBusy:()=>busy,status:()=>{},setIntervalFn:()=>({unref(){}}),clearIntervalFn:()=>{}});
 return {manager,updater,app,installs:()=>installs,checks:()=>checks,idle:()=>{busy=false;}};
}
test('launcher descarga solo y espera al cierre del juego antes de instalar; nunca degrada',async()=>{
 const f=updaterFixture();await f.manager.check();
 assert.equal(f.updater.autoDownload,true);assert.equal(f.updater.autoInstallOnAppQuit,false);assert.equal(f.updater.allowDowngrade,false);
 f.updater.emit('update-downloaded',{version:'0.1.5'});
 assert.equal(f.manager.ready,true);assert.equal(f.manager.installWhenIdle(),false);assert.equal(f.installs(),0);
 f.idle();assert.equal(f.manager.installWhenIdle(),true);assert.equal(f.installs(),1);
 assert.equal(f.manager.installWhenIdle(),false);assert.equal(f.installs(),1);
});
test('un fallo de descarga no ejecuta el instalador y permite reintentar',async()=>{
 const f=updaterFixture();await f.manager.check();f.updater.emit('error',new Error('SHA-512 incorrecto'));
 assert.equal(f.manager.getState().phase,'error');assert.equal(f.manager.ready,false);f.idle();
 assert.equal(f.manager.installWhenIdle(),false);await f.manager.check();assert.equal(f.checks(),2);assert.equal(f.installs(),0);
});
test('un error del instalador permite reintentar y conserva el launcher abierto',async()=>{
 const f=updaterFixture();await f.manager.check();f.idle();f.updater.emit('update-downloaded',{version:'0.1.5'});
 assert.equal(f.manager.installWhenIdle(),true);
 f.updater.emit('error',new Error('fallo instalador'));
 assert.equal(f.manager.ready,false);assert.equal(f.manager.getState().phase,'error');
 await f.manager.check();assert.equal(f.checks(),2);
});
