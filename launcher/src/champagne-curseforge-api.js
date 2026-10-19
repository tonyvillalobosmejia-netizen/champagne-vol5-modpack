'use strict';
// MurmurHash2 de CurseForge: se omiten TAB, LF, CR y espacio.
function fingerprint(bytes){const work=Buffer.allocUnsafe(bytes.length);let count=0;for(let p=0;p<bytes.length;p++){const b=bytes[p];if(b!==9&&b!==10&&b!==13&&b!==32)work[count++]=b;}const filtered=work.subarray(0,count);const m=0x5bd1e995;let h=(1^filtered.length)>>>0,i=0;for(;i+4<=filtered.length;i+=4){let k=filtered.readUInt32LE(i);k=Math.imul(k,m)>>>0;k^=k>>>24;k=Math.imul(k,m)>>>0;h=(Math.imul(h,m)^k)>>>0;}const remaining=filtered.length-i;if(remaining===3)h^=filtered[i+2]<<16;if(remaining>=2)h^=filtered[i+1]<<8;if(remaining>=1){h^=filtered[i];h=Math.imul(h,m)>>>0;}h^=h>>>13;h=Math.imul(h,m)>>>0;h^=h>>>15;return h>>>0;}
function isCurseForgeFile(raw){try{const u=new URL(raw);return ['https://edge.forgecdn.net','https://mediafilez.forgecdn.net'].includes(u.origin)&&!u.search&&!u.hash&&!u.username&&!u.password&&/^\/files\/[0-9]+\/[0-9]+\/[^/]+\.jar$/.test(u.pathname);}catch{return false;}}

function downloadThroughService({endpoint,token,input,admin=false,onProgress=()=>{}}){
 if(!endpoint||!/^[A-Za-z0-9_-]{43}$/.test(token||''))return Promise.reject(Error('Inicia sesión con Discord para descargar.'));
 const http=require('node:http'),https=require('node:https'),payload=JSON.stringify(input),url=new URL(admin?'/v2/admin/curseforge/download':'/v2/curseforge/download',endpoint);
 return new Promise((resolve,reject)=>{const req=(url.protocol==='https:'?https:http).request(url,{method:'POST',headers:{Authorization:'Bearer '+token,Accept:'application/octet-stream','Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},res=>{
  const chunks=[];let size=0;const good=res.statusCode===200,limit=good?128*1024*1024:65536;
  const rawLength=res.headers['x-villawolf-file-length']??res.headers['content-length'],total=rawLength===undefined?0:Number(rawLength);
  const incomplete=()=>Object.assign(Error('Descarga oficial incompleta: '+size+' de '+(total||'tamaño no indicado')+' bytes. No se aceptó el archivo.'),{code:'ERR_INCOMPLETE_DOWNLOAD',receivedBytes:size,expectedBytes:total||undefined});
  if(good&&rawLength!==undefined&&(!/^[1-9][0-9]*$/.test(rawLength)||!Number.isSafeInteger(total)||total>limit)){res.resume();reject(Error('Tamaño oficial de descarga inválido.'));return;}
  res.on('data',b=>{size+=b.length;if(size>limit){req.destroy(Error('La descarga supera el límite permitido.'));return;}chunks.push(b);if(good)onProgress({bytes:size,totalBytes:total});});
  res.on('aborted',()=>{chunks.length=0;reject(good?incomplete():Error('Respuesta del servicio interrumpida.'));});
  res.on('error',error=>{chunks.length=0;reject(good?incomplete():error);});
  res.on('end',()=>{if(!good){let message='No se pudo descargar desde CurseForge.';try{message=JSON.parse(Buffer.concat(chunks)).message||message;}catch{}const error=Error(message);error.status=res.statusCode;return reject(error);}if(!size||total&&size!==total){chunks.length=0;return reject(incomplete());}resolve(Buffer.concat(chunks));});
 });req.setTimeout(120000,()=>req.destroy(Error('CurseForge tardó demasiado. Puedes reintentar.')));req.on('error',reject);req.end(payload);});
}


function uploadGitHubBlob({endpoint,token,content}){
 if(!endpoint||!/^[A-Za-z0-9_-]{43}$/.test(token||'')||typeof content!=='string'||content.length>64*1024*1024)return Promise.reject(Error('Conexión o paquete inválido.'));
 const http=require('node:http'),https=require('node:https'),{Readable}=require('node:stream'),decoded=Buffer.from(content,'base64').toString('utf8'),url=new URL('/v2/admin/github/blob',endpoint);
 if(!/^[\s]*[\[{]/.test(decoded)||/(?:github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,})/.test(decoded))return Promise.reject(Error('El archivo no es JSON publicable o contiene una credencial.'));
 const raw=Buffer.from(JSON.stringify({encoding:'utf-8',content:decoded}));
 return new Promise((resolve,reject)=>{const req=(url.protocol==='https:'?https:http).request(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Content-Length':raw.length,Accept:'application/json'}},res=>{const chunks=[];let size=0;res.on('data',b=>{size+=b.length;if(size>65536)req.destroy(Error('Respuesta de GitHub demasiado grande.'));else chunks.push(b);});res.on('aborted',()=>reject(Error('Publicación interrumpida.')));res.on('error',reject);res.on('end',()=>{try{const value=JSON.parse(Buffer.concat(chunks));if(res.statusCode!==200||!value.ok){const error=Error(value.message||'GitHub no pudo preparar el archivo.');error.status=res.statusCode;return reject(error);}resolve(value);}catch{reject(Error('Respuesta del servicio inválida.'));}});});req.setTimeout(120000,()=>req.destroy(Error('La publicación tardó demasiado. Vuelve a comprobar su estado.')));req.on('error',reject);Readable.from((function*(){for(let i=0;i<raw.length;i+=65536)yield raw.subarray(i,i+65536);})()).pipe(req);});
}

module.exports={fingerprint,isCurseForgeFile,downloadThroughService,uploadGitHubBlob};
