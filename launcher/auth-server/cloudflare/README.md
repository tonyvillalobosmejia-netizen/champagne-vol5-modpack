# VillaWolf — servicio Cloudflare Workers + D1

Actualizado el 16 de octubre de 2026. **Worker 1.2.4 desplegado** en https://villawolf-auth.tony-villalobos-mejia-973.workers.dev. Health HTTP 200 y versión comprobados en esta revisión de sólo documentación. Health no certifica por sí solo OAuth, roles, bot o permisos.

## Arquitectura y configuración vigente

- Worker `villawolf-auth`, módulo `worker.mjs`; D1 `villawolf-identidades`, binding `DB`.
- Configuración pública: `wrangler.json`, app/servidor central, flags ROLE_BOT_ENABLED y ROLE_BOT_MULTI_GUILD, destinos/rol del Administrador. No contiene secretos.
- Cron vigente `*/15 * * * *`; no es ya el cron horario de la guía inicial. Observabilidad detallada de solicitudes desactivada.
- Esquemas/migraciones aditivos: identidades, solicitudes, sesiones/límites, sincronización de Bot, comunidades, recibos, cola, cursores/auditoría y eliminaciones. No asumir que producción tiene sólo las cinco tablas del diseño inicial. No recrear D1 para actualizar.
- Versión activa `eecab311-1b99-4ded-a585-8dc80e9883cd`; anterior 1.2.3 `861107e4-0321-4e9d-bbae-c6c7a822ff15`. No se desplegó ni migró nada durante esta revisión documental.

## Secretos y seguridad

Los nombres de configuración incluyen DISCORD_CLIENT_SECRET, TOKEN_KEY, CURSEFORGE_API_KEY, GITHUB_TOKEN y ROLE_BOT_KEY. Sus valores se introducen sólo por el titular en los almacenes seguros apropiados; nunca en documentos, logs o instaladores. Cambiar claves puede invalidar sesiones/conexiones: no rotarlas como método de diagnóstico sin autorización.

OAuth con propósito y vencimiento, credenciales Discord cifradas, tokens de sesión en hash, límites y redirecciones controladas. Sesión local persistente cifrada por Windows. No afirmar que cerrar/abrir prueba renovación tras vencimiento. Observación técnica OAuth/snapshot pendiente: después de renovar puede fallar la comparación con el cifrado anterior al actualizar snapshot; requiere regresión y evaluación de concurrencia.

## Roles y catálogos

Bot Gateway independiente por servidor; mensajes firmados, secuencia y metadatos. Límite de 90 segundos conservado, sin falsificar fechas. Si falta sincronización, comprobación directa Discord. Snapshot de navegación breve (60 segundos) no sustituye controles sensibles al descargar/jugar/publicar. Administrador u Owner del servidor central para administrar; jugadores usan el rol del modpack en su servidor, incluidos externos.

## Publicación, fuentes y diagnósticos

GitHub central limitado al repositorio `tonyvillalobosmejia-netizen/champagne-vol5-modpack`, rama `preparacion-paso97`, catálogo/manifiestos/historial permitidos. No permite código del Launcher, releases, otra rama ni force push a través de la ruta administrativa. Verifica autor, commit, conflictos y activación; no transmite el token a las aplicaciones.

API oficial CurseForge: coincidencias y descargas autorizadas desde CDN permitido, respetando restricciones del autor; el cliente verifica SHA-256. No garantiza descarga automática de todos los mods ni aloja JAR.

Diagnósticos de aplicación saneados en la cola existente, lectura privada con autorización. No reporta logs de ejecución de Minecraft. Si D1 no responde, puede no persistir el error del propio servicio. Ruido de estados esperados y retención siguen pendientes.

## Envíos

Cola persistente con reserva, reconciliación y confirmación, nunca declarar envío sin evidencia. Anuncios oficiales requieren release regular, asset/URL válidos, tamaño y SHA-256 descargado; cursores evitan avisos históricos iniciales. Permisos y red pueden demorar la cola.

1.2.4 añade copia de cada nueva versión de modpack confirmada en `1559335322926710794` de VillaWolf: notas, portada y administrador del recibo, sin menciones; no depende de habilitar el anuncio del pack. El canal configurable y la auditoría `1414678783679795425` permanecen. No anuncia borradores ni cambios sólo de diseño/Discord. Primera entrega real de la copia pendiente; 39 pruebas simuladas aprobadas.

Bot 0.2.6 local filtra diagnósticos de más de una hora con retry de 24 h; esa política no es archivo terminal del Worker ni significa enviado. La versión pública del Bot sigue 0.2.5.

## Operación y validación

Antes de un cambio autorizado: identificar versión y bindings, conservar punto de recuperación, revisar migraciones aditivas, probar el área afectada y comprobar después health, sesión/roles y cola según corresponda. No registrar cuerpos OAuth ni consultar credenciales de sesión del navegador. Wrangler fue autorizado oficialmente y usa almacén seguro de Windows.

El servicio no es un servidor Minecraft ni alojamiento permanente para el Bot. Pruebas locales usan mocks/SQLite y no equivalen a disponibilidad real continua. [Estado](../../ESTADO_DESARROLLO.md) · [Discord](../DISCORD.md) · [Bot](../roles-bot/README.md).

