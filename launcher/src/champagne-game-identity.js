'use strict';
function gameIdentity(username,offlineUuid,microsoft){
 if(microsoft){if(!/^[a-f0-9]{32}$/i.test(microsoft.uuid||'')||! /^[A-Za-z0-9_]{3,16}$/.test(microsoft.username||'')||typeof microsoft.accessToken!=='string'||!microsoft.accessToken)throw Error('Identidad Microsoft inválida.');return {auth_player_name:microsoft.username,auth_uuid:microsoft.uuid,auth_access_token:microsoft.accessToken,auth_xuid:microsoft.xuid||'',clientid:microsoft.clientId,user_type:'msa'};}
 return {auth_player_name:username,auth_uuid:offlineUuid(username),auth_access_token:'0',auth_xuid:'',clientid:'',user_type:'legacy'};
}
module.exports={gameIdentity};
