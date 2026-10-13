# VillaWolf Launcher

Launcher para Windows x64 que prepara Minecraft y Forge, verifica el modpack antes de JUGAR, recibe actualizaciones y autentica jugadores mediante Discord y los requisitos de acceso configurados por el administrador.

Versión de esta publicación: **0.1.11**, con nombre y fondo del modpack configurables, notas de actualización e historial en VillaWolf Administrador. El instalador todavía no tiene firma de confianza.

## Desarrollo y construcción

Requiere Node.js 24 y Windows 10/11 x64 para las pruebas de extracción y construcción del instalador.

```powershell
npm ci
npm test
npm start
npm run dist -- --publish never
```

El paquete instala su propio runtime de Java y prepara los archivos del juego. Node.js y CurseForge no son requisitos para los jugadores que usan el instalador. Algunos mods requieren descarga asistida desde su fuente oficial; no se incluyen sus JAR en el launcher ni en este repositorio.

El nombre interno `mi-launcher-forge` y el appId `com.miserver.launcher` se conservan para mantener la identidad de instalación y datos durante las actualizaciones.

## Cuenta y servicio

El acceso requiere Discord y pertenencia al servidor. El servicio permite exigir un rol si el administrador lo configura. El nombre de Minecraft queda vinculado al identificador de Discord. La protección del servidor Minecraft es independiente y sigue pendiente.

El servicio desplegado se documenta en [auth-server/cloudflare/README.md](auth-server/cloudflare/README.md). Nunca guardar `DISCORD_CLIENT_SECRET`, `TOKEN_KEY`, tokens, bases de jugadores ni archivos `.env` en el repositorio. Los identificadores de aplicación, servidor y rol son configuración pública.

## Administrar y publicar el modpack

Abre **VillaWolf Administrador** desde el acceso directo local del escritorio o con `npm run admin:modpack`. Permite analizar una instancia de CurseForge, revisar los cambios, preparar el manifiesto y publicar el canal del modpack después de verificarlo. Es independiente del launcher de jugadores y de sus Releases. Las instrucciones están en [tools/admin-modpack/README.md](tools/admin-modpack/README.md). No guardar tokens en archivos ni enviarlos al chat.

## Licencia y privacidad

- [MIT para el código propio](LICENSE).
- [Alcance y avisos de terceros](THIRD_PARTY_NOTICES.md).
- [Privacidad](PRIVACY.md).
- [Code signing policy](CODE_SIGNING_POLICY.md).

SignPath Foundation recibió la solicitud de firma gratuita y está pendiente de revisión. No se garantiza una firma ni una fecha.

Las pruebas automatizadas simulan Discord y D1; la autorización real y el funcionamiento en dos computadoras fueron verificados por separado. Toda nueva versión firmada debe verificar el instalador y la actualización antes de publicarse.

## Lista de desarrollo

Los cambios solicitados y pendientes están en [ROADMAP.md](ROADMAP.md).
