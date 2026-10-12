const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createAuthServer } = require('../auth-server/server.cjs');
const { createAuthClient } = require('../src/champagne-auth');
async function setup(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'champagne-accounts-'));
  const databasePath = path.join(dir, 'accounts.sqlite');
  const service = createAuthServer({ databasePath, ...options });
  await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${service.server.address().port}`;
  t.after(async () => {
    await service.close();
    const resolved = path.resolve(dir);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('champagne-accounts-')) throw new Error('Limpieza inválida.');
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const send = async (route, body, token, extra = {}) => {
    const response = await fetch(baseUrl + route, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  return { service, databasePath, send, client: () => createAuthClient({ baseUrl, allowLocalDev: true }) };
}
const credentials = (username = 'Jugador') => ({ username, password: 'Clave_ficticia_12345' });
test('registro, acceso canónico y token fuera del renderer; cierre revoca la sesión', async t => {
  const { client, databasePath } = await setup(t);
  const first = client();
  const registration = await first.register(credentials());
  assert.equal(registration.ok, true);
  assert.equal(registration.user.username, 'Jugador');
  assert.equal('token' in registration, false);
  assert.equal('password' in first.status(), false);
  assert.equal(await first.verifiedUsername(), 'Jugador');
  const second = client();
  assert.equal((await second.login({ ...credentials('jugador'), password: 'incorrecta' })).ok, false);
  assert.equal((await second.login(credentials('jugador'))).user.username, 'Jugador');
  assert.equal((await first.logout()).user, null);
  assert.equal(await first.verifiedUsername(), null);
  assert.equal(fs.readFileSync(databasePath).includes(Buffer.from(credentials().password)), false);
  assert.equal(fs.readFileSync(databasePath + '-wal').includes(Buffer.from(credentials().password)), false);
});
test('nombres únicos sin distinguir mayúsculas, reservas y registros simultáneos', async t => {
  const { service, send } = await setup(t);
  service.reserve('Administrador');
  assert.equal((await send('/v1/register', credentials('administrador'))).status, 409);
  const results = await Promise.all([send('/v1/register', credentials('Jugador')), send('/v1/register', credentials('jugador'))]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.throws(() => service.reserve('JUGADOR'), /ya pertenece/);
});
test('token revocado o vencido no acredita una cuenta', async t => {
  let now = Date.now();
  const { send } = await setup(t, { clock: () => now, sessionMs: 1000 });
  const register = await send('/v1/register', credentials());
  const token = register.body.token;
  assert.equal((await send('/v1/session', null, token)).status, 200);
  now += 1001;
  assert.equal((await send('/v1/session', null, token)).status, 401);
  const login = await send('/v1/login', credentials());
  assert.equal((await send('/v1/logout', {}, login.body.token)).status, 200);
  assert.equal((await send('/v1/session', null, login.body.token)).status, 401);
});
test('intentos limitados, solicitudes de navegador bloqueadas y entradas inválidas', async t => {
  const { send } = await setup(t);
  assert.equal((await send('/v1/register', credentials(), null, { Origin: 'https://sitio-ajeno.example' })).status, 403);
  assert.equal((await send('/v1/register', { username: '../', password: 'Clave_ficticia_12345' })).status, 400);
  assert.equal((await send('/v1/register', { username: 'Jugador', password: 'corta' })).status, 400);
  for (let attempt = 0; attempt < 8; attempt++) assert.equal((await send('/v1/login', credentials('Desconocido'))).status, 401);
  assert.equal((await send('/v1/login', credentials('Desconocido'))).status, 429);
});
test('no acepta HTTP externo ni redirecciones de credenciales; servicio ausente conserva modo local', async () => {
  assert.throws(() => createAuthClient({ baseUrl: 'http://example.com' }), /HTTPS/);
  assert.throws(() => createAuthClient({ baseUrl: 'http://127.0.0.1:32145' }), /HTTPS/);
  assert.throws(() => createAuthClient({ baseUrl: 'https://nombre:secreto@example.com' }), /HTTPS/);
  const disabled = createAuthClient();
  assert.equal(disabled.status().configured, false);
  assert.equal(await disabled.verifiedUsername(), null);
  assert.equal((await disabled.login(credentials())).ok, false);
});
test('una redirección no reenvía contraseñas a otro destino', async t => {
  const http = require('node:http');
  let leaked = false;
  const trap = http.createServer((_req, res) => { leaked = true; res.end('{}'); });
  await new Promise(resolve => trap.listen(0, '127.0.0.1', resolve));
  const redirect = http.createServer((req, res) => {
    req.resume();
    res.writeHead(302, { Location: `http://127.0.0.1:${trap.address().port}/robada`, 'Content-Type': 'application/json' });
    res.end('{"ok":false}');
  });
  await new Promise(resolve => redirect.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => redirect.close(resolve)); await new Promise(resolve => trap.close(resolve)); });
  const client = createAuthClient({ baseUrl: `http://127.0.0.1:${redirect.address().port}`, allowLocalDev: true });
  assert.equal((await client.login(credentials())).ok, false);
  assert.equal(leaked, false);
});
test('identidad y nombre reservado persisten al reiniciar el servicio', async t => {
  const { service, databasePath, send } = await setup(t);
  service.reserve('Fundador');
  const registered = await send('/v1/register', credentials());
  // Otra conexión SQLite sobre la misma base: verifica persistencia sin crear cuentas nuevas.
  const reopened = createAuthServer({ databasePath });
  await new Promise(resolve => reopened.server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${reopened.server.address().port}/v1/session`, { headers: { Authorization: `Bearer ${registered.body.token}` } });
    assert.equal((await response.json()).user.id, registered.body.user.id);
    assert.throws(() => reopened.reserve('jugador'), /ya pertenece/);
  } finally { await reopened.close(); }
});

async function launchFixture(t, verifiedUsername, provider = 'password') {
  const vm = require('node:vm');
  const { EventEmitter } = require('node:events');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'champagne-auth-launch-'));
  let starts = 0, selectedUsername;
  const children = [];
  t.after(async () => {
    for (const child of children) child.emit('close', 0);
    await new Promise(resolve => setTimeout(resolve, 30));
    const resolved = path.resolve(dir);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('champagne-auth-launch-')) throw new Error('Destino de limpieza inválido.');
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const context = vm.createContext({
    require: name => {
      if (name === 'electron') return { app: { getPath: () => dir, whenReady: () => ({ then() {} }), on() {} }, BrowserWindow: { getAllWindows: () => [] }, ipcMain: {}, shell: {} };
      if (name === './champagne-auth') return { createAuthClient: () => ({ verifiedUsername, status: () => ({provider}) }) };
      if (name === './champagne-preparation') return { createPreparation: () => ({ prepare: async () => ({ ok: true }) }) };
      if (name === './champagne-config-sync') return { syncBundledConfigs: () => {} };
      if (name === 'node:child_process') return { spawn: () => {
        starts++; const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.pid = 123;
        children.push(child); setImmediate(() => child.emit('spawn')); return child;
      } };
      if (name.startsWith('./')) return require(path.join(__dirname, '../src', name));
      return require(name);
    }, process, Buffer, console, __dirname: path.resolve(__dirname, '../src'),
    capture: name => { selectedUsername = name; }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8'), context);
  vm.runInContext('prepareSelectedGame=async()=>{await automaticPreparation.prepare();return null;};verifyPackBeforePlay=async()=>({ok:true});getLocalProfile=()=>({username:"NombreLocalDistinto"});checkJava17=async()=>{};buildForgeLaunch=name=>{capture(name);return {java:"test-java",args:[],ramMB:2048,classpathCount:1};};', context);
  return { launch: () => vm.runInContext('launchForge()', context), starts: () => starts, username: () => selectedUsername };
}
test('JUGAR toma el nombre verificado de la cuenta, sin reemplazar el perfil local', async t => {
  const fixture = await launchFixture(t, async () => 'CuentaRegistrada');
  assert.equal((await fixture.launch()).ok, true);
  assert.equal(fixture.username(), 'CuentaRegistrada');
  assert.equal(fixture.starts(), 1);
});
test('fallo de validación de sesión bloquea el arranque en vez de usar otro nombre', async t => {
  const fixture = await launchFixture(t, async () => { throw new Error('sesión revocada'); });
  await assert.rejects(fixture.launch(), /revocada/);
  assert.equal(fixture.starts(), 0);
});
test('retirar rol durante preparación bloquea Java en la comprobación final', async t => {
  let checks=0;
  const fixture=await launchFixture(t,async()=>{if(++checks===1)return 'JugadorDiscord';throw Error('Ya no tienes el rol autorizado.');},'discord');
  await assert.rejects(fixture.launch(),/rol autorizado/);assert.equal(checks,2);assert.equal(fixture.starts(),0);
});
