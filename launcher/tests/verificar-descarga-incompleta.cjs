'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto');
const {downloadThroughService}=require('../src/champagne-curseforge-api');
const {downloadVerifiedMod}=require('../src/champagne-launcher-integrity');
const {createVerificationReceipts}=require('../tools/admin-modpack/verified-content-cache.cjs');
const data=Buffer.from('archivo oficial de prueba'),entry={path:'mods/exacto.jar',url:'https://edge.forgecdn.net/files/1234/567/exacto.jar',sha256:crypto.createHash('sha256').update(data).digest('hex')};
async function server(t,handler){const s=http.createServer(handler);await new Promise(ok=>s.listen(0,'127.0.0.1',ok));t.after(()=>s.close());return()=>downloadThroughService({endpoint:'http://127.0.0.1:'+s.address().port,token:'a'.repeat(43),input:{url:entry.url}});}
test('longitud oficial detecta cuerpo corto con cierre limpio y sin Content-Length',async t=>{
 const download=await server(t,(_req,res)=>{res.writeHead(200,{'X-VillaWolf-File-Length':String(data.length)});res.write(data.subarray(0,3));res.end();});
 await assert.rejects(download(),e=>e.code==='ERR_INCOMPLETE_DOWNLOAD'&&e.receivedBytes===3&&e.expectedBytes===data.length);
});
test('cuerpo vacío o conexión interrumpida no produce un buffer aprobado',async t=>{
 for(const abort of [false,true]){const download=await server(t,(_req,res)=>{res.writeHead(200,{'Content-Length':String(data.length)});if(abort){res.write(data.subarray(0,2));setImmediate(()=>res.destroy());}else res.end();});await assert.rejects(download(),e=>e.code==='ERR_INCOMPLETE_DOWNLOAD');}
 const empty=await server(t,(_req,res)=>{res.writeHead(200);res.end();});await assert.rejects(empty(),e=>e.code==='ERR_INCOMPLETE_DOWNLOAD');
});
test('Launcher y Administrador comparten máximo tres intentos para truncamiento y hash',async t=>{
 for(const kind of ['launcher','admin']){
  let calls=0;const download=await server(t,(_req,res)=>{calls++;res.writeHead(200,{'X-VillaWolf-File-Length':String(data.length)});res.write(calls===1?data.subarray(0,3):calls===2?Buffer.alloc(data.length):data);res.end();});
  if(kind==='launcher')assert.deepEqual(await downloadVerifiedMod(entry,download,{sleep:async()=>{}}),data);
  else {const verify=createVerificationReceipts({sleep:async()=>{}});assert.equal(await verify(entry,download),false);assert.equal(await verify(entry,download),true);}
  assert.equal(calls,3);
 }
});
test('tres transferencias incompletas bloquean y no dejan comprobante válido',async t=>{
 let calls=0;const download=await server(t,(_req,res)=>{calls++;res.writeHead(200,{'X-VillaWolf-File-Length':String(data.length)});res.write('x');res.end();});
 await assert.rejects(downloadVerifiedMod(entry,download,{sleep:async()=>{}}),e=>e.code==='ERR_INCOMPLETE_DOWNLOAD'&&e.attempts===3);assert.equal(calls,3);
 const verify=createVerificationReceipts({sleep:async()=>{}});await assert.rejects(verify(entry,download));assert.equal(calls,6);await assert.rejects(verify(entry,download));assert.equal(calls,9);
});
test('transferencia completa conserva SHA-256 y un 403 no se reintenta',async t=>{
 let calls=0;const download=await server(t,(_req,res)=>{calls++;res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'Sin permiso'}));});
 await assert.rejects(downloadVerifiedMod(entry,download,{sleep:async()=>{}}),e=>e.status===403);assert.equal(calls,1);
 const complete=await server(t,(_req,res)=>{res.writeHead(200,{'Content-Length':String(data.length),'X-VillaWolf-File-Length':String(data.length)});res.end(data);});assert.deepEqual(await downloadVerifiedMod(entry,complete),data);
});
test('Worker conserva longitud oficial y rechaza truncamiento o exceso',async()=>{
 const {officialDownloadResponse}=await import('../auth-server/cloudflare/official-download-stream.mjs');
 const complete=officialDownloadResponse(new Response(data).body,data.length,null);assert.equal(complete.headers.get('x-villawolf-file-length'),String(data.length));assert.deepEqual(Buffer.from(await complete.arrayBuffer()),data);
 for(const actual of [data.subarray(0,2),Buffer.concat([data,Buffer.from('x')])])await assert.rejects(officialDownloadResponse(new Response(actual).body,data.length,null).arrayBuffer());
 for(const length of [0,-1,NaN,129*1024*1024])assert.throws(()=>officialDownloadResponse(new Response(data).body,length,null));
});
