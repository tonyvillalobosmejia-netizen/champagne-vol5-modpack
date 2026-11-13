'use strict';
const crypto=require('node:crypto');
const {reliableRequest}=require('./reliable-request.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

// Callers supply one HTTP attempt; transport and integrity share one budget.
async function downloadVerified(entry,download,{sleep,onRetry}={}){
 return reliableRequest(async attempts=>{
  let bytes=Buffer.from(await download(entry.url));
  const receivedSha256=hash(bytes),receivedBytes=bytes.length,expectedSha256=entry.sha256.toLowerCase();
  if(receivedSha256!==expectedSha256){
   bytes=null;
   const file=String(entry.path).split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f]/g,'');
   throw Object.assign(new Error('La descarga no coincide: '+file+'. Intentos realizados: '+attempts+'. SHA-256 esperado: '+expectedSha256+'. SHA-256 recibido: '+receivedSha256+'. Tamaño recibido: '+receivedBytes+' bytes. Publicación detenida para proteger la integridad del modpack.'),{code:'ERR_DOWNLOAD_INTEGRITY',attempts,expectedSha256,receivedSha256,receivedBytes});
  }
  if(entry.bytes!==undefined&&receivedBytes!==entry.bytes)throw Error('SHA-256 o tamaño incorrecto: '+entry.path);
  return bytes;
 },{safe:true,retryIntegrity:true,sleep,onRetry});
}

function createVerifiedContentCache({clock=Date.now,maxBytes=64*1024*1024,ttl=120000,sleep}={}){
 const cache=new Map(),pending=new Map();let size=0;
 return async function verified(entry,download,onRetry){
  const key=entry.url+'|'+entry.sha256+'|'+entry.bytes,hit=cache.get(key);
  if(hit&&hit.until>clock())return Buffer.from(hit.bytes);
  if(hit){size-=hit.bytes.length;cache.delete(key);}
  if(pending.has(key))return Buffer.from(await pending.get(key));
  const work=(async()=>{
   const bytes=await downloadVerified(entry,download,{sleep,onRetry});
   if(bytes.length<=maxBytes){
    while(size+bytes.length>maxBytes&&cache.size){const oldest=cache.keys().next().value;size-=cache.get(oldest).bytes.length;cache.delete(oldest);}
    cache.set(key,{bytes:Buffer.from(bytes),until:clock()+ttl});size+=bytes.length;
   }
   return bytes;
  })();
  pending.set(key,work);
  try{return Buffer.from(await work);}finally{pending.delete(key);}
 };
}

function createVerificationReceipts({clock=Date.now,ttl=300000,maxEntries=500,sleep}={}){
 const receipts=new Map();
 return async(entry,download,onRetry)=>{
  const key=entry.url+'|'+entry.sha256,prior=receipts.get(key);
  if(prior>clock())return true;
  receipts.delete(key);
  await downloadVerified(entry,download,{sleep,onRetry});
  if(receipts.size>=maxEntries)receipts.delete(receipts.keys().next().value);
  receipts.set(key,clock()+ttl);
  return false;
 };
}
module.exports={createVerifiedContentCache,createVerificationReceipts};
