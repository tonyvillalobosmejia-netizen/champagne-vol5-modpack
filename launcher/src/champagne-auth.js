// Sólo el token de sesión propio puede persistirse cifrado; nunca se guarda la contraseña ni se entrega el token al renderer.
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const { receiveDiscordCode } = require('./champagne-discord-callback');
function createAuthClient({ baseUrl = '', allowLocalDev = false, provider = 'password', required = false, openBrowser, sessionStore } = {}) {
  if (!['password','discord'].includes(provider) || (required && provider !== 'discord')) throw Error('Configuración de autenticación inválida.');
  let endpoint = null, session = null, busy = false, discordAbort = null;
  if (baseUrl) {
    endpoint = new URL(baseUrl);
    const local = endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1' && allowLocalDev;
    if ((!local && endpoint.protocol !== 'https:') || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw new Error('URL del servicio de cuentas inválida: requiere HTTPS.');
  }
  let restored=false,persistent=false;
  function clearSession(){session=null;persistent=false;try{sessionStore?.clear();}catch{}}
  function restoreSession(){if(restored)return;restored=true;try{const saved=sessionStore?.load();if(saved && /^[A-Za-z0-9_-]{43}$/.test(saved.token)&&Number.isSafeInteger(saved.expiresAt)&&saved.expiresAt>Date.now()){session={token:saved.token,user:validateUser(saved.user),expiresAt:saved.expiresAt};persistent=true;}else if(saved)clearSession();}catch{clearSession();}}
  function persistSession(){try{sessionStore?.save(session);persistent=!!sessionStore;}catch{persistent=false;}}
  function request(route, method = 'GET', data, token) {
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
          if (size > 16384) req.destroy(new Error('Respuesta del servicio demasiado grande.'));
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
              error.status = res.statusCode; reject(error); return;
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
  function validateUser(value) {
    if (!value || typeof value.id !== 'string' || typeof value.username !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(value.username)) throw new Error('Identidad de cuenta inválida.');
    if (provider === 'discord' && (value.provider !== 'discord' || !/^[0-9]{17,20}$/.test(value.discordId) || value.id !== 'discord:' + value.discordId)) throw Error('Identidad de Discord inválida.');
    return { id: value.id, username: value.username, ...(provider === 'discord' ? { provider:'discord', discordId:value.discordId, discordName:typeof value.discordName === 'string'?value.discordName.slice(0,80):value.username } : {}) };
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
      const result = await request('/v1/session', 'GET', null, session.token);
      const user = validateUser(result.user);
      if (user.id !== session.user.id || user.username !== session.user.username) throw new Error('La identidad de la sesión ha cambiado.');
      return user.username;
    } catch (error) {
      if ([401,403].includes(error.status)) clearSession();
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
      const flow=await request('/v1/discord/start','POST',{proof});
      if(controller.signal.aborted)throw Error('Inicio de sesión cancelado.');
      if(!/^[A-Za-z0-9_-]{43}$/.test(flow.state))throw Error('Solicitud de Discord inválida.');
      const code=await receiveDiscordCode({...flow,openBrowser,signal:controller.signal});
      const result=await request('/v1/discord/finish','POST',{state:flow.state,proof,code});
      if(!/^[A-Za-z0-9_-]{43}$/.test(result.token)||!Number.isSafeInteger(result.expiresAt)||result.expiresAt<=Date.now())throw Error('Sesión inválida.');
      if(controller.signal.aborted){try{await request('/v1/logout','POST',null,result.token);}catch{}throw Error('Inicio de sesión cancelado.');}
      session={token:result.token,user:validateUser(result.user),expiresAt:result.expiresAt};
      persistSession();
      return {...status(),message:'Sesión de Discord iniciada. Nombre de Minecraft: '+session.user.username};
    }catch(error){return {ok:false,message:error.message};}finally{busy=false;discordAbort=null;}
  }
  return { status, loginDiscord, cancelDiscordLogin:()=>{discordAbort?.abort();return {ok:true};}, register: input => authenticate('register', input), login: input => authenticate('login', input), verifiedUsername, logout };
}
module.exports = { createAuthClient };
