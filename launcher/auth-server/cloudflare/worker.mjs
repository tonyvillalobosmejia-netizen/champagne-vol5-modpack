// Servicio gratuito Workers + D1. Sin contraseñas, bot ni permisos de administrador.
const catalogUrl='https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/preparacion-paso97/updates/catalog.json';
const adminRoles=['1559330834278781048','1559330540820373535'];
const catalogSeed={"schemaVersion":1,"packs":[{"id":"champagne-vol5","name":"Mundo Conejil","roleId":"1559431805096960020","enabled":true,"manifestPath":"updates/stable-v2.json"}]};
const purposeOf=input=>{const purpose=input.purpose||'launcher';if(!['launcher','launcher-v2','admin'].includes(purpose))throw new AuthError(400,'Aplicación de Discord inválida.');return purpose;};
const avatarUrl=(id,hash)=>snowflake(id)&&typeof hash==='string'&&/^(?:a_)?[a-f0-9]{32}$/.test(hash)?'https://cdn.discordapp.com/avatars/'+id+'/'+hash+'.png?size=128':'https://cdn.discordapp.com/embed/avatars/'+(snowflake(id)?Number((BigInt(id)>>22n)%6n):0)+'.png';
const callbackUri='http://127.0.0.1:32146/discord/callback';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const validNonce=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const snowflake=value=>typeof value==='string'&&/^[0-9]{17,20}$/.test(value);
const base64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const decodeBase64=text=>Uint8Array.from(atob(text),char=>char.charCodeAt(0));
const nonce=()=>base64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');
class AuthError extends Error{constructor(status,message){super(message);this.status=status;this.retryAfter=0;}}
const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});


// Signed, sequenced updates from the owner-operated Gateway bot.
export function createRoleBotStore({clock=Date.now}={}){
 const enc=new TextEncoder(),id=x=>typeof x==='string'&&/^[0-9]{17,20}$/.test(x),hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
 function error(status,message){return Object.assign(new Error(message),{status});}
 async function receive(request,env){
  if(!hex(env.ROLE_BOT_KEY)||env.ROLE_BOT_ENABLED!=='true')throw error(503,'El bot de roles no está habilitado.');
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw error(415,'Se requiere JSON.');
  const signature=request.headers.get('x-villawolf-signature');if(!hex(signature))throw error(401,'Firma inválida.');
  const reader=request.body?.getReader();if(!reader)throw error(400,'Solicitud inválida.');let size=0,parts=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>524288){await reader.cancel();throw error(413,'Actualización demasiado grande.');}parts.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let at=0;for(const b of parts){bytes.set(b,at);at+=b.length;}
  const key=await crypto.subtle.importKey('raw',Uint8Array.from(env.ROLE_BOT_KEY.match(/../g),b=>parseInt(b,16)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('HMAC',key,Uint8Array.from(signature.match(/../g),b=>parseInt(b,16)),bytes))throw error(401,'Firma inválida.');
  let p;try{p=JSON.parse(new TextDecoder().decode(bytes));}catch{throw error(400,'Actualización inválida.');}
  const allowed=new Set([env.DISCORD_GUILD_ID,...String(env.ROLE_BOT_GUILDS||'').split(',').filter(id)]);
  if(!id(p.guildId)||!allowed.has(p.guildId)||!/^[-a-f0-9]{36}$/.test(p.generation||'')||!Number.isSafeInteger(p.sequence)||p.sequence<1||!Number.isSafeInteger(p.sentAt)||Math.abs(clock()-p.sentAt)>60000||!['reset','members','ready','heartbeat','offline'].includes(p.kind))throw error(400,'Actualización inválida.');
  const members=p.kind==='members'?p.members:[];
  if(!Array.isArray(members)||members.length< (p.kind==='members'?1:0)||members.length>50||new Set(members.map(m=>m.id)).size!==members.length||members.some(m=>!id(m.id)||typeof m.present!=='boolean'||typeof m.pending!=='boolean'||!Array.isArray(m.roles)||m.roles.length>250||m.roles.some(r=>!id(r))||(m.avatar!==null&&!(typeof m.avatar==='string'&&/^(?:a_)?[a-f0-9]{32}$/.test(m.avatar)))))throw error(400,'Miembros inválidos.');
  const statements=[];
  if(p.kind==='reset'){
   statements.push(env.DB.prepare('INSERT INTO role_bot_state(guild_id,generation,sequence,ready,last_seen,last_message_at,message_signature) VALUES(?,?,?,0,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET generation=excluded.generation,sequence=excluded.sequence,ready=0,last_seen=excluded.last_seen,last_message_at=excluded.last_message_at,message_signature=excluded.message_signature WHERE excluded.last_message_at>role_bot_state.last_message_at AND excluded.generation<>role_bot_state.generation').bind(p.guildId,p.generation,p.sequence,clock(),p.sentAt,signature));
   statements.push(env.DB.prepare('DELETE FROM role_bot_members WHERE guild_id=? AND EXISTS(SELECT 1 FROM role_bot_state WHERE guild_id=? AND generation=? AND sequence=? AND message_signature=?)').bind(p.guildId,p.guildId,p.generation,p.sequence,signature));
  }else{
   statements.push(env.DB.prepare('UPDATE role_bot_state SET sequence=?,last_seen=?,last_message_at=?,message_signature=?,ready=CASE WHEN ?=\'ready\' THEN 1 WHEN ?=\'offline\' THEN 0 ELSE ready END WHERE guild_id=? AND generation=? AND sequence<?').bind(p.sequence,clock(),p.sentAt,signature,p.kind,p.kind,p.guildId,p.generation,p.sequence));
   for(const m of members)statements.push(env.DB.prepare('INSERT INTO role_bot_members(guild_id,discord_id,generation,roles,present,pending,avatar) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM role_bot_state WHERE guild_id=? AND generation=? AND sequence=? AND message_signature=?) ON CONFLICT(guild_id,discord_id) DO UPDATE SET generation=excluded.generation,roles=excluded.roles,present=excluded.present,pending=excluded.pending,avatar=excluded.avatar').bind(p.guildId,m.id,p.generation,JSON.stringify(m.roles),Number(m.present),Number(m.pending),m.avatar,p.guildId,p.generation,p.sequence,signature));
  }
  const result=await env.DB.batch(statements);if(!Number(result[0]?.meta?.changes))throw error(409,'Secuencia del bot inválida. Reinicia la sincronización.');
  return{ok:true,sequence:p.sequence};
 }
 async function membership(env,guildId,discordId){
  if(env.ROLE_BOT_ENABLED!=='true')return null;
  const state=await env.DB.prepare('SELECT * FROM role_bot_state WHERE guild_id=?').bind(guildId).first();
  if(!state||state.ready!==1||state.last_seen>clock()||clock()-state.last_seen>90000)return null;
  const member=await env.DB.prepare('SELECT * FROM role_bot_members WHERE guild_id=? AND discord_id=? AND generation=?').bind(guildId,discordId,state.generation).first();
  if(!member||member.present!==1||member.pending!==0)throw error(403,'Debes pertenecer al Discord del servidor y completar tu acceso.');
  let roles;try{roles=JSON.parse(member.roles);}catch{throw error(503,'La información de roles no es válida.');}if(!Array.isArray(roles)||roles.some(r=>!id(r)))throw error(503,'La información de roles no es válida.');
  return{roles,pending:false,user:{id:discordId,avatar:member.avatar},botVerified:true};
 }
 return{receive,membership};
}

export function createWorker({fetchImpl=fetch,clock=Date.now}={}){
  const roleBot=createRoleBotStore({clock});
  const discordCooldown=new Map(),discordPending=new Map();
  async function discord(route,options={}){
    const key=await digest(route+'|'+String(options.headers?.Authorization||''));
    if((options.method||'GET')==='GET'&&discordPending.has(key))return discordPending.get(key);
    const pending=discordRequest(route,options,key);if((options.method||'GET')==='GET')discordPending.set(key,pending);
    try{return await pending;}finally{if(discordPending.get(key)===pending)discordPending.delete(key);}
  }
  async function discordRequest(route,options,key,attempt=0){
    const wait=Math.max(0,(discordCooldown.get(key)||0)-Date.now());
    if(wait>2000){const error=new AuthError(429,'Discord necesita una pausa. Reintenta en '+Math.ceil(wait/1000)+' segundos.');error.retryAfter=Math.ceil(wait/1000);throw error;}
    if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
    // Workers solo admite follow/manual. Nunca reenviar credenciales a una redirección.
    let response;try{response=await fetchImpl('https://discord.com/api/v10/'+route,{...options,redirect:'manual',signal:AbortSignal.timeout(10000)});}catch{throw new AuthError(503,'No se pudo conectar con Discord.');}
    const remaining=response.headers.get('x-ratelimit-remaining'),reset=Number(response.headers.get('x-ratelimit-reset-after'));
    if(remaining==='0'&&Number.isFinite(reset)&&reset>0)discordCooldown.set(key,Date.now()+reset*1000);
    if(response.status===429){let value;try{value=await response.json();}catch{}const seconds=Number(response.headers.get('retry-after')||value?.retry_after||reset||1),delay=Number.isFinite(seconds)&&seconds>0?Math.min(seconds*1000,86400000):1000;discordCooldown.set(key,Date.now()+delay);if(attempt===0&&delay<=2000)return discordRequest(route,options,key,1);const error=new AuthError(429,'Discord necesita una pausa. Reintenta en '+Math.ceil(delay/1000)+' segundos.');error.retryAfter=Math.ceil(delay/1000);throw error;}
    if(!response.ok){if(response.status===400&&route==='oauth2/token')throw new AuthError(401,'Discord necesita una nueva autorización. Vuelve a iniciar sesión.');if(response.status===401)throw new AuthError(401,'Vuelve a iniciar sesión con Discord.');if([403,404].includes(response.status))throw new AuthError(403,'Debes pertenecer al Discord del servidor y tener el rol autorizado.');throw new AuthError(503,'Discord no pudo comprobar el acceso. Reintenta.');}
    const text=await response.text();if(encoder.encode(text).length>131072)throw new AuthError(503,'Respuesta de Discord inválida.');
    try{return JSON.parse(text);}catch{throw new AuthError(503,'Respuesta de Discord inválida.');}
  }
  async function membership(env,accessToken,discordId){
    const fromBot=await roleBot.membership(env,env.DISCORD_GUILD_ID,discordId);if(fromBot)return fromBot;
    const value=await discord(`users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,{headers:{Authorization:'Bearer '+accessToken}});
    if(!Array.isArray(value.roles)||value.roles.some(id=>!snowflake(id))||(value.user&&value.user.id!==discordId)||value.pending===true)throw new AuthError(403,'Completa tu acceso al Discord de VillaWolf.');return value;
  }
  async function catalog(){
    let response;try{response=await fetchImpl(catalogUrl,{redirect:'manual',signal:AbortSignal.timeout(10000)});}catch{throw new AuthError(503,'No se pudo consultar la biblioteca de modpacks.');}
    let value;if(response.status===404)value=catalogSeed;else{if(!response.ok)throw new AuthError(503,'La biblioteca no está disponible.');const text=await response.text();if(encoder.encode(text).length>65536)throw new AuthError(503,'Catálogo demasiado grande.');try{value=JSON.parse(text);}catch{throw new AuthError(503,'Catálogo inválido.');}}
    if(value?.schemaVersion!==1||!Array.isArray(value.packs)||value.packs.length>50)throw new AuthError(503,'Catálogo inválido.');
    const ids=new Set();for(const p of value.packs){const expected=p.id==='champagne-vol5'?'updates/stable-v2.json':'updates/packs/'+p.id+'/stable.json';if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(p.id||'')||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80||!snowflake(p.roleId)||typeof p.enabled!=='boolean'||p.manifestPath!==expected)throw new AuthError(503,'Catálogo inválido.');ids.add(p.id);}return value;
  }
  async function member(env,accessToken,discordId){
    const value=await discord(`users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,{headers:{Authorization:'Bearer '+accessToken}});
    if(!Array.isArray(value.roles)||!value.roles.includes(env.DISCORD_ROLE_ID)||(value.user&&value.user.id!==discordId)||value.pending===true)throw new AuthError(403,'No tienes el rol que permite jugar, o falta completar el acceso al servidor de Discord.');
  }
  async function encryptionKey(env){
    if(!/^[a-fA-F0-9]{64}$/.test(env.TOKEN_KEY||''))throw new AuthError(503,'El servicio de Discord todavía no está configurado.');
    return crypto.subtle.importKey('raw',Uint8Array.from(env.TOKEN_KEY.match(/../g),byte=>parseInt(byte,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);
  }
  async function encrypt(env,value){const iv=crypto.getRandomValues(new Uint8Array(12));return base64(iv)+':'+base64(await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(env),encoder.encode(value)));}
  async function decrypt(env,value){const [iv,data]=value.split(':');return decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decodeBase64(iv)},await encryptionKey(env),decodeBase64(data)));}
  async function body(request,limit=8192){
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new AuthError(415,'Se requiere JSON.');
    const reader=request.body?.getReader();if(!reader)throw new AuthError(400,'Solicitud inválida.');
    const parts=[];let size=0;
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new AuthError(413,'Solicitud demasiado grande.');}parts.push(value);}}
    finally{reader.releaseLock();}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
    try{const value=JSON.parse(decoder.decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw new AuthError(400,'Solicitud inválida.');}
  }
  async function identity(env,user){
    if(!snowflake(user.id)||typeof user.username!=='string')throw new AuthError(503,'Identidad de Discord inválida.');
    let row=await env.DB.prepare('SELECT username FROM discord_users WHERE discord_id=?').bind(user.id).first();
    if(!row){
      const candidate=user.username.normalize('NFKD').replace(/[^A-Za-z0-9_]/g,'').slice(0,16),base=candidate.length>=3?candidate:'Jugador';
      // Mantener cada petición por debajo del límite de consultas del plan gratuito.
      for(let i=0;i<12;i++){
        const suffix=i?'_'+user.id.slice(-6)+(i>1?'_'+i:''):'';const name=base.slice(0,16-suffix.length)+suffix;
        await env.DB.prepare('INSERT OR IGNORE INTO discord_users(discord_id,username) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM discord_reservations WHERE username=?)').bind(user.id,name,name).run();
        row=await env.DB.prepare('SELECT username FROM discord_users WHERE discord_id=?').bind(user.id).first();if(row)break;
      }
    }
    if(!row)throw new AuthError(409,'No se pudo asignar un nombre de Minecraft. Contacta con un administrador.');
    return {id:'discord:'+user.id,discordId:user.id,username:row.username,discordName:(user.global_name||user.username).slice(0,80),provider:'discord'};
  }
  async function start(env,input){
    if(!validNonce(input.proof))throw new AuthError(400,'Solicitud de sesión inválida.');
    const purpose=purposeOf(input),state=nonce();await env.DB.prepare('INSERT INTO discord_flows VALUES(?,?,?)').bind(state,await digest(input.proof+(purpose==='launcher'?'':':'+purpose)),clock()+300000).run();
    const url=new URL('https://discord.com/oauth2/authorize');for(const [key,value]of Object.entries({client_id:env.DISCORD_CLIENT_ID,response_type:'code',redirect_uri:callbackUri,scope:'identify guilds.members.read',state,prompt:'consent'}))url.searchParams.set(key,value);
    return {ok:true,state,authorizationUrl:url.href,callbackUri};
  }
  async function finish(env,input){
    if(!validNonce(input.state)||!validNonce(input.proof)||typeof input.code!=='string'||!input.code.length||input.code.length>4096)throw new AuthError(401,'Solicitud de Discord inválida.');
    // Consumo atómico: dos Workers no pueden canjear el mismo flujo.
    const purpose=purposeOf(input);
    const consumed=await env.DB.prepare('DELETE FROM discord_flows WHERE state=? AND proof_hash=? AND expires_at>? RETURNING state').bind(input.state,await digest(input.proof+(purpose==='launcher'?'':':'+purpose)),clock()).all();
    if(consumed.results.length!==1)throw new AuthError(401,'La solicitud venció o no es válida.');
    const token=await discord('oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.DISCORD_CLIENT_ID,client_secret:env.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:input.code,redirect_uri:callbackUri}).toString()});
    if(token.token_type?.toLowerCase()!=='bearer'||typeof token.access_token!=='string'||!Number.isFinite(token.expires_in)||token.expires_in<=0||!['identify','guilds.members.read'].every(scope=>token.scope?.split(' ').includes(scope)))throw new AuthError(401,'Discord no concedió los permisos necesarios.');
    const discordUser=await discord('users/@me',{headers:{Authorization:'Bearer '+token.access_token}});
    if(purpose==='launcher')await member(env,token.access_token,discordUser.id);else{const guild=await membership(env,token.access_token,discordUser.id);if(purpose==='admin'&&!adminRoles.some(id=>guild.roles.includes(id)))throw new AuthError(403,'Necesitas el rol Administrador u Owner para usar VillaWolf Administrador.');}
    const user={...await identity(env,discordUser),avatarUrl:avatarUrl(discordUser.id,discordUser.avatar)},sessionToken=nonce(),expiresAt=clock()+(purpose==='launcher'?Math.min(12*3600000,token.expires_in*1000):Math.min(30*86400000,typeof token.refresh_token==='string'?30*86400000:token.expires_in*1000));
    await env.DB.prepare('INSERT INTO discord_sessions VALUES(?,?,?,?,?,?)').bind(await digest(sessionToken),user.discordId,user.username,user.discordName,await encrypt(env,purpose==='launcher'?token.access_token:JSON.stringify({purpose,avatar:discordUser.avatar||null,accessToken:token.access_token,refreshToken:typeof token.refresh_token==='string'?token.refresh_token:null,accessExpiresAt:clock()+token.expires_in*1000})),expiresAt).run();
    return {ok:true,user,token:sessionToken,expiresAt};
  }
  async function session(env,token){
    if(!validNonce(token))throw new AuthError(401,'Inicia sesión con Discord para jugar.');
    const key=await digest(token),row=await env.DB.prepare('SELECT * FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(key,clock()).first();
    if(!row)throw new AuthError(401,'Inicia sesión con Discord para jugar.');
    try{await member(env,await decrypt(env,row.encrypted_access_token),row.discord_id);}
    catch(error){if([401,403].includes(error.status))await env.DB.prepare('DELETE FROM discord_sessions WHERE token_hash=?').bind(key).run();throw error;}
    // Releer por si hubo logout durante la consulta a Discord.
    if(!await env.DB.prepare('SELECT token_hash FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(key,clock()).first())throw new AuthError(401,'La sesión se cerró o venció.');
    return {ok:true,user:{id:'discord:'+row.discord_id,discordId:row.discord_id,username:row.username,discordName:row.discord_name,provider:'discord'},expiresAt:row.expires_at};
  }
  async function accessSession(env,token,route){
    if(!validNonce(token))throw new AuthError(401,'Inicia sesión con Discord.');
    const key=await digest(token),row=await env.DB.prepare('SELECT * FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(key,clock()).first();if(!row)throw new AuthError(401,'La sesión venció. Inicia sesión con Discord.');
    const decoded=await decrypt(env,row.encrypted_access_token);let bundle;try{bundle=JSON.parse(decoded);}catch{bundle={purpose:'launcher',accessToken:decoded,refreshToken:null,accessExpiresAt:row.expires_at};}
    const admin=route.startsWith('/v2/admin/');if(admin&&bundle.purpose!=='admin'||!admin&&bundle.purpose==='admin')throw new AuthError(403,'Esta sesión pertenece a otra aplicación.');
    if(bundle.accessExpiresAt<clock()+60000&&bundle.refreshToken){
      const renewed=await discord('oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.DISCORD_CLIENT_ID,client_secret:env.DISCORD_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:bundle.refreshToken}).toString()});
      if(typeof renewed.access_token!=='string'||renewed.token_type?.toLowerCase()!=='bearer'||!Number.isFinite(renewed.expires_in)||renewed.expires_in<=0||!['identify','guilds.members.read'].every(scope=>renewed.scope?.split(' ').includes(scope)))throw new AuthError(401,'Discord necesita una nueva autorización.');
      bundle={...bundle,accessToken:renewed.access_token,refreshToken:renewed.refresh_token||bundle.refreshToken,accessExpiresAt:clock()+renewed.expires_in*1000};await env.DB.prepare('UPDATE discord_sessions SET encrypted_access_token=? WHERE token_hash=? AND expires_at>?').bind(await encrypt(env,JSON.stringify(bundle)),key,clock()).run();
    }
    const snapshot=bundle.membershipSnapshot;
    const browseOnly=route==='/v2/catalog'||route==='/v2/admin/catalog';
    const reusable=browseOnly&&snapshot&&Number.isSafeInteger(snapshot.checkedAt)&&snapshot.checkedAt<=clock()&&clock()-snapshot.checkedAt<60000&&Array.isArray(snapshot.roles)&&snapshot.roles.every(snowflake)&&snapshot.user?.id===row.discord_id&&snapshot.pending===false;
    const fromBot=await roleBot.membership(env,env.DISCORD_GUILD_ID,row.discord_id);
    const guild=fromBot||(reusable?snapshot:await membership(env,bundle.accessToken,row.discord_id));
    if(!reusable&&bundle.purpose!=='launcher'){const membershipSnapshot={checkedAt:clock(),roles:[...guild.roles],pending:false,user:{id:row.discord_id,avatar:guild.user?.avatar||null}};const encrypted=await encrypt(env,JSON.stringify({...bundle,membershipSnapshot}));await env.DB.prepare('UPDATE discord_sessions SET encrypted_access_token=? WHERE token_hash=? AND expires_at>? AND encrypted_access_token=?').bind(encrypted,key,clock(),row.encrypted_access_token).run();}
    if(admin&&!adminRoles.some(id=>guild.roles.includes(id)))throw new AuthError(403,'Tu cuenta no tiene el rol Administrador u Owner.');
    if(!await env.DB.prepare('SELECT token_hash FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(key,clock()).first())throw new AuthError(401,'La sesión se cerró o venció.');
    const user={id:'discord:'+row.discord_id,discordId:row.discord_id,username:row.username,discordName:row.discord_name,provider:'discord',avatarUrl:avatarUrl(row.discord_id,guild.user?.avatar||bundle.avatar)};
    if(route==='/v2/session'||route==='/v2/admin/session')return {ok:true,user,expiresAt:row.expires_at,administrator:admin};
    const library=await catalog();if(route==='/v2/admin/catalog')return {ok:true,user,expiresAt:row.expires_at,catalog:library};
    const allowed=library.packs.filter(p=>p.enabled&&guild.roles.includes(p.roleId));
    if(route==='/v2/catalog')return {ok:true,user,expiresAt:row.expires_at,catalog:{schemaVersion:1,packs:allowed}};
    const id=route.slice('/v2/packs/'.length),pack=allowed.find(p=>p.id===id);if(!pack)throw new AuthError(403,'No tienes el rol de acceso a este modpack.');return {ok:true,user,expiresAt:row.expires_at,pack};
  }

  const cfApiCache=new Map();
  const cfUrl=raw=>{try{const u=new URL(raw);return ['https://edge.forgecdn.net','https://mediafilez.forgecdn.net'].includes(u.origin)&&!u.username&&!u.password&&!u.hash&&!u.search&&/^\/files\/[0-9]+\/[0-9]+\/[^/]+\.jar$/.test(u.pathname)?u:null;}catch{return null;}};
  async function cfApi(env,route,payload){
    if(typeof env.CURSEFORGE_API_KEY!=='string'||!env.CURSEFORGE_API_KEY.trim())throw new AuthError(503,'CurseForge aún no está conectado. Usa la descarga oficial manual.');
    const cacheKey=route+'|'+JSON.stringify(payload||null),cached=cfApiCache.get(cacheKey);if(cached&&cached.until>clock())return cached.value;
    const r=await fetchImpl('https://api.curseforge.com/v1/'+route,{method:payload?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json','x-api-key':env.CURSEFORGE_API_KEY,...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
    if(!r.ok)throw new AuthError(r.status===429?429:503,r.status===401||r.status===403?'CurseForge no autorizó la clave del servicio. Usa la descarga oficial manual.':'CurseForge no respondió. Puedes usar la descarga oficial manual.');
    const text=await r.text();if(encoder.encode(text).length>4*1024*1024)throw new AuthError(503,'Respuesta de CurseForge demasiado grande.');let value;try{value=JSON.parse(text).data;}catch{throw new AuthError(503,'Respuesta de CurseForge inválida.');}
    if(cfApiCache.size>=100)cfApiCache.delete(cfApiCache.keys().next().value);cfApiCache.set(cacheKey,{until:clock()+300000,value});return value;
  }
  const cfInteger=n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647;
  async function cfAllowedFiles(env,files){
    if(!Array.isArray(files)||files.length>100)throw new AuthError(503,'Archivos de CurseForge inválidos.');
    const ids=[...new Set(files.map(f=>f.modId))];if(!ids.every(cfInteger))throw new AuthError(503,'Proyectos de CurseForge inválidos.');
    const mods=ids.length?await cfApi(env,'mods',{modIds:ids}):[];
    if(!Array.isArray(mods))throw new AuthError(503,'Proyectos de CurseForge inválidos.');
    return files.filter(f=>cfInteger(f.id)&&f.isAvailable===true&&mods.some(m=>m.id===f.modId&&m.gameId===432&&m.allowModDistribution!==false)&&cfUrl(f.downloadUrl)&&Number.isSafeInteger(f.fileLength)&&f.fileLength>0&&f.fileLength<=128*1024*1024&&Array.isArray(f.hashes)&&f.hashes.some(h=>h.algo===1&&/^[a-f0-9]{40}$/i.test(h.value)));
  }
  async function cfMatches(env,token,input){
    await accessSession(env,token,'/v2/admin/catalog');
    if(!Array.isArray(input.files)||input.files.length<1||input.files.length>50||input.files.some(f=>!Number.isSafeInteger(f.fingerprint)||f.fingerprint<0||f.fingerprint>4294967295||!/^[a-f0-9]{40}$/.test(f.sha1||'')||!Number.isSafeInteger(f.bytes)||f.bytes<1||f.bytes>128*1024*1024))throw new AuthError(400,'Huellas de mods inválidas.');
    const value=await cfApi(env,'fingerprints/432',{fingerprints:input.files.map(f=>f.fingerprint)});
    const exact=value?.exactMatches;if(!Array.isArray(exact))throw new AuthError(503,'Huellas de CurseForge inválidas.');
    const files=await cfAllowedFiles(env,exact.map(m=>m.file));
    const matches=[];for(const f of input.files){const file=files.find(x=>x.fileLength===f.bytes&&x.hashes.some(h=>h.algo===1&&h.value.toLowerCase()===f.sha1));if(file)matches.push({sha1:f.sha1,bytes:f.bytes,url:file.downloadUrl,fileId:file.id,modId:file.modId});}return {ok:true,matches};
  }

  async function cfModIndex(response){
    const reader=response.body?.getReader();if(!reader)throw new AuthError(503,'Manifiesto no disponible.');const utf=new TextDecoder();let text='',start=-1,pos=0,depth=0,quoted=false,escaped=false;
    try{for(;;){if(text.length>=2*1024*1024)throw new AuthError(503,'Índice de mods demasiado grande.');const {done,value}=await reader.read();if(done)break;text+=utf.decode(value.subarray(0,2*1024*1024-text.length),{stream:true});if(start<0){const match=/"files"\s*:\s*\[/.exec(text);if(!match)continue;start=match.index+match[0].length-1;pos=start;}for(;pos<text.length;pos++){const c=text[pos];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='['||c==='{')depth++;else if(c===']'||c==='}'){depth--;if(depth===0){let index;try{index=JSON.parse(text.slice(0,pos+1)+'}');}catch{throw new AuthError(503,'Índice de mods inválido.');}return index;}}}}throw new AuthError(503,'Índice de mods incompleto.');}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  }

  async function cfDownload(env,token,input,admin){
    let target=input.url,fileId;
    if(admin){await accessSession(env,token,'/v2/admin/catalog');const u=cfUrl(target);if(!u)throw new AuthError(400,'Descarga de CurseForge inválida.');const match=/^\/files\/([0-9]+)\/([0-9]+)\//.exec(u.pathname);fileId=Number(match[1])*1000+Number(match[2]);if(!cfInteger(fileId)||Number(match[2])>=1000)throw new AuthError(400,'Archivo de CurseForge inválido.');}
    else{
      if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.packId||''))throw new AuthError(400,'Modpack inválido.');
      const library=await accessSession(env,token,'/v2/catalog'),pack=library.catalog.packs.find(p=>p.id===input.packId);if(!pack)throw new AuthError(403,'No tienes el rol de acceso a este modpack.');
      const response=await fetchImpl(catalogUrl.replace('/updates/catalog.json','/'+pack.manifestPath),{redirect:'manual',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new AuthError(503,'No se pudo verificar el modpack.');const manifest=await cfModIndex(response);
      if(manifest.packId!==pack.id||!Array.isArray(manifest.files)||manifest.files.length>500)throw new AuthError(503,'Manifiesto inválido.');
      const entry=manifest.files.find(f=>input.path?f.path===input.path:f.url===target);if(!entry||!/^[a-f0-9]{64}$/i.test(entry.sha256||''))throw new AuthError(403,'Este archivo no pertenece al modpack autorizado.');
      if(entry.acquisition==='user_official_download'){const page=/^https:\/\/www\.curseforge\.com\/minecraft\/mc-mods\/[a-z0-9-]+\/files\/([1-9][0-9]*)$/.exec(entry.pageUrl||'');if(!page)throw new AuthError(400,'Fuente oficial inválida.');fileId=Number(page[1]);}
      else{target=entry.url;const u=cfUrl(target);if(!u)throw new AuthError(400,'Fuente oficial inválida.');const match=/^\/files\/([0-9]+)\/([0-9]+)\//.exec(u.pathname);fileId=Number(match[1])*1000+Number(match[2]);if(Number(match[2])>=1000)throw new AuthError(400,'Archivo inválido.');}
    }
    if(!cfInteger(fileId))throw new AuthError(400,'Archivo inválido.');
    const responseFiles=await cfApi(env,'mods/files',{fileIds:[fileId]});const files=await cfAllowedFiles(env,responseFiles);const file=files.find(f=>f.id===fileId);if(!file)throw new AuthError(412,'Este mod requiere descarga desde su página oficial.');
    if(target&&decodeURIComponent(cfUrl(target)?.pathname||'')!==decodeURIComponent(new URL(file.downloadUrl).pathname))throw new AuthError(403,'La fuente no coincide con el archivo oficial.');
    let url=file.downloadUrl,response;
    for(let hop=0;hop<4;hop++){response=await fetchImpl(url,{redirect:'manual',signal:AbortSignal.timeout(120000),headers:{'x-api-key':env.CURSEFORGE_API_KEY}});if(![301,302,303,307,308].includes(response.status))break;const next=new URL(response.headers.get('location')||'',url);await response.body?.cancel();if(!cfUrl(next.href)||decodeURIComponent(next.pathname)!==decodeURIComponent(new URL(file.downloadUrl).pathname))throw new AuthError(503,'Redirección de CurseForge inválida.');url=next.href;}
    if(!response.ok||[301,302,303,307,308].includes(response.status)||!response.body)throw new AuthError(503,'No se pudo descargar desde CurseForge. Usa su página oficial.');
    const declared=Number(response.headers.get('content-length'));if(declared&&declared!==file.fileLength){await response.body.cancel();throw new AuthError(503,'Tamaño oficial de descarga incorrecto.');}
    let bytes=0;const stream=new TransformStream({transform(chunk,controller){bytes+=chunk.byteLength;if(bytes>file.fileLength||bytes>128*1024*1024)throw Error('Descarga excedida');controller.enqueue(chunk);},flush(){if(bytes!==file.fileLength)throw Error('Descarga incompleta');}});
    return new Response(response.body.pipeThrough(stream),{headers:{'Content-Type':'application/octet-stream','Content-Length':String(file.fileLength),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }


  const ghRepo='https://api.github.com/repos/tonyvillalobosmejia-netizen/champagne-vol5-modpack',ghBranch='preparacion-paso97';
  const ghSha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
  const ghUpdatePath=p=>typeof p==='string'&&(/^(?:updates\/(?:catalog|stable-v2|history)\.json|updates\/versions\/modpack-[0-9]+\.[0-9]+\.[0-9]+\.json)$/.test(p)||/^updates\/packs\/[a-z0-9][a-z0-9-]{0,63}\/(?:stable\.json|history\.json|versions\/modpack-[0-9]+\.[0-9]+\.[0-9]+\.json)$/.test(p));
  async function ghApi(env,path,method='GET',body){
    if(typeof env.GITHUB_TOKEN!=='string'||!env.GITHUB_TOKEN.trim())throw new AuthError(503,'La conexión central con GitHub todavía no está configurada.');
    const response=await fetchImpl(ghRepo+path,{method,redirect:'manual',signal:AbortSignal.timeout(45000),headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'VillaWolf-Administrador-Service',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const text=await response.text();if(encoder.encode(text).length>2*1024*1024)throw new AuthError(503,'Respuesta de GitHub demasiado grande.');let data;try{data=JSON.parse(text);}catch{throw new AuthError(503,'Respuesta de GitHub inválida.');}return{status:response.status,data};
  }
  async function ghRequired(env,path){const r=await ghApi(env,path);if(r.status!==200)throw new AuthError(503,'No se pudo verificar la publicación en GitHub.');return r.data;}
  async function ghGateway(env,token,input){
    const path=input.path,method=input.method||'GET',b=input.body;
    if(typeof path!=='string'||path.length>500||!path.startsWith('/')||path.includes('..')||path.includes('%')||path.includes('#'))throw new AuthError(400,'Ruta de GitHub inválida.');
    await accessSession(env,token,'/v2/admin/catalog');
    if(method==='GET'){
      let allowed=path==='/git/ref/heads/'+ghBranch||path==='/releases/latest'||/^\/git\/commits\/[a-f0-9]{40}$/.test(path);
      if(path.startsWith('/contents/')){const [name,query]=path.slice('/contents/'.length).split('?');const folder=/^updates\/(?:versions|packs\/[a-z0-9][a-z0-9-]{0,63}\/versions)$/.test(name);allowed=(ghUpdatePath(name)||folder)&&/^ref=[a-f0-9]{40}$/.test(query||'');}
      if(path.startsWith('/commits?')){const u=new URL(path,'https://github.invalid'),params=u.searchParams;allowed=u.pathname==='/commits'&&[...params.keys()].sort().join(',')==='path,per_page,sha'&&ghSha(params.get('sha'))&&ghUpdatePath(params.get('path'))&&params.get('per_page')==='1';}
      if(!allowed)throw new AuthError(403,'La conexión central sólo permite consultar actualizaciones de VillaWolf.');
    }else if(method==='POST'&&path==='/git/blobs'){
      if(b?.encoding!=='base64'||typeof b.content!=='string'||b.content.length>8*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(b.content))throw new AuthError(400,'Contenido de publicación inválido.');
      let content;try{content=decoder.decode(decodeBase64(b.content));JSON.parse(content);}catch{throw new AuthError(400,'Sólo se permite contenido JSON del modpack.');}
      if(/(?:github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,})/.test(content))throw new AuthError(400,'El contenido contiene una credencial y no puede publicarse.');
    }else if(method==='POST'&&path==='/git/trees'){
      if(!ghSha(b?.base_tree)||!Array.isArray(b.tree)||b.tree.length<1||b.tree.length>6||b.tree.some(n=>!ghUpdatePath(n.path)||n.mode!=='100644'||n.type!=='blob'||!ghSha(n.sha))||new Set(b.tree.map(n=>n.path)).size!==b.tree.length)throw new AuthError(403,'Sólo se permiten cambios de modpacks, catálogo e historial.');
    }else if(method==='POST'&&path==='/git/commits'){
      if(typeof b?.message!=='string'||b.message.length>200||!ghSha(b.tree)||!Array.isArray(b.parents)||b.parents.length!==1||!ghSha(b.parents[0]))throw new AuthError(400,'Commit de publicación inválido.');
    }else if(method==='PATCH'&&path==='/git/refs/heads/'+ghBranch){
      if(b?.force!==false||!ghSha(b.sha))throw new AuthError(403,'No se permite sobrescribir el historial.');
      const head=(await ghRequired(env,'/git/ref/heads/'+ghBranch)).object?.sha,commit=await ghRequired(env,'/git/commits/'+b.sha);
      if(!ghSha(head)||commit.parents?.length!==1||commit.parents[0].sha!==head)throw new AuthError(409,'Hubo una publicación simultánea. Vuelve a analizar antes de publicar.');
      const diff=await ghRequired(env,'/compare/'+head+'...'+b.sha);
      if(diff.total_commits!==1||!Array.isArray(diff.files)||diff.files.length<1||diff.files.length>6||diff.files.some(f=>!ghUpdatePath(f.filename)||!['added','modified'].includes(f.status)))throw new AuthError(403,'La publicación intenta modificar archivos fuera del modpack.');
      await accessSession(env,token,'/v2/admin/session');
    }else throw new AuthError(403,'Esta operación no está permitida por el publicador central.');
    const result=await ghApi(env,path,method,b);
    if([401,403,429].includes(result.status)){const error=new AuthError(result.status===429?429:503,'GitHub rechazó la conexión central. El Owner debe revisar el token, sus permisos o el límite de consultas.');if(result.status===429)error.retryAfter=60;throw error;}
    return {ok:true,upstreamStatus:result.status,data:result.data};
  }


  async function ghBlobUpload(env,token,request){
    await accessSession(env,token,'/v2/admin/catalog');if(!env.GITHUB_TOKEN)throw new AuthError(503,'La conexión central con GitHub todavía no está configurada.');if(request.headers.get('content-type')?.split(';')[0]!=='application/json'||!request.body)throw new AuthError(400,'Se requiere un archivo JSON del modpack.');
    if(Number(request.headers.get('content-length')||0)>64*1024*1024)throw new AuthError(413,'Paquete demasiado grande.');
    const reader=request.body.getReader(),first=[];let prefix='',size=0;try{while(prefix.length<34){const part=await reader.read();if(part.done)throw new AuthError(400,'Archivo incompleto.');size+=part.value.byteLength;first.push(part.value);prefix+=decoder.decode(part.value.subarray(0,2048-prefix.length));if(size>64*1024*1024)throw new AuthError(413,'Paquete demasiado grande.');}if(!/^\{"encoding":"utf-8","content":"[\[{]/.test(prefix))throw new AuthError(400,'Sólo se permite JSON del modpack.');}catch(error){await reader.cancel().catch(()=>{});throw error;}
    // Transferir el cuerpo ya preparado sin codificar ni cargar las imágenes en memoria.
    const stream=new ReadableStream({async pull(controller){try{if(first.length){controller.enqueue(first.shift());return;}const {done,value}=await reader.read();if(done){reader.releaseLock();controller.close();return;}size+=value.byteLength;if(size>64*1024*1024)throw Error('Paquete demasiado grande');controller.enqueue(value);}catch(error){controller.error(error);await reader.cancel().catch(()=>{});}},cancel:reason=>reader.cancel(reason)});
    const response=await fetchImpl(ghRepo+'/git/blobs',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(120000),headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'VillaWolf-Administrador-Service','Content-Type':'application/json'},body:stream});const text=await response.text();if(text.length>65536)throw new AuthError(503,'Respuesta de GitHub inválida.');let data;try{data=JSON.parse(text);}catch{throw new AuthError(503,'Respuesta de GitHub inválida.');}if(response.status!==201)throw new AuthError(503,'GitHub no pudo preparar el archivo. Revisa la conexión central.');return{ok:true,upstreamStatus:201,data};
  }

  async function handle(request,env){
    try{
      if(!env.DB||![env.DISCORD_CLIENT_ID,env.DISCORD_GUILD_ID,env.DISCORD_ROLE_ID].every(snowflake)||!env.DISCORD_CLIENT_SECRET||!/^[a-fA-F0-9]{64}$/.test(env.TOKEN_KEY||''))throw new AuthError(503,'El servicio de Discord todavía no está configurado.');
      if(request.headers.has('origin'))throw new AuthError(403,'Solicitud no permitida.');
      const url=new URL(request.url);if(url.search)throw new AuthError(400,'Solicitud inválida.');
      if(request.method==='POST'&&url.pathname==='/internal/role-bot')return reply(200,await roleBot.receive(request,env));
      if(request.method==='GET'&&url.pathname==='/health')return reply(200,{ok:true,provider:'discord',storage:'D1',version:'1.1.0',catalog:true,admin:true,discordRetry:true,catalogSnapshotSeconds:60,curseforgeApi:true,curseforgeConfigured:!!env.CURSEFORGE_API_KEY,githubPublishing:true,githubConfigured:!!env.GITHUB_TOKEN});
      const cfRoute=/^\/v2\/(?:admin\/)?curseforge\/(?:matches|download)$/.test(url.pathname),ghRoute=url.pathname==='/v2/admin/github'||url.pathname==='/v2/admin/github/status'||url.pathname==='/v2/admin/github/blob';
      const bucket=await digest((request.headers.get('CF-Connecting-IP')||'unknown')+':'+(cfRoute?'curseforge:':ghRoute?'github:':'')+Math.floor(clock()/60000));
      const count=await env.DB.prepare('INSERT INTO discord_limits VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,clock()+120000).all();
      if(count.results[0].count>(cfRoute?300:ghRoute?120:30))throw new AuthError(429,'Demasiadas solicitudes. Espera un minuto.');
      if(request.method==='POST'&&url.pathname==='/v1/discord/start')return reply(200,await start(env,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v1/discord/finish')return reply(200,await finish(env,await body(request)));
      const authorization=request.headers.get('authorization'),token=authorization?.startsWith('Bearer ')?authorization.slice(7):null;
      if(request.method==='GET'&&url.pathname==='/v2/admin/github/status'){await accessSession(env,token,'/v2/admin/catalog');return reply(200,{ok:true,configured:!!env.GITHUB_TOKEN});}
      if(request.method==='POST'&&url.pathname==='/v2/admin/github/blob')return reply(200,await ghBlobUpload(env,token,request));
      if(request.method==='POST'&&url.pathname==='/v2/admin/github')return reply(200,await ghGateway(env,token,await body(request,9*1024*1024)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/curseforge/matches')return reply(200,await cfMatches(env,token,await body(request)));
      if(request.method==='POST'&&['/v2/admin/curseforge/download','/v2/curseforge/download'].includes(url.pathname))return await cfDownload(env,token,await body(request),url.pathname.startsWith('/v2/admin/'));
      if(request.method==='GET'&&(['/v2/session','/v2/catalog','/v2/admin/session','/v2/admin/catalog'].includes(url.pathname)||/^\/v2\/packs\/[a-z0-9][a-z0-9-]{0,63}$/.test(url.pathname)))return reply(200,await accessSession(env,request.headers.get('authorization')?.replace(/^Bearer /,''),url.pathname));
      if(request.method==='GET'&&url.pathname==='/v1/session')return reply(200,await session(env,token));
      if(request.method==='POST'&&url.pathname==='/v1/logout'){if(validNonce(token))await env.DB.prepare('DELETE FROM discord_sessions WHERE token_hash=?').bind(await digest(token)).run();return reply(200,{ok:true});}
      throw new AuthError(404,'Ruta no encontrada.');
    }catch(error){return reply(error.status||503,{ok:false,message:error.status?error.message:'El servicio no pudo comprobar el acceso. Intenta nuevamente.',...(error.retryAfter?{retryAfter:error.retryAfter}:{})});}
  }
  async function cleanup(env){return env.DB.batch(['discord_flows','discord_sessions','discord_limits'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(clock())));}
  return {fetch:handle,scheduled:(_event,env,ctx)=>ctx.waitUntil(cleanup(env))};
}
export default createWorker();
