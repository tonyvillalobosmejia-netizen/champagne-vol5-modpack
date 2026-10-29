'use strict';
const OFFICIAL_GUILD_ID='1007732653035880589';
const snowflake=x=>typeof x==='string'&&/^\d{17,20}$/.test(x);
function guildForPack(pack){return pack.guildId||OFFICIAL_GUILD_ID;}
function announcements(value={}){
  const result={};
  for(const kind of ['modpack','launcher']){
    const item=value[kind]||{};
    if(typeof item.enabled!=='undefined'&&typeof item.enabled!=='boolean'||typeof item.mentionRole!=='undefined'&&typeof item.mentionRole!=='boolean')throw Error('Configuración de anuncios inválida.');
    const enabled=item.enabled===true;
    if(enabled&&!snowflake(item.channelId))throw Error('El canal de anuncios habilitado necesita un ID válido.');
    result[kind]={enabled,...(enabled?{channelId:item.channelId,mentionRole:item.mentionRole===true}:{})};
  }
  return result;
}
function communityFields(pack){
  const result={};
  if(pack.guildId!==undefined){if(!snowflake(pack.guildId))throw Error('Servidor Discord inválido.');result.guildId=pack.guildId;}
  if(pack.description!==undefined){if(typeof pack.description!=='string'||pack.description.length>4000)throw Error('Descripción inválida.');result.description=pack.description;}
  if(pack.announcements!==undefined)result.announcements=announcements(pack.announcements);
  return result;
}
module.exports={OFFICIAL_GUILD_ID,snowflake,guildForPack,announcements,communityFields};
