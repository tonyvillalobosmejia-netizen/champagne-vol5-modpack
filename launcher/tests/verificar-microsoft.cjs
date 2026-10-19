'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createMicrosoftClient,profile}=require('../src/champagne-microsoft');
const {gameIdentity}=require('../src/champagne-game-identity');
const {redact}=require('../src/champagne-support');
const CLIENT='11111111-1111-4111-8111-111111111111',UUID='1234567890abcdef1234567890abcdef';
function fixture({licensed=true,profileId=UUID,script=[],stored=null,persistFail=false,verificationUri='https://microsoft.com/devicelogin'}={}){
 let time=100000,saved=stored,clears=0;const calls=[],devices=[],opened=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});let value;
  if(url.endsWith('devicecode'))value={device_code:'private-device',user_code:'ABCD-EFGH',verification_uri:verificationUri,expires_in:900,interval:5};
  else if(url.endsWith('/token')){if(script.length){const result=script.shift();if(result.error)return new Response(JSON.stringify(result),{status:400});}value={access_token:'msa-private',refresh_token:'refresh-private'};}
  else if(url.includes('/user/authenticate'))value={Token:'xbox-private'};
  else if(url.includes('/xsts/authorize'))value={Token:'xsts-private',DisplayClaims:{xui:[{uhs:'123',xid:'456'}]}};
  else if(url.endsWith('login_with_xbox'))value={access_token:'mc-private',expires_in:3600};
  else if(url.endsWith('entitlements/mcstore'))value={items:licensed?[{name:'game_minecraft'}]:[]};
  else if(url.endsWith('minecraft/profile/skins'))value={id:profileId};
  else if(url.endsWith('minecraft/profile'))value={id:profileId,name:'PremiumPlayer',skins:[{state:'ACTIVE',url:'https://textures.minecraft.net/texture/abc123',variant:'SLIM'}]};
  else throw Error('Unexpected endpoint');
  return new Response(JSON.stringify(value));
 };
 const client=createMicrosoftClient({clientId:CLIENT,sessionStore:{load:()=>saved,save:v=>{if(persistFail)throw Error('No encryption');saved=structuredClone(v);},clear:()=>{saved=null;clears++;}},fetcher,now:()=>time,wait:async(ms,_v,{signal})=>{time+=ms;if(signal.aborted)throw Error('Aborted');},openBrowser:async u=>opened.push(u),onDevice:d=>devices.push(d)});
 return {client,calls,devices,opened,saved:()=>saved,clears:()=>clears,advance:ms=>time+=ms};
}
test('Microsoft desactivado sin ID propio; no intenta abrir el navegador',async()=>{let called=false;const c=createMicrosoftClient({openBrowser:()=>{called=true;}});assert.equal((await c.login()).ok,false);assert.equal(c.status().configured,false);assert.equal(called,false);});
test('vinculación nueva no se confunde con sesión vencida y sólo muestra códigos públicos',async()=>{
 const f=fixture({script:[{error:'invalid_grant',error_codes:[70000],error_description:'secreto-no-mostrar usuario@example.invalid',refresh_token:'privado'}]});
 const r=await f.client.login();assert.equal(r.ok,false);assert.match(r.message,/autorización/);assert.match(r.message,/AADSTS70000/);assert.ok(!r.message.includes('venció'));assert.ok(!r.message.includes('secreto'));assert.ok(!r.message.includes('example.invalid'));assert.equal(f.saved(),null);
});
test('flujo completo: licencia, nombre, UUID, skin y tokens solo privados',async()=>{const f=fixture();assert.equal((await f.client.login()).ok,true);assert.equal(f.client.status().user.username,'PremiumPlayer');assert.equal(f.client.status().user.premium,true);assert.deepEqual(f.opened,['https://microsoft.com/devicelogin']);assert.equal(f.devices.at(-1),null);assert.ok(!JSON.stringify(f.client.status()).includes('private'));const id=await f.client.identity();assert.equal(id.uuid,UUID);assert.equal(id.userType,'msa');assert.equal(id.accessToken,'mc-private');assert.ok(f.calls.every(x=>x.options.redirect==='error'));assert.ok(f.saved().refreshToken);});
test('la cuenta sin licencia Java no se guarda ni permite lanzar',async()=>{const f=fixture({licensed:false});assert.equal((await f.client.login()).ok,false);assert.equal(f.saved(),null);assert.equal(await f.client.identity(),null);});
test('authorization_pending y slow_down respetan espera y terminan',async()=>{const f=fixture({script:[{error:'authorization_pending'},{error:'slow_down'}]});assert.equal((await f.client.login()).ok,true);assert.equal(f.calls.filter(x=>x.url.endsWith('/token')).length,3);});
test('consentimiento rechazado no crea sesión',async()=>{const f=fixture({script:[{error:'authorization_declined'}]});assert.equal((await f.client.login()).ok,false);assert.equal(f.saved(),null);});
test('renueva después del vencimiento y rota credenciales',async()=>{const f=fixture();await f.client.login();f.advance(3600000);assert.equal((await f.client.identity()).uuid,UUID);assert.ok(f.calls.some(x=>x.options.body instanceof URLSearchParams&&x.options.body.get('grant_type')==='refresh_token'));});
test('sesión cifrada restaurada usa verificación real antes de jugar',async()=>{const f=fixture();await f.client.login();const g=fixture({stored:f.saved()});assert.equal(g.client.status().user.username,'PremiumPlayer');await g.client.identity();assert.ok(g.calls.some(x=>x.url.endsWith('entitlements/mcstore')));});
test('un UUID cambiado durante renovación se rechaza',async()=>{const f=fixture();await f.client.login();const g=fixture({stored:f.saved(),profileId:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'});await assert.rejects(g.client.identity(),/identidad/i);});
test('invalid_grant elimina la sesión local',async()=>{const f=fixture();await f.client.login();const g=fixture({stored:f.saved(),script:[{error:'invalid_grant'}]});g.advance(3600000);await assert.rejects(g.client.identity(),/revocada/);assert.equal(g.saved(),null);assert.equal(g.client.status().user,null);});
test('no se guarda en texto claro cuando falla el almacén',async()=>{const f=fixture({persistFail:true});assert.equal((await f.client.login()).ok,true);assert.equal(f.client.status().persistent,false);assert.equal(f.saved(),null);});
test('logout elimina tokens y no cambia otra cuenta',async()=>{const f=fixture();await f.client.login();assert.equal(f.client.logout().ok,true);assert.equal(f.saved(),null);assert.equal(await f.client.identity(),null);});
test('cancelación mientras abre Microsoft no guarda la cuenta',async()=>{let c;const f=fixture();c=createMicrosoftClient({clientId:CLIENT,fetcher:async()=>new Response(JSON.stringify({device_code:'private',user_code:'ABCD',verification_uri:'https://microsoft.com/devicelogin',expires_in:900,interval:5})),openBrowser:async()=>c.cancel(),wait:async(_ms,_v,{signal})=>{assert.equal(signal.aborted,true);throw Error('abort');}});assert.match((await c.login()).message,/cancelado/);assert.equal(c.status().user,null);});
test('skin maliciosa o perfil inválido se rechazan',()=>{assert.throws(()=>profile({id:UUID,name:'PremiumPlayer',skins:[{state:'ACTIVE',url:'https://evil.example/texture/abc'}]}));assert.throws(()=>profile({id:'bad',name:'PremiumPlayer'}));assert.equal(profile({id:UUID,name:'PremiumPlayer',skins:[{state:'ACTIVE',url:'http://textures.minecraft.net/texture/abc'}]}).skinUrl,'https://textures.minecraft.net/texture/abc');});
test('subir skin requiere identidad y envía multipart a Minecraft',async()=>{const f=fixture();await f.client.login();await f.client.uploadSkin(Buffer.from('png'),'slim');const c=f.calls.find(x=>x.url.endsWith('minecraft/profile/skins'));assert.equal(c.options.body.get('variant'),'slim');assert.equal(c.options.body.get('file').type,'image/png');assert.equal(c.options.headers.Authorization,'Bearer mc-private');assert.equal(c.options.redirect,'error');await assert.rejects(f.client.uploadSkin(Buffer.from('png'),'bad'));});
test('argumentos offline se conservan y Premium usa credenciales oficiales',()=>{const offline=gameIdentity('Local',()=> 'offline-uuid',null);assert.equal(offline.auth_access_token,'0');assert.equal(offline.user_type,'legacy');assert.equal(offline.auth_uuid,'offline-uuid');const premium=gameIdentity('Local',()=> 'offline-uuid',{uuid:UUID,username:'PremiumPlayer',accessToken:'secret',xuid:'456',clientId:CLIENT});assert.equal(premium.auth_uuid,UUID);assert.equal(premium.user_type,'msa');assert.equal(premium.auth_player_name,'PremiumPlayer');assert.equal(premium.auth_access_token,'secret');});
test('los registros ocultan el argumento de token de Minecraft',()=>{assert.ok(!redact('args --accessToken private-token --username Player').includes('private-token'));});

test('acepta el enlace oficial real de Microsoft para código de dispositivo',async()=>{const f=fixture({verificationUri:'https://www.microsoft.com/link'});assert.equal((await f.client.login()).ok,true);assert.deepEqual(f.opened,['https://www.microsoft.com/link']);});
test('rechaza enlaces de autorización con otro dominio, credenciales o parámetros',async()=>{for(const verificationUri of ['https://www.microsoft.com.evil.example/link','https://evil.example/link','https://user:pass@www.microsoft.com/link','https://www.microsoft.com/link?next=evil','http://www.microsoft.com/link']){const f=fixture({verificationUri});assert.equal((await f.client.login()).ok,false);assert.deepEqual(f.opened,[]);assert.equal(f.saved(),null);}});
