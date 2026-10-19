"use strict";
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { validatePath, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_CONTENT_FILES, checkedTarget } = require('./champagne-config-sync');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function prepareContent(content, directory, download) {
  if (!content) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(content.packId || '')) throw new Error('Contenido remoto incompleto: identificador del modpack ausente o inválido.');
  if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(content.version || '')) throw new Error('Contenido remoto incompleto: versión de contenido ausente o inválida; se requiere x.y.z.');
  const context = content.packId + ' · ' + content.version;
  if (!Array.isArray(content.files)) throw new Error('Contenido remoto incompleto (' + context + '): files debe ser una lista de archivos.');
  if (!content.files.length) throw new Error('Contenido remoto incompleto (' + context + '): no hay archivos de contenido seleccionados.');
  if (content.files.length > MAX_CONTENT_FILES) throw new Error('Contenido remoto incompleto (' + context + '): ' + content.files.length + ' archivos seleccionados; el máximo es ' + MAX_CONTENT_FILES + '.');
  if (!Number.isSafeInteger(content.expectedFiles) || content.expectedFiles !== content.files.length) throw new Error('Contenido remoto incompleto (' + context + '): expectedFiles no coincide con los ' + content.files.length + ' archivos de files.');
  let total = 0; const seen = new Set();
  for (const [index, item] of content.files.entries()) {
    if (!item || typeof item !== 'object') throw new Error('Entrada de contenido inválida (' + context + '): archivo número ' + (index + 1) + '.');
    validatePath(item.path);
    if (seen.has(item.path.toLowerCase())) throw new Error('Entrada de contenido inválida: ruta duplicada ' + item.path + ' (' + context + ').');
    if (!Number.isSafeInteger(item.bytes) || item.bytes < 0 || item.bytes > MAX_FILE_BYTES) throw new Error('Entrada de contenido inválida: tamaño ausente, inválido o superior a 128 MiB en ' + item.path + ' (' + context + ').');
    if (!/^[a-f0-9]{64}$/i.test(item.sha256 || '')) throw new Error('Entrada de contenido inválida: SHA-256 ausente o inválido en ' + item.path + ' (' + context + ').');
    seen.add(item.path.toLowerCase()); total += item.bytes;
    if (total > MAX_TOTAL_BYTES) throw new Error('Contenido remoto demasiado grande.');
    if ((typeof item.base64 === 'string') === (typeof item.url === 'string')) throw new Error('Indica una sola fuente de contenido: ' + item.path + ' (' + context + ').');
    if (item.url) {
      let url; try { url = new URL(item.url); } catch { throw new Error('URL de recurso inválida: ' + item.path + ' (' + context + ').'); }
      if (url.protocol !== 'https:' || url.hostname !== 'cdn.modrinth.com' || url.username || url.password || url.hash) throw new Error('Fuente de recursos no autorizada: ' + item.path + ' (' + context + ').');
    } else if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(item.base64) || item.base64.length > Math.ceil(MAX_FILE_BYTES / 3) * 4) throw new Error('Contenido codificado inválido: ' + item.path + ' (' + context + ').');
  }
  for (const item of content.files) {
    let bytes;
    try { bytes = item.url ? await download(item.url) : Buffer.from(item.base64, 'base64'); }
    catch (error) {
      const status = Number.isInteger(error.status) && error.status >= 100 && error.status <= 599 ? ' HTTP ' + error.status : '';
      throw new Error('No se pudo descargar el contenido' + status + ': ' + item.path + ' (' + context + ').');
    }
    if (bytes.length !== item.bytes) throw new Error('SHA-256 o tamaño de contenido incorrecto: ' + item.path + ' (' + context + '); esperados ' + item.bytes + ' bytes, recibidos ' + bytes.length + '.');
    if (hash(bytes) !== item.sha256.toLowerCase()) throw new Error('SHA-256 de contenido incorrecto: ' + item.path + ' (' + context + ').');
    const target = checkedTarget(path.join(directory, 'files'), item.path);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  }
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ ...content, files: content.files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })) }));
  return directory;
}
function snapshotContent({ content, instanceDir, metadataDir, backupRoot, touched }) {
  const state = path.join(metadataDir, 'managed-client-config.json');
  const prior = fs.existsSync(state) ? JSON.parse(fs.readFileSync(state,'utf8')) : { files: {} };
  if (!prior.files || typeof prior.files !== 'object' || Array.isArray(prior.files)) throw new Error('Estado previo de contenido inválido.');
  const names = [...new Set([...content.files.map(e => e.path), ...Object.keys(prior.files)])];
  for (const name of names) validatePath(name);
  const targets = [...names.map(name => checkedTarget(instanceDir, name)), state,
    path.join(metadataDir,'active-content.json'), path.join(metadataDir,'installed.json')];
  for (let i=0;i<targets.length;i++) {
    const target=targets[i];
    if (fs.existsSync(target) && (!fs.lstatSync(target).isFile() || fs.lstatSync(target).isSymbolicLink())) throw new Error('Destino de contenido inválido.');
    const backup = fs.existsSync(target) ? path.join(backupRoot, 'content-' + i) : null;
    if (backup) fs.copyFileSync(target,backup);
    touched.push({ target, backup });
  }
}
function activeBundle(metadataDir, bundled) {
  const marker = path.join(metadataDir,'active-content.json');
  if (!fs.existsSync(marker)) return bundled;
  const value = JSON.parse(fs.readFileSync(marker,'utf8'));
  if (!/^content-cache-[A-Za-z0-9]+$/.test(value.folder || '')) throw new Error('Referencia de contenido inválida.');
  return path.join(metadataDir,value.folder);
}
module.exports = { prepareContent, snapshotContent, activeBundle };
