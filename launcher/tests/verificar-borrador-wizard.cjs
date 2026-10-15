'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const model=require('../tools/admin-modpack/wizard-model.cjs'),{createDraftStore}=require('../tools/admin-modpack/draft-store.cjs');
const valid={name:'Prueba Racoon',description:'Prueba privada',initialVersion:'0.1.0',source:'C:/CurseForge/Prueba',serverMode:'external',guildId:'1100890182884012062',roleId:'1100890182884012063',announcements:{modpack:{enabled:false},launcher:{enabled:false}},notes:'Primera prueba'};
test('borrador completo externo conserva servidor y canales desactivados',()=>{
  const r=model.validate(valid,{complete:true});assert.equal(r.valid,true);
  const p=model.publishedFields(valid);assert.equal(p.guildId,valid.guildId);assert.equal(p.announcements.modpack.enabled,false);
});
test('servidor oficial no exige introducir su ID',()=>{
  const r=model.validate({...valid,serverMode:'official',guildId:''},{complete:true});assert.equal(r.valid,true);assert.equal(r.value.guildId,'1007732653035880589');
});
test('canales sólo obligatorios cuando se habilita envío',()=>{
  const r=model.validate({...valid,announcements:{modpack:{enabled:true,channelId:''}}},{complete:true});assert.equal(r.valid,false);assert.ok(r.errors.modpackChannel);
});
test('versión, servidor y rol inválidos producen errores por campo',()=>{
  const r=model.validate({...valid,initialVersion:'Fabric',guildId:'../otro',roleId:'everyone'},{complete:true});assert.ok(r.errors.initialVersion);assert.ok(r.errors.guildId);assert.ok(r.errors.roleId);
});
test('datos parciales sobreviven sin copiar carpeta ni publicar',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-wizard-'));
  try{const store=createDraftStore(root);store.write('session',{...valid,name:''});assert.equal(store.read('session').name,'');assert.equal(store.read('session').source,valid.source);assert.deepEqual(fs.readdirSync(path.join(root,'borradores')),['session.json']);assert.throws(()=>store.write('../escape',valid));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('diseño avanzado local conserva tarjetas y no almacena archivos del modpack',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-wizard-'));
  try{const store=createDraftStore(root),id='pack-0123456789abcdef';store.write(id,valid);store.saveDesign(id,{packName:valid.name,news:{title:'Noticias',text:'Hola'},updates:{title:'Actualizaciones',text:'Pendiente'},background:null});const design=store.loadDesign(id);assert.equal(design.news.text,'Hola');assert.equal(design.background,null);assert.equal(fs.readdirSync(path.join(root,'borradores')).length,2);assert.throws(()=>store.saveDesign(id,{packName:'',news:{title:'a',text:''}}));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
