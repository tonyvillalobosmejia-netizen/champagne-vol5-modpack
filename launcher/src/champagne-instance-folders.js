'use strict';
const fs=require('node:fs'),path=require('node:path');
function folderName(name){let value=String(name||'Lanzador').normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').trim().slice(0,80);if(!value||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value))value='Lanzador '+value;return value;}
function namedInstance(root,game,legacy,{migrate=true}={}){const base=path.resolve(root,'instances'),registry=path.resolve(root,'metadata','instance-folders.json');const key=[game.serverId,game.minecraftVersion,game.forgeVersion,game.javaMajor].join('|');
 const within=p=>{const rel=path.relative(base,path.resolve(p));if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw Error('Carpeta de instancia inválida.');return path.resolve(p);};
 for(const dir of [path.resolve(root),base,path.dirname(registry)])if(fs.existsSync(dir)&&fs.lstatSync(dir).isSymbolicLink())throw Error('Carpeta de instancias insegura.');
 let entries={};if(fs.existsSync(registry)){if(fs.lstatSync(registry).isSymbolicLink())throw Error('Registro de carpetas inválido.');entries=JSON.parse(fs.readFileSync(registry,'utf8'));}
 const old=entries[key]?within(path.join(base,entries[key])):within(legacy),name=folderName(game.packName);let target=within(path.join(base,name));
 if(target.toLowerCase()!==old.toLowerCase()&&(fs.existsSync(target)||Object.entries(entries).some(([k,v])=>k!==key&&v.toLowerCase()===name.toLowerCase())))target=within(path.join(base,name+' - '+require('node:crypto').createHash('sha256').update(key).digest('hex').slice(0,8)));
 for(const p of [old,target])if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('La instancia no puede ser un enlace.');
 if(!migrate)return fs.existsSync(old)||entries[key]?old:target;
 fs.mkdirSync(base,{recursive:true});if(old!==target&&fs.existsSync(old)){if(fs.existsSync(target))throw Error('La carpeta de destino ya existe. Se conservan ambas instalaciones.');try{fs.renameSync(old,target);}catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code))throw error;target=old;}}
 entries[key]=path.basename(target);fs.mkdirSync(path.dirname(registry),{recursive:true});const tmp=registry+'.'+require('node:crypto').randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(entries,null,2),{flag:'wx'});fs.renameSync(tmp,registry);return target;
}
module.exports={folderName,namedInstance};
