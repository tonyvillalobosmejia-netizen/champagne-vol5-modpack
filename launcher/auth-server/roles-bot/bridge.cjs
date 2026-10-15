'use strict';
const crypto=require('node:crypto');
function createBridge({endpoint,key,fetcher=fetch,clock=Date.now}){
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Dirección de servicio inválida.');
 if(!/^[a-f0-9]{64}$/.test(key))throw Error('Clave de conexión inválida.');
 const states=new Map();let lastTime=0;
 function begin(guildId){const state={generation:crypto.randomUUID(),sequence:0};states.set(guildId,state);return state;}
 async function send(guildId,kind,members,metadata){const state=states.get(guildId);if(!state)throw Error('Primero inicia la sincronización.');const sentAt=Math.max(clock(),lastTime+1);lastTime=sentAt;
  const body=JSON.stringify({guildId,generation:state.generation,sequence:++state.sequence,sentAt,kind,...(members?{members}:{}),...(metadata?{metadata}:{})}),signature=crypto.createHmac('sha256',Buffer.from(key,'hex')).update(body).digest('hex');
  const r=await fetcher(new URL('/internal/role-bot',url),{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','x-villawolf-signature':signature},body,signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('El servicio de roles respondió HTTP '+r.status+'. Revisa su configuración.');const result=await r.json();if(result.ok!==true||result.sequence!==state.sequence)throw Error('Respuesta del servicio inválida.');return result;
 }
 return{begin,send};
}
function startRoleBot({token,endpoint,key,guildIds,syncAllGuilds=false,notificationsEnabled=false,onProblem=()=>{},onStatus=()=>{},ClientClass,discordModule}){
 const discord=discordModule||require('discord.js'),{Client,GatewayIntentBits,Events,Status}=discord;
 const client=new (ClientClass||Client)({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]});
 const bridge=createBridge({endpoint,key}),allowed=new Set(guildIds),queues=new Map(),states=new Map();let stopping=false;
 function queue(id,action){const p=(queues.get(id)||Promise.resolve()).catch(()=>{}).then(action);queues.set(id,p);return p;}
 function data(m,present=true){return{id:m.id,present,pending:!!m.pending,roles:present?[...m.roles.cache.keys()].filter(id=>id!==m.guild.id):[],avatar:m.user?.avatar||null};}
 async function synchronize(guild){if(stopping||!(syncAllGuilds||allowed.has(guild.id))||guild.available===false)return;if(states.get(guild.id)?.syncing)return;
  const state={syncing:true,ready:false,buffer:[]};states.set(guild.id,state);
  try{await queue(guild.id,async()=>{onStatus('Sincronizando miembros y roles…',{domain:'roles',guildId:guild.id});bridge.begin(guild.id);await bridge.send(guild.id,'reset');const members=await guild.members.fetch({time:60000});const list=[...members.values()].map(m=>data(m));for(let i=0;i<list.length;i+=50)await bridge.send(guild.id,'members',list.slice(i,i+50));while(state.buffer.length){const batch=state.buffer.splice(0,50);await bridge.send(guild.id,'members',batch);}if(stopping||!client.isReady()||client.ws.status!==Status.Ready)throw Error('Gateway desconectado');state.syncing=false;state.ready=true;if(guild.roles?.cache&&guild.channels?.cache&&guild.members.me)await bridge.send(guild.id,'metadata',undefined,require('./community.cjs').snapshot(guild));await bridge.send(guild.id,'ready');onStatus('Roles sincronizados.',{domain:'roles',guildId:guild.id});});}
  catch(error){onProblem(error,'roles-sync');state.syncing=false;state.ready=false;onStatus('La sincronización está pendiente. VillaWolf mantiene la comprobación directa con Discord.',{domain:'roles',guildId:guild.id});}
 }
 function changed(member,present){if(!(syncAllGuilds||allowed.has(member.guild.id)))return;const state=states.get(member.guild.id);if(!state)return;const entry=data(member,present);if(state.syncing){state.buffer=state.buffer.filter(m=>m.id!==entry.id);state.buffer.push(entry);return;}if(!state.ready)return;
  queue(member.guild.id,()=>bridge.send(member.guild.id,'members',[entry])).catch(()=>{state.ready=false;onStatus('Se perdió la conexión de roles. Reintentando…',{domain:'roles',guildId:member.guild.id});});
 }
 async function offline(guildId){const state=states.get(guildId);if(!state)return;state.ready=false;await queue(guildId,()=>bridge.send(guildId,'offline')).catch(()=>{});}
 client.on(Events.GuildMemberAdd,m=>changed(m,true));client.on(Events.GuildMemberUpdate,(_old,m)=>changed(m,true));client.on(Events.GuildMemberRemove,m=>changed(m,false));
 function connected(){const ping=client.ws?.ping;onStatus('Conectado con Discord.',{domain:'connection',phase:'connected',pingMs:Number.isFinite(ping)&&ping>=0?Math.round(ping):null});}
 client.on(Events.ClientReady,()=>{connected();for(const g of client.guilds.cache.values())synchronize(g);});client.on(Events.GuildCreate,g=>synchronize(g));client.on(Events.GuildAvailable,g=>synchronize(g));client.on(Events.GuildUnavailable,g=>offline(g.id));client.on(Events.GuildDelete,g=>offline(g.id));
 client.on(Events.ShardDisconnect,()=>{for(const id of states.keys())offline(id);onStatus('Discord desconectado. Reconectando…',{domain:'connection',phase:'disconnected'});});
 client.on(Events.ShardResume,()=>{connected();for(const g of client.guilds.cache.values())synchronize(g);});
 client.on(Events.Error,error=>{onProblem(error,'discord-client');onStatus('Discord informó un error. Revisa el diagnóstico privado.',{domain:'application'});});
 const beat=setInterval(()=>{if(stopping||!client.isReady()||client.ws.status!==Status.Ready)return;connected();for(const [id,s]of states){if(s.ready)queue(id,async()=>{const guild=client.guilds.cache.get(id);if(guild?.roles?.cache&&guild.channels?.cache&&guild.members.me)await bridge.send(id,'metadata',undefined,require('./community.cjs').snapshot(guild));await bridge.send(id,'heartbeat');}).catch(()=>{s.ready=false;});else if(!s.syncing){const g=client.guilds.cache.get(id);if(g)synchronize(g);}}},30000);
 const reconcile=setInterval(()=>{if(client.isReady())for(const g of client.guilds.cache.values())synchronize(g);},15*60000);
 const notifications=notificationsEnabled?require('./notifications.cjs').startNotifications({client,endpoint,key,onStatus,onProblem}):null;
 client.login(token).catch(error=>{onProblem(error,'discord-login');onStatus('No se pudo iniciar el bot. Revisa su token y los permisos de miembros.',{domain:'connection',phase:'failed'});});
 return{client,async stop(){stopping=true;notifications?.stop();clearInterval(beat);clearInterval(reconcile);await Promise.all([...states.keys()].map(offline));client.destroy();}};
}
module.exports={createBridge,startRoleBot};
