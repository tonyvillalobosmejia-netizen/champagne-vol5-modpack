'use strict';
function snapshot(guild){
  const me=guild.members.me;if(!me)throw Error('Miembro del bot no disponible.');
  const roles=[...guild.roles.cache.values()].map(r=>({id:r.id,mentionable:!!r.mentionable})).filter(r=>r.id!==guild.id);
  const channels=[...guild.channels.cache.values()].filter(c=>c.isTextBased?.()&&!c.isThread?.()).map(c=>({id:c.id,type:c.type,permissions:c.permissionsFor(me)?.bitfield.toString()||'0'}));
  return{roles,channels};
}
function validate(value){
  const id=x=>typeof x==='string'&&/^\d{17,20}$/.test(x);
  if(!value||!Array.isArray(value.roles)||!Array.isArray(value.channels)||value.roles.length>250||value.channels.length>500)throw Error('Metadatos del servidor inválidos.');
  if(value.roles.some(r=>!id(r.id)||typeof r.mentionable!=='boolean')||value.channels.some(c=>!id(c.id)||!Number.isSafeInteger(c.type)||typeof c.permissions!=='string'||!/^\d{1,24}$/.test(c.permissions)))throw Error('Metadatos del servidor inválidos.');
  return value;
}
module.exports={snapshot,validate};
