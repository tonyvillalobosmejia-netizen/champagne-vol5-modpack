'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),model=require('../../src/champagne-manual-announcement.cjs');
function draft(input,packId){
 if(input?.packId!==packId)throw Error('El lanzador cambió. Recarga el anuncio.');
 const v=model.validate({...input,channelId:input.channelId||'10000000000000000',title:input.title||'Borrador',text:input.text||'Borrador'});
 return{...v,channelId:input.channelId||'',title:input.title||'',text:input.text||''};
}
function createStore(root){
 const directory=path.resolve(root,'borradores','anuncios');
 function target(id){if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id||''))throw Error('Lanzador inválido.');const file=path.join(directory,id+'.json');for(let p=file;;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('No se permiten enlaces en borradores.');if(p===path.dirname(p))break;}return file;}
 return{read(id){const file=target(id);if(!fs.existsSync(file))return null;if(!fs.lstatSync(file).isFile()||fs.statSync(file).size>750000)throw Error('Borrador de anuncio inválido.');return draft(JSON.parse(fs.readFileSync(file,'utf8')),id);},write(id,input){const v=draft(input,id),file=target(id);fs.mkdirSync(directory,{recursive:true});const temporary=file+'.'+crypto.randomUUID()+'.tmp';try{const fd=fs.openSync(temporary,'wx');try{fs.writeFileSync(fd,JSON.stringify(v));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}target(id);fs.renameSync(temporary,file);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}return v;}};
}
function prepareImage(file,nativeImage){
 const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16*1024*1024||!/^\.(png|jpe?g)$/i.test(path.extname(file)))throw Error('Selecciona una imagen PNG o JPG normal de hasta 16 MB.');
 let image=nativeImage.createFromBuffer(fs.readFileSync(file));if(image.isEmpty())throw Error('No se pudo leer la imagen.');const size=image.getSize();if(size.width>16000||size.height>16000)throw Error('La imagen tiene dimensiones excesivas.');
 if(Math.max(size.width,size.height)>1920)image=image.resize(size.width>=size.height?{width:1920}:{height:1920});
 let bytes;for(const quality of [88,76,64,52,40]){bytes=image.toJPEG(quality);if(bytes.length<=524288)break;}
 if(!bytes||bytes.length>524288)throw Error('La imagen sigue siendo demasiado grande; selecciona una más pequeña.');
 return{mime:'image/jpeg',base64:bytes.toString('base64'),sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
}
module.exports={createStore,prepareImage,draft};
