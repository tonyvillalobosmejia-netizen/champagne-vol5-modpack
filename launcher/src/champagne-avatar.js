const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function createAvatarStore({ directory, nativeImage }) {
  function target(username) {
    if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(username)) throw new Error('Elige primero una cuenta o un nombre local.');
    return path.join(directory, crypto.createHash('sha256').update(username.toLowerCase()).digest('hex') + '.png');
  }
  function decode(bytes) {
    if (bytes.length > 256 * 1024 || bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Selecciona una skin PNG de 64 × 64 o 64 × 32 píxeles.');
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (width !== 64 || ![32, 64].includes(height)) throw new Error('La skin debe medir 64 × 64 o 64 × 32 píxeles.');
    const image = nativeImage.createFromBuffer(bytes);
    const size = image.getSize();
    if (image.isEmpty() || size.width !== width || size.height !== height) throw new Error('No se pudo leer la skin PNG.');
    return image;
  }
  function readFile(file) {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 256 * 1024) throw new Error('El archivo de skin no es válido.');
    return decode(fs.readFileSync(file));
  }
  function get(username) {
    if (!username) return { ok: true, image: null };
    try { return { ok: true, image: readFile(target(username)).toDataURL() }; }
    catch { return { ok: true, image: null }; }
  }
  function save(username, file) {
    const destination = target(username);
    const image = readFile(file);
    fs.mkdirSync(directory, { recursive: true });
    const temporary = destination + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
    try { fs.writeFileSync(temporary, image.toPNG()); fs.renameSync(temporary, destination); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    return get(username);
  }
  function saveBytes(username,bytes){
    const destination=target(username),image=decode(bytes);
    fs.mkdirSync(directory,{recursive:true});
    const temporary=destination+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
    try{fs.writeFileSync(temporary,image.toPNG());fs.renameSync(temporary,destination);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
    return get(username);
  }
  function clear(username) {
    const file = target(username);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return { ok: true, image: null };
  }
  return { get, save, saveBytes, clear };
}
module.exports = { createAvatarStore };
