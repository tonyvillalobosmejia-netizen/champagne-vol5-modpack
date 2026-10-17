'use strict';
const crypto = require('node:crypto');
const {modPathKey} = require('./champagne-update-paths');
const {validateAcquisition} = require('./champagne-manual-downloads');

// The downloader retains authorization and redirect checks. Only a completed
// download with a mismatching digest is retried here, never an authorization error.
async function downloadVerifiedMod(entry, download, {sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), onRetry = () => {}} = {}) {
  modPathKey(entry.path);
  if (validateAcquisition(entry) !== 'direct') throw Error('La descarga manual debe importarse y verificarse por separado.');
  const expectedSha256 = entry.sha256.toLowerCase();
  for (let attempt = 1; attempt <= 3; attempt++) {
    let bytes = Buffer.from(await download(entry.url));
    const receivedSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const receivedBytes = bytes.length;
    if (receivedSha256 === expectedSha256) return bytes;
    bytes = null;
    if (attempt < 3) {
      onRetry({path: entry.path, nextAttempt: attempt + 1, maxAttempts: 3});
      await sleep(attempt * 400);
      continue;
    }
    throw Object.assign(Error(`SHA-256 incorrecto para ${entry.path}. Intentos realizados: 3. SHA-256 esperado: ${expectedSha256}. SHA-256 recibido: ${receivedSha256}. Tamaño recibido: ${receivedBytes} bytes. Actualización detenida para proteger la integridad del modpack. No se instaló nada.`),
      {code: 'ERR_DOWNLOAD_INTEGRITY', attempts: attempt, expectedSha256, receivedSha256, receivedBytes});
  }
}
module.exports = {downloadVerifiedMod};
