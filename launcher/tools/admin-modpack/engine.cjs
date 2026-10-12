'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { collect } = require('../crear-paquete-curseforge');
const { validateAssistedManifest } = require('../../src/champagne-manual-downloads');
const { validateGame } = require('../../src/champagne-game-profile');
const { prepareContent } = require('../../src/champagne-remote-content');
const { syncBundledConfigs, checkedTarget } = require('../../src/champagne-config-sync');
const { checkedModTarget } = require('../../src/champagne-update-paths');
const { validatePresentation } = require('../../src/champagne-presentation');
const SUPPORTED='0.1.11';
const REPO = 'tonyvillalobosmejia-netizen/champagne-vol5-modpack';
const BRANCH = 'preparacion-paso97';
const API = `https://api.github.com/repos/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${REPO}`;
const hash = (b, algorithm = 'sha256') => crypto.createHash(algorithm).update(b).digest('hex');
const clone = v => JSON.parse(JSON.stringify(v));
function nextVersion(v) { const n = v.split('.').map(Number); n[2]++; return n.join('.'); }
function greater(a, b) { return a.split('.').map(Number).some((v,i,aa) => aa.slice(0,i).every((x,j)=>x===Number(b.split('.')[j])) && v>Number(b.split('.')[i])); }
function safeRoot(root) {
  root = path.resolve(root);
  for (let here=root;;here=path.dirname(here)) {
    if (fs.existsSync(here) && fs.lstatSync(here).isSymbolicLink()) throw new Error('No se admiten carpetas enlazadas: ' + here);
    if (here === path.dirname(here)) break;
  }
  return root;
}
async function request(url, { method='GET', token, body, limit=48*1024*1024, fetcher=fetch, allow404=false, allowOfficialRedirects=false }={}) {
  if(allowOfficialRedirects && (token || method!=='GET' || body)) throw new Error('Las redirecciones de descarga no pueden llevar credenciales.');
  const options = { method, redirect:allowOfficialRedirects?'manual':'error', signal:AbortSignal.timeout(120000),
    headers:{ 'User-Agent':'VillaWolf-Modpack-Admin/1.0', ...(token ? {Authorization:'Bearer '+token} : {}),
      ...(body ? {'Content-Type':'application/json'} : {}), Accept:'application/vnd.github+json' },
    ...(body ? {body:JSON.stringify(body)} : {}) };
  let response = await fetcher(url, options);
  for(let hop=0;allowOfficialRedirects && [301,302,303,307,308].includes(response.status);hop++) {
    const previous=new URL(url),location=response.headers.get('location');
    if(!location || hop>=3) throw new Error('Redirección de descarga inválida.');
    const next=new URL(location,previous);
    if(!['https://edge.forgecdn.net','https://mediafilez.forgecdn.net'].includes(previous.origin) ||
      !['https://edge.forgecdn.net','https://mediafilez.forgecdn.net'].includes(next.origin) ||
      next.pathname!==previous.pathname || next.username || next.password || next.search || next.hash) throw new Error('Redirección de descarga no autorizada.');
    await response.body?.cancel(); url=next.href;
    response=await fetcher(url,options);
  }
  if (allow404 && response.status===404) return null;
  if (!response.ok) throw new Error(`El servicio respondió ${response.status}. ${response.status===401||response.status===403 ? 'Comprueba el permiso Contents: Read and write de GitHub y el límite de consultas.' : 'Reintenta; no actives una actualización incompleta.'}`);
  const chunks=[]; let count=0;
  for await (const chunk of response.body) { count+=chunk.length; if(count>limit) throw new Error('La respuesta supera el límite permitido.'); chunks.push(Buffer.from(chunk)); }
  return Buffer.concat(chunks);
}
async function json(url, options) { const b=await request(url,options); return b===null ? null : JSON.parse(b.toString('utf8')); }
async function baseline(fetcher=fetch) {
  const ref=await json(API+'/git/ref/heads/'+BRANCH,{fetcher});
  const manifest=await json(RAW+'/'+ref.object.sha+'/updates/stable-v2.json',{fetcher});
  validateAssistedManifest(manifest); validateGame(manifest.game,{},SUPPORTED); validatePresentation(manifest.presentation);
  return { head:ref.object.sha, manifest };
}
function privacy(file) {
  // Always keep account/session material out of public content, even inside config.
  if (/(?:^|\/)(?:.*(?:account|session|credential|secret|token|password|fingerprint|usercache|usernamecache|preferences|user-prefs).*|.*\.(?:sqlite|db|log|bak|backup|pfx|pem|key))$/i.test(file.path)) return null;
  let bytes=file.bytes;
  if (file.path==='config/embeddium-options.json' || /^config\/quickskin-.*\.json$/i.test(file.path)) {
    const value=JSON.parse(bytes.toString('utf8'));
    function clean(obj) { if(!obj || typeof obj!=='object') return; for(const key of Object.keys(obj)) {
      if (/fingerprint|uuid|username|playername|skinurl|skinpath|selectedskin|lastskin|token|password|session|account|active(?:skin|cape|cpm|model)|playerOwnSkin/i.test(key)) delete obj[key]; else clean(obj[key]);
    }}
    clean(value); bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');
  }
  // Potential private values require omission, never include them silently.
  if (!/\.(?:zip|png|jpg|jpeg|ogg|webp)$/i.test(file.path) &&
      /(?:password|access[_-]?token|client[_-]?secret|api[_-]?key)\s*["']?\s*[:=]\s*["'][^"']{8,}/i.test(bytes.toString('utf8'))) return null;
  return {...file,bytes,sha256:hash(bytes)};
}
function scan(source) {
  source=safeRoot(source);
  const metadataFile=path.join(source,'minecraftinstance.json');
  if (fs.lstatSync(metadataFile).isSymbolicLink() || fs.statSync(metadataFile).size>20*1024*1024) throw new Error('Metadatos de CurseForge inválidos.');
  const instance=JSON.parse(fs.readFileSync(metadataFile,'utf8'));
  const mc=instance.gameVersion, forge=instance.baseModLoader?.forgeVersion;
  if (!/^1\.\d+(?:\.\d+)?$/.test(mc||'') || !/^\d+\.\d+\.\d+$/.test(forge||'')) throw new Error('Selecciona una instancia de CurseForge con Forge.');
  const modsRoot=checkedModTarget(source,'mods/check.jar');
  const mods=fs.readdirSync(path.dirname(modsRoot),{withFileTypes:true}).filter(e=>/\.jar$/i.test(e.name)).map(e=>{
    const target=checkedModTarget(source,'mods/'+e.name), st=fs.lstatSync(target);
    if (!st.isFile() || st.isSymbolicLink() || st.size>128*1024*1024) throw new Error('Mod inválido: '+e.name);
    const bytes=fs.readFileSync(target);
    return { path:'mods/'+e.name, sha256:hash(bytes), sha1:hash(bytes,'sha1'), bytes:bytes.length };
  }).sort((a,b)=>a.path.localeCompare(b.path));
  if (!mods.length || mods.length>500) throw new Error('La carpeta debe tener entre 1 y 500 mods.');
  const excluded=[];
  const content=collect(source).map(file=>{const item=privacy(file); if(!item)excluded.push(file.path); return item;}).filter(Boolean);
  return { source,mc,forge,mods,content,excluded,addons:instance.installedAddons||[] };
}
function difference(current,previous) {
  const old=new Map(previous.map(e=>[e.path,e.sha256]));
  return { added:current.filter(e=>!old.has(e.path)).map(e=>e.path), changed:current.filter(e=>old.has(e.path)&&old.get(e.path)!==e.sha256).map(e=>e.path),
    removed:previous.filter(e=>!current.some(f=>f.path===e.path)).map(e=>e.path) };
}
function curseSource(mod,addons) {
  for(const addon of addons) {
    const file=addon.installedFile;
    if(!file || file.fileName!==mod.path.slice(5) || !file.hashes?.some(h=>h.type===1&&h.value.toLowerCase()===mod.sha1)) continue;
    const match=/^https:\/\/www\.curseforge\.com\/minecraft\/mc-mods\/([a-z0-9-]+)\/?$/.exec(addon.websiteUrl||'');
    if(match && Number.isSafeInteger(file.id) && file.id>0) return { path:mod.path,sha256:mod.sha256,acquisition:'user_official_download',pageUrl:`https://www.curseforge.com/minecraft/mc-mods/${match[1]}/files/${file.id}`,curseforgeFileId:file.id };
  }
  return null;
}
async function modrinth(file,fetcher) {
  const version=await json('https://api.modrinth.com/v2/version_file/'+file.sha1+'?algorithm=sha1',{fetcher,allow404:true});
  const match=version?.files?.find(e=>e.hashes?.sha1===file.sha1 && e.size===file.bytes && /^https:\/\/cdn\.modrinth\.com\/data\//.test(e.url));
  if(!match) return null;
  return match.url;
}
async function analyze(source,onProgress=()=>{},fetcher=fetch) {
  onProgress('Consultando la versión publicada…'); const base=await baseline(fetcher);
  onProgress('Leyendo mods y configuraciones…'); const current=scan(source);
  const old=new Map(base.manifest.files.map(e=>[e.sha256,e])); const files=[], unresolved=[];
  for(const mod of current.mods) {
    const known=old.get(mod.sha256);
    if(known) files.push({...known,path:mod.path});
    else {
      onProgress('Buscando la versión exacta: '+mod.path.slice(5));
      let url=null; try {url=await modrinth(mod,fetcher);} catch(error){onProgress('Modrinth no disponible; comprobando datos locales de CurseForge.');}
      const found=url ? {path:mod.path,sha256:mod.sha256,acquisition:'official_direct',url} : curseSource(mod,current.addons);
      if(found) files.push(found); else unresolved.push(mod.path);
    }
  }
  const priorContent=new Map(base.manifest.content.files.map(e=>[e.path,e])); const contentCandidates=[];
  for(const item of current.content) {
    let prior=priorContent.get(item.path), entry;
    if(prior?.sha256===item.sha256) entry=clone(prior);
    else if(/\.(?:zip)$/i.test(item.path)) {
      onProgress('Buscando recurso oficial: '+item.path);
      let url=null; try {url=await modrinth({...item,bytes:item.bytes.length,sha1:hash(item.bytes,'sha1')},fetcher);}catch{}
      if(url) entry={path:item.path,sha256:item.sha256,bytes:item.bytes.length,url};
    } else entry={path:item.path,sha256:item.sha256,bytes:item.bytes.length,base64:item.bytes.toString('base64')};
    contentCandidates.push({path:item.path,bytes:item.bytes.length,sha256:item.sha256,entry,selected:!!prior&&!!entry,
      change:!prior?'Nuevo':prior.sha256===item.sha256?'Sin cambios':'Modificado',reason:entry?'':'No se encontró una descarga oficial exacta. No se subirá este ZIP de terceros.'});
  }
  const game={...base.manifest.game,minecraftVersion:current.mc,forgeVersion:current.forge};
  if(current.mc!==base.manifest.game.minecraftVersion || current.forge!==base.manifest.game.forgeVersion) {
    const mc=current.mc.split('.').map(Number); game.javaMajor=mc[1]>20 || (mc[1]===20&&(mc[2]||0)>=5) ? 21 : 17;
    onProgress('Verificando el instalador oficial de Forge…');
    const id=current.mc+'-'+current.forge;
    game.forgeInstallerSha1=hash(await request(`https://maven.minecraftforge.net/net/minecraftforge/forge/${id}/forge-${id}-installer.jar`,{fetcher,limit:32*1024*1024}),'sha1');
  }
  validateGame(game,{},SUPPORTED);
  return {base,current,files,unresolved,contentCandidates,game,
    modChanges:difference(current.mods,base.manifest.files), suggestedVersion:nextVersion(base.manifest.version), design:{packName:game.packName,background:base.manifest.presentation?.background||null}};
}
function report(plan) {
  return { currentVersion:plan.base.manifest.version,nextVersion:plan.suggestedVersion,game:plan.game,mods:plan.current.mods.length,
    direct:plan.files.filter(e=>e.acquisition==='official_direct').length,manual:plan.files.filter(e=>e.acquisition==='user_official_download').length,
    modChanges:plan.modChanges,unresolved:plan.unresolved,excluded:plan.current.excluded,
    content:plan.contentCandidates.map(({entry,...e})=>e),previousContent:plan.base.manifest.content.files.map(({path,sha256})=>({path,sha256})),
    mode:plan.mode||'source',restoredFrom:plan.restoredFrom||null,design:plan.design||{packName:plan.game.packName} };
}
function buildManifest(plan,version,selected) {
  if(!/^\d+\.\d+\.\d+$/.test(version||'') || !greater(version,plan.base.manifest.version)) throw new Error('La versión debe ser mayor que '+plan.base.manifest.version+'.');
  if(plan.unresolved.length) throw new Error('Hay mods sin fuente exacta. Resuélvelos antes de publicar.');
  if(!Array.isArray(selected) || new Set(selected).size!==selected.length) throw new Error('Selección inválida.');
  const chosen=new Set(selected);
  if(selected.some(p=>!plan.contentCandidates.some(e=>e.path===p&&e.entry))) throw new Error('Hay contenido sin fuente oficial.');
  const contentFiles=plan.contentCandidates.filter(e=>chosen.has(e.path)).map(e=>clone(e.entry));
  if(!contentFiles.length) throw new Error('Selecciona al menos un archivo de contenido.');
  const files=clone(plan.files);
  const removed=[...new Set([...(plan.base.manifest.delete||[]),...plan.modChanges.removed])].filter(p=>!files.some(e=>e.path.toLowerCase()===p.toLowerCase()));
  const manifest={packId:'champagne-vol5',version,minecraftVersion:plan.game.minecraftVersion,forgeVersion:plan.game.forgeVersion,
    expectedFiles:files.length,files,delete:removed,content:{packId:'champagne-vol5',version,expectedFiles:contentFiles.length,files:contentFiles},game:clone(plan.game)};
  if(plan.design){
    const name=plan.design.packName;
    if(typeof name!=='string'||!name.trim()||name.length>80)throw Error('Escribe un nombre de modpack de hasta 80 caracteres.');
    manifest.game.packName=name.trim();
    const presentation={...(plan.design.background?{background:plan.design.background}:{}),
      ...(plan.design.notes?{notes:plan.design.notes}:{})};
    if(Object.keys(presentation).length){manifest.presentation=validatePresentation(presentation);manifest.game.minLauncherVersion=SUPPORTED;}
  }
  if(plan.restoredFrom)manifest.restoredFrom=plan.restoredFrom;
  validateAssistedManifest(manifest); validateGame(manifest.game,{},SUPPORTED); return manifest;
}
function assertSourceUnchanged(plan) {
  if(plan.mode==='restore')return;
  const current=scan(plan.current.source);
  const signature=s=>JSON.stringify({mc:s.mc,forge:s.forge,mods:s.mods,content:s.content.map(e=>({path:e.path,sha256:e.sha256}))});
  if(signature(current)!==signature(plan.current)) throw new Error('La carpeta cambió después del análisis. Analízala de nuevo.');
}
async function validatePackage(manifest,onProgress=()=>{},fetcher=fetch) {
  validateAssistedManifest(manifest); validateGame(manifest.game,{},SUPPORTED); validatePresentation(manifest.presentation);
  const directory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'villawolf-admin-validation-'));
  try {
    await prepareContent(manifest.content,path.join(directory,'bundle'),url=>request(url,{fetcher,limit:128*1024*1024}));
    const result=syncBundledConfigs({instanceDir:path.join(directory,'client'),metadataDir:path.join(directory,'metadata'),bundleDir:path.join(directory,'bundle')});
    onProgress('Contenido verificado en una instalación aislada: '+result.installed+' archivos.');
  } finally {
    safeRoot(directory); fs.rmSync(directory,{recursive:true,force:true});
  }
}
async function verifyDirect(manifest,onProgress,fetcher=fetch) {
  const entries=[...manifest.files.filter(e=>e.acquisition!=='user_official_download'),...manifest.content.files.filter(e=>e.url)];
  for(let i=0;i<entries.length;i++) {
    const entry=entries[i], url=new URL(entry.url);
    const allowed = (url.origin==='https://cdn.modrinth.com' && url.pathname.startsWith('/data/')) ||
      (url.origin==='https://maven.blamejared.com' && /^\/com\/blamejared\/clumps\/[^/]+\/[^/]+\/[^/]+\.jar$/.test(url.pathname)) ||
      (['https://edge.forgecdn.net','https://mediafilez.forgecdn.net'].includes(url.origin) && /^\/files\/[0-9]+\/[0-9]+\/[^/]+\.jar$/.test(url.pathname));
    if(!allowed || url.username || url.password || url.search || url.hash) throw new Error('Fuente de descarga no autorizada: '+entry.path);
    onProgress(`Verificando descarga ${i+1}/${entries.length}: ${entry.path}`);
    const bytes=await request(entry.url,{fetcher,limit:128*1024*1024,allowOfficialRedirects:true});
    if(hash(bytes)!==entry.sha256) throw new Error('La descarga no coincide: '+entry.path);
  }
}
async function publish(plan,manifest,{token,tested,reviewed,onProgress=()=>{},fetcher=fetch}={}) {
  if(!tested || !reviewed) throw new Error('Confirma la prueba del juego y la revisión de los archivos.');
  if(typeof token!=='string' || !/^[A-Za-z0-9_]{20,255}$/.test(token)) throw new Error('Introduce un token de GitHub válido en la herramienta. No lo envíes al chat.');
  // Reconstruct from approved state; the renderer cannot inject arbitrary files/URLs.
  const expected=buildManifest(plan,manifest.version,manifest.content.files.map(e=>e.path));
  if(JSON.stringify(expected)!==JSON.stringify(manifest)) throw new Error('El paquete cambió. Vuelve a prepararlo.');
  assertSourceUnchanged(plan);
  const options={token,fetcher};
  if(manifest.presentation){
    const release=await json(API+'/releases/latest',options);
    const installed=String(release.tag_name||'').replace(/^v/,'');
    if(!/^\d+\.\d+\.\d+$/.test(installed)||greater(SUPPORTED,installed))throw Error('El fondo y las notas requieren publicar primero VillaWolf Launcher '+SUPPORTED+'. El canal del modpack no cambió.');
  }
  await validatePackage(manifest,onProgress,fetcher); await verifyDirect(manifest,onProgress,fetcher);
  let ref=await json(API+'/git/ref/heads/'+BRANCH,options);
  if(ref.object.sha!==plan.base.head) throw new Error('GitHub cambió desde el análisis. Analiza de nuevo para conservar esos cambios.');
  const commit=await json(API+'/git/commits/'+ref.object.sha,options);
  const snapshotPath='updates/versions/modpack-'+manifest.version+'.json';
  const existing=await json(API+'/contents/'+snapshotPath+'?ref='+plan.base.head,{...options,allow404:true});
  if(existing) throw new Error('Esta versión ya existe en el historial; elige otra versión.');
  const raw=JSON.stringify(manifest,null,2)+'\n';
  if(Buffer.byteLength(raw)>48*1024*1024) throw new Error('Paquete demasiado grande para este canal. Reduce el contenido o utiliza descargas oficiales.');
  onProgress('Subiendo el manifiesto y su copia de recuperación…');
  const blob=await json(API+'/git/blobs',{...options,method:'POST',body:{content:Buffer.from(raw).toString('base64'),encoding:'base64'}});
  const previousHistory=await json(RAW+'/'+plan.base.head+'/updates/history.json',{fetcher,allow404:true})||[];
  if(!Array.isArray(previousHistory)||previousHistory.length>500)throw Error('Historial de publicaciones inválido.');
  const record={version:manifest.version,packName:manifest.game.packName,publishedAt:new Date().toISOString(),notes:manifest.presentation?.notes?.text||'',mods:manifest.files.length,content:manifest.content.files.length,
    changes:plan.modChanges,restoredFrom:plan.restoredFrom||null};
  const historyBlob=await json(API+'/git/blobs',{...options,method:'POST',body:{content:Buffer.from(JSON.stringify([record,...previousHistory],null,2)+'\n').toString('base64'),encoding:'base64'}});
  const tree=await json(API+'/git/trees',{...options,method:'POST',body:{base_tree:commit.tree.sha,tree:[...[snapshotPath,'updates/stable-v2.json'].map(p=>({path:p,mode:'100644',type:'blob',sha:blob.sha})),{path:'updates/history.json',mode:'100644',type:'blob',sha:historyBlob.sha}]}});
  const next=await json(API+'/git/commits',{...options,method:'POST',body:{message:'Actualizar '+manifest.game.packName+' a '+manifest.version,tree:tree.sha,parents:[plan.base.head]}});
  // Verify exact public bytes in the immutable new commit BEFORE activating it.
  const pinned=await request(RAW+'/'+next.sha+'/updates/stable-v2.json',{fetcher});
  if(hash(pinned)!==hash(Buffer.from(raw))) throw new Error('No se pudo verificar la subida. No se activó el canal.');
  assertSourceUnchanged(plan);
  ref=await json(API+'/git/ref/heads/'+BRANCH,options);
  if(ref.object.sha!==plan.base.head) throw new Error('Hubo una publicación simultánea; no se sobrescribió la rama. Analiza de nuevo.');
  await json(API+'/git/refs/heads/'+BRANCH,{...options,method:'PATCH',body:{sha:next.sha,force:false}});
  onProgress('Actualización activada. Los jugadores la recibirán al pulsar JUGAR.');
  return {version:manifest.version,packName:manifest.game.packName,commit:next.sha,url:`https://github.com/${REPO}/commit/${next.sha}`};
}
async function history(fetcher=fetch){
  const base=await baseline(fetcher);
  const files=await json(API+'/contents/updates/versions?ref='+base.head,{fetcher});
  const metadata=await json(RAW+'/'+base.head+'/updates/history.json',{fetcher,allow404:true})||[];
  if(!Array.isArray(metadata))throw Error('Historial inválido.');
  const entries=files.filter(e=>/^modpack-\d+\.\d+\.\d+\.json$/.test(e.name)).map(e=>({version:e.name.slice(8,-5),bytes:e.size,current:e.name==='modpack-'+base.manifest.version+'.json'})).sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
  for(const entry of entries.slice(0,50)){
    const known=metadata.find(m=>m.version===entry.version);
    if(known)Object.assign(entry,{packName:known.packName,publishedAt:known.publishedAt,notes:known.notes,mods:known.mods,content:known.content,changes:known.changes,restoredFrom:known.restoredFrom});
    else{const commits=await json(API+'/commits?sha='+base.head+'&path=updates/versions/modpack-'+entry.version+'.json&per_page=1',{fetcher});entry.publishedAt=commits[0]?.commit?.committer?.date;entry.notes=commits[0]?.commit?.message||'';}
  }
  return{currentVersion:base.manifest.version,entries:entries.slice(0,50)};
}
async function restore(version,onProgress=()=>{},fetcher=fetch){
  if(!/^\d+\.\d+\.\d+$/.test(version||''))throw Error('Versión histórica inválida.');
  const base=await baseline(fetcher);onProgress('Recuperando versión '+version+' sin activar el canal…');
  const old=await json(RAW+'/'+base.head+'/updates/versions/modpack-'+version+'.json',{fetcher});
  validateAssistedManifest(old);validateGame(old.game,{},SUPPORTED);validatePresentation(old.presentation);
  return{mode:'restore',restoredFrom:version,base,current:{mods:old.files,excluded:[]},files:old.files,game:old.game,unresolved:[],
    contentCandidates:old.content.files.map(entry=>({path:entry.path,bytes:entry.bytes,sha256:entry.sha256,entry,selected:true,change:'Recuperado',reason:''})),
    modChanges:difference(old.files,base.manifest.files),suggestedVersion:nextVersion(base.manifest.version),
    design:{packName:old.game.packName,background:old.presentation?.background||null}};
}
module.exports={analyze,report,buildManifest,assertSourceUnchanged,validatePackage,verifyDirect,publish,baseline,scan,privacy,curseSource,difference,request,hash,history,restore,REPO,BRANCH};
