// Read publication metadata while discarding embedded payload strings. No source files are rewritten.
export async function publicationMetadata(response,{maxBytes=64*1024*1024,maxMetadata=2*1024*1024}={}){
 if(!response.ok||!response.body)throw Error('No se pudo leer el manifiesto confirmado.');
 const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let bytes=0,output='',token='',mode='normal',escape=false,base64Key=false,skipValue=false,tailEscape=false;
 function append(value){output+=value;if(output.length>maxMetadata)throw Error('Metadatos del manifiesto demasiado grandes.');}
 function consume(text){let i=0;while(i<text.length){if(mode==='skip'){let end=text.indexOf('"',i);if(end<0){let slashes=0;for(let p=text.length-1;p>=i&&text[p]==='\\';p--)slashes++;tailEscape=(slashes%2===1)!==(slashes===text.length-i&&tailEscape);return;}let slashes=0;for(let p=end-1;p>=i&&text[p]==='\\';p--)slashes++;const escaped=(slashes%2===1)!==(slashes===end-i&&tailEscape);tailEscape=false;i=end+1;if(escaped)continue;mode='normal';continue;}
 const c=text[i++];if(mode==='string'){token+=c;if(token.length>65536)throw Error('Texto de metadatos demasiado largo.');if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c==='"'){append(token);base64Key=token==='"base64"';token='';mode='normal';}continue;}
 if(c==='"'){if(skipValue){append('""');mode='skip';skipValue=false;tailEscape=false;}else{mode='string';token='"';escape=false;}continue;}
 append(c);if(c===':'&&base64Key){skipValue=true;base64Key=false;}else if(!/\s/.test(c)){base64Key=false;if(c!==':')skipValue=false;}
 }}
 try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>maxBytes)throw Error('Manifiesto confirmado superior a 64 MiB.');consume(decoder.decode(part.value,{stream:true}));}consume(decoder.decode());if(mode!=='normal')throw Error('Manifiesto confirmado incompleto.');return JSON.parse(output);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
