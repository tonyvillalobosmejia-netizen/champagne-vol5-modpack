"use strict";
const path = require('node:path');
const fs = require('node:fs');
function versionParts(value) {
  if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/.test(value)) throw new Error('Versión del launcher inválida.');
  return value.split('.').map(Number);
}
function atLeast(current, required) {
  const a = versionParts(current), b = versionParts(required);
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i]; }
  return true;
}
function validateGame(game, defaults, launcherVersion) {
  if (!game) return { ...defaults };
  if (!game || typeof game !== 'object' || game.loader !== 'forge' ||
      !/^[a-z0-9][a-z0-9-]{0,63}$/.test(game.serverId || '') ||
      !/^1\.(?:1[89]|[2-9]\d)(?:\.\d+)?$/.test(game.minecraftVersion || '') ||
      !/^\d+\.\d+\.\d+$/.test(game.forgeVersion || '') ||
      ![17,21].includes(game.javaMajor) || !/^[a-f0-9]{40}$/i.test(game.forgeInstallerSha1 || '') ||
      typeof game.packName !== 'string' || !game.packName.trim() || game.packName.length > 80) {
    throw new Error('Perfil de juego inválido. Se admite Forge moderno con Java 17 o 21; las versiones antiguas necesitan soporte específico.');
  }
  if (game.minLauncherVersion && !atLeast(launcherVersion, game.minLauncherVersion)) {
    const error = new Error('Este modpack necesita el launcher ' + game.minLauncherVersion + '. Estamos preparando la actualización.');
    error.code = 'LAUNCHER_UPDATE_REQUIRED'; error.requiredVersion = game.minLauncherVersion; throw error;
  }
  return { serverId:game.serverId, loader:'forge', minecraftVersion:game.minecraftVersion,
    forgeVersion:game.forgeVersion, javaMajor:game.javaMajor, forgeInstallerSha1:game.forgeInstallerSha1.toLowerCase(),
    packName:game.packName, packSubtitle:typeof game.packSubtitle === 'string' ? game.packSubtitle.slice(0,80) : 'MODPACK OFICIAL',
    ...(game.minLauncherVersion ? {minLauncherVersion:game.minLauncherVersion} : {}) };
}
function key(game) { return `${game.serverId}-mc${game.minecraftVersion}-forge${game.forgeVersion}-java${game.javaMajor}`; }
function pathsForGame(root, game, {named=false,migrate=true}={}) {
  const legacy = game.serverId === 'champagne-vol5' && game.minecraftVersion === '1.20.1' && game.forgeVersion === '47.4.10' && game.javaMajor === 17;
  const id = legacy ? 'principal' : key(game);
  const oldInstance=path.join(root,'instances',id);
  return { instanceDir:named?require('./champagne-instance-folders').namedInstance(root,game,oldInstance,{migrate}):oldInstance, metadataDir:legacy ? path.join(root,'metadata') : path.join(root,'metadata','instances',id),
    installerPath:path.join(root,'cache',`forge-${game.minecraftVersion}-${game.forgeVersion}-installer.jar`) };
}
function installerUrl(game) {
  const version = `${game.minecraftVersion}-${game.forgeVersion}`;
  return `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-installer.jar`;
}
function readCachedGame(root, defaults, launcherVersion) {
  const file = path.join(root,'metadata','active-game.json');
  if (!fs.existsSync(file)) return { ...defaults };
  if (fs.lstatSync(file).isSymbolicLink() || !fs.lstatSync(file).isFile()) throw new Error('Perfil activo inválido.');
  return validateGame(JSON.parse(fs.readFileSync(file,'utf8')),defaults,launcherVersion);
}
module.exports = { validateGame, key, pathsForGame, installerUrl, readCachedGame, atLeast };
