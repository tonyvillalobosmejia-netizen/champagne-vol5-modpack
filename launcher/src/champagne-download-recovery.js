'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {checkedModTarget} = require('./champagne-update-paths');
const {validateAcquisition} = require('./champagne-manual-downloads');
const {isCurseForgeFile} = require('./champagne-curseforge-api');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const known = require('./champagne-assisted-manifest.json').files;

// A page is usable only for the same file ID, path and SHA-256. Never guess slugs
// or fall back to a CDN after the service denies automatic distribution.
function officialPage(entry) {
  if (!isCurseForgeFile(entry.url)) return null;
  const match = /^\/files\/(\d+)\/(\d+)\//.exec(new URL(entry.url).pathname);
  if (Number(match[2]) >= 1000) return null;
  const id = Number(match[1]) * 1000 + Number(match[2]);
  const source = known.find(e => e.acquisition === 'user_official_download' &&
    e.path === entry.path && e.sha256.toLowerCase() === entry.sha256.toLowerCase() &&
    e.pageUrl.endsWith('/files/' + id));
  return source?.pageUrl || null;
}
function createDownloadRecovery(directory) {
  const target = (entry, suffix = '') => checkedModTarget(directory, `mods/${entry.sha256.toLowerCase()}${suffix}.jar`);
  function read(entry) {
    const file = target(entry);
    try {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 128 * 1024 * 1024) throw Error('Caché de descarga no permitida.');
      const bytes = fs.readFileSync(file);
      return hash(bytes) === entry.sha256.toLowerCase() ? bytes : null;
    } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  function write(entry, bytes, suffix = '') {
    const file = target(entry, suffix);
    fs.mkdirSync(path.dirname(file), {recursive:true});
    const temporary = path.join(path.dirname(file), crypto.randomUUID() + '.tmp');
    try { fs.writeFileSync(temporary, bytes, {flag:'wx'}); target(entry, suffix); fs.renameSync(temporary, file); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }
  function save(entry, bytes) {
    if (hash(bytes) !== entry.sha256.toLowerCase()) throw Error('SHA-256 incorrecto para ' + entry.path);
    write(entry, bytes);
  }
  function restrict(entry) {
    const page = officialPage(entry);
    if (!page) return false;
    write(entry, Buffer.from(page), '-manual');
    return true;
  }
  function normalize(manifest) {
    return {...manifest, files:manifest.files.map(entry => {
      if (validateAcquisition(entry) !== 'direct') return entry;
      const page = officialPage(entry);
      if (!page) return entry;
      const file = target(entry, '-manual');
      try {
        const stat = fs.lstatSync(file);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2048) throw Error('Estado de descarga no permitido.');
        if (fs.readFileSync(file, 'utf8') !== page) return entry;
      } catch (error) { if (error.code === 'ENOENT') return entry; throw error; }
      const {url, ...rest} = entry;
      return {...rest, acquisition:'user_official_download', pageUrl:page};
    })};
  }
  return {read, save, restrict, normalize};
}
module.exports = {createDownloadRecovery, officialPage};
