// Sólo el token de sesión propio puede persistirse cifrado; nunca se guarda la contraseña ni se entrega el token al renderer.
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const { receiveDiscordCode } = require('./champagne-discord-callback');
function createAuthClient({ baseUrl = '', allowLocalDev = false, provider = 'password', required = false, openBrowser, sessionStore, purpose='launcher' } = {}) {
  if (!['password','discord'].includes(provider) || (required && provider !== 'discord')) throw Error('Configuración de autenticación inválida.');
  if(!['launcher','launcher-v2','admin'].includes(purpose))throw Error('Aplicación de acceso inválida.');
  let endpoint = null, session = null, busy = false, discordAbort = null;
  if (baseUrl) {
    endpoint = new URL(baseUrl);
    const local = endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1' && allowLocalDev;
    if ((!local && endpoint.protocol !== 'https:') || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw new Error('URL del servicio de cuentas inválida: requiere HTTPS.');
  }
  let restored=false,persistent=false,discordRetryAt=0;const pendingReads=new Map();
  function clearSession(){session=null;persistent=false;try{sessionStore?.clear();}catch{}}
  function restoreSession(){if(restored)return;restored=true;try{const saved=sessionStore?.load();if(saved && /^[A-Za-z0-9_-]{43}$/.test(saved.token)&&Number.isSafeInteger(saved.expiresAt)&&saved.expiresAt>Date.now()){session={token:saved.token,user:validateUser(saved.user),expiresAt:saved.expiresAt};persistent=true;}else if(saved)clearSession();}catch{clearSession();}}
  function persistSession(){try{sessionStore?.save(session);persistent=!!sessionStore;}catch{persistent=false;}}
  function transportRequest(route, method = 'GET', data, token) {
    if (!endpoint) return Promise.reject(new Error('El servicio de cuentas todavía no está configurado. Puedes jugar en modo local.'));
    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : null;
      const headers = { Accept: 'application/json' };
      if (payload) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(payload); }
      if (token) headers.Authorization = `Bearer ${token}`;
      const transport = endpoint.protocol === 'https:' ? https : http;
      let timer;
      const req = transport.request(new URL(route, endpoint), { method, headers }, res => {
        let size = 0; const chunks = [];
        res.on('data', chunk => {
          size += chunk.length;
          if (size > 65536) req.destroy(new Error('Respuesta del servicio demasiado grande.'));
          else chunks.push(chunk);
        });
        res.on('aborted', () => req.destroy(new Error('Conexión interrumpida.')));
        res.on('error', error => req.destroy(error));
        res.on('end', () => {
          clearTimeout(timer);
          try {
            const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (res.statusCode < 200 || res.statusCode >= 300 || value.ok !== true) {
              const error = new Error(typeof value.message === 'string' ? value.message : 'No se pudo iniciar sesión.');
              error.status = res.statusCode;if(res.statusCode===429){const seconds=Number(value.retryAfter);error.retryAfter=Number.isFinite(seconds)&&seconds>0?Math.min(Math.ceil(seconds),86400):60;discordRetryAt=Date.now()+error.retryAfter*1000;} reject(error); return;
            }
            resolve(value);
          } catch { reject(new Error('Respuesta inválida del servicio de cuentas.')); }
        });
      });
      timer = setTimeout(() => req.destroy(new Error('El servicio de cuentas no respondió.')), 10000);
      req.on('error', () => { clearTimeout(timer); reject(new Error('No se pudo conectar al servicio de cuentas.')); });
      req.end(payload);
    });
  }
  function request(route,method='GET',data,token){
    if(method!=='GET'||!token)return transportRequest(route,method,data,token);
    const wait=Math.max(0,Math.ceil((discordRetryAt-Date.now())/1000));
    if(wait){const error=new Error('Discord necesita una pausa. Reintenta en '+wait+' segundos.');error.status=429;error.retryAfter=wait;return Promise.reject(error);}
    const key=route+'|'+token;if(pendingReads.has(key))return pendingReads.get(key);
    const pending=transportRequest(route,method,data,token);pendingReads.set(key,pending);pending.finally(()=>{if(pendingReads.get(key)===pending)pendingReads.delete(key);}).catch(()=>{});return pending;
  }
  function validAvatar(raw,id){try{const u=new URL(raw);return u.origin==='https://cdn.discordapp.com'&&!u.username&&!u.password&&!u.hash&&((u.pathname.startsWith('/avatars/'+id+'/')&&/\/avatars\/[0-9]{17,20}\/(?:a_)?[a-f0-9]{32}\.png$/.test(u.pathname)&&u.search==='?size=128')||(/^\/embed\/avatars\/[0-5]\.png$/.test(u.pathname)&&!u.search));}catch{return false;}}
  function validateUser(value) {
    if (!value || typeof value.id !== 'string' || typeof value.username !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(value.username)) throw new Error('Identidad de cuenta inválida.');
    if (provider === 'discord' && (value.provider !== 'discord' || !/^[0-9]{17,20}$/.test(value.discordId) || value.id !== 'discord:' + value.discordId)) throw Error('Identidad de Discord inválida.');
    return { id: value.id, username: value.username, ...(provider === 'discord' ? { provider:'discord', discordId:value.discordId, discordName:typeof value.discordName === 'string'?value.discordName.slice(0,80):value.username,...(validAvatar(value.avatarUrl,value.discordId)?{avatarUrl:value.avatarUrl}:{}) } : {}) };
  }
  const status = () => {restoreSession();if(session?.expiresAt<=Date.now())clearSession();return ({ ok: true, configured: !!endpoint, localDevelopment: endpoint?.protocol === 'http:', provider, required, user: session?.user || null, persistent });};
  async function authenticate(action, input) {
    restoreSession();
    if (provider === 'discord') return {ok:false,message:'Usa Iniciar sesión con Discord.'};
    if (busy) return { ok: false, message: 'Espera a que termine la solicitud actual.' };
    if (session) return { ok: false, message: 'Cierra la sesión actual antes de cambiar de cuenta.' };
    busy = true;
    try {
      if (!input || typeof input.username !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(input.username) || typeof input.password !== 'string' || Buffer.byteLength(input.password) > 256 || !input.password.length) throw new Error('Revisa el nombre y la contraseña.');
      const result = await request(`/v1/${action}`, 'POST', { username: input.username, password: input.password });
      if (!/^[A-Za-z0-9_-]{43}$/.test(result.token) || !Number.isSafeInteger(result.expiresAt) || result.expiresAt <= Date.now()) throw new Error('Sesión inválida.');
      session = { token: result.token, user: validateUser(result.user), expiresAt: result.expiresAt };
      persistSession();
      return { ...status(), message: action === 'register' ? 'Cuenta creada. Sesión iniciada.' : 'Sesión iniciada.' };
    } catch (error) { return { ok: false, message: error.message }; }
    finally { busy = false; }
  }
  async function verifiedUsername() {
    restoreSession();
    if (busy) throw new Error('Espera a que termine la solicitud de cuenta.');
    if (!session) { if(required)throw Error('Inicia sesión con Discord para comprobar tu acceso al servidor.'); return null; }
    if(session.expiresAt<=Date.now()){clearSession();throw Error('La sesión venció. Inicia sesión nuevamente.');}
    try {
      const result = await request(purpose==='launcher'?'/v1/session':purpose==='admin'?'/v2/admin/session':'/v2/session', 'GET', null, session.token);
      const user = validateUser(result.user);
      if (user.id !== session.user.id || user.username !== session.user.username) throw new Error('La identidad de la sesión ha cambiado.');
      session={...session,user,expiresAt:result.expiresAt||session.expiresAt};persistSession();return user.username;
    } catch (error) {
      if(error.status===401||(purpose==='launcher'&&error.status===403))clearSession();
      throw error;
    }
  }
  async function logout() {
    restoreSession();
    if (busy) return { ok: false, message: 'Espera a que termine la solicitud actual.' };
    const current = session; clearSession();
    if (!current) return { ...status(), message: 'Sesión cerrada.' };
    busy = true;
    try { await request('/v1/logout', 'POST', null, current.token); return { ...status(), message: 'Sesión cerrada.' }; }
    catch { return { ...status(), message: 'Sesión cerrada en esta PC. No se pudo revocar en el servicio; caducará automáticamente.' }; }
    finally { busy = false; }
  }
  async function loginDiscord() {
    restoreSession();
    if(provider!=='discord'||!endpoint)return {ok:false,message:'El inicio de sesión con Discord todavía no está configurado.'};
    if(busy||session)return {ok:false,message:'Espera o cierra la sesión actual antes de iniciar otra.'};
    busy=true;
    const controller=new AbortController();discordAbort=controller;
    try {
      const proof=crypto.randomBytes(32).toString('base64url');
      const flow=await request('/v1/discord/start','POST',{proof,purpose});
      if(controller.signal.aborted)throw Error('Inicio de sesión cancelado.');
      if(!/^[A-Za-z0-9_-]{43}$/.test(flow.state))throw Error('Solicitud de Discord inválida.');
      const code=await receiveDiscordCode({...flow,openBrowser,signal:controller.signal});
      const result=await request('/v1/discord/finish','POST',{state:flow.state,proof,code,purpose});
      if(!/^[A-Za-z0-9_-]{43}$/.test(result.token)||!Number.isSafeInteger(result.expiresAt)||result.expiresAt<=Date.now())throw Error('Sesión inválida.');
      if(controller.signal.aborted){try{await request('/v1/logout','POST',null,result.token);}catch{}throw Error('Inicio de sesión cancelado.');}
      session={token:result.token,user:validateUser(result.user),expiresAt:result.expiresAt};
      persistSession();
      return {...status(),message:'Sesión de Discord iniciada. Nombre de Minecraft: '+session.user.username};
    }catch(error){return {ok:false,message:error.message};}finally{busy=false;discordAbort=null;}
  }
  async function access(route){restoreSession();if(!session)throw Error('Inicia sesión con Discord.');try{const value=await request(route,'GET',null,session.token);session={...session,expiresAt:value.expiresAt||session.expiresAt};persistSession();return value;}catch(error){if(error.status===401)clearSession();throw error;}}
  return { status, catalog:()=>access(purpose==='admin'?'/v2/admin/catalog':'/v2/catalog'), verifyPack:id=>{if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id||''))throw Error('Modpack inválido.');return access('/v2/packs/'+id);}, loginDiscord, cancelDiscordLogin:()=>{discordAbort?.abort();return {ok:true};}, register: input => authenticate('register', input), login: input => authenticate('login', input), verifiedUsername, logout };
}
module.exports = { createAuthClient };
