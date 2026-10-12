module.exports = {
  launcherVersion: require("../package.json").version,
  launcherUpdateUrl: "https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/latest/download",
  serverId: "champagne-vol5",
  javaMajor: 17,
  packName: "Mundo Conejil",
  packSubtitle: "MODPACK OFICIAL",
  minecraftVersion: "1.20.1",
  forgeVersion: "47.4.10",
  // Cambia esta URL por tu manifiesto HTTPS. Vacía = modo local sin actualizaciones remotas.
  // Canal para clientes que pueden cambiar Minecraft/Forge. El canal antiguo se conserva compatible.
  manifestUrl: "https://raw.githubusercontent.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/preparacion-paso97/updates/stable-v2.json",
  // Servicio central de cuentas. Configurar HTTPS al elegir alojamiento.
  // Las pruebas locales usan CHAMPAGNE_AUTH_DEV_URL; no publicar una URL loopback.
  authServerUrl: "https://villawolf-auth.tony-villalobos-mejia-973.workers.dev/",
  // Activar juntos authProvider='discord', discordAuthRequired=true y authServerUrl HTTPS
  // únicamente después de verificar el servicio real. Los IDs/secreto viven en el servicio.
  authProvider: "discord",
  discordAuthRequired: true,
  // SHA-1 del instalador oficial Forge 1.20.1-47.4.10 publicado por Forge.
  forgeInstallerUrl: "https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.4.10/forge-1.20.1-47.4.10-installer.jar",
  forgeInstallerSha1: "66bfea9963bfa60d88bab6b2750e74a958392715"
};
