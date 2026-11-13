'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
async function fixture(t){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(__dirname,'../auth-server/cloudflare/schema.sql'),'utf8'));t.after(()=>db.close());
 function prepare(sql,args=[]){return{bind:(...a)=>prepare(sql,a),first:async()=>db.prepare(sql).get(...args)||null,run:async()=>({meta:db.prepare(sql).run(...args)}),all:async()=>({results:db.prepare(sql).all(...args)})};}
 const actor='1000000000000000001',guild='751907899336556574',channel='1560778156045242390',role='1560478988214993056',official='1007732653035880589',admin='1559330834278781048',now=Date.now();
 const env={DB:{prepare,batch:async a=>Promise.all(a.map(s=>s.run()))},DISCORD_CLIENT_ID:'1558941216773767178',DISCORD_GUILD_ID:official,DISCORD_ROLE_ID:role,DISCORD_CLIENT_SECRET:'test-only',TOKEN_KEY:'a'.repeat(64)};
 const pack={id:'champagne-vol5',name:'Mundo Conejil',roleId:role,guildId:guild,enabled:true,manifestPath:'updates/stable-v2.json'};
 const fetchImpl=async url=>{if(url.endsWith('/oauth2/token'))return Response.json({access_token:'test-access',refresh_token:'test-refresh',token_type:'Bearer',expires_in:86400,scope:'identify guilds.members.read'});if(url.endsWith('/users/@me'))return Response.json({id:actor,username:'AdminTest',global_name:'Admin real'});if(url.endsWith('/member'))return Response.json({roles:[admin],user:{id:actor}});if(url.includes('/updates/catalog.json'))return Response.json({schemaVersion:1,packs:[pack]});if(url.includes('/releases?'))return Response.json([]);throw Error('Red no prevista en prueba: '+url);};
 const {createWorker}=await import('../auth-server/cloudflare/worker.mjs');const worker=createWorker({fetchImpl,clock:()=>now});
 const send=async(route,input,token)=>{const r=await worker.fetch(new Request('https://test.workers.dev'+route,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(input)}),env);return{status:r.status,value:await r.json()};};
 async function login(purpose){const proof=crypto.randomBytes(32).toString('base64url'),start=await send('/v1/discord/start',{proof,purpose});const finish=await send('/v1/discord/finish',{proof,purpose,state:start.value.state,code:'simulado'});assert.equal(finish.status,200);return finish.value.token;}
 const token=await login('admin');env.ROLE_BOT_ENABLED='true';env.ROLE_BOT_KEY='b'.repeat(64);
 const bits=((1n<<10n)|(1n<<11n)|(1n<<14n)|(1n<<15n)|(1n<<16n)).toString();
 for(const id of [official,guild]){const generation=crypto.randomUUID();db.prepare('INSERT INTO role_bot_state VALUES(?,?,?,?,?,?,?)').run(id,generation,1,1,now,now,'c'.repeat(64));db.prepare('INSERT INTO role_bot_members VALUES(?,?,?,?,?,?,?)').run(id,actor,generation,JSON.stringify(id===official?[admin]:[]),1,0,null);db.prepare('INSERT INTO role_bot_communities VALUES(?,?,?,?)').run(id,generation,JSON.stringify({roles:[{id:role,mentionable:true}],channels:[{id:channel,type:0,permissions:bits}]}),now);}
 const signed=async input=>{const body=JSON.stringify({...input,sentAt:now,nonce:crypto.randomBytes(32).toString('base64url')}),signature=crypto.createHmac('sha256',Buffer.from(env.ROLE_BOT_KEY,'hex')).update(body).digest('hex');const r=await worker.fetch(new Request('https://test.workers.dev/internal/notifications',{method:'POST',headers:{'Content-Type':'application/json','x-villawolf-signature':signature},body}),env);return{status:r.status,value:await r.json()};};
 const input={id:crypto.randomUUID(),packId:pack.id,channelId:channel,title:'Alianza',text:'Anuncio de prueba simulado',downloadUrl:'',mentionEveryone:false,mentionRole:true,confirmed:true};
 return{db,env,send,signed,token,input,actor,official,guild,login};
}
test('flujo HTTP real simulado: Admin autenticado, imagen grande, poll firmado, ack y deduplicación',async t=>{
 const f=await fixture(t);const options=await f.send('/v2/admin/announcements/options',{packId:f.input.packId},f.token);assert.equal(options.status,200);assert.equal(options.value.guildId,f.guild);
 const bytes=Buffer.alloc(524288);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);const image={mime:'image/png',base64:bytes.toString('base64'),sha256:crypto.createHash('sha256').update(bytes).digest('hex')};const input={...f.input,image};
 const sent=await f.send('/v2/admin/announcements/send',input,f.token);assert.equal(sent.status,200);assert.equal(sent.value.queued,true);
 const polled=await f.signed({action:'poll',guildIds:[f.guild]});assert.equal(polled.status,200);assert.deepEqual(polled.value.job.payload.image,image);const job=polled.value.job;
 const ack=await f.signed({action:'ack',result:{id:job.id,claimToken:job.claimToken,outcome:'sent',messageId:'1560807518668718113'}});assert.equal(ack.status,200);
 assert.equal((await f.send('/v2/admin/announcements/send',input,f.token)).status,200);assert.equal((await f.signed({action:'poll',guildIds:[f.guild]})).value.job,null);
 const history=await f.send('/v2/admin/announcements/history',{packId:f.input.packId},f.token);assert.equal(history.value.items[0].status,'sent');assert.equal(history.value.items[0].actor_id,f.actor);
});
test('rutas no aceptan acceso anónimo, sesión de jugador, revocación ni tamaño excesivo',async t=>{
 const f=await fixture(t);assert.equal((await f.send('/v2/admin/announcements/send',f.input)).status,401);
 const player=await f.login('launcher-v2');assert.equal((await f.send('/v2/admin/announcements/send',f.input,player)).status,403);
 assert.equal((await f.send('/v2/admin/announcements/send',{...f.input,text:'x'.repeat(751000)},f.token)).status,413);
 assert.equal((await f.send('/v2/admin/announcements/options',{packId:f.input.packId,extra:'x'.repeat(9000)},f.token)).status,413);
 f.db.prepare('UPDATE role_bot_members SET roles=? WHERE guild_id=?').run('[]',f.official);assert.equal((await f.send('/v2/admin/announcements/send',f.input,f.token)).status,403);
});
