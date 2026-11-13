"use strict";
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const runtime = require("./java17-runtime.json");
const allowedHosts = new Set(["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"]);
const pending = new Map();

function checkedDirectory(directory) {
  const result = path.resolve(directory);
  for (let here = result; ; here = path.dirname(here)) {
    try { if (fs.lstatSync(here).isSymbolicLink()) throw new Error("No se permite un enlace en la carpeta de Java: " + here); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (path.dirname(here) === here) break;
  }
  return result;
}
function runProcess(command, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let output = "", settled = false;
    const timer = setTimeout(() => { child.kill(); finish(new Error("Tiempo agotado preparando Java.")); }, timeout);
    function finish(error) {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) reject(error); else resolve(output);
    }
    child.stdout.on("data", chunk => { output = (output + chunk.toString()).slice(-16000); });
    child.stderr.on("data", chunk => { output = (output + chunk.toString()).slice(-16000); });
    child.on("error", finish);
    child.on("close", code => finish(code === 0 ? null : new Error(`Proceso terminó con código ${code}: ${output.slice(-1000)}`)));
  });
}
async function probeJava(java, major = 17) {
  const output = await runProcess(java, ["-XshowSettings:properties", "-version"]);
  if (!new RegExp('version\\s+"'+major+'(?:\\.|\")').test(output) || !/sun\.arch\.data\.model\s*=\s*64/.test(output)) throw new Error(`Se requiere Java ${major} de 64 bits.`);
  return java;
}
async function responseFor(url, redirects = 5, request = https.get) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !allowedHosts.has(parsed.hostname)) throw new Error("Fuente de Java no autorizada.");
  const response = await new Promise((resolve, reject) => {
    const req = request(parsed, { timeout: 30000, headers: { "User-Agent": "ChampagneLauncher/0.1" } }, resolve);
    req.on("timeout", () => req.destroy(new Error("Tiempo de descarga agotado.")));
    req.on("error", reject);
  });
  if ([301,302,303,307,308].includes(response.statusCode)) {
    response.resume();
    if (!redirects || !response.headers.location) throw new Error("Demasiadas redirecciones descargando Java.");
    return responseFor(new URL(response.headers.location, parsed).href, redirects - 1, request);
  }
  if (response.statusCode !== 200) { response.resume(); throw new Error("Descarga de Java fallida: HTTP " + response.statusCode); }
  return response;
}
async function downloadVerified({ url, destination, sha256, javaMajor = 17, status = () => {}, progress = () => {}, request }) {
  if (!/^[a-f0-9]{64}$/i.test(sha256)) throw new Error("SHA-256 de Java inválido.");
  const temp = destination + ".part";
  const response = await responseFor(url, 5, request);
  const expected = Number(response.headers["content-length"] || 0);
  const max = 120 * 1024 * 1024;
  if (expected > max) { response.destroy(); throw new Error("Java supera el tamaño de descarga permitido."); }
  const hash = crypto.createHash("sha256");
  let bytes = 0, last = 0; const started = Date.now();
  const meter = new Transform({ transform(chunk, encoding, done) {
    bytes += chunk.length;
    if (bytes > max) return done(new Error("Java supera el tamaño de descarga permitido."));
    hash.update(chunk);
    progress({ phase: "download", label: `Descargando Java ${javaMajor}`, bytes, totalBytes: expected, bytesPerSecond: bytes / Math.max((Date.now() - started) / 1000, 0.1) });
    if (Date.now() - last > 2000) {
      last = Date.now(); status(`Descargando Java ${javaMajor}: ${Math.floor(bytes / 1048576)} MiB${expected ? " de " + Math.ceil(expected / 1048576) : ""}…`);
    }
    done(null, chunk);
  } });
  const timer = setTimeout(() => response.destroy(new Error("Se agotó el tiempo total descargando Java.")), 10 * 60 * 1000);
  try {
    await pipeline(response, meter, fs.createWriteStream(temp, { flags: "wx" }));
    if ((expected && expected !== bytes) || hash.digest("hex") !== sha256.toLowerCase()) throw new Error("La descarga de Java no coincide con su SHA-256 o tamaño.");
    fs.renameSync(temp, destination);
  } finally { clearTimeout(timer); try { fs.unlinkSync(temp); } catch {} }
}
async function ensureJava17({ runtimeDir, configuredJava, javaMajor = 17, runtimeSpec = runtime, status = () => {}, progress = () => {}, probe = java => probeJava(java, javaMajor), download = downloadVerified, extract = extractArchive, checkSpace = requireJavaSpace }) {
  const runtime = runtimeSpec;
  const directory = checkedDirectory(runtimeDir);
  const pendingKey = directory + ':' + javaMajor;
  if (pending.has(pendingKey)) return pending.get(pendingKey);
  const promise = (async () => {
    const installed = path.join(directory, runtime.directory);
    const managed = path.join(installed, "bin", "java.exe");
    for (const candidate of [...new Set([configuredJava, managed, "java"].filter(Boolean))]) {
      try { if (candidate === managed) checkedDirectory(path.dirname(managed)); await probe(candidate); status(`Java ${javaMajor} de 64 bits listo.`, "success"); return candidate; }
      catch {}
    }
    if (process.platform !== "win32" || process.arch !== "x64") throw new Error("La descarga automática de Java está preparada para Windows de 64 bits.");
    fs.mkdirSync(directory, { recursive: true });
    checkSpace(directory);
    const stage = fs.mkdtempSync(path.join(directory, "java-stage-"));
    let backup = null;
    try {
      status(`Preparando Java ${javaMajor} portátil. No necesitas instalarlo en Windows…`);
      const archive = path.join(stage, "java.zip");
      await download({ url: runtime.url, destination: archive, sha256: runtime.sha256, javaMajor, status, progress });
      const unpack = path.join(stage, "unpack");
      await extract(archive, unpack);
      const roots = fs.readdirSync(unpack, { withFileTypes: true }).filter(entry => entry.isDirectory());
      if (roots.length !== 1) throw new Error("El ZIP de Java no tiene la estructura esperada.");
      const root = path.join(unpack, roots[0].name);
      await probe(path.join(root, "bin", "java.exe"));
      const release = fs.readFileSync(path.join(root, "release"), "utf8");
      const actualVersion = /^JAVA_RUNTIME_VERSION="([^"]+)"\r?$/m.exec(release)?.[1];
      if (![runtime.version,runtime.version+'-LTS'].includes(actualVersion)) throw new Error("La versión extraída de Java no coincide con la versión fijada.");
      if (fs.existsSync(installed)) {
        backup = fs.mkdtempSync(path.join(directory, "java-backup-"));
        fs.renameSync(installed, path.join(backup, "runtime"));
      }
      try { fs.renameSync(root, installed); }
      catch (error) { if (backup) fs.renameSync(path.join(backup, "runtime"), installed); throw error; }
      status(`Java ${javaMajor} portátil instalado y verificado.`, "success");
      return managed;
    } finally {
      const relative = path.relative(directory, stage);
      if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) fs.rmSync(stage, { recursive: true, force: true });
    }
  })();
  pending.set(pendingKey, promise);
  try { return await promise; } finally { pending.delete(pendingKey); }
}
function requireJavaSpace(directory) {
  if (typeof fs.statfsSync !== "function") return;
  const disk = fs.statfsSync(directory, { bigint: true });
  if (disk.bavail * disk.bsize < 600n * 1024n * 1024n) throw new Error("Se necesitan al menos 600 MiB libres para preparar Java.");
}
function extractArchive(archive, destination) {
  // PowerShell necesita un archivo real; el sistema virtual ASAR solo lo lee Electron.
  const script = path.join(__dirname, "extract-java.ps1").replace(/\.asar([\\/])/, ".asar.unpacked$1");
  return runProcess("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, archive, destination], 120000);
}
module.exports = { ensureJava17, probeJava, downloadVerified, extractArchive };
