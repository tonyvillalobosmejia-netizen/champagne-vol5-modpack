
const $ = (id) => document.getElementById(id);
let localUsername = "";
let avatarRequest = 0;
let launchProgressActive = false;

function hideOperationProgress() {
  for (const id of ['operationProgress', 'settingsProgress', 'downloadsProgress']) $(id).hidden = true;
}

function addLog(message, kind = "info", time = new Date().toLocaleTimeString()) {
  const row = document.createElement("div");
  row.className = `log-entry ${kind}`;

  const stamp = document.createElement("span");
  stamp.className = "log-time";
  stamp.textContent = time;

  const text = document.createElement("span");
  text.textContent = message;

  row.append(stamp, text);
  $("log").prepend(row);
}

async function runButton(button, action, label) {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = label;

  try {
    const result = await action();

    addLog(
      result.message || (result.ok ? "Operación completada." : "La operación no terminó."),
      result.ok ? "success" : "error"
    );
    if (!result.ok && !result.needsManual) showError(result.message || "La operación no terminó.");
  } catch (err) {
    addLog(err.message || String(err), "error");
    showError(err.message || String(err));
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

// INFORMACIÓN DEL MODPACK
function refreshGameInfo() { return window.launcher.getInfo().then(info => {
  $("packName").textContent = info.packName;
  $("packSubtitle").textContent = info.subtitle;
  $("mcVersion").textContent = `Minecraft ${info.minecraftVersion}`;
  $("forgeVersion").textContent = `Forge ${info.forgeVersion}`;
  $("javaVersion").textContent = `JAVA ${info.javaMajor || 17}`;
  $("launcherVersion").textContent = `VILLAWOLF · LAUNCHER ${info.launcherVersion}`;
  $("launcherBuild").textContent = `/ BUILD ${info.launcherVersion}`; $("homeUpdateStatus").textContent = `Launcher ${info.launcherVersion}. El modpack se verifica antes de jugar.`;

  addLog(`Carpeta de instancia: ${info.instanceDir}`);
}); }
refreshGameInfo();
async function refreshLauncherUpdateStatus() {
  const state=await window.launcher.getLauncherUpdateStatus();
  $('launcherUpdateStatus').textContent=state.message;
}
$('launcherUpdateBtn').addEventListener('click',()=>runButton($('launcherUpdateBtn'),async()=>{
  const result=await window.launcher.checkLauncherUpdate();await refreshLauncherUpdateStatus();return result;
},'BUSCANDO…'));
setInterval(()=>refreshLauncherUpdateStatus().catch(()=>{}),5000);

// INSTALAR FORGE
$("forgeBtn").addEventListener("click", () =>
  runButton(
    $("forgeBtn"),
    () => window.launcher.installForge(),
    "INSTALANDO…"
  )
);

// ACTUALIZAR MODPACK
$("updateBtn").addEventListener("click", openDownloads);

// ABRIR CARPETA
$("folderBtn").addEventListener("click", async () => {
  await window.launcher.openFolder();
  addLog("Carpeta de la instancia abierta.");
});

// LIMPIAR ACTIVIDAD
$("clearLog").addEventListener("click", () => {
  $("log").replaceChildren();
});

// MENSAJES DE ELECTRON
window.launcher.onStatus(({ message, kind, time }) => {
  addLog(message, kind, time);
  if (kind === "error") { showError(message); window.launcher.getAuthStatus().then(showAccountState).catch(()=>{}); }
});
window.launcher.onProgress(data => {
  if (data.phase === 'complete' || data.phase === 'error') {
    hideOperationProgress();
    return;
  }
  const known = data.totalBytes > 0 ? data.bytes / data.totalBytes : data.total > 0 ? data.done / data.total : null;
  const detail = [];
  if (data.total > 0) detail.push(`${data.done}/${data.total} archivos o pasos`);
  if (Number.isFinite(data.bytes)) detail.push(`${(data.bytes / 1048576).toFixed(1)} MB${data.totalBytes > 0 ? ' de ' + (data.totalBytes / 1048576).toFixed(1) + ' MB' : ''}`);
  if (data.bytesPerSecond > 0) detail.push(`${(data.bytesPerSecond / 1048576).toFixed(1)} MB/s`);
  for (const [box, label, bar, text] of [['operationProgress','progressLabel','progressBar','progressDetail'],['settingsProgress','settingsProgressLabel','settingsProgressBar','settingsProgressDetail'],['downloadsProgress','downloadsProgressLabel','downloadsProgressBar','downloadsProgressDetail']]) {
    $(box).hidden = box === 'operationProgress' && !launchProgressActive;
    $(label).textContent = data.label || 'Preparando el juego…';
    if (known === null) $(bar).removeAttribute('value'); else $(bar).value = Math.min(100, Math.max(0, known * 100));
    $(text).textContent = detail.join(' · ') || 'Esta tarea puede tardar unos momentos.';
  }
});
let errorRequest = 0, errorReturnFocus = null;
async function showError(message) {
  const request = ++errorRequest;
  if ($('errorOverlay').hidden) errorReturnFocus = document.activeElement;
  $('errorOverlay').hidden = false; $('errorPanel').focus();
  $('errorMessage').textContent = message; $('errorActionStatus').textContent = '';
  $('errorLog').value = 'Cargando registro…';
  try {
    const result = await window.launcher.getDiagnostics(message);
    if (request !== errorRequest || $('errorOverlay').hidden) return;
    $('errorTitle').textContent = result.title; $('errorHint').textContent = result.hint; $('errorLog').value = result.log;
  } catch { if (request === errorRequest) $('errorLog').value = 'No se pudo leer el registro.\n' + message; }
}
function closeError() { errorRequest++; $('errorOverlay').hidden = true; errorReturnFocus?.focus(); }
$('closeErrorBtn').addEventListener('click', closeError);
$('copyErrorBtn').addEventListener('click', async () => { try { const result = await window.launcher.copyDiagnostics(); $('errorActionStatus').textContent = result.message; } catch { $('errorActionStatus').textContent = 'No se pudo copiar. Puedes seleccionar el texto del registro.'; } });
$('openLogsBtn').addEventListener('click', async () => { try { const result = await window.launcher.openLogs(); $('errorActionStatus').textContent = result.message; } catch { $('errorActionStatus').textContent = 'No se pudo abrir la carpeta de registros.'; } });
$('errorPanel').addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeError(); }
  if (event.key !== 'Tab') return;
  const controls = [...$('errorPanel').querySelectorAll('button,textarea')]; const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === $('errorPanel'))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || document.activeElement === $('errorPanel'))) { event.preventDefault(); first.focus(); }
});

// ========================================
// AJUSTES DEL LAUNCHER
// ========================================

// ABRIR PANEL
$("settingsBtn")?.addEventListener("click", () => {
  navigate("settings");
  addLog("Abriendo ajustes del launcher...", "info");
});

// CERRAR PANEL
$("closeSettingsBtn")?.addEventListener("click", () => {
  navigate("home");
});

// GUARDAR MEMORIA RAM
$("saveSettingsBtn")?.addEventListener("click", async () => {
  const ramInput = $("ramInput");
  const ram = Number(ramInput.value);

  if (
    ramInput.value.trim() === "" ||
    !Number.isInteger(ram) ||
    ram < 1024
  ) {
    showError("Introduce una cantidad válida de RAM en MB (mínimo 1024).");
    return;
  }

  const saveButton = $("saveSettingsBtn");
  saveButton.disabled = true;

  try {
    const result = await window.launcher.saveSettings({
      ramMB: ram, performanceProfile: $('performanceProfile').value || 'custom'
    });

    if (!result.ok) {
      showError(result.message || "No se pudo guardar la configuración.");
      addLog(result.message || "Error al guardar RAM.", "error");
      return;
    }

    ramInput.value = result.ramMB;

    addLog(
      `Memoria RAM guardada correctamente: ${result.ramMB} MB`,
      "success"
    );

    navigate("home");

  } catch (error) {
    addLog(`Error al guardar RAM: ${error.message}`, "error");
    showError(error.message || "Ocurrió un error al guardar la configuración.");
  } finally {
    saveButton.disabled = false;
  }
});

// RECUPERAR CONFIGURACIÓN GUARDADA
async function loadRamSettings() {
  try {
    const hardware = await window.launcher.getMemoryProfiles();
    for (const profile of hardware.profiles) { const option = document.createElement('option'); option.value = profile.id; option.textContent = `${profile.name} · ${profile.ramMB} MB`; option.dataset.ram = profile.ramMB; $('performanceProfile').append(option); }
    $('memoryAdvice').textContent = `Tu equipo tiene ${hardware.totalMB} MB de RAM. Los perfiles reservan memoria para Windows y ajustan solo la RAM del juego; conservan tus gráficos, controles y shaders.`;
    const settings = await window.launcher.getSettings();

    if (settings && Number.isInteger(settings.ramMB)) {
      $("ramInput").value = settings.ramMB;
      $('performanceProfile').value = settings.performanceProfile || 'custom';

      addLog(
        `Configuración de RAM cargada: ${settings.ramMB} MB`,
        "success"
      );
    }

  } catch (error) {
    addLog(
      `Error al cargar configuración: ${error.message}`,
      "error"
    );
  }
}

// CARGAR CONFIGURACIÓN AL INICIAR
loadRamSettings();
$('performanceProfile').addEventListener('change', () => { const option = $('performanceProfile').selectedOptions[0]; if (option.dataset.ram) $('ramInput').value = option.dataset.ram; });
$('ramInput').addEventListener('input', () => { $('performanceProfile').value = 'custom'; });
$('repairBtn').addEventListener('click', () => runButton($('repairBtn'), async () => {
  const result = await window.launcher.repairInstallation();
  if (result.needsManual) { navigate("home"); await openDownloads(); }
  return result;
}, 'REPARANDO…'));

// PERFIL LOCAL (todavía no inicia Minecraft)
(async () => {
  try {
    const profile = await window.launcher.getLocalProfile();
    if (profile.username) {
      localUsername = profile.username;
      $("offlineUsername").value = profile.username;
      refreshSidebarAccount();
      $("profileStatus").textContent = `Perfil guardado: ${profile.username}`;
    }
  } catch (error) { addLog(`Error al leer perfil: ${error.message}`, "error"); }
})();
$("saveProfileBtn").addEventListener("click", async () => {
  const username = $("offlineUsername").value.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    $("profileStatus").textContent = "Usa de 3 a 16 caracteres: letras, números o guion bajo.";
    return;
  }
  try {
    const result = await window.launcher.saveLocalProfile(username);
    $("profileStatus").textContent = result.message;
    if (result.ok) { localUsername = result.username || username; refreshSidebarAccount(); }
    addLog(result.message, result.ok ? "success" : "error");
  } catch (error) { addLog(error.message, "error"); }
});

// Cuenta Champagne: el token permanece en el proceso principal.
let accountState = { configured: false, user: null };
let registering = false;
let accountBusy = false;
function showAccountState(state) {
  accountState = state;
  refreshSidebarAccount();
  $("authForm").hidden = !state.configured || !!state.user;
  $('authForm').hidden ||= state.provider === 'discord';
  $('discordLoginBtn').hidden = state.provider !== 'discord' || !state.configured || !!state.user;
  $("logoutAccountBtn").hidden = !state.user;
  $("localProfileDetails").hidden = !!state.user || state.required === true;
  if (state.user) $("authStatus").textContent = "Sesión iniciada como " + state.user.username + ".";
  else if (state.configured) $("authStatus").textContent = state.localDevelopment
    ? "Cuentas en prueba local. La conexión con el servidor de Minecraft todavía está pendiente."
    : "Inicia sesión o crea tu cuenta de VillaWolf.";
  else {
    $("authStatus").textContent = "Las cuentas estarán disponibles cuando se configure el servicio. Puedes jugar en modo local.";
    $("localProfileDetails").open = true;
  }
  if (state.provider === 'discord') $('authStatus').textContent = state.user
    ? `Discord: ${state.user.discordName || state.user.username}. Nombre de Minecraft: ${state.user.username}. El rol se comprobará al jugar.`
    : state.configured ? 'Inicia sesión con Discord. Debes pertenecer al servidor y tener el rol autorizado para jugar.' : 'El servicio de Discord todavía no está configurado.';
}
$('discordLoginBtn').addEventListener('click',async()=>{
  if(accountBusy)return;
  accountBusy=true; $('discordLoginBtn').disabled=true; $('playBtn').disabled=true;
  $('cancelDiscordLoginBtn').hidden=false;
  $('authStatus').textContent='Autoriza el acceso en el navegador. Esperando tu confirmación de Discord…';
  try { const result=await window.launcher.loginDiscord(); if(result.ok)showAccountState(result); else $('authStatus').textContent=result.message; }
  catch(error){ $('authStatus').textContent=error.message || 'No se pudo iniciar sesión con Discord.'; }
  finally { accountBusy=false; $('discordLoginBtn').disabled=false; $('playBtn').disabled=false; $('cancelDiscordLoginBtn').hidden=true; }
});
$('cancelDiscordLoginBtn').addEventListener('click',()=>window.launcher.cancelDiscordLogin().catch(()=>{}));
window.launcher.getAuthStatus().then(showAccountState).catch(() => {
  $("authStatus").textContent = "No se pudo comprobar el servicio de cuentas.";
  $("localProfileDetails").open = true;
});
$("authModeBtn").addEventListener("click", () => {
  registering = !registering;
  $("registrationFields").hidden = !registering;
  $("confirmPassword").required = registering;
  $("accountPassword").minLength = registering ? 12 : 1;
  $("accountPassword").autocomplete = registering ? "new-password" : "current-password";
  $("accountPassword").value = "";
  $("confirmPassword").value = "";
  $("authSubmitBtn").textContent = registering ? "CREAR CUENTA" : "INICIAR SESIÓN";
  $("authModeBtn").textContent = registering ? "YA TENGO UNA CUENTA" : "CREAR UNA CUENTA";
});
$("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (accountBusy) return;
  const username = $("accountUsername").value.trim();
  const password = $("accountPassword").value;
  if (registering && password !== $("confirmPassword").value) {
    $("authStatus").textContent = "Las contraseñas no coinciden."; return;
  }
  accountBusy = true;
  $("authSubmitBtn").disabled = true; $("authModeBtn").disabled = true; $("playBtn").disabled = true;
  try {
    const result = await (registering ? window.launcher.registerAccount({ username, password }) : window.launcher.loginAccount({ username, password }));
    if (result.ok) showAccountState(result);
    else $("authStatus").textContent = result.message;
  } catch { $("authStatus").textContent = "No se pudo completar el inicio de sesión."; }
  finally {
    $("accountPassword").value = ""; $("confirmPassword").value = "";
    accountBusy = false;
    $("authSubmitBtn").disabled = false; $("authModeBtn").disabled = false; $("playBtn").disabled = false;
  }
});
$("logoutAccountBtn").addEventListener("click", async () => {
  if (accountBusy) return;
  accountBusy = true; $("logoutAccountBtn").disabled = true; $("playBtn").disabled = true;
  try {
    const result = await window.launcher.logoutAccount();
    if (result.ok) showAccountState(result);
    $("authStatus").textContent = result.message;
  } catch { $("authStatus").textContent = "No se pudo cerrar la sesión."; }
  finally { accountBusy = false; $("logoutAccountBtn").disabled = false; $("playBtn").disabled = false; }
});

// Ventana de cuenta y avatar de la barra lateral.
function refreshSidebarAccount() {
  const username = accountState.user?.username || localUsername;
  $("sidebarUsername").textContent = username || "Cuenta";
  $("sidebarUsername").title = username || "Cuenta"; $("accountBtn").title = username ? "Cuenta de " + username : "Tu cuenta";
  $("sidebarAccountType").textContent = accountState.user ? accountState.provider === 'discord' ? 'CUENTA DISCORD' : "CUENTA VILLAWOLF" : username ? "PERFIL LOCAL" : "SIN SESIÓN";
  $("accountBtn").setAttribute("aria-label", username ? "Gestionar cuenta de " + username : "Abrir cuenta");
  $("chooseAvatarBtn").disabled = !username;
  $("resetAvatarBtn").disabled = !username;
  $("sidebarAvatar").src = "./assets/avatar-default.svg";
  const requestId = ++avatarRequest;
  window.launcher.getAccountAvatar().then(result => {
    if (requestId === avatarRequest && result.ok && result.image) drawSkinAvatar(result.image, requestId);
  }).catch(() => {});
}
function drawSkinAvatar(source, requestId) {
  const skin = new Image();
  skin.onload = () => {
    if (requestId !== avatarRequest) return;
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false;
    context.drawImage(skin, 8, 8, 8, 8, 0, 0, 64, 64);
    context.drawImage(skin, 40, 8, 8, 8, 0, 0, 64, 64);
    $("sidebarAvatar").src = canvas.toDataURL("image/png");
  };
  skin.src = source;
}
function closeAccountPanel() {
  $("accountOverlay").hidden = true;
  $("accountBtn").setAttribute("aria-expanded", "false");
  $("accountPassword").value = ""; $("confirmPassword").value = "";
  $("accountBtn").focus();
}
$("accountBtn").addEventListener("click", () => {
  navigate("home");
  $("accountOverlay").hidden = false;
  $("accountBtn").setAttribute("aria-expanded", "true");
  $("accountPanel").focus();
});
$("closeAccountBtn").addEventListener("click", closeAccountPanel);
$("accountOverlay").addEventListener("click", event => { if (event.target === $("accountOverlay")) closeAccountPanel(); });
$("settingsBtn").addEventListener("click", () => {
  $("accountOverlay").hidden = true;
  $("accountBtn").setAttribute("aria-expanded", "false");
  $("accountPassword").value = ""; $("confirmPassword").value = "";
});
$("accountOverlay").addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeAccountPanel(); }
  if (event.key === "Tab") {
    const focusable = [...$("accountPanel").querySelectorAll('button, input, summary')].filter(element => !element.disabled && element.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === $("accountPanel"))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === $("accountPanel"))) { event.preventDefault(); first.focus(); }
  }
});
async function changeAvatar(clear = false) {
  if (accountBusy) return;
  $("chooseAvatarBtn").disabled = true; $("resetAvatarBtn").disabled = true;
  try {
    const result = await (clear ? window.launcher.resetAccountAvatar() : window.launcher.chooseAccountAvatar());
    if (result.ok && !result.cancelled) { refreshSidebarAccount(); $("avatarStatus").textContent = clear ? "Avatar predeterminado restaurado." : "Avatar actualizado. Solo cambia la imagen del launcher."; }
    else if (!result.ok) $("avatarStatus").textContent = result.message;
  } catch { $("avatarStatus").textContent = "No se pudo cambiar el avatar."; }
  finally { const username = accountState.user?.username || localUsername; $("chooseAvatarBtn").disabled = !username; $("resetAvatarBtn").disabled = !username; }
}
$("chooseAvatarBtn").addEventListener("click", () => changeAvatar());
$("resetAvatarBtn").addEventListener("click", () => changeAvatar(true));

// DESCARGAR METADATOS OFICIALES (fase previa al inicio real)
$("prepareBtn").addEventListener("click", () =>
  runButton($("prepareBtn"), () => window.launcher.prepareMinecraft(), "PREPARANDO…")
);

// DESCARGA DE RECURSOS Y LIBRERÍAS VANILLA
$("downloadGameBtn")?.addEventListener("click", () =>
  runButton($("downloadGameBtn"), () => window.launcher.downloadGameFiles(), "DESCARGANDO…")
);

// Revisar componentes desde Ajustes.
$("nativesBtn")?.addEventListener("click", () =>
  runButton($("nativesBtn"), () => window.launcher.prepareWindowsNatives(), "VERIFICANDO…")
);

// Paso 86: el botón principal utiliza el mismo arranque Forge ya probado.
$("playBtn")?.addEventListener("click", () =>
  runButton($("playBtn"), async () => {
    launchProgressActive = true;
    $('operationProgress').hidden = false;
    $('progressLabel').textContent = 'Comprobando archivos del juego…';
    $('progressBar').removeAttribute('value');
    $('progressDetail').textContent = 'Preparando el inicio de Minecraft.';
    try {
    const result = await window.launcher.launchForge();
    if (!result.ok) { try { showAccountState(await window.launcher.getAuthStatus()); } catch {} }
    await refreshGameInfo();
    if (result.needsManual) {
      await openDownloads();
      $('downloadsResult').textContent = 'Descarga los mods pendientes en Descargas. Se detectarán automáticamente; después de instalar el pack, vuelve a pulsar JUGAR.';
    }
    return result;
    } finally {
      launchProgressActive = false;
      hideOperationProgress();
    }
  }, "VERIFICANDO…")
);

// Preparar los componentes necesarios al abrir; JUGAR espera la misma operación.
window.launcher.prepareGame().then(result => {
  if (!result.ok) addLog(result.message + " Puedes reintentar pulsando JUGAR.", "error");
  refreshGameInfo();
}).catch(error => addLog(error.message, "error"));

// Descargas oficiales asistidas; no recibe rutas locales desde el renderer.
let downloadsBusy = false;
let downloadsReady = false;
let downloadsReturnFocus = null;
let downloadsTimer = null;
let downloadsAutoAttempted = false;
let downloadsListKey = null;
function downloadsControls() {
  for (const id of ['importDownloadsBtn', 'refreshDownloadsBtn']) $(id).disabled = downloadsBusy;
  $('installDownloadsBtn').disabled = downloadsBusy || !downloadsReady;
}
async function refreshDownloads() {
  downloadsReady = false;
  $('downloadsStatus').textContent = 'Revisando los archivos…';
  const result = await window.launcher.getAssistedStatus();
  if (!result.ok) throw new Error(result.message);
  renderDownloads(result);
}
function renderDownloads(result) {
  downloadsReady = result.missing.length === 0;
  $('downloadsStatus').textContent = 'Versión ' + result.version + ' · ' + result.expectedFiles + ' mods. ' +
    (result.remote ? 'Versión del servidor de actualizaciones.' : 'Versión incluida en el launcher. Las futuras versiones remotas todavía no están habilitadas.') +
    (downloadsReady ? ' Descargas verificadas.' : ' Faltan ' + result.missing.length + ' descargas. Detectando archivos en Descargas…');
  const listKey = JSON.stringify([result.version, result.missing.map(entry => entry.path)]);
  if (listKey !== downloadsListKey) {
    downloadsListKey = listKey;
    $('downloadsList').replaceChildren();
  for (const entry of result.missing) {
    const row = document.createElement('li');
    const name = document.createElement('span'); name.textContent = entry.name;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'outline'; button.textContent = 'DESCARGAR';
    button.addEventListener('click', () => runButton(button, () => window.launcher.openAssistedPage(entry.path), 'ABRIENDO…'));
    row.append(name, button); $('downloadsList').append(row);
  }
  }
  downloadsControls();
}
async function detectDownloads() {
  if ($('downloadsOverlay').hidden || downloadsBusy) return;
  await downloadsOperation(async () => {
    const result = await window.launcher.scanAssistedDownloads();
    if (!result.ok) throw new Error(result.message);
    if (result.busy) return;
    renderDownloads(result);
    if (result.accepted.length) {
      $('downloadsResult').textContent = `${result.accepted.length} mod(s) verificado(s). Se instalarán cuando estén todas las descargas listas.`;
      addLog('Descarga detectada y verificada: ' + result.accepted.join(', '), 'success');
    }
    if (result.rejected.length) $('downloadsResult').textContent = result.rejected.map(item => item.name + ': ' + item.message).join(' ');
    if (result.message) $('downloadsResult').textContent = result.message;
    if (downloadsReady && result.canInstall === false) $('downloadsResult').textContent = 'Descargas listas. Esperando a que termine el juego o la preparación para instalar.';
    if (downloadsReady && result.canInstall !== false && !downloadsAutoAttempted && !$('downloadsOverlay').hidden) {
      downloadsAutoAttempted = true;
      await installDownloads();
    }
  });
}
async function installDownloads() {
  $('downloadsResult').textContent = 'Verificando e instalando el modpack. Puedes seguir el progreso en Actividad.';
  const result = await window.launcher.installAssistedPack();
  $('downloadsResult').textContent = result.message;
  addLog(result.message, result.ok ? 'success' : 'error');
  if (!result.ok && !result.needsManual) showError(result.message);
  if (result.ok) { clearInterval(downloadsTimer); downloadsTimer = null; }
  await refreshDownloads();
}
async function downloadsOperation(operation) {
  if (downloadsBusy) return;
  downloadsBusy = true; downloadsControls();
  try { await operation(); }
  catch (error) { $('downloadsResult').textContent = error.message; addLog(error.message, 'error'); }
  finally { downloadsBusy = false; downloadsControls(); }
}
async function openDownloads() {
  if (!$('downloadsOverlay').hidden) return;
  downloadsReturnFocus = document.activeElement;
  $('downloadsOverlay').hidden = false;
  $('downloadsPanel').focus();
  downloadsAutoAttempted = false;
  $('downloadsResult').textContent = 'Esperando las descargas oficiales. El modpack se instalará automáticamente cuando estén verificadas.';
  await downloadsOperation(refreshDownloads);
  if (!$('downloadsOverlay').hidden) {
    downloadsTimer = setInterval(detectDownloads, 3000);
    await detectDownloads();
  }
}
function closeDownloads() {
  clearInterval(downloadsTimer); downloadsTimer = null;
  $('downloadsOverlay').hidden = true;
  downloadsReturnFocus?.focus();
}
$('closeDownloadsBtn').addEventListener('click', closeDownloads);
$('refreshDownloadsBtn').addEventListener('click', () => downloadsOperation(refreshDownloads));
$('importDownloadsBtn').addEventListener('click', () => downloadsOperation(async () => {
  const result = await window.launcher.importAssistedFiles();
  if (result.cancelled) return;
  const detail = (result.rejected || []).map(item => item.name + ': ' + item.message).join(' ');
  $('downloadsResult').textContent = (result.message || '') + ' ' + detail;
  addLog(result.message || 'Importación terminada.', result.ok ? 'success' : 'error');
  await refreshDownloads();
}));
$('installDownloadsBtn').addEventListener('click', () => downloadsOperation(installDownloads));
$('downloadsPanel').addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeDownloads(); }
  if (event.key !== 'Tab') return;
  const controls = [...$('downloadsPanel').querySelectorAll('button:not([disabled])')];
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === $('downloadsPanel'))) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === $('downloadsPanel'))) {
    event.preventDefault(); first?.focus();
  }
});

function navigate(page) {
  for (const [name,id] of [['home','homePage'],['settings','settingsPanel'],['activity','activityPage']]) $(id).hidden = name !== page;
  for (const [id,name] of [['homeBtn','home'],['settingsBtn','settings'],['bottomSettingsBtn','settings'],['activityBtn','activity']]) { $(id).classList.toggle('active',name===page); if(name===page) $(id).setAttribute('aria-current','page'); else $(id).removeAttribute('aria-current'); }
}
$('homeBtn').addEventListener('click',()=>navigate('home'));
$('bottomSettingsBtn').addEventListener('click',()=>$('settingsBtn').click());
$('activityBtn').addEventListener('click',()=>navigate('activity'));
for (const id of ['discordBtn','newsDiscordBtn']) $(id).addEventListener('click',async()=>{ const button=$(id); button.disabled=true; try { const result=await window.launcher.openDiscord(); addLog(result.message,result.ok?'success':'error'); } catch(error) { showError(error.message); } finally { button.disabled=false; } });
$('closeLauncherBtn').addEventListener('click',()=>window.launcher.closeLauncher());
$('activityOpenLogsBtn').addEventListener('click',async()=>{ try { const result=await window.launcher.openLogs(); $('activityActionStatus').textContent=result.message; } catch(error) { showError(error.message); } });
