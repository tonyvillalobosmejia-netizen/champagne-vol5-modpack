# Lista de desarrollo de VillaWolf

Actualizada el 12 de octubre de 2026. Esta lista reúne cambios solicitados y pendientes; no afirma que estén implementados ni asigna una fecha de publicación. La denominación VillaWolf 1.1.0 corresponde a la propuesta de ampliación.

## Launcher — mejoras solicitadas

### 1. Actualización del launcher con anuncio amable
- Mostrar una pantalla de actualización con el estilo de VillaWolf y una barra de progreso, en lugar de presentar la actualización normal como un error.
- Texto propuesto: «Estamos actualizando VillaWolf. Al terminar, el launcher se reiniciará y volverá a abrirse para que puedas jugar».
- Mostrar las etapas: buscando, descargando, verificando y preparando el reinicio. Sólo mostrar porcentajes cuando sean medibles.
- Si el modpack exige una versión más reciente del launcher, mantener al jugador en esta pantalla y bloquear JUGAR hasta completar la actualización.
- Si la actualización falla realmente, mostrar el error amable con una opción de reintento apropiada; conservar una instalación utilizable.

### 2. Ventana de errores fácil de entender
- Mostrar un título tranquilo, una explicación breve de lo ocurrido y el siguiente paso útil.
- Tres botones visibles: «Copiar error», «Abrir registro» y «Cerrar».
- «Copiar error» copia el diagnóstico sin contraseñas, tokens ni códigos de acceso. «Abrir registro» abre el archivo local del diagnóstico.
- Mantener los detalles técnicos disponibles en una sección desplegable; no mostrar un registro extenso como contenido principal.
- Diferenciar una actualización en curso, una tarea ocupada y un fallo real.

### 3. Mantener JUGAR deshabilitado mientras Minecraft siga abierto
- Bloquear JUGAR durante preparación, lanzamiento y toda la ejecución de la instancia de Minecraft.
- Reactivarlo únicamente cuando termine el proceso real del juego, o cuando el lanzamiento falle o se cancele antes de iniciarlo.
- Seguir el proceso real de Minecraft aunque haya un instalador, proceso intermediario o cambio de proceso durante el arranque. No depender de un temporizador.
- Verificar que no se puedan lanzar dos copias de la misma instancia por un doble clic.

### 4. Selector de versión o modpack en la barra lateral
- El botón de las dos líneas pasará a abrir el selector de versión/modpack.
- Conservar Ajustes en su acceso independiente y todas sus funciones actuales.
- Mostrar Mundo Conejil, Valochampang y las instancias adicionales que se configuren.
- Mostrar el nombre, Minecraft, loader y estado de instalación de cada opción.
- Cada modpack debe tener su propia instalación, configuraciones y mundos para evitar que se mezclen.

## VillaWolf Administrador — ampliación propuesta 1.1.0

### 5. Preparación y actualización de servidores de Minecraft
Flujo propuesto: preparar y probar en CurseForge → analizar y revisar → «Preparar y subir» → distribuir a jugadores y preparar el servidor.

- Detectar Minecraft, loader y versión, mods y configuraciones de la instancia de CurseForge.
- Preparar dos destinos independientes: paquete para jugadores e instalación compatible para servidor.
- Identificar mods exclusivos del cliente y comprobar si otros necesitan una versión distinta para servidor. Cuando no pueda determinarlo con seguridad, pedir revisión al administrador antes de aplicarlo.
- No asumir que quitar todos los mods visuales basta para obtener un servidor compatible: revisar dependencias, loader, Java y configuraciones.
- Conectar al hosting mediante SFTP o una API compatible, según las capacidades reales del proveedor.
- Comprobar credenciales, permisos, rutas, espacio disponible y capacidad de instalación antes de modificar el hosting.
- Mostrar un resumen separado de cambios para jugadores y servidor, con resultado independiente para cada destino.
- No activar el canal de jugadores automáticamente si la instalación del servidor falla o queda incompatible.
- Realizar copia de seguridad antes de actualizar, verificar archivos y ofrecer restauración ante un fallo.
- Proteger mundos y datos del servidor; no sobrescribirlos con archivos de una instancia cliente.
- Reiniciar el servidor únicamente con autorización del administrador y tras verificar la preparación.
- Mantener como pendientes de definición el proveedor/hosting, ruta del servidor, política de copias, destino seleccionado y procedimiento de reinicio.
- Conservar las condiciones actuales: fuentes oficiales o distribución autorizada; no publicar JAR de terceros sin permiso. No publicar credenciales ni datos de jugadores.

### 6. Inicio de sesión del Administrador mediante Discord
- Decisión del usuario: usar Discord, igual que en el launcher. La aplicación comprobará que la cuenta pertenece al servidor VillaWolf y tiene el rol Administrador antes de dar acceso.
- Servidor: 1007732653035880589. Rol Administrador identificado en Discord: 1559330834278781048. Confirmar estos identificadores contra la configuración al implementarlo.
- Comprobar el rol al iniciar/restaurar sesión y antes de operaciones sensibles. Si se retira el rol, impedir nuevas operaciones protegidas.
- Validar la autorización en el servicio correspondiente; no confiar únicamente en botones ocultos o comprobaciones locales.
- Conservar la sesión de forma segura al cerrar y actualizar. Incluir cierre de sesión y mensajes claros si falta el rol o el servicio no está disponible.
- Mantener separado el token de GitHub: tener Administrador en Discord no concede permisos de escritura en GitHub ni credenciales de hosting.
- Guardar tokens y credenciales mediante el almacenamiento seguro del sistema; excluirlos de registros y exportaciones.
- Pendiente de decidir: si Owner también tendrá acceso sin portar Administrador, o si todas las cuentas, incluida Owner, deberán tener Administrador. No habilitar la restricción sin prevenir un bloqueo del propietario.
- El sistema de equipos/administradores independientes queda fuera del alcance aprobado por ahora.

### 7. Gestión de varios modpacks e instancias
- Ampliar Administración para configurar y publicar los modpacks que verá el selector del launcher.
- Permitir distintas versiones de Minecraft y loaders compatibles por modpack, con el Java adecuado para cada una.
- Comenzar con Mundo Conejil y Valochampang; definir qué carpeta de CurseForge corresponde a cada uno.
- Usar identificadores estables, manifiestos y canales de actualización independientes. Cambiar el nombre visual no debe crear otra identidad ni borrar mundos.
- Permitir modificar cada modpack sin alterar los demás.
- Definir cómo se agregan nuevas instancias y cómo se retiran conservando o respaldando los datos locales.

## Pendientes anteriores que se conservan

- Microsoft Premium: autorización de la aplicación y prueba completa del acceso oficial, nombre, UUID y skin.
- Firma del instalador: pendiente tras el rechazo de SignPath Foundation.
- Comprobar actualizaciones del launcher y del Administrador ante cortes de Internet o cierre inesperado.
- Comprobar conservación de sesión del jugador, token del administrador y datos al reiniciar y actualizar.
- Completar la prueba de actualización automática del Administrador desde otra computadora antes de activar su distribución.
- Reducir descargas manuales buscando fuentes oficiales exactas y autorizadas.
- Validaciones previas a publicación, historial y recuperación de versiones del modpack.
- Verificar que publicar nombre, fondo y noticias no cambie la versión ni los mods publicados.

## Orden de trabajo sugerido

1. Anuncio de actualización, ventana de errores y bloqueo de JUGAR.
2. Pruebas de actualización y conservación de datos/sesiones de ambas aplicaciones.
3. Inicio de sesión y autorización del Administrador.
4. Selector de modpacks y publicación independiente de cada instancia.
5. Integración con un hosting concreto, copias, preparación y actualización de servidor.

Antes de desarrollar los puntos 3–5 se concretarán las decisiones pendientes. Antes de publicar cualquier cambio se verificará el arranque existente y el flujo afectado.

## Implementación en revisión — 13 de octubre de 2026

Se preparan Launcher y Administrador 1.1.0, todavía sin activar los canales de actualización ni publicar instaladores. El servicio Cloudflare compatible con clientes anteriores ya está desplegado y se comprobó la sesión real de tonymejiavv: su catálogo devuelve Mundo Conejil.

- Administrador u Owner autorizan la aplicación Administrador. La sesión se conserva cifrada y se comprueba antes de operaciones protegidas y de activar publicaciones.
- Cada lanzador usa el nombre definido por el Administrador y su propio ID de rol. No se crean nombres fijos ni se muestran modpacks ajenos a los roles del jugador. Rol de Mundo Conejil: 1559431805096960020, rosa, asignado manualmente por el propietario.
- Pantallas amables de actualización y error; JUGAR permanece bloqueado durante el proceso Java.
- Selector con tarjetas cuadradas y fondo propio; descarga de instancia explícita; menú de tres puntos con Borrar, Jugar y Abrir carpeta.
- Perfil del Administrador arriba a la derecha, con avatar y nombre de Discord. Los tres menús aparecen al seleccionar el lanzador.
- Canales, configuraciones e historiales independientes; presentación y retirada del catálogo no cambian los mods ni el número de versión del modpack.
- Descarga por lote mediante páginas oficiales de CurseForge y comprobación SHA-256. Si CurseForge exige intervención, el usuario la completa; los archivos incorrectos no se importan.
- Borrado local con mundos conservados por defecto; retirada administrativa del catálogo con historial conservado.

Falta la prueba manual de los nuevos instaladores, el acceso Discord del Administrador y el flujo de descarga por lote con un modpack real en otra PC antes de publicar. Microsoft, firma del instalador y automatización de hosting continúan pendientes y fuera de esta entrega.
