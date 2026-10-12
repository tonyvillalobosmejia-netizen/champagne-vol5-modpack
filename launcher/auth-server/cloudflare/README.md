# VillaWolf: servicio Discord en Cloudflare

El servicio está desplegado en https://villawolf-auth.tony-villalobos-mejia-973.workers.dev con D1, variables públicas y secretos cifrados. El titular introdujo las credenciales directamente en Cloudflare. La limpieza es horaria y los logs de solicitudes permanecen desactivados.

La autorización real, la comprobación del rol dos veces y el cierre de sesión se verificaron con el cliente del launcher. El titular confirmó el arranque y el rechazo al retirar el rol. Eligió tonymejiavv como nombre de Minecraft; no se migraron automáticamente los inventarios del perfil anterior jaime_12.

La versión 0.1.8 activa Discord obligatorio en src/config.js. Pasan 76 pruebas automatizadas. El instalador se probó sobre 0.1.7 en esta PC: conserva la identidad de instalación, los accesos directos y los archivos del juego. La prueba de la interfaz instalada utiliza respuestas Discord simuladas y no ejecuta Minecraft.

Workers requiere redirect: manual para estas solicitudes; las respuestas no exitosas se rechazan sin reenviar credenciales. Se retiró el diagnóstico temporal y hay una prueba de regresión.

## Recursos necesarios

- Worker `villawolf-auth`, usando `worker.mjs` como módulo JavaScript.
- Base D1 `villawolf-identidades`, creada con `schema.sql`.
- Binding del Worker: nombre `DB`, tipo D1, apuntando a esa base.
- Variables de texto:
  - `DISCORD_CLIENT_ID`: `1558941216773767178`.
  - `DISCORD_GUILD_ID`: `1007732653035880589`.
  - `DISCORD_ROLE_ID`: `1558938399300390952`.
- Secretos del Worker:
  - `DISCORD_CLIENT_SECRET`: secreto de la aplicación Discord VillaWolf Launcher; configurar directamente en el alojamiento, nunca en el chat, código, capturas ni entregas.
  - `TOKEN_KEY`: 32 bytes aleatorios representados como 64 caracteres hexadecimales. Conservar una copia privada; cifra los tokens de Discord guardados en D1. Cambiarla invalida las sesiones existentes, pero conserva los nombres.
- Trigger programado: `0 * * * *`, para limpiar sesiones, solicitudes y límites vencidos.

`wrangler.json` contiene la configuración pública y el ID real de D1 `9d0125b7-3546-44f7-90b7-1c5fed5c9b3d`. No guardar secretos en ese archivo.

Usar el plan gratuito y la dirección HTTPS `workers.dev` asignada por Cloudflare. No hace falta comprar un dominio. El servicio no distribuye mods ni instala bots.

## Antes de activar

1. Aplicar el esquema y comprobar que existen las cinco tablas e índices de expiración.
2. Configurar binding, variables y secretos. Desplegar el código y habilitar la limpieza programada.
3. Comprobar `/health`, que debe responder HTTP 200 con `ok: true`, `provider: discord` y `storage: D1`. Esto comprueba la configuración; el flujo real de inicio de sesión es el que acredita que las credenciales, base y Discord funcionan juntos.
4. Confirmar en Discord el retorno exacto `http://127.0.0.1:32146/discord/callback` (ya guardado en la aplicación indicada).
5. Probar autorización real con una cuenta miembro que tenga el rol, una cuenta sin rol y una ajena al servidor.
6. Probar quitar el rol durante una sesión, cerrar sesión, cancelar autorización, caducidad y pérdida de conexión. JUGAR debe bloquearse si no puede verificar el permiso.
7. Probar Minecraft y la actualización desde 0.1.7 en otra PC antes de publicar.

Solo después configurar `authServerUrl` con la URL HTTPS real, `authProvider: "discord"` y `discordAuthRequired: true` en `src/config.js`.

## Nombres existentes y respaldos

D1 conserva el nombre de Minecraft vinculado al ID de Discord. El nombre propuesto se obtiene del usuario de Discord y se adapta a los caracteres y longitud permitidos. Los duplicados se resuelven sin distinguir mayúsculas. El nombre no cambia si posteriormente se cambia el usuario visible en Discord.

Antes del primer inicio de sesión de jugadores existentes, verificar sus identidades y vincular sus nombres actuales para conservar el UUID offline. Desde la consola administrativa D1, consultar primero ambas identidades; después usar una inserción normal en `discord_users(discord_id, username)` con los valores verificados. No usar REPLACE ni sobrescribir un usuario. Las reservas administrativas se guardan en `discord_reservations(username)`. No ejecutar estas operaciones por encargo de un jugador sin comprobar su identidad.

Respaldar la base D1 antes de cambios de esquema o vínculos. No borrar ni recrear la base para actualizar el Worker. Conservar también el secreto TOKEN_KEY de forma privada.

El launcher mantiene su sesión en memoria; al cerrarlo hay que autorizar de nuevo. El servicio persiste sesiones con el token de Discord cifrado y el token del launcher convertido a hash. No se registran tokens en logs. No habilitar captura del contenido de solicitudes de autenticación.

## Alcance de las pruebas locales

`npm test` comprueba el contrato HTTP, consumo único de solicitudes, cifrado, nombres, rol, revocación, expiración y límites con respuestas Discord simuladas y un emulador D1 sobre SQLite. Esas pruebas no sustituyen un despliegue en Cloudflare ni una autorización real.

Discord autoriza el uso de este launcher. No expulsa partidas ya iniciadas ni impide usar otro launcher. La protección del servidor Minecraft sigue pendiente y es independiente.

