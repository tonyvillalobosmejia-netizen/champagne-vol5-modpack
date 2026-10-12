'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const e=require('../tools/admin-modpack/engine.cjs');
const bytes=Buffer.from('exact-mod'),config=Buffer.from('setting=true\n');
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-admin-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.mkdirSync(path.join(dir,'mods'));fs.mkdirSync(path.join(dir,'config'));
  fs.writeFileSync(path.join(dir,'mods','test.jar'),bytes);fs.writeFileSync(path.join(dir,'config','safe.toml'),config);
  fs.writeFileSync(path.join(dir,'minecraftinstance.json'),JSON.stringify({gameVersion:'1.20.1',baseModLoader:{forgeVersion:'47.4.10'},installedAddons:[]}));
  fs.mkdirSync(path.join(dir,'saves'));fs.writeFileSync(path.join(dir,'saves','world.dat'),'world');fs.writeFileSync(path.join(dir,'options.txt'),'personal');
  const game={serverId:'champagne-vol5',loader:'forge',minecraftVersion:'1.20.1',forgeVersion:'47.4.10',javaMajor:17,forgeInstallerSha1:'a'.repeat(40),packName:'Mundo Conejil'};
  const manifest={packId:'champagne-vol5',version:'0.1.4',minecraftVersion:'1.20.1',forgeVersion:'47.4.10',expectedFiles:1,files:[{path:'mods/test.jar',sha256:e.hash(bytes),acquisition:'official_direct',url:'https://cdn.modrinth.com/data/test/versions/exact/test.jar'}],delete:[],game,content:{packId:'champagne-vol5',version:'0.1.4',expectedFiles:1,files:[{path:'config/safe.toml',bytes:config.length,sha256:e.hash(config),base64:config.toString('base64')}]}};
  const current=e.scan(dir);
  const plan={base:{head:'old',manifest},current,files:structuredClone(manifest.files),game,unresolved:[],modChanges:{added:[],changed:[],removed:[]},contentCandidates:[{path:'config/safe.toml',entry:manifest.content.files[0]}]};
  return{dir,manifest,plan};
}
function service(f,options={}){
  const calls=[];let refs=0,blobRaw;
  const fetcher=async(url,init={})=>{const body=init.body?JSON.parse(init.body):null;calls.push({url,method:init.method||'GET',body});let out;
    if(url.includes('cdn.modrinth'))return new Response(options.badDownload?'wrong':bytes);
    if(url.endsWith('/releases/latest'))return new Response(JSON.stringify({tag_name:options.oldLauncher?'v0.1.10':'v0.1.11'}));
    if(url.endsWith('/git/ref/heads/preparacion-paso97'))out={object:{sha:options.conflict&&++refs>=2?'other':'old'}};
    else if(url.includes('/git/commits/old'))out={tree:{sha:'tree-old'}};
    else if(url.includes('/contents/updates/versions/'))return new Response('{}',{status:options.existing?200:404});
    else if(url.endsWith('/git/blobs')){const raw=Buffer.from(body.content,'base64');if(!Array.isArray(JSON.parse(raw)))blobRaw=raw;out={sha:'blob'};}
    else if(url.endsWith('/updates/history.json'))return new Response('{}',{status:404});
    else if(url.endsWith('/git/trees'))out={sha:'tree-new'};
    else if(url.endsWith('/git/commits'))out={sha:'new'};
    else if(url.includes('/new/updates/stable-v2.json'))return new Response(options.badUpload?'bad':blobRaw);
    else if(url.endsWith('/git/refs/heads/preparacion-paso97'))out={object:{sha:'new'}};
    else throw new Error('Unexpected request '+url);
    return new Response(JSON.stringify(out));
  };return{fetcher,calls};
}
test('no recopila mundos/opciones y elimina identificadores QuickSkin/Embeddium',t=>{
  const f=fixture(t);assert.equal(f.plan.current.content.length,1);
  const clean=e.privacy({path:'config/quickskin-client.json',bytes:Buffer.from(JSON.stringify({activeSkinHash:'private',playerOwnSkinHash:'private',accountSkins:{skins:{uuid:'Tony'}},showSkinPreviewOverlay:true}))});
  assert.deepEqual(JSON.parse(clean.bytes),{showSkinPreviewOverlay:true});
  assert.equal(e.privacy({path:'config/auth-token.json',bytes:Buffer.from('{}')}),null);
  assert.equal(e.privacy({path:'config/plugin.toml',bytes:Buffer.from('password="verysecretpassword"')}),null);
});
test('bloquea mods pendientes, ZIP sin descarga y versiones anteriores',t=>{
  const {plan}=fixture(t);assert.throws(()=>e.buildManifest(plan,'0.1.4',['config/safe.toml']));
  plan.unresolved=['mods/new.jar'];assert.throws(()=>e.buildManifest(plan,'0.1.5',['config/safe.toml']));plan.unresolved=[];
  assert.throws(()=>e.buildManifest(plan,'0.1.5',['shaderpacks/private.zip']));
});
test('conserva eliminaciones acumuladas y evita eliminar mods deseados',t=>{
  const {plan}=fixture(t);plan.base.manifest.delete=['mods/old.jar','mods/test.jar'];plan.modChanges.removed=['mods/previous.jar'];
  assert.deepEqual(e.buildManifest(plan,'0.1.5',['config/safe.toml']).delete,['mods/old.jar','mods/previous.jar']);
});
test('detecta cambios en CurseForge después del análisis',t=>{
  const {plan,dir}=fixture(t);fs.writeFileSync(path.join(dir,'mods','test.jar'),'changed');assert.throws(()=>e.assertSourceUnchanged(plan),/cambió/);
});
test('no sigue enlaces de mods hacia archivos externos',t=>{
  const {dir}=fixture(t);const external=path.join(dir,'outside');fs.mkdirSync(external);fs.writeFileSync(path.join(external,'data.jar'),bytes);
  fs.renameSync(path.join(dir,'mods'),path.join(dir,'previous-mods'));fs.symlinkSync(external,path.join(dir,'mods'),'junction');
  assert.throws(()=>e.scan(dir),/junction|enlazad/);fs.unlinkSync(path.join(dir,'mods'));
});
test('usa metadatos CurseForge sólo si coinciden los bytes instalados',()=>{
  const mod={path:'mods/test.jar',sha1:e.hash(bytes,'sha1'),sha256:e.hash(bytes)};
  const addons=[{websiteUrl:'https://www.curseforge.com/minecraft/mc-mods/test',installedFile:{id:123,fileName:'test.jar',hashes:[{type:1,value:mod.sha1}]}}];
  assert.equal(e.curseSource(mod,addons).pageUrl,'https://www.curseforge.com/minecraft/mc-mods/test/files/123');
  addons[0].installedFile.hashes[0].value='0'.repeat(40);assert.equal(e.curseSource(mod,addons),null);
});
test('publica un commit completo y verifica los bytes antes de activar, sin subir JAR ni secretos',async t=>{
  const f=fixture(t),s=service(f),m=e.buildManifest(f.plan,'0.1.5',['config/safe.toml']);
  const result=await e.publish(f.plan,m,{token:'test_token_not_real_12345678',tested:true,reviewed:true,fetcher:s.fetcher});
  assert.equal(result.commit,'new');const patch=s.calls.find(c=>c.method==='PATCH');assert.deepEqual(patch.body,{sha:'new',force:false});
  const tree=s.calls.find(c=>c.url.endsWith('/git/trees')).body;assert.deepEqual(tree.tree.map(e=>e.path),['updates/versions/modpack-0.1.5.json','updates/stable-v2.json','updates/history.json']);
  assert.ok(s.calls.findIndex(c=>c.url.includes('/new/updates/'))<s.calls.indexOf(patch));
  assert.ok(!JSON.stringify(s.calls).includes('test_token_not_real'));assert.equal(fs.readFileSync(path.join(f.dir,'options.txt'),'utf8'),'personal');
});
for(const scenario of ['conflict','badDownload','badUpload','existing'])test('no activa el canal si falla '+scenario,async t=>{
  const f=fixture(t),s=service(f,{[scenario]:true}),m=e.buildManifest(f.plan,'0.1.5',['config/safe.toml']);
  await assert.rejects(e.publish(f.plan,m,{token:'test_token_not_real_12345678',tested:true,reviewed:true,fetcher:s.fetcher}));assert.ok(!s.calls.some(c=>c.method==='PATCH'));
});
test('exige prueba y revisión antes de cualquier escritura',async t=>{
  const f=fixture(t),s=service(f),m=e.buildManifest(f.plan,'0.1.5',['config/safe.toml']);await assert.rejects(e.publish(f.plan,m,{token:'test_token_not_real_12345678',fetcher:s.fetcher}));assert.equal(s.calls.length,0);
});
test('verifica también Maven de Clumps y el CDN oficial ya usados por el modpack',async()=>{
  const urls=['https://maven.blamejared.com/com/blamejared/clumps/Clumps-forge-1.20.1/12.0.0.4/Clumps-forge-1.20.1-12.0.0.4.jar','https://edge.forgecdn.net/files/9083/935/sophisticatedbackpacks.jar'];
  const manifest={files:urls.map((url,i)=>({path:'mods/test'+i+'.jar',url,sha256:e.hash(bytes),acquisition:'official_direct'})),content:{files:[]}};
  const seen=[];await e.verifyDirect(manifest,()=>{},async url=>{seen.push(url);return new Response(bytes);});assert.deepEqual(seen,urls);
  await assert.rejects(e.verifyDirect(manifest,()=>{},async()=>new Response('wrong')),/no coincide/);
});
test('rechaza dominios parecidos, rutas ajenas y parámetros sin descargarlos',async()=>{
  for(const url of ['https://maven.blamejared.com.evil.test/com/blamejared/clumps/a/b/c.jar','https://maven.blamejared.com/other/a.jar','https://edge.forgecdn.net/files/1/2/a.jar?token=private','http://edge.forgecdn.net/files/1/2/a.jar']){
    let called=false;await assert.rejects(e.verifyDirect({files:[{path:'mods/test.jar',url,sha256:e.hash(bytes)}],content:{files:[]}},()=>{},async()=>{called=true;return new Response(bytes);}),/no autorizada/);assert.equal(called,false);
  }
});
test('sigue el CDN de CurseForge conservando ruta y hash; rechaza redirecciones externas',async()=>{
  const url='https://edge.forgecdn.net/files/9083/935/sophisticatedbackpacks.jar',target=url.replace('edge.','mediafilez.');
  const manifest={files:[{path:'mods/test.jar',url,sha256:e.hash(bytes)}],content:{files:[]}};const seen=[];
  await e.verifyDirect(manifest,()=>{},async(u,options)=>{seen.push(u);assert.equal(options.headers.Authorization,undefined);return u===url?new Response(null,{status:302,headers:{location:target}}):new Response(bytes);});assert.deepEqual(seen,[url,target]);
  for(const location of ['https://evil.test/mod.jar',target.replace('935','936')]){
    let count=0;await assert.rejects(e.verifyDirect(manifest,()=>{},async()=>{count++;return new Response(null,{status:302,headers:{location}});}),/no autorizada/);assert.equal(count,1);
  }
  await assert.rejects(e.request(url,{token:'never_forward',allowOfficialRedirects:true}),/credenciales/);
});
test('cambiar nombre conserva la instancia y notas/fondo se verifican',t=>{
  const {plan}=fixture(t);plan.design={packName:'Nueva aventura',notes:{title:'Novedades',text:'Dos mods nuevos',publishedAt:'2026-10-11T20:00:00Z'}};
  const m=e.buildManifest(plan,'0.1.6',['config/safe.toml']);assert.equal(m.game.packName,'Nueva aventura');assert.equal(m.game.serverId,'champagne-vol5');assert.equal(m.game.minLauncherVersion,'0.1.11');
  assert.equal(m.presentation.notes.text,'Dos mods nuevos');
  const {validatePresentation}=require('../src/champagne-presentation');
  assert.throws(()=>validatePresentation({background:{mime:'image/svg+xml',base64:Buffer.from('<svg/>').toString('base64'),sha256:e.hash(Buffer.from('<svg/>'))}}));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY0cAAAAASUVORK5CYII=','base64');
  assert.equal(validatePresentation({background:{mime:'image/png',base64:png.toString('base64'),sha256:e.hash(png)}}).background.sha256,e.hash(png));
  assert.throws(()=>validatePresentation({background:{mime:'image/png',base64:png.toString('base64'),sha256:'0'.repeat(64)}}));
});
test('impide activar personalización hasta que el launcher requerido esté publicado',async t=>{
  const f=fixture(t);f.plan.design={packName:'Nuevo mundo',notes:{title:'Novedades',text:'Prueba',publishedAt:'2026-10-11T20:00:00Z'}};
  const m=e.buildManifest(f.plan,'0.1.6',['config/safe.toml']),s=service(f,{oldLauncher:true});
  await assert.rejects(e.publish(f.plan,m,{token:'test_token_not_real_12345678',tested:true,reviewed:true,fetcher:s.fetcher}),/publicar primero/);
  assert.ok(!s.calls.some(c=>c.method==='POST'||c.method==='PATCH'));
});
test('restaurar usa una versión nueva y retira mods nuevos sin acceder a CurseForge',async t=>{
  const f=fixture(t),old=structuredClone(f.manifest),current=structuredClone(f.manifest);current.version='0.1.7';current.files.push({path:'mods/new.jar',sha256:e.hash(Buffer.from('new')),acquisition:'official_direct',url:'https://cdn.modrinth.com/data/test/versions/new/new.jar'});current.expectedFiles=2;
  const fetcher=async url=>new Response(JSON.stringify(url.includes('/git/ref/')?{object:{sha:'head'}}:url.endsWith('/stable-v2.json')?current:old));
  const restored=await e.restore('0.1.4',()=>{},fetcher);e.assertSourceUnchanged(restored);
  const m=e.buildManifest(restored,'0.1.8',['config/safe.toml']);assert.equal(m.restoredFrom,'0.1.4');assert.equal(m.version,'0.1.8');assert.equal(m.files.length,1);assert.deepEqual(m.delete,['mods/new.jar']);
});

test('edición de presentación conserva todos los archivos y bloquea tarjetas en launcher anterior',async t=>{const f=fixture(t);f.plan.mode='presentation';f.plan.design={packName:'Nuevo nombre',news:{title:'Noticia',text:'Descripción'},updates:{title:'Actualización',text:'Otra descripción'}};e.assertSourceUnchanged(f.plan);const manifest=e.buildManifest(f.plan,'0.1.5',['config/safe.toml']);assert.deepEqual(manifest.files,f.manifest.files);assert.deepEqual(manifest.content.files,f.manifest.content.files);assert.equal(manifest.game.minLauncherVersion,'0.1.12');assert.equal(manifest.game.serverId,f.manifest.game.serverId);assert.throws(()=>e.buildManifest(f.plan,'0.1.5',[]),/analizar CurseForge/);const remote=service(f);await assert.rejects(e.publish(f.plan,manifest,{token:'test_token_not_real_12345678',tested:true,reviewed:true,fetcher:remote.fetcher}),/0.1.12/);assert(!remote.calls.some(c=>c.method==='PATCH'));});
