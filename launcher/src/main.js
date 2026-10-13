const { app, BrowserWindow, ipcMain, shell, dialog, nativeImage, clipboard, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawn } = require("node:child_process");
const https = require("node:https");
const http = require("node:http");
const crypto = require("node:crypto");
const config = require("./config");
const { validatePresentation, viewPresentation } = require('./champagne-presentation');
let packPresentation=null;
let presentationCache=path.join(app.getPath('userData'),'pack-presentation.json');
try{if(!fs.lstatSync(presentationCache).isSymbolicLink()){
  const saved=JSON.parse(fs.readFileSync(presentationCache,'utf8'));
  if(typeof saved.packName==='string'&&saved.packName.length<=80)packPresentation={...saved,presentation:validatePresentation(saved.presentation)};
}}catch{}
const { validateGame, key: gameKey, pathsForGame, installerUrl, readCachedGame } = require("./champagne-game-profile");
const { createLauncherUpdates } = require("./champagne-launcher-updates");
const { checkedModTarget, validateModPathSets } = require("./champagne-update-paths");
const { syncBundledConfigs, checkedTarget: checkedContentTarget } = require("./champagne-config-sync");
const { ensureJava17 } = require("./champagne-runtime");
const { createPreparation } = require("./champagne-preparation");
const { createAuthClient } = require("./champagne-auth");
const {createSessionStore}=require('./champagne-session-store');
const authClient = createAuthClient({
  sessionStore:createSessionStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,scope:(process.env.CHAMPAGNE_AUTH_DEV_URL||config.authServerUrl||'')+'|'+(config.authProvider||'password')}),
  baseUrl: process.env.CHAMPAGNE_AUTH_DEV_URL || config.authServerUrl || "",
  allowLocalDev: !!process.env.CHAMPAGNE_AUTH_DEV_URL,
  provider: config.authProvider || 'password',
  required: config.discordAuthRequired === true,
  purpose:config.catalogEnabled?'launcher-v2':'launcher',
  openBrowser: url => shell.openExternal(url)
});
const {createMicrosoftClient}=require('./champagne-microsoft');
const {gameIdentity}=require('./champagne-game-identity');
const microsoftClient=createMicrosoftClient({clientId:config.microsoftClientId||'',
 sessionStore:createSessionStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,scope:'microsoft|'+(config.microsoftClientId||''),filename:'microsoft-session.bin'}),
 openBrowser:url=>shell.openExternal(url),onDevice:data=>{for(const win of BrowserWindow.getAllWindows())win.webContents.send('microsoft-device',data);}
});
const {knownGithubUrl,officialRedirect}=require('./champagne-official-sources');
const { createAvatarStore } = require("./champagne-avatar");
const { validateAcquisition, validateAssistedManifest, createManualDownloads } = require("./champagne-manual-downloads");
const { createDownloadInbox } = require("./champagne-download-inbox");
const { memoryProfiles, redact, explainError, createRepair } = require("./champagne-support");
const { prepareContent, snapshotContent, activeBundle } = require("./champagne-remote-content");
const avatarStore = createAvatarStore({ directory: path.join(app.getPath("userData"), "avatars"), nativeImage });
const avatarUsername = () => microsoftClient.status().user?.username || authClient.status().user?.username || getLocalProfile().username;
let avatarDialogBusy = false;
let microsoftOperationBusy = false;
let officialAvatarKey=null;
let selectedJava = null;
let forgeInstallBusy = false;
let repairController = null;
const recentActivity = [];
let progressTime = 0;
let lastProblem = "";
// CONFIGURACIÓN DEL LAUNCHER

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function validateRam(ram) {
  if (!Number.isInteger(ram) || ram < 1024) {
    throw new Error("La RAM debe ser un número entero de al menos 1024 MB.");
  }

  const totalMB = Math.floor(os.totalmem() / (1024 * 1024));
  const maxMB = Math.max(1024, totalMB - 2048);

  if (ram > maxMB) {
    throw new Error(
      `RAM demasiado alta. Tu equipo tiene ${totalMB} MB y el límite recomendado es ${maxMB} MB.`
    );
  }

  return ram;
}

function getSettings() {
  try {
    const settings = JSON.parse(
      fs.readFileSync(getSettingsPath(), "utf8")
    );

    return {
      ramMB: validateRam(settings.ramMB), performanceProfile: settings.performanceProfile || "custom"
    };
  } catch {
    return { ramMB: 2048, performanceProfile: "custom" };
  }
}

function saveSettings(settings) {
  const profile = settings?.performanceProfile || "custom";
  const preset = memoryProfiles(os.totalmem()).profiles.find(p => p.id === profile);
  if (profile !== "custom" && !preset) throw new Error("Perfil de memoria desconocido.");
  const ramMB = validateRam(preset ? preset.ramMB : settings?.ramMB);

  const file = getSettingsPath();

  fs.mkdirSync(path.dirname(file), { recursive: true });

  const tempFile = file + ".tmp";

  fs.writeFileSync(
    tempFile,
    JSON.stringify({ ramMB, performanceProfile: profile }, null, 2),
    "utf8"
  );

  fs.renameSync(tempFile, file);

  return { ok: true, ramMB };
}

function localProfilePath() {
  return path.join(app.getPath("userData"), "local-profile.json");
}
function getLocalProfile() {
  try {
    const value = JSON.parse(fs.readFileSync(localProfilePath(), "utf8"));
    return { username: /^[A-Za-z0-9_]{3,16}$/.test(value.username) ? value.username : "" };
  } catch { return { username: "" }; }
}
function saveLocalProfile(username) {
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    return { ok: false, message: "El nombre debe tener 3 a 16 caracteres: letras, números o guion bajo." };
  }
  const target = localProfilePath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = target + ".tmp";
  fs.writeFileSync(temp, JSON.stringify({ username }, null, 2), "utf8");
  fs.renameSync(temp, target);
  return { ok: true, username, message: `Perfil local guardado: ${username}.` };
}
const appRoot = path.join(app.getPath("appData"), "MiLauncher");
const defaultGame = { serverId:config.serverId || "champagne-vol5", loader:"forge", packName:config.packName,
  packSubtitle:config.packSubtitle, minecraftVersion:config.minecraftVersion, forgeVersion:config.forgeVersion,
  javaMajor:config.javaMajor || 17, forgeInstallerSha1:config.forgeInstallerSha1 };
let currentGame = readCachedGame(appRoot,defaultGame,config.launcherVersion || "0.1.4");
Object.assign(config,currentGame,{forgeInstallerUrl:installerUrl(currentGame)});
let { instanceDir, metadataDir, installerPath } = pathsForGame(appRoot,currentGame,{named:true});
let gamePreparationPending = null;
const {validateCatalog,channelFor}=require('./champagne-pack-catalog');
let selectedPack=null,authorizedCatalog=[],catalogUserId=null,openingVerifiedUserId=null;
const libraryCache=require('./champagne-library-cache').createLibraryCache(createSessionStore({directory:app.getPath('userData'),safeStorage:require('electron').safeStorage,scope:(process.env.CHAMPAGNE_AUTH_DEV_URL||config.authServerUrl||'')+'|library',filename:'library-cache.bin'}));
const selectedPackFile=path.join(app.getPath('userData'),'selected-pack.json');
function publishCatalog(){for(const win of BrowserWindow.getAllWindows())win.webContents.send('pack-catalog',{ok:true,packs:authorizedCatalog,selectedId:selectedPack?.id||null});}
async function verifySelectedPack(browseOnly=false){if(!config.catalogEnabled)return;if(!selectedPack)throw Error('Elige un modpack autorizado en tu biblioteca.');const result=browseOnly?{pack:(await authClient.catalogForDownloads()).catalog.packs.find(p=>p.id===selectedPack.id)}:await authClient.verifyPack(selectedPack.id);if(!result.pack)throw Error('No tienes el rol de este modpack.');const pack=validateCatalog({schemaVersion:1,packs:[result.pack]}).packs[0];if(pack.id!==selectedPack.id)throw Error('Acceso a modpack inválido.');config.manifestUrl=channelFor(pack);return pack;}
async function selectPack(id,fromLibrary=false,verifiedCatalogPack=null){
 if(libraryOperationBusy&&!fromLibrary)throw Error("Espera a que termine la operación de la biblioteca.");
 if(!config.catalogEnabled)throw Error('La biblioteca todavía no está disponible.');
 if(minecraftProcess||launchBusy||accountLaunchBusy||repairController?.busy||packUpdateBusy||automaticPreparation.busy||gamePreparationPending||manualDialogBusy)throw Error('Cierra Minecraft y espera a que termine la tarea antes de cambiar de modpack.');
 const available=verifiedCatalogPack||(catalogUserId===authClient.status().user?.id?authorizedCatalog.find(p=>p.id===id):null);const result=available?{pack:available}:await authClient.verifyPack(id),pack=validateCatalog({schemaVersion:1,packs:[result.pack]}).packs[0];
 const manifest=validateAssistedManifest(JSON.parse((await requestBuffer(channelFor(pack))).toString('utf8')));
 if(manifest.packId!==pack.id||manifest.game?.serverId!==pack.id)throw Error('El manifiesto no corresponde al modpack seleccionado.');
 selectGame(manifest);selectedPack=pack;config.manifestUrl=channelFor(pack);downloadInboxSession=null;packPresentation={packName:manifest.game.packName,version:manifest.version,presentation:validatePresentation(manifest.presentation)};
 presentationCache=path.join(app.getPath('userData'),'pack-presentations',pack.id+'.json');writeAtomic(selectedPackFile,Buffer.from(JSON.stringify({id:pack.id})));
 publishCatalog();return {ok:true,selectedId:pack.id};
}
const packCardImages=new Map();
async function packCardImage(pack){const cached=packCardImages.get(pack.id);try{const manifest=JSON.parse((await requestBuffer(channelFor(pack))).toString('utf8'));if(manifest.packId!==pack.id||manifest.game?.serverId!==pack.id)throw Error('Imagen de otro modpack.');const presentation=validatePresentation(manifest.presentation),background=viewPresentation(presentation)?.background;const native=background?nativeImage.createFromDataURL(background):nativeImage.createFromBuffer(fs.readFileSync(path.join(__dirname,'assets','villawolf-logo.png')));if(native.isEmpty())throw Error('Fondo inválido.');const image='data:image/jpeg;base64,'+native.resize({width:512}).toJPEG(82).toString('base64');packCardImages.set(pack.id,{time:Date.now(),image,game:manifest.game});if(selectedPack?.id===pack.id){packPresentation={packName:manifest.game.packName,version:manifest.version,presentation};}return image;}catch{return cached?.image||null;}}
function packInstalled(pack){try{const game=validateGame(packCardImages.get(pack.id)?.game,{},'9999.0.0');if(game.serverId!==pack.id)return false;const dirs=pathsForGame(appRoot,game,{named:true,migrate:false});return fs.existsSync(path.join(dirs.metadataDir,'installed.json'))&&fs.existsSync(path.join(dirs.instanceDir,'mods'));}catch{return false;}}
let catalogPending=null;
async function refreshCatalog(){if(catalogPending)return catalogPending;catalogPending=refreshCatalogNow();try{return await catalogPending;}finally{catalogPending=null;}}
async function refreshCatalogNow(){
 if(!config.catalogEnabled)return {ok:true,packs:[],selectedId:null,disabled:true};
 const userId=authClient.status().user?.id;
 if(!userId){authorizedCatalog=[];selectedPack=null;catalogUserId=null;openingVerifiedUserId=null;publishCatalog();return{ok:false,packs:[],selectedId:null,message:'Inicia sesión con Discord para ver tus mundos.'};}
 if(catalogUserId!==userId){authorizedCatalog=libraryCache.read(userId);catalogUserId=userId;selectedPack=null;}
 try{if(openingVerifiedUserId!==userId){await authClient.verifiedUsername();if(authClient.status().user?.id!==userId)throw Error('La cuenta cambió durante la comprobación.');openingVerifiedUserId=userId;}const result=await authClient.catalog();authorizedCatalog=await Promise.all(validateCatalog(result.catalog).packs.map(async pack=>({...pack,background:await packCardImage(pack),installed:packInstalled(pack)})));libraryCache.save(userId,authorizedCatalog);if(selectedPack&&!authorizedCatalog.some(p=>p.id===selectedPack.id))selectedPack=null;
  if(!selectedPack&&authorizedCatalog.length&&!minecraftProcess&&!launchBusy&&!libraryOperationBusy){let prior;try{prior=JSON.parse(fs.readFileSync(selectedPackFile,'utf8')).id;}catch{}const pack=authorizedCatalog.find(p=>p.id===prior)||authorizedCatalog[0];await selectPack(pack.id,false,pack);}
  publishCatalog();return {ok:true,packs:authorizedCatalog,selectedId:selectedPack?.id||null};
 }catch(error){if(error.code==='LAUNCHER_UPDATE_REQUIRED'){const result=await launchProblem(error);publishCatalog();return {...result,packs:authorizedCatalog,selectedId:selectedPack?.id||null};}if(error.status===401||error.status===403||!authClient.status().user){authorizedCatalog=[];libraryCache.clear();if(!minecraftProcess)selectedPack=null;}publishCatalog();return {ok:false,packs:authorizedCatalog,message:error.message+(authorizedCatalog.length?' Tus mundos siguen visibles; el permiso para jugar se comprobará al iniciarlos.':''),retryAfter:error.retryAfter||0,selectedId:selectedPack?.id||null,stale:authorizedCatalog.length>0};}
}
function selectGame(manifest, fromRepair = false) {
  const game = validateGame(manifest.game,defaultGame,config.launcherVersion || "0.1.4");
  if (gameKey(game) !== gameKey(defaultGame) && !manifest.content) {
    throw new Error("El nuevo servidor necesita su propio contenido y configuraciones en el manifiesto. No se copiará la configuración de otro servidor.");
  }
  if (gameKey(game) !== gameKey(currentGame)) {
    if (minecraftProcess || (repairController?.busy && !fromRepair) || packUpdateBusy || forgeInstallBusy || nativePrepBusy || gameDownloadBusy || automaticPreparation.busy) {
      throw new Error("Cierra Minecraft y espera a que termine la preparación antes de cambiar de servidor o versión.");
    }
    selectedJava = null;
    sendStatus(`Preparando una instancia separada: ${game.packName}, Minecraft ${game.minecraftVersion}, Forge ${game.forgeVersion}. Tus mundos anteriores se conservan.`);
  }
  currentGame = game;
  Object.assign(config,game,{forgeInstallerUrl:installerUrl(game)});
  ({ instanceDir, metadataDir, installerPath } = pathsForGame(appRoot,game,{named:true}));
  ensureDirs();
}

function sendStatus(message, kind = "info") {
  recentActivity.push(`[${new Date().toISOString()}] ${redact(message)}`);
  if (recentActivity.length > 150) recentActivity.shift();
  if (kind === "success") sendProgress({ phase: "complete", label: message, done: 1, total: 1 }, true);
  if (kind === "error") sendProgress({ phase: "error", label: "Operación detenida: revisa el error", done: 0, total: 1 }, true);
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("status", { message, kind, time: new Date().toLocaleTimeString() });
  }
}
function sendProgress(data, force = false) {
  const now = Date.now();
  if (!force && now - progressTime < 350) return;
  progressTime = now;
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send("progress", data);
}
function diagnostics(message = lastProblem) {
  const logPath = path.join(instanceDir, "logs", "champagne-launcher.log");
  let tail = "No hay registro de Minecraft para esta instancia.";
  if (fs.existsSync(logPath)) {
    const fd = fs.openSync(logPath, "r");
    try { const size = fs.fstatSync(fd).size; const buffer = Buffer.alloc(Math.min(size, 128 * 1024));
      fs.readSync(fd, buffer, 0, buffer.length, Math.max(0, size - buffer.length)); tail = buffer.toString("utf8");
    } finally { fs.closeSync(fd); }
  }
  return redact(`Launcher ${config.launcherVersion}\nMinecraft ${config.minecraftVersion} / Forge ${config.forgeVersion} / Java ${config.javaMajor || 17}\n\nERROR\n${message}\n\nACTIVIDAD DEL LAUNCHER\n${recentActivity.join("\n")}\n\nREGISTRO DE MINECRAFT (últimos 128 KiB)\n${tail}`);
}
function ensureDirs() {
  for (const dir of [appRoot, instanceDir, metadataDir, path.dirname(installerPath)]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function getJava() {
  if (selectedJava) return selectedJava;
  const configured = process.env.JAVA17_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  return "java";
}
async function ensureJavaForLauncher() {
  const javaMajor = config.javaMajor || 17;
  selectedJava = await ensureJava17({ runtimeDir: path.join(appRoot, "runtimes"), configuredJava: process.env[`JAVA${javaMajor}_PATH`],
    javaMajor, runtimeSpec:require(javaMajor === 21 ? "./java21-runtime.json" : "./java17-runtime.json"), status: sendStatus, progress: sendProgress });
  return selectedJava;
}
function requestBuffer(url, redirects = 5, githubDownload = knownGithubUrl(url)) {
  if(config.catalogEnabled&&selectedPack&&require('./champagne-curseforge-api').isCurseForgeFile(url))return authClient.downloadCurseforge({packId:selectedPack.id,url},state=>sendProgress({phase:'download',label:'Descargando desde CurseForge…',...state}));
  return new Promise((resolve, reject) => {
    if (!/^https:\/\//i.test(url)) return reject(new Error("La descarga requiere HTTPS."));
    const req = https.get(url, { timeout: 30000, headers: { "User-Agent": "ChampagneLauncher/0.1.0" } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume();
        const next = new URL(res.headers.location,url);
        if(githubDownload && !officialRedirect(url,next.href)) return reject(new Error('Redirección GitHub no autorizada.'));
        return resolve(requestBuffer(next.href, redirects - 1, githubDownload));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Descarga fallida (HTTP ${res.statusCode}): ${url}`));
      }
      const chunks = [];
      let bytes = 0;
      const started = Date.now();
      const label = path.basename(new URL(url).pathname);
      const totalBytes = Number(res.headers["content-length"] || 0);
      res.on("data", c => {
        bytes += c.length;
        if (bytes > 128 * 1024 * 1024) { res.destroy(new Error("La descarga supera el tamaño permitido.")); return; }
        chunks.push(c);
        sendProgress({ phase: "download", label: `Descargando ${label}`, bytes, totalBytes, bytesPerSecond: bytes / Math.max((Date.now() - started) / 1000, 0.1) });
      });
      res.on("end", () => { sendProgress({ phase: "verify", label: `Verificando ${label}`, bytes, totalBytes: totalBytes || bytes }, true); resolve(Buffer.concat(chunks)); });
      res.on("aborted", () => reject(new Error("Descarga interrumpida. Puedes reintentar.")));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("Tiempo de descarga agotado. Puedes reintentar.")));
    req.on("error", reject);
  });
}
function sha1(buffer) { return crypto.createHash("sha1").update(buffer).digest("hex"); }
function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

function safeTarget(relative) {
  return checkedModTarget(instanceDir, relative);
}
async function installForge() {
  if (forgeInstallBusy || minecraftProcess) throw new Error("Espera a que termine la instalación o cierra Minecraft.");
  forgeInstallBusy = true;
  try { await ensureJavaForLauncher(); return await performForgeInstall(); }
  finally { forgeInstallBusy = false; }
}
async function performForgeInstall() {
  ensureDirs();
  sendStatus(`Preparando Forge ${config.forgeVersion} para Minecraft ${config.minecraftVersion}…`);
  let installer;
  if (fs.existsSync(installerPath)) {
    const cached = fs.readFileSync(installerPath);
    if (sha1(cached) === config.forgeInstallerSha1) installer = cached;
  }
  if (!installer) {
    sendStatus("Descargando instalador oficial de Forge…");
    installer = await requestBuffer(config.forgeInstallerUrl);
    const actual = sha1(installer);
    if (actual !== config.forgeInstallerSha1) {
      try { fs.unlinkSync(installerPath); } catch {}
      throw new Error(`La validación SHA-1 del instalador falló. Esperado ${config.forgeInstallerSha1}, recibido ${actual}`);
    }
    const tmp = installerPath + ".tmp";
    fs.writeFileSync(tmp, installer);
    fs.renameSync(tmp, installerPath);
  }
  // Preparar el perfil que necesita el instalador de Forge.
const launcherProfilesPath = path.join(appRoot, "launcher_profiles.json");

if (!fs.existsSync(launcherProfilesPath)) {
  fs.writeFileSync(
    launcherProfilesPath,
    JSON.stringify({ profiles: {} }, null, 2),
    "utf8"
  );
}
  sendStatus("Ejecutando instalador de Forge. Puede tardar varios minutos…");
  await new Promise((resolve, reject) => {
    const child = spawn(getJava(), ["-jar", installerPath, "--installClient", appRoot], {
      cwd: appRoot, windowsHide: true, stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", d => { output += d.toString(); });
    child.stderr.on("data", d => { output += d.toString(); });
    child.on("error", err => reject(new Error(`No se pudo ejecutar Java. Instala Java 17 de 64 bits o configura JAVA17_PATH. ${err.message}`)));
    child.on("close", code => {
      if (code === 0) {
        sendStatus("Forge se instaló correctamente.", "success");
        resolve();
      } else {
        reject(new Error(`El instalador de Forge terminó con código ${code}. ${output.slice(-1800)}`));
      }
    });
  });
  return { ok: true, message: `Forge ${config.forgeVersion} instalado en ${appRoot}` };
}
let packUpdateBusy = false;
let manualDialogBusy = false;
let downloadInboxSession = null;
async function assistedManifest({freshPermission=false}={}) {
  await verifySelectedPack(!freshPermission);
  const document = config.manifestUrl
    ? JSON.parse((await requestBuffer(config.manifestUrl)).toString("utf8"))
    : JSON.parse(fs.readFileSync(path.join(__dirname, "champagne-assisted-manifest.json"), "utf8"));
  return validateAssistedManifest(document);
}
function manualDownloads(manifest) {
  return createManualDownloads({ manifest, instanceDir, cacheDir: path.join(metadataDir, "manual-downloads") });
}
async function assistedStatus() {
  const manifest = await assistedManifest();
  selectGame(manifest);
  const identity = JSON.stringify([gameKey(currentGame), manifest.version, manifest.files]);
  if (downloadInboxSession?.identity !== identity) {
    downloadInboxSession = { identity, game: gameKey(currentGame), manifest,
      inbox: createDownloadInbox({ directory: app.getPath("downloads"), manual: manualDownloads(manifest) }) };
  }
  return { ok: true, version: manifest.version, expectedFiles: manifest.expectedFiles,
    remote: !!config.manifestUrl, missing: manualDownloads(manifest).pending() };
}
async function applyUpdates(suppliedManifest = null) {
  if (automaticPreparation.busy || forgeInstallBusy || nativePrepBusy || gameDownloadBusy || manualDialogBusy) return { ok: false, message: "Espera a que termine la preparación del juego o la importación." };
  if (packUpdateBusy) return { ok: false, message: "Ya hay una actualización en curso." };
  if (minecraftProcess) return { ok: false, message: "Cierra Minecraft antes de actualizar los mods." };
  packUpdateBusy = true;
  let stagingRoot = null;
  try {
    ensureDirs();
    if (!suppliedManifest && !config.manifestUrl) return { ok: false, message: "Falta configurar manifestUrl en src/config.js con una URL HTTPS." };
    if (!suppliedManifest && !/^https:\/\//i.test(config.manifestUrl)) throw new Error("El manifiesto debe utilizar HTTPS.");
    sendStatus("Buscando actualizaciones del modpack…");
    const manifest = suppliedManifest || JSON.parse((await requestBuffer(config.manifestUrl)).toString("utf8"));
    if (!manifest || !Array.isArray(manifest.files) || typeof manifest.version !== "string") {
      throw new Error("El manifiesto no tiene el formato esperado.");
    }
    if (manifest.packId !== currentGame.serverId || !Number.isSafeInteger(manifest.expectedFiles) ||
        manifest.expectedFiles < 1 || manifest.expectedFiles > 500 || manifest.files.length !== manifest.expectedFiles) {
      throw new Error("El manifiesto del modpack está incompleto o es incorrecto. No se instaló nada.");
    }
    validateAssistedManifest(manifest);
    // La instancia se selecciona antes de bloquear el actualizador.
    // Los llamadores seleccionan un perfil compatible antes de entrar aquí.
    const expectedGame = validateGame(manifest.game,defaultGame,config.launcherVersion || "0.1.4");
    if (gameKey(expectedGame) !== gameKey(currentGame)) throw new Error("Selecciona el perfil del modpack antes de instalar sus archivos.");
    validateModPathSets(manifest.files, manifest.delete === undefined ? [] : manifest.delete);
    const unique = new Set();
    const desired = [];
    for (const entry of manifest.files) {
      if (!entry || typeof entry.path !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256 || "") ||
          unique.has(entry.path)) throw new Error("Manifiesto inválido o duplicado. No se instaló nada.");
      validateAcquisition(entry);
      if (!/^mods\/[^/\\]+\.jar$/i.test(entry.path)) {
        throw new Error("Ruta de mod inválida. No se instaló nada.");
      }
      unique.add(entry.path);
      desired.push({ ...entry, target: safeTarget(entry.path), hash: entry.sha256.toLowerCase() });
    }
    const deletions = Array.isArray(manifest.delete) ? manifest.delete : [];
    for (const relative of deletions) {
      if (typeof relative !== "string" || (!/^mods\/[^/\\]+\.jar$/i.test(relative)) || unique.has(relative)) {
        throw new Error("Ruta de eliminación inválida o duplicada.");
      }
      safeTarget(relative);
    }
    const statePath = path.join(metadataDir, "installed.json");
    // Solo los archivos previamente registrados como gestionados pueden eliminarse.
    let previous = { files: {} };
    if (fs.existsSync(statePath)) {
      previous = readJsonFile(statePath);
      if (previous.packId !== manifest.packId || !previous.files ||
          typeof previous.files !== "object" || Array.isArray(previous.files)) {
        throw new Error("Estado anterior inválido. No se modificó ningún mod.");
      }
    }
    validateModPathSets(manifest.files, deletions, previous.files);
    const obsolete = Object.keys(previous.files).filter(relative => !unique.has(relative));
    const allDeletions = [...new Set([...deletions, ...obsolete])];
    for (const relative of allDeletions) {
      if (!/^mods\/[^/\\]+\.jar$/i.test(relative)) throw new Error("Ruta antigua de mod inválida.");
      // Un archivo que el launcher nunca instaló no se elimina automáticamente.
      if (!Object.prototype.hasOwnProperty.call(previous.files, relative)) {
        throw new Error(`No se puede eliminar un archivo no administrado: ${relative}`);
      }
    }
    const pending = [];
    for (const [index, entry] of desired.entries()) {
      sendProgress({ phase: "verify", label: "Verificando mods del pack", done: index + 1, total: desired.length }, index === desired.length - 1);
      const good = fs.existsSync(entry.target) && fs.statSync(entry.target).isFile() &&
        sha256(fs.readFileSync(entry.target)) === entry.hash;
      if (!good) pending.push(entry);
    }
    const manual = manualDownloads(manifest);
    const missing = manual.pending();
    if (missing.length) return { ok: false, needsManual: true, missing,
      message: `Faltan ${missing.length} descarga(s) oficiales. Importa los JAR antes de instalar. No se modificó ningún mod.` };
    // Una huella solo se guarda después de instalar y verificar el manifiesto completo.
    // Se revisan los mods y la copia de contenido, sin comparar las preferencias personales.
    const manifestSha256 = sha256(Buffer.from(JSON.stringify(manifest)));
    let contentReady = !manifest.content;
    if (manifest.content && previous.manifestSha256 === manifestSha256) {
      const bundle = activeBundle(metadataDir, "");
      contentReady = !!bundle && manifest.content.files.every(entry => {
        const target = checkedContentTarget(path.join(bundle, "files"), entry.path);
        return fs.existsSync(target) && fs.statSync(target).isFile() &&
          sha256(fs.readFileSync(target)) === entry.sha256.toLowerCase();
      });
    }
    if (previous.manifestSha256 === manifestSha256 && previous.version === manifest.version &&
        !pending.length && contentReady && allDeletions.every(relative => !fs.existsSync(safeTarget(relative)))) {
      const message = `El modpack ya está actualizado (${manifest.version}).`;
      sendStatus(message, "success");
      return { ok: true, version: manifest.version, changed: 0, message };
    }
    // No se modifica ningún mod hasta verificar TODAS las descargas.
    stagingRoot = fs.mkdtempSync(path.join(metadataDir, "update-stage-"));
    let contentBundle = null;
    if (manifest.content) {
      const directory = path.join(stagingRoot, 'content');
      fs.mkdirSync(directory);
      sendStatus('Verificando configuraciones y recursos del modpack…');
      contentBundle = await prepareContent(manifest.content, directory, requestBuffer);
    }
    for (let i = 0; i < pending.length; i++) {
      const entry = pending[i];
      sendStatus(`Verificando descarga ${i + 1}/${pending.length}: ${entry.path}…`);
      const bytes = validateAcquisition(entry) === "manual" ? manual.read(entry) : await requestBuffer(entry.url);
      if (sha256(bytes) !== entry.hash) throw new Error(`SHA-256 incorrecto para ${entry.path}. No se instaló nada.`);
      entry.staged = path.join(stagingRoot, `${i}.jar`);
      fs.writeFileSync(entry.staged, bytes);
    }
    if (minecraftProcess) throw new Error("Minecraft se inició durante la descarga. Ciérralo y vuelve a intentar.");
    const backupRoot = fs.mkdtempSync(path.join(metadataDir, "update-backup-"));
    const touched = [];
    try {
      if (contentBundle) snapshotContent({ content: manifest.content, instanceDir, metadataDir, backupRoot, touched });
      const changes = [...pending.map(e => ({ target: e.target, staged: e.staged })),
        ...allDeletions.filter(p => {
          const target = safeTarget(p);
          return fs.existsSync(target) && fs.statSync(target).isFile() &&
            sha256(fs.readFileSync(target)) === previous.files[p];
        }).map(p => ({ target: safeTarget(p), remove: true }))];
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        safeTarget(path.relative(instanceDir, change.target).split(path.sep).join("/"));
        const exists = fs.existsSync(change.target);
        if (exists && !fs.statSync(change.target).isFile()) throw new Error(`No es un archivo: ${change.target}`);
        const backup = path.join(backupRoot, String(i));
        if (exists) fs.copyFileSync(change.target, backup);
        touched.push({ target: change.target, backup: exists ? backup : null });
        if (change.remove) { if (exists) fs.unlinkSync(change.target); }
        else {
          fs.mkdirSync(path.dirname(change.target), { recursive: true });
          fs.copyFileSync(change.staged, change.target);
        }
      }
      if (contentBundle) {
        const persistent = fs.mkdtempSync(path.join(metadataDir, 'content-cache-'));
        fs.cpSync(contentBundle, persistent, { recursive: true });
        syncBundledConfigs({ instanceDir, metadataDir, bundleDir: persistent, status: sendStatus });
        writeAtomic(path.join(metadataDir, 'active-content.json'), Buffer.from(JSON.stringify({ folder: path.basename(persistent) })));
      }
      const nextState = { packId: manifest.packId || "mi-servidor", version: manifest.version, manifestSha256, files: {} };
      for (const entry of desired) nextState.files[entry.path] = entry.hash;
      writeAtomic(statePath, Buffer.from(JSON.stringify(nextState, null, 2), "utf8"));
    } catch (error) {
      for (const item of touched.reverse()) {
        try {
          if (item.backup) fs.copyFileSync(item.backup, item.target);
          else if (fs.existsSync(item.target)) fs.unlinkSync(item.target);
        } catch (rollbackError) { sendStatus(`No se pudo restaurar ${item.target}: ${rollbackError.message}`, "error"); }
      }
      throw error;
    }
    // Conservar copias de seguridad para recuperación manual.
    const msg = pending.length || allDeletions.length
      ? `Actualización ${manifest.version} instalada (${pending.length} archivo(s) instalado(s)).`
      : `El modpack ya está actualizado (${manifest.version}).`;
    sendStatus(msg, "success");
    return { ok: true, message: msg, version: manifest.version, changed: pending.length };
  } finally {
    if (stagingRoot) fs.rmSync(stagingRoot, { recursive: true, force: true });
    packUpdateBusy = false;
  }
}

// Preparación segura de metadatos oficiales de Minecraft (todavía NO inicia el juego).
const MOJANG_MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
function readJsonFile(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
async function fetchVerified(url, expectedSha1) {
  if (!url.startsWith("https://")) throw new Error("La descarga requiere HTTPS.");
  const data = await requestBuffer(url);
  if (!/^[a-f0-9]{40}$/i.test(expectedSha1) || sha1(data) !== expectedSha1.toLowerCase()) {
    throw new Error("La descarga no coincide con su SHA-1 oficial.");
  }
  return data;
}
function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + ".tmp";
  try { fs.writeFileSync(temp, data); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
async function prepareMinecraftMetadata() {
  ensureDirs();
  sendStatus("Consultando el catálogo oficial de versiones de Minecraft…");
  const manifest = JSON.parse((await requestBuffer(MOJANG_MANIFEST)).toString("utf8"));
  const version = manifest.versions?.find(v => v.id === config.minecraftVersion && v.type === "release");
  if (!version) throw new Error("No se encontró Minecraft " + config.minecraftVersion + " en el catálogo oficial.");
  const versionPath = path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.json`);
  let versionJson;
  if (fs.existsSync(versionPath) && sha1(fs.readFileSync(versionPath)) === version.sha1.toLowerCase()) {
    versionJson = readJsonFile(versionPath);
  } else {
    sendStatus("Descargando y verificando metadatos de Minecraft " + config.minecraftVersion + "…");
    const bytes = await fetchVerified(version.url, version.sha1);
    versionJson = JSON.parse(bytes.toString("utf8"));
    writeAtomic(versionPath, bytes);
  }
  if (versionJson.javaVersion?.majorVersion && versionJson.javaVersion.majorVersion !== (config.javaMajor || 17)) {
    throw new Error(`Minecraft ${config.minecraftVersion} requiere Java ${versionJson.javaVersion.majorVersion}; corrige el perfil del modpack antes de instalar.`);
  }
  const index = versionJson.assetIndex;
  if (!index?.url || !index?.sha1 || !/^[a-zA-Z0-9._-]+$/.test(index.id)) {
    throw new Error("El catálogo no contiene un índice de recursos válido.");
  }
  const indexPath = path.join(appRoot, "assets", "indexes", `${index.id}.json`);
  let assetIndex;
  if (fs.existsSync(indexPath) && sha1(fs.readFileSync(indexPath)) === index.sha1.toLowerCase()) {
    assetIndex = readJsonFile(indexPath);
  } else {
    sendStatus("Descargando y verificando el índice de recursos de Minecraft…");
    const bytes = await fetchVerified(index.url, index.sha1);
    assetIndex = JSON.parse(bytes.toString("utf8"));
    writeAtomic(indexPath, bytes);
  }
  const count = Object.keys(assetIndex.objects || {}).length;
  const msg = `Metadatos oficiales listos. Índice ${index.id}: ${count} recursos identificados. Falta descargar los recursos y las librerías antes de jugar.`;
  sendStatus(msg, "success");
  return { ok: true, message: msg };
}


// Descarga verificable de recursos y librerías vanilla (no inicia Minecraft).
let gameDownloadBusy = false;
const MIN_FREE_BYTES = 1024 * 1024 * 1024;
function verifyLocal(file, hash) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  return sha1(fs.readFileSync(file)) === hash.toLowerCase();
}
function requireFreeSpace() {
  if (typeof fs.statfsSync !== "function") return;
  const disk = fs.statfsSync(appRoot, { bigint: true });
  const available = disk.bavail * disk.bsize;
  if (available < BigInt(MIN_FREE_BYTES)) {
    throw new Error("Descarga detenida: queda menos de 1 GB libre en la unidad del launcher.");
  }
}
function downloadFileVerified(url, destination, hash) {
  return new Promise((resolve, reject) => {
    if (!/^https:\/\//i.test(url)) return reject(new Error("URL de descarga no HTTPS."));
    if (!/^[a-f0-9]{40}$/i.test(hash)) return reject(new Error("SHA-1 de descarga inválido."));
    const temp = destination + ".download";
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    function attempt(address, remaining) {
      let failCurrent = null;
      const req = https.get(address, { timeout: 30000, headers: { "User-Agent": "ChampagneLauncher/0.1" } }, res => {
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && remaining > 0) {
          const next = new URL(res.headers.location, address);
          res.resume();
          if (next.protocol !== "https:") return reject(new Error("Redirección insegura."));
          return attempt(next.toString(), remaining-1);
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}: ${address}`)); }
        const h = crypto.createHash("sha1");
        let bytes = 0; const started = Date.now(); const totalBytes = Number(res.headers["content-length"] || 0);
        const out = fs.createWriteStream(temp);
        let finished = false;
        const fail = error => {
          if (finished) return;
          finished = true;
          res.destroy(); out.destroy();
          try { fs.unlinkSync(temp); } catch {}
          reject(error);
        };
        failCurrent = fail;
        res.on("data", chunk => { h.update(chunk); bytes += chunk.length;
          sendProgress({ phase: "download", label: `Descargando ${path.basename(destination)}`, bytes, totalBytes, bytesPerSecond: bytes / Math.max((Date.now() - started) / 1000, 0.1) }); });
        res.on("error", fail);
        res.on("aborted", () => fail(new Error("Descarga interrumpida.")));
        out.on("error", fail);
        out.on("finish", () => {
          if (finished) return;
          if (h.digest("hex") !== hash.toLowerCase()) return fail(new Error(`SHA-1 incorrecto: ${path.basename(destination)}`));
          try { fs.renameSync(temp, destination); finished = true; resolve(); }
          catch (e) { fail(e); }
        });
        res.pipe(out);
      });
      req.on("timeout", () => req.destroy(new Error("Tiempo de descarga agotado.")));
      req.on("error", e => { if (failCurrent) return failCurrent(e); try { fs.unlinkSync(temp); } catch {} reject(e); });
    }
    attempt(url, 5);
  });
}
function libraryApplies(library) {
  const rules = library.rules;
  if (!Array.isArray(rules)) return true;
  let allowed = false;
  for (const rule of rules) {
    let matches = true;
    if (rule.os) {
      if (rule.os.name && rule.os.name !== "windows") matches = false;
      if (rule.os.arch && !new RegExp(rule.os.arch).test(process.arch === "x64" ? "x86_64" : process.arch)) matches = false;
      if (rule.os.version && !new RegExp(rule.os.version).test(os.release())) matches = false;
    }
    if (rule.features) matches = false; // No habilitar funciones opcionales desconocidas.
    if (matches) allowed = rule.action === "allow";
  }
  return allowed;
}
async function downloadGameFiles() {
  if (gameDownloadBusy) return { ok: false, message: "Ya hay una descarga en curso." };
  gameDownloadBusy = true;
  try {
    ensureDirs(); requireFreeSpace();
    await prepareMinecraftMetadata();
    const version = readJsonFile(path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.json`));
    const assetIndex = readJsonFile(path.join(appRoot, "assets", "indexes", `${version.assetIndex.id}.json`));
    const entries = [];
    const seen = new Set();
    function add(url, file, hash) {
      if (!url || !hash || !/^[a-f0-9]{40}$/i.test(hash)) throw new Error("Descarga sin URL o SHA-1 válido.");
      if (!seen.has(file)) { entries.push({url,file,hash}); seen.add(file); }
    }
    for (const asset of Object.values(assetIndex.objects || {})) {
      if (!/^[a-f0-9]{40}$/i.test(asset.hash)) throw new Error("Hash de recurso inválido.");
      const h = asset.hash.toLowerCase();
      add(`https://resources.download.minecraft.net/${h.slice(0,2)}/${h}`,
        path.join(appRoot, "assets", "objects", h.slice(0,2), h), h);
    }
    for (const lib of version.libraries || []) {
      if (!libraryApplies(lib)) continue;
      const artifact = lib.downloads?.artifact;
      if (artifact?.path && artifact.url && artifact.sha1) {
        const dest = path.resolve(appRoot, "libraries", artifact.path);
        const rel = path.relative(path.join(appRoot, "libraries"), dest);
        if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("Ruta de librería insegura.");
        add(artifact.url, dest, artifact.sha1);
      }
      // Los clasificadores nativos se prepararán en el paso siguiente.
    }
    const client = version.downloads?.client;
    if (!client?.url || !client.sha1) throw new Error("No se encontró el cliente oficial de Minecraft.");
    add(client.url, path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.jar`), client.sha1);
    let downloaded = 0, reused = 0;
    sendStatus(`Se verificarán ${entries.length} archivos oficiales (recursos, librerías y cliente).`);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      sendProgress({ phase: "verify", label: "Verificando archivos de Minecraft", done: i + 1, total: entries.length }, i === entries.length - 1);
      if (verifyLocal(entry.file, entry.hash)) { reused++; continue; }
      requireFreeSpace();
      let last;
      for (let n = 0; n < 3; n++) {
        try { await downloadFileVerified(entry.url, entry.file, entry.hash); last = null; break; }
        catch (e) { last = e; }
      }
      if (last) throw new Error(`Falló ${i+1}/${entries.length}: ${last.message}. Puedes reintentar sin perder archivos correctos.`);
      downloaded++;
      if (downloaded % 100 === 0 || i === entries.length - 1) sendStatus(`Descarga: ${i+1}/${entries.length} comprobados; ${downloaded} nuevos, ${reused} reutilizados.`);
    }
    const message = `Archivos vanilla comprobados: ${entries.length}. Descargados: ${downloaded}; reutilizados: ${reused}. Faltan componentes nativos y verificación de Forge antes de jugar.`;
    sendStatus(message, "success");
    sendProgress({ phase: "complete", label: "Archivos de Minecraft verificados", done: entries.length, total: entries.length }, true);
    return { ok: true, message };
  } finally { gameDownloadBusy = false; }
}


// Paso 58: comprobar Forge y preparar clasificadores nativos para Windows.
let nativePrepBusy = false;
function forgeArtifactPath(lib) {
  const artifact = lib.downloads?.artifact;
  if (artifact?.path) return artifact.path;
  if (typeof lib.name !== "string") return null;
  const parts = lib.name.split(":");
  if (parts.length < 3 || !parts.every(p => /^[a-zA-Z0-9_.-]+$/.test(p))) return null;
  const [group, name, version, classifier, extension] = parts;
  const suffix = classifier ? `-${classifier}` : "";
  return `${group.replace(/\./g, "/")}/${name}/${version}/${name}-${version}${suffix}.${extension?.startsWith("@") ? extension.slice(1) : "jar"}`;
}
function resolveLibrary(relative) {
  if (typeof relative !== "string" || relative.includes("\\") || relative.includes("..") || path.isAbsolute(relative)) throw new Error("Ruta de librería inválida.");
  const base = path.join(appRoot, "libraries");
  const result = path.resolve(base, relative);
  if (path.relative(base, result).startsWith("..")) throw new Error("Librería fuera del directorio.");
  return result;
}
function extractNativeDlls(jar, target) {
  const script = path.join(__dirname, "extract-natives.ps1").replace(/\.asar([\\/])/, ".asar.unpacked$1");
  if (!fs.existsSync(script)) throw new Error("Falta src/extract-natives.ps1 del Paso 58.");
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, jar, target], { windowsHide: true });
    let output = "";
    child.stdout.on("data", d => output += d.toString());
    child.stderr.on("data", d => output += d.toString());
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(output.trim()) : reject(new Error(`Error extrayendo nativos: ${output.slice(-600)}`)));
  });
}
async function prepareWindowsNatives() {
  if (nativePrepBusy || gameDownloadBusy) return { ok: false, message: "Hay otra preparación o descarga en curso." };
  nativePrepBusy = true;
  try {
    ensureDirs(); requireFreeSpace();
    const baseJsonPath = path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.json`);
    const forgeId = `${config.minecraftVersion}-forge-${config.forgeVersion}`;
    const forgeJsonPath = path.join(appRoot, "versions", forgeId, `${forgeId}.json`);
    if (!fs.existsSync(baseJsonPath) || !fs.existsSync(forgeJsonPath)) throw new Error("Faltan metadatos de Minecraft o Forge. Ejecuta PREPARAR e INSTALAR FORGE.");
    const base = readJsonFile(baseJsonPath), forge = readJsonFile(forgeJsonPath);
    const missing = [];
    let checked = 0;
    for (const lib of forge.libraries || []) {
      if (!libraryApplies(lib)) continue;
      const rel = forgeArtifactPath(lib);
      if (!rel) { missing.push(`Metadatos incompletos: ${lib.name || "desconocida"}`); continue; }
      const file = resolveLibrary(rel);
      checked++;
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) missing.push(lib.name || rel);
      else if (lib.downloads?.artifact?.sha1 && !verifyLocal(file, lib.downloads.artifact.sha1)) missing.push(`SHA-1 incorrecto: ${lib.name || rel}`);
    }
    sendStatus(`Forge: ${checked} librerías revisadas; ${missing.length} pendientes.`, missing.length ? "info" : "success");
    // Carpeta única de DLL, también utilizada en la preparación manual.
    const nativesDir = path.join(instanceDir, "natives");
    fs.mkdirSync(nativesDir, { recursive: true });
    let prepared = 0, reused = 0;
    const classifiers = [];
    const seenJars = new Set();
    for (const lib of base.libraries || []) {
      if (!libraryApplies(lib) || !lib.natives?.windows) continue;
      const arch = process.arch === "x64" ? "64" : "32";
      const classifierName = lib.natives.windows.replace("${arch}", arch);
      const info = lib.downloads?.classifiers?.[classifierName];
      if (!info?.url || !info?.sha1 || !info?.path) throw new Error(`No se encontraron datos nativos para ${lib.name}`);
      classifiers.push({ info, lib });
    }
    for (const {info, lib} of classifiers) {
      const jar = resolveLibrary(info.path);
      if (!verifyLocal(jar, info.sha1)) {
        requireFreeSpace();
        sendStatus(`Descargando nativos: ${lib.name}…`);
        await downloadFileVerified(info.url, jar, info.sha1);
        prepared++;
      } else reused++;
      seenJars.add(jar);
      await extractNativeDlls(jar, nativesDir);
    }
    // Minecraft 1.20.1 puede declarar LWJGL como clasificadores descargables
    // sin el campo natives. Usamos los JAR x64 oficiales ya descargados.
    if (process.arch !== "x64") throw new Error("Esta preparación requiere Windows x64.");
    const nativeArtifacts = (base.libraries || []).filter(libraryApplies).map(lib => lib.downloads?.artifact?.path)
      .filter(relative => typeof relative === "string" && /^org\/lwjgl\/[^/]+\/[^/]+\/[^/]+-natives-windows(?:-x86_64)?\.jar$/.test(relative));
    for (const relative of nativeArtifacts) {
      const jar = resolveLibrary(relative);
      if (!fs.existsSync(jar)) throw new Error(`Falta el archivo nativo ${path.basename(jar)}. Ejecuta DESCARGAR ARCHIVOS.`);
      if (!seenJars.has(jar)) {
        await extractNativeDlls(jar, nativesDir);
        reused++;
      }
    }
    const requiredDlls = ["lwjgl.dll", "glfw.dll", "jemalloc.dll", "OpenAL.dll", "lwjgl_opengl.dll", "lwjgl_stb.dll", "lwjgl_tinyfd.dll"];
    const absentDlls = requiredDlls.filter(name => !fs.existsSync(path.join(nativesDir, name)) || fs.statSync(path.join(nativesDir, name)).size === 0);
    const dllCount = fs.readdirSync(nativesDir).filter(f => f.toLowerCase().endsWith(".dll")).length;
    if (absentDlls.length) throw new Error(`Faltan DLL nativas: ${absentDlls.join(", ")}.`);
    const report = path.join(metadataDir, "forge-check.json");
    writeAtomic(report, Buffer.from(JSON.stringify({forgeId, checked, missing, classifiers:classifiers.length, dllCount, generatedAt:new Date().toISOString()},null,2)));
    const message = `Nativos de Windows preparados: ${dllCount} DLL; ${prepared} archivos descargados y ${reused} reutilizados. Forge: ${missing.length} dependencias pendientes. ${missing.length ? "La preparación necesita recuperar esas dependencias." : "Componentes del juego verificados."}`;
    sendStatus(message, missing.length ? "info" : "success");
    return {ok:true, message};
  } finally { nativePrepBusy = false; }
}


// Paso 67: construir y ejecutar el arranque de Forge usando metadatos locales.
let minecraftProcess = null;
let accountLaunchBusy = false;
function playState(){return {running:!!minecraftProcess,preparing:launchBusy||accountLaunchBusy||libraryOperationBusy};}
function publishPlayState(){for(const win of BrowserWindow.getAllWindows())win.webContents.send('play-state',playState());}
async function launchProblem(error){
  if(error.code==='LAUNCHER_UPDATE_REQUIRED'){
    const state=await launcherUpdates.requireVersion(error.requiredVersion);
    return {ok:false,updating:true,requiredVersion:error.requiredVersion,message:state.message};
  }
  sendStatus(error.message,'error');return {ok:false,message:error.message};
}
function forgeVersionId() { return `${config.minecraftVersion}-forge-${config.forgeVersion}`; }
function offlineUuid(name) {
  const bytes = crypto.createHash("md5").update(`OfflinePlayer:${name}`, "utf8").digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x30;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes.toString("hex");
}
function expandArgs(value, replacements) {
  return String(value).replace(/\$\{([^}]+)\}/g, (full, key) => {
    if (!(key in replacements)) throw new Error(`Variable de arranque desconocida: ${key}`);
    return replacements[key];
  });
}
function versionArguments(data, kind, replacements) {
  const args = data.arguments?.[kind];
  if (!Array.isArray(args)) {
    if (kind === "game" && typeof data.minecraftArguments === "string") {
      return data.minecraftArguments.split(/\s+/).map(a => expandArgs(a, replacements));
    }
    return [];
  }
  const result = [];
  for (const item of args) {
    if (typeof item === "string") result.push(expandArgs(item, replacements));
    else if (item && libraryApplies(item)) {
      const values = Array.isArray(item.value) ? item.value : [item.value];
      for (const value of values) if (typeof value === "string") result.push(expandArgs(value, replacements));
    }
  }
  return result;
}
function buildForgeLaunch(accountUsername = null, microsoft = null) {
  if (process.platform !== "win32" || process.arch !== "x64") throw new Error("Este paso está preparado para Windows x64.");
  if (nativePrepBusy || gameDownloadBusy) throw new Error("Espera a que terminen las descargas y la preparación de nativos.");
  const id = forgeVersionId();
  const baseFile = path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.json`);
  const forgeFile = path.join(appRoot, "versions", id, `${id}.json`);
  if (!fs.existsSync(baseFile) || !fs.existsSync(forgeFile)) throw new Error("Faltan metadatos de Minecraft o Forge.");
  const vanilla = readJsonFile(baseFile), forge = readJsonFile(forgeFile);
  if (forge.inheritsFrom && forge.inheritsFrom !== config.minecraftVersion) throw new Error("La versión base de Forge no coincide.");
  const reportFile = path.join(metadataDir, "forge-check.json");
  if (!fs.existsSync(reportFile)) throw new Error("Ejecuta primero PREPARAR NATIVOS / REVISAR FORGE.");
  const report = readJsonFile(reportFile);
  if (report.forgeId !== id || report.missing?.length || report.dllCount < 7) throw new Error("Forge o los nativos no están listos. Repite PREPARAR NATIVOS.");
  const username = microsoft?.username || accountUsername || getLocalProfile().username;
  if (!username) throw new Error("Guarda primero un nombre de usuario local válido.");
  const nativesDir = path.join(instanceDir, "natives");
  for (const dll of ["lwjgl.dll", "glfw.dll", "jemalloc.dll", "OpenAL.dll", "lwjgl_opengl.dll", "lwjgl_stb.dll", "lwjgl_tinyfd.dll"]) {
    if (!fs.existsSync(path.join(nativesDir, dll))) throw new Error(`Falta ${dll}; repite PREPARAR NATIVOS.`);
  }
  const clientJar = path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.jar`);
  if (!fs.existsSync(clientJar)) throw new Error("Falta el cliente de Minecraft. Ejecuta DESCARGAR ARCHIVOS.");
  const assetsIndex = path.join(appRoot, "assets", "indexes", `${vanilla.assetIndex?.id}.json`);
  if (!fs.existsSync(assetsIndex)) throw new Error("Falta el índice de recursos. Ejecuta PREPARAR.");
  const classpath = [], seen = new Set(), missing = [];
  const add = file => {
    if (!fs.existsSync(file)) { missing.push(file); return; }
    if (!seen.has(file)) { seen.add(file); classpath.push(file); }
  };
  const libs = [...(forge.libraries || []), ...(vanilla.libraries || [])];
  for (const lib of libs) {
    if (!libraryApplies(lib)) continue;
    const rel = forgeArtifactPath(lib);
    if (rel) add(resolveLibrary(rel));
  }
  // Forge 1.20.1 utiliza su cliente SRG preparado por el instalador.
  // No incluir el JAR vanilla como módulo adicional: causa ResolutionException
  // (módulos minecraft y _1._20._1 exportan los mismos paquetes).
  if (missing.length) throw new Error(`Faltan ${missing.length} librerías para iniciar. Primera: ${path.basename(missing[0])}`);
  const ramMB = getSettings().ramMB;
  const identity = gameIdentity(username,offlineUuid,microsoft);
  const replacements = {
    ...identity, version_name: id, game_directory: instanceDir,
    assets_root: path.join(appRoot, "assets"), assets_index_name: vanilla.assetIndex.id,
    version_type: "release", user_properties: "{}",
    natives_directory: nativesDir, launcher_name: "ChampagneVol5", launcher_version: "0.1",
    classpath: classpath.join(path.delimiter), classpath_separator: path.delimiter,
    library_directory: path.join(appRoot, "libraries"),
    resolution_width: "854", resolution_height: "480"
  };
  const jvm = [
    `-Xms512M`, `-Xmx${ramMB}M`, `-Djava.library.path=${nativesDir}`,
    ...versionArguments(vanilla, "jvm", replacements),
    ...versionArguments(forge, "jvm", replacements)
  ];
  // Si los metadatos no declaran el classpath, incluirlo explícitamente.
  if (!jvm.includes("-cp") && !jvm.includes("-classpath") && !jvm.includes("--class-path")) jvm.push("-cp", replacements.classpath);
  const mainClass = forge.mainClass || vanilla.mainClass;
  if (!mainClass) throw new Error("Los metadatos de Forge no declaran mainClass.");
  const game = [...versionArguments(vanilla, "game", replacements), ...versionArguments(forge, "game", replacements)];
  if (!game.length) throw new Error("No se encontraron argumentos del juego.");
  return { java: getJava(), args: [...jvm, mainClass, ...game], ramMB, username, classpathCount: classpath.length, id };
}
function checkJava17(java) {
  return new Promise((resolve, reject) => {
    const child = spawn(java, ["-version"], { windowsHide: true });
    let output = "";
    child.stdout.on("data", d => output += d.toString());
    child.stderr.on("data", d => output += d.toString());
    child.on("error", e => reject(new Error(`No se encontró Java: ${e.message}`)));
    child.on("close", code => {
      const match = output.match(/version\s+"(\d+)/);
      if (code !== 0 || !match || Number(match[1]) !== (config.javaMajor || 17)) reject(new Error(`Se necesita Java ${config.javaMajor || 17} de 64 bits. Resultado: ` + output.slice(0, 250)));
      else resolve();
    });
  });
}
function offlineError(error) {
  return ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH"].includes(error.code) || error.message === "Tiempo de descarga agotado. Puedes reintentar.";
}
async function playManifest(packAlreadyVerified=false) {
  if(!packAlreadyVerified)await verifySelectedPack();
  if (!config.manifestUrl) return { ok: true };
  sendStatus("Comprobando actualizaciones del modpack antes de jugar…");
  let bytes;
  try { bytes = await requestBuffer(config.manifestUrl); }
  catch (error) {
    // Solo una desconexión permite el modo local anterior. HTTP, manifiestos
    // inválidos y fallos al instalar una actualización conocida bloquean el arranque.
    const mods = path.join(instanceDir, "mods");
    if (!offlineError(error) || !fs.existsSync(mods) || !fs.readdirSync(mods).some(name => /\.jar$/i.test(name))) throw error;
    sendStatus("Sin conexión: no se pudo comprobar la última versión. Se usará el modpack local; vuelve a conectar para actualizar.", "info");
    return null;
  }
  const manifest = validateAssistedManifest(JSON.parse(bytes.toString("utf8")));
  return manifest;
}
async function verifyPackBeforePlay(suppliedManifest = undefined) {
  if (!config.manifestUrl) return { ok:true };
  const manifest = suppliedManifest === undefined ? await playManifest() : suppliedManifest;
  if (!manifest) return { ok:true, offline:true };
  selectGame(manifest);
  return applyUpdates(manifest);
}
async function prepareSelectedGame(packAlreadyVerified=false) {
  if (gamePreparationPending) return gamePreparationPending;
  gamePreparationPending = (async()=>{
    const manifest = config.manifestUrl ? await playManifest(packAlreadyVerified) : null;
    if (manifest) selectGame(manifest);
    await automaticPreparation.prepare();
    return manifest;
  })();
  try { return await gamePreparationPending; }
  finally { gamePreparationPending = null; }
}
let launchBusy = false,libraryOperationBusy=false;
async function launchForge() {
  if(libraryOperationBusy)return{ok:false,message:"Espera a que termine la operación de la biblioteca."};
  if(microsoftOperationBusy||microsoftClient.status().busy)return {ok:false,message:"Espera a que termine la operación de Microsoft."};
  if (repairController?.busy) return { ok: false, message: "Espera a que termine la reparación de la instalación." };
  if (launchBusy) return { ok: false, message: "Ya se está preparando el inicio de Minecraft." };
  launchBusy = true;
  try { return await launchForgePrepared(); }
  finally { launchBusy = false; }
}
async function launchForgePrepared() {
  if (launcherUpdates.ready||['downloading','waiting','restarting'].includes(launcherUpdates.getState().phase)) return { ok:false, updating:true, message:"Hay una actualización del launcher lista. Se instalará automáticamente antes de jugar." };
  if (packUpdateBusy) return { ok: false, message: "Espera a que termine la actualización del modpack." };
  if (minecraftProcess) return { ok: false, message: "Minecraft ya está en ejecución." };
  await verifySelectedPack();
  const accountUsername = config.catalogEnabled ? authClient.status().user?.username||null : await authClient.verifiedUsername();
  if (!accountUsername && !getLocalProfile().username) return { ok: false, message: "Inicia sesión o guarda un nombre para jugar localmente." };
  if(config.catalogEnabled&&!fs.existsSync(path.join(metadataDir,"installed.json")))return{ok:false,needsInstallation:true,message:"Descarga esta instancia desde la biblioteca antes de jugar."};
  const manifest = await prepareSelectedGame(config.catalogEnabled);
  const update = await verifyPackBeforePlay(manifest);
  if (!update.ok) return update;
  // Verificar Microsoft después de las descargas para no arrancar con un token vencido.
  const microsoft = await microsoftClient.identity();
  const launch = buildForgeLaunch(accountUsername,microsoft);
  await checkJava17(launch.java);
  if (minecraftProcess) return { ok: false, message: "Minecraft ya está en ejecución." };
  if (packUpdateBusy) return { ok: false, message: "Espera a que termine la actualización del modpack." };
  const defaults = gameKey(currentGame) === gameKey(defaultGame) ? path.join(__dirname,"champagne-defaults") : null;
  const bundle = activeBundle(metadataDir,defaults);
  if (!bundle) throw new Error("Falta instalar el contenido de este servidor antes de jugar.");
  syncBundledConfigs({ instanceDir, metadataDir, bundleDir: bundle, status: sendStatus });
  writeAtomic(path.join(appRoot,"metadata","active-game.json"),Buffer.from(JSON.stringify(currentGame)));
  fs.mkdirSync(path.join(instanceDir, "logs"), { recursive: true });
  await verifySelectedPack();
  if(authClient.status().provider==='discord'&&(config.catalogEnabled?authClient.status().user?.username:await authClient.verifiedUsername())!==accountUsername)throw Error('La cuenta cambió durante la preparación. Inicia sesión nuevamente.');
  sendStatus(`Iniciando Forge ${config.forgeVersion} con ${launch.ramMB} MB y ${launch.classpathCount} archivos en classpath…`);
  return new Promise((resolve, reject) => {
    const child = spawn(launch.java, launch.args, {
      cwd: instanceDir, windowsHide: false, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PATH: path.join(instanceDir, "natives") + path.delimiter + (process.env.PATH || "") }
    });
    minecraftProcess = child; publishPlayState();
    let settled = false, tail = "", lines = 0;
    const logFile = path.join(instanceDir, "logs", "champagne-launcher.log");
    const stream = fs.createWriteStream(logFile, { flags: "a" });
    const handle = data => {
      const s = redact(data.toString().split(microsoft?.accessToken || "\u0000").join("[token oculto]"));
      stream.write(s);
      tail = (tail + s).slice(-7000);
      for (const line of s.split(/\r?\n/)) {
        if (line.trim() && ++lines <= 30) sendStatus(`Minecraft: ${line.slice(0, 250)}`);
      }
    };
    child.stdout.on("data", handle);
    child.stderr.on("data", handle);
    child.on("error", err => {
      minecraftProcess = null; publishPlayState();
      stream.end();
      sendStatus(`No se pudo iniciar Java: ${err.message}`, "error");
      if (!settled) { settled = true; reject(err); }
    });
    child.on("spawn", () => {
      sendStatus(`Proceso Java iniciado (PID ${child.pid}). Esperando ventana de Minecraft…`, "success");
      if (!settled) { settled = true; resolve({ ok: true, message: `Java iniciado (PID ${child.pid}). Comprueba si aparece Minecraft; el registro está en logs/champagne-launcher.log.` }); }
    });
    child.on("close", code => {
      minecraftProcess = null; publishPlayState();
      stream.end();
      sendStatus(code === 0 ? "Minecraft se cerró normalmente." : `Minecraft terminó con código ${code}. Revisa logs/champagne-launcher.log. ${tail.slice(-450)}`, code === 0 ? "info" : "error");
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000, height: 680, minWidth: 820, minHeight: 580,
    backgroundColor: "#0b0d12",
    title: "VillaWolf Launcher",
    icon: path.join(__dirname, 'assets', 'villawolf-icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "index.html"));
}
function needsForgeInstall() {
  try {
    const forge = readJsonFile(path.join(appRoot, "versions", forgeVersionId(), `${forgeVersionId()}.json`));
    if (forge.inheritsFrom && forge.inheritsFrom !== config.minecraftVersion) return true;
    return (forge.libraries || []).some(lib => {
      if (!libraryApplies(lib)) return false;
      const relative = forgeArtifactPath(lib);
      if (!relative) return true;
      const file = resolveLibrary(relative);
      return !fs.existsSync(file) || (lib.downloads?.artifact?.sha1 && !verifyLocal(file, lib.downloads.artifact.sha1));
    });
  } catch { return true; }
}
function localGameReady() {
  try {
    if (needsForgeInstall()) return false;
    const version = readJsonFile(path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.json`));
    const report = readJsonFile(path.join(metadataDir, "forge-check.json"));
    if (version.javaVersion?.majorVersion && version.javaVersion.majorVersion !== (config.javaMajor || 17)) return false;
    if (report.forgeId !== forgeVersionId() || report.missing?.length || report.dllCount < 7) return false;
    if (!verifyLocal(path.join(appRoot, "versions", config.minecraftVersion, `${config.minecraftVersion}.jar`), version.downloads.client.sha1)) return false;
    const index = readJsonFile(path.join(appRoot, "assets", "indexes", `${version.assetIndex.id}.json`));
    for (const asset of Object.values(index.objects || {})) {
      if (!/^[a-f0-9]{40}$/i.test(asset.hash)) return false;
      const file = path.join(appRoot, "assets", "objects", asset.hash.slice(0, 2), asset.hash);
      if (!fs.existsSync(file) || fs.statSync(file).size !== asset.size) return false;
    }
    for (const lib of version.libraries || []) {
      if (!libraryApplies(lib)) continue;
      const artifact = lib.downloads?.artifact;
      if (artifact?.path && !verifyLocal(resolveLibrary(artifact.path), artifact.sha1)) return false;
    }
    for (const dll of ["lwjgl.dll", "glfw.dll", "jemalloc.dll", "OpenAL.dll", "lwjgl_opengl.dll", "lwjgl_stb.dll", "lwjgl_tinyfd.dll"]) {
      const file = path.join(instanceDir, "natives", dll);
      if (!fs.existsSync(file) || fs.statSync(file).size === 0) return false;
    }
    return true;
  } catch { return false; }
}
const automaticPreparation = createPreparation({
  ensureJava: ensureJavaForLauncher, isReady: localGameReady, downloadGame: downloadGameFiles,
  needsForgeInstall, installForge, prepareNatives: prepareWindowsNatives,
  otherBusy: () => !!minecraftProcess || !!repairController?.busy || packUpdateBusy || nativePrepBusy || gameDownloadBusy || forgeInstallBusy,
  status: sendStatus
});
const launcherUpdates = createLauncherUpdates({ app, feed:config.launcherUpdateUrl,
  loadUpdater:()=>require("electron-updater").autoUpdater,
  isBusy:()=>!!minecraftProcess || !!repairController?.busy || launchBusy || !!gamePreparationPending || packUpdateBusy || automaticPreparation.busy || manualDialogBusy || libraryOperationBusy || forgeInstallBusy || nativePrepBusy || gameDownloadBusy,
  progress:sendProgress,
  onState:state=>{ for (const win of BrowserWindow.getAllWindows()) win.webContents.send('launcher-update-state',state); },
  status:sendStatus });
async function manualPreparation(action) {
  if (repairController?.busy) return { ok: false, message: "Espera a que termine la reparación." };
  if (automaticPreparation.busy || minecraftProcess || packUpdateBusy || forgeInstallBusy || nativePrepBusy || gameDownloadBusy) return { ok: false, message: "Espera a que termine la preparación actual o cierra Minecraft." };
  return action();
}
repairController = createRepair({
  isBusy: () => !!minecraftProcess || launchBusy || !!gamePreparationPending || automaticPreparation.busy || packUpdateBusy || manualDialogBusy || libraryOperationBusy || forgeInstallBusy || nativePrepBusy || gameDownloadBusy,
  manifest: async () => { const value = await assistedManifest({freshPermission:true}); selectGame(value, true); return value; },
  java: ensureJavaForLauncher, game: downloadGameFiles, forgeNeeded: needsForgeInstall,
  forge: installForge, natives: prepareWindowsNatives, pack: applyUpdates,
  content: () => syncBundledConfigs({ instanceDir, metadataDir, bundleDir: activeBundle(metadataDir, path.join(__dirname, "champagne-defaults")), status: sendStatus }),
  status: sendStatus, progress: sendProgress
});
app.whenReady().then(() => {
  ipcMain.handle('uninstall-launcher', async event => {
    if (!app.isPackaged) return {ok:false,message:'La desinstalación está disponible en la aplicación instalada.'};
    const busy=()=>minecraftProcess || accountLaunchBusy || launchBusy || gamePreparationPending || repairController?.busy || packUpdateBusy || automaticPreparation.busy || manualDialogBusy || libraryOperationBusy || forgeInstallBusy || nativePrepBusy || gameDownloadBusy || launcherUpdates.ready || ['checking','downloading','waiting','restarting'].includes(launcherUpdates.getState().phase);
    if (busy()) return {ok:false,message:'Cierra Minecraft y espera a que terminen las descargas o actualizaciones antes de desinstalar.'};
    const owner=BrowserWindow.fromWebContents(event.sender);
    const choice=await dialog.showMessageBox(owner,{type:'warning',title:'Desinstalar VillaWolf',message:'¿Qué quieres eliminar?',detail:'Sólo aplicación: conserva Minecraft, mods, mundos y ajustes para una futura instalación.\n\nAplicación y datos: elimina también Java descargado por VillaWolf, Minecraft, mods, mundos, skins y configuraciones de VillaWolf. Tu carpeta de CurseForge y Java del sistema se conservan.',buttons:['Cancelar','Sólo aplicación','Aplicación y todos sus datos'],defaultId:0,cancelId:0,noLink:true});
    if(choice.response===0)return {ok:true,message:'Desinstalación cancelada.'};
    const removeData=choice.response===2;
    if(removeData){const confirmation=await dialog.showMessageBox(owner,{type:'warning',title:'Eliminar mundos y datos',message:'Se eliminarán permanentemente los mundos y ajustes guardados en VillaWolf.',detail:'Haz una copia de tus mundos antes de continuar. Esta acción no se puede deshacer.',buttons:['Conservar todo','Eliminar y desinstalar'],defaultId:0,cancelId:0,noLink:true});if(confirmation.response!==1)return {ok:true,message:'Desinstalación cancelada. Tus datos se conservan.'};}
    if (busy()) return {ok:false,message:'Comenzó otra operación; espera a que termine antes de desinstalar.'};
    const exe=app.getPath('exe'),dir=path.dirname(exe),uninstaller=['Uninstall VillaWolf Launcher.exe','Uninstall Mi Launcher.exe'].map(name=>path.join(dir,name)).find(file=>fs.existsSync(file));
    const plan=require('./champagne-uninstall').uninstallPlan({roaming:app.getPath('appData'),userData:app.getPath('userData'),gameRoot:appRoot,launcherExe:exe,uninstaller,removeData});
    const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'villawolf-uninstall-')),script=path.join(temporary,'uninstall-launcher.ps1'),planFile=path.join(temporary,'plan.json');
    fs.copyFileSync(path.join(__dirname.replace('app.asar','app.asar.unpacked'),'uninstall-launcher.ps1'),script);fs.writeFileSync(planFile,JSON.stringify(plan));
    const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-PlanFile',planFile,'-LauncherPid',String(process.pid)],{detached:true,windowsHide:true,stdio:'ignore'});
    await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();setImmediate(()=>app.quit());
    return {ok:true,message:'Desinstalando VillaWolf…'};
  });
  ipcMain.handle("open-discord", async () => { await shell.openExternal("https://discord.gg/K2uWjjEJu"); return { ok: true, message: "Discord del servidor abierto." }; });
  ipcMain.handle("close-launcher", () => { setImmediate(() => app.quit()); return { ok: true }; });
  ipcMain.handle("memory-profiles", () => memoryProfiles(os.totalmem()));
  ipcMain.handle("diagnostics", (_event, message) => { lastProblem = typeof message === "string" ? message.slice(0, 8000) : ""; return { ...explainError(lastProblem), log: diagnostics() }; });
  ipcMain.handle("copy-diagnostics", () => { clipboard.writeText(diagnostics()); return { ok: true, message: "Registro copiado." }; });
  ipcMain.handle('open-error-log',async()=>{const dir=path.join(instanceDir,'logs');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'villawolf-diagnostico.txt');writeAtomic(file,Buffer.from(diagnostics(),'utf8'));const error=await shell.openPath(file);return {ok:!error,message:error||'Registro abierto.'};});
  ipcMain.handle("open-logs", async () => { const dir = path.join(instanceDir, "logs"); fs.mkdirSync(dir, { recursive: true }); const error = await shell.openPath(dir); return { ok: !error, message: error || "Carpeta de registros abierta." }; });
  ipcMain.handle("repair-installation", async () => {
    try { return await repairController.run(); }
    catch (error) { sendStatus(error.message, "error"); return { ok: false, message: error.message }; }
  });
  ensureDirs();
    // Leer configuración del launcher
  ipcMain.handle("get-settings", () => {
    return getSettings();
  });

  // Guardar configuración del launcher
  ipcMain.handle("save-settings", (_event, settings) => {
    try {
      return saveSettings(settings);
    } catch (error) {
      return {
        ok: false,
        message: error.message
      };
    }
  });
  ipcMain.handle("account-avatar", async () => {
    const user=microsoftClient.status().user,username=avatarUsername();
    if(user?.skinUrl){
      const key=user.id+'|'+user.skinUrl;
      if(officialAvatarKey===key){const saved=avatarStore.get(username);if(saved.image)return saved;}
      try{
        const response=await fetch(user.skinUrl,{redirect:'error',signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw Error('Skin oficial no disponible.');
        const chunks=[];let total=0;for await(const part of response.body){total+=part.length;if(total>256*1024)throw Error('Skin demasiado grande.');chunks.push(Buffer.from(part));}
        if(microsoftClient.status().user?.id!==user.id||microsoftClient.status().user?.skinUrl!==user.skinUrl)return {ok:true,image:null};
        const result=avatarStore.saveBytes(username,Buffer.concat(chunks));officialAvatarKey=key;return result;
      }catch{return avatarStore.get(username);}
    }
    return avatarStore.get(username);
  });
  ipcMain.handle("choose-account-avatar", async event => {
    if (avatarDialogBusy) return { ok: false, message: "Ya hay una selección de skin abierta." };
    avatarDialogBusy = true;
    try {
      if(microsoftClient.status().user)return {ok:false,message:"Usa Cambiar skin oficial para personalizar tu cuenta Microsoft."};
      const username = avatarUsername();
      if (!username) return { ok: false, message: "Elige primero una cuenta o un nombre local." };
      const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), { title: "Elegir skin para el avatar del launcher", filters: [{ name: "Skin Minecraft PNG", extensions: ["png"] }], properties: ["openFile"] });
      if (result.canceled || !result.filePaths.length) return { ok: true, cancelled: true };
      if (avatarUsername() !== username) return { ok: false, message: "La cuenta cambió. Selecciona la skin nuevamente." };
      return avatarStore.save(username, result.filePaths[0]);
    } catch (error) { return { ok: false, message: error.message }; }
    finally { avatarDialogBusy = false; }
  });
  ipcMain.handle("reset-account-avatar", () => {
    try { return avatarStore.clear(avatarUsername()); }
    catch (error) { return { ok: false, message: error.message }; }
  });
  ipcMain.handle("auth-status", () => ({...authClient.status(),microsoft:microsoftClient.status()}));
  const accountOperation = action => {
    if (microsoftOperationBusy || microsoftClient.status().busy) return {ok:false,message:"Espera o cancela la solicitud Microsoft."};
    if (minecraftProcess || accountLaunchBusy) return { ok: false, message: "Espera a que termine el inicio y cierra Minecraft antes de cambiar de cuenta." };
    return action();
  };
  const microsoftOperation=action=>accountOperation(async()=>{microsoftOperationBusy=true;try{return await action();}finally{microsoftOperationBusy=false;}});
  ipcMain.handle("auth-register", (_event, input) => accountOperation(() => authClient.register(input)));
  ipcMain.handle("auth-login", (_event, input) => accountOperation(() => authClient.login(input)));
  ipcMain.handle("auth-discord-login", () => accountOperation(() => authClient.loginDiscord()));
  ipcMain.handle("auth-discord-cancel", () => authClient.cancelDiscordLogin());
  ipcMain.handle('microsoft-status',()=>microsoftClient.status());
  ipcMain.handle('microsoft-login',()=>microsoftOperation(async()=>{
   await authClient.verifiedUsername();
   const result=await dialog.showMessageBox({type:'info',title:'Cuenta Minecraft Java',message:'Usar tu identidad oficial de Minecraft',detail:'Al vincular Microsoft, Minecraft usará tu nombre y UUID oficiales. Podrías aparecer con otro inventario en mundos que usaban tu identidad local. Tus mundos se conservarán.',buttons:['Continuar','Cancelar'],defaultId:1,cancelId:1});
   return result.response===0?microsoftClient.login():{ok:true,cancelled:true,...microsoftClient.status()};
  }));
  ipcMain.handle('microsoft-cancel',()=>microsoftClient.cancel());
  ipcMain.handle('microsoft-logout',()=>accountOperation(()=>microsoftClient.logout()));
  ipcMain.handle('microsoft-skin',(_event,variant)=>microsoftOperation(async()=>{
   try{
    if(!['classic','slim'].includes(variant))throw Error('Elige el tipo de brazos.');
    if(!microsoftClient.status().user)throw Error('Inicia sesión con Microsoft.');
    const result=await dialog.showOpenDialog({title:'Cambiar skin oficial de Minecraft',filters:[{name:'Skin Minecraft PNG',extensions:['png']}],properties:['openFile']});
    if(result.canceled)return {ok:true,cancelled:true};
    const file=result.filePaths[0],stat=fs.lstatSync(file);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size>256*1024)throw Error('Skin inválida.');
    const bytes=fs.readFileSync(file),image=nativeImage.createFromBuffer(bytes),size=image.getSize();
    if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||image.isEmpty()||size.width!==64||![32,64].includes(size.height))throw Error('Selecciona una skin PNG de 64 × 64 o 64 × 32.');
    const confirm=await dialog.showMessageBox({type:'question',title:'Cambiar skin oficial',message:'Esta skin se cambiará en tu cuenta de Minecraft.',detail:'Se verá también al jugar desde otros launchers. Puedes cambiarla nuevamente.',buttons:['Cambiar skin','Cancelar'],defaultId:1,cancelId:1});
    if(confirm.response!==0)return {ok:true,cancelled:true};
    return await microsoftClient.uploadSkin(image.toPNG(),variant);
   }catch(e){return {ok:false,message:e.message};}
  }));
  ipcMain.handle("auth-logout", () => accountOperation(async()=>{microsoftClient.logout();selectedPack=null;authorizedCatalog=[];catalogUserId=null;libraryCache.clear();publishCatalog();return {...await authClient.logout(),microsoft:microsoftClient.status()};}));
  ipcMain.handle("get-local-profile", () => getLocalProfile());
  ipcMain.handle("save-local-profile", (_event, username) => saveLocalProfile(username));
  ipcMain.handle("play-state",()=>playState());
  ipcMain.handle("launch-forge", async () => {
    if (accountLaunchBusy) return { ok: false, message: "Minecraft se está iniciando." };
    accountLaunchBusy = true; publishPlayState();
    try { return await launchForge(); }
    catch (e) { return await launchProblem(e); }
    finally { accountLaunchBusy = false; publishPlayState(); }
  });
  ipcMain.handle("prepare-game", async () => {
    try { await prepareSelectedGame(); return {ok:true,message:"Java, Minecraft y Forge preparados."}; }
    catch (e) { return await launchProblem(e); }
  });
  ipcMain.handle("prepare-windows-natives", async () => {
    try { return await manualPreparation(prepareWindowsNatives); }
    catch (e) { sendStatus(e.message, "error"); return {ok:false,message:e.message}; }
  });
  ipcMain.handle("download-game-files", async () => {
    try { return await manualPreparation(downloadGameFiles); }
    catch (e) { sendStatus(e.message, "error"); return { ok: false, message: e.message }; }
  });
  ipcMain.handle("prepare-minecraft", async () => {
    try { return await manualPreparation(prepareMinecraftMetadata); }
    catch (e) { sendStatus(e.message, "error"); return { ok: false, message: e.message }; }
  });
  ipcMain.handle('pack-download',async(_event,id)=>{
    if(libraryOperationBusy||minecraftProcess||launchBusy||accountLaunchBusy||manualDialogBusy||packUpdateBusy||repairController?.busy)return{ok:false,message:'Espera a que termine la tarea o cierra Minecraft.'};libraryOperationBusy=true;publishPlayState();
    try{await selectPack(id,true);const manifest=await prepareSelectedGame();const result=await verifyPackBeforePlay(manifest);return{...result,selectedId:id};}catch(error){return launchProblem(error);}finally{libraryOperationBusy=false;publishPlayState();}
  });
  ipcMain.handle('pack-remove-local',async(event,id)=>{
    if(libraryOperationBusy||minecraftProcess||launchBusy||accountLaunchBusy||manualDialogBusy||packUpdateBusy||automaticPreparation.busy||repairController?.busy)return{ok:false,message:'Cierra Minecraft y espera a que termine la tarea.'};libraryOperationBusy=true;publishPlayState();
    try{await selectPack(id,true);const {confirmPublication}=require('./champagne-pack-confirmation');const answer=await confirmPublication(BrowserWindow.fromWebContents(event.sender),{title:'Borrar instalación local',message:'¿Borrar la instalación de '+selectedPack.name+'?',detail:'Se eliminan los mods y archivos instalados de este modpack en esta PC. Tus mundos, capturas y opciones se conservan por defecto. No cambia el catálogo ni afecta a otros jugadores. Podrás volver a descargarla.',checkboxLabel:'Borrar también mis mundos, capturas y opciones de esta instalación',buttons:['Cancelar','Borrar instalación']});if(answer.response!==1)return{ok:true,cancelled:true};await verifySelectedPack();const result=require('./champagne-pack-removal').removeLocalPack({root:appRoot,game:currentGame,removeWorlds:answer.removeWorlds});downloadInboxSession=null;packCardImages.delete(id);return{ok:true,...result,message:result.keptWorlds?'Instalación borrada. Tus mundos y opciones se conservan.':'Instalación y datos locales borrados.'};}catch(error){return{ok:false,message:error.message};}finally{libraryOperationBusy=false;publishPlayState();}
  });
  ipcMain.handle('pack-open-folder',async(_event,id)=>{try{await selectPack(id);ensureDirs();await shell.openPath(instanceDir);return{ok:true};}catch(error){return{ok:false,message:error.message};}});
  ipcMain.handle("pack-catalog",()=>refreshCatalog());
  ipcMain.handle("select-pack",async(_event,id)=>{try{return await selectPack(id);}catch(error){if(error.code==='LAUNCHER_UPDATE_REQUIRED')return launchProblem(error);return {ok:false,message:error.message};}});
  ipcMain.handle("get-info", () => ({
    catalogEnabled:config.catalogEnabled,selectedPackId:selectedPack?.id||null,
    packName: config.catalogEnabled&&!selectedPack?"Tus modpacks":packPresentation?.packName || config.packName, subtitle: config.packSubtitle,
    presentation:config.catalogEnabled&&!selectedPack?null:viewPresentation(packPresentation?.presentation),packVersion:selectedPack||!config.catalogEnabled?packPresentation?.version:null,
    minecraftVersion: config.minecraftVersion, forgeVersion: config.forgeVersion,
    javaMajor:config.javaMajor || 17, launcherVersion:config.launcherVersion, instanceDir, appRoot
  }));
  ipcMain.handle('refresh-presentation',async()=>{
    try{
      const manifest=await assistedManifest();
      const game=validateGame(manifest.game,defaultGame,config.launcherVersion);
      const presentation=validatePresentation(manifest.presentation);
      if(presentation?.background&&nativeImage.createFromDataURL(viewPresentation(presentation).background).isEmpty())throw Error('Imagen del modpack inválida.');
      const next={packName:game.packName,version:manifest.version,presentation};
      if(fs.existsSync(presentationCache)&&fs.lstatSync(presentationCache).isSymbolicLink())throw Error('Caché de presentación inválida.');
      fs.mkdirSync(path.dirname(presentationCache),{recursive:true});
      const temporary=presentationCache+'.'+crypto.randomUUID()+'.tmp';
      try{fs.writeFileSync(temporary,JSON.stringify(next),{flag:'wx'});fs.renameSync(temporary,presentationCache);}
      finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
      packPresentation=next;return{ok:true};
    }catch(error){return{ok:false,message:error.message};}
  });
  ipcMain.handle("launcher-update-status",()=>launcherUpdates.getState());
  ipcMain.handle("check-launcher-update",()=>launcherUpdates.check());
  ipcMain.handle("install-forge", async () => {
    try { return await manualPreparation(installForge); }
    catch (e) { sendStatus(e.message, "error"); return { ok: false, message: e.message }; }
  });
  ipcMain.handle("update-pack", async () => {
    if (repairController?.busy) return { ok: false, message: "Espera a que termine la reparación." };
    try { const manifest=await assistedManifest({freshPermission:true});selectGame(manifest);return await applyUpdates(manifest); }
    catch (e) { sendStatus(e.message, "error"); return { ok: false, message: e.message }; }
  });
  ipcMain.handle("assisted-status", async () => {
    try { return await assistedStatus(); }
    catch (error) { return { ok: false, message: error.message }; }
  });
  ipcMain.handle('assisted-download-all',async()=>{
    if(minecraftProcess||manualDialogBusy||packUpdateBusy||automaticPreparation.busy||repairController?.busy||accountLaunchBusy)return{ok:false,message:'Espera a que termine la preparación o cierra Minecraft.'};
    manualDialogBusy=true;
    try{const manifest=await assistedManifest({freshPermission:true});selectGame(manifest);const manual=manualDownloads(manifest),pending=new Set(manual.pending().map(e=>e.path)),entries=manifest.files.filter(e=>pending.has(e.path));const rejected=[],accepted=[];
      const {downloadOfficial}=require('./champagne-curseforge-batch');const downloadSession=session.fromPartition('villawolf-curseforge-batch-'+crypto.randomUUID());
      for(let i=0;i<entries.length;i++){const entry=entries[i];let file;try{let apiBytes=null;try{if(config.catalogEnabled&&selectedPack)apiBytes=await authClient.downloadCurseforge({packId:selectedPack.id,path:entry.path},state=>{for(const target of BrowserWindow.getAllWindows())if(!target.isDestroyed())target.webContents.send('assisted-batch-state',{name:entry.path,index:i+1,count:entries.length,...state});});}catch(error){if([401,403].includes(error.status))throw error;sendStatus('Este mod necesita su página oficial. Continuando con la descarga asistida…');}if(apiBytes){if(sha256(apiBytes)!==entry.sha256.toLowerCase())throw Error('El archivo de CurseForge no coincide con el modpack.');const directory=path.join(metadataDir,'official-downloads');fs.mkdirSync(directory,{recursive:true});file=path.join(directory,crypto.randomUUID()+'.jar');fs.writeFileSync(file,apiBytes,{flag:'wx'});}else file=await downloadOfficial({entry,BrowserWindow,session:downloadSession,directory:path.join(metadataDir,'official-downloads'),onState:state=>{for(const target of BrowserWindow.getAllWindows())if(!target.isDestroyed())target.webContents.send('assisted-batch-state',{...state,index:i+1,count:entries.length});}});const result=manual.importFiles([file]);if(result.rejected.length)throw Error(result.rejected[0].message);accepted.push(...result.accepted);for(const target of BrowserWindow.getAllWindows())if(!target.isDestroyed())target.webContents.send('assisted-batch-state',{index:i+1,count:entries.length,missing:manual.pending()});}catch(error){rejected.push({name:entry.path,message:error.message});break;}finally{if(file)try{fs.unlinkSync(file);}catch{}}}
      return{ok:true,accepted,rejected,missing:manual.pending(),version:manifest.version,expectedFiles:manifest.expectedFiles,remote:!!config.manifestUrl,message:accepted.length+' mods verificados.'};
    }catch(error){return{ok:false,message:error.message};}finally{manualDialogBusy=false;}
  });
  ipcMain.handle("assisted-open-page", async (_event, relative) => {
    try {
      const manifest = await assistedManifest({freshPermission:true});
      const entry = manifest.files.find(e => e.path === relative);
      if (!entry || validateAcquisition(entry) !== "manual") throw new Error("Descarga oficial desconocida.");
      await shell.openExternal(entry.pageUrl);
      return { ok: true, message: "Versión exacta abierta. Descarga el JAR en Descargas; el launcher lo detectará y verificará automáticamente." };
    } catch (error) { return { ok: false, message: error.message }; }
  });
  ipcMain.handle("assisted-import", async event => {
    if (repairController?.busy || manualDialogBusy || packUpdateBusy) return { ok: false, message: "Espera a que termine la operación actual." };
    manualDialogBusy = true;
    try {
      const manifest = await assistedManifest();
      selectGame(manifest);
      const selection = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
        title: "Seleccionar los mods descargados", defaultPath: app.getPath("downloads"),
        properties: ["openFile", "multiSelections"], filters: [{ name: "Mods Minecraft", extensions: ["jar"] }]
      });
      if (selection.canceled) return { ok: true, cancelled: true };
      const result = manualDownloads(manifest).importFiles(selection.filePaths);
      return { ...result, ok: result.rejected.length === 0,
        message: `${result.accepted.length} archivo(s) verificado(s); ${result.rejected.length} rechazado(s). Tus mods aún no se han modificado.` };
    } catch (error) { return { ok: false, message: error.message }; }
    finally { manualDialogBusy = false; }
  });
  ipcMain.handle("assisted-scan-downloads", async () => {
    try {
      if (!downloadInboxSession || downloadInboxSession.game !== gameKey(currentGame)) return { ok: false, message: "Vuelve a revisar el modpack para detectar descargas." };
      if (manualDialogBusy || packUpdateBusy) return { ok: true, busy: true };
      const result = downloadInboxSession.inbox.scan();
      return { ok: true, ...result, version: downloadInboxSession.manifest.version,
        expectedFiles: downloadInboxSession.manifest.expectedFiles, remote: !!config.manifestUrl,
        canInstall: !minecraftProcess && !repairController?.busy && !launchBusy && !automaticPreparation.busy && !forgeInstallBusy && !nativePrepBusy && !gameDownloadBusy };
    } catch (error) { return { ok: false, message: error.message }; }
  });
  ipcMain.handle("assisted-install", async () => {
    if (repairController?.busy) return { ok: false, message: "Espera a que termine la reparación." };
    if (manualDialogBusy) return { ok: false, message: "Termina de importar los archivos antes de instalar." };
    try { const manifest=await assistedManifest({freshPermission:true});selectGame(manifest);return await applyUpdates(manifest); }
    catch (error) { sendStatus(error.message, "error"); return { ok: false, message: error.message }; }
  });
  ipcMain.handle("open-folder", async () => {
    ensureDirs();
    await shell.openPath(path.join(appRoot,"instances"));
    return { ok: true };
  });
  createWindow();
  launcherUpdates.check();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
