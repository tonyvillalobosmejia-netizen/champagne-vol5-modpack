"use strict";
const fs=require('node:fs'),path=require('node:path'),https=require('node:https');
const {validateGame}=require('../src/champagne-game-profile');
function get(url,redirects=5){return new Promise((resolve,reject)=>{
 const req=https.get(url,{timeout:30000,headers:{'User-Agent':'ChampagneLauncher-admin'}},res=>{
  if([301,302,303,307,308].includes(res.statusCode)&&res.headers.location&&redirects){res.resume();return resolve(get(new URL(res.headers.location,url).href,redirects-1));}
  if(res.statusCode!==200){res.resume();return reject(new Error('HTTP '+res.statusCode+': '+url));}
  let bytes=0;const chunks=[];res.on('data',chunk=>{bytes+=chunk.length;if(bytes>16*1024*1024){res.destroy(new Error('Respuesta demasiado grande'));return;}chunks.push(chunk);});
  res.on('error',reject);res.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
 });req.on('error',reject);req.on('timeout',()=>req.destroy(new Error('Tiempo agotado')));
});}
async function prepareProfile({source,serverId,name,output}){
 const profile=JSON.parse(fs.readFileSync(path.join(source,'minecraftinstance.json'),'utf8').replace(/^\uFEFF/,''));
 const minecraftVersion=profile.gameVersion||profile.baseModLoader?.minecraftVersion;
 const loaderName=profile.baseModLoader?.name;
 if(!/^forge-\d+\.\d+\.\d+$/.test(loaderName||''))throw new Error('El perfil debe usar Forge; Fabric y NeoForge necesitan otro soporte.');
 const forgeVersion=loaderName.slice(6);
 const catalog=JSON.parse(await get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'));
 const selected=catalog.versions.find(entry=>entry.id===minecraftVersion&&entry.type==='release');
 if(!selected)throw new Error('Minecraft no está en el catálogo oficial de versiones estables.');
 const version=JSON.parse(await get(selected.url));
 const javaMajor=version.javaVersion?.majorVersion;
 const coordinate=`${minecraftVersion}-${forgeVersion}`;
 const forgeInstallerSha1=(await get(`https://maven.minecraftforge.net/net/minecraftforge/forge/${coordinate}/forge-${coordinate}-installer.jar.sha1`)).trim();
 const game=validateGame({serverId,packName:name||profile.name,loader:'forge',minecraftVersion,forgeVersion,javaMajor,forgeInstallerSha1,minLauncherVersion:'0.1.4'},null,'0.1.4');
 const mods=fs.readdirSync(path.join(source,'mods'),{withFileTypes:true}).filter(item=>item.isFile()&&/\.jar$/i.test(item.name));
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(game,null,2)+'\n');
 return {game,mods:mods.length,output:path.resolve(output),published:false};
}
if(require.main===module){
 const args={};for(let i=2;i<process.argv.length;i+=2){const flag=process.argv[i],value=process.argv[i+1];if(!['--source','--server-id','--name','--output'].includes(flag)||!value)throw new Error('Uso: --source carpeta --server-id identificador [--name nombre] --output perfil.json');args[flag.slice(2)]=value;}
 prepareProfile({source:args.source,serverId:args['server-id'],name:args.name,output:args.output}).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
module.exports={prepareProfile};
