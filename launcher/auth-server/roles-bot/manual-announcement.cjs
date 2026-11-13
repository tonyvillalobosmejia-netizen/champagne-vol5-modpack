'use strict';
const crypto=require('node:crypto'),model=require('../../src/champagne-manual-announcement.cjs');
const OFFICIAL='1007732653035880589',ADMINS=['1559330834278781048','1559330540820373535'];
function message(event){
 const v=model.validate({...event,id:event.manualId});
 if(!!v.image!==!!event.imageSha256)throw Error('Falta el contenido verificado de la imagen.');
 if(!/^\d{17,20}$/.test(event.actorId||'')||!/^\d{17,20}$/.test(event.roleId||'')||!Number.isFinite(Date.parse(event.confirmedAt)))throw Error('Autor, rol o confirmación del anuncio inválidos.');
 const actor=String(event.actorName||'Administrador verificado').replace(/[\r\n@]/g,' ').slice(0,80);
 const embed={title:v.title,description:v.text,color:0x37b56d,timestamp:new Date(event.confirmedAt).toISOString(),footer:{text:'VillaWolf · '+actor+' · '+event.actorId}};
 if(v.downloadUrl)embed.fields=[{name:'📥 Descarga oficial',value:'[Descargar VillaWolf Launcher para Windows]('+v.downloadUrl+')'}];
 const result={content:[v.mentionEveryone?'@everyone':'',v.mentionRole?'<@&'+event.roleId+'>':''].filter(Boolean).join(' '),embeds:[embed],allowedMentions:{parse:v.mentionEveryone?['everyone']:[],roles:v.mentionRole?[event.roleId]:[],users:[],repliedUser:false}};
 if(v.image){const bytes=Buffer.from(v.image.base64,'base64');if(crypto.createHash('sha256').update(bytes).digest('hex')!==v.image.sha256||event.imageSha256!==v.image.sha256)throw Error('Integridad de imagen incorrecta.');const name=v.image.mime==='image/png'?'anuncio.png':'anuncio.jpg';result.files=[{attachment:bytes,name}];embed.image={url:'attachment://'+name};}
 return result;
}
async function verifyLink(url,fetcher){
 if(!url)return;if(!model.launcherLink(url))throw Error('Enlace oficial inválido.');
 let current=url;
 for(let attempt=0;attempt<2;attempt++){
  const r=await fetcher(current,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(r.status===200&&Number(r.headers.get('content-length'))>0)return;
  if(attempt===0&&[301,302,303,307,308].includes(r.status)){const next=new URL(r.headers.get('location'),current);if(next.protocol==='https:'&&next.origin==='https://release-assets.githubusercontent.com'&&!next.username&&!next.password&&!next.hash&&/^\/github-production-release-asset\/[0-9]+\/[a-f0-9-]+$/i.test(next.pathname)){current=next.href;continue;}}
  throw Error('El instalador oficial todavía no está disponible para descargar.');
 }
}
async function prepare(event,channel,client,fetcher,clock=Date.now){
 const result=message(event),guild=channel.guild;
 const delivery=event.delivery;if(delivery?.schema!==1||!Number.isSafeInteger(delivery.checkedAt)||clock()-delivery.checkedAt>90000||delivery.checkedAt-clock()>60000||delivery.guildId!==channel.guildId||delivery.packId!==event.packId||delivery.roleId!==event.roleId)throw Error('Falta una comprobación reciente del servicio compatible. No se envió el anuncio.');
 if(!guild||guild.id!==channel.guildId)throw Error('Servidor del canal no confirmado.');
 const central=client.guilds.cache.get(OFFICIAL);if(!central)throw Error('Falta acceso al servidor oficial para comprobar al administrador.');
 const admin=await central.members.fetch({user:event.actorId,force:true});if(!ADMINS.some(id=>admin.roles.cache.has(id))||admin.pending)throw Error('El autor ya no tiene autorización de administración.');
 const member=await guild.members.fetch({user:event.actorId,force:true});if(member.pending)throw Error('El autor debe completar su acceso al servidor.');
 const me=await guild.members.fetch({user:client.user.id,force:true}),role=await guild.roles.fetch(event.roleId);
 if(!role||role.guild.id!==guild.id)throw Error('El rol ya no pertenece al servidor.');
 model.assertPermissions({type:channel.type,permissions:channel.permissionsFor(me)?.bitfield.toString()||'0'},role,event);
 await verifyLink(event.downloadUrl,fetcher);return result;
}
module.exports={message,prepare,verifyLink};
