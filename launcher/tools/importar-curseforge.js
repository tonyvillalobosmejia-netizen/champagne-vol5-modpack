"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { buildPackage } = require("./crear-paquete-curseforge");
const { syncBundledConfigs } = require("../src/champagne-config-sync");

function importProfile({ projectRoot, source, version }) {
  const project = path.resolve(projectRoot);
  const admin = path.join(project, ".champagne-admin");
  fs.mkdirSync(admin, { recursive: true });
  const stage = fs.mkdtempSync(path.join(admin, "import-stage-"));
  const defaults = path.join(project, "src", "champagne-defaults");
  let backup = null;
  try {
    const result = buildPackage({ source, output: stage, version });
    // Verifica todos los bytes y las rutas con el mismo consumidor del launcher.
    syncBundledConfigs({ instanceDir: path.join(stage, "test-client"), metadataDir: path.join(stage, "test-metadata"), bundleDir: result.bundle });
    if (fs.existsSync(defaults)) {
      if (fs.lstatSync(defaults).isSymbolicLink()) throw new Error("La carpeta de defaults no puede ser un enlace.");
      const backups = path.join(admin, "backups");
      fs.mkdirSync(backups, { recursive: true });
      backup = fs.mkdtempSync(path.join(backups, "content-"));
      fs.renameSync(defaults, path.join(backup, "champagne-defaults"));
    }
    try { fs.renameSync(result.bundle, defaults); }
    catch (error) {
      if (backup) fs.renameSync(path.join(backup, "champagne-defaults"), defaults);
      throw error;
    }
    return { version, count: result.count, bundle: defaults, backup, roots: [...new Set(result.manifest.files.map(file => file.path.split("/")[0]))] };
  } finally {
    const relative = path.relative(admin, stage);
    if (!relative.startsWith("..") && !path.isAbsolute(relative)) fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    const projectRoot = path.resolve(__dirname, "..");
    let source, version;
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i += 2) {
      if (!["--source", "--version"].includes(args[i]) || !args[i + 1]) throw new Error("Uso: npm run importar-curseforge -- --version 0.1.1 [--source carpeta]");
      if (args[i] === "--source") source = args[i + 1];
      else version = args[i + 1];
    }
    if (!source) source = JSON.parse(fs.readFileSync(path.join(__dirname, "curseforge-local.json"), "utf8")).source;
    const result = importProfile({ projectRoot, source, version });
    console.log(`Contenido ${version} importado: ${result.count} archivos (${result.roots.join(", ")}).`);
    console.log(`Destino: ${result.bundle}`);
    console.log(`Respaldo: ${result.backup || "no había contenido previo"}`);
    console.log("El launcher aplicará estos defaults al pulsar JUGAR. Los archivos personales modificados se conservan. No se ha publicado ni activado ninguna descarga remota.");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { importProfile };
