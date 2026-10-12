# Privacidad de VillaWolf Launcher

El inicio de sesión requiere una autorización de Discord con los permisos `identify` y `guilds.members.read`. Permite conocer el identificador y usuario de Discord y comprobar la pertenencia al servidor y el rol que autoriza JUGAR. El launcher no solicita contraseñas de Discord, permisos para leer mensajes ni instalar un bot.

El servicio del titular, alojado en Cloudflare Workers y D1, conserva el vínculo entre el identificador de Discord y el nombre de Minecraft para mantener una identidad estable. Las sesiones guardan el token de Discord cifrado y un hash del token del launcher. En la aplicación, el token propio de sesión se conserva cifrado mediante la protección de Windows (Electron safeStorage/DPAPI), dentro de los datos del usuario y fuera de la carpeta de instalación. No se guarda la contraseña ni se entrega el token a la interfaz. Cerrar la aplicación o instalar una actualización conserva esta sesión hasta su vencimiento; antes de JUGAR se comprueba el acceso con el servicio. Si el cifrado no está disponible, la sesión sólo permanece en memoria. Cerrar sesión elimina la copia local y revoca la sesión del servicio cuando hay conexión. Las sesiones y solicitudes vencidas se eliminan mediante una tarea programada; el vínculo de identidad persiste. El límite de solicitudes usa una clave derivada de la dirección IP. Los registros de solicitudes del Worker permanecen desactivados.

El launcher consulta GitHub y los manifiestos de actualización y contacta los proveedores de los archivos que necesita descargar. También puede abrir páginas oficiales para descargas asistidas. Los proveedores reciben los datos técnicos habituales de las conexiones, como la dirección IP, y aplican sus propias políticas.

Los mundos, ajustes, archivos del juego y registros de actividad se guardan localmente. La función de copiar un registro exige la acción del usuario; debe revisar el contenido antes de compartirlo. El launcher no incluye un botón para eliminar la identidad persistente de D1.

El titular administra las identidades y el acceso de la comunidad. Para consultas sobre esos datos puede contactarse con la administración del [Discord de la comunidad](https://discord.gg/K2uWjjEJu). No enviar contraseñas ni tokens por ese canal.

Servicios externos:

- [Discord](https://discord.com/privacy).
- [Cloudflare](https://www.cloudflare.com/privacypolicy/).
- [GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- Los proveedores de mods y runtimes tienen sus propias políticas.

La presentación de esta política y las opciones de consentimiento en el instalador se revisarán antes de solicitar firma a SignPath; la publicación de este documento no modifica el flujo del instalador 0.1.8.
