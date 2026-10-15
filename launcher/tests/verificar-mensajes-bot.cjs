'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{message}=require('../auth-server/roles-bot/announcement.cjs');
test('anuncios sólo mencionan el rol optativo y bloquean everyone/here',()=>{
 const r=message({kind:'modpack',name:'Racoon Prueba',version:'0.1.0',notes:'@everyone @here',mentionRole:true,roleId:'1560015165121110097'});
 assert.deepEqual(r.allowedMentions.parse,[]);assert.deepEqual(r.allowedMentions.roles,['1560015165121110097']);assert.ok(!r.embeds[0].description.includes('@everyone'));assert.equal(r.content,'<@&1560015165121110097>');
});
test('sin decisión de mencionar no se activa ninguna mención',()=>{const r=message({kind:'launcher',name:'VillaWolf Launcher',version:'0.1.18'});assert.equal(r.content,'');assert.deepEqual(r.allowedMentions.roles,[]);assert.ok(r.embeds[0].url.endsWith('/v0.1.18'));});
test('no admite versiones o roles inválidos ni tipos arbitrarios',()=>{assert.throws(()=>message({kind:'modpack',version:'Fabric'}));assert.throws(()=>message({kind:'modpack',version:'0.1.0',mentionRole:true,roleId:'everyone'}));assert.throws(()=>message({kind:'otro',version:'0.1.0'}));});
test('auditoría distingue borrador, cambios, publicación y error sin datos privados',()=>{
 const {auditMessage}=require('../auth-server/roles-bot/announcement.cjs');
 for(const action of ['draft_created','draft_saved','published','publication_error']){
   const r=auditMessage({action,actorName:'Administrador de prueba',name:'Racoon',version:'0.1.0',source:'C:/privado',token:'no-incluir'});
   assert.ok(!JSON.stringify(r).includes('C:/privado'));assert.ok(!JSON.stringify(r).includes('no-incluir'));assert.deepEqual(r.allowedMentions.parse,[]);
   assert.equal(r.embeds[0].fields.find(x=>x.name==='Estado').value,action==='published'?'Publicado':action==='publication_error'?'Error · Revisar publicación':'Guardado · No publicado');
 }
});

test('registro de eliminación identifica administrador, lanzador y fecha sin menciones',()=>{const {auditMessage}=require('../auth-server/roles-bot/announcement.cjs');const r=auditMessage({action:'deleted',actorName:'Administrador de prueba',actorId:'1000000000000000001',name:'Mundo prueba',occurredAt:'2026-10-15T15:00:00Z'});assert.equal(r.embeds[0].title,'📋 Lanzador eliminado');assert.equal(r.embeds[0].fields.find(x=>x.name==='Administrador').value,'Administrador de prueba');assert.equal(r.embeds[0].fields.find(x=>x.name==='ID del administrador').value,'1000000000000000001');assert.equal(r.embeds[0].timestamp,'2026-10-15T15:00:00.000Z');assert.deepEqual(r.allowedMentions.parse,[]);});
