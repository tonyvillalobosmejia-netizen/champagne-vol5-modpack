'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const crypto = require('node:crypto'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {downloadVerifiedMod} = require('../src/champagne-launcher-integrity');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const good = Buffer.from('mod oficial simulado'), bad = Buffer.from('contenido distinto');
const entry = {path:'mods/prueba.jar', url:'https://edge.forgecdn.net/files/1234/567/prueba.jar', sha256:digest(good)};
for (const successAt of [1,2,3]) test('SHA-256 correcto en intento '+successAt, async () => {
  let calls=0; const waits=[], retries=[];
  const result=await downloadVerifiedMod(entry,async url => {assert.equal(url,entry.url);return ++calls<successAt?bad:good;}, {sleep:async ms=>waits.push(ms),onRetry:info=>retries.push(info)});
  assert.deepEqual(result,good);assert.equal(calls,successAt);
  assert.deepEqual(waits,[400,800].slice(0,successAt-1));assert.equal(retries.length,successAt-1);
});
test('tres fallos bloquean con diagnóstico sin URL ni bytes fallidos', async () => {
  let calls=0;
  await assert.rejects(downloadVerifiedMod(entry,async()=>{calls++;return bad;},{sleep:async()=>{}}),error=>{
    assert.equal(error.attempts,3);assert.equal(error.expectedSha256,entry.sha256);
    assert.equal(error.receivedSha256,digest(bad));assert.equal(error.receivedBytes,bad.length);
    assert.match(error.message,/No se instaló nada/);assert.ok(!error.message.includes(entry.url));
    assert.ok(!Object.values(error).some(Buffer.isBuffer));return true;
  });assert.equal(calls,3);
});
test('permisos, URL y redirecciones rechazadas no se reintentan', async () => {
  for(const original of [Object.assign(Error('No autorizado'),{status:403}),Error('Redirección no autorizada'),Error('Descarga interrumpida')]){
    let calls=0;await assert.rejects(downloadVerifiedMod(entry,async()=>{calls++;throw original;}),e=>e===original);assert.equal(calls,1);
  }
  let calls=0;
  for(const input of [{...entry,url:'http://example.com/mod.jar'},{...entry,path:'../mundo.jar'},{...entry,sha256:'incorrecto'}])
    await assert.rejects(downloadVerifiedMod(input,async()=>{calls++;return good;}));
  assert.equal(calls,0);
});
test('cada archivo tiene su presupuesto y un archivo posterior continúa',async()=>{
  const calls=new Map();
  for(const name of ['primero','segundo','tercero']) {
    const current={...entry,path:`mods/${name}.jar`,url:entry.url.replace('prueba.jar',name+'.jar')};
    assert.deepEqual(await downloadVerifiedMod(current,async()=>{const count=(calls.get(name)||0)+1;calls.set(name,count);return name==='tercero'||count===2?good:bad;},{sleep:async()=>{}}),good);
  }
  assert.deepEqual([...calls.values()],[2,2,1]);
});
const main=fs.readFileSync(path.join(__dirname,'../src/main.js'),'utf8');
test('bucle real mantiene staging y no vuelve a descargar aprobados del mismo intento',async()=>{
  const start=main.indexOf('    for (let i = 0; i < pending.length; i++) {',main.indexOf('stagingRoot = fs.mkdtempSync'));
  const end=main.indexOf('    if (minecraftProcess)',start);
  const writes=[],calls=new Map(),pending=['primero','segundo'].map(name=>({...entry,path:`mods/${name}.jar`,url:entry.url.replace('prueba.jar',name+'.jar'),hash:entry.sha256}));
  const context={pending,stagingRoot:'stage',path,fs:{writeFileSync:(target,bytes)=>writes.push({target,bytes})},sendStatus:()=>{},validateAcquisition:require('../src/champagne-manual-downloads').validateAcquisition,manual:{read:()=>{throw Error('No manual');}},sha256:digest,
    requestBuffer:async url=>{calls.set(url,(calls.get(url)||0)+1);return url.includes('segundo')?bad:good;},
    require:()=>({downloadVerifiedMod:(e,d,o)=>downloadVerifiedMod(e,d,{...o,sleep:async()=>{}})})};
  await assert.rejects(vm.runInNewContext('(async()=>{'+main.slice(start,end)+'})()',context),/Intentos realizados: 3/);
  assert.deepEqual([...calls.values()],[1,3]);assert.equal(writes.length,1);assert.equal(writes[0].target,path.join('stage','0.jar'));assert.deepEqual(writes[0].bytes,good);
  assert.equal(pending[1].staged,undefined);
});
test('presentación sin pack seleccionado no consulta manifiesto ni produce error',async()=>{
  const start=main.indexOf("  handleLauncher('refresh-presentation'");
  const end=main.indexOf('\n  handleLauncher(',start+10);
  let handler; const context={config:{catalogEnabled:true},selectedPack:null,handleLauncher:(_name,fn)=>handler=fn};
  vm.runInNewContext(main.slice(start,end),context);
  const result=await handler();assert.equal(result.ok,true);assert.equal(result.skipped,true);assert.equal(result.reason,'no-pack-selected');
});
test('con pack seleccionado continúa la validación existente y no oculta sus errores',async()=>{
  const start=main.indexOf("  handleLauncher('refresh-presentation'");const end=main.indexOf('\n  handleLauncher(',start+10);
  let handler,calls=0;vm.runInNewContext(main.slice(start,end),{config:{catalogEnabled:true},selectedPack:{id:'pack'},handleLauncher:(_name,fn)=>handler=fn,assistedManifest:async()=>{calls++;throw Error('No tienes el rol de este modpack.');}});
  const result=await handler();assert.equal(calls,1);assert.equal(result.ok,false);assert.equal(result.message,'No tienes el rol de este modpack.');
});
