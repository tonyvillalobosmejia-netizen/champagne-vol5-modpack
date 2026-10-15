'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const base=()=>({version:'0.1.0',game:{packName:'Racoon',minecraftVersion:'1.20.1',forgeVersion:'47.4.10'},files:[{path:'mods/a.jar',sha256:'a'},{path:'mods/b.jar',sha256:'b'}],content:{files:[{path:'config/a.json',sha256:'a'}]},presentation:{background:{sha256:'a'},news:{title:'Noticias',text:'Antes'}}});
test('registro calcula añadidos, modificados, retirados y cambios de interfaz reales',async()=>{
 const {publicationChanges}=await import('../auth-server/cloudflare/worker.mjs'),previous=base(),next=base();
 next.version='0.2.0';next.files=[{path:'mods/a.jar',sha256:'z'},{path:'mods/c.jar',sha256:'c'}];next.content.files=[];next.presentation.background.sha256='z';next.presentation.news.text='Después';
 const changes=publicationChanges(previous,next);
 assert.ok(changes.includes('Versión: 0.1.0 → 0.2.0.'));
 assert.ok(changes.includes('Mods: 1 añadidos, 1 modificados y 1 retirados.'));
 assert.ok(changes.includes('Archivos y configuraciones: 0 añadidos, 0 modificados y 1 retirados.'));
 assert.ok(changes.includes('Fondo del lanzador actualizado.'));assert.ok(changes.includes('Noticias actualizadas.'));
 assert.ok(!changes.some(x=>x.includes('Nombre del lanzador actualizado')));
 assert.ok(!JSON.stringify(changes).includes('config/a.json'));
});
test('diseño publicado no inventa actualización de mods ni versión',async()=>{
 const {publicationChanges}=await import('../auth-server/cloudflare/worker.mjs'),previous=base(),next=base();next.game.packName='Nuevo nombre';
 assert.deepEqual(publicationChanges(previous,next),['Nombre del lanzador actualizado.']);
 assert.deepEqual(publicationChanges(previous,previous),['Sin diferencias de versión, contenido o diseño en el manifiesto.']);
});
test('el mensaje privado muestra los cambios y respeta límites de Discord',async()=>{
 const {auditMessage}=require('../auth-server/roles-bot/announcement.cjs');
 const changes=Array.from({length:12},(_,i)=>'Cambio '+i+': '+'.'.repeat(155));
 const r=auditMessage({action:'published',name:'Racoon',version:'0.2.0',actorName:'Administrador de prueba',changes});
 assert.ok(r.embeds[0].fields.some(f=>f.name==='Cambios realizados'));
 assert.ok(r.embeds[0].fields.every(f=>f.value.length<=1024));
 for(const change of changes)assert.ok(r.embeds[0].fields.some(f=>f.value.includes(change)));
 assert.deepEqual(r.allowedMentions.parse,[]);
});
