# VillaWolf Administrador

Abre **VillaWolf Administrador** desde el acceso directo del escritorio, o ejecuta `npm run admin:modpack` en la carpeta del proyecto. Es una aplicación local de administración independiente; no se incluye en el instalador de los jugadores y no modifica el arranque del launcher.

1. Actualiza mods y configuraciones en tu instancia de CurseForge.
2. Abre Minecraft desde CurseForge y entra a un mundo para comprobar el conjunto.
3. En el administrador, elige la carpeta de la instancia y pulsa **Analizar cambios**. Se consulta el manifiesto publicado y se comparan los hashes de tus archivos.
4. Revisa mods añadidos, cambiados, retirados y archivos de contenido. Los contenidos nuevos se seleccionan explícitamente. Los ZIP nuevos requieren una descarga oficial exacta; no se publican JAR de mods ni ZIP de terceros incrustados nuevos.
5. Elige una versión del **modpack** mayor que la actual, por ejemplo 0.1.5. Esta versión es independiente de la versión del launcher. Pulsa **Preparar y comprobar paquete**.
6. Usa **Abrir paquete preparado** para revisar `revision.json` y el manifiesto. Las copias quedan en `.champagne-admin/modpack-tool/preparados/`. No están incluidas en el instalador ni en Git.
7. Para publicar tú, crea en GitHub un **fine-grained personal access token** limitado a `champagne-vol5-modpack`, con **Contents: Read and write** y fecha de caducidad. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Pégalo únicamente en el campo de la herramienta; no lo envíes al chat. Usa Guardar token en esta PC para reutilizarlo. Puede guardarse cifrado con Windows usando Guardar token en esta PC; no se incluye en paquetes. Se vacía el campo al solicitar la publicación; el token cifrado guardado permanece hasta olvidarlo. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
8. Marca que probaste el juego y revisaste permisos/datos privados. Pulsa **Verificar descargas y publicar** y confirma en la ventana. Se vuelve a comprobar la carpeta, el contenido aislado y los SHA-256 de todas las descargas directas.

No crea una Release del launcher. Publica un único commit en `preparacion-paso97` con `updates/stable-v2.json`, `updates/versions/modpack-X.Y.Z.json` y `updates/history.json`. Mantiene el resto del repositorio y el canal antiguo `stable.json`. Si alguien cambia la rama durante la preparación, se detiene: analiza de nuevo. La actualización se activa al final, después de verificar los bytes subidos en el commit. Los jugadores la reciben al pulsar **JUGAR**.

Para mods nuevos primero busca coincidencia exacta en Modrinth por SHA-1 y después comprueba SHA-256 en la descarga. Si no existe, usa la página del archivo instalado de CurseForge sólo cuando sus metadatos locales coinciden con el SHA-1 del JAR. No usa la API de CurseForge, no inventa versiones por nombre y bloquea mods sin fuente exacta.

También verifica las fuentes directas que ya utiliza el manifiesto publicado: Maven de Clumps bajo maven.blamejared.com/com/blamejared/clumps y archivos JAR del CDN de CurseForge. Las redirecciones de ese CDN sólo se admiten entre edge.forgecdn.net y mediafilez.forgecdn.net, con la misma ruta y sin credenciales. Todas las descargas mantienen la comprobación SHA-256; los tokens GitHub no siguen redirecciones.

Sólo se recopilan las carpetas de contenido admitidas por el launcher. No incluye mundos, options.txt, logs, cuentas o cachés fuera de esas carpetas. Elimina identificadores personales de Embeddium/QuickSkin y descarta archivos con nombres de credenciales o valores de secretos reconocibles. La revisión del administrador sigue siendo necesaria para datos privados o recursos de terceros dentro de configuraciones/scripts personalizados.

Cambiar Minecraft/Forge se detecta desde CurseForge y verifica el instalador oficial Forge; sólo admite perfiles modernos soportados con Java 17/21. El administrador no puede comprobar que un mundo antiguo funcione después de cambiar Minecraft ni resolver incompatibilidades del juego: se exige tu prueba en CurseForge.

**Recuperación:** cada publicación conserva un manifiesto inmutable en `updates/versions/` y el historial Git. Para restaurar una versión anterior, prepara una nueva versión superior usando los archivos anteriores; no elimines el historial ni fuerces la rama. Si deseas retirar la herramienta, elimina su acceso directo y `tools/admin-modpack`; la aplicación de jugadores seguirá en 0.1.10. El comando añadido a package.json sólo abre esta herramienta.

Pruebas: `node --test tests/verificar-admin-modpack.cjs`. Las escrituras de GitHub se prueban con un servidor simulado; crear la herramienta no publica una actualización nueva.

## Nombre, fondo y notas

Después de analizar, escribe el **Nombre del modpack**, elige una imagen PNG/JPG en **Elegir fondo** y escribe las notas de la actualización. El nombre puede cambiar de Mundo Conejil a otro; el nombre de la aplicación sigue siendo VillaWolf Launcher. Conserva la identidad de la instancia, los mundos y las cuentas. El fondo aparece en Inicio y en las tarjetas de noticias/actualizaciones; las notas se muestran en Actualizaciones.

Las imágenes se convierten a JPEG, sin metadatos, con ancho máximo de 1920 píxeles y límite de 4 MB. Publica únicamente imágenes propias o con autorización. **Quitar fondo** restaura el fondo incluido en el launcher. Revisa el nombre, el hash del fondo y las notas en revision.json antes de publicar.

El fondo y las notas requieren **VillaWolf Launcher 0.1.11**. Primero debe publicarse su instalador y los archivos del actualizador en GitHub. La herramienta impide activar esta presentación mientras la última Release del launcher sea anterior. Los jugadores conservan la última presentación válida si falla la red o la imagen nueva es inválida.

## Historial y recuperación

Pulsa **Consultar publicaciones** para ver las versiones archivadas, fechas y notas. Las versiones antiguas sin metadatos muestran información del historial Git. **Recuperar como nueva versión** carga el manifiesto anterior y propone un número mayor que la versión actual: no requiere modificar tu carpeta de CurseForge. Revisa el contenido, prueba ese conjunto y confirma la publicación como cualquier actualización. No borra mundos ni restaura sus datos. Elegir una versión anterior no cambia por sí solo el canal publicado.

## Menús del administrador (0.1.12)

- **Nombre e imagen**: pulsa Cargar diseño publicado y elige el nombre y fondo. Conserva mods, configuraciones e identidad de la instancia.
- **Actualizar modpack**: selecciona CurseForge, analiza cambios y elige contenido. Conserva noticias e imagen actuales.
- **Noticias y actualizaciones**: cada tarjeta tiene título y descripción independientes. Se muestran en la vista previa antes de publicar.

Preparar y comprobar paquete muestra un resumen de la versión, motor, archivos añadidos/cambiados/retirados, fondo, noticias y destino. Cualquier edición invalida la preparación. Publicar sigue requiriendo revisión, token local y confirmación. Las tarjetas requieren publicar previamente VillaWolf Launcher 0.1.12; si todavía no existe, el canal queda intacto.

El launcher conserva la sesión propia cifrada con Windows fuera de la carpeta de instalación. Cerrar sesión la elimina. La sesión puede vencer o revocarse; el acceso siempre se verifica antes de JUGAR. La primera migración desde 0.1.11 puede requerir iniciar sesión porque esa versión sólo la guardaba en memoria.

## Menús en preparación
Edición de interfaz reúne nombre, fondo y las tarjetas de noticias/actualizaciones. Carpetas y archivos conserva el análisis y publicación del único modpack existente. Información del servidor está en preparación; no hay creación de nuevos modpacks ni gestión de administradores independientes.

Alcance confirmado: sólo los tres menús para el modpack existente. Información del servidor queda informativa, sin campos ni publicación de dirección/puerto. Icono del modpack y borradores se posponen, al igual que nuevos modpacks y equipos administrativos.

## Instalador independiente para Windows

Ejecuta `npm run dist:admin` para generar `dist-admin/VillaWolf.Administrador.Setup.0.1.0.exe`. Es independiente del launcher de jugadores. Instala el administrador sin Node ni Electron externos. Cada PC guarda su carpeta de CurseForge y token cifrado en `%APPDATA%/VillaWolf Administrador`; no se copia el token de otra PC. El token autoriza el mismo repositorio configurado: no crea administradores independientes ni nuevos modpacks. No publica automáticamente una Release. El instalador no tiene firma de código.

### Actualizaciones automáticas del Administrador

El instalador comprueba el canal exclusivo `updates/admin/latest.yml` de la rama `preparacion-paso97`. Las Releases del administrador usan `admin-v0.1.0` (y siguientes), separadas del launcher. Publica EXE y blockmap en esa Release; el proceso de compilación genera `dist-admin/latest.yml` con enlaces absolutos a sus archivos. Tras probar el instalador, publica ese YAML en el canal. Una nueva versión se descarga automáticamente y se instala al terminar las tareas. No reemplaza el programa durante una publicación. El canal no se activa ni se publican archivos automáticamente al compilar.
