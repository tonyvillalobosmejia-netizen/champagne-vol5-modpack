const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {createDiscordServer,callbackUri}=require('../auth-server/discord-server.cjs');
const {createAuthClient}=require('../src/champagne-auth');
const {receiveDiscordCode}=require('../src/champagne-discord-callback');
const random=()=>crypto.randomBytes(32).toString('base64url');
const guildId='1007732653035880589',roleId='1558938399300390952';
async function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'champagne-discord-'));
  const state={role:true,offline:false,id:'1000000000000000001',name:'Usuario.test',pending:false};
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,options});if(state.offline)throw Error('offline');
    const value=url.endsWith('oauth2/token')?{access_token:'discord-token-ficticio',token_type:'Bearer',expires_in:86400,scope:'identify guilds.members.read'}
      :url.endsWith('users/@me')?{id:state.id,username:state.name,global_name:'Nombre visible ✨'}
      :{roles:state.role?[roleId]:[],pending:state.pending,user:{id:state.id}};
    return new Response(JSON.stringify(value),{status:200});
  };
  const service=createDiscordServer({databasePath:path.join(dir,'identidades.sqlite'),clientId:'1000000000000000002',clientSecret:'secreto-ficticio-servidor',guildId,roleId,fetchImpl});
  await new Promise(resolve=>service.server.listen(0,'127.0.0.1',resolve));
  const baseUrl='http://127.0.0.1:'+service.server.address().port;
  t.after(async()=>{await service.close();const resolved=path.resolve(dir);if(path.dirname(resolved)!==path.resolve(os.tmpdir())||!path.basename(resolved).startsWith('champagne-discord-'))throw Error('Limpieza inválida.');fs.rmSync(resolved,{recursive:true,force:true});});
  async function send(route,input,token){const response=await fetch(baseUrl+route,{method:input?'POST':'GET',headers:{...(input?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(input?{body:JSON.stringify(input)}:{})});return {status:response.status,value:await response.json()};}
  async function login(){const proof=random();const start=await send('/v1/discord/start',{proof});return {start,proof,result:await send('/v1/discord/finish',{state:start.value.state,proof,code:'codigo-ficticio'})};}
  return {service,state,calls,baseUrl,send,login,dir};
}
test('OAuth vincula state y prueba, consume una vez y oculta el secreto al launcher',async t=>{
  const env=await fixture(t),proof=random();const start=await env.send('/v1/discord/start',{proof});
  const url=new URL(start.value.authorizationUrl);assert.equal(url.hostname,'discord.com');assert.equal(url.searchParams.get('scope'),'identify guilds.members.read');assert.equal(url.searchParams.get('redirect_uri'),callbackUri);assert.equal(JSON.stringify(start).includes('secreto-ficticio'),false);
  assert.equal((await env.send('/v1/discord/finish',{state:start.value.state,proof:random(),code:'x'})).status,401);assert.equal(env.calls.length,0);
  const input={state:start.value.state,proof,code:'codigo'};const result=await env.send('/v1/discord/finish',input);assert.equal(result.status,200);assert.equal(result.value.user.username,'Usuariotest');assert.equal(JSON.stringify(result).includes('discord-token-ficticio'),false);
  assert.equal((await env.send('/v1/discord/finish',input)).status,401);
  assert.equal(new URLSearchParams(env.calls[0].options.body).get('client_secret'),'secreto-ficticio-servidor');
  assert.equal(fs.readFileSync(path.join(env.dir,'identidades.sqlite-wal')).includes(Buffer.from('discord-token-ficticio')),false);
});
test('nombres válidos, únicos y estables aunque Discord cambie su nombre',async t=>{
  const env=await fixture(t);env.service.reserve('Usuariotest');const first=(await env.login()).result.value;
  assert.equal(first.user.username,'Usuariotest_1');env.state.name='NombreNuevo';const again=(await env.login()).result.value;assert.equal(again.user.username,first.user.username);
  env.state.id='1000000000000000003';env.state.name='Usuario.test';const other=(await env.login()).result.value;assert.equal(other.user.username,'Usuariotest_2');
  assert.notEqual(other.user.id,first.user.id);assert.match(other.user.username,/^[A-Za-z0-9_]{3,16}$/);
});
test('falta de rol deniega login y retirar el rol revoca una sesión existente',async t=>{
  const env=await fixture(t);env.state.role=false;assert.equal((await env.login()).result.status,403);env.state.role=true;
  const session=(await env.login()).result.value;assert.equal((await env.send('/v1/session',null,session.token)).status,200);
  env.state.role=false;assert.equal((await env.send('/v1/session',null,session.token)).status,403);env.state.role=true;assert.equal((await env.send('/v1/session',null,session.token)).status,401);
  env.state.pending=true;assert.equal((await env.login()).result.status,403);
});
test('vinculación administrativa conserva el nombre previo y evita apropiarse de otra cuenta',async t=>{
  const env=await fixture(t);env.service.reserve('NombreAnterior');env.service.bind(env.state.id,'NombreAnterior');
  assert.equal((await env.login()).result.value.user.username,'NombreAnterior');
  assert.throws(()=>env.service.bind(env.state.id,'OtroNombre'),/ya tiene/);assert.throws(()=>env.service.bind('1000000000000000004','nombreanterior'),/otra cuenta/);
});
test('caída de Discord bloquea la comprobación; logout invalida el token',async t=>{
  const env=await fixture(t);const session=(await env.login()).result.value;env.state.offline=true;assert.equal((await env.send('/v1/session',null,session.token)).status,503);
  env.state.offline=false;assert.equal((await env.send('/v1/session',null,session.token)).status,200);await env.send('/v1/logout',{},session.token);assert.equal((await env.send('/v1/session',null,session.token)).status,401);
});
test('cliente abre navegador, recibe callback y exige Discord sin recurrir al perfil local',async t=>{
  const env=await fixture(t);let wrongStateRejected=false;
  const client=createAuthClient({baseUrl:env.baseUrl,allowLocalDev:true,provider:'discord',required:true,openBrowser:async url=>{
    const auth=new URL(url);const wrong=new URL(callbackUri);wrong.searchParams.set('state','incorrecto');wrong.searchParams.set('code','x');wrongStateRejected=(await fetch(wrong)).status===400;
    const good=new URL(callbackUri);good.searchParams.set('state',auth.searchParams.get('state'));good.searchParams.set('code','codigo');await (await fetch(good)).text();
  }});
  await assert.rejects(client.verifiedUsername(),/Discord/);assert.equal((await client.register({})).ok,false);
  const login=await client.loginDiscord();assert.equal(login.ok,true,login.message);assert.equal(wrongStateRejected,true);assert.equal('token' in login,false);assert.equal('accessToken' in client.status(),false);assert.equal(await client.verifiedUsername(),'Usuariotest');
  env.state.role=false;await assert.rejects(client.verifiedUsername(),/rol/);assert.equal(client.status().user,null);await assert.rejects(client.verifiedUsername(),/Discord/);
});
test('callback rechaza destinos ajenos y vence si el usuario no autoriza',async()=>{
  assert.throws(()=>receiveDiscordCode({state:random(),callbackUri:'http://example.com/',authorizationUrl:'https://discord.com/oauth2/authorize'}),/Retorno/);
  const state=random(),url=new URL('https://discord.com/oauth2/authorize');url.searchParams.set('state',state);url.searchParams.set('redirect_uri',callbackUri);
  await assert.rejects(receiveDiscordCode({state,authorizationUrl:url.href,callbackUri,openBrowser:async()=>{},timeoutMs:30}),/venció/);
  const controller=new AbortController();const pending=receiveDiscordCode({state,authorizationUrl:url.href,callbackUri,signal:controller.signal,openBrowser:async()=>controller.abort()});await assert.rejects(pending,/cancelado/);
});
