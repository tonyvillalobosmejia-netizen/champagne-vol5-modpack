"use strict";
function serviceError(status, stage) {
 const error=new Error('Servicio VillaWolf: HTTP '+status+' ('+stage+').');
 return Object.assign(error,{status,origin:'service',stage});
}
function describe(error,stage='unknown') {
 const status=Number(error?.status||error?.statusCode),code=String(error?.code||'');
 const networkCodes=new Set(['ECONNRESET','ECONNREFUSED','ENOTFOUND','EAI_AGAIN','ETIMEDOUT','ENETUNREACH','EHOSTUNREACH','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','UND_ERR_SOCKET']);
 const transportCode=[error?.code,error?.cause?.code].find(value=>networkCodes.has(value));
 let category='connection',reason='No se pudo completar la conexión; consulta el diagnóstico privado.';
 if(error?.origin==='service') {
  category='service';reason='El servicio VillaWolf no está disponible.';
  if(status===401){category='configuration';reason='El servicio rechazó la firma: comprobar clave de conexión y reloj de la PC; no es un rechazo del token del bot.';}
  else if(status===403){category='permissions';reason='El servicio rechazó el acceso de esta solicitud.';}
  else if(status===400||status===413||status===415){category='configuration';reason='El servicio rechazó los datos de sincronización; comprobar servidor, reloj, formato y límites.';}
  else if(status===409){category='sequence';reason='El servicio rechazó la secuencia; se iniciará otra sincronización.';}
  else if(status===429){category='rate-limit';reason='El servicio solicita una pausa; se respetará antes de reintentar.';}
  else if(status===503){reason='Servicio no disponible o bot no habilitado/configurado; comprobar servicio y configuración.';}
 } else if(status===401||code==='TokenInvalid'){category='configuration';reason='Discord rechazó el inicio de sesión; revisar la credencial guardada del bot sin compartirla.';} else if(status===403||code==='50013'||code==='50001') {category='permissions';reason='Discord rechazó el acceso o faltan permisos.';}
 else if(code==='GuildMembersTimeout'){category='members-timeout';reason='Discord no completó la lista de miembros. Revisar Server Members Intent y conexión; el timeout por sí solo no confirma un intent ausente.';}
 else if(code==='DisallowedIntents'||code==='4014'){category='configuration';reason='Discord rechazó los intents solicitados; revisar Server Members Intent.';}
 else if(status===429){category='rate-limit';reason='Discord solicita una pausa.';}
 else if(error?.name==='TimeoutError'||error?.name==='AbortError'){reason='Tiempo de espera agotado.';}
 else if(transportCode){category='connection';reason='No se completó el transporte al servicio o Discord. Código: '+transportCode+'.';}
 else if(error?.code==='ERR_SERVICE_RESPONSE'){category='service-response';reason='El servicio devolvió una respuesta no válida; no se confirmó la operación.';}
 return {category,stage:error?.stage||stage,...(transportCode?{transportCode}:{}),...(Number.isInteger(status)&&status>=100&&status<=599?{httpStatus:status}:{}),reason};
}
async function atStage(stage,action){try{return await action();}catch(error){if(error&&typeof error==='object'&&!error.stage)error.stage=stage;throw error;}}
function delay(error,failures){const d=describe(error);const base=['configuration','permissions'].includes(d.category)?300000:30000;return Math.max(Math.min(900000,base*2**Math.min(Math.max(failures-1,0),5)),Math.min(3600000,Math.max(0,Number(error?.retryAfterMs)||0)));}
function summary(d){return d.reason+(d.httpStatus?' HTTP '+d.httpStatus+'.':'')+' Etapa: '+d.stage+'.';}
module.exports={serviceError,describe,delay,summary,atStage};
