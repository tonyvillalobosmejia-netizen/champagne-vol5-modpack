"use strict";
// Empaqueta overrides de una instancia/exportación de CurseForge para uso del
// launcher. No copia mods/JAR ni datos personales; no publica ni sube archivos.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validatePath, MANAGED_ROOTS, MAX_FILE_BYTES, MAX_TOTAL_BYTES } = require("../src/champagne-config-sync");

function sha256(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!["--source", "--output", "--version"].includes(key) || !args[i + 1] || args[i + 1].startsWith("--")) {
      throw new Error("Uso: node tools/crear-paquete-curseforge.js --source <perfil> --output <destino> --version <x.y.z>");
    }
    result[key.slice(2)] = args[++i];
  }
  if (!result.source || !result.output || !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(result.version || "")) {
    throw new Error("Indica --source, --output y una versión válida, por ejemplo 0.1.1.");
  }
  return result;
}
function inside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
function collect(sourceRoot) {
  const files = [];
  const names = new Set();
  let totalBytes = 0;
  function walk(directory, prefix) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = `${prefix}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error("No se empaquetan enlaces simbólicos: " + relative);
      if (entry.isDirectory()) { walk(absolute, relative); continue; }
      if (!entry.isFile()) continue;
      // CurseForge puede dejar marcadores de descarga; no son shaders utilizables.
      if (prefix === "shaderpacks" && /\.zip\.txt$/i.test(entry.name)) continue;
      validatePath(relative);
      const key = relative.toLowerCase();
      if (names.has(key)) throw new Error("Ruta duplicada en Windows: " + relative);
      names.add(key);
      const size = fs.statSync(absolute).size;
      if (size > MAX_FILE_BYTES) throw new Error("Archivo demasiado grande (máximo 128 MiB): " + relative);
      totalBytes += size;
      if (totalBytes > MAX_TOTAL_BYTES) throw new Error("El contenido del perfil supera 512 MiB.");
      const bytes = fs.readFileSync(absolute);
      files.push({ path: relative, bytes, sha256: sha256(bytes) });
    }
  }
  for (const root of [...MANAGED_ROOTS].sort()) {
    const directory = path.join(sourceRoot, root);
    if (!fs.existsSync(directory)) continue;
    const stat = fs.lstatSync(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Carpeta fuente inválida: " + root);
    walk(directory, root);
  }
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));
  return files;
}
function buildPackage({ source, output, version }) {
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(version || "")) throw new Error("Versión de contenido inválida.");
  const profileRoot = path.resolve(source);
  const outputRoot = path.resolve(output);
  if (!fs.existsSync(profileRoot) || !fs.statSync(profileRoot).isDirectory()) throw new Error("No existe la carpeta fuente del perfil: " + profileRoot);
  // Acepta tanto la carpeta directa de la instancia como la carpeta overrides
  // de un ZIP exportado por CurseForge.
  const overridesRoot = path.join(profileRoot, "overrides");
  const sourceRoot = fs.existsSync(overridesRoot) && fs.statSync(overridesRoot).isDirectory() ? overridesRoot : profileRoot;
  if (inside(profileRoot, outputRoot) || inside(outputRoot, profileRoot)) throw new Error("La carpeta de salida debe estar separada del perfil de CurseForge.");
  const files = collect(sourceRoot);
  if (!files.length) throw new Error("No se encontraron archivos en las carpetas administradas.");
  fs.mkdirSync(outputRoot, { recursive: true });
  const bundle = path.join(outputRoot, "champagne-content");
  if (fs.existsSync(bundle)) throw new Error("Ya existe champagne-content en el destino. Usa una carpeta de salida vacía para evitar mezclar versiones.");
  fs.mkdirSync(path.join(bundle, "files"), { recursive: true });
  try {
    for (const file of files) {
      const dest = path.join(bundle, "files", ...file.path.split("/"));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, file.bytes, { flag: "wx" });
    }
    const manifest = {
      packId: "champagne-vol5",
      version,
      generatedAt: new Date().toISOString(),
      source: sourceRoot === overridesRoot ? "CurseForge export overrides" : "CurseForge profile folders",
      expectedFiles: files.length,
      files: files.map(({ path: filePath, bytes, sha256: digest }) => ({ path: filePath, bytes: bytes.length, sha256: digest }))
    };
    fs.writeFileSync(path.join(bundle, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
    return { bundle, count: files.length, manifest };
  } catch (error) {
    fs.rmSync(bundle, { recursive: true, force: true });
    throw error;
  }
}

if (require.main === module) {
  try {
    const result = buildPackage(parseArgs(process.argv.slice(2)));
    console.log(`Paquete local creado: ${result.count} archivo(s) en ${result.bundle}`);
    console.log("No se incluyeron mods/JAR, saves, options.txt, cuentas, logs ni capturas. No se publicó nada.");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { buildPackage, collect, parseArgs };
