'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
test('Bot recupera conexión y sincronización sin mezclar sus estados ni exponer credenciales',async()=>{
 const file=path.resolve(__dirname,'../auth-server/roles-bot/bridge.cjs'),localRequire=createRequire(file),events={ClientReady:'ready',ShardDisconnect:'disconnect',ShardResume:'resume',Error:'error'};
 let now=Date.now(),ready=true,failRoles=false;const requests=[],statuses=[],timers=[];
 const guild={id:'1007732653035880589',available:true,members:{fetch:async()=>{if(failRoles)throw Error('Fallo de sincronización simulado');return new Map();}}};
 class Client extends EventEmitter{constructor(){super();this.ws={status:0,ping:19};this.guilds={cache:new Map([[guild.id,guild]])};}isReady(){return ready;}async login(){}destroy(){this.destroyed=true;}}
 const context={module:{exports:{}},require:localRequire,URL,AbortSignal,Buffer,crypto:require('node:crypto'),setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval(){},fetch:async(_url,options)=>{const value=JSON.parse(options.body);requests.push(value);return Response.json({ok:true,sequence:value.sequence});}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 const bot=context.module.exports.startRoleBot({fetcher:context.fetch,clock:()=>now,token:'not-a-real-token',endpoint:'https://roles.invalid',key:'a'.repeat(64),guildIds:[guild.id],ClientClass:Client,discordModule:{Client,GatewayIntentBits:{Guilds:1,GuildMembers:2},Events:events,Status:{Ready:0}},onStatus:(message,details)=>statuses.push({message,...details})});
 const settle=async predicate=>{for(let i=0;i<50&&!predicate();i++)await new Promise(r=>setImmediate(r));assert.ok(predicate());};
 bot.client.emit('ready');await settle(()=>requests.some(r=>r.kind==='ready'));
 const firstGeneration=requests.find(r=>r.kind==='ready').generation;
 ready=false;bot.client.ws.status=1;bot.client.emit('disconnect');await settle(()=>requests.some(r=>r.kind==='offline'));
 assert.equal(statuses.filter(s=>s.domain==='connection').at(-1).phase,'disconnected');
 ready=true;bot.client.ws.status=0;bot.client.emit('resume');await settle(()=>requests.filter(r=>r.kind==='ready').length===2);
 assert.notEqual(requests.filter(r=>r.kind==='ready').at(-1).generation,firstGeneration);
 assert.equal(statuses.filter(s=>s.domain==='connection').at(-1).phase,'connected');
 failRoles=true;timers[1]();await settle(()=>statuses.some(s=>s.domain==='roles'&&s.message.includes('pendiente')));
 assert.equal(statuses.filter(s=>s.domain==='connection').at(-1).phase,'connected');
 failRoles=false;now+=30001;timers[0]();await settle(()=>requests.filter(r=>r.kind==='ready').length===3);
 assert.ok(!JSON.stringify(requests).includes('not-a-real-token'));
 await bot.stop();assert.equal(bot.client.destroyed,true);
});
