# VillaWolf Launcher — acceso mediante Discord

Preparación para launcher 0.1.8. La versión instalada/publicada 0.1.7 permanece vigente.
Discord está activado en src/config.js para la próxima versión 0.1.8, después de la autorización real y las pruebas manuales confirmadas por el titular. La Release instalada/publicada 0.1.7 no se modificó.

## Datos del servidor

- Servidor Discord: `1007732653035880589`.
- Rol que permite jugar: `1558938399300390952`.
- Aplicación: VillaWolf Launcher, ID `1558941216773767178`. Creada en Discord y con el retorno OAuth guardado.
- Scopes: `identify guilds.members.read`. No requiere instalar un bot ni solicitar permisos de administrador.

## Crear la aplicación

En https://discord.com/developers/applications crear VillaWolf Launcher.
El titular debe aceptar los términos que muestra Discord.
En OAuth2 → Redirects registrar exactamente:

`http://127.0.0.1:32146/discord/callback`

Esta aplicación y el retorno ya se verificaron en el portal durante la preparación. No crear otra aplicación; usar https://discord.com/developers/applications/1558941216773767178/oauth2.

El navegador devuelve el código a la PC del jugador. El launcher escucha solo en loopback durante la autorización y comprueba el estado aleatorio. El servicio intercambia el código por el token de Discord; el Client Secret permanece exclusivamente en el alojamiento.

## Alojar el servicio

La opción elegida para producción es Cloudflare Workers + D1 en el plan gratuito. Seguir [cloudflare/README.md](cloudflare/README.md). No requiere un proceso Node ni un disco local en ese alojamiento. El esquema D1 fue verificado; el Worker villawolf-auth tiene código, vínculo DB autorizado, variables públicas, secretos cifrados y limpieza horaria. La autorización real pasó; el titular confirmó el funcionamiento del launcher y la prueba sin rol. La configuración de la próxima versión ya exige Discord. Falta generar y verificar el instalador antes de publicarlo.

### Alternativa de referencia: servidor Node

Requiere Node.js 24 o posterior compatible con node:sqlite, una sola instancia del proceso, disco persistente para identidades y una URL HTTPS pública. El alojamiento de autenticación puede ser independiente del futuro servidor Minecraft.

1. Copiar discord-server.cjs al alojamiento.
2. Configurar las variables de discord.env.example en el gestor de secretos/variables. No enviar el Client Secret por chat ni guardarlo en el código o Git.
3. Definir CHAMPAGNE_DISCORD_DB con una ruta persistente y respaldar esa base. Guardarla evita cambiar nombres al reiniciar el alojamiento.
4. Ejecutar `node discord-server.cjs` (o `npm run cuentas:discord` desde este proyecto).
5. Publicar el proceso detrás de un proxy HTTPS. El proceso escucha en `127.0.0.1:32145`; no poner una dirección loopback como URL de los clientes.
6. Si el proxy local sobrescribe X-Forwarded-For con la IP real del cliente, habilitar CHAMPAGNE_TRUST_LOCAL_PROXY=true. No aceptar una cabecera arbitraria enviada por el visitante. Si no se habilita, el límite se comparte por dirección del proxy.
7. Comprobar `/health` y supervisar que el proceso se reinicia si falla. Las sesiones y tokens OAuth solo viven en memoria; al reiniciar el servicio los jugadores vuelven a iniciar sesión.

El código no carga archivos .env automáticamente. Se pueden inyectar las variables desde el alojamiento o iniciar Node con `--env-file=RUTA_PRIVADA`. No incluir ese archivo privado en entregas.

## Nombres y partidas existentes

El servicio utiliza el nombre de usuario de Discord como propuesta, quita caracteres no válidos para Minecraft y resuelve duplicados sin distinguir mayúsculas. El nombre asignado queda vinculado al ID estable de Discord. Cambiar el nombre visible de Discord no cambia el nombre de Minecraft ni su UUID offline.

Antes del primer acceso de un jugador existente, un administrador puede vincular su nombre de Minecraft actual para conservar esa identidad:

`node discord-server.cjs --bind ID_DISCORD NombreMinecraftActual`

También puede reservar nombres de administradores:

`node discord-server.cjs --reserve NombreAdministrador`

Estas operaciones necesitan las variables y la misma base persistente. No vincular un nombre sin verificar a qué jugador corresponde. El código no modifica mundos ni migra inventarios; un nombre nuevo genera otra identidad offline.

## Activar después de probar

En src/config.js configurar conjuntamente:

```js
authServerUrl: "https://DOMINIO_DEL_SERVICIO/",
authProvider: "discord",
discordAuthRequired: true,
```

En ese modo se ocultan el registro con contraseña y el perfil local del panel. Se comprueba el rol al iniciar sesión, al pulsar JUGAR y otra vez inmediatamente antes de ejecutar Java, después de las descargas. Discord desconectado, servicio caído, sesión vencida o rol ausente bloquean el arranque; no hay permiso almacenado para jugar offline.

Las contraseñas de Discord no pasan por el launcher. Los tokens de Discord permanecen en el servicio; el token de sesión del launcher solo vive en el proceso principal y no se envía a la interfaz. El usuario puede cancelar la autorización o cerrar sesión. La sesión dura como máximo 12 horas o lo que reste de validez del token de Discord.

## Prueba real requerida antes de publicar

1. Autorizar desde una PC con la aplicación real y el servicio HTTPS; verificar nombre y rol.
2. Denegar el acceso a una cuenta sin rol y a alguien ajeno al servidor Discord.
3. Retirar el rol a una sesión existente y comprobar que JUGAR queda bloqueado.
4. Cerrar sesión, cancelar la autorización y probar sin conexión.
5. Confirmar arranque de Minecraft, conservación de la identidad previamente vinculada y actualización desde 0.1.7 en otra PC.
6. Solo después generar y publicar v0.1.8 con su instalador, blockmap y latest.yml.

Este control corresponde al launcher. No impide usar otro launcher ni expulsa una partida ya abierta cuando se retira el rol. El futuro servidor Minecraft tendrá que validar también la identidad y el acceso. Discord no sustituye la comprobación de propiedad de una cuenta Microsoft/Minecraft.

## Pruebas y recuperación

`npm test`: pruebas del arranque y actualizador existente, cuentas, Discord, callbacks, revocación de rol y conservación de nombres. Las respuestas de Discord son simuladas; ninguna prueba acredita una conexión real con Discord.

Respaldo previo a estos cambios: D:\CodexWork\ChampagnePaso120\antes-discord.
No se modificaron los artefactos de la Release 0.1.7. Para revertir el código, restaurar src, auth-server, tests, package.json y package-lock.json desde ese respaldo.

Referencias oficiales: https://discord.com/developers/docs/topics/oauth2 y https://discord.com/developers/docs/resources/user#get-current-user-guild-member.
