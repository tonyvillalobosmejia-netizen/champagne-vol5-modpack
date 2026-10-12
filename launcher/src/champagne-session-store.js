'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function createSessionStore({directory,safeStorage,scope}) {
 const file=path.join(directory,'account-session.bin');
 function available(){return safeStorage?.isEncryptionAvailable() && safeStorage.getSelectedStorageBackend?.()!=='basic_text';}
 function regular(){if(fs.existsSync(directory)&&fs.lstatSync(directory).isSymbolicLink())throw Error('Carpeta de sesión inválida.');if(fs.existsSync(file)&&(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()))throw Error('Archivo de sesión inválido.');}
 return {
 load(){try{if(!available())return null;regular();if(!fs.existsSync(file)||fs.statSync(file).size>65536)return null;const v=JSON.parse(safeStorage.decryptString(fs.readFileSync(file)));return v.scope===scope?v.session:null;}catch{return null;}},
 save(session){if(!available())throw Error('Windows no permite proteger la sesión.');regular();fs.mkdirSync(directory,{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,safeStorage.encryptString(JSON.stringify({scope,session})),{flag:'wx',mode:0o600});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}},
 clear(){regular();if(fs.existsSync(file))fs.unlinkSync(file);}
 };
}
module.exports={createSessionStore};
