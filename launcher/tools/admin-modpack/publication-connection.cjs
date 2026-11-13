'use strict';
// Only a successful server response can establish that the central connection is absent.
// A Discord cooldown or network failure must never become a missing local token.
function createPublicationConnection(auth,tokenStore){
 let configured=null,pending=null;
 async function shared(refresh=false){
  if(!refresh&&configured!==null)return configured;
  if(pending)return pending;
  const query=(async()=>{
   const result=await auth.githubStatus();
   if(typeof result?.configured!=='boolean')throw Error('No se pudo comprobar la conexión central de GitHub. Reintenta sin cambiar tu token.');
   configured=result.configured;return configured;
  })();
  pending=query;
  try{return await query;}finally{if(pending===query)pending=null;}
 }
 return{
  shared,
  async status(){return await shared(true)?{saved:true,shared:true}:tokenStore.status();},
  async token(input=''){return await shared(true)?'villawolf_service_connection_1234':tokenStore.resolve(input);},
  clear(){configured=null;}
 };
}
module.exports={createPublicationConnection};
