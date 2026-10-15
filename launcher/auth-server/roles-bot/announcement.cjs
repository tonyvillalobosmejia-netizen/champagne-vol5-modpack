'use strict';
const {snowflake}=require('../../src/champagne-community');
const REPO='https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack';
function text(value,max){if(typeof value!=='string'||value.length>max)throw Error('Texto del anuncio inválido.');return value.replace(/@(everyone|here)/gi,'＠$1');}
function message(event){
  if(!['modpack','launcher','admin','audit'].includes(event?.kind))throw Error('Tipo de anuncio inválido.');
  if((event.version||'').length>40||!/^\d+\.\d+\.\d+$/.test(event.version||''))throw Error('Versión del anuncio inválida.');
  if(event.mentionRole&&!snowflake(event.roleId))throw Error('Rol de anuncio inválido.');
  const name=text(event.name||'VillaWolf',80),notes=text(event.notes||'Consulta las novedades y disfruta de la nueva versión.',4000).slice(0,3900);
  const titles={modpack:'🐺 Nueva aventura disponible',launcher:'🐺 VillaWolf Launcher se actualiza',admin:'🛠️ VillaWolf Administrador se actualiza',audit:'📋 Publicación confirmada'};
  const embed={color:event.kind==='admin'||event.kind==='audit'?0x27ae60:0xe94b75,title:titles[event.kind],description:'**'+name.replace(/[*_\x60~]/g,'')+' · '+event.version+'**\n\n'+notes,footer:{text:'VillaWolf · '+(event.kind==='modpack'?'Modpack publicado':'Actualización oficial')}};
  if(event.kind==='launcher'||event.kind==='admin')embed.url=REPO+'/releases/tag/'+(event.kind==='admin'?'admin-v':'v')+event.version;
  if(event.imageAttachment)embed.image={url:'attachment://portada.jpg'};
  return{content:event.mentionRole?'<@&'+event.roleId+'>':'',embeds:[embed],allowedMentions:{parse:[],roles:event.mentionRole?[event.roleId]:[],users:[],repliedUser:false}};
}
function auditMessage(event){
  const actions={deleted:'Lanzador eliminado',draft_created:'Borrador creado',draft_saved:'Cambios guardados',published:'Publicación confirmada',publication_error:'Publicación no completada'};
  const action=actions[event.action];if(!action)throw Error('Acción de auditoría inválida.');
  const actor=text(event.actorName||'Administrador verificado',80),name=text(event.name||'Lanzador',80);
  if(event.version&&(!/^\d+\.\d+\.\d+$/.test(event.version)||event.version.length>40))throw Error('Versión de auditoría inválida.');
  const fields=[{name:'Administrador',value:actor,inline:true},{name:'Lanzador',value:name,inline:true},{name:'Estado',value:event.action==='deleted'?'Eliminado definitivamente':event.action==='published'?'Publicado':event.action==='publication_error'?'Error · Revisar publicación':'Guardado · No publicado',inline:false}];
  if(event.actorId){if(!snowflake(event.actorId))throw Error('Administrador inválido.');fields.push({name:'ID del administrador',value:event.actorId,inline:true});}
  if(event.occurredAt&&!Number.isFinite(Date.parse(event.occurredAt)))throw Error('Fecha de auditoría inválida.');
  if(event.version)fields.push({name:'Versión',value:event.version,inline:true});
  if(event.changes!==undefined){
    if(!Array.isArray(event.changes)||event.changes.length>12||event.changes.some(v=>typeof v!=='string'||v.length>180))throw Error('Resumen de cambios inválido.');
    if(event.changes.length){const lines=event.changes.map(v=>'• '+text(v,180));let block='';for(const line of lines){if(block.length+line.length+1>1000){fields.push({name:fields.some(f=>f.name==='Cambios realizados')?'Cambios (continuación)':'Cambios realizados',value:block,inline:false});block='';}block+=(block?'\n':'')+line;}if(block)fields.push({name:fields.some(f=>f.name==='Cambios realizados')?'Cambios (continuación)':'Cambios realizados',value:block,inline:false});}
  }
  return{embeds:[{...(event.occurredAt?{timestamp:new Date(event.occurredAt).toISOString()}:{}),color:event.action==='publication_error'?0xe2a84b:0x27ae60,title:'📋 '+action,fields,footer:{text:'VillaWolf · Registro privado · Sin credenciales'}}],allowedMentions:{parse:[],roles:[],users:[],repliedUser:false}};
}
module.exports={message,auditMessage};
