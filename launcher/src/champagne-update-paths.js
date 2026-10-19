"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { validateFileName } = require("./champagne-file-names");

function modPathKey(relative) {
  if (typeof relative !== "string" ||
      !/^mods\/[^/\\]+\.jar$/i.test(relative)) {
    throw new Error("Ruta de mod no permitida: " + String(relative));
  }
  const name = relative.slice(5);
  validateFileName(name);
  if (name.length === 4) throw new Error("El mod necesita un nombre antes de .jar.");
  return relative.toLowerCase();
}

function checkedModTarget(instanceDir, relative) {
  modPathKey(relative);
  const root = path.resolve(instanceDir);
  const target = path.resolve(root, ...relative.split("/"));
  const diff = path.relative(root, target);
  if (!diff || diff === ".." || diff.startsWith(".." + path.sep) || path.isAbsolute(diff)) {
    throw new Error("Ruta fuera de la instancia: " + relative);
  }
  // Incluye los padres: una junction en instances/principal también redirige.
  for (let here = target; ; here = path.dirname(here)) {
    try {
      if (fs.lstatSync(here).isSymbolicLink()) {
        throw new Error("Enlace simbólico o junction bloqueado: " + here);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (path.dirname(here) === here) break;
  }
  return target;
}

function validateModPathSets(files, deletions, previousFiles = {}) {
  if (!Array.isArray(files) || !Array.isArray(deletions)) {
    throw new Error("Lista de archivos o eliminaciones inválida.");
  }
  const desired = new Set();
  for (const entry of files) {
    const key = modPathKey(entry?.path);
    if (desired.has(key)) throw new Error("Nombre de mod duplicado en Windows: " + entry.path);
    desired.add(key);
  }
  const removed = new Set();
  for (const relative of deletions) {
    const key = modPathKey(relative);
    if (desired.has(key) || removed.has(key)) {
      throw new Error("Eliminación duplicada o en conflicto: " + relative);
    }
    removed.add(key);
  }
  const prior = new Set();
  const exactDesired = new Set(files.map(entry => entry.path));
  for (const [relative, hash] of Object.entries(previousFiles)) {
    const key = modPathKey(relative);
    if (prior.has(key) || !/^[a-f0-9]{64}$/i.test(hash || "")) {
      throw new Error("Estado anterior de mods inválido: " + relative);
    }
    if (desired.has(key) && !exactDesired.has(relative)) {
      throw new Error("Cambio de mayúsculas ambiguo: " + relative);
    }
    prior.add(key);
  }
}

module.exports = { modPathKey, checkedModTarget, validateModPathSets };
