# Privacidad de VillaWolf Launcher

El inicio de sesión requiere una autorización de Discord con los permisos `identify` y `guilds.members.read`. Permite conocer el identificador y usuario de Discord y comprobar la pertenencia al servidor y el rol que autoriza JUGAR. El launcher no solicita contraseñas de Discord, permisos para leer mensajes ni instalar un bot.

El servicio del titular, alojado en Cloudflare Workers y D1, conserva el vínculo entre el identificador de Discord y el nombre de Minecraft para mantener una identidad estable. Las sesiones guardan el token de Discord cifrado y un hash del token del launcher. En la aplicación, el token propio de sesión se conserva cifrado mediante la protección de Windows (Electron safeStorage/DPAPI), dentro de los datos del usuario y fuera de la carpeta de instalación. No se guarda la contraseña ni se entrega el token a la interfaz. Cerrar la aplicación o instalar una actualización conserva esta sesión hasta su vencimiento; antes de JUGAR se comprueba el acceso con el servicio. Si el cifrado no está disponible, la sesión sólo permanece en memoria. Cerrar sesión elimina la copia local y revoca la sesión del servicio cuando hay conexión. Las sesiones y solicitudes vencidas se eliminan mediante una tarea programada; el vínculo de identidad persiste. El límite de solicitudes usa una clave derivada de la dirección IP. Los registros de solicitudes del Worker permanecen desactivados.

El launcher consulta GitHub y los manifiestos de actualización y contacta los proveedores de los archivos que necesita descargar. También puede abrir páginas oficiales para descargas asistidas. Los proveedores reciben los datos técnicos habituales de las conexiones, como la dirección IP, y aplican sus propias políticas.

Los mundos, ajustes, archivos del juego y registros de actividad se guardan localmente. La función de copiar un registro exige la acción del usuario; debe revisar el contenido antes de compartirlo. El launcher no incluye un botón para eliminar la identidad persistente de D1.

Las nuevas sesiones de Discord del Launcher y del Administrador duran hasta 30 días cuando Discord entrega una credencial de renovación; las sesiones anteriores conservan su vencimiento. Se revalidan los roles al acceder a los modpacks y antes de lanzar el juego o activar una publicación. El Administrador exige Administrador u Owner; cada modpack se muestra únicamente a quienes tengan su rol correspondiente. El avatar y nombre de Discord se usan para mostrar el perfil; las imágenes se obtienen del CDN público de Discord.

El titular administra las identidades y el acceso de la comunidad. Para consultas sobre esos datos puede contactarse con la administración del [Discord de la comunidad](https://discord.gg/K2uWjjEJu). No enviar contraseñas ni tokens por ese canal.

Servicios externos:

- [Discord](https://discord.com/privacy).
- [Cloudflare](https://www.cloudflare.com/privacypolicy/).
- [GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- Los proveedores de mods y runtimes tienen sus propias políticas.

La firma gratuita de SignPath fue rechazada. Publicar esta política no representa aprobación ni firma del instalador.

## Cuenta Microsoft opcional

VillaWolf verifica el acceso a Minecraft Java mediante Microsoft, Xbox y Minecraft Services. Las contraseñas se introducen únicamente en la página de Microsoft. Los tokens de renovación y de Minecraft se conservan cifrados con la protección del sistema operativo, separados de la sesión Discord; nunca se envían al administrador del modpack ni al renderer. El nombre y UUID oficiales se usan para iniciar Minecraft, y la skin se obtiene de textures.minecraft.net. Cambiar la skin oficial transmite el PNG elegido a Minecraft Services y afecta a la cuenta también en otros launchers; se pide confirmación antes de enviarla. Desvincular Microsoft elimina su sesión en esta PC; cerrar la cuenta en el launcher elimina también ambas sesiones locales.

## Token de publicación del administrador

VillaWolf Administrador permite guardar voluntariamente el token de GitHub cifrado con Windows (Electron safeStorage/DPAPI) en su carpeta local de datos, excluida del repositorio y los paquetes. El estado público indica únicamente si hay una copia guardada; no devuelve su valor a la interfaz. Se reutiliza para publicar en el repositorio y rama configurados. Olvidar token guardado elimina sólo la copia local; la revocación del acceso se realiza en GitHub. Si el cifrado no está disponible, no se guarda en texto claro. La expiración y verificación exigidas por GitHub siguen vigentes.

## Instalación y retirada de modpacks

Elegir un modpack no descarga su instancia. La instalación se solicita mediante Descargar instancia; los modpacks instalados comprueban sus actualizaciones antes de jugar. Borrar una instalación local pide confirmación y conserva mundos, capturas y opciones por defecto. Borrarlos también exige marcar una opción adicional. Retirar un lanzador desde Administración lo oculta del catálogo para los jugadores y conserva los manifiestos históricos y las carpetas originales de CurseForge.

La biblioteca puede reutilizar durante un máximo de 60 segundos la última comprobación de roles, cifrada dentro de la sesión del servicio. La autorización del modpack al jugar y del Administrador al publicar se revalida mediante el servicio; la biblioteca no concede permiso para esas acciones. Cuando el bot está activo y sincronizado se usa su estado reciente; en caso contrario se consulta Discord directamente.

El Launcher conserva una biblioteca local cifrada y vinculada a la cuenta para mantener visibles sus mundos durante pausas de Discord o fallos de red. Una respuesta válida de permisos reemplaza esa biblioteca; cerrar sesión elimina la copia. La lista almacenada no autoriza a jugar.

## Descargas oficiales de CurseForge
La clave de CurseForge se guarda sólo como secreto CURSEFORGE_API_KEY del Worker. Nunca forma parte de los instaladores, manifiestos, código publicado o sesión del jugador. El Administrador envía huellas de archivo, SHA-1 y tamaño para localizar versiones exactas; no envía JAR locales. El servicio consulta los metadatos oficiales y respeta las restricciones de distribución. Las descargas pasan por el servicio autenticado desde el CDN oficial, sin almacenar ni republicar JAR en GitHub. El Launcher sólo puede solicitar archivos del modpack autorizado y verifica SHA-256 antes de instalar. Las bibliotecas pueden reutilizar roles durante 60 segundos para descargar; JUGAR y publicar mantienen su comprobación fresca. Los archivos que requieren intervención conservan su página oficial.

## Publicación central en GitHub
El Owner puede guardar GITHUB_TOKEN como secreto del Worker. Los administradores no reciben el token: el servicio verifica el rol Administrador u Owner y restringe las operaciones al repositorio de VillaWolf, rama preparacion-paso97, catálogo, manifiestos e historial bajo updates. Antes de activar un commit revalida el rol y comprueba que sólo cambie rutas permitidas, sin reescribir el historial. No permite publicar versiones de las aplicaciones, modificar su código, gestionar colaboradores o acceder a otros repositorios. La conexión local cifrada sigue disponible cuando el servicio central no está configurado.

## Bot de comprobación de roles

El propietario puede ejecutar VillaWolf Bot en una PC propia. El bot usa los intents Guilds y Server Members para recibir pertenencia y cambios de roles en el servidor autorizado; no solicita mensajes ni presencia. Conserva su token y una clave de conexión cifrados con Windows en una carpeta independiente, fuera de los instaladores del Launcher y del Administrador.

La conexión envía a Cloudflare por HTTPS el identificador del servidor y del miembro, sus identificadores de roles, pertenencia, estado pendiente y avatar, con firma HMAC, fecha y secuencia. D1 guarda ese estado para comprobar permisos sin consultar repetidamente Discord. La primera sincronización y las reconciliaciones sustituyen los datos del servidor; las salidas se registran como no presentes. Estos datos no se eliminan automáticamente a los 90 segundos: ese límite invalida su uso para autorizar si no hay señal reciente. La siguiente sincronización limpia el estado anterior del servidor.

Los cambios de rol se aplican cuando llega su evento. Si el bot informa desconexión se invalida su estado; si se pierde la conexión sin aviso puede quedar válido hasta 90 segundos desde la última señal. El servicio vuelve entonces a la comprobación directa de Discord y puede mostrar sus límites de espera. La PC debe permanecer encendida y conectada. No se transmite el token del bot al Worker ni a los jugadores.
