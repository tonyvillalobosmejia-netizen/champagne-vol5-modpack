// Ejecutar explícitamente en el equipo de desarrollo, nunca en clientes finales.
const { fork, spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const serverEnv = { ...process.env, CHAMPAGNE_AUTH_PORT: '32145', CHAMPAGNE_AUTH_DB: path.join(root, '.champagne-admin', 'accounts-dev', 'accounts.sqlite') };
const reserving = process.argv[2] === '--reserve';
if (process.argv[2] && !reserving) throw new Error('Opción desconocida.');
if (reserving && !/^[A-Za-z0-9_]{3,16}$/.test(process.argv[3] || '')) throw new Error('Indica un nombre de 3 a 16 letras, números o guion bajo.');
const service = fork(path.join(root, 'auth-server', 'server.cjs'), reserving ? ['--reserve', process.argv[3]] : [], { env: serverEnv, windowsHide: true, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
let launcher;
service.once('message', message => {
  if (message?.type !== 'ready') return;
  const env = { ...process.env, CHAMPAGNE_AUTH_DEV_URL: 'http://127.0.0.1:32145' };
  delete env.ELECTRON_RUN_AS_NODE;
  launcher = spawn(require('electron'), [root], { env, windowsHide: true, stdio: 'inherit' });
  launcher.once('exit', code => { service.kill(); process.exitCode = code || 0; });
  launcher.once('error', () => { console.error('No se pudo abrir Electron.'); service.kill(); process.exitCode = 1; });
});
service.once('exit', code => {
  if (reserving) { process.exitCode = code || 0; return; }
  if (!launcher) { console.error('No se pudo iniciar el servicio de prueba. Comprueba si el puerto 32145 está ocupado.'); process.exitCode = code || 1; }
});
process.on('SIGINT', () => { launcher?.kill(); service.kill(); });
