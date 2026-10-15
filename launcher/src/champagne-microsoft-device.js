'use strict';
function copyDeviceCode(data,clipboard){
 if(!data)return null;
 let copied=false;
 if(typeof data.code==='string'&&/^[A-Z0-9-]{4,32}$/i.test(data.code)){try{clipboard.writeText(data.code);copied=true;}catch{}}
 return{...data,copied};
}
module.exports={copyDeviceCode};
