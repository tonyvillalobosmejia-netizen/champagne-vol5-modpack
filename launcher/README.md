# VillaWolf Launcher

Launcher para Windows x64 que prepara Minecraft y Forge, verifica el modpack antes de JUGAR, recibe actualizaciones y autentica jugadores mediante Discord y el rol configurado por el administrador.

Versión instalada y publicada: **0.1.8**. Este árbol prepara **0.1.9**, con portada VillaWolf y licencia MIT para el código propio. La 0.1.9 todavía no tiene instalador publicado ni firma de confianza.

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

El acceso requiere Discord, pertenencia al servidor y el rol autorizado. El nombre de Minecraft queda vinculado al identificador de Discord. La protección del servidor Minecraft es independiente y sigue pendiente.

El servicio desplegado se documenta en [auth-server/cloudflare/README.md](auth-server/cloudflare/README.md). Nunca guardar `DISCORD_CLIENT_SECRET`, `TOKEN_KEY`, tokens, bases de jugadores ni archivos `.env` en el repositorio. Los identificadores de aplicación, servidor y rol son configuración pública.

## Licencia y privacidad

- [MIT para el código propio](LICENSE).
- [Alcance y avisos de terceros](THIRD_PARTY_NOTICES.md).
- [Privacidad](PRIVACY.md).
- [Code signing policy](CODE_SIGNING_POLICY.md).

La firma gratuita se está preparando para solicitarla a SignPath Foundation. La solicitud aún no se ha enviado y el programa no ha admitido este proyecto. No se garantiza una firma ni una fecha.

Las pruebas automatizadas simulan Discord y D1; la autorización real y el funcionamiento en dos computadoras fueron verificados por separado. Toda nueva versión firmada debe verificar el instalador y la actualización antes de publicarse.
