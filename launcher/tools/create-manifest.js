// Uso: node tools/create-manifest.js "C:\ruta\cliente-limpio" "https://descargas.tudominio.com/pack/1.0.1" 1.0.1
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const sourceRoot = path.resolve(process.argv[2] || "");
const baseUrl = (process.argv[3] || "").replace(/\/+$/, "");
const version = process.argv[4] || "1.0.0";
if (!process.argv[2] || !baseUrl.startsWith("https://")) {
  console.error('Uso: node tools/create-manifest.js "<carpeta>" "https://tu-dominio/pack/1.0.0" 1.0.0');
  process.exit(1);
}
if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) throw new Error("La carpeta de origen no existe.");
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const full = path.join(dir, item.name);
    if (item.isSymbolicLink()) throw new Error(`No se admiten enlaces simbólicos: ${full}`);
    return item.isDirectory() ? walk(full) : [full];
  });
}
const files = walk(sourceRoot).map(full => {
  const relative = path.relative(sourceRoot, full).split(path.sep).join("/");
  if (relative === "manifest.json") throw new Error("No incluyas manifest.json dentro de la carpeta fuente.");
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  return { path: relative, url: `${baseUrl}/${relative.split("/").map(encodeURIComponent).join("/")}`, sha256, required: true };
});
const manifest = { packId: "mi-servidor", version, files, delete: [] };
const output = path.join(process.cwd(), "manifest.json");
fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Manifiesto creado: ${output}; archivos: ${files.length}`);
