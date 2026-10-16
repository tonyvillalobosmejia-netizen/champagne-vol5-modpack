'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),path=require('node:path');
async function fixture(t){
 const {createReleaseAnnouncements,createNotificationOutbox}=await import('../auth-server/cloudflare/worker.mjs'),db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(__dirname,'../auth-server/cloudflare/schema.sql'),'utf8'));t.after(()=>db.close());
 function prepare(sql,args=[]){return{bind:(...a)=>prepare(sql,a),run:async()=>({meta:db.prepare(sql).run(...args)}),first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)})};}
 let now=Date.now();const env={DB:{prepare},DISCORD_GUILD_ID:'1007732653035880589',ADMIN_RELEASE_CHANNEL_ID:'1559347693245956189',ADMIN_RELEASE_ROLE_ID:'1559330834278781048'},state={releases:[],calls:0};
 const catalog={packs:[{id:'racoon',enabled:true,guildId:'1100890182884012062',roleId:'1560015165121110097',announcements:{launcher:{enabled:true,channelId:'1560014668632825876',mentionRole:true}}},{id:'silent',enabled:true,announcements:{launcher:{enabled:false}}}]};
 const watcher=createReleaseAnnouncements({clock:()=>now,outbox:createNotificationOutbox({clock:()=>now}),loadCatalog:async()=>{if(state.catalogError)throw Error("catálogo no disponible");return catalog;},fetchImpl:async(url,options)=>{state.calls++;assert.equal(options.redirect,'manual');assert.ok(url.startsWith('https://api.github.com/repos/tonyvillalobosmejia-netizen/champagne-vol5-modpack/'));return Response.json(state.releases);}});
 function release(kind,version,extra={}){return{tag_name:(kind==='launcher'?'v':'admin-v')+version,draft:false,prerelease:false,published_at:new Date(now-1000).toISOString(),body:'Notas oficiales',assets:[{name:'VillaWolf.'+(kind==='launcher'?'Launcher':'Administrador')+'.Setup.'+version+'.exe'}],...extra};}
 return{db,env,state,watcher,release,advance:ms=>now+=ms};
}
test('anuncia sólo nuevas releases oficiales y respeta canales optativos por comunidad',async t=>{
 const f=await fixture(t);f.state.releases=[f.release('launcher','0.1.18'),f.release('admin','0.1.21')];await f.watcher.check(f.env);
 f.advance(900001);f.state.releases=[f.release('launcher','0.1.19'),f.release('admin','0.1.22')];await f.watcher.check(f.env);
 const jobs=f.db.prepare('SELECT * FROM notification_jobs').all();assert.equal(jobs.length,4);
 const launcher=jobs.find(x=>JSON.parse(x.payload).kind==='launcher'&&x.guild_id==='1100890182884012062');assert.equal(launcher.guild_id,'1100890182884012062');assert.equal(JSON.parse(launcher.payload).roleId,'1560015165121110097');
 assert.ok(jobs.some(x=>x.channel_id==='1559334945372250314'));assert.ok(jobs.every(x=>!JSON.parse(x.payload).notes.includes('Notas oficiales')));
 const admin=jobs.find(x=>JSON.parse(x.payload).kind==='admin');assert.equal(admin.channel_id,f.env.ADMIN_RELEASE_CHANNEL_ID);assert.equal(JSON.parse(admin.payload).mentionRole,true);assert.equal(JSON.parse(admin.payload).roleId,f.env.ADMIN_RELEASE_ROLE_ID);
 f.advance(900001);await f.watcher.check(f.env);assert.equal(f.db.prepare('SELECT count(*) AS n FROM notification_jobs').get().n,4);
});
test('no anuncia borradores, prereleases, archivos incompletos ni versiones anteriores',async t=>{
 const f=await fixture(t);f.state.releases=[f.release('launcher','0.1.17'),f.release('launcher','0.1.18',{draft:true}),f.release('launcher','0.1.19',{prerelease:true}),f.release('admin','0.1.21',{assets:[]})];await f.watcher.check(f.env);assert.equal(f.db.prepare('SELECT count(*) AS n FROM notification_jobs').get().n,0);
});
test('no elige un canal de Administrador sin configuración explícita',async t=>{
 const f=await fixture(t);delete f.env.ADMIN_RELEASE_CHANNEL_ID;f.state.releases=[f.release('admin','0.1.21')];await f.watcher.check(f.env);assert.equal(f.db.prepare('SELECT count(*) AS n FROM notification_jobs').get().n,0);assert.equal(f.db.prepare("SELECT version FROM release_cursors WHERE kind='official-admin'").get().version,'0.1.21');
});

test('primera activación no anuncia el historial',async t=>{const f=await fixture(t);f.state.releases=[f.release('launcher','0.1.19'),f.release('admin','0.1.26')];await f.watcher.check(f.env);assert.equal(f.db.prepare("SELECT count(*) AS n FROM notification_jobs WHERE guild_id='1007732653035880589'").get().n,0);});

test('destinos oficiales funcionan sin catálogo y sin modpacks; no retroactivos',async t=>{const f=await fixture(t);f.state.catalogError=true;f.state.releases=[f.release('launcher','0.1.19'),f.release('admin','0.1.26')];await f.watcher.check(f.env);f.advance(900001);f.state.releases=[f.release('launcher','0.1.20'),f.release('admin','0.1.27')];await f.watcher.check(f.env);assert.equal(f.db.prepare('SELECT count(*) AS n FROM notification_jobs').get().n,2);});
test('rol de Administradores sin confirmar bloquea sólo anuncios de Administrador',async t=>{const f=await fixture(t);f.state.catalogError=true;delete f.env.ADMIN_RELEASE_ROLE_ID;f.state.releases=[f.release('admin','0.1.26')];await f.watcher.check(f.env);f.state.releases=[f.release('admin','0.1.27')];await f.watcher.check(f.env);assert.equal(f.db.prepare('SELECT count(*) AS n FROM notification_jobs').get().n,0);});

test('configuración local usa los IDs reales confirmados de VillaWolf',()=>{const vars=JSON.parse(fs.readFileSync(path.join(__dirname,'../auth-server/cloudflare/wrangler.json'),'utf8')).vars;assert.equal(vars.DISCORD_GUILD_ID,'1007732653035880589');assert.equal(vars.ADMIN_RELEASE_CHANNEL_ID,'1559347693245956189');assert.equal(vars.ADMIN_RELEASE_ROLE_ID,'1559330834278781048');});
