# VillaWolf Administrador — uso y alcance

Corte: 16 de octubre de 2026. **0.1.26 pública e instalada en esta PC**, sin marca PRUEBA LOCAL. [Release](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.26). No tiene firma Authenticode de confianza.

## Cuenta y permisos

Inicia sesión con Discord: se exige Administrador u Owner del servidor oficial VillaWolf. Sesión y credenciales locales cifradas por Windows; no compartirlas. Para un lanzador externo se comprueba pertenencia, rol/canales y Bot autorizado; no se exige Gestionar servidor externo según la decisión aprobada. No hay aislamiento por propietario/equipo implementado.

Perfil muestra la conexión central GitHub; no es necesario recibir el token del propietario. El token local cifrado es alternativa si el servicio confirma que no hay conexión central. Una pausa Discord no equivale a token GitHub borrado. No enviar tokens al chat ni adjuntarlos a reportes.

## Crear y editar

Crear nuevo lanzador abre cuatro pestañas: Información, Archivos, Discord y Publicación. Nombre/versión, carpeta CurseForge, comunidad/rol, anuncios opcionales, notas y resumen. Se conservan los datos entre pasos y se puede guardar borrador. Guardarlo no publica; continuar al flujo de preparación permite publicar con sus validaciones y confirmación.

Los cuatro menús de edición son Edición de interfaz, Carpetas y archivos, Información del servidor y Configuración de Discord. El cuarto fue aprobado después del diseño original de tres. Información del servidor sigue **No disponible**: no existe administración de hosting acreditada.

Edición de interfaz cambia nombre, fondo y tarjetas de noticias/actualizaciones, con vista previa; publicar diseño conserva versión/mods. Discord permite editar servidor oficial/externo, rol y los mismos canales/menciones opcionales del asistente. No activar menciones masivas. La portada no es un editor independiente de iconos por modpack.

## Preparar y publicar un modpack

1. Actualiza y prueba tu instancia desde CurseForge. No se modifican sus originales desde VillaWolf.
2. Selecciona el lanzador y Nueva actualización. Los pasos son Carpeta, Contenido, Comprobación y Publicación; elige la carpeta, revisa mods/configuraciones y selecciona contenido.
3. Minecraft/Forge se detectan; otros loaders siguen bloqueados. Perfil admitido no garantiza compatibilidad del mundo o de todos los mods.
4. Resuelve fuentes oficiales exactas. Se utiliza la API de CurseForge cuando está autorizada/configurada, además de Modrinth y fuentes admitidas. Si el autor restringe la descarga automática se mantiene la asistencia oficial; nunca aceptar otro hash o republicar JAR sin permiso.
5. Prepara y comprueba el paquete aislado. La versión del modpack es independiente de las aplicaciones y debe avanzar conforme al flujo existente.
6. Revisa notas, cambios, privacidad y tu prueba real del juego. Publicar requiere la comprobación y confirmación finales. No marques una prueba no realizada.

0.1.26 reutiliza comprobantes vigentes y bytes verificados. Si falla un archivo, comparte un máximo de tres intentos totales HTTP/integridad por archivo. Los incorrectos no entran en caché y tras tres discrepancias se bloquea la publicación. Se conserva revisión de cambios locales y conflictos del mismo pack.

El servicio activa un commit limitado de catálogo/manifiestos/historial en `preparacion-paso97`, nunca una release del Launcher. Un avance ajeno de la rama y un conflicto del propio pack se tratan conforme a las protecciones existentes; no forzar ni sobrescribir el historial.

## Registro y anuncios

Después de publicación confirmada: aviso configurable en el canal del modpack si está habilitado; auditoría privada con administrador y cambios; copia independiente al canal central `1559335322926710794` desde Worker 1.2.4, aunque el aviso configurable esté desactivado. La copia incluye notas/portada y «Publicado por» del recibo verificado, sin menciones. Primera entrega real de esa copia pendiente; no se probó publicando un pack en esta revisión.

Los anuncios oficiales del Launcher/Administrador usan destinos fijos, tras verificar release e instalador descargable y su SHA-256. Modificar archivos locales o guardar un borrador no debe anunciarlos.

## Historial, borradores y eliminación

Historial de versiones carga publicaciones y prepara Recuperar como nueva versión. No restaura mundos ni reescribe commits. Borradores de creación/diseño locales existen; no equivalen a recuperar toda una edición o subida interrumpida.

Eliminar lanzador exige confirmar y puede eliminar instalaciones VillaWolf, incluidos mundos y configuraciones, de clientes compatibles al conectarse. Conserva la carpeta original CurseForge y los commits de Git. Quitar rol sólo retira acceso; no es esta eliminación. No usar borrado para reparar errores.

Datos empaquetados: `%APPDATA%/VillaWolf Administrador`, con `app-data`, `borradores` y `preparados`. En desarrollo, `.champagne-admin/modpack-tool` es privado. No subir estas carpetas. Respaldar antes de restaurar; no sustituir credenciales automáticamente.

## Actualización y desarrollo

Canal propio `updates/admin/latest.yml`, tags `admin-vX.Y.Z`; conserva identidad/datos. El código tiene soporte de actualización, pero instalación en otra PC y cortes requieren más validación. Compilar `npm run dist:admin` no publica; los scripts usan rutas de etapa concretas que deben revisarse.

Preparación automática de servidores Minecraft, SFTP/API, reinicios y respaldos de hosting siguen pendientes. [Estado y pruebas](../../ESTADO_DESARROLLO.md) · [Roadmap](../../ROADMAP.md) · [Guía](../../docs/tutoriales/GUIA_VILLAWOLF.md).

Las instrucciones antiguas de token obligatorio, ausencia de API CurseForge, único pack y versión de salida fija 0.1.0 quedaron obsoletas; sus antecedentes permanecen en Git y ESTADO_DESARROLLO.

