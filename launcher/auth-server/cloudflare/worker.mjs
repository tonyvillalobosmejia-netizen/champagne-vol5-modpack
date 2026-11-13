import {createApplicationReports} from './application-reports.mjs';
import {officialDownloadResponse} from './official-download-stream.mjs';
import {publicationMetadata} from './publication-metadata.mjs';
import {createManualAnnouncements} from './manual-announcements.mjs';
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
function communityPackFields(pack){
  if(pack.guildId!==undefined&&!snowflake(pack.guildId))throw new AuthError(400,'Servidor del lanzador inválido.');
  if(pack.description!==undefined&&(typeof pack.description!=='string'||pack.description.length>4000))throw new AuthError(400,'Descripción del lanzador inválida.');
  if(pack.announcements!==undefined){
    if(!pack.announcements||typeof pack.announcements!=='object'||Array.isArray(pack.announcements))throw new AuthError(400,'Anuncios del lanzador inválidos.');
    for(const kind of ['modpack','launcher']){const a=pack.announcements[kind];if(a===undefined)continue;if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.enabled!=='boolean'||a.enabled&&(!snowflake(a.channelId)||typeof a.mentionRole!=='boolean'))throw new AuthError(400,'Canal o mención del lanzador inválidos.');}
  }
}
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
  if(!id(p.guildId)||(!allowed.has(p.guildId)&&env.ROLE_BOT_MULTI_GUILD!=='true')||!/^[-a-f0-9]{36}$/.test(p.generation||'')||!Number.isSafeInteger(p.sequence)||p.sequence<1||!Number.isSafeInteger(p.sentAt)||Math.abs(clock()-p.sentAt)>60000||!['reset','members','ready','heartbeat','offline','metadata'].includes(p.kind))throw error(400,'Actualización inválida.');
  const members=p.kind==='members'?p.members:[];
  if(!Array.isArray(members)||members.length< (p.kind==='members'?1:0)||members.length>50||new Set(members.map(m=>m.id)).size!==members.length||members.some(m=>!id(m.id)||typeof m.present!=='boolean'||typeof m.pending!=='boolean'||!Array.isArray(m.roles)||m.roles.length>250||m.roles.some(r=>!id(r))||(m.avatar!==null&&!(typeof m.avatar==='string'&&/^(?:a_)?[a-f0-9]{32}$/.test(m.avatar)))))throw error(400,'Miembros inválidos.');
  if(p.kind==='metadata'){const m=p.metadata;if(!m||!Array.isArray(m.roles)||!Array.isArray(m.channels)||m.roles.length>250||m.channels.length>500||new Set(m.roles.map(r=>r.id)).size!==m.roles.length||new Set(m.channels.map(c=>c.id)).size!==m.channels.length||m.roles.some(r=>!id(r.id)||typeof r.mentionable!=='boolean')||m.channels.some(c=>!id(c.id)||!Number.isSafeInteger(c.type)||typeof c.permissions!=='string'||!/^\d{1,24}$/.test(c.permissions)))throw error(400,'Metadatos de comunidad inválidos.');}
  const statements=[];
  if(p.kind==='reset'){
   statements.push(env.DB.prepare('INSERT INTO role_bot_state(guild_id,generation,sequence,ready,last_seen,last_message_at,message_signature) VALUES(?,?,?,0,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET generation=excluded.generation,sequence=excluded.sequence,ready=0,last_seen=excluded.last_seen,last_message_at=excluded.last_message_at,message_signature=excluded.message_signature WHERE excluded.last_message_at>role_bot_state.last_message_at AND excluded.generation<>role_bot_state.generation').bind(p.guildId,p.generation,p.sequence,clock(),p.sentAt,signature));
   statements.push(env.DB.prepare('DELETE FROM role_bot_members WHERE guild_id=? AND EXISTS(SELECT 1 FROM role_bot_state WHERE guild_id=? AND generation=? AND sequence=? AND message_signature=?)').bind(p.guildId,p.guildId,p.generation,p.sequence,signature));
  }else{
   statements.push(env.DB.prepare('UPDATE role_bot_state SET sequence=?,last_seen=?,last_message_at=?,message_signature=?,ready=CASE WHEN ?=\'ready\' THEN 1 WHEN ?=\'offline\' THEN 0 ELSE ready END WHERE guild_id=? AND generation=? AND sequence<?').bind(p.sequence,clock(),p.sentAt,signature,p.kind,p.kind,p.guildId,p.generation,p.sequence));
   for(const m of members)statements.push(env.DB.prepare('INSERT INTO role_bot_members(guild_id,discord_id,generation,roles,present,pending,avatar) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM role_bot_state WHERE guild_id=? AND generation=? AND sequence=? AND message_signature=?) ON CONFLICT(guild_id,discord_id) DO UPDATE SET generation=excluded.generation,roles=excluded.roles,present=excluded.present,pending=excluded.pending,avatar=excluded.avatar').bind(p.guildId,m.id,p.generation,JSON.stringify(m.roles),Number(m.present),Number(m.pending),m.avatar,p.guildId,p.generation,p.sequence,signature));
  }
  if(p.kind==='metadata')statements.push(env.DB.prepare('INSERT INTO role_bot_communities(guild_id,generation,metadata,checked_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM role_bot_state WHERE guild_id=? AND generation=? AND sequence=? AND message_signature=?) ON CONFLICT(guild_id) DO UPDATE SET generation=excluded.generation,metadata=excluded.metadata,checked_at=excluded.checked_at').bind(p.guildId,p.generation,JSON.stringify(p.metadata),clock(),p.guildId,p.generation,p.sequence,signature));
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
 async function metadata(env,guildId){if(env.ROLE_BOT_ENABLED!=='true')return null;const state=await env.DB.prepare('SELECT * FROM role_bot_state WHERE guild_id=?').bind(guildId).first();if(!state||state.ready!==1||state.last_seen>clock()||clock()-state.last_seen>90000)return null;const row=await env.DB.prepare('SELECT * FROM role_bot_communities WHERE guild_id=? AND generation=?').bind(guildId,state.generation).first();if(!row||row.checked_at>clock()||clock()-row.checked_at>90000)return null;return JSON.parse(row.metadata);}
 return{receive,membership,metadata};
}

export function publicationChanges(previous,current){
  const changes=[];
  if(!previous)changes.push('Primera publicación del lanzador.');
  if(previous&&previous.version!==current.version)changes.push('Versión: '+previous.version+' → '+current.version+'.');
  if(previous?.game?.packName!==current.game?.packName)changes.push(previous?'Nombre del lanzador actualizado.':'Nombre e identidad inicial configurados.');
  if(previous?.game?.minecraftVersion!==current.game?.minecraftVersion)changes.push('Minecraft: '+current.game.minecraftVersion+'.');
  if(previous?.game?.forgeVersion!==current.game?.forgeVersion)changes.push('Forge: '+current.game.forgeVersion+'.');
  for(const [key,label]of [['files','Mods'],['content','Archivos y configuraciones']]){
    const before=key==='files'?previous?.files:previous?.content?.files,after=key==='files'?current.files:current.content?.files;
    if(!Array.isArray(after)||previous&&!Array.isArray(before))throw new AuthError(400,'No se puede verificar el resumen de archivos de la publicación.');
    const old=new Map((before||[]).map(f=>[f.path,f])),next=new Map(after.map(f=>[f.path,f]));
    const added=after.filter(f=>!old.has(f.path)).length,removed=[...old.keys()].filter(p=>!next.has(p)).length;
    const changed=after.filter(f=>old.has(f.path)&&(f.sha256||f.sha1)!==(old.get(f.path).sha256||old.get(f.path).sha1)).length;
    if(added||removed||changed)changes.push(label+': '+added+' añadidos, '+changed+' modificados y '+removed+' retirados.');
  }
  const oldPresentation=previous?.presentation||{},nextPresentation=current.presentation||{};
  if(oldPresentation.background?.sha256!==nextPresentation.background?.sha256)changes.push(nextPresentation.background?'Fondo del lanzador actualizado.':'Fondo retirado; se utiliza VillaWolf.');
  for(const [key,label]of [['news','Noticias'],['updates','Tarjeta de actualizaciones'],['notes','Notas de versión']]){
    const a=oldPresentation[key],b=nextPresentation[key];if(a?.title!==b?.title||a?.text!==b?.text)changes.push(label+' actualizadas.');
  }
  return changes.length?changes:['Sin diferencias de versión, contenido o diseño en el manifiesto.'];
}

export function createNotificationOutbox({clock=Date.now}={}){
  async function enqueue(env,{eventId,guildId,channelId,payload}){
    if(typeof eventId!=='string'||eventId.length>300||!snowflake(guildId)||!snowflake(channelId))throw new AuthError(400,'Destino del anuncio inválido.');
    const raw=JSON.stringify(payload);if(encoder.encode(raw).length>8192)throw new AuthError(400,'Anuncio demasiado grande.');
    const id=await digest(eventId+'|'+guildId+'|'+channelId);
    await env.DB.prepare('INSERT INTO notification_jobs(id,guild_id,channel_id,payload,created_at,due_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,guildId,channelId,raw,clock(),clock()).run();return id;
  }
  async function claim(env,guildIds){
    if(!Array.isArray(guildIds)||guildIds.length>50||guildIds.some(id=>!snowflake(id)))throw new AuthError(400,'Comunidades inválidas.');
    await env.DB.prepare("UPDATE notification_jobs SET status='uncertain',claim_token=NULL WHERE status='leased' AND lease_until<=?").bind(clock()).run();
    for(const gid of [...new Set(guildIds)]){
      const row=await env.DB.prepare("SELECT * FROM notification_jobs WHERE guild_id=? AND status IN ('pending','uncertain') AND due_at<=? AND lease_until<=? ORDER BY created_at LIMIT 1").bind(gid,clock(),clock()).first();if(!row)continue;
      const token=nonce(),claimed=await env.DB.prepare("UPDATE notification_jobs SET status='leased',claim_token=?,lease_until=?,attempts=attempts+1 WHERE id=? AND status=? AND lease_until<=? RETURNING id").bind(token,clock()+120000,row.id,row.status,clock()).all();
      if(claimed.results.length)return{id:row.id,guildId:row.guild_id,channelId:row.channel_id,payload:JSON.parse(row.payload),createdAt:row.created_at,claimToken:token,reconcile:row.status==='uncertain'};
    }return null;
  }
  async function acknowledge(env,input){
    if(!/^[a-f0-9]{64}$/.test(input.id||'')||!validNonce(input.claimToken)||!['sent','retry','uncertain'].includes(input.outcome)||input.outcome==='sent'&&!snowflake(input.messageId))throw new AuthError(400,'Resultado del envío inválido.');
    const status=input.outcome==='sent'?'sent':input.outcome==='retry'?'pending':'uncertain',delay=input.outcome==='sent'?0:Math.max(30000,Math.min(Number(input.retryAfterMs)||60000,86400000));
    const r=await env.DB.prepare("UPDATE notification_jobs SET status=?,message_id=?,due_at=?,lease_until=0,claim_token=NULL WHERE id=? AND status='leased' AND claim_token=? RETURNING id").bind(status,input.messageId||null,clock()+delay,input.id,input.claimToken).all();
    if(!r.results.length)throw new AuthError(409,'El envío ya fue atendido o su reserva cambió.');return{ok:true};
  }
  return{enqueue,claim,acknowledge};
}

export function createReleaseAnnouncements({fetchImpl=fetch,clock=Date.now,outbox,loadCatalog}){
  const versionParts=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v)&&v.length<=40?v.split('.').map(Number):null;
  const newer=(a,b)=>{const x=versionParts(a),y=versionParts(b);if(!x||!y)return false;for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i];}return false;};
  async function check(env){
    const cursors=(await env.DB.prepare('SELECT * FROM release_cursors').all()).results;
    const response=await fetchImpl('https://api.github.com/repos/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases?per_page=30',{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json','User-Agent':'VillaWolf-Release-Announcements',...(env.GITHUB_TOKEN?{Authorization:'Bearer '+env.GITHUB_TOKEN}:{})}});
    if(!response.ok)throw new AuthError(503,'Los anuncios de versiones esperan a GitHub.');
    const raw=await response.text();if(encoder.encode(raw).length>4*1024*1024)throw new AuthError(503,'Lista de versiones demasiado grande.');
    let releases;try{releases=JSON.parse(raw);}catch{throw new AuthError(503,'Lista de versiones inválida.');}
    if(!Array.isArray(releases))throw new AuthError(503,'Lista de versiones inválida.');
    let catalog=null;try{catalog=await loadCatalog(env);}catch{} // Fallar el catálogo no bloquea destinos oficiales.
    let queued=0;const observed=[];
    const save=(kind,version)=>env.DB.prepare('INSERT INTO release_cursors(kind,version,checked_at) VALUES(?,?,?) ON CONFLICT(kind) DO UPDATE SET version=excluded.version,checked_at=excluded.checked_at').bind(kind,version,clock()).run();
    for(const kind of ['launcher','admin']){
      const prefix=kind==='launcher'?'v':'admin-v';
      const candidates=releases.filter(r=>r.draft===false&&r.prerelease===false&&typeof r.tag_name==='string'&&r.tag_name.startsWith(prefix)&&versionParts(r.tag_name.slice(prefix.length))&&Number.isFinite(Date.parse(r.published_at))&&Date.parse(r.published_at)<=clock()&&Array.isArray(r.assets)&&r.assets.some(a=>a.name===('VillaWolf.'+(kind==='launcher'?'Launcher':'Administrador')+'.Setup.'+r.tag_name.slice(prefix.length)+'.exe'))).sort((a,b)=>newer(a.tag_name.slice(prefix.length),b.tag_name.slice(prefix.length))?-1:1);
      const release=candidates[0];if(!release)continue;
      const version=release.tag_name.slice(prefix.length),officialKey='official-'+kind,prior=cursors.find(c=>c.kind===officialKey);
      const channelId=kind==='launcher'?'1559334945372250314':env.ADMIN_RELEASE_CHANNEL_ID;
      const notes='Ya está disponible la versión '+version+'. Actualiza la aplicación para utilizarla.';
      const enqueue=async d=>{await outbox.enqueue(env,{eventId:'release:'+kind+':'+version+':'+(d.mentionRole?d.roleId:'silent'),guildId:d.guildId,channelId:d.channelId,payload:{kind,name:kind==='launcher'?'VillaWolf Launcher':'VillaWolf Administrador',version,notes,...(d.roleId?{roleId:d.roleId}:{}),mentionRole:d.mentionRole}});queued++;};
      observed.push({kind,current:prior?.version||null,latest:version});
      if(!prior){
        // Cancelar únicamente pendientes oficiales anteriores; nunca anunciar el historial al activar.
        if(snowflake(channelId))await env.DB.prepare("UPDATE notification_jobs SET status='superseded',claim_token=NULL,lease_until=0 WHERE guild_id=? AND channel_id=? AND json_extract(payload,'$.kind')=? AND status IN ('pending','uncertain','leased')").bind(env.DISCORD_GUILD_ID,channelId,kind).run();
        await save(officialKey,version);
      }else if(newer(version,prior.version)&&snowflake(channelId)&&(kind!=='admin'||snowflake(env.ADMIN_RELEASE_ROLE_ID))){
        await enqueue({guildId:env.DISCORD_GUILD_ID,channelId,mentionRole:kind==='admin',...(kind==='admin'?{roleId:env.ADMIN_RELEASE_ROLE_ID}:{})});
        await save(officialKey,version);
      }
      // Mantener los anuncios configurables y su cursor existentes, independientes del destino oficial.
      if(kind==='launcher'&&catalog){
        const current=cursors.find(c=>c.kind===kind)?.version||'0.1.17';
        if(newer(version,current)||version===current&&newer(version,'0.1.17')){
          const destinations=catalog.packs.filter(p=>p.enabled&&p.announcements?.launcher?.enabled).map(p=>({guildId:p.guildId||env.DISCORD_GUILD_ID,channelId:p.announcements.launcher.channelId,roleId:p.roleId,mentionRole:!!p.announcements.launcher.mentionRole}));
          for(const d of destinations.filter((d,i,all)=>all.findIndex(x=>x.guildId===d.guildId&&x.channelId===d.channelId&&x.roleId===d.roleId)===i))await enqueue(d);
          await save(kind,version);
        }
      }
    }return{ok:true,queued,observed};
  }return{check};
}

export function createWorker({fetchImpl=fetch,clock=Date.now}={}){
  const roleBot=createRoleBotStore({clock}),outbox=createNotificationOutbox({clock});
  const manualAnnouncements=createManualAnnouncements({authorize:(env,token)=>accessSession(env,token,'/v2/admin/session'),packFor:async(env,id)=>(await catalog(env)).packs.find(p=>p.id===id),metadata:roleBot.metadata,membership:roleBot.membership,outbox,clock,digest});
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
  async function membership(env,accessToken,discordId,guildId=env.DISCORD_GUILD_ID){
    const fromBot=await roleBot.membership(env,guildId,discordId);if(fromBot)return fromBot;
    const value=await discord(`users/@me/guilds/${guildId}/member`,{headers:{Authorization:'Bearer '+accessToken}});
    if(!Array.isArray(value.roles)||value.roles.some(id=>!snowflake(id))||(value.user&&value.user.id!==discordId)||value.pending===true)throw new AuthError(403,'Completa tu acceso al Discord de VillaWolf.');return value;
  }
  async function catalog(env){
    let value;if(env.GITHUB_TOKEN){value=await githubJson(env,'updates/catalog.json',ghBranch);}else{
    let response;try{response=await fetchImpl(catalogUrl,{redirect:'manual',signal:AbortSignal.timeout(10000)});}catch{throw new AuthError(503,'No se pudo consultar la biblioteca de modpacks.');}
    if(response.status===404)value=catalogSeed;else{if(!response.ok)throw new AuthError(503,'La biblioteca no está disponible.');const text=await response.text();if(encoder.encode(text).length>65536)throw new AuthError(503,'Catálogo demasiado grande.');try{value=JSON.parse(text);}catch{throw new AuthError(503,'Catálogo inválido.');}}}
    if(value?.schemaVersion!==1||!Array.isArray(value.packs)||value.packs.length>50)throw new AuthError(503,'Catálogo inválido.');
    const ids=new Set();for(const p of value.packs){const expected=p.id==='champagne-vol5'?'updates/stable-v2.json':'updates/packs/'+p.id+'/stable.json';if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(p.id||'')||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80||!snowflake(p.roleId)||typeof p.enabled!=='boolean'||p.manifestPath!==expected)throw new AuthError(503,'Catálogo inválido.');communityPackFields(p);ids.add(p.id);}const deleted=value.deletedPacks||[];if(!Array.isArray(deleted)||deleted.length>1000||new Set(deleted).size!==deleted.length)throw new AuthError(503,'Registro de eliminaciones inválido.');
    const recorded=JSON.parse((await env.DB.prepare('SELECT json_group_array(pack_id) AS ids FROM deleted_packs').first())?.ids||'[]');const deletedPacks=[...new Set([...deleted,...recorded])];if(deletedPacks.length>1000||deletedPacks.some(id=>typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)))throw new AuthError(503,'Registro de eliminaciones inválido.');return{...value,packs:value.packs.filter(p=>!deletedPacks.includes(p.id)),...(deletedPacks.length?{deletedPacks}:{})};
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
    if(purpose==='launcher')await member(env,token.access_token,discordUser.id);else if(purpose==='admin'){const guild=await membership(env,token.access_token,discordUser.id);if(purpose==='admin'&&!adminRoles.some(id=>guild.roles.includes(id)))throw new AuthError(403,'Necesitas el rol Administrador u Owner para usar VillaWolf Administrador.');}
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
    const browseOnly=route==='/v2/catalog'||route==='/v2/admin/catalog';
    const snapshots={...(bundle.membershipSnapshots||{})};
    if(bundle.membershipSnapshot)snapshots[env.DISCORD_GUILD_ID]=bundle.membershipSnapshot;
    let snapshotsChanged=false;
    async function guildMembership(guildId){
      const snapshot=snapshots[guildId];
      const reusable=browseOnly&&snapshot&&Number.isSafeInteger(snapshot.checkedAt)&&snapshot.checkedAt<=clock()&&clock()-snapshot.checkedAt<60000&&Array.isArray(snapshot.roles)&&snapshot.roles.every(snowflake)&&snapshot.user?.id===row.discord_id&&snapshot.pending===false;
      const fromBot=await roleBot.membership(env,guildId,row.discord_id);
      const guild=fromBot||(reusable?snapshot:await membership(env,bundle.accessToken,row.discord_id,guildId));
      if(!reusable){snapshots[guildId]={checkedAt:clock(),roles:[...guild.roles],pending:false,user:{id:row.discord_id,avatar:guild.user?.avatar||null}};snapshotsChanged=true;}
      return guild;
    }
    let central=null;if(admin){central=await guildMembership(env.DISCORD_GUILD_ID);if(!adminRoles.some(id=>central.roles.includes(id)))throw new AuthError(403,'Tu cuenta no tiene el rol Administrador u Owner.');}
    if(!await env.DB.prepare('SELECT token_hash FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(key,clock()).first())throw new AuthError(401,'La sesión se cerró o venció.');
    const user={id:'discord:'+row.discord_id,discordId:row.discord_id,username:row.username,discordName:row.discord_name,provider:'discord',avatarUrl:avatarUrl(row.discord_id,central?.user?.avatar||bundle.avatar)};
    if(route==='/v2/session'||route==='/v2/admin/session')return {ok:true,user,expiresAt:row.expires_at,administrator:admin};
    const library=await catalog(env);if(route==='/v2/admin/catalog')return {ok:true,user,expiresAt:row.expires_at,catalog:library};
    const target=route.startsWith('/v2/packs/')?route.slice('/v2/packs/'.length):null;
    const candidates=library.packs.filter(p=>p.enabled&&(!target||p.id===target));
    const memberships=new Map();for(const p of candidates){const gid=p.guildId||env.DISCORD_GUILD_ID;if(memberships.has(gid))continue;try{memberships.set(gid,await guildMembership(gid));}catch(e){if(e.status===403)memberships.set(gid,null);else throw e;}}
    const allowed=candidates.filter(p=>memberships.get(p.guildId||env.DISCORD_GUILD_ID)?.roles.includes(p.roleId));
    if(snapshotsChanged&&bundle.purpose!=='launcher'){const membershipSnapshots=Object.fromEntries(Object.entries(snapshots).filter(([gid])=>gid===env.DISCORD_GUILD_ID||library.packs.some(p=>p.guildId===gid)).slice(0,51));await env.DB.prepare('UPDATE discord_sessions SET encrypted_access_token=? WHERE token_hash=? AND expires_at>? AND encrypted_access_token=?').bind(await encrypt(env,JSON.stringify({...bundle,membershipSnapshots,membershipSnapshot:undefined})),key,clock(),row.encrypted_access_token).run();}
    if(route==='/v2/catalog')return {ok:true,user,expiresAt:row.expires_at,catalog:{schemaVersion:1,packs:allowed,...(library.deletedPacks?.length?{deletedPacks:library.deletedPacks}:{})}};
    const pack=allowed.find(p=>p.id===target);if(!pack)throw new AuthError(403,'No tienes el rol de acceso a este modpack.');return {ok:true,user,expiresAt:row.expires_at,pack};
  }

  const releaseAnnouncements=createReleaseAnnouncements({fetchImpl,clock,outbox,loadCatalog:catalog});
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
    return officialDownloadResponse(response.body,file.fileLength);
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
    const verifiedActor=await accessSession(env,token,'/v2/admin/catalog');
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
      if(diff.files.some(f=>f.filename==='updates/catalog.json')){
        const proposed=await ghRequired(env,'/contents/updates/catalog.json?ref='+b.sha);let candidate;
        try{candidate=JSON.parse(decoder.decode(decodeBase64(proposed.content.replace(/\s/g,''))));}catch{throw new AuthError(400,'Catálogo preparado inválido.');}
        if(candidate.schemaVersion!==1||!Array.isArray(candidate.packs)||candidate.packs.length>50)throw new AuthError(400,'Catálogo preparado inválido.');
        for(const pack of candidate.packs){communityPackFields(pack);if((pack.guildId!==undefined||pack.announcements!==undefined)&&diff.files.some(f=>f.filename===pack.manifestPath))await communityCheck(env,token,{guildId:pack.guildId||env.DISCORD_GUILD_ID,roleId:pack.roleId,announcements:pack.announcements});}
      }
      await accessSession(env,token,'/v2/admin/session');
      await env.DB.prepare('INSERT INTO publication_receipts(commit_sha,actor_id,actor_name,confirmed,created_at) VALUES(?,?,?,0,?) ON CONFLICT(commit_sha) DO NOTHING').bind(b.sha,verifiedActor.user.discordId,verifiedActor.user.discordName||verifiedActor.user.username,clock()).run();
      const reservedActor=await env.DB.prepare('SELECT actor_id FROM publication_receipts WHERE commit_sha=?').bind(b.sha).first();if(reservedActor?.actor_id!==verifiedActor.user.discordId)throw new AuthError(403,'Otro administrador preparó esta publicación. Vuelve a analizar los cambios.');
    }else throw new AuthError(403,'Esta operación no está permitida por el publicador central.');
    const result=await ghApi(env,path,method,b);
    if(method==='PATCH'&&path==='/git/refs/heads/'+ghBranch&&result.status===200)await env.DB.prepare('UPDATE publication_receipts SET confirmed=1 WHERE commit_sha=?').bind(b.sha).run();
    if([401,403,429].includes(result.status)){const error=new AuthError(result.status===429?429:503,'GitHub rechazó la conexión central. El Owner debe revisar el token, sus permisos o el límite de consultas.');if(result.status===429)error.retryAfter=60;throw error;}
    return {ok:true,upstreamStatus:result.status,data:result.data};
  }



  async function deletePublishedPack(env,token,input){
    if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.packId||'')||typeof input.confirmName!=='string')throw new AuthError(400,'Confirma el lanzador que deseas eliminar.');
    const deletionSession=await accessSession(env,token,'/v2/admin/session');
    const release=await ghRequired(env,'/releases/latest'),version=String(release.tag_name||'').replace(/^v/,'').split('.').map(Number);if(version.length!==3||version.some(n=>!Number.isInteger(n)||n<0)||version[0]===0&&(version[1]===0||version[1]===1&&version[2]<17))throw new AuthError(412,'Publica primero Launcher 0.1.17 para distribuir la limpieza a los jugadores.');
    const id=input.packId,head=(await ghRequired(env,'/git/ref/heads/'+ghBranch)).object?.sha;if(!ghSha(head))throw new AuthError(503,'Referencia de GitHub inválida.');
    const commit=await ghRequired(env,'/git/commits/'+head),snapshot=await ghRequired(env,'/git/trees/'+commit.tree.sha+'?recursive=1');if(snapshot.truncated||!Array.isArray(snapshot.tree))throw new AuthError(503,'No se pudo obtener el árbol completo del repositorio.');
    const catalogFile=await ghRequired(env,'/contents/updates/catalog.json?ref='+head);let current;try{current=JSON.parse(decoder.decode(decodeBase64(catalogFile.content.replace(/\s/g,''))));}catch{throw new AuthError(503,'Catálogo inválido en GitHub.');}
    if(current.schemaVersion!==1||!Array.isArray(current.packs)||current.packs.length>50)throw new AuthError(503,'Catálogo inválido en GitHub.');
    const entry=current.packs.find(p=>p.id===id),deleted=current.deletedPacks||[];if(!Array.isArray(deleted)||deleted.some(x=>typeof x!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(x)))throw new AuthError(503,'Registro de eliminaciones inválido.');
    if(!entry){if(!deleted.includes(id))throw new AuthError(404,'El lanzador no está publicado.');await env.DB.prepare('INSERT INTO deleted_packs(pack_id,deleted_at) VALUES(?,?) ON CONFLICT(pack_id) DO NOTHING').bind(id,clock()).run();return{ok:true,deleted:true,alreadyDeleted:true,packId:id};}
    if(input.confirmName!==entry.name)throw new AuthError(409,'El nombre del lanzador cambió; vuelve a confirmar su eliminación.');
    const owned=p=>id==='champagne-vol5'?p==='updates/stable-v2.json'||p==='updates/history.json'||/^updates\/versions\/modpack-[0-9]+\.[0-9]+\.[0-9]+\.json$/.test(p):new RegExp('^updates/packs/'+id+'/(?:stable\\.json|history\\.json|versions/modpack-[0-9]+\\.[0-9]+\\.[0-9]+\\.json)$').test(p);
    const paths=snapshot.tree.filter(n=>n.type==='blob'&&owned(n.path)).map(n=>n.path);if(paths.length>250)throw new AuthError(413,'Este lanzador tiene más de 250 archivos publicados; necesita una eliminación por lotes. No se borró nada.');
    const nextCatalog={...current,packs:current.packs.filter(p=>p.id!==id),deletedPacks:[...new Set([...deleted,id])]};if(nextCatalog.deletedPacks.length>1000)throw new AuthError(413,'Registro de eliminación lleno. No se borró nada.');
    const raw=JSON.stringify(nextCatalog,null,2)+'\n';const blobResult=await ghApi(env,'/git/blobs','POST',{encoding:'utf-8',content:raw});if(blobResult.status!==201||!ghSha(blobResult.data.sha))throw new AuthError(503,'No se pudo preparar el catálogo.');
    const treeResult=await ghApi(env,'/git/trees','POST',{base_tree:commit.tree.sha,tree:[{path:'updates/catalog.json',mode:'100644',type:'blob',sha:blobResult.data.sha},...paths.map(path=>({path,mode:'100644',type:'blob',sha:null}))]});if(treeResult.status!==201||!ghSha(treeResult.data.sha))throw new AuthError(503,'No se pudo preparar la eliminación.');
    const commitResult=await ghApi(env,'/git/commits','POST',{message:'Eliminar definitivamente lanzador '+id,tree:treeResult.data.sha,parents:[head]});if(commitResult.status!==201||!ghSha(commitResult.data.sha))throw new AuthError(503,'No se pudo preparar el commit.');const next=commitResult.data.sha;
    const diff=await ghRequired(env,'/compare/'+head+'...'+next);if(diff.total_commits!==1||!Array.isArray(diff.files)||diff.files.length!==paths.length+1||!diff.files.some(f=>f.filename==='updates/catalog.json'&&f.status==='modified')||diff.files.some(f=>f.filename!=='updates/catalog.json'&&(f.status!=='removed'||!paths.includes(f.filename))))throw new AuthError(403,'La eliminación intenta afectar otro lanzador.');
    const verifiedCatalog=await ghRequired(env,'/contents/updates/catalog.json?ref='+next);if(decoder.decode(decodeBase64(verifiedCatalog.content.replace(/\s/g,'')))!==raw)throw new AuthError(503,'No se pudo verificar el catálogo preparado.');
    if((await ghRequired(env,'/git/ref/heads/'+ghBranch)).object?.sha!==head)throw new AuthError(409,'Hubo una publicación simultánea; vuelve a intentar la eliminación.');await accessSession(env,token,'/v2/admin/session');
    const activated=await ghApi(env,'/git/refs/heads/'+ghBranch,'PATCH',{sha:next,force:false});if(activated.status!==200)throw new AuthError(503,'No se activó la eliminación.');
    await outbox.enqueue(env,{eventId:'deleted:'+id+':'+next,guildId:env.DISCORD_GUILD_ID,channelId:'1414678783679795425',payload:{kind:'audit',action:'deleted',actorName:deletionSession.user.discordName||deletionSession.user.username,actorId:deletionSession.user.discordId,name:entry.name,occurredAt:new Date(clock()).toISOString(),changes:['Lanzador eliminado del catálogo y sus archivos publicados.','Instalaciones VillaWolf, mundos y configuraciones se eliminarán al sincronizar los clientes.','La carpeta original de CurseForge se conserva.']}});
    await env.DB.prepare('INSERT INTO deleted_packs(pack_id,deleted_at) VALUES(?,?) ON CONFLICT(pack_id) DO NOTHING').bind(id,clock()).run();return{ok:true,deleted:true,packId:id,commit:next,removedFiles:paths.length};
  }

  async function ghBlobUpload(env,token,request){
    await accessSession(env,token,'/v2/admin/catalog');if(!env.GITHUB_TOKEN)throw new AuthError(503,'La conexión central con GitHub todavía no está configurada.');if(request.headers.get('content-type')?.split(';')[0]!=='application/json'||!request.body)throw new AuthError(400,'Se requiere un archivo JSON del modpack.');
    if(Number(request.headers.get('content-length')||0)>64*1024*1024)throw new AuthError(413,'Paquete demasiado grande.');
    const reader=request.body.getReader(),first=[];let prefix='',size=0;try{while(prefix.length<34){const part=await reader.read();if(part.done)throw new AuthError(400,'Archivo incompleto.');size+=part.value.byteLength;first.push(part.value);prefix+=decoder.decode(part.value.subarray(0,2048-prefix.length));if(size>64*1024*1024)throw new AuthError(413,'Paquete demasiado grande.');}if(!/^\{"encoding":"utf-8","content":"[\[{]/.test(prefix))throw new AuthError(400,'Sólo se permite JSON del modpack.');}catch(error){await reader.cancel().catch(()=>{});throw error;}
    // Transferir el cuerpo ya preparado sin codificar ni cargar las imágenes en memoria.
    const stream=new ReadableStream({async pull(controller){try{if(first.length){controller.enqueue(first.shift());return;}const {done,value}=await reader.read();if(done){reader.releaseLock();controller.close();return;}size+=value.byteLength;if(size>64*1024*1024)throw Error('Paquete demasiado grande');controller.enqueue(value);}catch(error){controller.error(error);await reader.cancel().catch(()=>{});}},cancel:reason=>reader.cancel(reason)});
    const response=await fetchImpl(ghRepo+'/git/blobs',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(120000),headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'VillaWolf-Administrador-Service','Content-Type':'application/json'},body:stream});const text=await response.text();if(text.length>65536)throw new AuthError(503,'Respuesta de GitHub inválida.');let data;try{data=JSON.parse(text);}catch{throw new AuthError(503,'Respuesta de GitHub inválida.');}if(response.status!==201)throw new AuthError(503,'GitHub no pudo preparar el archivo. Revisa la conexión central.');return{ok:true,upstreamStatus:201,data};
  }

  async function communityCheck(env,token,input){
    const session=await accessSession(env,token,'/v2/admin/session');
    if(!snowflake(input.guildId)||!snowflake(input.roleId))throw new AuthError(400,'Servidor o rol inválido.');
    const metadata=await roleBot.metadata(env,input.guildId);if(!metadata)throw new AuthError(503,'El bot debe estar conectado y sincronizado en este servidor. Guarda el borrador; la publicación sigue bloqueada.');
    const administrator=await roleBot.membership(env,input.guildId,session.user.discordId);if(!administrator)throw new AuthError(503,'Falta sincronizar tu pertenencia al servidor externo.');
    const role=metadata.roles.find(r=>r.id===input.roleId);if(!role)throw new AuthError(400,'El rol no pertenece al servidor seleccionado.');
    for(const kind of ['modpack','launcher']){const a=input.announcements?.[kind];if(!a||a.enabled===false)continue;if(a.enabled!==true||!snowflake(a.channelId)||typeof a.mentionRole!=='boolean')throw new AuthError(400,'Configuración de anuncios inválida.');const channel=metadata.channels.find(c=>c.id===a.channelId);if(!channel||![0,5].includes(channel.type))throw new AuthError(400,'El canal de anuncios no pertenece al servidor o no es un canal de texto.');const bits=BigInt(channel.permissions),needed=(1n<<10n)|(1n<<11n)|(1n<<14n)|(1n<<15n);if((bits&8n)===0n&&(bits&needed)!==needed)throw new AuthError(403,'El bot necesita ver el canal, enviar mensajes, insertar enlaces y adjuntar imágenes.');if(a.mentionRole&&!role.mentionable)throw new AuthError(403,'El dueño debe permitir mencionar el rol seleccionado, o desactivar la mención.');}
    return{ok:true,verified:true,guildId:input.guildId,roleId:input.roleId,checkedAt:clock()};
  }
  async function githubJson(env,path,commit){
    let file=await ghRequired(env,'/contents/'+path+'?ref='+commit);
    if(file.encoding!=='base64'&&ghSha(file.sha)){
      if(!ghSha(commit)||!/^updates\/(?:stable-v2\.json|packs\/[a-z0-9][a-z0-9-]{0,63}\/stable\.json)$/.test(path)||!Number.isSafeInteger(file.size)||file.size>64*1024*1024)throw new AuthError(503,'Manifiesto confirmado inválido o demasiado grande.');
      const response=await fetchImpl('https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/'+commit+'/'+path,{redirect:'manual',signal:AbortSignal.timeout(45000)});
      try{return await publicationMetadata(response);}catch(error){throw new AuthError(503,'No se pudo leer '+path+': '+error.message);}
    }
    if(file.encoding!=='base64'||typeof file.content!=='string')throw new AuthError(503,'No se pudo leer la publicación confirmada.');
    try{return JSON.parse(decoder.decode(decodeBase64(file.content.replace(/\s/g,''))));}catch{throw new AuthError(503,'Publicación confirmada inválida.');}
  }
  async function publicationEvent(env,token,input){
    const session=await accessSession(env,token,'/v2/admin/session');
    if(!ghSha(input.commit)||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.packId||''))throw new AuthError(400,'Publicación inválida.');
    const receipt=await env.DB.prepare('SELECT * FROM publication_receipts WHERE commit_sha=?').bind(input.commit).first();
    if(!receipt||receipt.actor_id!==session.user.discordId)throw new AuthError(403,'Esta publicación no pertenece a tu sesión verificada.');
    const head=(await ghRequired(env,'/git/ref/heads/'+ghBranch)).object?.sha;
    if(head!==input.commit){const ancestry=await ghRequired(env,'/compare/'+input.commit+'...'+head);if(!['ahead','identical'].includes(ancestry.status))throw new AuthError(409,'La publicación aún no está confirmada en la rama oficial.');}
    const catalogValue=await githubJson(env,'updates/catalog.json',input.commit),pack=catalogValue.packs?.find(p=>p.id===input.packId);
    if(!pack||!pack.enabled)throw new AuthError(400,'El lanzador no está publicado.');communityPackFields(pack);
    const expected=pack.id==='champagne-vol5'?'updates/stable-v2.json':'updates/packs/'+pack.id+'/stable.json';
    if(pack.manifestPath!==expected)throw new AuthError(400,'Manifiesto del lanzador inválido.');
    const manifest=await githubJson(env,expected,input.commit);
    if(manifest.packId!==pack.id||manifest.game?.serverId!==pack.id||typeof manifest.version!=='string'||manifest.version.length>40||!/^\d+\.\d+\.\d+$/.test(manifest.version))throw new AuthError(400,'Versión publicada inválida.');
    const commit=await ghRequired(env,'/git/commits/'+input.commit);if(commit.parents?.length!==1||!ghSha(commit.parents[0].sha))throw new AuthError(400,'Historial de publicación inválido.');
    const diff=await ghRequired(env,'/compare/'+commit.parents[0].sha+'...'+input.commit);
    const manifestChanged=diff.files?.some(f=>f.filename===expected&&['added','modified'].includes(f.status));
    let previousPack=null;if(!manifestChanged&&diff.files?.some(f=>f.filename==='updates/catalog.json'&&f.status==='modified')){const previousCatalog=await githubJson(env,'updates/catalog.json',commit.parents[0].sha);previousPack=previousCatalog.packs?.find(p=>p.id===pack.id);}
    if(diff.total_commits!==1||!manifestChanged&&(!previousPack||JSON.stringify(previousPack)===JSON.stringify(pack)))throw new AuthError(400,'El commit no publicó ni modificó este lanzador.');
    const versionPath=pack.id==='champagne-vol5'?'updates/versions/modpack-'+manifest.version+'.json':'updates/packs/'+pack.id+'/versions/modpack-'+manifest.version+'.json';
    const newVersion=diff.files.some(f=>f.filename===versionPath&&f.status==='added');
    const firstPublication=diff.files.some(f=>f.filename===expected&&f.status==='added');
    const previous=firstPublication?null:await githubJson(env,expected,commit.parents[0].sha);
    const changes=publicationChanges(previous,manifest);
    if(previousPack){changes.splice(0,changes.length,...['Configuración del lanzador actualizada.']);if(previousPack.roleId!==pack.roleId)changes.push('Rol de acceso actualizado.');if(previousPack.guildId!==pack.guildId)changes.push('Servidor Discord actualizado.');if(JSON.stringify(previousPack.announcements)!==JSON.stringify(pack.announcements))changes.push('Canales o menciones de anuncios actualizados.');}
    const eventId='publication:'+input.commit+':'+pack.id;
    await env.DB.prepare('INSERT INTO admin_actions(id,actor_id,actor_name,action,pack_id,commit_sha,version,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(eventId,receipt.actor_id,receipt.actor_name,newVersion?'published':'presentation_published',pack.id,input.commit,manifest.version,clock()).run();
    await outbox.enqueue(env,{eventId,guildId:env.DISCORD_GUILD_ID,channelId:'1414678783679795425',payload:{kind:'audit',action:'published',actorName:receipt.actor_name,name:pack.name,version:manifest.version,changes}});
    const announcements=pack.announcements?.modpack;
    if(newVersion){
      const notes=manifest.presentation?.notes?.text||'Nueva versión disponible.';
      if(typeof notes!=='string'||notes.length>4000||/(?:github_pat_|ghp_|access_token|client_secret)/i.test(notes))throw new AuthError(400,'Las notas del anuncio deben estar libres de credenciales.');
      const actor=String(receipt.actor_name||'Administrador verificado').replace(/[*_`~<>@\r\n]/g,'').slice(0,80);
      await outbox.enqueue(env,{eventId:'modpack-central:'+pack.id+':'+manifest.version,guildId:env.DISCORD_GUILD_ID,channelId:'1559335322926710794',payload:{kind:'modpack',name:pack.name,version:manifest.version,notes:'Publicado por: '+actor+'\n\n'+notes,actorId:receipt.actor_id,actorName:actor,mentionRole:false,manifestPath:expected,commit:input.commit,publishedAt:new Date(receipt.created_at).toISOString()}});
      if(announcements?.enabled){
        await communityCheck(env,token,{guildId:pack.guildId||env.DISCORD_GUILD_ID,roleId:pack.roleId,announcements:pack.announcements});
        await outbox.enqueue(env,{eventId:'modpack:'+pack.id+':'+manifest.version,guildId:pack.guildId||env.DISCORD_GUILD_ID,channelId:announcements.channelId,payload:{kind:'modpack',name:pack.name,version:manifest.version,notes,roleId:pack.roleId,mentionRole:!!announcements.mentionRole,manifestPath:expected,commit:input.commit}});
      }
    }
    await env.DB.prepare('UPDATE publication_receipts SET confirmed=1 WHERE commit_sha=?').bind(input.commit).run();
    return{ok:true,confirmed:true,announcementQueued:!!(newVersion&&announcements?.enabled)};
  }
  async function auditEvent(env,token,input){
    const session=await accessSession(env,token,'/v2/admin/session');
    if(!/^[a-f0-9-]{36}$/.test(input.id||'')||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.packId||'')||!['draft_created','draft_saved','publication_error'].includes(input.action)||typeof input.name!=='string'||!input.name.trim()||input.name.length>80||/(?:github_pat_|ghp_)/i.test(input.name))throw new AuthError(400,'Registro administrativo inválido.');
    const version=input.version;if(version!==undefined&&(typeof version!=='string'||version.length>40||!/^\d+\.\d+\.\d+$/.test(version)))throw new AuthError(400,'Versión del registro inválida.');
    if(input.actorId&&input.actorId!==session.user.discordId)throw new AuthError(403,'El registro pertenece a otro administrador.');
    const id='audit:'+session.user.discordId+':'+input.id;
    await env.DB.prepare('INSERT INTO admin_actions(id,actor_id,actor_name,action,pack_id,version,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,session.user.discordId,session.user.discordName||session.user.username,input.action,input.packId,version||null,clock()).run();
    await outbox.enqueue(env,{eventId:id,guildId:env.DISCORD_GUILD_ID,channelId:'1414678783679795425',payload:{kind:'audit',action:input.action,actorName:session.user.discordName||session.user.username,name:input.name,...(version?{version}:{})}});
    return{ok:true,recorded:true};
  }
  const applicationReports=createApplicationReports({clock,digest,outbox});
  async function applicationProblem(env,token,input){
    if(!validNonce(token))throw new AuthError(401,'Inicia sesión con Discord.');
    const row=await env.DB.prepare('SELECT * FROM discord_sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token),clock()).first();if(!row)throw new AuthError(401,'La sesión venció.');
    let bundle;try{bundle=JSON.parse(await decrypt(env,row.encrypted_access_token));}catch{throw new AuthError(403,'Se requiere una sesión actual de VillaWolf.');}
    if(!['launcher','admin'].includes(input.app)||!['launcher-v2','admin'].includes(bundle.purpose)||input.app==='admin'&&bundle.purpose!=='admin'||input.app==='bot')throw new AuthError(403,'Aplicación de diagnóstico no autorizada.');
    const reportBucket=await digest('application-errors:'+row.discord_id+':'+Math.floor(clock()/300000));const budget=await env.DB.prepare('INSERT INTO discord_limits VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(reportBucket,clock()+300000).all();if(budget.results[0].count>5)throw new AuthError(429,'Diagnósticos pendientes. Se reintentará más tarde.');
    return applicationReports.record(env,input,{id:row.discord_id,name:row.discord_name||row.username});
  }
  async function notifications(request,env){
    if(env.ROLE_BOT_ENABLED!=='true'||!/^[a-f0-9]{64}$/.test(env.ROLE_BOT_KEY||''))throw new AuthError(503,'El bot no está habilitado.');
    const input=await body(request,8192),signature=request.headers.get('x-villawolf-signature');
    if(!/^[a-f0-9]{64}$/.test(signature||'')||!validNonce(input.nonce)||!Number.isSafeInteger(input.sentAt)||Math.abs(clock()-input.sentAt)>60000)throw new AuthError(401,'Solicitud firmada inválida.');
    const key=await crypto.subtle.importKey('raw',Uint8Array.from(env.ROLE_BOT_KEY.match(/../g),b=>parseInt(b,16)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('HMAC',key,Uint8Array.from(signature.match(/../g),b=>parseInt(b,16)),encoder.encode(JSON.stringify(input))))throw new AuthError(401,'Firma inválida.');
    const consumed=await env.DB.prepare('INSERT INTO bot_requests(nonce,expires_at) VALUES(?,?) ON CONFLICT(nonce) DO NOTHING RETURNING nonce').bind(input.nonce,clock()+120000).all();if(!consumed.results.length)throw new AuthError(409,'Solicitud ya atendida.');
    if(input.action==='poll'){const releases=await releaseAnnouncements.check(env).catch(error=>({ok:false,message:error instanceof AuthError?error.message:'Comprobación de avisos pendiente.'}));let job=await outbox.claim(env,input.guildIds);if(job?.payload?.kind==='manual'){try{job=await manualAnnouncements.enrich(env,job);}catch{await outbox.acknowledge(env,{id:job.id,claimToken:job.claimToken,outcome:'retry',retryAfterMs:300000});return{ok:true,releases,job:null,manualBlocked:true};}}return{ok:true,releases,job};}
    if(input.action==='problem'){if(input.report?.app!=='bot')throw new AuthError(403,'Aplicación inválida.');return applicationReports.record(env,input.report,{id:'bot',name:'VillaWolf Bot'});}
    if(input.action==='diagnostic')return applicationReports.read(env,input.id);
    if(input.action==='ack')return outbox.acknowledge(env,input.result||{});
    throw new AuthError(400,'Acción de bot inválida.');
  }
  async function handle(request,env){
    try{
      if(!env.DB||![env.DISCORD_CLIENT_ID,env.DISCORD_GUILD_ID,env.DISCORD_ROLE_ID].every(snowflake)||!env.DISCORD_CLIENT_SECRET||!/^[a-fA-F0-9]{64}$/.test(env.TOKEN_KEY||''))throw new AuthError(503,'El servicio de Discord todavía no está configurado.');
      if(request.headers.has('origin'))throw new AuthError(403,'Solicitud no permitida.');
      const url=new URL(request.url);if(url.search)throw new AuthError(400,'Solicitud inválida.');
      if(request.method==='POST'&&url.pathname==='/internal/role-bot')return reply(200,await roleBot.receive(request,env));
      if(request.method==='POST'&&url.pathname==='/internal/notifications')return reply(200,await notifications(request,env));
      if(request.method==='GET'&&url.pathname==='/health')return reply(200,{ok:true,provider:'discord',storage:'D1',version:'1.2.6',multiGuild:true,notifications:true,audit:true,catalog:true,admin:true,discordRetry:true,catalogSnapshotSeconds:60,curseforgeApi:true,curseforgeConfigured:!!env.CURSEFORGE_API_KEY,githubPublishing:true,githubConfigured:!!env.GITHUB_TOKEN});
      const cfRoute=/^\/v2\/(?:admin\/)?curseforge\/(?:matches|download)$/.test(url.pathname),ghRoute=url.pathname==='/v2/admin/delete-pack'||url.pathname==='/v2/admin/github'||url.pathname==='/v2/admin/github/status'||url.pathname==='/v2/admin/github/blob';
      const bucket=await digest((request.headers.get('CF-Connecting-IP')||'unknown')+':'+(cfRoute?'curseforge:':ghRoute?'github:':'')+Math.floor(clock()/60000));
      const count=await env.DB.prepare('INSERT INTO discord_limits VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,clock()+120000).all();
      if(count.results[0].count>(cfRoute?300:ghRoute?120:30))throw new AuthError(429,'Demasiadas solicitudes. Espera un minuto.');
      if(request.method==='POST'&&url.pathname==='/v1/discord/start')return reply(200,await start(env,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v1/discord/finish')return reply(200,await finish(env,await body(request)));
      const authorization=request.headers.get('authorization'),token=authorization?.startsWith('Bearer ')?authorization.slice(7):null;
      if(request.method==='POST'&&url.pathname==='/v2/application/problem')return reply(200,await applicationProblem(env,token,await body(request,8192)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/audit/event')return reply(200,await auditEvent(env,token,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/publication/event')return reply(200,await publicationEvent(env,token,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/community/check')return reply(200,await communityCheck(env,token,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/announcements/options')return reply(200,await manualAnnouncements.options(env,token,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/announcements/send')return reply(200,await manualAnnouncements.submit(env,token,await body(request,750000)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/announcements/history')return reply(200,await manualAnnouncements.history(env,token,await body(request)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/delete-pack')return reply(200,await deletePublishedPack(env,token,await body(request)));
      if(request.method==='GET'&&url.pathname==='/v2/admin/github/status'){await accessSession(env,token,'/v2/admin/catalog');return reply(200,{ok:true,configured:!!env.GITHUB_TOKEN});}
      if(request.method==='POST'&&url.pathname==='/v2/admin/github/blob')return reply(200,await ghBlobUpload(env,token,request));
      if(request.method==='POST'&&url.pathname==='/v2/admin/github')return reply(200,await ghGateway(env,token,await body(request,9*1024*1024)));
      if(request.method==='POST'&&url.pathname==='/v2/admin/curseforge/matches')return reply(200,await cfMatches(env,token,await body(request)));
      if(request.method==='POST'&&['/v2/admin/curseforge/download','/v2/curseforge/download'].includes(url.pathname))return await cfDownload(env,token,await body(request),url.pathname.startsWith('/v2/admin/'));
      if(request.method==='GET'&&(['/v2/session','/v2/catalog','/v2/admin/session','/v2/admin/catalog'].includes(url.pathname)||/^\/v2\/packs\/[a-z0-9][a-z0-9-]{0,63}$/.test(url.pathname)))return reply(200,await accessSession(env,request.headers.get('authorization')?.replace(/^Bearer /,''),url.pathname));
      if(request.method==='GET'&&url.pathname==='/v1/session')return reply(200,await session(env,token));
      if(request.method==='POST'&&url.pathname==='/v1/logout'){if(validNonce(token))await env.DB.prepare('DELETE FROM discord_sessions WHERE token_hash=?').bind(await digest(token)).run();return reply(200,{ok:true});}
      throw new AuthError(404,'Ruta no encontrada.');
    }catch(error){if((!error.status||error.status>=500)&&env.DB&&snowflake(env.DISCORD_GUILD_ID)){try{await applicationReports.record(env,{id:crypto.randomUUID(),app:'service',version:'1.2.6',operation:request.method+' '+new URL(request.url).pathname,error:error.message||'Error interno',log:error.stack||'',occurredAt:new Date(clock()).toISOString()},{id:'service',name:'Servicio VillaWolf'});}catch{}}return reply(error.status||503,{ok:false,message:error.status?error.message:'El servicio no pudo comprobar el acceso. Intenta nuevamente.',...(error.retryAfter?{retryAfter:error.retryAfter}:{})});}
  }
  async function cleanup(env){return env.DB.batch(['discord_flows','discord_sessions','discord_limits','bot_requests'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(clock())));}
  return {fetch:handle,scheduled:(_event,env,ctx)=>ctx.waitUntil(Promise.all([cleanup(env),releaseAnnouncements.check(env)]))};
}
export default createWorker();
