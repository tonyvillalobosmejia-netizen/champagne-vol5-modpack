'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{deliver,createNotificationClient}=require('../auth-server/roles-bot/notifications.cjs');
function fixture({sent=[],messages=[],error=null,guild='1100890182884012062'}={}){
 const reports=[],channel={guildId:guild,isTextBased:()=>true,isThread:()=>false,messages:{fetch:async()=>new Map(messages.map(m=>[m.id,m]))},send:async value=>{sent.push(value);if(error)throw error;return{id:'1560014668632825876'};}};
 return{sent,reports,client:{user:{id:'1558941216773767178'},channels:{fetch:async()=>channel}},ack:async r=>reports.push(r)};
}
const job={id:'a'.repeat(64),guildId:'1100890182884012062',channelId:'1560014364155838514',createdAt:1000,claimToken:'ficticio',reconcile:false,payload:{kind:'modpack',name:'Racoon',version:'0.1.0'}};
test('envío usa sólo el canal y rol configurados y confirma el mensaje',async()=>{const f=fixture();await deliver(job,f);assert.equal(f.sent.length,1);assert.deepEqual(f.sent[0].allowedMentions.parse,[]);assert.equal(f.reports[0].outcome,'sent');assert.ok(f.sent[0].embeds[0].footer.text.endsWith('Ref '+job.id.slice(0,24)));});
test('una entrega ambigua se reconcilia sin repetir el anuncio',async()=>{const f=fixture({messages:[{id:'1560014668632825876',author:{id:'1558941216773767178'},createdTimestamp:1200,embeds:[{footer:{text:'VillaWolf · Ref '+job.id.slice(0,24)}}]}]});await deliver({...job,reconcile:true},f);assert.equal(f.sent.length,0);assert.equal(f.reports[0].outcome,'sent');});
test('si el historial no cubre el envío no se reenvía a ciegas',async()=>{const f=fixture({messages:Array.from({length:100},(_,i)=>({id:String(i),createdTimestamp:2000+i,embeds:[],author:{id:'otro'}}))});await deliver({...job,reconcile:true},f);assert.equal(f.sent.length,0);assert.equal(f.reports[0].outcome,'uncertain');});
test('otro servidor nunca recibe el anuncio; errores de red y 429 se distinguen',async()=>{let f=fixture({guild:'1007732653035880589'});await deliver(job,f);assert.equal(f.sent.length,0);f=fixture({error:Error('offline')});await deliver(job,f);assert.equal(f.reports[0].outcome,'uncertain');f=fixture({error:{status:429,retry_after:265}});await deliver(job,f);assert.equal(f.reports[0].outcome,'retry');assert.equal(f.reports[0].retryAfterMs,265000);});
test('transporte firma solicitudes sin enviar el token de Discord',async()=>{let body,headers;const service=createNotificationClient({endpoint:'https://example.invalid',key:'c'.repeat(64),fetcher:async(_url,options)=>{body=options.body;headers=options.headers;return Response.json({ok:true,job:null});}});await service.poll([job.guildId]);assert.match(headers['x-villawolf-signature'],/^[a-f0-9]{64}$/);assert.ok(!body.includes('c'.repeat(64)));assert.equal(JSON.parse(body).action,'poll');});

test('no envía ni confirma un anuncio de aplicación si falla verificar la release',async()=>{const f=fixture();await deliver({...job,payload:{kind:'launcher',name:'Launcher',version:'0.1.20'}},{...f,fetcher:async()=>new Response('',{status:404})});assert.equal(f.sent.length,0);assert.equal(f.reports[0].outcome,'retry');});

for (const kind of ['launcher','admin']) test('destino oficial '+kind+' restringe menciones incluso con payload antiguo',async()=>{
 const guild='1007732653035880589',f=fixture({guild}),version='0.1.99',tag=(kind==='admin'?'admin-v':'v')+version;
 const bytes=Buffer.from('instalador simulado'),name='VillaWolf.'+(kind==='admin'?'Administrador':'Launcher')+'.Setup.'+version+'.exe';
 const url='https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/download/'+tag+'/'+name;
 let calls=0;
 const fetcher=async()=>++calls===1?Response.json({draft:false,prerelease:false,tag_name:tag,published_at:'2026-01-01T00:00:00Z',body:'Novedades',assets:[{name,state:'uploaded',size:bytes.length,digest:'sha256:'+require('node:crypto').createHash('sha256').update(bytes).digest('hex'),browser_download_url:url}]}):new Response(bytes);
 await deliver({...job,guildId:guild,channelId:kind==='admin'?'1559347693245956189':'1559334945372250314',payload:{kind,name:'VillaWolf',version,mentionRole:true,roleId:'123456789012345678'}},{...f,fetcher});
 assert.equal(f.sent.length,1);assert.deepEqual(f.sent[0].allowedMentions.roles,kind==='admin'?['1559330834278781048']:[]);assert.deepEqual(f.sent[0].allowedMentions.parse,[]);assert.deepEqual(f.sent[0].allowedMentions.users,[]);
 assert.equal(f.sent[0].content,kind==='admin'?'<@&1559330834278781048>':'');assert.equal(calls,2);
});
