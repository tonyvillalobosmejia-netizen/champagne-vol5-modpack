# VillaWolf — Discord y autorización

Actualizado el 16 de octubre de 2026. Producción: Worker 1.2.4; Launcher 0.1.20 y Administrador 0.1.26. Discord obligatorio y sesiones persistentes cifradas, no sólo en memoria. La descripción anterior de 0.1.7/0.1.8 queda como antecedente en Git.

## Modelo actual

- Aplicación Discord: `1558941216773767178`; servidor central VillaWolf: `1007732653035880589`.
- OAuth de usuario: `identify guilds.members.read`, callback loopback `http://127.0.0.1:32146/discord/callback`, estado aleatorio y sesión ligada a propósito. No crear una aplicación nueva para seguir esta guía.
- Jugador: rol específico del modpack en su guildId configurado. Un rol general Jugador no sustituye al rol de mundo. Un jugador externo no necesita pertenecer al servidor central.
- Administrador y Bot local: Administrador `1559330834278781048` u Owner `1559330540820373535` en VillaWolf. Para gestionar una comunidad externa se exige pertenencia y Bot/roles/canales válidos, no un permiso externo Gestionar servidor que no se aprobó.
- Abrir biblioteca, descargar y JUGAR tienen controles; cachés visuales no dan permiso. Quitar rol no elimina mundos. Una eliminación administrativa definitiva es una operación distinta con confirmación.

## Bot

VillaWolf · Guardián se ejecuta en la PC del propietario, sincroniza miembros y metadatos por servidor mediante Server Members Intent. La sincronización firmada caduca a los 90 segundos; si falta, el servicio vuelve a comprobar Discord directamente. Ese fallback puede recibir límites y debe respetar las pausas.

No requiere Administrador global ni Gestionar roles para sincronizar/enviar. En canales de anuncios necesita Ver canal, Enviar mensajes, Insertar enlaces, Leer historial para reconciliar, y Adjuntar archivos para portadas. Mención sólo al rol configurado/autorizado; nunca @everyone/@here automáticos. No se extraen tokens de usuario ni cookies del navegador.

## Destinos centrales

| Uso | Canal | Mención |
| --- | --- | --- |
| Actualizaciones oficiales del Launcher | `1559334945372250314` | Ninguna |
| Actualizaciones oficiales del Administrador | `1559347693245956189` | Sólo Administrador `1559330834278781048` |
| Auditoría y diagnósticos privados | `1414678783679795425` | Ninguna automática |
| Copia de publicaciones de modpacks | `1559335322926710794` | Ninguna; autor del recibo verificado |

Los avisos de cada modpack siguen en sus canales configurados, independientemente de estas copias. Anunciar versiones de aplicaciones requiere release pública, asset esperado, descarga y SHA-256 verificados; no publicar históricos al activar. Diagnósticos privados se consultan con botones por administradores autorizados; no contienen logs de ejecución de Minecraft.

## Sesión e identidad

Credenciales OAuth de servidor cifradas en D1, token de sesión como hash y secretos fuera de Git. Clientes guardan sesión mediante safeStorage de Windows. Código de renovación existe; no se acredita vencimiento/renovación real por cerrar y abrir. Observación pendiente: renovación OAuth y escritura condicional del snapshot D1, documentada sin corregir en esta tarea.

Nombre offline vinculado al ID Discord; Microsoft opcional usa identidad Java oficial. Cambiar identidad puede cambiar inventario; no migrar ni reservar nombres sin verificar al propietario y respaldar. Los comandos del servidor Node alternativo no administran automáticamente D1 de producción.

## Alternativa histórica Node

`discord-server.cjs` se conserva como implementación alternativa de referencia (Node 24 y disco persistente, detrás de HTTPS). No es el servicio desplegado actual ni prueba paridad con todas las rutas v2 del Worker. Su configuración antigua no debe sustituir producción sin un trabajo autorizado y probado. Nunca exponer loopback ni credenciales; respetar límites y respaldos.

[Cloudflare](cloudflare/README.md) · [Bot](roles-bot/README.md) · [Estado](../ESTADO_DESARROLLO.md).

