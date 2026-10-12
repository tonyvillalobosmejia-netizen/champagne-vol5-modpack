"use strict";
function memoryProfiles(totalBytes) {
  const totalMB = Math.floor(totalBytes / 1048576);
  const maxMB = Math.max(1024, totalMB - 2048);
  const amount = requested => Math.min(requested, Math.floor(maxMB / 256) * 256);
  return { totalMB, maxMB, profiles: [
    { id: "low", name: "Ahorro de memoria", ramMB: amount(2048) },
    { id: "balanced", name: "Equilibrado", ramMB: amount(4096) },
    { id: "high", name: "Memoria amplia", ramMB: amount(6144) }
  ] };
}
function redact(text) {
  return String(text).replace(/(Bearer\s+)\S+/gi, '$1[oculto]')
    .replace(/("?(?:access[_-]?token|refresh[_-]?token|password|contraseña|authorization)"?\s*[=:]\s*"?)[^\s",;]+/gi, '$1[oculto]')
    .replace(/(https?:\/\/[^\s?]+)\?[^\s]+/gi, '$1?[parámetros ocultos]');
}
function explainError(message) {
  const text = String(message);
  if (/Discord|rol autorizado|rol que permite|sesión venció/i.test(text)) return { title: 'Revisa tu acceso con Discord', hint: 'Abre tu perfil e inicia sesión con Discord. Comprueba que perteneces al servidor y tienes el rol autorizado. Si no lo tienes, contacta con un administrador.' };
  if (/espacio|GB libre|ENOSPC/i.test(text)) return { title: "Falta espacio en el disco", hint: "Libera espacio en la unidad del launcher y vuelve a intentarlo." };
  if (/SHA-|checksum|hash|corrupt/i.test(text)) return { title: "Un archivo no pasó la verificación", hint: "Reintenta la descarga o usa Reparar instalación en Ajustes. Si es un mod pendiente, descarga su versión exacta." };
  if (/HTTP|conexión|timeout|tiempo.*agotado|ENOTFOUND|ECONN|interrumpid/i.test(text)) return { title: "No se pudo completar la descarga", hint: "Comprueba tu conexión y vuelve a intentarlo. Los archivos que ya se verificaron se conservan." };
  if (/RAM|memoria|heap|OutOfMemory/i.test(text)) return { title: "Revisa la memoria del juego", hint: "Elige un perfil de memoria en Ajustes y cierra otras aplicaciones antes de jugar." };
  if (/cierra Minecraft|en ejecución|Espera|curso|preparando/i.test(text)) return { title: "Hay otra tarea en curso", hint: "Espera a que termine la tarea o cierra Minecraft antes de continuar." };
  return { title: "No se pudo completar la operación", hint: "Revisa los detalles. Puedes copiar el registro o usar Reparar instalación en Ajustes." };
}
function createRepair({ isBusy, manifest, java, game, forgeNeeded, forge, natives, pack, content, status, progress }) {
  let busy = false;
  return { get busy() { return busy; }, async run() {
    if (busy || isBusy()) return { ok: false, message: "Espera a que termine la operación actual o cierra Minecraft." };
    busy = true;
    try {
      progress({ phase: "repair", label: "Comprobando la instalación", done: 0, total: 5 }, true);
      const selected = await manifest();
      await java(); progress({ phase: "repair", label: "Java verificado", done: 1, total: 5 }, true);
      const gameResult = await game(); if (gameResult?.ok === false) throw Error(gameResult.message);
      progress({ phase: "repair", label: "Minecraft verificado", done: 2, total: 5 }, true);
      if (forgeNeeded()) await forge();
      const nativeResult = await natives(); if (nativeResult?.ok === false) throw Error(nativeResult.message);
      progress({ phase: "repair", label: "Forge y componentes verificados", done: 3, total: 5 }, true);
      const result = await pack(selected); if (!result.ok) return result;
      progress({ phase: "repair", label: "Mods verificados", done: 4, total: 5 }, true);
      await content();
      const message = "Instalación revisada y reparada. Se conservaron los mundos y las configuraciones personales.";
      status(message, "success"); progress({ phase: "complete", label: message, done: 5, total: 5 }, true);
      return { ok: true, message };
    } finally { busy = false; }
  } };
}
module.exports = { memoryProfiles, redact, explainError, createRepair };
