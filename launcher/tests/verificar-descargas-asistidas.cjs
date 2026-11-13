const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createManualDownloads, validateAssistedManifest, validateAcquisition } = require('../src/champagne-manual-downloads');
const { createDownloadInbox } = require('../src/champagne-download-inbox');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const bytes = Buffer.from('mod oficial de prueba');
const entry = { path: 'mods/manual.jar', acquisition: 'user_official_download', sha256: hash(bytes), pageUrl: 'https://www.curseforge.com/minecraft/mc-mods/example/files/123' };
const document = { packId: 'champagne-vol5', version: '0.1.0', expectedFiles: 1, files: [entry], delete: [] };
function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'champagne-assisted-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const instanceDir = path.join(root, 'instance'), cacheDir = path.join(root, 'cache');
  fs.mkdirSync(path.join(instanceDir, 'mods'), { recursive: true });
  const source = path.join(root, 'download (1).jar'); fs.writeFileSync(source, bytes);
  return { root, source, instanceDir, cacheDir, manual: createManualDownloads({ manifest: document, instanceDir, cacheDir }) };
}
test('importar usa hash, acepta nombre cambiado y no modifica la instancia', t => {
  const env = setup(t);
  assert.equal(env.manual.pending().length, 1);
  const wrong = path.join(env.root, 'manual.jar'); fs.writeFileSync(wrong, 'otra version');
  const result = env.manual.importFiles([env.source, wrong]);
  assert.equal(result.accepted.length, 1); assert.equal(result.rejected.length, 1);
  assert.equal(result.missing.length, 0);
  assert.deepEqual(fs.readdirSync(path.join(env.instanceDir, 'mods')), []);
  assert.deepEqual(env.manual.read(entry), bytes);
  assert.deepEqual(fs.readFileSync(env.source), bytes);
});
test('reutiliza mod local correcto y detecta caché corrompida', t => {
  const env = setup(t);
  fs.writeFileSync(path.join(env.instanceDir, 'mods', 'manual.jar'), bytes);
  assert.equal(env.manual.pending().length, 0);
  fs.writeFileSync(path.join(env.instanceDir, 'mods', 'manual.jar'), 'otra version');
  env.manual.importFiles([env.source]);
  fs.writeFileSync(path.join(env.cacheDir, 'mods', entry.sha256 + '.jar'), 'corrupto');
  assert.equal(env.manual.pending().length, 1);
  assert.throws(() => env.manual.read(entry), /SHA-256/);
});
test('bloquea páginas falsas, rutas personales y manifiestos incompletos', () => {
  for (const pageUrl of ['http://www.curseforge.com/minecraft/mc-mods/example/files/123', 'https://www.curseforge.com.evil.test/minecraft/mc-mods/example/files/123', entry.pageUrl + '?redirect=evil', 'https://user@www.curseforge.com/minecraft/mc-mods/example/files/123']) {
    assert.throws(() => validateAcquisition({ ...entry, pageUrl }));
  }
  assert.throws(() => validateAcquisition({ ...entry, url: 'https://example.test/a.jar' }));
  assert.throws(() => validateAssistedManifest({ ...document, expectedFiles: 46 }));
  assert.throws(() => validateAssistedManifest({ ...document, files: [{ ...entry, path: '../saves/a.jar' }] }));
});
test('bloquea junction en la caché e importación de carpetas', t => {
  const env = setup(t);
  const outside = path.join(env.root, 'outside'); fs.mkdirSync(outside);
  fs.mkdirSync(env.cacheDir);
  fs.symlinkSync(outside, path.join(env.cacheDir, 'mods'), 'junction');
  assert.throws(() => env.manual.importFiles([env.source]), /junction|simbólico/);
  assert.deepEqual(fs.readdirSync(outside), []);
});
test('manifiesto incluido conserva los 57 mods y 14 páginas oficiales', () => {
  const manifest = validateAssistedManifest(require('../src/champagne-assisted-manifest.json'));
  assert.equal(manifest.files.length, 57);
  assert.equal(manifest.files.filter(e => validateAcquisition(e) === 'manual').length, 14);
  assert.equal(manifest.files.filter(e => validateAcquisition(e) === 'direct').length, 43);
});

test('detecta descarga terminada con sufijo del navegador, la verifica y conserva el original', t => {
  const env = setup(t); let time = 1000;
  const directory = path.join(env.root, 'downloads'); fs.mkdirSync(directory);
  const inbox = createDownloadInbox({ directory, manual: env.manual, now: () => time });
  const file = path.join(directory, 'manual (1).jar'); fs.writeFileSync(file, bytes);
  assert.equal(inbox.scan().accepted.length, 0);
  time += 1499; assert.equal(inbox.scan().accepted.length, 0);
  time++; assert.deepEqual(inbox.scan().accepted, ['mods/manual.jar']);
  assert.equal(inbox.scan().missing.length, 0);
  assert.deepEqual(fs.readFileSync(file), bytes);
  assert.deepEqual(fs.readdirSync(path.join(env.instanceDir, 'mods')), []);
});

test('ignora parciales y archivos ajenos; rechaza una versión incorrecta y reintenta si cambia', t => {
  const env = setup(t); let time = 0;
  const directory = path.join(env.root, 'downloads'); fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, 'manual.jar.crdownload'), bytes);
  fs.writeFileSync(path.join(directory, 'otro.jar'), bytes);
  const file = path.join(directory, 'manual.jar'); fs.writeFileSync(file, 'incorrecto');
  const inbox = createDownloadInbox({ directory, manual: env.manual, now: () => time });
  inbox.scan(); time += 2000;
  assert.equal(inbox.scan().rejected.length, 1);
  assert.equal(inbox.scan().rejected.length, 0);
  assert.equal(env.manual.pending().length, 1);
  fs.writeFileSync(file, bytes); inbox.scan(); time += 2000;
  assert.equal(inbox.scan().accepted.length, 1);
  assert.ok(fs.existsSync(path.join(directory, 'otro.jar')));
});

test('espera a que el archivo deje de cambiar y tolera Descargas inexistente', t => {
  const env = setup(t); let time = 0;
  const directory = path.join(env.root, 'downloads');
  const inbox = createDownloadInbox({ directory, manual: env.manual, now: () => time });
  assert.equal(inbox.scan().missing.length, 1);
  fs.mkdirSync(directory); const file = path.join(directory, 'manual.jar');
  fs.writeFileSync(file, bytes.subarray(0, 2)); inbox.scan(); time += 1000;
  fs.writeFileSync(file, bytes); assert.equal(inbox.scan().accepted.length, 0);
  time += 1499; assert.equal(inbox.scan().accepted.length, 0);
  time++; assert.equal(inbox.scan().accepted.length, 1);
});
