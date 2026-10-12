"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { checkedModTarget, validateModPathSets } = require("./champagne-update-paths");
const LIMIT = 128 * 1024 * 1024;
const digest = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

function validateAcquisition(entry) {
  if (!entry || !/^[a-f0-9]{64}$/i.test(entry.sha256 || "")) throw new Error("SHA-256 de mod inválido.");
  if (entry.acquisition === "user_official_download") {
    const url = new URL(entry.pageUrl);
    if (entry.url !== undefined || url.origin !== "https://www.curseforge.com" ||
        !/^\/minecraft\/mc-mods\/[a-z0-9-]+\/files\/[1-9][0-9]*$/.test(url.pathname) ||
        url.search || url.hash || url.username || url.password) throw new Error("Página oficial de descarga inválida.");
    return "manual";
  }
  if (entry.acquisition !== undefined && entry.acquisition !== "official_direct") throw new Error("Método de descarga desconocido.");
  const url = new URL(entry.url);
  if (url.protocol !== "https:" || url.username || url.password || url.hash) throw new Error("La descarga requiere una URL HTTPS válida.");
  return "direct";
}
function validateAssistedManifest(manifest) {
  if (manifest?.packId !== "champagne-vol5" || typeof manifest.version !== "string" ||
      !/^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/.test(manifest.version) ||
      !Number.isSafeInteger(manifest.expectedFiles) || manifest.expectedFiles < 1 || manifest.expectedFiles > 500 ||
      !Array.isArray(manifest.files) || manifest.files.length !== manifest.expectedFiles) throw new Error("Manifiesto incompleto o incorrecto.");
  validateModPathSets(manifest.files, manifest.delete === undefined ? [] : manifest.delete);
  manifest.files.forEach(validateAcquisition);
  return manifest;
}
function readRegular(file) {
  const info = fs.lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > LIMIT) throw new Error("Selecciona un archivo JAR normal de hasta 128 MB.");
  const bytes = fs.readFileSync(file);
  if (bytes.length > LIMIT) throw new Error("El archivo supera 128 MB.");
  return bytes;
}
function createManualDownloads({ manifest, instanceDir, cacheDir }) {
  validateAssistedManifest(manifest);
  const manual = manifest.files.filter(e => validateAcquisition(e) === "manual");
  const cacheTarget = entry => checkedModTarget(cacheDir, `mods/${entry.sha256.toLowerCase()}.jar`);
  const matches = (file, entry) => {
    try { return digest(readRegular(file)) === entry.sha256.toLowerCase(); }
    catch (error) { if (error.code === "ENOENT") return false; throw error; }
  };
  function pending() {
    return manual.filter(entry => !matches(checkedModTarget(instanceDir, entry.path), entry) && !matches(cacheTarget(entry), entry))
      .map(entry => ({ path: entry.path, name: entry.path.slice(5), pageUrl: entry.pageUrl }));
  }
  function importFiles(paths) {
    if (!Array.isArray(paths) || paths.length > 500) throw new Error("Selección de archivos inválida.");
    const accepted = [], rejected = [];
    for (const file of paths) {
      try {
        if (typeof file !== "string" || path.extname(file).toLowerCase() !== ".jar") throw new Error("Selecciona un JAR.");
        const bytes = readRegular(file), hash = digest(bytes);
        const entry = manual.find(e => e.sha256.toLowerCase() === hash);
        if (!entry) throw new Error("No coincide con ninguna versión pendiente del modpack.");
        const target = cacheTarget(entry);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        // Archivo temporal exclusivo; nunca se modifica la instancia durante la importación.
        const temporary = path.join(path.dirname(target), crypto.randomUUID() + ".tmp");
        try {
          fs.writeFileSync(temporary, bytes, { flag: "wx" });
          checkedModTarget(cacheDir, `mods/${hash}.jar`);
          fs.renameSync(temporary, target);
        } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
        accepted.push(entry.path);
      } catch (error) { rejected.push({ name: path.basename(String(file)), message: error.message }); }
    }
    return { accepted, rejected, missing: pending() };
  }
  function read(entry) {
    const known = manual.find(e => e.path === entry.path && e.sha256 === entry.sha256);
    if (!known) throw new Error("Mod de descarga manual desconocido.");
    const bytes = readRegular(cacheTarget(known));
    if (digest(bytes) !== known.sha256.toLowerCase()) throw new Error(`SHA-256 incorrecto para ${known.path}. Importa de nuevo el archivo oficial.`);
    return bytes;
  }
  return { pending, importFiles, read };
}
module.exports = { validateAcquisition, validateAssistedManifest, createManualDownloads };
