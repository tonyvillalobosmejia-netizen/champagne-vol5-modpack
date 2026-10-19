'use strict';
function createAdminCatalogAccess(auth,{clock=Date.now}={}){
 let prepared=null,authorization=null;
 function clear(){prepared=null;authorization=null;}
 function remember(){const user=auth.status().user;authorization=user?{id:user.id,until:clock()+60000}:null;}
 async function readCatalog(){try{const result=await auth.catalog();remember();return result;}catch(error){clear();throw error;}}
 return {
  async status(){prepared=null;const result=await readCatalog();prepared={result,expiresAt:clock()+5000};return auth.status();},
  async catalog(){const value=prepared;prepared=null;return value&&value.expiresAt>clock()?value.result:readCatalog();},
  async authorizeLocal(){const user=auth.status().user;if(user&&authorization?.id===user.id&&authorization.until>clock())return user.username;try{const name=await auth.verifiedUsername();remember();return name;}catch(error){clear();throw error;}},
  clear
 };
}
module.exports={createAdminCatalogAccess};
