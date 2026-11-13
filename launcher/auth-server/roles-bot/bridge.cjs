'use strict';
const serviceFetch=require('./transport.cjs').createTransport();
const crypto=require('node:crypto');
const failure=require('./failure.cjs');
function createBridge({endpoint,key,fetcher=serviceFetch,clock=Date.now}){
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Dirección de servicio inválida.');
 if(!/^[a-f0-9]{64}$/.test(key))throw Error('Clave de conexión inválida.');
 const states=new Map();let lastTime=0;
 function begin(guildId){const state={generation:crypto.randomUUID(),sequence:0};states.set(guildId,state);return state;}
 async function send(guildId,kind,members,metadata){const state=states.get(guildId);if(!state)throw Error('Primero inicia la sincronización.');const sentAt=Math.max(clock(),lastTime+1);lastTime=sentAt;
  const body=JSON.stringify({guildId,generation:state.generation,sequence:++state.sequence,sentAt,kind,...(members?{members}:{}),...(metadata?{metadata}:{})}),signature=crypto.createHmac('sha256',Buffer.from(key,'hex')).update(body).digest('hex');
  const r=await failure.atStage(kind,()=>fetcher(new URL('/internal/role-bot',url),{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','x-villawolf-signature':signature},body,signal:AbortSignal.timeout(15000)}));
  if(!r.ok){const error=failure.serviceError(r.status,kind);const retry=Number(r.headers?.get('retry-after'));if(Number.isFinite(retry))error.retryAfterMs=retry*1000;throw error;}return failure.atStage(kind,async()=>{let result;try{result=await r.json();}catch(error){if(error instanceof SyntaxError)error.code='ERR_SERVICE_RESPONSE';throw error;}if(result.ok!==true||result.sequence!==state.sequence)throw Object.assign(Error('Respuesta del servicio inválida.'),{code:'ERR_SERVICE_RESPONSE'});return result;});
 }
 return{begin,send};
}
function startRoleBot({token,endpoint,key,guildIds,syncAllGuilds=false,notificationsEnabled=false,onProblem=()=>{},onStatus=()=>{},ClientClass,discordModule,fetcher=serviceFetch,clock=Date.now}){
 const discord=discordModule||require('discord.js'),{Client,GatewayIntentBits,Events,Status}=discord;
 const client=new (ClientClass||Client)({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]});
 const bridge=createBridge({endpoint,key,fetcher,clock}),allowed=new Set(guildIds),queues=new Map(),states=new Map();let stopping=false;
 function queue(id,action){const p=(queues.get(id)||Promise.resolve()).catch(()=>{}).then(action);queues.set(id,p);return p;}
 function data(m,present=true){return{id:m.id,present,pending:!!m.pending,roles:present?[...m.roles.cache.keys()].filter(id=>id!==m.guild.id):[],avatar:m.user?.avatar||null};}
 async function synchronize(guild){if(stopping||!(syncAllGuilds||allowed.has(guild.id))||guild.available===false)return;if(states.get(guild.id)?.syncing||clock()<(states.get(guild.id)?.retryAt||0))return;
  const state={syncing:true,ready:false,buffer:[],failures:states.get(guild.id)?.failures||0,retryAt:0,stage:'reset'};states.set(guild.id,state);
  try{await queue(guild.id,async()=>{onStatus('Sincronizando miembros y roles del servidor '+guild.id+'…',{domain:'roles',guildId:guild.id});bridge.begin(guild.id);await bridge.send(guild.id,'reset');state.stage='discord-members';const members=await guild.members.fetch({time:60000});state.stage='members';const list=[...members.values()].map(m=>data(m));for(let i=0;i<list.length;i+=50)await bridge.send(guild.id,'members',list.slice(i,i+50));while(state.buffer.length){const batch=state.buffer.splice(0,50);await bridge.send(guild.id,'members',batch);}if(stopping||!client.isReady()||client.ws.status!==Status.Ready)throw Error('Gateway desconectado');state.stage='metadata';if(guild.roles?.cache&&guild.channels?.cache&&guild.members.me)await bridge.send(guild.id,'metadata',undefined,require('./community.cjs').snapshot(guild));state.stage='ready';await bridge.send(guild.id,'ready');while(state.buffer.length)await bridge.send(guild.id,'members',state.buffer.splice(0,50));state.syncing=false;state.ready=true;state.failures=0;state.retryAt=0;onStatus('Roles sincronizados en el servidor '+guild.id+'.',{domain:'roles',guildId:guild.id,phase:'ready',members:list.length});});}
  catch(error){failed(guild.id,state,error,state.stage);}
 }
 function failed(id,state,error,stage){state.syncing=false;state.ready=false;state.failures++;const wait=failure.delay(error,state.failures);state.retryAt=clock()+wait;const diagnostic=failure.describe(error,stage);onProblem(new Error(failure.summary(diagnostic)),'roles-sync');onStatus('Sincronización pendiente en el servidor '+id+'. '+failure.summary(diagnostic)+' Reintento en '+Math.ceil(wait/1000)+' s. Se mantiene la comprobación directa con Discord.',{domain:'roles',guildId:id,phase:'pending',...diagnostic,retryAt:state.retryAt});}
 function changed(member,present){if(!(syncAllGuilds||allowed.has(member.guild.id)))return;const state=states.get(member.guild.id);if(!state)return;const entry=data(member,present);if(state.syncing){state.buffer=state.buffer.filter(m=>m.id!==entry.id);state.buffer.push(entry);return;}if(!state.ready)return;
  queue(member.guild.id,()=>bridge.send(member.guild.id,'members',[entry])).catch(error=>failed(member.guild.id,state,error,'member-change'));
 }
 async function offline(guildId){const state=states.get(guildId);if(!state)return;state.ready=false;await queue(guildId,()=>bridge.send(guildId,'offline')).catch(()=>{});}
 client.on(Events.GuildMemberAdd,m=>changed(m,true));client.on(Events.GuildMemberUpdate,(_old,m)=>changed(m,true));client.on(Events.GuildMemberRemove,m=>changed(m,false));
 function connected(){const ping=client.ws?.ping;onStatus('Conectado con Discord.',{domain:'connection',phase:'connected',pingMs:Number.isFinite(ping)&&ping>=0?Math.round(ping):null});}
 client.on(Events.ClientReady,()=>{connected();for(const g of client.guilds.cache.values())synchronize(g);});client.on(Events.GuildCreate,g=>synchronize(g));client.on(Events.GuildAvailable,g=>synchronize(g));client.on(Events.GuildUnavailable,g=>offline(g.id));client.on(Events.GuildDelete,g=>offline(g.id));
 client.on(Events.ShardDisconnect,()=>{for(const id of states.keys())offline(id);onStatus('Discord desconectado. Reconectando…',{domain:'connection',phase:'disconnected'});});
 client.on(Events.ShardResume,()=>{connected();for(const g of client.guilds.cache.values())synchronize(g);});
 client.on(Events.Error,error=>{const diagnostic=failure.describe(error,'discord-client');onProblem(new Error(failure.summary(diagnostic)),'discord-client');onStatus(failure.summary(diagnostic),{domain:'application',...diagnostic});});
 const beat=setInterval(()=>{if(stopping||!client.isReady()||client.ws.status!==Status.Ready)return;connected();for(const [id,s]of states){if(s.ready&&!s.heartbeatBusy){s.heartbeatBusy=true;queue(id,async()=>{const guild=client.guilds.cache.get(id);if(guild?.roles?.cache&&guild.channels?.cache&&guild.members.me)await bridge.send(id,'metadata',undefined,require('./community.cjs').snapshot(guild));await bridge.send(id,'heartbeat');}).catch(error=>failed(id,s,error,'heartbeat')).finally(()=>{s.heartbeatBusy=false;});}else if(!s.ready&&!s.syncing){const g=client.guilds.cache.get(id);if(g)synchronize(g);}}},30000);
 const reconcile=setInterval(()=>{if(client.isReady())for(const g of client.guilds.cache.values())synchronize(g);},15*60000);
 const notifications=notificationsEnabled?require('./notifications.cjs').startNotifications({client,endpoint,key,onStatus,onProblem,fetcher,clock}):null;
 client.login(token).catch(error=>{const diagnostic=failure.describe(error,'discord-login');onProblem(new Error(failure.summary(diagnostic)),'discord-login');onStatus('No se pudo iniciar el bot. '+failure.summary(diagnostic),{domain:'connection',phase:'failed',...diagnostic});});
 return{client,async stop(){stopping=true;notifications?.stop();clearInterval(beat);clearInterval(reconcile);await Promise.all([...states.keys()].map(offline));client.destroy();}};
}
module.exports={createBridge,startRoleBot};
