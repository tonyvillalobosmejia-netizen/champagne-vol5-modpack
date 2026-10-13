'use strict';
const RAW='https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/preparacion-paso97/';
const LEGACY_ID='champagne-vol5';
function validateCatalog(value){
 if(!value||value.schemaVersion!==1||!Array.isArray(value.packs)||value.packs.length>50)throw Error('Catálogo de modpacks inválido.');
 const ids=new Set();const packs=value.packs.map(p=>{
  if(!p||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(p.id||'')||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80||!/^\d{17,20}$/.test(p.roleId||'')||typeof p.enabled!=='boolean')throw Error('Revisa el nombre, identificador y rol de cada modpack.');
  const manifestPath=p.id===LEGACY_ID?'updates/stable-v2.json':'updates/packs/'+p.id+'/stable.json';
  if(p.manifestPath!==manifestPath)throw Error('Canal de modpack inválido.');ids.add(p.id);
  return{id:p.id,name:p.name.trim(),roleId:p.roleId,enabled:p.enabled,manifestPath};
 });return{schemaVersion:1,packs};
}
function channelFor(pack){return RAW+validateCatalog({schemaVersion:1,packs:[pack]}).packs[0].manifestPath;}
function pathsForPack(id){if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id||''))throw Error('Identificador de modpack inválido.');return id===LEGACY_ID?{channel:'updates/stable-v2.json',history:'updates/history.json',versions:'updates/versions'}:{channel:'updates/packs/'+id+'/stable.json',history:'updates/packs/'+id+'/history.json',versions:'updates/packs/'+id+'/versions'};}
module.exports={validateCatalog,channelFor,pathsForPack,RAW,LEGACY_ID};
