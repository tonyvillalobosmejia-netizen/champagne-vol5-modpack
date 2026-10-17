'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createVerificationReceipts,createVerifiedContentCache}=require('../tools/admin-modpack/verified-content-cache.cjs');
const {reliableRequest}=require('../tools/admin-modpack/reliable-request.cjs');
const engine=require('../tools/admin-modpack/engine.cjs');
const bytes=Buffer.from('JAR simulado correcto'),wrong=Buffer.from('JAR distinto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const entry={path:'mods/prueba.jar',url:'https://edge.forgecdn.net/files/1234/567/prueba.jar',sha256:hash(bytes)};

for(const successAt of [1,2,3])test('aprueba en el intento '+successAt+' y reutiliza sólo el comprobante aprobado',async()=>{
 let calls=0;const waits=[],retries=[],verify=createVerificationReceipts({sleep:async ms=>waits.push(ms)});
 const download=async()=>++calls<successAt?wrong:bytes;
 assert.equal(await verify(entry,download,info=>retries.push(info)),false);
 assert.equal(calls,successAt);assert.equal(await verify(entry,download),true);assert.equal(calls,successAt);
 assert.deepEqual(waits,[400,800].slice(0,successAt-1));assert.equal(retries.length,successAt-1);
});

test('tres hashes incorrectos conservan el esperado, dan diagnóstico y no crean comprobante',async()=>{
 let calls=0;const verify=createVerificationReceipts({sleep:async()=>{}}),original=structuredClone(entry);
 await assert.rejects(verify(entry,async()=>{calls++;return wrong;}),error=>{
  assert.equal(error.code,'ERR_DOWNLOAD_INTEGRITY');assert.equal(error.attempts,3);
  assert.equal(error.expectedSha256,entry.sha256);assert.equal(error.receivedSha256,hash(wrong));assert.equal(error.receivedBytes,wrong.length);
  for(const value of ['prueba.jar','Intentos realizados: 3',entry.sha256,hash(wrong),wrong.length+' bytes','Publicación detenida'])assert.ok(error.message.includes(value));
  assert.ok(!error.message.includes(entry.url));assert.ok(!Object.values(error).some(v=>Buffer.isBuffer(v)));
  return true;
 });
 assert.equal(calls,3);assert.deepEqual(entry,original);
 assert.equal(await verify(entry,async()=>{calls++;return bytes;}),false);assert.equal(calls,4);
});

test('caché de contenido rechaza bytes fallidos, libera pendientes y protege sus buffers',async()=>{
 const cache=createVerifiedContentCache({sleep:async()=>{}}),content={...entry,bytes:bytes.length};let calls=0;
 await assert.rejects(cache(content,async()=>{calls++;return wrong;}),/Intentos realizados: 3/);assert.equal(calls,3);
 const first=await cache(content,async()=>{calls++;return bytes;});first[0]=0;
 assert.deepEqual(await cache(content,async()=>{throw Error('No debe descargar');}),bytes);assert.equal(calls,4);
 const invalidSize={...content,bytes:bytes.length+1};let sizeCalls=0;
 await assert.rejects(cache(invalidSize,async()=>{sizeCalls++;return bytes;}),/tamaño incorrecto/);assert.equal(sizeCalls,1);
});

test('tamaño no aprobado no crea comprobante de mod',async()=>{
 const verify=createVerificationReceipts({sleep:async()=>{}});let calls=0;
 const input={...entry,bytes:bytes.length+1};
 for(let i=0;i<2;i++)await assert.rejects(verify(input,async()=>{calls++;return bytes;}),/tamaño incorrecto/);
 assert.equal(calls,2);
});

test('HTTP e integridad comparten tres intentos, con bloqueos de autorización sin reintento',async()=>{
 for(const sequence of [[503,'wrong','valid'],['wrong',503,'valid'],[503,503,503]]){
  let calls=0;const verify=createVerificationReceipts({sleep:async()=>{}});
  const download=async()=>{const next=sequence[calls++];if(typeof next==='number')throw Object.assign(Error('Servicio temporal'),{status:next});return next==='valid'?bytes:wrong;};
  if(sequence.includes('valid'))await verify(entry,download);else await assert.rejects(verify(entry,download),/Servicio temporal/);
  assert.equal(calls,3);
 }
 for(const status of [401,403,404,429]){
  let calls=0;await assert.rejects(createVerificationReceipts({sleep:async()=>{}})(entry,async()=>{calls++;throw Object.assign(Error('No autorizado'),{status});}));assert.equal(calls,1);
 }
 let calls=0;await assert.rejects(reliableRequest(async()=>{calls++;throw Object.assign(Error('Hash incorrecto'),{code:'ERR_DOWNLOAD_INTEGRITY'});},{safe:true,sleep:async()=>{}}));assert.equal(calls,1);
});

test('engine continúa con archivos posteriores y conserva las verificaciones anteriores',async()=>{
 const entries=[0,1,2,3].map(i=>({...entry,path:'mods/prueba'+i+'.jar',url:entry.url.replace('prueba.jar','prueba'+i+'.jar')}));
 const manifest={files:entries,content:{files:[]}},counts=[0,0,0,0],progress=[];
 const fetcher=async url=>{const i=entries.findIndex(e=>e.url===url);assert.notEqual(i,-1);counts[i]++;return new Response(counts[i]<(i===1?2:i===2?3:1)?wrong:bytes);};
 const e=engine.createEngine();await e.verifyDirect(manifest,m=>progress.push(m),fetcher);
 assert.deepEqual(counts,[1,2,3,1]);assert.ok(progress.some(m=>m.includes('intento 3/3')));
 await e.verifyDirect(manifest,()=>{},fetcher);assert.deepEqual(counts,[1,2,3,1]);
});

test('engine no anida reintentos HTTP dentro de integridad',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return calls===1?new Response(null,{status:503}):new Response(wrong);};
 await assert.rejects(engine.createEngine().verifyDirect({files:[entry],content:{files:[]}},()=>{},fetcher),error=>error.code==='ERR_DOWNLOAD_INTEGRITY'&&error.attempts===3);
 assert.equal(calls,3);
});

test('engine detiene los siguientes archivos tras tres discrepancias y conserva los anteriores',async()=>{
 const entries=[0,1,2].map(i=>({...entry,path:'mods/f'+i+'.jar',url:entry.url.replace('prueba.jar','f'+i+'.jar')}));let broken=true;const calls=[0,0,0];
 const fetcher=async url=>{const i=entries.findIndex(e=>e.url===url);calls[i]++;return new Response(i===1&&broken?wrong:bytes);};
 const e=engine.createEngine(),manifest={files:entries,content:{files:[]}};
 await assert.rejects(e.verifyDirect(manifest,()=>{},fetcher),/Intentos realizados: 3/);assert.deepEqual(calls,[1,3,0]);
 broken=false;await e.verifyDirect(manifest,()=>{},fetcher);assert.deepEqual(calls,[1,4,1]);
});

test('fuentes y redirecciones no autorizadas se rechazan sin repetir ni aceptar contenido',async()=>{
 let calls=0;const denied={...entry,url:entry.url+'?token=no-debe-aparecer'};
 await assert.rejects(engine.createEngine().verifyDirect({files:[denied],content:{files:[]}},()=>{},async()=>{calls++;return new Response(bytes);}),/no autorizada/);assert.equal(calls,0);
 await assert.rejects(engine.createEngine().verifyDirect({files:[entry],content:{files:[]}},()=>{},async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://unauthorized.invalid/file.jar'}});}),/no autorizada/);assert.equal(calls,1);
});
