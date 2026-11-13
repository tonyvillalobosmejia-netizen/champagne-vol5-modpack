"use strict";
function createPreparation({ ensureJava, isReady, downloadGame, needsForgeInstall, installForge, prepareNatives, otherBusy = () => false, status = () => {} }) {
  let pending = null;
  return {
    get busy() { return pending !== null; },
    prepare() {
      if (pending) return pending;
      if (otherBusy()) return Promise.reject(new Error("Espera a que termine la operación actual o cierra Minecraft."));
      pending = Promise.resolve().then(async () => {
        await ensureJava();
        if (!isReady()) {
          status("Preparación inicial de Minecraft y Forge. Puedes dejar el launcher abierto…");
          await downloadGame();
          if (needsForgeInstall()) await installForge();
          await prepareNatives();
          if (!isReady()) throw new Error("La preparación está incompleta. Reintenta para recuperar los archivos pendientes.");
        }
        status("Minecraft y Forge listos para iniciar.", "success");
        return { ok: true, message: "Java, Minecraft y Forge preparados." };
      }).finally(() => { pending = null; });
      return pending;
    }
  };
}
module.exports = { createPreparation };
