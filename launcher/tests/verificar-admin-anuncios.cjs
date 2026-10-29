'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const {createStore,prepareImage}=require('../tools/admin-modpack/announcement-drafts.cjs'),{register}=require('../tools/admin-modpack/manual-announcements.cjs');
const pack={id:'conejil',name:'Mundo Conejil',published:true,guildId:'751907899336556574',roleId:'1559431805096960020'};
const draft=()=>({id:crypto.randomUUID(),packId:pack.id,channelId:'1560778156045242390',title:'Anuncio',text:'Texto',downloadUrl:'',mentionEveryone:false,mentionRole:false,image:null});
function temporary(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-anuncio-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('guarda borradores parciales por lanzador sin modificar otros datos; rechaza traversal y junction',t=>{
 const root=temporary(t),store=createStore(root);fs.writeFileSync(path.join(root,'conservar.txt'),'datos');const v={...draft(),title:'',text:'',channelId:''};store.write(pack.id,v);assert.deepEqual(store.read(pack.id),v);assert.equal(fs.readFileSync(path.join(root,'conservar.txt'),'utf8'),'datos');assert.throws(()=>store.read('../conservar'));assert.throws(()=>store.write(pack.id,{...v,packId:'otro'}));assert.equal(fs.readdirSync(path.join(root,'borradores/anuncios')).some(f=>f.endsWith('.tmp')),false);
 const other=path.join(root,'destino');fs.mkdirSync(other);const file=path.join(root,'borradores/anuncios','otro.json');fs.symlinkSync(other,file,'junction');assert.throws(()=>store.read('otro'),/enlaces/);
});
test('imagen se prepara en memoria y el original no cambia',t=>{
 const root=temporary(t),file=path.join(root,'imagen.png'),raw=Buffer.from('original sin modificar');fs.writeFileSync(file,raw);const jpg=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(30),Buffer.from([255,217])]);let quality;
 const native={createFromBuffer:bytes=>{assert.deepEqual(bytes,raw);return{isEmpty:()=>false,getSize:()=>({width:1920,height:1080}),toJPEG:q=>{quality=q;return jpg;}};}};
 const result=prepareImage(file,native);assert.equal(result.mime,'image/jpeg');assert.equal(result.sha256,crypto.createHash('sha256').update(jpg).digest('hex'));assert.equal(quality,88);assert.deepEqual(fs.readFileSync(file),raw);
 const link=path.join(root,'link.png'),other=path.join(root,'destino');fs.mkdirSync(other);fs.symlinkSync(other,link,'junction');assert.throws(()=>prepareImage(link,native));
});
function handlers(t){const root=temporary(t),actions=new Map(),calls=[],state={current:pack,confirm:0,remotePublished:true};register({handle:(name,fn)=>actions.set(name,fn),getPack:()=>state.current,store:createStore(root),chooseImage:async()=>undefined,confirm:async options=>{calls.push({confirm:options});return{response:state.confirm};},auth:{manualAnnouncement:async(action,input)=>{calls.push({action,input});if(action==='options'&&!state.remotePublished)throw Error('Publica primero este lanzador.');return action==='options'?{ok:true,guildId:pack.guildId,roleId:pack.roleId,channels:[{id:'1560778156045242390'}]}:{ok:true,queued:true};}}});return{actions,calls,state};}
test('cancelar no encola; confirmación usa destino y texto reales, nunca confirmed del renderer',async t=>{
 const f=handlers(t),v=draft();await f.actions.get('admin-announcement-load')({packId:pack.id});let r=await f.actions.get('admin-announcement-send')({...v,confirmed:true});assert.equal(r.cancelled,true);assert.equal(f.calls.filter(c=>c.action==='send').length,0);assert.match(f.calls.find(c=>c.confirm).confirm.detail,/Texto/);
 f.state.confirm=1;r=await f.actions.get('admin-announcement-send')(v);assert.equal(r.queued,true);assert.equal(f.calls.filter(c=>c.action==='send').length,1);assert.equal(f.calls.at(-1).input.confirmed,true);
});
test('lanzador cambiado, canal ajeno y borrador no publicado bloquean el envío',async t=>{
 const f=handlers(t);await assert.rejects(f.actions.get('admin-announcement-send')({...draft(),packId:'otro'}),/cambió/);
 await assert.rejects(f.actions.get('admin-announcement-send')({...draft(),channelId:'1000000000000000001'}),/canal/);
 f.state.current={...pack,published:false};f.state.remotePublished=false;await assert.rejects(f.actions.get('admin-announcement-send')(draft()),/Publica/);assert.equal(f.calls.filter(c=>c.action==='send').length,0);
});
test('imagen arbitraria del renderer no sustituye la seleccionada en proceso principal',async t=>{
 const f=handlers(t);f.state.confirm=1;await f.actions.get('admin-announcement-load')({packId:pack.id});await f.actions.get('admin-announcement-send')({...draft(),image:{base64:'datos arbitrarios'}});assert.equal(f.calls.at(-1).input.image,null);
});
test('publicación recién confirmada no queda bloqueada por una marca local antigua',async t=>{const f=handlers(t);f.state.current={...pack,published:false};f.state.confirm=1;const r=await f.actions.get('admin-announcement-send')(draft());assert.equal(r.queued,true);assert.equal(f.calls.filter(c=>c.action==='options').length,1);assert.equal(f.calls.filter(c=>c.action==='send').length,1);});
test('controlador conserva contenido e ID en reintentos; editar crea una referencia nueva',async()=>{
 const nodes=new Map(),calls=[];class Element{constructor(){this.value='';this.checked=false;this.events={};this.hidden=false;this.children=[];}addEventListener(k,fn){this.events[k]=fn;}replaceChildren(){this.children=[];this.value='';}append(node){this.children.push(node);if(this.children.length===1)this.value=node.value||'';}removeAttribute(name){delete this[name];}}
 const $=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};const v=draft();
 const api={announcementLoad:async()=>({ok:true,draft:structuredClone(v),published:true,packName:pack.name,guildId:pack.guildId,roleId:pack.roleId}),announcementOptions:async()=>({ok:true,packName:pack.name,guildId:pack.guildId,roleId:pack.roleId,channels:[{id:v.channelId,permissions:{view:true,send:true,embed:true,history:true}}]}),announcementSend:async input=>{calls.push(input);return{ok:false,error:'Conexión no confirmada'};}};
 const context={window:{admin:api},document:{getElementById:$,createElement:()=>new Element()},crypto:crypto.webcrypto,locked:false,run:async action=>action()};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/admin-modpack/manual-announcements.js'),'utf8'),context);
 await context.window.VillaWolfManual.open(pack.id);assert.equal($('announcementEveryone').checked,false);await $('announcementSend').onclick();assert.equal(calls.length,0);await $('announcementDestinations').onclick();await $('announcementSend').onclick();await $('announcementSend').onclick();assert.equal(calls[0].id,calls[1].id);assert.equal(calls[0].text,'Texto');
 $('announcementText').value='<img src=x onerror=alert(1)>'; $('announcementText').events.input();assert.equal($('announcementPreviewText').textContent,'<img src=x onerror=alert(1)>');await $('announcementSend').onclick();assert.notEqual(calls[2].id,calls[1].id);assert.equal(calls[2].mentionEveryone,false);
});
