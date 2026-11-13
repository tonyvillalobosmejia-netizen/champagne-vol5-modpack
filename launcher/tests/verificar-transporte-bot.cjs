'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const failure=require('../auth-server/roles-bot/failure.cjs');
const {createBridge}=require('../auth-server/roles-bot/bridge.cjs');
const endpoint='https://service.invalid',key='a'.repeat(64),guild='1007732653035880589';

test('transporte reintenta sólo conexión no establecida, conserva cuerpo, firma y presupuesto',async()=>{
 const {createTransport}=require('../auth-server/roles-bot/transport.cjs');
 const calls=[],waits=[],options={method:'POST',body:'signed-body',headers:{signature:'unchanged'},signal:AbortSignal.timeout(1000)};
 const fetcher=createTransport({pause:async ms=>waits.push(ms),fetcher:async(url,opts)=>{calls.push(opts);if(calls.length===1)throw Object.assign(Error('connect'),{cause:{code:'UND_ERR_CONNECT_TIMEOUT'}});return Response.json({ok:true});}});
 assert.equal((await fetcher(endpoint,options)).status,200);assert.equal(calls.length,2);assert.equal(calls[0],options);assert.equal(calls[1],options);assert.deepEqual(waits,[250]);
});

test('transporte limita intentos y no repite respuestas HTTP, abortos ni errores ambiguos',async()=>{
 const {createTransport}=require('../auth-server/roles-bot/transport.cjs');
 for(const code of ['UND_ERR_CONNECT_TIMEOUT','EAI_AGAIN','ECONNRESET','ENOTFOUND','UND_ERR_SOCKET']){
  let calls=0;const request=createTransport({pause:async()=>{},fetcher:async()=>{calls++;throw Object.assign(Error('failure'),{cause:{code}});}});
  await assert.rejects(request(endpoint));assert.equal(calls,['UND_ERR_CONNECT_TIMEOUT','EAI_AGAIN'].includes(code)?2:1);
 }
 let calls=0;const http=createTransport({fetcher:async()=>{calls++;return new Response(null,{status:401});}});assert.equal((await http(endpoint)).status,401);assert.equal(calls,1);
 const controller=new AbortController();controller.abort();calls=0;
 const aborted=createTransport({fetcher:async()=>{calls++;throw Object.assign(Error('failure'),{cause:{code:'UND_ERR_CONNECT_TIMEOUT'}});}});
 await assert.rejects(aborted(endpoint,{signal:controller.signal}));assert.equal(calls,1);
});
test('diagnóstico conserva la versión pública del Bot sin permitir credenciales en el encabezado',()=>{const {reportText}=require('../src/champagne-diagnostic');const value={app:'bot',version:'0.2.6',operation:'roles-sync',error:'Error',log:'Bot '+'a'.repeat(40),occurredAt:new Date().toISOString()};const text=reportText(value);assert.ok(text.startsWith('VillaWolf bot 0.2.6\n'));assert.ok(!text.includes('a'.repeat(40)));assert.throws(()=>reportText({...value,version:'token secreto'}));});
test('clasifica causa de transporte sin copiar mensajes, URLs ni credenciales',()=>{
 for(const code of ['ECONNRESET','ENOTFOUND','UND_ERR_CONNECT_TIMEOUT']){
  const error=Object.assign(Error('fetch failed https://private.invalid?token=secret'),{cause:{code,message:'secret'}});
  const detail=failure.describe(error,'heartbeat');assert.equal(detail.transportCode,code);assert.equal(detail.stage,'heartbeat');assert.ok(!JSON.stringify(detail).includes('secret'));assert.ok(!JSON.stringify(detail).includes('private'));
 }
 assert.match(failure.describe(new DOMException('secret','TimeoutError')).reason,/Tiempo de espera/);
 assert.equal(failure.describe(failure.serviceError(401,'reset')).category,'configuration');
 assert.equal(failure.describe(failure.serviceError(403,'metadata')).category,'permissions');
});
test('bridge identifica etapa real del transporte sin reintentar una firma o heartbeat ambiguos',async()=>{
 let calls=0;const original=Object.assign(Error('fetch failed'),{cause:{code:'ECONNRESET'}});
 const bridge=createBridge({endpoint,key,fetcher:async()=>{calls++;throw original;}});bridge.begin(guild);
 await assert.rejects(bridge.send(guild,'metadata'),e=>e===original&&e.stage==='metadata');assert.equal(calls,1);
});
test('respuesta JSON inválida no confirma sincronización y conserva la etapa',async()=>{
 const bridge=createBridge({endpoint,key,fetcher:async()=>new Response('<html>incorrecto</html>')});bridge.begin(guild);
 await assert.rejects(bridge.send(guild,'heartbeat'),e=>e.code==='ERR_SERVICE_RESPONSE'&&e.stage==='heartbeat'&&failure.describe(e).category==='service-response');
});
test('poll tiene presupuesto para los upstreams; ack conserva presupuesto acotado',async()=>{
 const file=path.resolve(__dirname,'../auth-server/roles-bot/notifications.cjs'),budgets=[];
 const context={module:{exports:{}},require:createRequire(file),URL,Buffer,AbortSignal:{timeout:ms=>{budgets.push(ms);return undefined;}},fetch:()=>{throw Error('No red');}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 const service=context.module.exports.createNotificationClient({endpoint,key,fetcher:async()=>Response.json({ok:true,job:null})});
 await service.poll([guild]);await service.ack({id:'test'});assert.deepEqual(budgets,[45000,15000]);
});
test('anuncios distinguen poll, confirmación y respuesta inválida sin emitir mensajes',async()=>{
 const {createNotificationClient}=require('../auth-server/roles-bot/notifications.cjs');
 const broken=createNotificationClient({endpoint,key,fetcher:async()=>{throw new DOMException('timeout','TimeoutError');}});
 await assert.rejects(broken.poll([guild]),e=>e.stage==='announcements-poll'&&/Tiempo de espera/.test(failure.describe(e).reason));
 await assert.rejects(broken.ack({}),e=>e.stage==='announcements-ack');
 const invalid=createNotificationClient({endpoint,key,fetcher:async()=>Response.json({ok:false})});
 await assert.rejects(invalid.poll([guild]),e=>e.code==='ERR_SERVICE_RESPONSE'&&e.stage==='announcements-poll');
});
