'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createAvatarChoice}=require('../src/champagne-avatar-choice'),{copyDeviceCode}=require('../src/champagne-microsoft-device');
test('Discord es predeterminado y sólo Premium puede elegir skin oficial',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-avatar-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const store=createAvatarChoice(root),id='discord:1000000000000000001';
 assert.equal(store.get(id,false),'discord');assert.throws(()=>store.set(id,'minecraft',false),/Premium/);
 store.set(id,'minecraft',true);assert.equal(createAvatarChoice(root).get(id,true),'minecraft');
 assert.equal(store.get(id,false),'discord');assert.equal(store.get('discord:1000000000000000002',true),'discord');
 store.set(id,'discord',true);assert.equal(store.get(id,true),'discord');assert.throws(()=>store.set('../fuera','discord',true));
});
test('código Microsoft se copia una vez por evento; no se registra ni se copia el device token',()=>{
 const writes=[],event={code:'ABCD-EFGH',expiresAt:123};const r=copyDeviceCode(event,{writeText:text=>writes.push(text)});
 assert.deepEqual(writes,['ABCD-EFGH']);assert.equal(r.copied,true);assert.equal(copyDeviceCode(null,{writeText:()=>assert.fail()}),null);
 assert.equal(copyDeviceCode(event,{writeText:()=>{throw Error('unavailable');}}).copied,false);
 assert.equal(copyDeviceCode({code:'device/private/token'},{writeText:()=>assert.fail()}).copied,false);
});
