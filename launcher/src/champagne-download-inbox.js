"use strict";
const fs = require("node:fs");
const path = require("node:path");

// Only inspect filenames required by the selected pack, in the OS Downloads folder.
// Browsers can append '(1)' to the filename. Content identity still comes from SHA256.
function createDownloadInbox({ directory, manual, now = Date.now, settleMs = 1500 }) {
  const seen = new Map();
  const canonical = name => name.replace(/ \(\d+\)(?=\.jar$)/i, "").toLowerCase();
  function scan() {
    const missing = manual.pending();
    const wanted = new Set(missing.map(entry => canonical(entry.name)));
    const accepted = [], rejected = [];
    if (!wanted.size) return { accepted, rejected, missing };
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); }
    catch (error) {
      if (error.code === "ENOENT") return { accepted, rejected, missing, message: "La carpeta Descargas aún no existe. Puedes elegir los archivos manualmente." };
      throw error;
    }
    const live = new Set();
    for (const entry of entries) {
      if (!entry.isFile() || !/\.jar$/i.test(entry.name) || !wanted.has(canonical(entry.name))) continue;
      live.add(entry.name);
      if (live.size > 500) break;
      const file = path.join(directory, entry.name);
      let stat;
      try { stat = fs.lstatSync(file); } catch (error) { if (error.code === "ENOENT") continue; throw error; }
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 128 * 1024 * 1024) continue;
      const stamp = `${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
      const prior = seen.get(entry.name);
      if (!prior || prior.stamp !== stamp) { seen.set(entry.name, { stamp, since: now(), checked: false }); continue; }
      if (prior.checked || now() - prior.since < settleMs) continue;
      const result = manual.importFiles([file]);
      accepted.push(...result.accepted); rejected.push(...result.rejected);
      prior.checked = true;
    }
    for (const name of seen.keys()) if (!live.has(name)) seen.delete(name);
    return { accepted, rejected, missing: manual.pending() };
  }
  return { scan };
}
module.exports = { createDownloadInbox };
