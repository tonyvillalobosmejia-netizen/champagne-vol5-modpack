'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function createAvatarChoice(directory){
 const file=path.join(directory,'avatar-choice.json');
 function key(id){if(typeof id!=='string'||!/^discord:\d{17,20}$/.test(id))throw Error('Inicia sesión con Discord.');return id;}
 function read(){try{if(fs.lstatSync(file).isSymbolicLink()||fs.statSync(file).size>32768)return{};const value=JSON.parse(fs.readFileSync(file,'utf8'));return value.schemaVersion===1&&value.choices&&typeof value.choices==='object'?value.choices:{};}catch{return{};}}
 function get(id,premium){if(!id||!/^discord:\d{17,20}$/.test(id))return'discord';return premium&&read()[id]==='minecraft'?'minecraft':'discord';}
 function set(id,source,premium){key(id);if(!['discord','minecraft'].includes(source))throw Error('Imagen de perfil inválida.');if(source==='minecraft'&&!premium)throw Error('Vincula Minecraft Java Premium para usar tu skin oficial.');const choices=read();choices[id]=source;if(Object.keys(choices).length>100)throw Error('Demasiados perfiles guardados.');fs.mkdirSync(directory,{recursive:true});if(fs.existsSync(file)&&fs.lstatSync(file).isSymbolicLink())throw Error('Archivo de perfil no permitido.');const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify({schemaVersion:1,choices}),{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}return source;}
 return{get,set};
}
module.exports={createAvatarChoice};
