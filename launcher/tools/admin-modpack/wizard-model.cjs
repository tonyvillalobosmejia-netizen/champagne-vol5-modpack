'use strict';
const {OFFICIAL_GUILD_ID,snowflake,announcements}=require('../../src/champagne-community');
function validate(input,{complete=false}={}){
  const errors={},text=(key,max)=>{const v=typeof input?.[key]==='string'?input[key].trim():'';if(v.length>max)errors[key]='El máximo es '+max+' caracteres.';return v;};
  const name=text('name',80),description=text('description',4000),initialVersion=text('initialVersion',40),source=text('source',4096),notes=text('notes',4000);
  const serverMode=input?.serverMode==='external'?'external':'official',guildId=serverMode==='official'?OFFICIAL_GUILD_ID:text('guildId',20),roleId=text('roleId',20);
  if(complete&&!name)errors.name='Escribe el nombre del lanzador.';
  if(initialVersion&&!/^\d+\.\d+\.\d+$/.test(initialVersion)||complete&&!initialVersion)errors.initialVersion='Usa una versión x.y.z, por ejemplo 0.1.0.';
  if(complete&&initialVersion==='0.0.0')errors.initialVersion='La primera publicación debe ser mayor que 0.0.0.';
  if(complete&&!source)errors.source='Selecciona la carpeta original de CurseForge.';
  if(serverMode==='external'&&(guildId&&!snowflake(guildId)||complete&&!guildId))errors.guildId='Escribe un ID de servidor válido.';
  if(roleId&&!snowflake(roleId)||complete&&!roleId)errors.roleId='Escribe el ID del rol de acceso.';
  const a={};for(const k of ['modpack','launcher']){const v=input?.announcements?.[k]||{};a[k]={enabled:v.enabled===true,channelId:typeof v.channelId==='string'?v.channelId.trim():'',mentionRole:v.mentionRole===true};if(a[k].enabled&&!snowflake(a[k].channelId))errors[k+'Channel']='Escribe el ID del canal habilitado.';}
  const imageHash=typeof input?.imageHash==='string'&&/^[a-f0-9]{64}$/.test(input.imageHash)?input.imageHash:null;
  return{value:{name,description,initialVersion,source,serverMode,guildId,roleId,announcements:a,notes,imageHash},errors,valid:Object.keys(errors).length===0};
}
function publishedFields(input){const r=validate(input,{complete:true});if(!r.valid)throw Object.assign(Error('Revisa los campos del borrador.'),{fields:r.errors});return{name:r.value.name,guildId:r.value.guildId,roleId:r.value.roleId,description:r.value.description,announcements:announcements(r.value.announcements)};}
module.exports={validate,publishedFields};
