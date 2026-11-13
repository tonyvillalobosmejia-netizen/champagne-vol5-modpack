'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {modPathKey,checkedModTarget,validateModPathSets}=require('../src/champagne-update-paths');
const {validatePath}=require('../src/champagne-config-sync');
const {prepareContent}=require('../src/champagne-remote-content');
const engine=require('../tools/admin-modpack/engine.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function temp(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-forge-names-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function content(){const bytes=Buffer.from('config=true\n');return{packId:'forge-prueba',version:'0.0.1',expectedFiles:1,files:[{path:'config/Aspecto [Forge] español.json',bytes:bytes.length,sha256:hash(bytes),base64:bytes.toString('base64')}]};}
test('Admite nombres originales Forge con corchetes, Unicode y puntuación',()=>{
 for(const name of ['dungeons-and-taverns-ancient-city-overhaul-1 [Forge].jar','Módulo español 1.0.jar','[Forge] 开始.jar',"Mod's versión #1 & 2.jar",'.mod-oculto.jar','..nombre-valido.jar']){
  const p='mods/'+name;assert.equal(modPathKey(p),p.toLowerCase());assert.ok(checkedModTarget(os.tmpdir(),p).endsWith(name));
 }
 for(const p of ['config/Español [Forge].toml','scripts/Guión #1.js','shaderpacks/ComplementaryReimagined_r5.9.3.zip','resourcepacks/Texturas [高清].zip'])assert.equal(validatePath(p),p);
});
test('Bloquea traversal, ADS, dispositivos, otras extensiones y nombres ambiguos',()=>{
 for(const p of ['mods/../evil.jar','mods/a/b.jar','mods/a\\b.jar','mods/a.jar:stream','mods/a?.jar','mods/NUL.jar','mods/COM¹.jar','mods/LPT².jar','mods/a.exe','mods/.jar','mods/a.jar ','mods/a.jar.'])assert.throws(()=>modPathKey(p));
 for(const p of ['config/../evil.json','config/COM¹.json','config/a.json:stream','config/enlace\\evil.json','saves/world.dat','config/mod.jar'])assert.throws(()=>validatePath(p));
 assert.throws(()=>validateModPathSets([{path:'mods/Mod [Forge].jar'},{path:'mods/mod [forge].jar'}],[]),/duplicado/);
});
test('Los nombres nuevos no permiten seguir junctions',t=>{const root=temp(t),outside=path.join(root,'externo'),instance=path.join(root,'cliente');fs.mkdirSync(outside);fs.mkdirSync(instance);fs.symlinkSync(outside,path.join(instance,'mods'),'junction');assert.throws(()=>checkedModTarget(instance,'mods/Mod [Forge].jar'),/junction|simbólico/);fs.unlinkSync(path.join(instance,'mods'));});
test('Contenido válido conserva nombre y SHA-256 sin alterar el origen',async t=>{const root=temp(t),c=content();await prepareContent(c,path.join(root,'bundle'),()=>{throw Error('No necesita red');});const result=fs.readFileSync(path.join(root,'bundle','files',c.files[0].path));assert.equal(hash(result),c.files[0].sha256);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'bundle','manifest.json'))).files[0].path,c.files[0].path);});
for(const [label,modify,expected]of [
 ['identificador',c=>c.packId='',/identificador/],
 ['versión',c=>c.version='',/versión/],
 ['lista',c=>c.files=null,/files debe ser una lista/],
 ['selección vacía',c=>{c.files=[];c.expectedFiles=0;},/no hay archivos/],
 ['contador',c=>c.expectedFiles=2,/expectedFiles.*1 archivos/],
 ['límite',c=>{c.files=Array(2001).fill(c.files[0]);c.expectedFiles=2001;},/2001.*2000/],
 ['hash',c=>c.files[0].sha256='0'.repeat(64),/SHA-256.*Aspecto \[Forge\]/]
])test('Diagnóstico específico de contenido: '+label,async t=>{const root=temp(t),c=content();modify(c);await assert.rejects(prepareContent(c,path.join(root,'bundle'),()=>{throw Error('No descargar');}),expected);});
test('Un recurso rechazado identifica el archivo sin mostrar credenciales de la URL',async t=>{const root=temp(t),c=content(),item=c.files[0];delete item.base64;item.url='https://usuario:SECRETO_PRIVADO@example.invalid/recurso?token=NO_MOSTRAR';await assert.rejects(prepareContent(c,path.join(root,'bundle'),()=>{throw Error('No descargar');}),e=>e.message.includes(item.path)&&e.message.includes('Fuente de recursos no autorizada')&&!e.message.includes('SECRETO_PRIVADO')&&!e.message.includes('NO_MOSTRAR'));});
test('Preparación y publicación conservan JAR con [Forge], mundos e historial',async t=>{
 const root=temp(t),name='dungeons-and-taverns-ancient-city-overhaul-1 [Forge].jar',mod=Buffer.from('jar exacto de prueba'),cfg=Buffer.from('setting=true\n');
 fs.mkdirSync(path.join(root,'mods'));fs.mkdirSync(path.join(root,'config'));fs.mkdirSync(path.join(root,'saves'));fs.writeFileSync(path.join(root,'mods',name),mod);fs.writeFileSync(path.join(root,'config','Aspecto [Forge].toml'),cfg);fs.writeFileSync(path.join(root,'saves','world.dat'),'mundo preservado');fs.writeFileSync(path.join(root,'minecraftinstance.json'),JSON.stringify({gameVersion:'1.20.1',baseModLoader:{forgeVersion:'47.4.10'},installedAddons:[]}));
 const game={serverId:'champagne-vol5',loader:'forge',minecraftVersion:'1.20.1',forgeVersion:'47.4.10',javaMajor:17,forgeInstallerSha1:'a'.repeat(40),packName:'Prueba Forge'},entry={path:'mods/'+name,sha256:hash(mod),url:'https://cdn.modrinth.com/data/test/versions/test/mod.jar',acquisition:'official_direct'};
 const original={packId:'champagne-vol5',version:'0.0.1',minecraftVersion:'1.20.1',forgeVersion:'47.4.10',expectedFiles:1,files:[entry],delete:[],game,content:{packId:'champagne-vol5',version:'0.0.1',expectedFiles:1,files:[{path:'config/Aspecto [Forge].toml',bytes:cfg.length,sha256:hash(cfg),base64:cfg.toString('base64')}]},presentation:{news:{title:'Noticias',text:'Texto'},updates:{title:'Cambios',text:'Texto'}}};
 const snapshots=new Map([['mods/'+name,hash(mod)],['saves/world.dat',hash(Buffer.from('mundo preservado'))],['config/Aspecto [Forge].toml',hash(cfg)]]);
 const writes=[],blobs=new Map();let tree;
 const fetcher=async(url,init={})=>{const body=init.body?JSON.parse(init.body):null;const method=init.method||'GET';if(method!=='GET')writes.push({url,method,body});let value;
  if(url.endsWith('/git/ref/heads/'+engine.BRANCH))value={object:{sha:'old'}};
  else if(url.endsWith('/old/updates/stable-v2.json'))value=original;
  else if(url.endsWith('/releases/latest'))value={tag_name:'v0.1.16'};
  else if(url.endsWith('/git/commits/old'))value={tree:{sha:'base'}};
  else if(url.endsWith('/old/updates/history.json'))value=[{version:'0.0.1',packName:'Prueba Forge',notes:'Anterior'}];
  else if(url.includes('/contents/updates/versions/'))return new Response('',{status:404});
  else if(url===entry.url)return new Response(mod);
  else if(url.endsWith('/git/blobs')){const sha='blob-'+blobs.size;blobs.set(sha,Buffer.from(body.content,'base64'));value={sha};}
  else if(url.endsWith('/git/trees')){tree=body;value={sha:'tree'};}
  else if(url.endsWith('/git/commits'))value={sha:'next'};
  else if(url.includes('/next/')){const relative=url.split('/next/')[1],n=tree.tree.find(x=>x.path===relative);assert.ok(n,relative);return new Response(blobs.get(n.sha));}
  else if(method==='PATCH')value={};else throw Error('Solicitud inesperada '+url);return Response.json(value);
 };
 const plan=await engine.analyze(root,()=>{},fetcher);
 plan.design={packName:'Prueba Forge',news:{title:'Noticias',text:'Texto'},updates:{title:'Cambios',text:'Texto'}};
 const selected=plan.contentCandidates.filter(x=>x.entry).map(x=>x.path),manifest=engine.buildManifest(plan,'0.0.2',selected);
 await engine.validatePackage(manifest,()=>{},fetcher);
 const result=await engine.publish(plan,manifest,{token:'FAKE_ONLY_TOKEN_123456789',tested:true,reviewed:true,fetcher});
 assert.equal(result.version,'0.0.2');assert.equal(manifest.files[0].path,'mods/'+name);assert.ok(tree.tree.some(n=>n.path==='updates/versions/modpack-0.0.2.json'));assert.equal(tree.tree.some(n=>n.sha===null),false);
 const historyNode=tree.tree.find(n=>n.path==='updates/history.json'),history=JSON.parse(blobs.get(historyNode.sha));assert.ok(history.some(x=>x.version==='0.0.1'));
 for(const [relative,digest]of snapshots)assert.equal(hash(fs.readFileSync(path.join(root,relative))),digest);
 assert.equal(writes.at(-1).body.force,false);
});
