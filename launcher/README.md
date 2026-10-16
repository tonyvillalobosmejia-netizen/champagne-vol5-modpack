# VillaWolf Launcher

Actualizado el 16 de octubre de 2026. Windows x64; versiones públicas: **Launcher 0.1.20**, **Administrador 0.1.26**, **Bot 0.2.5**. En esta PC está Bot **0.2.6 local**, todavía sin release. Worker **1.2.4** desplegado. Las versiones 0.x son de desarrollo/pruebas; no hay 1.0.0 estable.

[Descargar Launcher](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.20) · [Administrador](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.26) · [Bot público](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.5).

## Qué hace

Discord es obligatorio; cada jugador necesita el rol del modpack en su servidor configurado. Las comunidades externas funcionan sin pertenencia obligatoria del jugador a VillaWolf. Microsoft Java Premium es opcional, con identidad/skin oficiales para quien vincule una cuenta válida. Las sesiones se guardan cifradas; esto no acredita renovación real tras vencimiento.

Biblioteca con tarjetas autorizadas e imágenes posteriores, instancias separadas con nombres legibles, Java/RAM, descarga/preparación de Forge, actualizaciones por manifiesto con hashes y fuentes oficiales, descargas asistidas cuando un autor lo exige, reparación y diagnósticos. JUGAR verifica permisos y archivos. La protección del servidor Minecraft es independiente del control del launcher.

Error 008 corregido en 0.1.20: eliminaciones ya cumplidas no bloquean; archivos desconocidos/modificados requieren consentimiento con respaldo. El registro de limpieza puede corromperse: se reparó en esta PC, pero la protección adicional sigue local. Reinstalar 0.1.20 no garantiza reparar datos dañados.

## Compatibilidad

- 1.20.1 / Forge 47.4.10 / Java 17: arranque real previo verificado.
- 1.21.1 / Forge 52.1.0 / Java 21: preparación probada; ejecución real pendiente.
- Otros Forge modernos: validación parcial, no compatibilidad universal.
- Fabric, NeoForge y Quilt: sin soporte liberado. CurseForge es fuente/gestor, no loader.

Node.js y CurseForge no son necesarios para que un jugador use el instalador. No se incluyen JAR de terceros: se obtienen desde fuentes admitidas y se validan; no todos admiten descarga automática.

## Administrar

[VillaWolf Administrador](tools/admin-modpack/README.md) exige Administrador u Owner de VillaWolf. Permite crear borradores y publicar modpacks, editar diseño/Discord, preparar archivos, recuperar versiones como nuevas y revisar historial. La conexión GitHub central no comparte su token con los administradores. Preparación de hosting/servidores todavía pendiente.

El [Bot](auth-server/roles-bot/README.md) sincroniza roles y entrega anuncios mediante [Cloudflare/D1](auth-server/cloudflare/README.md). Se ejecuta en esta PC: no es alojamiento permanente. Si no está disponible, el servicio conserva la comprobación directa de Discord.

## Desarrollo

Repositorio `tonyvillalobosmejia-netizen/champagne-vol5-modpack`, rama `preparacion-paso97`, fuentes bajo `launcher/`. El checkout local utilizado no tiene `.git`; no suponer otra rama activa.

```powershell
npm ci
npm test
npm start
npm run dist -- --publish never
```

Node.js 24 y Windows x64 para el flujo local de compilación. Estos comandos son referencia; esta actualización documental no los ejecuta. Compilar no autoriza publicar ni desplegar. Las rutas de salida de scripts pueden corresponder a una compilación concreta; revisar antes de generar otra.

Se conserva la identidad interna `mi-launcher-forge` y appId del Launcher para no cambiar la ubicación de datos. No mover sesiones/instancias como parte de una actualización normal. Respaldar antes de reemplazos importantes.

## Documentación y seguridad

[Estado técnico y pruebas](ESTADO_DESARROLLO.md) · [Roadmap](ROADMAP.md) · [Guía con capturas históricas](docs/tutoriales/GUIA_VILLAWOLF.md) · [Discord](auth-server/DISCORD.md) · [Archivos locales](docs/ARCHIVOS_LOCALES.md).

[MIT del código propio](LICENSE), [terceros](THIRD_PARTY_NOTICES.md), [privacidad](PRIVACY.md), [firma](CODE_SIGNING_POLICY.md). SignPath rechazó la solicitud según el antecedente registrado; no hay certificado concedido. Los instaladores públicos consultados están **sin firma Authenticode**. No se aconseja eludir controles de Windows.

No subir tokens, secretos, perfiles, D1, mundos ni preparados privados. Las pruebas simuladas no certifican instalación en otras PCs ni renovación real de tokens. El historial de versiones y sus límites se conserva en ESTADO_DESARROLLO.

