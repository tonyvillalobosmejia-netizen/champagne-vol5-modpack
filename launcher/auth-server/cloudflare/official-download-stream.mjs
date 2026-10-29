export function officialDownloadResponse(body, length, Stream=globalThis.FixedLengthStream) {
 if(!Number.isSafeInteger(length)||length<=0||length>128*1024*1024)throw Error('Tamaño oficial inválido.');
 let readable;
 if(Stream){
  const fixed=new Stream(length);
  // Failure aborts the readable side; never convert a partial transfer to success.
  body.pipeTo(fixed.writable).catch(()=>{});
  readable=fixed.readable;
 }else{
  // Node-only test fallback. Production uses the native Workers stream.
  let bytes=0;
  readable=body.pipeThrough(new TransformStream({transform(chunk,controller){bytes+=chunk.byteLength;if(bytes>length)throw Error('Descarga excedida');controller.enqueue(chunk);},flush(){if(bytes!==length)throw Error('Descarga incompleta');}}));
 }
 return new Response(readable,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(length),'X-VillaWolf-File-Length':String(length),'Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'}});
}
