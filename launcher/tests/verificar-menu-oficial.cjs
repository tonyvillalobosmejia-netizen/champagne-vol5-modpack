'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {syncBundledConfigs}=require('../src/champagne-config-sync');
const layout='config/fancymenu/customization/title_screen_layout.txt';
const asset='config/fancymenu/assets/recursos_mundo_conejil/fondo.png';
function fixture(t,packId='champagne-vol5') {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-menu-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const dirs={instanceDir:path.join(root,'instance'),metadataDir:path.join(root,'metadata'),bundleDir:path.join(root,'bundle')};
  const files=[[layout,'is_enabled = true'],[asset,'official image'],['config/fancymenu/customization/personal.txt','official default'],['config/fancymenu/options.txt','preferences default']];
  const write=(base,name,bytes)=>{const file=path.join(base,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
  for(const [name,bytes] of files)write(path.join(dirs.bundleDir,'files'),name,bytes);
  const manifest={packId,version:'0.1.15',files:files.map(([name,bytes])=>({path:name,bytes:Buffer.byteLength(bytes),sha256:crypto.createHash('sha256').update(bytes).digest('hex')}))};
  fs.writeFileSync(path.join(dirs.bundleDir,'manifest.json'),JSON.stringify(manifest));
  return {dirs,manifest,write:(name,bytes)=>write(dirs.instanceDir,name,bytes),read:name=>fs.readFileSync(path.join(dirs.instanceDir,name),'utf8'),run:()=>syncBundledConfigs(dirs)};
}
test('restaura menú y recursos modificados con respaldo recuperable; conserva preferencias y mundos',t=>{
  const f=fixture(t);f.run();
  f.write(layout,'is_enabled = false');f.write(asset,'modified image');f.write('config/fancymenu/options.txt','my editor settings');f.write('config/fancymenu/customization/personal.txt','my custom layout');f.write('saves/world/level.dat','my world');f.write('options.txt','my game settings');
  const r=f.run();assert.equal(r.menuRestored,2);assert.equal(r.keptModified,2);
  assert.equal(f.read(layout),'is_enabled = true');assert.equal(f.read(asset),'official image');
  const recovery=JSON.parse(fs.readFileSync(path.join(r.backupDir,'recovery.json')));
  const saved=recovery.files.find(e=>e.path===layout);
  assert.equal(fs.readFileSync(path.join(r.backupDir,saved.backup),'utf8'),'is_enabled = false');
  assert.equal(f.read('config/fancymenu/options.txt'),'my editor settings');assert.equal(f.read('config/fancymenu/customization/personal.txt'),'my custom layout');assert.equal(f.read('saves/world/level.dat'),'my world');assert.equal(f.read('options.txt'),'my game settings');
  assert.equal(f.run().menuRestored,0);assert.equal(f.run().backupDir,null);
});
test('instalaciones antiguas sin historial reciben el menú oficial con respaldo',t=>{
  const f=fixture(t);f.write(layout,'old unmanaged disabled menu');const r=f.run();assert.equal(r.menuRestored,1);assert.equal(f.read(layout),'is_enabled = true');assert.ok(r.backupDir);
});
test('no impone el menú de Mundo Conejil sobre otros modpacks',t=>{
  const f=fixture(t,'otro-pack');f.run();f.write(layout,'is_enabled = false');assert.equal(f.run().keptModified,1);assert.equal(f.read(layout),'is_enabled = false');
});
test('contenido corrupto bloquea el reemplazo y no registra éxito',t=>{
  const f=fixture(t);f.run();f.write(layout,'is_enabled = false');fs.writeFileSync(path.join(f.dirs.bundleDir,'files',asset),'bad');assert.throws(f.run,/SHA-256/);assert.equal(f.read(layout),'is_enabled = false');
});
