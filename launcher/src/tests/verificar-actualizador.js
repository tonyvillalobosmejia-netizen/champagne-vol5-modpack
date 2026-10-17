"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { test } = require("node:test");
const { EventEmitter } = require("node:events");
const guards = require("../champagne-update-paths");
const hash = data => crypto.createHash("sha256").update(data).digest("hex");
const entry = (name, bytes = "new") => ({ path: "mods/" + name, url: "https://example.invalid/" + name, sha256: hash(bytes) });
const manifest = files => ({ packId: "champagne-vol5", version: "0.1.0", expectedFiles: files.length, files, delete: [] });

function sandbox(t, document, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "champagne99-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const app = new EventEmitter();
  app.getPath = () => root;
  app.whenReady = () => ({ then() {} });
  t.after(() => app.emit('quit'));
  const appRoot = path.join(root, "MiLauncher");
  let instance = path.join(appRoot, "instances", "principal");
  const metadata = path.join(appRoot, "metadata");
  fs.mkdirSync(path.join(instance, "mods"), { recursive: true });
  let requests = 0;
  const disk = options.disk || fs;
  const context = vm.createContext({
    require: name => {
      if (name === './champagne-pack-confirmation') return { confirmPublication: async () => ({response: options.approve ? 1 : 0}) };
      if (name === "electron") return {
        app,
        BrowserWindow: { getAllWindows: () => [] }, ipcMain: {}, shell: {}
      };
      if (name === "./config") return { ...require("../config"), catalogEnabled:false, manifestUrl: options.disabled ? "" : "https://example.invalid/manifest" };
      if (name === "./champagne-library-cache") return require("../champagne-library-cache");
      if (name === "./champagne-pack-purge") return require("../champagne-pack-purge");
      if (name === "./champagne-pack-catalog") return require("../champagne-pack-catalog");
      if (name === "./champagne-config-sync") return require("../champagne-config-sync");
      if (name === "./champagne-update-paths") return guards;
      if (name === "./champagne-runtime") return require("../champagne-runtime");
      if (name === "./champagne-preparation") return require("../champagne-preparation");
      // Estas pruebas aíslan las descargas; la cuenta ya está autorizada.
      if (name === "./champagne-auth") return { createAuthClient: () => ({
        status: () => ({provider:"discord",required:true,user:{username:"Tester"}}),
        verifiedUsername: async () => "Tester"
      }) };
      if (name === "./champagne-avatar") return require("../champagne-avatar");
      if (name === "./champagne-avatar-choice") return require("../champagne-avatar-choice");
      if (name === "./champagne-microsoft-device") return require("../champagne-microsoft-device");
      if (name === "./champagne-manual-downloads") return require("../champagne-manual-downloads");
      if (name === "./champagne-download-inbox") return require("../champagne-download-inbox");
      if (name === "./champagne-support") return require("../champagne-support");
      if (name === "./champagne-remote-content") return require("../champagne-remote-content");
      if (name === "./champagne-game-profile") return require("../champagne-game-profile");
      if (name === "./champagne-presentation") return require("../champagne-presentation");
      if (name === "./champagne-launcher-updates") return require("../champagne-launcher-updates");
      if (name === "./champagne-microsoft") return require("../champagne-microsoft");
      if (name === "./champagne-game-identity") return require("../champagne-game-identity");
      if (name === "./champagne-official-sources") return require("../champagne-official-sources");
      if (name === "node:fs") return disk;
      if(name==='./champagne-session-store')return require('../champagne-session-store');
      if(name.startsWith('./'))return require(path.resolve(__dirname,'..',name));
      return require(name);
    }, Buffer, process, console, __dirname: path.resolve(__dirname, "..")
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../main.js"), "utf8"), context);
  instance=vm.runInContext("instanceDir",context);
  context.fixture = document;
  context.payload = Buffer.from("new");
  context.onRequest = () => requests++;
  vm.runInContext('requestBuffer = async url => { onRequest(); return url.endsWith("/manifest") ? Buffer.from(JSON.stringify(fixture)) : payload; };', context);
  return { root, instance, metadata, requests: () => requests, context,
    run: () => vm.runInContext("applyUpdates()", context),
    assisted: () => vm.runInContext("applyUpdates(fixture)", context) };
}

const manualEntry = (name, bytes = "manual") => ({ path: "mods/" + name, sha256: hash(bytes),
  acquisition: "user_official_download", pageUrl: "https://www.curseforge.com/minecraft/mc-mods/example/files/123" });
function importManual(env, relative = "download.jar", bytes = "manual") {
  const source = path.join(env.root, relative); fs.writeFileSync(source, bytes);
  env.context.selectedFixture = [source];
  return vm.runInContext("manualDownloads(fixture).importFiles(selectedFixture)", env.context);
}
function content(files) {
  return { packId: 'champagne-vol5', version: '0.1.2', expectedFiles: files.length,
    files: files.map(([relative,bytes]) => ({ path: relative, bytes: Buffer.byteLength(bytes), sha256: hash(bytes), base64: Buffer.from(bytes).toString('base64') })) };
}

test('JUGAR instala y verifica el modpack antes de construir el arranque Java', async t => {
  const env = sandbox(t, manifest([entry('a.jar')]));
  env.context.beforeJava = () => assert.equal(fs.readFileSync(path.join(env.instance, 'mods/a.jar'), 'utf8'), 'new');
  vm.runInContext('getLocalProfile=()=>({username:"Tester"});automaticPreparation.prepare=async()=>({ok:true});buildForgeLaunch=()=>{beforeJava();throw new Error("barrera Java de prueba");};', env.context);
  await assert.rejects(vm.runInContext('launchForge()', env.context), /barrera Java/);
  assert.equal(env.requests(), 2);
});

test('cambiar de servidor instala en otra instancia y conserva los mundos y mods anteriores', async t => {
  const env=sandbox(t,manifest([entry('a.jar')]));
  fs.mkdirSync(path.join(env.instance,'saves'));fs.writeFileSync(path.join(env.instance,'saves/world'),'world');
  fs.writeFileSync(path.join(env.instance,'mods/old.jar'),'old');
  env.context.fixture.game={serverId:'otro-servidor',loader:'forge',packName:'Otro servidor',minecraftVersion:'1.20.1',forgeVersion:'47.4.10',javaMajor:17,forgeInstallerSha1:'a'.repeat(40),minLauncherVersion:'0.1.4'};
  env.context.fixture.content=content([['config/server.txt','new server']]);
  env.context.fixture.packId=env.context.fixture.content.packId='otro-servidor';
  vm.runInContext('selectGame(fixture)',env.context);
  const next=vm.runInContext('instanceDir',env.context);
  assert.notEqual(next,env.instance);assert.equal((await env.assisted()).ok,true);
  assert.equal(fs.readFileSync(path.join(next,'mods/a.jar'),'utf8'),'new');
  assert.equal(fs.readFileSync(path.join(env.instance,'mods/old.jar'),'utf8'),'old');
  assert.equal(fs.readFileSync(path.join(env.instance,'saves/world'),'utf8'),'world');
  delete env.context.fixture.game;env.context.fixture.packId=env.context.fixture.content.packId='champagne-vol5';vm.runInContext('selectGame(fixture)',env.context);
  assert.equal(vm.runInContext('instanceDir',env.context),env.instance);
});

test('no cambia de perfil mientras Minecraft está abierto', t=>{
  const env=sandbox(t,manifest([entry('a.jar')]));
  env.context.fixture.game={serverId:'otro-servidor',loader:'forge',packName:'Otro',minecraftVersion:'1.21.1',forgeVersion:'52.1.0',javaMajor:21,forgeInstallerSha1:'a'.repeat(40)};
  env.context.fixture.content=content([['config/server.txt','new server']]);
  vm.runInContext('minecraftProcess={}',env.context);
  assert.throws(()=>vm.runInContext('selectGame(fixture)',env.context),/Cierra Minecraft/);
  assert.equal(vm.runInContext('instanceDir',env.context),env.instance);
});

test('JUGAR con archivos manuales pendientes detiene el arranque sin tocar mods', async t => {
  const env = sandbox(t, manifest([entry('a.jar'), manualEntry('b.jar')]));
  vm.runInContext('getLocalProfile=()=>({username:"Tester"});automaticPreparation.prepare=async()=>({ok:true});buildForgeLaunch=()=>{throw new Error("Java no debe iniciarse");};', env.context);
  const result = await vm.runInContext('launchForge()', env.context);
  assert.equal(result.ok, false); assert.equal(result.needsManual, true);
  assert.equal(env.requests(), 1);
  assert.equal(fs.existsSync(path.join(env.instance, 'mods/a.jar')), false);
});

test('JUGAR bloquea una actualización corrupta y conserva la versión local', async t => {
  const env = sandbox(t, manifest([entry('a.jar', 'different')]));
  fs.writeFileSync(path.join(env.instance, 'mods/a.jar'), 'old');
  vm.runInContext('getLocalProfile=()=>({username:"Tester"});automaticPreparation.prepare=async()=>({ok:true});buildForgeLaunch=()=>{throw new Error("Java no debe iniciarse");};', env.context);
  await assert.rejects(vm.runInContext('launchForge()', env.context), /SHA-256/);
  assert.equal(fs.readFileSync(path.join(env.instance, 'mods/a.jar'), 'utf8'), 'old');
});

test('cada comprobación consulta el manifiesto pero no vuelve a descargar contenido vigente', async t => {
  const doc = manifest([entry('a.jar')]);
  doc.content = content([['config/a.cfg', 'default']]);
  doc.content.files.push({ path: 'shaderpacks/test.zip', bytes: 3, sha256: hash('new'), url: 'https://cdn.modrinth.com/data/test/versions/test/test.zip' });
  doc.content.expectedFiles++;
  const env = sandbox(t, doc);
  assert.equal((await vm.runInContext('verifyPackBeforePlay()', env.context)).ok, true);
  const before = env.requests();
  fs.writeFileSync(path.join(env.instance, 'config/a.cfg'), 'personal');
  assert.equal((await vm.runInContext('verifyPackBeforePlay()', env.context)).changed, 0);
  assert.equal(env.requests(), before + 1);
  assert.equal(fs.readFileSync(path.join(env.instance, 'config/a.cfg'), 'utf8'), 'personal');
  fs.writeFileSync(path.join(env.instance, 'mods/a.jar'), 'damaged');
  assert.equal((await vm.runInContext('verifyPackBeforePlay()', env.context)).changed, 1);
  assert.equal(fs.readFileSync(path.join(env.instance, 'mods/a.jar'), 'utf8'), 'new');
});

test('desconexión permite el modpack local, pero no una instalación vacía ni errores HTTP', async t => {
  const env = sandbox(t, manifest([entry('a.jar')]));
  vm.runInContext('requestBuffer=async()=>{const e=new Error("offline");e.code="ENOTFOUND";throw e;};', env.context);
  await assert.rejects(vm.runInContext('verifyPackBeforePlay()', env.context), /offline/);
  fs.writeFileSync(path.join(env.instance, 'mods/a.jar'), 'local');
  assert.equal((await vm.runInContext('verifyPackBeforePlay()', env.context)).offline, true);
  vm.runInContext('requestBuffer=async()=>{throw new Error("Descarga fallida (HTTP 404)");};', env.context);
  await assert.rejects(vm.runInContext('verifyPackBeforePlay()', env.context), /HTTP 404/);
  vm.runInContext('requestBuffer=async()=>Buffer.from("invalid-json");', env.context);
  await assert.rejects(vm.runInContext('verifyPackBeforePlay()', env.context), /JSON/);
});
test('contenido remoto se verifica antes de tocar mods y no pisa configuraciones personales', async t => {
  const doc = manifest([entry('a.jar')]); doc.content = content([['config/personal.cfg','new default'],['kubejs/client_scripts/new.js','script']]);
  const env = sandbox(t,doc);
  fs.mkdirSync(path.join(env.instance,'config')); fs.writeFileSync(path.join(env.instance,'config/personal.cfg'),'personal');
  assert.equal((await env.assisted()).ok,true);
  assert.equal(fs.readFileSync(path.join(env.instance,'config/personal.cfg'),'utf8'),'personal');
  assert.equal(fs.readFileSync(path.join(env.instance,'kubejs/client_scripts/new.js'),'utf8'),'script');
  assert.ok(fs.existsSync(path.join(env.metadata,'active-content.json')));
  const active = vm.runInContext('activeBundle(metadataDir, "old-bundle")',env.context);
  assert.equal(JSON.parse(fs.readFileSync(path.join(active,'manifest.json'))).version,'0.1.2');
});
test('contenido corrupto bloquea toda la actualización antes de reemplazar mods', async t => {
  const doc = manifest([entry('a.jar')]); doc.content = content([['config/a.cfg','default']]); doc.content.files[0].sha256 = hash('different');
  const env = sandbox(t,doc); fs.writeFileSync(path.join(env.instance,'mods/a.jar'),'old');
  await assert.rejects(env.assisted(),/SHA-256 de contenido/);
  assert.equal(fs.readFileSync(path.join(env.instance,'mods/a.jar'),'utf8'),'old');
  assert.equal(fs.existsSync(path.join(env.instance,'config/a.cfg')),false);
});
test('fallo al registrar versión restaura mods, contenido y estado de configuraciones', async t => {
  let failed = false; const disk = Object.create(fs);
  disk.writeFileSync = (file,...args) => {
    if (!failed && String(file).includes('installed.json.tmp')) { failed = true; throw new Error('disk failure'); }
    return fs.writeFileSync(file,...args);
  };
  const doc = manifest([entry('a.jar')]); doc.content = content([['config/a.cfg','default']]);
  const env = sandbox(t,doc,{disk}); fs.writeFileSync(path.join(env.instance,'mods/a.jar'),'old');
  await assert.rejects(env.assisted(),/disk failure/);
  assert.equal(fs.readFileSync(path.join(env.instance,'mods/a.jar'),'utf8'),'old');
  assert.equal(fs.existsSync(path.join(env.instance,'config/a.cfg')),false);
  assert.equal(fs.existsSync(path.join(env.metadata,'active-content.json')),false);
  assert.equal(fs.existsSync(path.join(env.metadata,'managed-client-config.json')),false);
});
test("descarga asistida incompleta no descarga ni modifica un solo mod", async t => {
  const env = sandbox(t, manifest([entry("a.jar"), manualEntry("b.jar")]));
  fs.writeFileSync(path.join(env.instance, "mods", "a.jar"), "old");
  const result = await env.assisted();
  assert.equal(result.needsManual, true); assert.equal(result.missing.length, 1);
  assert.equal(env.requests(), 0);
  assert.equal(fs.readFileSync(path.join(env.instance, "mods", "a.jar"), "utf8"), "old");
  assert.equal(fs.existsSync(path.join(env.metadata, "installed.json")), false);
});
test("instalación limpia combina fuente directa y JAR manual; segunda instalación no descarga", async t => {
  const env = sandbox(t, manifest([entry("a.jar"), manualEntry("b.jar")]));
  fs.mkdirSync(path.join(env.instance, "saves"));
  fs.writeFileSync(path.join(env.instance, "saves", "sentinel"), "world");
  fs.writeFileSync(path.join(env.instance, "options.txt"), "personal");
  assert.equal(importManual(env).accepted.length, 1);
  assert.equal((await env.assisted()).ok, true);
  assert.equal(fs.readFileSync(path.join(env.instance, "mods", "b.jar"), "utf8"), "manual");
  assert.equal(fs.readFileSync(path.join(env.instance, "mods", "a.jar"), "utf8"), "new");
  assert.equal(fs.readFileSync(path.join(env.instance, "saves", "sentinel"), "utf8"), "world");
  assert.equal(fs.readFileSync(path.join(env.instance, "options.txt"), "utf8"), "personal");
  const requests = env.requests();
  assert.equal((await env.assisted()).changed, 0); assert.equal(env.requests(), requests);
});
test("versión manual nueva conserva la anterior hasta importar; fallo directo también la conserva", async t => {
  const env = sandbox(t, manifest([entry("a.jar", "unexpected"), manualEntry("b.jar")]));
  fs.writeFileSync(path.join(env.instance, "mods", "b.jar"), "old manual");
  assert.equal((await env.assisted()).needsManual, true);
  importManual(env);
  await assert.rejects(env.assisted(), /SHA-256/);
  assert.equal(fs.readFileSync(path.join(env.instance, "mods", "b.jar"), "utf8"), "old manual");
});

test("bloquea rutas Windows ambiguas y archivos personales", () => {
  for (const name of ["../saves/world.jar", "mods/../a.jar", "mods/a.jar:stream.jar", "mods/CON.jar", "mods/LPT1.foo.jar", "mods/a\\b.jar", "options.txt"]) {
    assert.throws(() => guards.modPathKey(name));
  }
  assert.equal(guards.modPathKey("mods/ImmediatelyFast-Forge-1.5.4+1.20.4.jar"), "mods/immediatelyfast-forge-1.5.4+1.20.4.jar");
});

test("bloquea duplicados, conflictos y estado anterior ambiguo", () => {
  assert.throws(() => guards.validateModPathSets([entry("A.jar"), entry("a.jar")], []));
  assert.throws(() => guards.validateModPathSets([entry("A.jar")], ["mods/a.jar"]));
  assert.throws(() => guards.validateModPathSets([], ["mods/a.jar", "mods/A.jar"]));
  assert.throws(() => guards.validateModPathSets([entry("A.jar")], [], { "mods/a.jar": hash("old") }));
  assert.throws(() => guards.validateModPathSets([], [], { "mods/a.jar": "bad" }));
});

test("rechaza una junction real antes de descargar JAR", async t => {
  const env = sandbox(t, manifest([entry("a.jar")]));
  const outside = path.join(env.root, "outside");
  fs.mkdirSync(outside);
  fs.rmdirSync(path.join(env.instance, "mods"));
  fs.symlinkSync(outside, path.join(env.instance, "mods"), "junction");
  await assert.rejects(env.run(), /junction|simbólico/);
  assert.equal(env.requests(), 1);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test("rechaza duplicados Windows antes de descargar JAR", async t => {
  const env = sandbox(t, manifest([entry("A.jar"), entry("a.jar")]));
  await assert.rejects(env.run(), /duplicado/);
  assert.equal(env.requests(), 1);
});

test("manifiesto incompleto y actualización desactivada no cambian mods", async t => {
  const doc = manifest([entry("a.jar")]); doc.expectedFiles = 46;
  const env = sandbox(t, doc);
  await assert.rejects(env.run(), /incompleto/);
  assert.deepEqual(fs.readdirSync(path.join(env.instance, "mods")), []);
  const disabled = sandbox(t, doc, { disabled: true });
  assert.equal((await disabled.run()).ok, false);
  assert.equal(disabled.requests(), 0);
});

test("SHA incorrecto conserva el mod anterior", async t => {
  const env = sandbox(t, manifest([entry("a.jar", "different")]));
  const file = path.join(env.instance, "mods", "a.jar");
  fs.writeFileSync(file, "old");
  await assert.rejects(env.run(), /SHA-256/);
  assert.equal(fs.readFileSync(file, "utf8"), "old");
  assert.equal(fs.existsSync(path.join(env.metadata, "installed.json")), false);
});

test("instalación verificada preserva mundos y ajustes", async t => {
  const env = sandbox(t, manifest([entry("a.jar")]));
  fs.mkdirSync(path.join(env.instance, "saves", "world"), { recursive: true });
  fs.writeFileSync(path.join(env.instance, "saves", "world", "level.dat"), "world");
  fs.writeFileSync(path.join(env.instance, "options.txt"), "personal");
  assert.equal((await env.run()).ok, true);
  assert.equal(fs.readFileSync(path.join(env.instance, "mods", "a.jar"), "utf8"), "new");
  assert.equal(fs.readFileSync(path.join(env.instance, "saves", "world", "level.dat"), "utf8"), "world");
  assert.equal(fs.readFileSync(path.join(env.instance, "options.txt"), "utf8"), "personal");
  assert.equal(JSON.parse(fs.readFileSync(path.join(env.metadata, "installed.json"))).files["mods/a.jar"], hash("new"));
});

test("fallo durante el segundo reemplazo restaura ambos mods", async t => {
  let failed = false;
  const disk = Object.create(fs);
  disk.copyFileSync = (source, target) => {
    if (!failed && source.includes("update-stage-") && target.endsWith("b.jar")) {
      failed = true; throw new Error("fallo simulado");
    }
    return fs.copyFileSync(source, target);
  };
  const env = sandbox(t, manifest([entry("a.jar"), entry("b.jar")]), { disk });
  for (const name of ["a.jar", "b.jar"]) fs.writeFileSync(path.join(env.instance, "mods", name), "old " + name);
  await assert.rejects(env.run(), /fallo simulado/);
  for (const name of ["a.jar", "b.jar"]) assert.equal(fs.readFileSync(path.join(env.instance, "mods", name), "utf8"), "old " + name);
  assert.equal(fs.existsSync(path.join(env.metadata, "installed.json")), false);
});

test('una operación Microsoft impide arrancar o descargar mientras cambia la identidad',async t=>{const env=sandbox(t,manifest([entry('test.jar')]));vm.runInContext('microsoftOperationBusy=true',env.context);const result=await vm.runInContext('launchForge()',env.context);assert.equal(result.ok,false);assert.match(result.message,/Microsoft/);assert.equal(env.requests(),0);});

for (const version of ['0.1.6','0.1.10']) test('008 eliminación histórica ausente '+version, async t => {
 const doc=manifest([entry('new.jar')]);doc.version=version;doc.delete=['mods/old.jar'];
 const env=sandbox(t,doc);assert.equal((await env.run()).ok,true);
});
for (const approve of [true,false]) test('008 archivo desconocido consentimiento '+approve, async t => {
 const doc=manifest([entry('new.jar')]);doc.delete=['mods/personal.jar'];const env=sandbox(t,doc,{approve});
 fs.writeFileSync(path.join(env.instance,'mods/personal.jar'),'personal');
 if(!approve){await assert.rejects(env.run(),/cancelada/);assert.equal(fs.readFileSync(path.join(env.instance,'mods/personal.jar'),'utf8'),'personal');}
 else{await env.run();assert.equal(fs.existsSync(path.join(env.instance,'mods/personal.jar')),false);const dir=fs.readdirSync(env.metadata).find(n=>n.startsWith('update-backup-'));assert.equal(fs.readFileSync(path.join(env.metadata,dir,'1'),'utf8'),'personal');}
});
test('008 historial sobrevive saltos y verifica identidad',async t=>{
 const env=sandbox(t,manifest([entry('old.jar')]));await env.run();
 env.context.fixture=manifest([entry('new.jar')]);env.context.fixture.version='0.1.10';await env.run();
 fs.writeFileSync(path.join(env.instance,'mods/old.jar'),'new');env.context.fixture.delete=['mods/old.jar'];await env.run();assert.equal(fs.existsSync(path.join(env.instance,'mods/old.jar')),false);
});

test('008 actualización 0.1.6 a 0.1.10 conserva mundos y aparta mod alterado',async t=>{
 const first=manifest([entry('old.jar')]);first.version='0.1.6';const env=sandbox(t,first,{approve:true});await env.run();
 fs.writeFileSync(path.join(env.instance,'mods/old.jar'),'modificado');fs.mkdirSync(path.join(env.instance,'saves'),{recursive:true});fs.writeFileSync(path.join(env.instance,'saves/world'),'world');
 env.context.fixture=manifest([entry('new.jar')]);env.context.fixture.version='0.1.10';env.context.fixture.delete=['mods/old.jar','mods/already-removed.jar'];await env.run();
 assert.equal(fs.readFileSync(path.join(env.instance,'saves/world'),'utf8'),'world');assert.equal(fs.existsSync(path.join(env.instance,'mods/old.jar')),false);assert.equal(JSON.parse(fs.readFileSync(path.join(env.metadata,'installed.json'))).version,'0.1.10');
});
