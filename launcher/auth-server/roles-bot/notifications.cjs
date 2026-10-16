'use strict';
const failure=require('./failure.cjs');
const crypto=require('node:crypto'),{message,auditMessage,diagnosticMessage}=require('./announcement.cjs');
function createNotificationClient({endpoint,key,fetcher=fetch,clock=Date.now}){
 let releaseStatus=null;
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!/^[a-f0-9]{64}$/.test(key||''))throw Error('Conexión de anuncios inválida.');
 async function request(action,fields){
   const body=JSON.stringify({action,...fields,sentAt:clock(),nonce:crypto.randomBytes(32).toString('base64url')});
   const signature=crypto.createHmac('sha256',Buffer.from(key,'hex')).update(body).digest('hex');
   const r=await fetcher(new URL('/internal/notifications',url),{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','x-villawolf-signature':signature},body,signal:AbortSignal.timeout(15000)});
   if(!r.ok){const error=failure.serviceError(r.status,'announcements-'+action);const retry=Number(r.headers?.get('retry-after'));if(Number.isFinite(retry))error.retryAfterMs=retry*1000;throw error;}
   return r.json();
 }
 return{releaseStatus:()=>releaseStatus,problem:report=>request('problem',{report}),diagnostic:id=>request('diagnostic',{id}),poll:async guildIds=>{const value=await request('poll',{guildIds});releaseStatus=value.releases||null;return value.job;},ack:result=>request('ack',{result})};
}
async function deliver(job,{client,ack,fetcher=fetch,onProblem=()=>{}}){
 const problem=error=>{if(job.payload.kind!=='diagnostic')onProblem(error,'announcement-delivery');};
 const marker='Ref '+job.id.slice(0,24);
 const report=(outcome,extra={})=>ack({id:job.id,claimToken:job.claimToken,outcome,...extra});
 let channel;
 try{
   channel=await client.channels.fetch(job.channelId);
   if(!channel||channel.guildId!==job.guildId||!channel.isTextBased()||channel.isThread?.())return report('retry',{retryAfterMs:300000});
   if(job.reconcile){
     const messages=await channel.messages.fetch({limit:100});
     const found=[...messages.values()].find(m=>m.author?.id===client.user.id&&m.embeds?.some(e=>e.footer?.text?.endsWith(marker)));
     if(found)return report('sent',{messageId:found.id});
     // An incomplete history cannot prove a previous delivery failed.
     const oldest=Math.min(...[...messages.values()].map(m=>m.createdTimestamp));
     if(messages.size===100&&oldest>job.createdAt)return report('uncertain',{retryAfterMs:300000});
   }
 }catch(error){problem(error);return report('uncertain',{retryAfterMs:300000});}
 let payload;
 try{
   if (['launcher','admin'].includes(job.payload.kind)) job={...job,payload:await require('./official-release.cjs').verifiedRelease(job.payload,fetcher)};
   if(job.guildId==='1007732653035880589'&&job.channelId==='1559334945372250314'&&job.payload.kind==='launcher')job={...job,payload:{...job.payload,mentionRole:false,roleId:undefined}};
   // Rol real confirmado desde la interfaz de VillaWolf; no altera comunidades externas.
   if(job.guildId==='1007732653035880589'&&job.channelId==='1559347693245956189'&&job.payload.kind==='admin')job={...job,payload:{...job.payload,mentionRole:true,roleId:'1559330834278781048'}};
   payload=job.payload.kind==='diagnostic'?{...diagnosticMessage(job.payload),components:require('./diagnostics.cjs').diagnosticButtons(job.id)}:job.payload.kind==='audit'?auditMessage(job.payload):message(job.payload);
   for(const embed of payload.embeds)embed.footer={text:embed.footer.text+' · '+marker};
   if(job.payload.kind==='modpack'&&job.payload.manifestPath&&job.payload.commit){
     if(!/^[a-f0-9]{40}$/.test(job.payload.commit)||!/^updates\/(?:stable-v2\.json|packs\/[a-z0-9][a-z0-9-]{0,63}\/stable\.json)$/.test(job.payload.manifestPath))throw Error('Ruta de imagen inválida.');
     const url='https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/'+job.payload.commit+'/'+job.payload.manifestPath;
     const r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
     if(!r.ok)throw Error('Portada pendiente.');
     const reader=r.body.getReader(),parts=[];let size=0;
     try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>64*1024*1024){await reader.cancel();throw Error('Manifiesto grande.');}parts.push(Buffer.from(value));}}finally{reader.releaseLock();}
     const manifest=JSON.parse(Buffer.concat(parts).toString('utf8')),background=manifest.presentation?.background;
     if(background){
       const p=require('../../src/champagne-presentation').validatePresentation({background});
       payload.files=[{attachment:Buffer.from(p.background.base64,'base64'),name:'portada.jpg'}];
       payload.embeds[0].image={url:'attachment://portada.jpg'};
     }
   }
 }catch(error){problem(error);return report('retry',{retryAfterMs:300000});}
 try{
   const sent=await channel.send({...payload,nonce:job.id.slice(0,24),enforceNonce:true});
   return report('sent',{messageId:sent.id});
 }catch(error){
   problem(error);const status=Number(error.status);
   // A response explicitly rejecting the send is safe to retry. Network failures are ambiguous.
   if([400,401,403,404,429].includes(status))return report('retry',{retryAfterMs:status===429?Math.max(30000,Number(error.retry_after||60)*1000):300000});
   return report('uncertain',{retryAfterMs:300000});
 }
}
function startNotifications({client,endpoint,key,onStatus=()=>{},onProblem=()=>{},fetcher=fetch,clock=Date.now}){
 const service=createNotificationClient({endpoint,key,fetcher,clock});const onInteraction=i=>require('./diagnostics.cjs').diagnosticInteraction(i,{service}).catch(()=>{});client.on('interactionCreate',onInteraction);let stopped=false,busy=false,lastAnnouncement='unknown',failures=0,retryAt=0;
 async function tick(){if(stopped||busy||!client.isReady()||clock()<retryAt)return;busy=true;try{const guildIds=[...client.guilds.cache.keys()].slice(0,50),job=await service.poll(guildIds);if(job)await deliver(job,{client,fetcher,onProblem,ack:async result=>{const value=await service.ack(result);lastAnnouncement=result.outcome==='sent'?'sent':'pending';onStatus(lastAnnouncement==='sent'?'Anuncio entregado.':'Anuncio pendiente; se reintentará sin duplicarlo.',{domain:'announcements'});return value;}});else onStatus(service.releaseStatus()?.ok===false?'Cola consultada; sin envíos disponibles ahora. La comprobación de nuevas versiones oficiales no pudo completarse.':'Cola consultada; sin envíos disponibles ahora.',{domain:'announcements'});failures=0;retryAt=0;}catch(error){failures++;const wait=failure.delay(error,failures);retryAt=clock()+wait;const diagnostic=failure.describe(error,'announcements');onProblem(new Error(failure.summary(diagnostic)),'announcements');onStatus('No se pudo consultar o confirmar la cola; no se afirma que haya anuncios pendientes. '+failure.summary(diagnostic)+' Reintento en '+Math.ceil(wait/1000)+' s.',{domain:'announcements',phase:'unavailable',...diagnostic,retryAt});}finally{busy=false;}}
 const timer=setInterval(tick,15000);timer.unref?.();return{tick,stop:()=>{stopped=true;clearInterval(timer);client.off?.('interactionCreate',onInteraction);}};
}
module.exports={createNotificationClient,deliver,startNotifications};
