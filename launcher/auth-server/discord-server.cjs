// Servicio OAuth independiente. El secreto de Discord permanece en el alojamiento.
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { isIP } = require('node:net');
const { DatabaseSync } = require('node:sqlite');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const nonce = () => crypto.randomBytes(32).toString('base64url');
const validNonce = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
const snowflake = value => typeof value === 'string' && /^[0-9]{17,20}$/.test(value);
const callbackUri = 'http://127.0.0.1:32146/discord/callback';
class AuthError extends Error { constructor(status, message) { super(message); this.status = status; } }

function createDiscordServer({ databasePath, clientId, clientSecret, guildId, roleId, fetchImpl = fetch, clock = Date.now, sessionMs = 12 * 3600000, trustLocalProxy = false } = {}) {
  if (!databasePath || !snowflake(clientId) || !snowflake(guildId) || !snowflake(roleId) || !clientSecret) throw Error('Falta configurar Discord, el rol o la base de datos.');
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS discord_users(discord_id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS discord_reservations(username TEXT PRIMARY KEY COLLATE NOCASE);`);
  const flows = new Map(), sessions = new Map(), limits = new Map();
  function cleanup() {
    for (const map of [flows, sessions, limits]) for (const [key, value] of map) if (value.expiresAt <= clock()) map.delete(key);
  }
  function limit(address) {
    cleanup(); const key = digest(address); let row = limits.get(key);
    if (!row) { if (limits.size >= 10000) throw new AuthError(503, 'Servicio ocupado.'); row = { count: 0, expiresAt: clock() + 60000 }; limits.set(key, row); }
    if (++row.count > 30) throw new AuthError(429, 'Demasiadas solicitudes. Espera un minuto.');
  }
  async function discord(route, options = {}) {
    let response;
    try { response = await fetchImpl('https://discord.com/api/v10/' + route, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) }); }
    catch { throw new AuthError(503, 'No se pudo conectar con Discord. Reintenta cuando haya conexión.'); }
    if (!response.ok) {
      if (response.status === 401) throw new AuthError(401, 'Vuelve a iniciar sesión con Discord.');
      if ([403,404].includes(response.status)) throw new AuthError(403, 'Debes pertenecer al Discord del servidor y tener el rol autorizado.');
      throw new AuthError(503, 'Discord no pudo comprobar el acceso. Intenta nuevamente.');
    }
    const text = await response.text(); if (Buffer.byteLength(text) > 131072) throw new AuthError(503, 'Respuesta de Discord inválida.');
    try { return JSON.parse(text); } catch { throw new AuthError(503, 'Respuesta de Discord inválida.'); }
  }
  async function member(accessToken, discordId) {
    const value = await discord(`users/@me/guilds/${guildId}/member`, { headers: { Authorization: 'Bearer ' + accessToken } });
    if (!Array.isArray(value.roles) || !value.roles.includes(roleId) || (value.user && value.user.id !== discordId) || value.pending === true) throw new AuthError(403, 'No tienes el rol que permite jugar, o falta completar el acceso al servidor de Discord.');
    return value;
  }
  function identity(discordUser) {
    if (!snowflake(discordUser.id) || typeof discordUser.username !== 'string') throw new AuthError(503, 'Identidad de Discord inválida.');
    const current = db.prepare('SELECT username FROM discord_users WHERE discord_id=?').get(discordUser.id);
    let username = current?.username;
    if (!username) {
      const candidate = discordUser.username.normalize('NFKD').replace(/[^A-Za-z0-9_]/g, '').slice(0,16);
      const base = candidate.length >= 3 ? candidate : 'Jugador';
      for (let i = 0; i < 10000; i++) {
        const suffix = i ? '_' + i : ''; const name = base.slice(0,16-suffix.length) + suffix;
        if (db.prepare('SELECT username FROM discord_users WHERE username=?').get(name) || db.prepare('SELECT username FROM discord_reservations WHERE username=?').get(name)) continue;
        db.prepare('INSERT INTO discord_users VALUES(?,?)').run(discordUser.id,name); username = name; break;
      }
      if (!username) throw new AuthError(409, 'No se pudo asignar un nombre de Minecraft.');
    }
    return { id: 'discord:' + discordUser.id, discordId: discordUser.id, username, discordName: (discordUser.global_name || discordUser.username).slice(0,80), provider: 'discord' };
  }
  function reserve(name) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) throw Error('Nombre reservado inválido.');
    if (db.prepare('SELECT username FROM discord_users WHERE username=?').get(name)) throw Error('El nombre ya pertenece a una cuenta.');
    db.prepare('INSERT OR IGNORE INTO discord_reservations VALUES(?)').run(name);
  }
  function bind(discordId,name) {
    if(!snowflake(discordId)||!/^[A-Za-z0-9_]{3,16}$/.test(name))throw Error('ID o nombre de Minecraft inválido.');
    const current=db.prepare('SELECT username FROM discord_users WHERE discord_id=?').get(discordId);
    if(current){if(current.username!==name)throw Error('Esta cuenta ya tiene un nombre vinculado.');return;}
    if(db.prepare('SELECT discord_id FROM discord_users WHERE username=?').get(name))throw Error('El nombre ya pertenece a otra cuenta.');
    db.prepare('INSERT INTO discord_users VALUES(?,?)').run(discordId,name);
  }
  function start(proof) {
    cleanup(); if (!validNonce(proof)) throw new AuthError(400, 'Solicitud de sesión inválida.');
    if (flows.size >= 1000) throw new AuthError(503, 'Servicio ocupado.');
    const state = nonce(); flows.set(state, { proofHash: digest(proof), expiresAt: clock()+300000 });
    const url = new URL('https://discord.com/oauth2/authorize');
    for (const [key,value] of Object.entries({ client_id: clientId, response_type: 'code', redirect_uri: callbackUri, scope: 'identify guilds.members.read', state, prompt: 'consent' })) url.searchParams.set(key,value);
    return { ok: true, authorizationUrl: url.href, state, callbackUri };
  }
  async function finish(input) {
    cleanup(); const flow = validNonce(input.state) && flows.get(input.state);
    if (!flow || !validNonce(input.proof) || !crypto.timingSafeEqual(Buffer.from(flow.proofHash),Buffer.from(digest(input.proof))) || typeof input.code !== 'string' || input.code.length < 1 || input.code.length > 4096) throw new AuthError(401, 'La solicitud de Discord venció o no es válida.');
    flows.delete(input.state); // Un código solo puede canjearse una vez.
    const token = await discord('oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id:clientId, client_secret:clientSecret, grant_type:'authorization_code', code:input.code, redirect_uri:callbackUri }).toString() });
    if (token.token_type?.toLowerCase() !== 'bearer' || typeof token.access_token !== 'string' || !Number.isFinite(token.expires_in) || token.expires_in <= 0 || !['identify','guilds.members.read'].every(scope => token.scope?.split(' ').includes(scope))) throw new AuthError(401, 'Discord no concedió los permisos necesarios.');
    const discordUser = await discord('users/@me', { headers: { Authorization: 'Bearer ' + token.access_token } });
    await member(token.access_token, discordUser.id);
    const user = identity(discordUser), sessionToken = nonce(), expiresAt = clock()+Math.min(sessionMs,token.expires_in*1000);
    if(sessions.size>=10000)throw new AuthError(503,'Servicio ocupado.');
    sessions.set(digest(sessionToken), { user, accessToken:token.access_token, expiresAt });
    return { ok:true, user, token:sessionToken, expiresAt };
  }
  async function session(token) {
    cleanup(); const row = validNonce(token) && sessions.get(digest(token));
    if (!row) throw new AuthError(401, 'Inicia sesión con Discord para jugar.');
    try { await member(row.accessToken,row.user.discordId); }
    catch (error) { if ([401,403].includes(error.status)) sessions.delete(digest(token)); throw error; }
    if (!sessions.has(digest(token)) || row.expiresAt <= clock()) throw new AuthError(401, 'La sesión se cerró o venció.');
    return { ok:true, user:row.user, expiresAt:row.expiresAt };
  }
  async function body(req) {
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new AuthError(415, 'Se requiere JSON.');
    let size=0; const parts=[];
    for await (const part of req) { size+=part.length; if(size>8192)throw new AuthError(413,'Solicitud demasiado grande.'); parts.push(part); }
    try { const value=JSON.parse(Buffer.concat(parts).toString()); if (!value || typeof value!=='object' || Array.isArray(value)) throw Error(); return value; }
    catch { throw new AuthError(400,'Solicitud inválida.'); }
  }
  const server=http.createServer(async(req,res)=>{
    const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
    try {
      if (req.headers.origin !== undefined) throw new AuthError(403,'Solicitud no permitida.');
      const forwarded=req.headers['x-forwarded-for'];
      const address=trustLocalProxy && req.socket.remoteAddress==='127.0.0.1' && typeof forwarded==='string' && isIP(forwarded) ? forwarded : req.socket.remoteAddress;
      limit(address || 'unknown');
      if(req.method==='GET'&&req.url==='/health')return reply(200,{ok:true,provider:'discord'});
      if(req.method==='POST'&&req.url==='/v1/discord/start')return reply(200,start((await body(req)).proof));
      if(req.method==='POST'&&req.url==='/v1/discord/finish')return reply(200,await finish(await body(req)));
      const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):null;
      if(req.method==='GET'&&req.url==='/v1/session')return reply(200,await session(token));
      if(req.method==='POST'&&req.url==='/v1/logout'){if(validNonce(token))sessions.delete(digest(token));return reply(200,{ok:true});}
      throw new AuthError(404,'Ruta no encontrada.');
    }catch(error){reply(error.status||500,{ok:false,message:error.status?error.message:'No se pudo completar la operación.'});}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.maxConnections=64;
  return { server, reserve, bind, close:async()=>{if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();sessions.clear();flows.clear();} };
}
module.exports={createDiscordServer,callbackUri};
if(require.main===module){
  const service=createDiscordServer({databasePath:path.resolve(process.env.CHAMPAGNE_DISCORD_DB||path.join(__dirname,'data','discord.sqlite')),clientId:process.env.DISCORD_CLIENT_ID,clientSecret:process.env.DISCORD_CLIENT_SECRET,guildId:process.env.DISCORD_GUILD_ID,roleId:process.env.DISCORD_ROLE_ID,trustLocalProxy:process.env.CHAMPAGNE_TRUST_LOCAL_PROXY==='true'});
  if(['--bind','--reserve'].includes(process.argv[2])){
    try{if(process.argv[2]==='--bind')service.bind(process.argv[3],process.argv[4]);else service.reserve(process.argv[3]);console.log('Identidad o reserva guardada.');}
    catch(error){console.error(error.message);process.exitCode=1;}
    service.close();
  }else{
  const port=Number(process.env.CHAMPAGNE_AUTH_PORT||32145);
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Puerto inválido.');
  service.server.listen(port,'127.0.0.1',()=>console.log('Servicio Discord listo en loopback. Publicar detrás de HTTPS para los jugadores.'));
  const stop=()=>service.close().then(()=>process.exit());process.on('SIGINT',stop);process.on('SIGTERM',stop);
  }
}
