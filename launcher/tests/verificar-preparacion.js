"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { Readable } = require("node:stream");
const { EventEmitter } = require("node:events");
const { createPreparation } = require("../src/champagne-preparation");
const { ensureJava17, downloadVerified, extractArchive } = require("../src/champagne-runtime");
const descriptor = require("../src/java17-runtime.json");
test("Java 21 portátil acepta el sufijo LTS oficial y usa su propia carpeta", async t => {
  const runtimeDir=fs.mkdtempSync(path.join(os.tmpdir(),'champagne-java21-test-'));
  t.after(()=>fs.rmSync(runtimeDir,{recursive:true,force:true}));
  const spec=require('../src/java21-runtime.json');let major;
  const java=await ensureJava17({runtimeDir,javaMajor:21,runtimeSpec:spec,checkSpace:()=>{},
    probe:async candidate=>{if(!fs.existsSync(candidate))throw new Error('no Java');},
    download:async options=>{major=options.javaMajor;},
    extract:async(_archive,dest)=>{const root=path.join(dest,'java');fs.mkdirSync(path.join(root,'bin'),{recursive:true});fs.writeFileSync(path.join(root,'bin/java.exe'),'fixture');fs.writeFileSync(path.join(root,'release'),`JAVA_RUNTIME_VERSION="${spec.version}-LTS"\n`);}});
  assert.equal(major,21);assert.equal(java,path.join(runtimeDir,spec.directory,'bin/java.exe'));
});

test("Java empaquetado extrae con el script externo al ASAR", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "champagne-packaged-java-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const realScripts = path.join(root, "app.asar.unpacked", "src");
  fs.mkdirSync(realScripts, { recursive: true });
  fs.copyFileSync(path.join(__dirname, "../src/extract-java.ps1"), path.join(realScripts, "extract-java.ps1"));
  const archive = path.join(root, "fixture.zip");
  const builder = path.join(root, "fixture.ps1");
  fs.writeFileSync(builder, 'param([string]$Target)\n$ErrorActionPreference="Stop"\nAdd-Type -AssemblyName System.IO.Compression\nAdd-Type -AssemblyName System.IO.Compression.FileSystem\n$z=[IO.Compression.ZipFile]::Open($Target,[IO.Compression.ZipArchiveMode]::Create)\n$e=$z.CreateEntry("java/bin/fixture.txt")\n$w=[IO.StreamWriter]::new($e.Open())\n$w.Write("verified")\n$w.Dispose()\n$z.Dispose()\n');
  require("node:child_process").execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", builder, archive], { windowsHide: true });
  const vm = require("node:vm");
  const exported = { exports: {} };
  const context = vm.createContext({ module: exported, require: name => name === "./java17-runtime.json" ? descriptor : require(name),
    __dirname: path.join(root, "app.asar", "src"), process, Buffer, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/champagne-runtime.js"), "utf8"), context);
  await exported.exports.extractArchive(archive, path.join(root, "result"));
  assert.equal(fs.readFileSync(path.join(root, "result/java/bin/fixture.txt"), "utf8"), "verified");
});
test("la extracción de Java bloquea rutas ZIP fuera del destino", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "champagne-zip-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const archive = path.join(root, "hostile.zip");
  const script = path.join(root, "fixture.ps1");
  fs.writeFileSync(script, 'param([string]$Target)\n$ErrorActionPreference="Stop"\nAdd-Type -AssemblyName System.IO.Compression\nAdd-Type -AssemblyName System.IO.Compression.FileSystem\n$z=[IO.Compression.ZipFile]::Open($Target,[IO.Compression.ZipArchiveMode]::Create)\n$e=$z.CreateEntry("../escape.txt")\n$w=[IO.StreamWriter]::new($e.Open())\n$w.Write("escape")\n$w.Dispose()\n$z.Dispose()\n');
  require("node:child_process").execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, archive], { windowsHide: true });
  await assert.rejects(extractArchive(archive, path.join(root, "unpack")), /ZIP no permitida/);
  assert.equal(fs.existsSync(path.join(root, "escape.txt")), false);
});
function fixture(overrides = {}) {
  let ready = false;
  const calls = [];
  const preparation = createPreparation({
    ensureJava: async () => calls.push("java"), isReady: () => ready,
    downloadGame: async () => calls.push("vanilla"), needsForgeInstall: () => true,
    installForge: async () => calls.push("forge"),
    prepareNatives: async () => { calls.push("natives"); ready = true; }, ...overrides
  });
  return { calls, preparation };
}
test("primera preparación ejecuta Java, vanilla, Forge y nativos en orden", async () => {
  const f = fixture();
  assert.equal((await f.preparation.prepare()).ok, true);
  assert.deepEqual(f.calls, ["java", "vanilla", "forge", "natives"]);
});
test("JUGAR y la preparación inicial comparten una sola operación", async () => {
  const f = fixture();
  const first = f.preparation.prepare();
  assert.equal(f.preparation.prepare(), first);
  await first;
  assert.equal(f.preparation.busy, false);
  assert.equal(f.calls.filter(x => x === "forge").length, 1);
});
test("instalación lista funciona sin descargas; no reinstala Forge", async () => {
  const f = fixture({ isReady: () => true });
  await f.preparation.prepare();
  assert.deepEqual(f.calls, ["java"]);
});
test("error permite reintentar y nunca declara listo un juego incompleto", async () => {
  let failed = false;
  const f = fixture({ downloadGame: async () => { if (!failed) { failed = true; throw new Error("sin red"); } } });
  await assert.rejects(f.preparation.prepare(), /sin red/);
  assert.equal(f.preparation.busy, false);
  assert.equal((await f.preparation.prepare()).ok, true);
  const incomplete = fixture({ isReady: () => false });
  await assert.rejects(incomplete.preparation.prepare(), /incompleta/);
});
test("no prepara mientras Minecraft o una actualización están ocupados", async () => {
  const f = fixture({ otherBusy: () => true });
  await assert.rejects(f.preparation.prepare(), /operación/);
  assert.deepEqual(f.calls, []);
});
function fakeRequest(bytes, interrupted = false) {
  return (_url, _options, callback) => {
    const request = new EventEmitter();
    setImmediate(() => {
      const response = Readable.from((async function* () { yield bytes; if (interrupted) throw new Error("conexión cortada"); })());
      response.statusCode = 200; response.headers = { "content-length": String(bytes.length) };
      callback(response);
    });
    return request;
  };
}
test("descarga verifica SHA-256 y conserva la anterior si hay corrupción o interrupción", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "champagne-download-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, "java.zip"), bytes = Buffer.from("java zip bytes");
  fs.writeFileSync(destination, "previous");
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const options = { url: descriptor.url, destination, sha256, request: fakeRequest(bytes) };
  await assert.rejects(downloadVerified({ ...options, sha256: "0".repeat(64) }), /SHA-256/);
  assert.equal(fs.readFileSync(destination, "utf8"), "previous");
  await assert.rejects(downloadVerified({ ...options, request: fakeRequest(bytes, true) }), /cortada/);
  assert.equal(fs.existsSync(destination + ".part"), false);
  await downloadVerified(options);
  assert.deepEqual(fs.readFileSync(destination), bytes);
});
test("rechaza una fuente de Java ajena a los hosts oficiales", async () => {
  await assert.rejects(downloadVerified({ url: "https://example.invalid/java.zip", destination: "unused", sha256: "0".repeat(64) }), /autorizada/);
});
test("sin Java del sistema instala copia propia y la reutiliza; fallo conserva copia anterior", async t => {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), "champagne-java-test-"));
  t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
  let downloads = 0;
  const options = {
    runtimeDir,
    checkSpace: () => {},
    probe: async java => { if (java === "java" || !fs.existsSync(java)) throw new Error("no java"); return java; },
    download: async () => { downloads++; },
    extract: async (_archive, unpack) => {
      fs.mkdirSync(path.join(unpack, "jre", "bin"), { recursive: true });
      fs.writeFileSync(path.join(unpack, "jre", "bin", "java.exe"), "fake fixture only");
      fs.writeFileSync(path.join(unpack, "jre", "release"), `JAVA_RUNTIME_VERSION="${descriptor.version}"`);
    }
  };
  const installed = await ensureJava17(options);
  assert.ok(fs.existsSync(installed));
  assert.equal(await ensureJava17(options), installed);
  assert.equal(downloads, 1);
  await assert.rejects(ensureJava17({ ...options, probe: async () => { throw new Error("invalid"); }, download: async () => { throw new Error("network fail"); } }), /network fail/);
  assert.equal(fs.readFileSync(installed, "utf8"), "fake fixture only");
});
test("falta de espacio bloquea la descarga y permite volver a intentar", async t => {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), "champagne-space-test-"));
  t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
  let downloads = 0;
  await assert.rejects(ensureJava17({ runtimeDir, probe: async () => { throw new Error("no java"); },
    checkSpace: () => { throw new Error("sin espacio"); }, download: async () => { downloads++; }
  }), /sin espacio/);
  assert.equal(downloads, 0);
});
test("JUGAR espera preparación y dos clics no generan dos procesos Java", async t => {
  const vm = require("node:vm");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "champagne-launch-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  let releaseJava, starts = 0;
  const javaReady = new Promise(resolve => { releaseJava = resolve; });
  const children = [];
  const context = vm.createContext({
    require: name => {
      if (name === "electron") return { app: { getPath: () => root, whenReady: () => ({ then() {} }), on() {} }, BrowserWindow: { getAllWindows: () => [] }, ipcMain: {}, shell: {} };
      if (name === "./config") return {...require("../src/config"),catalogEnabled:false};
      if (name === "./champagne-runtime") return { ensureJava17: async () => { await javaReady; return "test-java"; } };
      if (name === "./champagne-preparation") return { createPreparation: options => createPreparation({ ...options, isReady: () => true }) };
      if (name === "./champagne-config-sync") return { syncBundledConfigs: () => {} };
      // Aislar la preparación con una cuenta autorizada, sin llamar al servicio real.
      if (name === "./champagne-auth") return { createAuthClient: () => ({
        status: () => ({provider:"discord",required:true,user:{username:"Tester"}}),
        verifiedUsername: async () => "Tester"
      }) };
      if (name === "node:child_process") return { spawn: () => {
        starts++; const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.pid = 123;
        children.push(child); setImmediate(() => child.emit("spawn")); return child;
      } };
      if (name.startsWith("./")) return require(path.join(__dirname, "../src", name));
      return require(name);
    }, process, Buffer, console, __dirname: path.resolve(__dirname, "../src")
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/main.js"), "utf8"), context);
  vm.runInContext('prepareSelectedGame=async()=>{await automaticPreparation.prepare();return null;};verifyPackBeforePlay=async()=>({ok:true});getLocalProfile=()=>({username:"Tester"});localGameReady=()=>true;checkJava17=async()=>{};buildForgeLaunch=()=>({java:"test-java",args:[],ramMB:2048,classpathCount:1});', context);
  const first = vm.runInContext("launchForge()", context), second = vm.runInContext("launchForge()", context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(starts, 0);
  releaseJava();
  const results = await Promise.all([first, second]);
  assert.equal(starts, 1);
  assert.equal(results.filter(result => result.ok).length, 1);
  children[0].emit("close", 0);
  await new Promise(resolve => setTimeout(resolve, 30));
});
