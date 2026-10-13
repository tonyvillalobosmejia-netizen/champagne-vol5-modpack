'use strict';
function createAdminCatalogAccess(auth,{clock=Date.now}={}){
 let prepared=null;
 return {
  async status(){prepared=null;const result=await auth.catalog();prepared={result,expiresAt:clock()+5000};return auth.status();},
  async catalog(){const value=prepared;prepared=null;return value&&value.expiresAt>clock()?value.result:auth.catalog();},
  clear(){prepared=null;}
 };
}
module.exports={createAdminCatalogAccess};
