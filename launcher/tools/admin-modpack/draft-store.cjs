'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),model=require('./wizard-model.cjs');
function createDraftStore(root){
  const directory=path.join(root,'borradores'),assets=path.join(directory,'imagenes');
  function safe(file){for(let p=file;;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('No se admiten borradores enlazados.');if(p===path.dirname(p))break;}return file;}
  function file(id){if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id))throw Error('Identificador del lanzador inválido para leer su borrador.');const name=id==='session'||/^pack-[a-f0-9]{16}$/.test(id)?id:'catalog-'+id;return safe(path.join(directory,name+'.json'));}
  function write(id,input){const parsed=model.validate(input);if(!parsed.valid&&id!=='session')throw Object.assign(Error('Datos del borrador inválidos.'),{fields:parsed.errors});const raw=JSON.stringify({schemaVersion:1,...parsed.value});if(Buffer.byteLength(raw)>65536)throw Error('Borrador demasiado grande.');const target=file(id);safe(directory);fs.mkdirSync(directory,{recursive:true});const temp=target+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,raw,{flag:'wx',mode:0o600});fs.renameSync(temp,target);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}return parsed.value;}
  function read(id){const target=file(id);if(!fs.existsSync(target))return null;if(!fs.statSync(target).isFile()||fs.statSync(target).size>65536)throw Error('Borrador inválido.');return model.validate(JSON.parse(fs.readFileSync(target,'utf8'))).value;}
  function image(bytes){if(!Buffer.isBuffer(bytes)||bytes.length>4*1024*1024)throw Error('Imagen inválida.');safe(assets);fs.mkdirSync(assets,{recursive:true});const hash=crypto.createHash('sha256').update(bytes).digest('hex'),target=safe(path.join(assets,hash+'.jpg'));if(!fs.existsSync(target))fs.writeFileSync(target,bytes,{flag:'wx',mode:0o600});return hash;}
  function loadImage(hash){if(!hash)return null;if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Imagen inválida.');const bytes=fs.readFileSync(safe(path.join(assets,hash+'.jpg')));if(bytes.length>4*1024*1024||crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('La imagen del borrador cambió.');return{mime:'image/jpeg',sha256:hash,base64:bytes.toString('base64')};}
  function record(action,packId,actor,extra={}){const event={id:crypto.randomUUID(),at:new Date().toISOString(),action,packId,actor:{id:actor?.id||null,name:actor?.discordName||actor?.username||null},...(extra.version?{version:extra.version}:{}),...(extra.commit?{commit:extra.commit}:{}),...(extra.outcome?{outcome:extra.outcome}:{})};safe(directory);fs.mkdirSync(directory,{recursive:true});fs.appendFileSync(safe(path.join(directory,'acciones.jsonl')),JSON.stringify(event)+'\n',{mode:0o600});return event;}
  function saveDesign(id,input){
    if(id==='session')throw Error('Selecciona un borrador.');
    const target=safe(file(id).replace(/\.json$/,'.design.json'));
    if(typeof input.packName!=='string'||!input.packName.trim()||input.packName.length>80)throw Error('Nombre del lanzador inválido.');
    const presentation=require('../../src/champagne-presentation').validatePresentation({news:input.news,updates:input.updates,background:input.background});
    const imageHash=presentation.background?image(Buffer.from(presentation.background.base64,'base64')):null;
    const value={packName:input.packName.trim(),news:presentation.news,updates:presentation.updates,imageHash};
    fs.mkdirSync(directory,{recursive:true});const temp=target+'.'+crypto.randomUUID()+'.tmp';
    try{fs.writeFileSync(temp,JSON.stringify(value),{flag:'wx',mode:0o600});fs.renameSync(temp,target);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
    return value;
  }
  function loadDesign(id){
    const target=safe(file(id).replace(/\.json$/,'.design.json'));if(!fs.existsSync(target))return null;
    if(!fs.statSync(target).isFile()||fs.statSync(target).size>65536)throw Error('Diseño del borrador inválido.');
    const value=JSON.parse(fs.readFileSync(target,'utf8'));
    const presentation=require('../../src/champagne-presentation').validatePresentation({news:value.news,updates:value.updates,background:loadImage(value.imageHash)});
    return{packName:value.packName,...presentation,background:presentation.background||null};
  }
  const pendingFile=()=>safe(path.join(directory,'pendientes.json'));
  function pending(){
    const target=pendingFile();if(!fs.existsSync(target))return[];
    if(!fs.statSync(target).isFile()||fs.statSync(target).size>262144)throw Error('Cola local inválida.');
    const value=JSON.parse(fs.readFileSync(target,'utf8'));if(!Array.isArray(value)||value.length>200)throw Error('Cola local inválida.');return value;
  }
  function savePending(value){
    const raw=JSON.stringify(value);if(value.length>200||Buffer.byteLength(raw)>262144)throw Error('La cola local está llena; sincroniza antes de continuar.');
    fs.mkdirSync(directory,{recursive:true});const target=pendingFile(),temp=target+'.'+crypto.randomUUID()+'.tmp';
    try{fs.writeFileSync(temp,raw,{flag:'wx',mode:0o600});fs.renameSync(temp,target);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
  }
  function enqueue(input){
    if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.packId||'')||!['publication','audit'].includes(input.type))throw Error('Evento local inválido.');
    const event={id:crypto.randomUUID(),type:input.type,packId:input.packId};if(input.actorId){if(!/^\d{17,20}$/.test(input.actorId))throw Error('Administrador inválido.');event.actorId=input.actorId;}
    if(input.type==='publication'){if(!/^[a-f0-9]{40}$/.test(input.commit||''))throw Error('Commit inválido.');event.commit=input.commit;event.kind=input.kind==='presentation'?'presentation':'modpack';}
    else{if(!['draft_created','draft_saved','publication_error'].includes(input.action)||typeof input.name!=='string'||input.name.length>80)throw Error('Acción local inválida.');event.action=input.action;event.name=input.name;if(input.version&&/^\d+\.\d+\.\d+$/.test(input.version)&&input.version.length<=40)event.version=input.version;}
    const queue=pending();if(event.type==='publication'&&queue.some(e=>e.type===event.type&&e.commit===event.commit&&e.packId===event.packId))return;queue.push(event);savePending(queue);return event;
  }
  function acknowledge(id){savePending(pending().filter(e=>e.id!==id));}
  return{write,read,image,loadImage,record,saveDesign,loadDesign,pending,enqueue,acknowledge};
}
module.exports={createDraftStore};
