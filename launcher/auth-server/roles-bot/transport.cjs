'use strict';
// Retry only failures before a connection exists, never an ambiguous response.
function createTransport({fetcher=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 return async function request(url,options={}){
  for(let attempt=0;attempt<2;attempt++){
   try{return await fetcher(url,options);}
   catch(error){
    const code=error?.cause?.code||error?.code;
    if(attempt||options.signal?.aborted||!['UND_ERR_CONNECT_TIMEOUT','EAI_AGAIN'].includes(code))throw error;
    await pause(250);
    if(options.signal?.aborted)throw error;
   }
  }
 };
}
module.exports={createTransport};
