const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
async function fixture(t){
  const {createWorker}=await import('../auth-server/cloudflare/worker.mjs');
  const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(__dirname,'../auth-server/cloudflare/schema.sql'),'utf8'));t.after(()=>db.close());
  function prepared(sql,args=[]){return {bind:(...values)=>prepared(sql,values),first:async()=>db.prepare(sql).get(...args)||null,run:async()=>({meta:db.prepare(sql).run(...args)}),all:async()=>({results:db.prepare(sql).all(...args)})};}
  const env={DB:{prepare:prepared,batch:async statements=>Promise.all(statements.map(statement=>statement.run()))},DISCORD_CLIENT_ID:'1558941216773767178',DISCORD_GUILD_ID:'1007732653035880589',DISCORD_ROLE_ID:'1558938399300390952',DISCORD_CLIENT_SECRET:'falso-secreto',TOKEN_KEY:'a'.repeat(64)};
  let now=Date.now();const state={role:true,name:'Jugador.test',id:'1000000000000000001',offline:false};let exchanges=0;
  const fetchImpl=async (url,options)=>{assert.equal(options.redirect,'manual');if(state.redirect)return new Response(null,{status:302,headers:{Location:'https://example.invalid'}});if(state.offline)throw Error('offline');if(url.endsWith('oauth2/token'))exchanges++;return new Response(JSON.stringify(url.endsWith('oauth2/token')?{access_token:'oauth-privado-ficticio',token_type:'Bearer',expires_in:86400,scope:'identify guilds.members.read'}:url.endsWith('users/@me')?{id:state.id,username:state.name,global_name:'Jugador ✨'}:{roles:state.role?[env.DISCORD_ROLE_ID]:[],user:{id:state.id}}));};
  const worker=createWorker({fetchImpl,clock:()=>now});
  async function send(route,input,token,handler=worker){const response=await handler.fetch(new Request('https://prueba.workers.dev'+route,{method:input?'POST':'GET',headers:{'CF-Connecting-IP':'192.0.2.1',...(input?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(input?{body:JSON.stringify(input)}:{})}),env);return {status:response.status,value:await response.json()};}
  const random=()=>crypto.randomBytes(32).toString('base64url');
  async function begin(){const proof=random();const start=await send('/v1/discord/start',{proof});return {proof,state:start.value.state};}
  async function login(){return send('/v1/discord/finish',{...await begin(),code:'codigo'});}
  return {db,env,state,send,begin,login,random,worker,newWorker:()=>createWorker({fetchImpl,clock:()=>now}),advance:ms=>now+=ms,exchanges:()=>exchanges};
}
test('D1 consume state de forma atómica, cifra OAuth y conserva sesiones entre Workers',async t=>{
  const env=await fixture(t),flow=await env.begin();
  assert.equal((await env.send('/v1/discord/finish',{...flow,proof:env.random(),code:'x'})).status,401);
  const results=await Promise.all([env.send('/v1/discord/finish',{...flow,code:'x'}),env.send('/v1/discord/finish',{...flow,code:'x'})]);assert.deepEqual(results.map(value=>value.status).sort(),[200,401]);assert.equal(env.exchanges(),1);
  const session=results.find(result=>result.status===200).value;assert.equal(session.user.username,'Jugadortest');assert.equal(JSON.stringify(session).includes('oauth-privado'),false);
  const stored=env.db.prepare('SELECT * FROM discord_sessions').get();assert.equal(JSON.stringify(stored).includes('oauth-privado'),false);assert.equal(JSON.stringify(stored).includes(session.token),false);
  assert.equal((await env.send('/v1/session',null,session.token,env.newWorker())).status,200);env.state.role=false;assert.equal((await env.send('/v1/session',null,session.token)).status,403);assert.equal((await env.send('/v1/session',null,session.token)).status,401);
});
test('D1 mantiene nombres, respeta reservas y bloquea roles ausentes',async t=>{
  const env=await fixture(t);env.db.prepare('INSERT INTO discord_reservations VALUES(?)').run('Jugadortest');const one=(await env.login()).value;assert.notEqual(one.user.username,'Jugadortest');assert.match(one.user.username,/^[A-Za-z0-9_]{3,16}$/);
  env.state.name='OtroNombre';assert.equal((await env.login()).value.user.username,one.user.username);env.state.id='1000000000000000002';env.state.name='Jugador.test';assert.notEqual((await env.login()).value.user.username,one.user.username);
  env.state.role=false;assert.equal((await env.login()).status,403);
});
test('D1 falla cerrado sin configuración, con Discord caído y con sesiones vencidas',async t=>{
  const env=await fixture(t);const session=(await env.login()).value;env.state.offline=true;assert.equal((await env.send('/v1/session',null,session.token)).status,503);env.state.offline=false;
  await env.send('/v1/logout',{},session.token);assert.equal((await env.send('/v1/session',null,session.token)).status,401);
  const newer=(await env.login()).value;env.advance(13*3600000);assert.equal((await env.send('/v1/session',null,newer.token)).status,401);
  env.env.DISCORD_CLIENT_SECRET='';assert.equal((await env.send('/health')).status,503);
});
test('D1 rechaza estado vencido y limita intentos',async t=>{
  const env=await fixture(t),flow=await env.begin();env.advance(300001);assert.equal((await env.send('/v1/discord/finish',{...flow,code:'x'})).status,401);assert.equal(env.exchanges(),0);
  let limited;for(let i=0;i<31;i++)limited=await env.send('/v1/discord/start',{proof:env.random()});assert.equal(limited.status,429);
});
test('Worker rechaza redirecciones de Discord sin crear identidad ni sesión',async t=>{
  const env=await fixture(t);env.state.redirect=true;
  assert.equal((await env.login()).status,503);
  assert.equal(env.db.prepare('SELECT count(*) AS count FROM discord_users').get().count,0);
  assert.equal(env.db.prepare('SELECT count(*) AS count FROM discord_sessions').get().count,0);
});
