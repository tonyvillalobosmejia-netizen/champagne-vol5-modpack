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

export function createWorker({fetchImpl=fetch,clock=Date.now}={}){
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
  async function body(request){
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new AuthError(415,'Se requiere JSON.');
    const reader=request.body?.getReader();if(!reader)throw new AuthError(400,'Solicitud inválida.');
    const parts=[];let size=0;
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw new AuthError(413,'Solicitud demasiado grande.');}parts.push(value);}}
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
    const guild=await membership(env,bundle.accessToken,row.discord_id);if(admin&&!adminRoles.some(id=>guild.roles.includes(id)))throw new AuthError(403,'Tu cuenta no tiene el rol Administrador u Owner.');
    if(!await env.DB.prepare('SELECT token_hash FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(key,clock()).first())throw new AuthError(401,'La sesión se cerró o venció.');
    const user={id:'discord:'+row.discord_id,discordId:row.discord_id,username:row.username,discordName:row.discord_name,provider:'discord',avatarUrl:avatarUrl(row.discord_id,guild.user?.avatar||bundle.avatar)};
    if(route==='/v2/session'||route==='/v2/admin/session')return {ok:true,user,expiresAt:row.expires_at,administrator:admin};
    const library=await catalog();if(route==='/v2/admin/catalog')return {ok:true,user,expiresAt:row.expires_at,catalog:library};
    const allowed=library.packs.filter(p=>p.enabled&&guild.roles.includes(p.roleId));
    if(route==='/v2/catalog')return {ok:true,user,expiresAt:row.expires_at,catalog:{schemaVersion:1,packs:allowed}};
    const id=route.slice('/v2/packs/'.length),pack=allowed.find(p=>p.id===id);if(!pack)throw new AuthError(403,'No tienes el rol de acceso a este modpack.');return {ok:true,user,expiresAt:row.expires_at,pack};
  }
  async function handle(request,env){
    try{
      if(!env.DB||![env.DISCORD_CLIENT_ID,env.DISCORD_GUILD_ID,env.DISCORD_ROLE_ID].every(snowflake)||!env.DISCORD_CLIENT_SECRET||!/^[a-fA-F0-9]{64}$/.test(env.TOKEN_KEY||''))throw new AuthError(503,'El servicio de Discord todavía no está configurado.');
      if(request.headers.has('origin'))throw new AuthError(403,'Solicitud no permitida.');
      const url=new URL(request.url);if(url.search)throw new AuthError(400,'Solicitud inválida.');
      if(request.method==='GET'&&url.pathname==='/health')return reply(200,{ok:true,provider:'discord',storage:'D1',version:'1.1.0',catalog:true,admin:true,discordRetry:true});
      const bucket=await digest((request.headers.get('CF-Connecting-IP')||'unknown')+':'+Math.floor(clock()/60000));
      const count=await env.DB.prepare('INSERT INTO discord_limits VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,clock()+120000).all();
      if(count.results[0].count>30)throw new AuthError(429,'Demasiadas solicitudes. Espera un minuto.');
      if(request.method==='POST'&&url.pathname==='/v1/discord/start')return reply(200,await start(env,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v1/discord/finish')return reply(200,await finish(env,await body(request)));
      const authorization=request.headers.get('authorization'),token=authorization?.startsWith('Bearer ')?authorization.slice(7):null;
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
