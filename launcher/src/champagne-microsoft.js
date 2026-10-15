'use strict';
// Cliente público propio. Las credenciales nunca se entregan al renderer.
const {setTimeout:delay}=require('node:timers/promises');
const MS='https://login.microsoftonline.com/consumers/oauth2/v2.0/';
const MC='https://api.minecraftservices.com/';
const SCOPE='XboxLive.SignIn XboxLive.offline_access';
function token(value){if(typeof value!=='string'||!value||value.length>32768)throw Error('Microsoft devolvió credenciales inválidas.');return value;}
function profile(value){
 if(!value||! /^[a-f0-9]{32}$/i.test(value.id||'')||! /^[A-Za-z0-9_]{3,16}$/.test(value.name||''))throw Error('Esta cuenta no tiene un perfil válido de Minecraft Java.');
 const active=value.skins?.find(x=>x.state==='ACTIVE');let skinUrl=null;
 if(active){const u=new URL(active.url);if(u.protocol==='http:'&&u.hostname==='textures.minecraft.net')u.protocol='https:';if(u.origin!=='https://textures.minecraft.net'||! /^\/texture\/[a-f0-9]+$/i.test(u.pathname)||u.search||u.hash||u.username||u.password)throw Error('La skin oficial no es válida.');skinUrl=u.href;}
 return {id:value.id.toLowerCase(),username:value.name,skinUrl,variant:active?.variant==='SLIM'?'slim':'classic',premium:true};
}
function createMicrosoftClient({clientId='',sessionStore,openBrowser,onDevice=()=>{},fetcher=fetch,wait=delay,now=Date.now}={}){
 const configured=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(clientId);
 let session=null,restored=false,busy=false,controller=null,persistent=false;
 function clear(){session=null;persistent=false;sessionStore?.clear();}
 function restore(){if(restored)return;restored=true;if(!configured)return;try{const v=sessionStore?.load();if(v){token(v.refreshToken);if(!Number.isSafeInteger(v.expiresAt))throw Error();session={...v,user:profile({id:v.user.id,name:v.user.username,skins:v.user.skinUrl?[{state:'ACTIVE',url:v.user.skinUrl,variant:v.user.variant==='slim'?'SLIM':'CLASSIC'}]:[]})};token(v.accessToken);persistent=true;}}catch{clear();}}
 function persist(){try{sessionStore?.save(session);persistent=!!sessionStore;}catch{persistent=false;}}
 function status(){restore();return {ok:true,configured,busy,persistent,user:session?.user||null};}
 async function request(url,{form,json,bearer,body,signal}={}){
  let r;try{r=await fetcher(url,{method:form||json||body?'POST':'GET',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000),headers:{Accept:'application/json',...(form?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(json?{'Content-Type':'application/json'}:{}),...(bearer?{Authorization:'Bearer '+bearer}:{})},body:form?new URLSearchParams(form):json?JSON.stringify(json):body});}catch{if(signal?.aborted)throw Error('Inicio de sesión Microsoft cancelado.');throw Error('No se pudo conectar con Microsoft o Minecraft. Reintenta.');}
  const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>1024*1024)throw Error('Respuesta de Microsoft demasiado grande.');chunks.push(Buffer.from(chunk));}
  let v;try{v=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('Respuesta inválida de Microsoft.');}
  if(!r.ok){
   const stage=url===MS+'devicecode'?'solicitud de código':url===MS+'token'?(form?.grant_type==='refresh_token'?'renovación Microsoft':'autorización Microsoft'):url.includes('user.auth.xboxlive.com')?'perfil Xbox':url.includes('xsts.auth.xboxlive.com')?'autorización Xbox':url.endsWith('authentication/login_with_xbox')?'acceso Minecraft':url.endsWith('entitlements/mcstore')?'licencia Java':'perfil Minecraft';
   const codes=Array.isArray(v.error_codes)?v.error_codes.filter(n=>Number.isSafeInteger(n)&&n>0).slice(0,3):[];
   const diagnostic=codes.length?' Código: '+codes.map(n=>'AADSTS'+n).join(', ')+'.':'';
   const invalidGrant=form?.grant_type==='refresh_token'?'La sesión Microsoft venció o fue revocada. Vuelve a iniciar sesión.':'Microsoft no pudo completar esta autorización. Inicia la vinculación otra vez para obtener un código nuevo.';
   const e=Error((r.status===403&&url.endsWith('authentication/login_with_xbox')?'Microsoft/Minecraft no autorizó la aplicación VillaWolf. Hay que revisar su registro y permisos.':r.status===404&&url.endsWith('minecraft/profile')?'Esta cuenta no tiene un perfil de Minecraft Java.':v.error==='invalid_grant'?invalidGrant:'No se pudo verificar la cuenta Microsoft (HTTP '+r.status+', '+stage+').')+diagnostic);
   e.status=r.status;e.oauthError=v.error;e.xerr=Number.isSafeInteger(v.XErr)?v.XErr:undefined;e.stage=stage;e.codes=codes;throw e;
  }return v;
 }
 async function checkMinecraft(accessToken,signal){
  const license=await request(MC+'entitlements/mcstore',{bearer:accessToken,signal});
  if(!Array.isArray(license.items)||!license.items.some(x=>['game_minecraft','product_minecraft'].includes(x.name)))throw Error('La cuenta no tiene una licencia activa de Minecraft Java.');
  return profile(await request(MC+'minecraft/profile',{bearer:accessToken,signal}));
 }
 async function exchange(msa,signal){
  const xbox=await request('https://user.auth.xboxlive.com/user/authenticate',{signal,json:{Properties:{AuthMethod:'RPS',SiteName:'user.auth.xboxlive.com',RpsTicket:'d='+token(msa.access_token)},RelyingParty:'http://auth.xboxlive.com',TokenType:'JWT'}});
  const xsts=await request('https://xsts.auth.xboxlive.com/xsts/authorize',{signal,json:{Properties:{SandboxId:'RETAIL',UserTokens:[token(xbox.Token)]},RelyingParty:'rp://api.minecraftservices.com/',TokenType:'JWT'}});
  const claim=xsts.DisplayClaims?.xui?.[0];if(!claim||! /^[0-9]+$/.test(claim.uhs||''))throw Error('No se pudo verificar el perfil de Xbox.');
  const mc=await request(MC+'authentication/login_with_xbox',{signal,json:{identityToken:'XBL3.0 x='+claim.uhs+';'+token(xsts.Token)}});
  if(!Number.isSafeInteger(mc.expires_in)||mc.expires_in<1||mc.expires_in>172800)throw Error('Caducidad de sesión Minecraft inválida.');
  const accessToken=token(mc.access_token),user=await checkMinecraft(accessToken,signal);
  if(session&&session.user.id!==user.id)throw Error('La identidad Microsoft cambió. Cierra la sesión y vuelve a entrar.');
  return {user,accessToken,refreshToken:token(msa.refresh_token),expiresAt:now()+mc.expires_in*1000,xuid:/^[0-9]+$/.test(claim.xid||'')?claim.xid:''};
 }
 async function login(){
  restore();if(!configured)return {ok:false,message:'Microsoft está pendiente de configurar para VillaWolf.'};if(busy||session)return {ok:false,message:'Espera o desvincula la cuenta Microsoft actual.'};
  busy=true;controller=new AbortController();const signal=controller.signal;
  try{
   const flow=await request(MS+'devicecode',{form:{client_id:clientId,scope:SCOPE},signal});
   if(typeof flow.user_code!=='string'||! /^[A-Z0-9-]{4,32}$/i.test(flow.user_code)||!Number.isSafeInteger(flow.expires_in)||flow.expires_in<1||flow.expires_in>1800||!Number.isSafeInteger(flow.interval)||flow.interval<1||flow.interval>60)throw Error('Solicitud Microsoft inválida.');
   const u=new URL(flow.verification_uri);if(!['https://microsoft.com/devicelogin','https://www.microsoft.com/link'].includes(u.href))throw Error('Página de inicio Microsoft no autorizada.');
   token(flow.device_code);onDevice({code:flow.user_code,expiresAt:now()+flow.expires_in*1000});await openBrowser(u.href);
   const deadline=now()+flow.expires_in*1000;let interval=flow.interval*1000,msa;
   while(now()<deadline){await wait(interval,undefined,{signal});if(signal.aborted)throw Error('Inicio de sesión Microsoft cancelado.');try{msa=await request(MS+'token',{signal,form:{grant_type:'urn:ietf:params:oauth:grant-type:device_code',client_id:clientId,device_code:flow.device_code}});break;}catch(e){if(e.oauthError==='authorization_pending')continue;if(e.oauthError==='slow_down'){interval+=5000;continue;}if(e.oauthError==='authorization_declined')throw Error('No autorizaste el inicio de sesión Microsoft.');throw e;}}
   if(!msa)throw Error('El código Microsoft venció. Inicia sesión nuevamente.');const next=await exchange(msa,signal);if(signal.aborted)throw Error('Inicio de sesión Microsoft cancelado.');session=next;persist();return {...status(),message:'Minecraft Java verificado. Sesión Microsoft iniciada.'};
  }catch(e){return {ok:false,message:signal.aborted?'Inicio de sesión Microsoft cancelado.':e.message};}finally{busy=false;controller=null;onDevice(null);}
 }
 async function identity(){
  restore();if(busy)throw Error('Espera a que termine la solicitud Microsoft.');if(!session)return null;busy=true;
  try{
   if(session.expiresAt<=now()+120000){const msa=await request(MS+'token',{form:{client_id:clientId,grant_type:'refresh_token',refresh_token:session.refreshToken,scope:SCOPE}});if(msa.refresh_token){session.refreshToken=token(msa.refresh_token);persist();}session=await exchange({...msa,refresh_token:msa.refresh_token||session.refreshToken});persist();}
   else{const user=await checkMinecraft(session.accessToken);if(user.id!==session.user.id)throw Error('La identidad Microsoft cambió. Inicia sesión nuevamente.');session.user=user;persist();}
   return {username:session.user.username,uuid:session.user.id,accessToken:session.accessToken,xuid:session.xuid,clientId,userType:'msa'};
  }catch(e){if(e.oauthError==='invalid_grant'||e.status===401)clear();throw e;}finally{busy=false;}
 }
 async function uploadSkin(bytes,variant){
  if(!Buffer.isBuffer(bytes)||bytes.length>256*1024||!['classic','slim'].includes(variant))throw Error('Skin inválida.');
  const id=await identity();if(!id)throw Error('Inicia sesión con Microsoft para cambiar la skin oficial.');busy=true;
  try{const data=new FormData();data.append('variant',variant);data.append('file',new Blob([bytes],{type:'image/png'}),'skin.png');await request(MC+'minecraft/profile/skins',{body:data,bearer:id.accessToken});const user=await checkMinecraft(id.accessToken);if(user.id!==id.uuid)throw Error('La cuenta cambió.');session.user=user;persist();return {...status(),message:'Skin oficial actualizada.'};}finally{busy=false;}
 }
 return {status,login,identity,uploadSkin,cancel:()=>{controller?.abort();return {ok:true};},logout:()=>{if(busy)return {ok:false,message:'Espera o cancela la solicitud Microsoft.'};restore();clear();return {...status(),message:'Cuenta Microsoft desvinculada de esta PC.'};}};
}
module.exports={createMicrosoftClient,profile};
