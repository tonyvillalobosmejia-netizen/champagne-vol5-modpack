'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const model=require('../src/champagne-manual-announcement.cjs'),manual=require('../auth-server/roles-bot/manual-announcement.cjs');
const {DatabaseSync}=require('node:sqlite');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const guild='751907899336556574',official='1007732653035880589',channel='1560778156045242390',role='1559431805096960020',actor='1000000000000000001',admin='1559330834278781048';
const input=()=>({id:crypto.randomUUID(),packId:'conejil',channelId:channel,title:'🐺 VillaWolf × comunidad',text:'Una nueva aventura.',downloadUrl:'',mentionEveryone:false,mentionRole:false,confirmed:true});
const permissions=((1n<<10n)|(1n<<11n)|(1n<<14n)|(1n<<15n)|(1n<<16n)).toString();
function image(length=100){const raw=Buffer.alloc(length);Buffer.from('89504e470d0a1a0a','hex').copy(raw);return{mime:'image/png',base64:raw.toString('base64'),sha256:hash(raw)};}
test('validación de texto, menciones explícitas, enlaces y credenciales',()=>{
 const v=input();assert.equal(model.validate(v).title,v.title);
 for(const patch of [{text:'@everyone'},{text:'@here'},{text:'<@&123>'},{text:'token '+ 'a'.repeat(24)+'.'+'b'.repeat(6)+'.'+'c'.repeat(27)},{text:'password=secreto'},{downloadUrl:'https://example.invalid/file.exe'},{mentionRole:undefined},{id:'../../x'},{channelId:'otro'}])assert.throws(()=>model.validate({...v,...patch}));
 assert.ok(model.launcherLink('https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/download/v0.1.21/VillaWolf.Launcher.Setup.0.1.21.exe'));
 assert.ok(!model.launcherLink('https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/download/v0.1.21/VillaWolf.Launcher.Setup.0.1.20.exe'));
});
test('imagen de 512 KiB valida sin desbordar regexp; rechaza exceso, base64 y formato',()=>{
 const v=input();assert.equal(model.validate({...v,image:image(524288)}).image.base64.length,699052);
 for(const img of [image(524289),{...image(),base64:'!!!!'},{...image(),mime:'image/jpeg'},{...image(),base64:image().base64+'='}])assert.throws(()=>model.validate({...v,image:img}));
});
test('permisos restringidos: adjuntar sólo con imagen y menciones según decisión',()=>{
 const c={type:0,permissions},r={mentionable:false};assert.ok(model.assertPermissions(c,r,input()));
 assert.throws(()=>model.assertPermissions(c,r,{...input(),mentionEveryone:true}));assert.throws(()=>model.assertPermissions(c,r,{...input(),mentionRole:true}));
 assert.ok(model.assertPermissions(c,{mentionable:true},{...input(),mentionRole:true}));
 const noAttach={...c,permissions:(BigInt(permissions)&~(1n<<15n)).toString()};assert.ok(model.assertPermissions(noAttach,r,input()));assert.throws(()=>model.assertPermissions(noAttach,r,{...input(),image:image()}));
 assert.throws(()=>model.assertPermissions({...c,type:11},r,input()));
});
async function fixture(t){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(__dirname,'../auth-server/cloudflare/schema.sql'),'utf8'));t.after(()=>db.close());
 function prepare(sql,args=[]){return{bind:(...a)=>prepare(sql,a),first:async()=>db.prepare(sql).get(...args)||null,run:async()=>db.prepare(sql).run(...args),all:async()=>({results:db.prepare(sql).all(...args)})};}
 const env={DB:{prepare},DISCORD_GUILD_ID:official};let now=Date.now();
 const state={authorized:true,enabled:true,fresh:true,member:true,admin:true,roleMentionable:false,permissions,guild,role};
 const outbox=(await import('../auth-server/cloudflare/worker.mjs')).createNotificationOutbox({clock:()=>now});
 const service=(await import('../auth-server/cloudflare/manual-announcements.mjs')).createManualAnnouncements({clock:()=>now,digest:async s=>hash(s),authorize:async()=>{if(!state.authorized)throw Object.assign(Error('Sin autorización'),{status:403});return{user:{discordId:actor,discordName:'Admin real'}};},packFor:async(_e,id)=>id==='conejil'?{id,name:'Mundo Conejil',enabled:state.enabled,guildId:state.guild,roleId:state.role}:null,metadata:async()=>state.fresh?{roles:[{id:role,mentionable:state.roleMentionable}],channels:[{id:channel,type:0,permissions:state.permissions}]}:null,membership:async(_e,gid)=>!state.member?null:{roles:gid===official&&state.admin?[admin]:[]},outbox});
 return{db,env,state,outbox,service,advance:ms=>now+=ms};
}
test('cola guarda autor real e imagen aparte; misma referencia no duplica y contenido cambiado se rechaza',async t=>{
 const f=await fixture(t),v={...input(),image:image(),actorId:'otro',actorName:'suplantado'};
 const one=await f.service.submit(f.env,'session',v),two=await f.service.submit(f.env,'session',v);assert.equal(one.jobId,two.jobId);assert.equal(one.queued,true);
 const row=f.db.prepare('SELECT * FROM notification_jobs').get(),payload=JSON.parse(row.payload);assert.equal(payload.actorId,actor);assert.equal(payload.actorName,'Admin real');assert.ok(!row.payload.includes(v.image.base64));assert.equal(f.db.prepare('SELECT COUNT(*) n FROM notification_jobs').get().n,1);
 await assert.rejects(f.service.submit(f.env,'session',{...v,text:'Otro texto'}),e=>e.status===409);
 const job=await f.outbox.claim(f.env,[guild]),enriched=await f.service.enrich(f.env,job);assert.deepEqual(enriched.payload.image,v.image);
 await f.outbox.acknowledge(f.env,{id:job.id,claimToken:job.claimToken,outcome:'sent',messageId:'1560807518668718113'});
 const history=await f.service.history(f.env,'session',{packId:'conejil'});assert.equal(history.items[0].status,'sent');assert.equal(history.items[0].actor_id,actor);assert.ok(!JSON.stringify(history).includes(v.image.base64));
 // Reintentar tras reinicio conserva la misma entrega confirmada.
 await f.service.submit(f.env,'session',v);assert.equal(await f.outbox.claim(f.env,[guild]),null);
});
test('canal ajeno, autorización, confirmación, sincronización e imagen alterada bloquean antes de encolar',async t=>{
 const f=await fixture(t);await assert.rejects(f.service.submit(f.env,'s',{...input(),confirmed:false}));
 await assert.rejects(f.service.submit(f.env,'s',{...input(),channelId:'1560778156045242391'}));
 f.state.authorized=false;await assert.rejects(f.service.submit(f.env,'s',input()),e=>e.status===403);f.state.authorized=true;
 f.state.fresh=false;await assert.rejects(f.service.submit(f.env,'s',input()),e=>e.status===503);f.state.fresh=true;
 f.state.member=false;await assert.rejects(f.service.submit(f.env,'s',input()),e=>e.status===403);f.state.member=true;
 await assert.rejects(f.service.submit(f.env,'s',{...input(),image:{...image(),sha256:'a'.repeat(64)}}));
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM notification_jobs').get().n,0);
});
for(const condition of ['admin','enabled','guild','role','fresh'])test('antes de entregar vuelve a comprobar '+condition,async t=>{
 const f=await fixture(t);await f.service.submit(f.env,'s',input());const job=await f.outbox.claim(f.env,[guild]);f.state[condition]=['guild','role'].includes(condition)?'1100890182884012062':false;
 await assert.rejects(f.service.enrich(f.env,job));
});
test('migración es aditiva e idempotente y conserva datos existentes',t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec('CREATE TABLE existing(value TEXT); INSERT INTO existing VALUES (\'conservar\');');const sql=fs.readFileSync(path.join(__dirname,'../auth-server/cloudflare/migrations/0007_manual_announcements.sql'),'utf8');db.exec(sql);db.exec(sql);assert.equal(db.prepare('SELECT value FROM existing').get().value,'conservar');
});
function botFixture(event){
 const sent=[],acks=[];const member={pending:false,roles:{cache:new Map([[admin,true]])}},r={id:role,mentionable:true,guild:{id:guild}},g={id:guild,members:{fetch:async()=>member},roles:{fetch:async()=>r}};
 const c={guildId:guild,guild:g,type:0,isTextBased:()=>true,isThread:()=>false,permissionsFor:()=>({bitfield:BigInt(permissions)}),messages:{fetch:async()=>new Map()},send:async value=>{sent.push(value);return{id:'1560807518668718113'};}};
 return{sent,acks,channel:c,member,client:{user:{id:'1558941216773767178'},guilds:{cache:new Map([[official,g]])},channels:{fetch:async()=>c}},ack:async x=>acks.push(x),job:{id:'d'.repeat(64),guildId:guild,channelId:channel,createdAt:Date.now(),claimToken:'test',payload:event}};
}
const event=()=>({...input(),kind:'manual',manualId:crypto.randomUUID(),roleId:role,actorId:actor,actorName:'Admin',confirmedAt:new Date().toISOString(),delivery:{schema:1,checkedAt:Date.now(),guildId:guild,packId:'conejil',roleId:role}});
test('servicio antiguo, comprobación vencida, destino cambiado o imagen omitida no permiten enviar',async()=>{
 const v=event();for(const payload of [{...v,delivery:undefined},{...v,delivery:{...v.delivery,checkedAt:Date.now()-90001}},{...v,delivery:{...v.delivery,checkedAt:Date.now()+120000}},{...v,delivery:{...v.delivery,guildId:official}},{...v,imageSha256:image().sha256}]){const f=botFixture(payload);await require('../auth-server/roles-bot/notifications.cjs').deliver(f.job,f);assert.equal(f.sent.length,0);assert.equal(f.acks[0].outcome,'retry');}
});
test('bot envía sin menciones por defecto y adjunta sólo bytes verificados',async()=>{
 const payload={...event(),image:image(),imageSha256:image().sha256},f=botFixture(payload);
 await require('../auth-server/roles-bot/notifications.cjs').deliver(f.job,f);assert.equal(f.sent.length,1);assert.equal(f.acks[0].outcome,'sent');assert.deepEqual(f.sent[0].allowedMentions.parse,[]);assert.deepEqual(f.sent[0].allowedMentions.roles,[]);assert.equal(f.sent[0].content,'');assert.equal(hash(f.sent[0].files[0].attachment),payload.image.sha256);
});
test('mención de rol es exclusiva y @everyone requiere permiso explícito de Discord',async()=>{
 const f=botFixture({...event(),mentionRole:true});await require('../auth-server/roles-bot/notifications.cjs').deliver(f.job,f);assert.deepEqual(f.sent[0].allowedMentions.roles,[role]);assert.deepEqual(f.sent[0].allowedMentions.parse,[]);
 const denied=botFixture({...event(),mentionEveryone:true});await require('../auth-server/roles-bot/notifications.cjs').deliver(denied.job,denied);assert.equal(denied.sent.length,0);assert.equal(denied.acks[0].outcome,'retry');
 const allowed=botFixture({...event(),mentionEveryone:true});allowed.channel.permissionsFor=()=>({bitfield:BigInt(permissions)|(1n<<17n)});await require('../auth-server/roles-bot/notifications.cjs').deliver(allowed.job,allowed);assert.equal(allowed.sent[0].content,'@everyone');assert.deepEqual(allowed.sent[0].allowedMentions.parse,['everyone']);
});
test('autor revocado, imagen alterada y confirmación ausente no se envían',async()=>{
 for(const payload of [{...event(),actorId:'mal'},{...event(),image:image(),imageSha256:'a'.repeat(64)},{...event(),confirmedAt:'invalid'}]){const f=botFixture(payload);await require('../auth-server/roles-bot/notifications.cjs').deliver(f.job,f);assert.equal(f.sent.length,0);}
 const f=botFixture(event());f.member.roles.cache.clear();await require('../auth-server/roles-bot/notifications.cjs').deliver(f.job,f);assert.equal(f.sent.length,0);
});
test('reconciliación identifica un envío anterior sin reenviar tras reinicio',async()=>{
 const f=botFixture(event());f.job.reconcile=true;f.channel.messages.fetch=async()=>new Map([['sent',{id:'1560807518668718113',author:{id:f.client.user.id},embeds:[{footer:{text:'VillaWolf · Ref '+f.job.id.slice(0,24)}}]}]]);
 await require('../auth-server/roles-bot/notifications.cjs').deliver(f.job,f);assert.equal(f.sent.length,0);assert.equal(f.acks[0].outcome,'sent');
});
test('enlace HEAD sigue sólo CDN de releases autorizado y no descarga archivos',async()=>{
 const url='https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/download/v0.1.21/VillaWolf.Launcher.Setup.0.1.21.exe';let calls=0;
 await manual.verifyLink(url,async(_url,options)=>{assert.equal(options.method,'HEAD');assert.equal(options.redirect,'manual');return ++calls===1?new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/github-production-release-asset/123/aaaaaaaa-bbbb'}}):new Response(null,{status:200,headers:{'content-length':'100'}});});assert.equal(calls,2);
 for(const location of ['https://evil.invalid/a','http://release-assets.githubusercontent.com/a','https://user:password@release-assets.githubusercontent.com/github-production-release-asset/123/abc'])await assert.rejects(manual.verifyLink(url,async()=>new Response(null,{status:302,headers:{location}})));
 await assert.rejects(manual.verifyLink(url,async()=>new Response(null,{status:404})));
});
