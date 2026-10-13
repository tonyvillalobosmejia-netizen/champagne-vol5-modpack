'use strict';const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function createPackSourceStore(directory){
 function settings(id){if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id||''))throw Error('Selecciona un lanzador válido.');return path.join(directory,'settings-'+id+'.json');}
 function read(file){try{const data=JSON.parse(fs.readFileSync(file,'utf8'));return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return{};}}
 function valid(source){return typeof source==='string'&&source.length<=4096&&path.isAbsolute(source);}
 function write(id,source){const file=settings(id);if(!valid(source))throw Error('Elige una carpeta válida.');const data=read(file);if(data.packId&&data.packId!==id)throw Error('Ajustes de otro lanzador.');fs.mkdirSync(directory,{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify({...data,packId:id,source},null,2));fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}return source;}
 function load(id){const file=settings(id),data=read(file);if(data.packId&&data.packId!==id)throw Error('Ajustes de otro lanzador.');if(valid(data.source))return data.source;if(!fs.existsSync(file)&&id==='champagne-vol5'){const legacy=read(path.join(directory,'settings.json'));if(valid(legacy.source)&&(!legacy.packId||legacy.packId===id))return write(id,legacy.source);}return '';}
 function save(id,source){settings(id);if(typeof source!=='string')throw Error('Elige una carpeta válida.');source=source.trim();if(!valid(source)||!fs.existsSync(source)||!fs.statSync(source).isDirectory())throw Error('La carpeta no existe. La ruta anterior se conserva.');return write(id,source);}
 return{load,save};
}
module.exports={createPackSourceStore};
