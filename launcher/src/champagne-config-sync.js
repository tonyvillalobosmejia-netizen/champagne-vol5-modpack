"use strict";
/* Champagne Vol.5 — Configuraciones locales administradas por el launcher.
   Crea configuraciones ausentes; solo cambia/elimina las previamente gestionadas
   y SIN modificaciones del jugador. Nunca toca options.txt, saves ni mods. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validateFileName } = require("./champagne-file-names");
function sha256(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function fileHash(p) { return sha256(fs.readFileSync(p)); }
function ensureDirectory(p) { fs.mkdirSync(p, { recursive: true }); }
function writeAtomic(dest, bytes) {
  ensureDirectory(path.dirname(dest));
  const temp = dest + ".champagne-tmp-" + crypto.randomBytes(5).toString("hex");
  try { fs.writeFileSync(temp, bytes, { flag: "wx" }); fs.renameSync(temp, dest); }
  finally { try { fs.unlinkSync(temp); } catch {} }
}
const MANAGED_ROOTS = new Set(["config", "defaultconfigs", "resourcepacks", "shaderpacks", "kubejs", "scripts", "global_packs", "openloader", "fancymenu"]);
const MAX_FILE_BYTES = 128 * 1024 * 1024;
const MAX_TOTAL_BYTES = 512 * 1024 * 1024;
const MAX_CONTENT_FILES = 2000;
function validatePath(relative) {
  const parts = typeof relative === "string" ? relative.split("/") : [];
  const root = parts[0];
  if (typeof relative !== "string" || !MANAGED_ROOTS.has(root) || parts.length < 2 ||
      /[<>:"|?*\x00-\x1f]/.test(relative) ||
      parts.some(part => !part || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) ||
      /\.jar$/i.test(relative) ||
      relative.includes("\\") || relative.includes("//") || relative.split("/").some(x => x === "." || x === "..") ||
      relative.includes(":")) {
    throw new Error("Ruta de contenido del modpack no permitida: " + String(relative));
  }
  for (const part of parts) validateFileName(part);
  return relative;
}
function checkedTarget(instanceDir, relative) {
  validatePath(relative);
  const target = path.resolve(instanceDir, ...relative.split("/"));
  const diff = path.relative(instanceDir, target);
  if (!diff || diff === ".." || diff.startsWith(".." + path.sep) || path.isAbsolute(diff)) throw new Error("Ruta fuera de instancia: " + relative);
  for (let here = path.resolve(instanceDir); ; here = path.dirname(here)) {
    try { if (fs.lstatSync(here).isSymbolicLink()) throw new Error("Enlace simbólico bloqueado: " + here); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (path.dirname(here) === here) break;
  }
  // No seguir enlaces simbólicos/junctions hacia directorios ajenos al launcher.
  for (let here = instanceDir, parts = relative.split("/"), i = 0; i < parts.length; i++) {
    here = path.join(here, parts[i]);
    try { if (fs.lstatSync(here).isSymbolicLink()) throw new Error("Enlace simbólico bloqueado: " + relative); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return target;
}
function readState(file) {
  if (!fs.existsSync(file)) return { files: {} };
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value.packId||"") || !value.files || typeof value.files !== "object" || Array.isArray(value.files)) {
    throw new Error("Estado previo de configuraciones inválido; se bloqueó la sincronización.");
  }
  for (const [name, hash] of Object.entries(value.files)) {
    validatePath(name);
    if (!/^[a-f0-9]{64}$/i.test(hash)) throw new Error("Hash previo inválido: " + name);
  }
  return value;
}
function syncBundledConfigs({ instanceDir, metadataDir, bundleDir, status = () => {} }) {
  if (!instanceDir || !metadataDir || !bundleDir) throw new Error("Faltan rutas de sincronización.");
  const manifest = JSON.parse(fs.readFileSync(path.join(bundleDir, "manifest.json"), "utf8"));
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(manifest.packId||"") || !/^\d+\.\d+\.\d+/.test(manifest.version || "") ||
      !Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_CONTENT_FILES) {
    throw new Error("Manifiesto de configuraciones inválido.");
  }
  const desired = new Map(), seen = new Set();
  let totalBytes = 0;
  for (const item of manifest.files) {
    if (!item || !Number.isSafeInteger(item.bytes) || item.bytes < 0 || item.bytes > MAX_FILE_BYTES ||
        !/^[a-f0-9]{64}$/i.test(item.sha256 || "")) throw new Error("Archivo o hash de configuración inválido.");
    validatePath(item.path);
    totalBytes += item.bytes;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error("El contenido del modpack supera 512 MiB.");
    const key = item.path.toLowerCase();
    if (seen.has(key)) throw new Error("Ruta duplicada en configuraciones: " + item.path);
    seen.add(key);
    const bundled = checkedTarget(path.join(bundleDir, "files"), item.path);
    const bytes = fs.readFileSync(bundled);
    if (bytes.length !== item.bytes || sha256(bytes) !== item.sha256.toLowerCase()) {
      throw new Error("Configuración empaquetada no coincide con SHA-256: " + item.path);
    }
    desired.set(item.path, { hash: item.sha256.toLowerCase(), bytes });
  }
  ensureDirectory(instanceDir);ensureDirectory(metadataDir);
  const statePath = path.join(metadataDir, "managed-client-config.json");
  const previous = readState(statePath);
  if(previous.packId&&previous.packId!==manifest.packId)throw Error("El estado de configuraciones pertenece a otro modpack.");
  const next = { packId: manifest.packId, version: manifest.version, files: {} };
  const changes = [], report = { installed:0, updated:0, removed:0, keptModified:0, keptUnmanaged:0, unchanged:0, backupDir:null };
  for (const [name, item] of desired) {
    const target = checkedTarget(instanceDir, name);
    const oldHash = previous.files[name];
    if (!fs.existsSync(target)) {
      changes.push({ name, target, bytes:item.bytes, action:"installed" });
      next.files[name] = item.hash;
      continue;
    }
    if (!fs.statSync(target).isFile()) throw new Error("Configuración no es archivo: " + name);
    const currentHash = fileHash(target);
    if (currentHash === item.hash) {
      // Se puede administrar un archivo existente SOLO si coincide exactamente con el empaquetado.
      next.files[name] = item.hash;
      report.unchanged++;
    } else if (oldHash && currentHash === oldHash) {
      changes.push({ name, target, bytes:item.bytes, action:"updated" });
      next.files[name] = item.hash;
    } else {
      // Modificación local o archivo que no instaló el launcher: intacto.
      if (oldHash) { next.files[name] = oldHash; report.keptModified++; }
      else report.keptUnmanaged++;
    }
  }
  for (const [name, hash] of Object.entries(previous.files)) {
    if (desired.has(name)) continue;
    const target = checkedTarget(instanceDir, name);
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      if (fileHash(target) === hash) changes.push({ name, target, action:"removed" });
      else report.keptModified++;
    }
  }
  // Validar todas las entradas y preparar copias antes de modificar un solo archivo.
  const backups = [];
  let backupDir = null;
  if (changes.length) {
    backupDir = fs.mkdtempSync(path.join(metadataDir, "config-backup-"));
    report.backupDir = backupDir;
  }
  try {
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const backup = fs.existsSync(change.target) ? path.join(backupDir, `${i}.bak`) : null;
      if (backup) fs.copyFileSync(change.target, backup);
      backups.push({ target:change.target, backup });
      if (change.action === "removed") fs.unlinkSync(change.target);
      else writeAtomic(change.target, change.bytes);
      report[change.action]++;
    }
    writeAtomic(statePath, Buffer.from(JSON.stringify(next, null, 2) + "\n", "utf8"));
  } catch (error) {
    for (const item of backups.reverse()) {
      try {
        if (item.backup) fs.copyFileSync(item.backup, item.target);
        else if (fs.existsSync(item.target)) fs.unlinkSync(item.target);
      } catch (restoreError) { status("No se pudo restaurar " + item.target + ": " + restoreError.message, "error"); }
    }
    throw error;
  }
  status(`Configuraciones cliente ${manifest.version}: ${report.installed} nuevas, ${report.updated} actualizadas, ${report.removed} retiradas, ${report.keptModified + report.keptUnmanaged} personales conservadas.`, "success");
  return report;
}
module.exports = { syncBundledConfigs, validatePath, checkedTarget, MANAGED_ROOTS, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_CONTENT_FILES };
