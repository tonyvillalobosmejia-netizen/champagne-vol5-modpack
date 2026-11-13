// Servicio independiente de cuentas. Node.js 24; por ahora, solo escucha en loopback.
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const { DatabaseSync } = require('node:sqlite');
const scrypt = promisify(crypto.scrypt);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const validName = name => typeof name === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(name);
class AuthError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function createAuthServer({ databasePath, clock = Date.now, sessionMs = 12 * 3600000 } = {}) {
  if (!databasePath) throw new Error('Falta la ruta de la base de cuentas.');
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS reservations(username TEXT PRIMARY KEY COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);`);
  let activeHashes = 0;
  function transaction(action) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = action(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  async function passwordHash(password, salt) {
    if (activeHashes >= 4) throw new AuthError(503, 'Servicio ocupado. Intenta nuevamente.');
    activeHashes++;
    try { return await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }); }
    finally { activeHashes--; }
  }
  function rateLimit(bucket, max, duration) {
    const now = clock();
    db.prepare('DELETE FROM limits WHERE reset_at <= ?').run(now);
    const key = hash(bucket);
    db.prepare('INSERT INTO limits(bucket,count,reset_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1').run(key, now + duration);
    const row = db.prepare('SELECT count FROM limits WHERE bucket=?').get(key);
    if (row.count > max) throw new AuthError(429, 'Demasiados intentos. Espera antes de volver a intentar.');
  }
  function issueSession(user) {
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(clock());
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = clock() + sessionMs;
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token), user.id, expiresAt);
    return { ok: true, user: { id: user.id, username: user.username }, token, expiresAt };
  }
  function session(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new AuthError(401, 'Inicia sesión nuevamente.');
    const row = db.prepare('SELECT users.id, users.username, sessions.expires_at FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').get(hash(token), clock());
    if (!row) throw new AuthError(401, 'Inicia sesión nuevamente.');
    return { ok: true, user: { id: row.id, username: row.username }, expiresAt: row.expires_at };
  }
  function reserve(username) {
    if (!validName(username)) throw new Error('Nombre reservado inválido.');
    transaction(() => {
      if (db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE').get(username)) throw new Error('El nombre ya pertenece a una cuenta: requiere revisión administrativa.');
      db.prepare('INSERT OR IGNORE INTO reservations VALUES(?)').run(username);
    });
  }
  async function credentials(action, input, address) {
    rateLimit(`ip:${address}`, 30, 15 * 60000);
    if (!validName(input.username) || typeof input.password !== 'string' || Buffer.byteLength(input.password, 'utf8') > 256) {
      throw new AuthError(400, 'Usa un nombre de 3 a 16 letras, números o guion bajo y una contraseña válida.');
    }
    const normalized = input.username.toLowerCase();
    if (action === 'register') {
      rateLimit(`register:${address}`, 5, 3600000);
      if (input.password.length < 12) throw new AuthError(400, 'La contraseña debe tener al menos 12 caracteres.');
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = await passwordHash(input.password, salt);
      // Comprobar después del hash y sin await entre comprobación e inserción.
      return transaction(() => {
        if (db.prepare('SELECT username FROM reservations WHERE username=? COLLATE NOCASE').get(normalized) || db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE').get(normalized)) {
          throw new AuthError(409, 'Ese nombre no está disponible.');
        }
        const user = { id: crypto.randomUUID(), username: input.username };
        db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user.id, user.username, salt, derived.toString('hex'), clock());
        return issueSession(user);
      });
    }
    rateLimit(`login:${normalized}`, 8, 15 * 60000);
    const user = db.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE').get(normalized);
    // Mismo coste criptográfico para cuentas inexistentes.
    const derived = await passwordHash(input.password, user?.salt || '00000000000000000000000000000000');
    if (!user || !crypto.timingSafeEqual(derived, Buffer.from(user.password_hash, 'hex'))) throw new AuthError(401, 'Nombre o contraseña incorrectos.');
    db.prepare('DELETE FROM limits WHERE bucket=?').run(hash(`login:${normalized}`));
    return issueSession(user);
  }
  async function body(req) {
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new AuthError(415, 'Se requiere JSON.');
    let size = 0; const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4096) throw new AuthError(413, 'Solicitud demasiado grande.');
      chunks.push(chunk);
    }
    try {
      const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      return value;
    } catch { throw new AuthError(400, 'Solicitud inválida.'); }
  }
  const server = http.createServer(async (req, res) => {
    const reply = (status, value) => {
      if (res.destroyed) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Connection': 'close' });
      res.end(JSON.stringify(value));
    };
    try {
      const allowedHost = `127.0.0.1:${server.address()?.port}`;
      if (req.headers.host !== allowedHost || req.headers.origin !== undefined) throw new AuthError(403, 'Solicitud no permitida.');
      if (req.method === 'GET' && req.url === '/health') return reply(200, { ok: true, mode: 'local-development' });
      const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
      if (req.method === 'GET' && req.url === '/v1/session') return reply(200, session(token));
      if (req.method === 'POST' && req.url === '/v1/logout') {
        session(token);
        db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
        return reply(200, { ok: true });
      }
      if (req.method === 'POST' && ['/v1/register', '/v1/login'].includes(req.url)) {
        const result = await credentials(req.url.slice(4), await body(req), req.socket.remoteAddress);
        return reply(req.url === '/v1/register' ? 201 : 200, result);
      }
      throw new AuthError(404, 'Ruta no encontrada.');
    } catch (error) {
      // Nunca registrar cuerpo, cabeceras, contraseñas o tokens.
      reply(error.status || 500, { ok: false, message: error.status ? error.message : 'No se pudo completar la operación.' });
    }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.maxConnections = 64;
  const close = async () => {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    db.close();
  };
  return { server, reserve, close };
}
module.exports = { createAuthServer };
if (require.main === module) {
  const databasePath = path.resolve(process.env.CHAMPAGNE_AUTH_DB || path.join(__dirname, 'data', 'accounts.sqlite'));
  const service = createAuthServer({ databasePath });
  if (process.argv[2] === '--reserve') {
    try { service.reserve(process.argv[3]); console.log('Nombre reservado.'); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
    service.close();
  } else {
    const port = Number(process.env.CHAMPAGNE_AUTH_PORT || 32145);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto inválido.');
    service.server.listen(port, '127.0.0.1', () => {
      console.log(`Cuentas de prueba: http://127.0.0.1:${port}. Acceso solo desde esta PC.`);
      if (process.send) process.send({ type: 'ready' });
    });
    const stop = () => service.close().then(() => process.exit());
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  }
}
