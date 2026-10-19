'use strict';
async function reliableRequest(action,{safe=false,retryIntegrity=false,onRetry=()=>{},sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 for(let attempt=0;;attempt++){
  try{return await action(attempt+1);}catch(error){
   const status=Number(error.status),integrity=retryIntegrity&&['ERR_DOWNLOAD_INTEGRITY','ERR_INCOMPLETE_DOWNLOAD'].includes(error.code);
   const timeout=['TimeoutError','AbortError'].includes(error.name);
   const network=/fetch failed|network|socket|ECONN|ETIMEDOUT|interrump|conectar|no respondió/i.test(error.message||'');
   if(!safe||attempt>=2||!(integrity||[408,500,502,503,504].includes(status)||!status&&(network||timeout)))throw error;
   onRetry({attempt:attempt+1,nextAttempt:attempt+2,integrity:integrity&&error.code==='ERR_DOWNLOAD_INTEGRITY',incomplete:error.code==='ERR_INCOMPLETE_DOWNLOAD'});
   await sleep(400*2**attempt);
  }
 }
}
module.exports={reliableRequest};
