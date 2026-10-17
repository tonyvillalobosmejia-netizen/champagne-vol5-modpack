# VillaWolf — estado técnico y desarrollo

## Publicación y comprobaciones posteriores — 16 de octubre de 2026

Esta entrada y la tabla vigente prevalecen sobre las notas históricas inferiores que todavía indican que los cambios del Bot y los anuncios personalizados eran locales.

- **Publicado y descargado con integridad comprobada:** Administrador **0.1.27**, tag `admin-v0.1.27`, y Bot **0.2.7**, tag `bot-v0.2.7`. Código en `tonyvillalobosmejia-netizen/champagne-vol5-modpack`, rama `preparacion-paso97`, prefijo `launcher/`; commit `35948a4ef9765246531bd40c164d50274b0a57ee`. Se verificaron los bytes completos públicos de instaladores y blockmaps mediante SHA-256; también el `latest.yml` del Administrador. Canal `updates/admin/latest.yml` activado en `2bc8c32992f2b3a9ddf9d642b70b7035a7dd40ad`. El CDN devolvió inicialmente el manifiesto anterior; el archivo del commit exacto contiene 0.1.27. Launcher Latest permanece **0.1.21**. No se publicaron ni modificaron modpacks.
- **Servicio desplegado:** Worker **1.2.5**, versión `7757d202-bd71-45b2-b90c-470e67988a8b`, health HTTP 200. Migración aditiva `0007_manual_announcements.sql` aplicada: tabla e índice independientes para anuncios personalizados. Punto de restauración del Worker anterior: `eecab311-1b99-4ded-a585-8dc80e9883cd` (1.2.4). Wrangler recibió autorización oficial adicional para D1; no se copiaron credenciales al informe.
- **Administrador implementado y distribuido:** menú por lanzador «Anuncios Discord», borrador local, selección de canal, texto, imagen PNG/JPEG normalizada sin alterar el original, vista previa, menciones explícitas y confirmación antes de encolar. Historial con estados reales; encolado no se presenta como entregado. El servicio confirma que el lanzador está publicado, incluso si su indicador local aún es antiguo.
- **Bot implementado y distribuido:** entrega de anuncios personalizados mediante la cola firmada existente, comprobación fresca de administrador, servidor, canal, rol y permisos, imágenes verificadas y menciones limitadas a lo confirmado. Identificadores y huellas evitan duplicados. Una comprobación transitoria del servicio debe ser reciente (90 s) para entregar mensajes personalizados. Se mantienen la sincronización segura y la alternativa directa con Discord.
- **Diagnósticos y transporte:** se conservan las etapas y códigos permitidos sin divulgar credenciales; poll de anuncios dispone de 45 s y otras operaciones mantienen sus presupuestos. La versión de la aplicación deja de ocultarse por error en el encabezado del diagnóstico. No se demostró la causa original de los fallos de red históricos de otra PC.
- **Pruebas:** ejecución local específica final de **99 aprobadas, 0 fallidas**, con simulaciones de Worker/D1/Discord, permisos, autenticación, imágenes, cola, deduplicación y transporte. No es una auditoría general ni una prueba de envío real. Ambos paquetes Windows arrancaron con renderer en perfiles aislados y red bloqueada. Los instaladores finales se compilaron en D: después de que los intentos anteriores fallaran por ENOSPC en C:.
- **Instalaciones observadas:** metadatos de los ejecutables locales: Launcher 0.1.21, Administrador 0.1.27 y Bot 0.2.7. En el Bot se confirmó además la versión 0.2.7 y el endpoint dentro del paquete instalado. Esto no equivale a comprobar todas las operaciones con la cuenta del propietario.
- **Anuncio VillaWolf × YFATY22:** sigue sin enviarse; existen borrador e imágenes de vista previa. La imagen original se conservó; la copia normalizada pesa 264738 bytes. D1 registra enviados los avisos de Launcher 0.1.21 en sus dos destinos, con un intento cada uno; no se enviaron de nuevo en esta comprobación. El aviso de Administrador 0.1.27 continúa pendiente, con cero intentos; no se afirma su entrega.

### Incidentes y traslado local: parcial; enlace de caché recuperado

- El propietario reportó `ENOTFOUND` en `reset` y `announcements-poll`, con Discord conectado y espera de 900 s. Windows, Node y una comprobación aislada con Electron resolvieron el dominio configurado y recibieron HTTP 200 del Worker 1.2.5. No se dispone de evidencia que determine por qué falló la resolución en el proceso original. Tras la vinculación de la clave por el propietario y el reinicio del Bot, se confirmó sincronización real y consulta autenticada de la cola. La causa histórica del ENOTFOUND sigue sin determinarse.
- Se inició copia del proyecto y datos de VillaWolf a `D:\VillaWolf`. **No se completó el traslado ni la liberación de los originales.** La copia del proyecto se utilizó para compilar y publicar; su comprobación integral como traslado quedó interrumpida. El proyecto original sigue legible en C:, además de la copia en D:.
- **Causa de la incidencia de enlace confirmada:** Windows redirigió las operaciones de Roaming realizadas por Codex a `C:\Users\tonyv\AppData\Local\Packages\OpenAI.Codex_2p2nqsd0c76g0\LocalCache\Roaming`. La unión se creó dentro de esa caché; al acceder a ella mediante el alias de Roaming devolvía 649 / `STATUS_MOUNT_POINT_NOT_RESOLVED`. La ruta física permitió comprobar el tag de unión y su destino y retirar sólo el enlace, sin borrado recursivo. Después se confirmó que `Roaming\MiLauncher\instances` vuelve a ser legible.
- El Explorador de Windows mostró la carpeta real `Roaming\MiLauncher` sin renombrar. **La carpeta real de mundos del propietario no fue trasladada ni eliminada.** La copia de trabajo renombrada permanece en la caché física de Codex, como `MiLauncher.traslado-20261016`; se conserva además `D:\VillaWolf\Datos\MiLauncher`. No confundir la caché con la ubicación real usada por la aplicación. Scripts y resultados: `D:\VillaWolf\Migracion-20261016`. El traslado del usuario sigue pendiente; no se declara espacio liberado por esta operación.
- CurseForge se excluyó de las operaciones posteriores por decisión del propietario, que realizará su traslado. Quedó una copia inicial en `D:\CurseForge\Instancias`, sin verificación completa; no debe considerarse su única copia ni un traslado finalizado.
- **Bot, vinculación y sincronización confirmadas:** el propietario guardó la clave de conexión del Bot como secreto ROLE_BOT_KEY en Cloudflare, sin compartirla en el chat. Tras detener e iniciar el Bot real 0.2.7, su interfaz confirmó Discord conectado, roles sincronizados y consulta de anuncios. D1 registró los tres servidores activos con ready=1: 1007732653035880589, 1100890182884012062 y 751907899336556574. Dos comprobaciones observaron confirmaciones recientes (aproximadamente 16–19 s y después 2 s), dentro del límite de 90 s. El HTTP 401 de firma dejó de reproducirse en estas operaciones. La interfaz confirmó que un diagnóstico antiguo se conserva para consulta sin volver a publicarlo. No se extrajeron secretos ni se modificó código para esta vinculación; se mantiene la alternativa directa con Discord. Esto no demuestra disponibilidad permanente ni entrega del anuncio aún pendiente.
- **Recomendación prioritaria:** no continuar migraciones de perfiles usando el alias de AppData desde Codex sin tener en cuenta la redirección de Windows. Evitar nuevas uniones para perfiles hasta comprobar compatibilidad con las protecciones contra enlaces de sesiones y borradores. No se debilitaron esas protecciones ni se modificaron hashes, credenciales u originales de CurseForge. Los intentos previos de reparación no requieren reiniciar Windows: el enlace de caché ya fue retirado.

## Lanzamiento publicado — Launcher 0.1.21, 16 de octubre de 2026, 18:27

El propietario autorizó publicar la corrección del Launcher. **0.1.21 publicada y marcada Latest**, tag `v0.1.21`, commit `f557ce97fc4c26f5342bf4839be276b8c5f3af7a`: reintentos de SHA-256 por archivo, presentación sin selección y corrección local previa de escritura atómica del registro de limpieza, con diagnóstico de JSON dañado y supresión de errores idénticos cada cinco segundos. **40/40 pruebas finales aprobadas, ninguna fallida** (integridad, limpieza, descargas asistidas, fuentes oficiales, sesiones y versiones/actualizador). Compilación Windows x64, correspondencia de módulos empaquetados con el código, metadatos SHA-512 del actualizador y arranque real del paquete en perfil aislado aprobados. Descarga pública completa del instalador, blockmap y latest.yml comprobada contra SHA-256 y tamaño locales. Instalador: 115094625 bytes, SHA-256 `ba1aee64650cd6aa1adaa3e3eccadb047613ea127bc316a29f11921ddc461f52`. `SHA256SUMS.txt` adjunto. Firma de editor: NotSigned. No se instaló ni probó manualmente la actualización en otra PC ni se modificó el modpack. [Release oficial](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.21).

**Bot, corrección local independiente:** se leyó el diagnóstico del 16 de octubre, 17:58, referencia `3e754dd0a7d9120b8e5e0f0a`: timeout al consultar/confirmar anuncios; el log también contiene fallos de transporte de heartbeat/reset en tres servidores. La referencia `b5dec696f557d9b3cb3c7b68` había perdido la causa original. Se conserva ahora la etapa real (poll/ack/reset/metadata/heartbeat), se clasifican códigos de transporte permitidos sin mensajes sensibles y se rechazan respuestas JSON/incompletas sin confirmar éxito. Poll dispone de 45 s en lugar de 15 s porque el servicio consulta upstreams con presupuesto individual de 15 s; ack y sincronización mantienen 15 s. **26/26 pruebas específicas y regresiones aprobadas, 0 fallidas**, sin envíos reales ni despliegue. No se demostró qué originó los fallos históricos de red: no afirmar que se corrigió la conexión de la otra PC. Se conserva el límite de seguridad remoto de 90 s, la alternativa directa de Discord, las firmas y los mecanismos contra duplicados. Bot no compilado/publicado/instalado con estos cambios.

**Mensaje personalizado por lanzador:** en desarrollo; existen el modelo y el servicio local inicial, pero faltan conexión con los menús del Administrador, entrega completa mediante el Bot y pruebas. El anuncio VillaWolf × YFATY22 sigue como borrador local; no se envió.

## Diagnóstico y preparación anteriores a publicar 0.1.21 — 16 de octubre de 2026

- **Evidencia leída en el registro privado de Discord:** Launcher 0.1.20, 18:11 hora local: SHA-256 incorrecto en `mods/oculus-mc1.20.1-1.8.0.jar` y `mods/fastasyncworldsave-1.20.1-2.6.jar`. Referencias `618d2b0733ff938badedcb03` y `240029c02ae5bbe52968ca28`. El propietario identifica la PC como otra computadora; el diagnóstico no identifica por sí solo el equipo. Los registros no contienen los hashes recibidos ni los bytes de esas descargas: la causa de la discrepancia sigue sin determinarse, sin atribuirla al proveedor o a la red.
- **Implementado y probado localmente, sin publicar ni instalar:** el Launcher reintenta sólo el mod cuya descarga completada no coincide con SHA-256, hasta tres intentos totales, esperas de 400/800 ms y misma URL mediante el transporte autorizado existente. No reintenta rechazos de permisos, transporte o redirecciones. Descarta bytes incorrectos y mantiene el staging previo a instalar. Un fallo permanente detiene la actualización con archivo, intentos, hash esperado/recibido y tamaño; nunca cambia el hash esperado. Los archivos ya aprobados en el mismo recorrido no vuelven a descargarse. No se añadió caché persistente entre recorridos fallidos.
- **Presentación corregida localmente:** referencia `ac9a76cfeb12fbda7c5c3043`, 18:06: «Elige un modpack autorizado en tu biblioteca». La consulta automática no se ejecuta cuando el catálogo está activo y aún no hay un pack seleccionado. Con selección activa se conservan las verificaciones y errores de acceso.
- **Pruebas ejecutadas:** 9/9 específicas (`verificar-integridad-launcher.cjs`), 16/16 regresiones de descargas asistidas, fuentes oficiales y eliminación de modpacks; 0 fallidas. Comprobación sintáctica de `src/main.js` aprobada. Se usaron buffers y descargas simulados para los reintentos; no una actualización de modpack real.
- **Estado al preparar:** entonces faltaba distribuir; posteriormente se publicó 0.1.21 como se indica arriba. Sigue pendiente confirmar el comportamiento en la otra PC. No se modificaron modpacks, originales CurseForge, mundos, sesiones ni Cloudflare. Se conserva el trabajo local previo, incluido el menú de anuncios por lanzador en desarrollo; las correcciones del Bot se describen arriba por separado.

**Corte documental: 16 de octubre de 2026, 09:17, America/Mexico_City.**
Este resumen vigente prevalece sobre los antecedentes conservados al final. Las entradas antiguas describen su fecha y no son el estado actual. Esta revisión sólo modifica documentación: no ejecuta nuevas pruebas funcionales, instala aplicaciones, publica releases, cambia modpacks ni despliega servicios.

## Versiones comprobadas y repositorio

| Componente | Público / producción | Instalado en esta PC | Desarrollo local y alcance |
| --- | --- | --- | --- |
| Launcher Windows x64 | **0.1.21** (`v0.1.21`) | **0.1.21**, metadatos comprobados | No hay nueva release del Launcher en este lanzamiento. Recuperación del traslado local pendiente. |
| Administrador Windows x64 | **0.1.27** (`admin-v0.1.27`) | **0.1.27**, metadatos comprobados | Anuncios personalizados por lanzador publicados; entrega real pendiente de confirmación. |
| Bot Windows x64 | **0.2.7** (`bot-v0.2.7`) | **0.2.7**, ejecutable y paquete comprobados | Anuncios personalizados y diagnósticos publicados; sincronización real confirmada en tres servidores tras vincular la clave. ENOTFOUND histórico sin causa demostrada. |
| Worker villawolf-auth | **1.2.5** | Servicio remoto | Migración aditiva aplicada y health HTTP 200; no se afirma una entrega real sin evidencia. |
| Mundo Conejil | **0.1.11** en stable-v2.json al consultar | No se inspeccionaron todos los juegos instalados | Versiones de modpack independientes; contenido y Error 009 se trabajan en otro flujo. |

- Repositorio oficial: [champagne-vol5-modpack](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack), rama **preparacion-paso97**. El código local corresponde al prefijo remoto `launcher/`; esta carpeta local no tiene `.git`.
- HEAD observado antes de documentar: `52ef82a9cd8ecd4107da335a0e3c76aca9dad51f` (cambio de diseño de Mundo Conejil). Se preserva ese trabajo; no se modifica su manifiesto.
- Código del lanzamiento Launcher/Bot: `855bd7ae24f70766b662f0c3dda13a3f9f951947`. Registro central: `083984007707d8aec8719451782c2925b3d10710`, pruebas `b31dfa3c0973a2460d52c4f5258671956a31ed43`, documento `24ef5ec523f6609bca95815e22042664a370a787`.
- Worker 1.2.4: despliegue `eecab311-1b99-4ded-a585-8dc80e9883cd`; recuperación anterior 1.2.3 `861107e4-0321-4e9d-bbae-c6c7a822ff15`. No se desplegó nada en esta revisión documental.
- Releases regulares de desarrollo 0.x, no equivalentes a estabilidad 1.0.0: [Launcher](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.21), [Administrador](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.26), [Bot público](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.5).

## Cómo interpretar la evidencia

**Publicado/desplegado**, **instalado**, **implementado local**, **parcial**, **aprobado pendiente**, **propuesto**, **pausado** y **no verificado** son estados distintos. Una prueba simulada no acredita funcionamiento en producción. Los conteos de pruebas citados son ejecuciones históricas identificadas, no se suman como pruebas únicas ni se presentan como repetidas hoy. Las prioridades no autorizan implementar o publicar.

## Inventario vigente por componente

### Launcher

| Función | Estado y evidencia / límite |
| --- | --- |
| Discord obligatorio, sesión cifrada y restauración | Publicado. OAuth loopback, propósitos separados y safeStorage; pruebas de sesión. No afirmar renovación real después de vencer. |
| Microsoft Java Premium opcional | Publicado y parcial en validación: código Microsoft/Xbox/licencia/perfil, UUID y skin; capturas aportadas por el propietario acreditan vinculación y mundo 1.20.1 con identidad oficial. Falta renovación real vencida, más cuentas y servidor online. |
| Código Microsoft y avatar | Publicado desde 0.1.18: copia automática del código, guía de autorización; avatar Discord o cabeza de skin oficial con Premium. No automatiza contraseña, MFA ni consentimientos. Carga local de avatar PNG retirada del flujo. |
| Biblioteca y roles por mundo/servidor | Publicado: catálogo autorizado rápido, imágenes posteriores, caché vinculada a cuenta; guildId por lanzador. Jugadores externos no necesitan rol en VillaWolf. Apertura, nuevas descargas y JUGAR mantienen controles; caché visual no autoriza ejecución. |
| Instancias, carpetas y opciones | Publicado: nombre legible e identidad estable, carpetas separadas, Abrir carpeta de instancia/raíz, descargar, jugar y borrar local con confirmación. Cambio de nombre no fusiona mundos. |
| Actualización de modpacks e integridad | Publicado: fuentes autorizadas, hashes, preparación, configuración administrada y rollback. Error 008 publicado en 0.1.20: archivo ausente ya eliminado no bloquea; historial de propiedad y consentimiento con respaldo para desconocidos/modificados. |
| Descargas CurseForge / asistidas | Publicado: coincidencia oficial exacta y restricciones de distribución; SHA-256 obligatorio. No todos los autores permiten descarga automática; la alternativa asistida permanece. |
| Minecraft / Forge / Java / RAM | Publicado para perfiles admitidos; Java 17/21 y RAM configurable. Compatibilidad individual según tabla inferior, nunca universal. |
| Reparación y estados de interfaz | Publicado: reparación de componentes, bloqueo de JUGAR mientras se prepara/ejecuta, errores con copiar/registro y actualización del ejecutable. No equivale a recuperar un mundo ni a reparar automáticamente todo JSON dañado. |
| Limpieza de lanzadores retirados | Publicado, con incidente activo de robustez: cola compartida por todos los modpacks. Datos reparados sólo en esta PC; parche de escritura/aviso aún local. |
| Diagnósticos de aplicación | Publicado: cola cifrada, saneamiento y envío a registro. Excluye fallos de ejecución de Minecraft. Estados sin sesión/modpack todavía producen ruido y la deduplicación local no persiste entre reinicios. |

Referencias: `src/main.js`, `champagne-auth.js`, `champagne-microsoft.js`, `champagne-library-hydrator.js`, `champagne-game-profile.js`, `champagne-pack-purge.js`, `champagne-problem-reporter.js`, pruebas de versiones, acceso, Microsoft, limpieza y sesión.

### Administrador

| Función | Estado y evidencia / límite |
| --- | --- |
| Acceso Discord | Publicado: Administrador **u Owner** del servidor oficial, validado en servicio y operaciones sensibles. No basta una etiqueta admin en un servidor externo; tampoco se exige Gestionar servidor allí: pertenencia y Bot autorizado según decisión aprobada. |
| Crear lanzador | Publicado: asistente oscuro de cuatro pestañas (Información, Archivos, Discord, Publicación), borrador persistente y flujo para preparar/publicar desde creación. Guardar borrador no publica. La biblioteca sólo lo recibe tras publicación confirmada y permisos. |
| Edición y menús | Publicado: Edición de interfaz, Carpetas y archivos, Información del servidor y Configuración de Discord. Navegación separada; servidor informativo sigue No disponible. El cuarto menú Discord fue aprobado posteriormente. |
| Imagen, noticias y diseño | Publicado: fondo, nombre, noticias/notas, vista previa y publicación sin cambiar mods/versión. Imagen inicial existe; editor de icono independiente por modpack no acreditado. |
| Análisis / preparación / publicación | Publicado: detecta CurseForge, revisión, selección, fuentes, hashes, paquete aislado, comprobación antes de activación y conflictos. Nunca modifica los originales. Error 007 en 0.1.26: hasta tres intentos totales compartidos HTTP/integridad por archivo, caché sólo aprobada. |
| GitHub central | Publicado: credencial del servicio, permisos limitados a catálogo/manifiestos/historial; no se entrega token a administradores. Token local cifrado como alternativa si el servicio confirma ausencia de conexión central. |
| Historial / recuperación | Publicado: versiones y manifiestos, recuperación como nueva versión superior; no restaura mundos ni requiere reescribir commits. Respaldos locales de instalación separados del historial del modpack. |
| Borradores y almacenamiento | Parcial: creación y diseño de borradores guardados, carpeta de origen por pack y preparados. No acredita restauración integral de toda sesión de edición/publicación interrumpida. |
| Discord por lanzador | Publicado: oficial/externo, rol, canales opcionales y menciones; edición de esas opciones, comprobación de Bot, canales y pertenencia. Sin @everyone/@here automáticos. |
| Auditoría / eliminación | Publicado: autor verificado, cambios reales de cada publicación y quién elimina. Eliminación definitiva exige confirmar y conserva originales de CurseForge y commits. No utilizar para arreglar autenticación. |
| Servidor Minecraft / hosting | Pendiente: no hay SFTP/API, preparación automática, reinicio ni respaldo/restauración de hosting implementados y verificados. La interfaz informativa no equivale a estas funciones. |

Referencias: `tools/admin-modpack/main.cjs`, `engine.cjs`, `wizard.js`, `community-editor.js`, `draft-store.cjs`, `verified-content-cache.cjs`, `reliable-request.cjs`; pruebas de creación, catálogo, navegación, integridad y preparación.

### Bot y Cloudflare

| Área | Estado y evidencia / límite |
| --- | --- |
| Bot: acceso, identidad, instalador y actualizador | Público 0.2.5, local 0.2.6; Discord central Administrador/Owner, token cifrado guardado, identidad amarilla, versión y Buscar actualización. No crea ni renueva un token Discord revocado. |
| Bot: roles y varios servidores | Publicado y comprobado en VillaWolf/Racoon: Gateway, Server Members Intent, sincronización independiente, metadatos y latidos firmados. PC y proceso deben permanecer activos. |
| Bot: conexión y diagnósticos | Publicado: conexión separada de roles/anuncios, latencia si existe, historial saneado/cifrado, clasificación y backoff. Pendiente limpiar campos residuales 503 después de recuperar. |
| Bot: anuncios y deduplicación | Publicado: cola persistente central, reservas, confirmación, reconciliación, reintentos. Release oficial más instalador/descarga/SHA-256 antes de anunciar. Entrega real Launcher 0.1.20 única comprobada; no prueba todos los escenarios del Error 004. |
| Bot: filtro de errores antiguos | Sólo 0.2.6 local: diagnósticos mayores de una hora se conservan sin enviar, con retry de 24 h; no se marcan enviados. No es archivo terminal: consume una revisión diaria. Avisos de versiones y auditorías no se filtran. |
| Cloudflare: autenticación y D1 | Desplegado 1.2.4: sesiones cifradas/hash, roles centrales y por mundo, snapshot breve sólo para navegación y fallback Discord. Antigüedad de Bot máxima 90 s conservada. Health no demuestra por sí solo sesión/roles válidos. |
| Cloudflare: publicación y CurseForge | Desplegado: comprobaciones del commit/rama/autor y restricciones de rutas, API oficial mediante secretos, catálogos y eliminaciones. No aloja el proceso Gateway del Bot. |
| Cloudflare: anuncios y auditoría | Desplegado: cola y cursores oficiales independientes de modpacks, notificaciones por comunidad, auditoría central de acciones/cambios. No se activa un anuncio por editar un archivo local. |
| Copia central de publicaciones | Desplegada 1.2.4: canal 1559335322926710794, versión/notas/portada y administrador del recibo. Independiente del anuncio configurable y sin menciones. 39 pruebas simuladas; primera entrega real de una nueva versión pendiente. |
| Diagnósticos privados centrales | Parcial en estabilidad: recepción/consulta real con botones verificadas en Discord, acceso administrativo y saneamiento. No registra cuerpos secretos; si D1 falla puede no registrar su propio error. Faltan ruido, agrupación, retención y pruebas de disponibilidad. |
| Centro de Envíos / alojamiento | Propuesto: no existe una consola completa de reenvío/cancelación/consulta de colas. Inicio automático de Windows y hosting permanente no encontrados implementados; no declararlos operativos. |

Referencias: `auth-server/roles-bot/bridge.cjs`, `notifications.cjs`, `official-release.cjs`, `state.cjs`, `access.cjs`, `diagnostics.cjs`; `auth-server/cloudflare/worker.mjs`, `application-reports.mjs`, esquema y migraciones.

## Compatibilidad de Minecraft y límites externos

| Perfil | Estado verificable |
| --- | --- |
| Minecraft 1.20.1 / Forge 47.4.10 / Java 17 | Arranque real anterior en esta PC y evidencia del propietario. No repetido hoy. |
| Minecraft 1.21.1 / Forge 52.1.0 / Java 21 | Preparación automática probada; juego real pendiente. |
| Otros Forge modernos desde 1.18 | Validación del motor admite perfiles; cada combinación/modpack sigue sin acreditación individual. |
| Fabric / NeoForge / Quilt | Sin soporte liberado; controles bloqueados, trabajo pausado hasta soporte y pruebas específicos. |

CurseForge es fuente/gestor, no loader. Una licencia Premium, el rol Discord y la compatibilidad de mods son verificaciones distintas. No todos los archivos CurseForge permiten distribución automática; no se cambian hashes para aceptar discrepancias. Microsoft requiere una licencia/perfil Java válido y aprobación de la aplicación; no se promete acceso a cuentas sin licencia. Discord puede aplicar límites: mantener Retry-After y no reiterar solicitudes para eludirlos.

## Registro consolidado de errores 001–009 y adicionales

| ID / componente | Causa confirmada o límite | Corrección y distribución | Evidencia y estado actual |
| --- | --- | --- | --- |
| 001 Bot: conexión confundida con cola/roles | Estados mezclados y diagnósticos genéricos; ready local anticipado | Estados independientes en 0.2.4; bridge/backoff/confirmación reforzados en 0.2.5 | Simulaciones y sincronización real tras reinicios. Resuelto en escenarios comprobados; disponibilidad continua y estado residual pendientes. |
| 002 Launcher: biblioteca lenta | Tarjetas esperaban imágenes | Hidratación posterior y caché autorizada, incluida 0.1.19 | Pruebas de concurrencia/cambio de cuenta. Mejora implementada/publicada; sin medición representativa en otras PCs. |
| 003 Aplicaciones: diagnósticos incompletos | Captura/cola/consulta insuficientes | Clientes 0.1.19 / Admin 0.1.26 / Bot 0.2.4+, servicio 1.2.3 | 108 pruebas históricas compartidas y consulta real de botones. Parcial: falsos errores de estado, deduplicación tras reinicio y retención. |
| 004 Anuncios duplicados | Causa del incidente original no demostrada | Reservas, claves por evento, reconciliación ya operativas | Un anuncio 0.1.20 / un intento / un trabajo comprobados y pruebas de cola. **En observación**, no cerrado globalmente ni reproducido mediante publicaciones. |
| 005 Administrador: verificaciones/subidas repetidas | Recursos sin cambios se procesaban de nuevo | Caché segura de bytes/comprobantes y blobs idempotentes, 0.1.26 | Pruebas simuladas con hashes, conflictos, caducidad y fuentes. Publicado; ahorro real de red/tiempo pendiente de medir. |
| 006 Administrador: botones/menús superpuestos | Visibilidad no ligada a vista | Navegación por estado, incluida 0.1.26 | Pruebas e inspección instalada anterior. Resuelto en casos ensayados; tamaños/equipos adicionales pendientes. |
| 007 Administrador: integridad intermitente | Hashes recibidos en fallos reales no conservados; no atribuible a red/proveedor sin evidencia | Máximo tres intentos por archivo, bytes fallidos descartados, límite HTTP/hash compartido; 0.1.26 | 38 pruebas originales, comprobaciones locales posteriores. Corrección publicada; causa histórica de las discrepancias permanece no confirmada. |
| 008 Launcher: eliminación histórica bloqueaba actualización | Exigía propiedad en installed.json aun si archivo ya no existía | 0.1.20: ausencia cumplida, historial de propiedad/hash, consentimiento y respaldo para desconocidos/modificados | Pruebas limpias/saltos/rollback/rutas; paquete publicado e instalado. Prueba manual extensa en otras PCs pendiente. |
| 009 Modpack: Chunky / Distant Horizons | Crash aportado: DistantHorizons 3.3.3 → ChunkyAccessor → Chunky 1.3.146, IllegalStateException | Sin cambio en este flujo; proyecto del modpack | Pendiente diagnóstico/solución en dicho proyecto. No retirar mods ni alterar versiones aquí. |
| JSON de limpieza / Launcher | deleted-packs.json local con 97 bytes nulos; origen no confirmado | Cuatro IDs restaurados desde catálogo validado en esta PC. Escritura fsync/reemplazo, diagnóstico y antirrepetición sólo locales | 9 pruebas específicas; no distribuido. Recuperación automática completa propuesta, no implementada. Reinstalar 0.1.20 o retirar rol no garantiza reparación en otros equipos. |
| OAuth / snapshot D1 | Renovación escribe nuevo cifrado; snapshot compara con cifrado anterior de la fila | Sin corrección acreditada | Observación sustentada en worker.mjs, no fallo real reproducido. Falta regresión de renovación/snapshot y evaluación de concurrencia; no modificar en documentación. |
| Permisos de anuncios | Registros reales Missing Permissions | Excepciones individuales en canales oficiales Launcher/Admin; persistencia verificada | Resuelto para destinos comprobados, sin permiso Administrador. Otros canales requieren validación propia. |
| Sincronización obsoleta | Instalación antigua; D1 llegó a ~55 min. Causa inicial del cese no recuperada | Bot nuevo, reinicios, diagnóstico y despliegue compatibles | Señales reales dentro de 90 s comprobadas repetidamente. No afirmar una causa inicial concreta ni uptime 24/7. |
| Diagnósticos tardíos / ruido | Cola conserva hora/versión original, uno por flush; sin sesión/modpack también se captura | Filtro local Bot 0.2.6 para antigüedad; clasificación del cliente aún pendiente | 20 pruebas filtro/envío/sync y cola real vacía al revisar. No confundir entrega tardía, referencia distinta y duplicación de envío. |
| SignPath / firma | Rechazo registrado por visibilidad/adopción insuficiente según correo citado previamente | Sin certificado concedido; alternativas pendientes | Instaladores públicos consultados devuelven NotSigned. El correo original no se reabrió hoy; véase política. |

Otros antecedentes (conflicto de diseño GitHub, borrador inválido por ID antiguo, nombres con [Forge]/Unicode, arranque del Administrador, catálogo sin refrescar) se conservan en el historial. No convertir sus antiguas limitaciones en el estado vigente.

## Pruebas: automatizadas, manuales y pendientes

- Históricas: tanda 001/002/003/005/006, **108** pruebas y **6** comprobaciones UI; Error 007 **38**; entrega 0.1.20/0.2.5 **92**; JSON **9**; filtro Bot **20**; copia central **39**. Son conjuntos solapados, con fechas/alcance conservados abajo. No se ejecutaron de nuevo durante esta revisión documental.
- Distribución anterior: instaladores descargados y contrastados por tamaño/SHA-256; actualizadores detectaron versiones; ASAR cotejado. Hoy sólo se consultaron releases/metadatos y firmas locales, no se descargaron otra vez todos los EXE.
- Manual en esta PC: Launcher 0.1.20, Admin 0.1.26 y Bot 0.2.6 instalados/abiertos en intervenciones anteriores; 6/12/5 archivos protegidos idénticos respectivamente. Bot: reinicio y roles reales; Discord: lectura de diagnósticos y entrega única del anuncio Launcher 0.1.20. El juego no se lanzó hoy para documentar.
- **Pruebas manuales reportadas por el propietario:** cerró/abrió Launcher y conservó sesiones Discord/Microsoft; comprobó instalador y actualizaciones en versiones anteriores; retiró/reasignó roles y respondió el acceso; comprobó actualización de modpacks. Se registran como testimonio del propietario, no como automatización ni ejecución del agente.
- Pendientes: tokens realmente vencidos/revocados, renovación y snapshot, cuenta Premium/skin/servidor online en más casos, instalación/actualización en otra PC, cortes de red/energía, recuperación automática de JSON, primera copia central real, permisos/errores de cada servidor externo, rendimiento con bibliotecas grandes y privacidad end-to-end con D1 no disponible.

## Arquitectura, seguridad y límites de operación

Electron separa Launcher (`src/`), Administrador (`tools/admin-modpack/`) y Bot (`auth-server/roles-bot/`). Worker + D1 (`auth-server/cloudflare/`) autentican y autorizan, guardan sesiones cifradas, catálogo/recibos/cola/auditoría. GitHub conserva fuentes/releases y `updates/`; el cliente descarga únicamente fuentes oficiales admitidas y valida hashes. Los originales CurseForge permanecen fuera de las instalaciones VillaWolf. Cambiar identidad Microsoft/offline puede cambiar inventario; no hay migración automática acreditada.

El Bot Gateway se ejecuta en la PC del propietario, no dentro de Cloudflare ni de los launchers de jugadores. Alojamiento Oracle Always Free intentado anteriormente sin capacidad; no hay VM permanente acreditada. No distribuir el token del Bot. Credenciales locales cifradas por Windows y secretos de servicio fuera de Git; informes sin tokens, cuerpos OAuth o logs de Minecraft. Acceso administrativo central no implica aislamiento por dueño/equipo. Respetar rutas, enlaces/junctions, consentimiento y respaldos. Eliminar un lanzador puede borrar sus mundos: no confundir con quitar un rol.

Cron configurado actualmente `*/15 * * * *`, no horario. Logs detallados de solicitudes desactivados. El health confirma vida/versión, no certifica todas las integraciones. Cola y reintentos no equivalen a hosting continuo ni a entrega garantizada sin permisos.

## Decisiones, pendientes y prioridades (no autorizan implementación)

1. **Prioridad de datos:** distribuir tras autorización la protección local JSON; diseñar recuperación sólo con respaldo y catálogo autorizado; revisar OAuth/snapshot, ruido de diagnósticos y campos residuales.
2. **Validación:** actualizaciones, reversión y cortes en otras PCs; primera copia central real con próxima publicación; diagnósticos y deduplicación persistente; estabilidad de roles dentro de 90 s.
3. **Seguridad y estabilidad:** firma Windows, revisión de privacidad/retención, permisos mínimos y recuperación ante D1/red caída; no rebajar hashes ni TTL.
4. **Funciones parciales:** Microsoft completo, más perfiles Forge probados, recuperación integral de edición y observabilidad de envíos.
5. **Aprobadas pendientes:** automatización de preparación/actualización de servidores y respaldos/SFTP/API, sujeta a proveedor, diseño y pruebas; disponibilidad permanente del Bot. No hay fecha de entrega autorizada.
6. **Propuestas por decidir:** Centro de Envíos, modelo de equipos/propietarios, icono editable independiente, política de archivo definitivo/retención, hosting concreto e inicio automático. No se inventa aprobación del detalle técnico.
7. **Pausado:** Fabric, NeoForge y Quilt; Oracle mientras no haya capacidad/alternativa aprobada. Hosting rotativo del Bot desde PCs de jugadores no se adoptó: implicaría exponer credenciales y disponibilidad no garantizada.
8. **1.0.0 futura:** exigir estabilidad, matriz de compatibilidad real, actualización/rollback, recuperación, auditoría y distribución segura verificadas; sin fecha prometida. La propuesta histórica 1.1.0 no identifica una release actual.

No se descarta trabajo por falta de evidencia: se marca pendiente de confirmación. Véase [ROADMAP.md](ROADMAP.md), [README.md](README.md), [política de firma](CODE_SIGNING_POLICY.md), [guía](docs/tutoriales/GUIA_VILLAWOLF.md), [servicio](auth-server/cloudflare/README.md), [Bot](auth-server/roles-bot/README.md) y [Administrador](tools/admin-modpack/README.md).

## Revisión documental de este corte

Finalización local: 2026-10-16 09:26 -06:00 (America/Mexico_City). Doce documentos revisados, 58 enlaces relativos vigentes comprobados y sin patrones de credenciales detectados. Hash agregado de 213 archivos funcionales sin cambios. Sólo documentación autorizada para sincronizar; sin nuevas pruebas funcionales ni cambios de releases/producción. Se conservaron antecedentes, generalizando rutas del perfil personal. La sincronización se hará con un único commit documental sobre la rama verificada, conservando su HEAD de diseño de modpack.

## Archivo histórico conservado — no representa el estado vigente

Las siguientes entradas se conservaron para no perder decisiones, pruebas, versiones desde 0.1.16 y antecedentes. Frases como «actual», «pendiente», «sigue en 0.x» o «no desplegado» describen el momento de esa entrada; para el corte vigente usar las secciones anteriores. Algunas notas son pasos sucesivos del mismo trabajo, no resultados contradictorios del presente.
### Informe histórico anterior

**Actualizado:** 16 de octubre de 2026 (America/Mexico_City).
**Alcance:** VillaWolf Launcher, VillaWolf Administrador, autenticación/publicación central y bot de roles.
**Propósito:** compartir avances y pendientes con otra persona o ChatGPT sin conceder permisos para modificar código.

## Lanzamiento 0.1.20 / 0.2.5 — publicados y verificados

**Bloqueo operativo resuelto y comprobado en vivo:** el proceso instalado seguía siendo Bot 0.2.3 PRUEBA LOCAL 20261015.1, sin las correcciones nuevas. Se respaldó su app.asar y datos locales cifrados, se aplicó un parche local de diagnóstico con el bridge nuevo y anuncios/informes remotos desactivados y se reinició dos veces. D1 confirmó en VillaWolf y Racoon Team ready=1, secuencias 4→8 y antigüedades 24–25, 12 y 23 segundos, siempre por debajo de 90. Sin inventar fechas ni escribir role_bot_state desde las herramientas de diagnóstico. La autenticación existente funcionó sin reemplazar claves ni tokens. La causa inicial interna del cese anterior no quedó conservada en los registros disponibles y no se atribuye a intents/clave sin evidencia.

**Causa confirmada de los anuncios anteriores:** los registros cifrados, consultados dentro del propio Bot, contenían `announcement-delivery: Missing Permissions`. Es independiente de los latidos de roles. Las excepciones individuales de Ver canal, Enviar mensajes, Insertar enlaces y Leer historial ya están guardadas y verificadas tras recargar en los dos canales oficiales. No se concedieron Administrador/Gestionar roles ni se cambiaron otros roles/categorías.

**Worker 1.2.3 desplegado:** versión Cloudflare `861107e4-0321-4e9d-bbae-c6c7a822ff15`; health público HTTP 200 confirma 1.2.3. Mismo protocolo firmado, esquema D1 existente y límite de 90 segundos; diagnósticos centrales y cursores oficiales independientes preparados en el código desplegado. Configurado ADMIN_RELEASE_ROLE_ID con el ID real 1559330834278781048. Wrangler autorizado mediante OAuth limitado a lectura de cuenta y escritura de Workers/scripts; credencial en almacén seguro de Windows, sin exponerla.

**Activación sin histórico:** establecidos cursores oficiales previos Launcher 0.1.19 y Administrador 0.1.26. Seis trabajos antiguos de esos dos canales quedaron `superseded`, conservando las filas y el historial; no se enviaron. No se alteró la cola configurable de otras comunidades. No hay nueva versión del Administrador en este lanzamiento.

**Distribución completada:** Launcher 0.1.20 y Bot 0.2.5 publicados oficialmente; descargas públicas verificadas por tamaño y SHA-256. 92 pruebas finales aprobadas, 0 fallidas; ambos paquetes arrancaron en perfiles aislados. ASAR contrastado con los módulos locales. Actualizadores públicos: Launcher 0.1.19 detecta 0.1.20 y Bot 0.2.4 detecta 0.2.5. Instaladores sin firma Authenticode pública; pendiente firma de distribución. Código publicado en champagne-vol5-modpack, rama preparacion-paso97, commit 855bd7ae24f70766b662f0c3dda13a3f9f951947. La carpeta local no tiene .git.

**Última comprobación del 16 de octubre:** tras volver a abrir Bot 0.2.5, D1 registró ready=1, secuencia 6 y antigüedad real de 11 segundos en VillaWolf y Racoon Team. El trabajo del anuncio siguió único. Antes de reabrir se observó antigüedad de 321 segundos; el almacenamiento conservaba el último estado local y no bastaba para demostrar ejecución vigente. No se establece la causa de esa interrupción.

**Anuncio oficial verificado:** Launcher 0.1.20 enviado en su canal fijo, sin menciones: mensaje 1560483955910647933. D1 confirmó un trabajo enviado y un intento; sin duplicación tras reiniciar. Sin nueva publicación ni anuncio de Administrador. Ocho releases anteriores y los blobs del modpack se conservaron.

**Limitación de diagnóstico pendiente:** el estado local puede conservar campos de un HTTP 503 anterior aunque el mensaje actual confirme recuperación; estos campos no prueban un fallo vigente. Debe limpiarse ese estado residual en una corrección posterior. La caducidad real se consulta en el servicio. El Bot alojado en esta PC requiere que el proceso y la computadora permanezcan activos.

**Recuperación:** `.champagne-admin/sync-diagnostic-20261015` conserva app.asar anterior y copia cifrada de datos; `.champagne-admin/publicacion-020-025` conserva snapshot remoto previo, sumas, paquetes, pruebas y registro de despliegue. Worker anterior: `39e003ab-78fd-45d0-9314-7eef0ceb7e7c`. No se modificó el modpack ni se abordó Error 009.

## Antecedente histórico — preflight inicialmente detenido (superado por el lanzamiento anterior)

**Resultado del 15 de octubre de 2026:** 92 pruebas finales seleccionadas aprobadas, 0 fallidas. Error 008 incluido en código local; mejoras de sincronización, diagnósticos y verificación de anuncios incluidas. Detectado y corregido que el compilador del Bot debía copiar los nuevos módulos `failure.cjs` y `official-release.cjs`; no se compiló instalador.

**Permisos Discord completados y persistencia verificada por UI tras recargar/navegar:** excepciones individuales para VillaWolf · Guardián en actualizaciones-launcher (`1559334945372250314`) y actualizaciones-administrador (`1559347693245956189`): Ver canal, Enviar mensajes, Insertar enlaces y Leer historial. No se concedió Administrador/Gestionar roles ni se alteraron otros miembros/roles/categorías. La mención existente del rol Administrador y la restricción local de allowed_mentions siguen vigentes. Sin anuncios de prueba. Esta verificación sustituye los pendientes de permisos de las entradas anteriores.

**Bloqueo de activación:** consulta SELECT de D1 en el panel autorizado: ambos servidores registraban ready=1, sequence=46 y age_seconds=3321, frente a caducidad de 90 segundos. Hay procesos VillaWolf Bot en ejecución, pero no se confirmó envío vigente al servicio. El reloj de esta PC difiere aproximadamente 1 segundo del Date HTTP de Cloudflare; no respalda un desfase de reloj como causa en esta comprobación. No se atribuye el bloqueo a la clave, intents o proveedor sin más evidencia. El acceso CLI Cloudflare no está autenticado, aunque el panel web sí está disponible.

**Recuperación y estado:** snapshot previo del árbol/release assets de GitHub y copia SHA-256 del código local relevante en `.champagne-admin/publicacion-020-025`. Preflight confirmó que v0.1.20 y bot-v0.2.5 estaban libres; números propuestos, todavía no publicados ni asignados en package.json. No se crearon releases, instaladores ni commits remotos; no se desplegó Cloudflare ni se modificó el modpack. Se detiene la publicación conforme a la condición del propietario hasta confirmar una sincronización real vigente y compatibilidad de servicio. Error 009 fuera de alcance.

## Estabilización local del Bot — sincronización y anuncios, 15 de octubre de 2026

**Causas confirmadas en código, reproducidas con simulaciones:** el sincronizador reemplazaba cualquier error por un aviso genérico y relanzaba la sincronización completa cada 30 segundos; se marcaba listo localmente antes de confirmar metadatos/ready en el servicio. El estado de anuncios decía «pendientes» cuando fallaba consultar el servicio, sin evidencia de trabajos pendientes. Los errores de actualizaciones de miembros y latidos también carecían de diagnóstico útil.

**Corregido y probado localmente:** diagnósticos por servidor/etapa/origen/HTTP; distinción de firma/configuración del servicio frente al token de Discord, permisos, secuencia, timeout de miembros e intents rechazados. Los diagnósticos no copian respuestas HTTP, cuerpos firmados, URLs ni errores arbitrarios con posibles secretos. Espera progresiva de 30/60/120 segundos hasta 15 minutos; configuración/permisos comienzan en 5 minutos. Retry-After numérico respetado hasta una hora. El latido sano se mantiene cada 30 segundos, sin acumular latidos simultáneos ni repetir el fetch completo durante la espera. Éxito solo tras ready confirmado y envío de cambios de miembros acumulados. La comprobación directa de Discord y la caducidad de la caché del servicio permanecen sin cambios.

**Anuncios:** consulta/confirmación fallida se muestra como servicio no disponible, sin inventar pendientes; backoff independiente. Cola vacía se distingue de fallo de comprobación de releases. La deduplicación, reconciliación y los controles previos de integridad se conservan.

**Evidencia y límites del incidente del propietario:** Discord conectado no demuestra que Cloudflare acepte la sincronización firmada. GET público `/health` respondió HTTP 200, versión 1.2.2, multiGuild y notifications activos; esto NO verifica ROLE_BOT_ENABLED, clave de conexión, tablas, firma, reloj, intent de miembros ni el estado de las solicitudes del bot. No se pudieron recuperar diagnósticos locales guardados (lectura de errores devolvió no disponible, sin consultar credenciales). La causa específica de los 15 minutos pendientes en la instalación actual sigue pendiente de un error con etapa/HTTP. Roles y anuncios usan rutas diferentes y comparten servicio/clave: una configuración rechazada puede afectar a ambos, mientras un permiso de canal denegado no explica por sí solo el fallo al sincronizar miembros.

**Pruebas:** 40 aprobadas, 0 fallidas en la ejecución conjunta seleccionada de sincronización, reconexión, estados, transporte/entrega de anuncios, cola, releases e integridad. Todo envío simulado; sin anuncios reales. Incluye 503/reset con 30→60 segundos, 401 con pausa de 5 minutos, timeout de miembros, metadatos rechazados sin falso éxito, recuperación y cola inaccesible sin falsos pendientes.

**Permisos Discord de la tarea anterior: parcial:** se añadió una excepción individual de VillaWolf · Guardián en actualizaciones-launcher y se guardaron Ver canal, Enviar mensajes, Insertar enlaces y Leer historial. Se observó desaparecer el aviso de cambios sin guardar. La reapertura/verificación de persistencia y el ajuste del canal Administrador no se completaron por bloqueo del navegador. No declarar ambos canales listos. No se modificaron roles ni categorías.

**Entrega:** cambios únicamente locales del Bot, pruebas y este documento. Sin nueva versión, instalación, despliegue de Cloudflare ni modificación de Launcher/Administrador/modpacks. La corrección requiere una futura compilación del Bot para probar el diagnóstico contra la instalación real.

## Configuración local de anuncios oficiales — IDs confirmados por UI, 15 de octubre de 2026

Consulta realizada exclusivamente mediante la interfaz visible de Discord con la sesión del propietario. Sin leer cookies, tokens, almacenamiento de sesión ni credenciales; sin mensajes, cambios de permisos remotos, instalaciones o despliegues.

| Destino | Nombre real observado | ID confirmado |
| --- | --- | --- |
| Servidor oficial | VillaWolf | `1007732653035880589` |
| Launcher | INFORMACIÓN · VILLAWOLF → actualizaciones-launcher | `1559334945372250314` |
| Administrador | ADMINISTRACIÓN → actualizaciones-administrador | `1559347693245956189` |
| Rol de notificación | Administrador (singular; no se observó otro llamado Administradores) | `1559330834278781048` |

**Configurado localmente:** `ADMIN_RELEASE_ROLE_ID` en `wrangler.json`; destinos oficiales fijos ya preparados, independientes del catálogo. Bot fuerza la mención exclusiva a ese rol para el destino oficial del Administrador, incluso ante un payload anterior que traiga otro rol. Launcher oficial fuerza ninguna mención. Se conserva la configuración de comunidades externas y la verificación de release/instalador/SHA-256 antes del envío. Los valores locales NO están desplegados ni instalados.

**Permisos observados / bloqueo real:** VillaWolf · Guardián aparece como miembro del rol Administrador. El permiso avanzado Administrador de ese rol está desactivado; no se concedió. En actualizaciones-administrador, el rol tiene Ver canal permitido y Enviar mensajes denegado. En actualizaciones-launcher, sincronizado con INFORMACIÓN · VILLAWOLF, @everyone tiene Enviar mensajes denegado y no aparece una excepción de envío para el bot/Administrador (solo Ticket Tool). Por tanto no se declara listo el envío real. Insertar enlaces, Adjuntar archivos y Leer historial figuran en Ignorar en las excepciones consultadas; no se afirma su permiso efectivo completo sin resolver la herencia. La mención global de roles del rol Administrador estaba habilitada; el payload del Bot la limita exclusivamente al ID confirmado. No se cambió nada de esto.

**Pendiente remoto:** permitir al bot Enviar mensajes en ambos destinos y confirmar Ver canal, Insertar enlaces y Leer historial (necesario para reconciliar envíos). Adjuntar archivos sólo si se envían imágenes adjuntas. Aplicar los cambios exclusivamente al bot en esos canales, conservando privacidad y sin Administrador. Estos ajustes remotos y el despliegue requerirán autorización posterior; no se enviaron pruebas reales.

**Pruebas de esta configuración:** 28 aprobadas, 0 fallidas, con mocks/SQLite temporal. Incluyen IDs locales reales, mención restringida de Administrador y silencio del Launcher aun con payload antiguo, no envío ante release inválida, descarga/tamaño/SHA-256/redirecciones, cursores iniciales sin historial, independencia del catálogo, deduplicación, reservas/reconciliación y 429. No comprobada una entrega real en estos canales.

Esta entrada resuelve la identificación de canales y rol que figura pendiente en el apartado anterior cronológicamente; el permiso de envío sigue pendiente. No se publicaron versiones ni se desplegó Cloudflare.

## Preparado localmente — Error 008 y anuncios oficiales (sin publicar)

- **Launcher, implementado y probado en simulación:** una eliminación histórica ausente ya no bloquea; archivos existentes se contrastan por SHA-256 contra el estado anterior y un historial aditivo por pack/perfil (`managed-mod-history.json`). Archivos desconocidos o modificados requieren consentimiento para apartarlos con respaldo y mapa de recuperación fuera de `mods`. Cancelar conserva el archivo. Se mantienen rutas planas de JAR, protección contra junctions, mundos y rollback de archivos/metadatos. Las instalaciones antiguas sin evidencia histórica no se adoptan por nombre: requieren consentimiento.
- **Bot, implementado y probado con fixtures:** verifica una release pública, no borrador/prerelease, tag y versión, instalador esperado subido, URL oficial, tamaño y SHA-256 publicado por GitHub. Descarga completa en streaming sin almacenar el instalador; redirecciones restringidas y tiempo acotado. Si falla, no envía y deja el trabajo para reintento. Embed con fecha, novedades breves y descarga. El canal oficial del Launcher fuerza ausencia de menciones.
- **Servicio, preparado localmente y NO desplegado:** destinos oficiales independientes del catálogo; cursores oficiales separados de los anuncios configurables existentes; primera activación establece la versión base y cancela trabajos oficiales históricos pendientes sin anunciar. Reutiliza cola persistente, reservas, confirmación y reconciliación existentes. Administrador requiere `ADMIN_RELEASE_ROLE_ID` explícito y menciona exclusivamente ese rol. No se inventó ni configuró ese ID.
- **Pendiente / no verificado en vivo:** confirmar nombre, categoría, permisos de los canales oficiales existentes y el ID real de «Administradores». La consulta de Discord no se completó; no se enviaron anuncios. Hace falta autorización posterior para desplegar el servicio y distribuir Launcher/Bot. Administrador no necesita cambio de código por estas correcciones.
- **Pruebas específicas y regresión relevante:** 59 aprobadas, 0 fallidas. Cubren instalación limpia, eliminación ausente, salto simulado 0.1.6→0.1.10, historial, archivo alterado/desconocido, consentimiento/rechazo, recuperación ante fallos, mundos, rutas/junctions; releases inválidas, descarga/hash/redirección, menciones, cola, duplicados, reconciliación, 429 y estados/reconexión del Bot. Sin publicación real ni descarga masiva de instaladores.
- **Límites:** no se probó aún el diálogo nuevo en la aplicación empaquetada ni la integración de anuncios en producción. La verificación exige digest SHA-256 del asset; si GitHub no lo ofrece, bloquea el anuncio. La descarga completa añade tráfico por destino y por reintento; seguridad priorizada sobre un comprobante de disponibilidad meramente HEAD.
- **Sin cambios de versiones públicas, instalaciones, credenciales, originales de CurseForge ni modpacks. Error 009 no modificado.** Repositorio de referencia `tonyvillalobosmejia-netizen/champagne-vol5-modpack`, rama `preparacion-paso97`; carpeta local sin `.git`. Documento y código no sincronizados a GitHub en esta tarea.

## Publicación actual — cierre del 16 de octubre de 2026

- **Publicados y verificados:** Launcher 0.1.20, Administrador 0.1.26 y Bot 0.2.5. Descargas públicas comprobadas por SHA-256/tamaño; metadatos SHA-512 de los actualizadores verificados. Canales habituales activos, sin prerelease separado. Todo 0.x es desarrollo y pruebas; 1.0.0 se reserva para el primer lanzamiento definitivo.
- **Pruebas actuales de distribución:** 92 pruebas finales seleccionadas aprobadas, 0 fallidas; dos paquetes nuevos compilados y arrancados en perfiles aislados. Instaladores y archivos auxiliares públicos descargados y contrastados. Detección de ambos actualizadores verificada sin instalar Launcher. Las comprobaciones de 268 pruebas y publicaciones anteriores son históricas. No se afirma instalación en otra PC ni renovación real de tokens vencidos.
- **Administrador 0.1.23:** formulario oscuro de cuatro pestañas, borradores locales, imagen inicial, validaciones reales y comprobación de comunidades externas. Crear borrador no publica ni anuncia.
- **Launcher 0.1.18:** cuenta renovada, Discord obligatorio/Microsoft opcional, código de dispositivo copiado automáticamente y avatar de Discord o skin oficial Premium.
- **Worker 1.2.3 desplegado:** protocolo firmado y esquema existentes compatibles; diagnósticos centrales y cursores oficiales activos. Health público verificado. Sin sustituir secretos ni desactivar la caducidad de 90 segundos.
- **Bot 0.2.5 publicado e instalado en esta PC:** cuenta y credenciales existentes conservadas; reinicio y sincronización real comprobados con D1 (27 segundos en ambos servidores tras instalar). Respaldo disponible. El Launcher instalado no se reinstaló en este lanzamiento.
- **Racoon Team:** sincronización real recuperada y comprobada junto al servidor oficial. Canales y rol de pruebas conservados. No se enviaron anuncios de prueba en este lanzamiento.
- **Integración real comprobada:** catálogo y verificación con sesión guardada; reportes recuperados y mensajes reales en registro (incluye Mundo Conejil 0.1.7 y resumen de cambios). Cola local de eventos vacía. No se repitió todo el arranque de Minecraft en esta corrección.

### Compatibilidad con Minecraft

| Minecraft / cargador | Estado | Evidencia |
| --- | --- | --- |
| 1.20.1 / Forge 47.4.10 / Java 17 | Arranque real verificado anteriormente | Ensayo de Minecraft en esta PC; no repetido en esta modificación |
| 1.21.1 / Forge 52.1.0 / Java 21 | Preparación verificada automáticamente; juego no verificado | Ensayo automatizado previo de creación/preparación |
| Otros perfiles Forge modernos desde 1.18 | Admitidos por validación del motor; compatibilidad individual no verificada | No afirmar que todas las combinaciones arranquen |
| Fabric, NeoForge y Quilt | No soportados; controles bloqueados | Requieren implementación y pruebas reales |

CurseForge es la fuente y gestor de instancias, no un cargador de mods. La versión se detecta en sus metadatos; Forge queda bloqueado como cargador.

## Microsoft / Minecraft: revisión de AppID

El propietario aportó el 14 de octubre de 2026 una captura del correo «AppID Review Complete»: indica aprobación de las aplicaciones enviadas para la allow list. **El propietario aportó además capturas de la cuenta Java vinculada y de Minecraft 1.20.1 Forge ejecutando un mundo con la identidad oficial.** Verificados por esa evidencia el acceso y arranque Premium; no comprobados aquí un servidor remoto online ni la renovación real tras vencer la sesión. El correo no muestra el AppID; no confirma por sí solo la correspondencia con el cliente configurado ni el funcionamiento completo.

### Registro de cambios de cada publicación

**Desplegado en Worker 1.2.2; entrega real comprobada en registro:** el evento de publicación confirmada compara el manifiesto del commit con su padre y añade a la auditoría privada versión anterior/nueva, cantidades de mods y archivos añadidos/modificados/retirados y cambios de nombre, Minecraft/Forge, fondo, noticias, tarjeta de actualizaciones y notas. No copia rutas locales, credenciales ni contenido de configuraciones. Una publicación sólo de diseño no afirma haber cambiado mods ni versión. El mensaje divide resúmenes largos para respetar los límites de Discord.

**Verificación:** 11 pruebas de resumen, plantillas y cola pasaron el 14 de octubre de 2026 (3 nuevas para el resumen real y sus límites). El 15 de octubre se verificó la entrega real de la publicación Mundo Conejil 0.1.7 con su resumen de cambios.

## Cómo leer y mantener este informe

- **Terminada/verificada:** implementada, con la evidencia indicada; no significa que se hayan probado todos los equipos o escenarios.
- **Parcial:** existe código o una parte del flujo, pero faltan integración, despliegue o pruebas reales.
- **Planeada:** decisión o propuesta aún no implementada.
- **No verificada:** no hay evidencia suficiente para asegurar su funcionamiento real.
- Después de completar una modificación importante, actualizar versiones, cambios, estado, pruebas y pendientes de este documento. No convertir una propuesta o una prueba simulada en una función terminada.
- Sincronizar la documentación junto a los cambios autorizados, conservando el historial. No incluir credenciales, datos de jugadores, archivos privados ni JAR de terceros.

## 1. Versiones actuales y publicaciones

| Componente | Publicada | En desarrollo local | Situación |
| --- | --- | --- | --- |
| Launcher Windows x64 | **0.1.20** | **0.1.20** | Error 008 incluido. Descarga SHA-256, arranque aislado y detección desde 0.1.19 verificados. Instalado localmente el 16 de octubre; apertura y seis archivos protegidos idénticos comprobados. |
| Administrador Windows x64 | **0.1.26** | **0.1.26** | Publicado y detectado desde 0.1.25 por su canal existente. Incluye 005, 006 y 007. Instalación local actualizada a 0.1.26 el 16 de octubre; apertura y conservación de 12 archivos protegidos verificadas. |
| Servicio Cloudflare villawolf-auth | **1.2.4** | **1.2.4** | Desplegado; copia central de nuevas publicaciones de modpacks activa. |
| VillaWolf Bot Windows x64 | **0.2.5** | **0.2.6** | 0.2.6 instalado sólo en esta PC: filtro de diagnósticos antiguos, cuenta y roles conservados. Sin release pública nueva. |

Publicaciones verificadas:

- [Launcher 0.1.20](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.20).
- [Bot 0.2.5](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.5).

- [Launcher 0.1.18](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.18).
- [Administrador 0.1.21](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.21).

- [Launcher 0.1.16](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.16).
- [Administrador 0.1.19](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.19).
- La denominación **VillaWolf 1.1.0** aparece en propuestas y pruebas anteriores; no es la versión actual publicada del Launcher ni del Administrador.
- Las versiones de los modpacks son independientes: la evidencia anterior corresponde a Mundo Conejil 0.1.6 y Minecraft Extremo 0.0.1. No se republicaron sus archivos para elaborar este informe.

## 2. Funciones implementadas

### 2.1 Launcher

| Función | Estado y alcance comprobado |
| --- | --- |
| Instalador Windows y actualización de la aplicación | Terminada con pruebas automatizadas y comprobaciones de los instaladores. Canal GitHub latest.yml y blockmap. Espera a que termine Minecraft antes de instalar; evita degradar versiones. Pruebas de interrupciones y actualización en más equipos siguen pendientes. |
| Preparación de Minecraft, Forge, Java y nativos | Terminada para perfiles Forge compatibles. Descarga desde fuentes permitidas, valida los archivos y reutiliza componentes instalados. Java 17 y Java 21 tienen pruebas; esto no acredita compatibilidad con todos los modpacks. |
| Inicio de sesión Discord | Terminado. OAuth, cancelación, cierre y restauración de sesión. Identidad de Minecraft vinculada al usuario Discord. |
| Persistencia de sesión | Terminada con pruebas de restauración y almacenamiento seguro. Cerrar o actualizar la app conserva la sesión hasta su vencimiento. Las nuevas sesiones pueden durar hasta 30 días si Discord entrega renovación. |
| Biblioteca de varios modpacks | Terminada para el servidor oficial configurado. Muestra los mundos permitidos por sus roles y oculta los demás. Se comprobaron Mundo Conejil y Minecraft Extremo. |
| Biblioteca durante fallos temporales | Terminada. Copia local cifrada y vinculada a la cuenta; conserva la lista ante pausas de Discord. Una respuesta válida de permisos la reemplaza. La lista guardada no autoriza a jugar. |
| Autorización al abrir, descargar y jugar | Implementada y probada. Al abrir se comprueban roles; las nuevas descargas y el lanzamiento requieren autorización. Abrir una tarjeta ya visible no repite innecesariamente la consulta. El jugador necesita el rol del mundo, sin un rol general Jugador adicional. |
| Tarjetas de modpacks | Terminadas: formato cuadrado, fondo propio, descarga explícita y menú de opciones para Jugar, Abrir carpeta y Borrar. Elegir un modpack no descarga automáticamente su instancia. |
| Fondo y presentación | Terminados. Nombre, fondo, noticias y actualizaciones proceden del manifiesto. Se refresca la presentación publicada; se usa el icono VillaWolf cuando no hay fondo o no hay mundo seleccionado. |
| Instancias separadas y nombres legibles | Terminadas con pruebas. Registro estable vincula cada modpack/perfil a su carpeta; nombres Windows seguros, colisiones separadas y migración sin mezclar datos. Si Windows bloquea la carpeta, se conserva la anterior y se reintenta. |
| Abrir carpetas | Terminado. Ajustes abre la raíz de instancias; la tarjeta abre la carpeta de su lanzador. |
| Actualización del modpack | Terminada para manifiestos compatibles. Comprueba versiones y hashes, instala mods/configuraciones y conserva datos fuera del contenido administrado. |
| CurseForge oficial | Integración implementada y desplegada en el servicio. Busca archivos exactos y permite descargas autorizadas. La API no garantiza descargar todos los mods: se respetan las restricciones de cada autor. |
| Descarga asistida e importación local | Terminadas. Páginas oficiales, selección de JAR, revisión de Descargas y hashes antes de importar. El flujo por lote no elimina una intervención que CurseForge exija al usuario. |
| Bloqueo de JUGAR | Terminado y probado. Bloqueado durante preparación y mientras el proceso Java está abierto; evita doble lanzamiento. Evidencia real de proceso activo a los 30 segundos. |
| Progreso de preparación | Implementado. La barra aparece durante el trabajo y se oculta al terminar; porcentajes sólo cuando hay medidas disponibles. |
| Mensajes de actualización y errores | Terminados. Avisos amables, detalles técnicos desplegables y botones Copiar error, Abrir registro y Cerrar. Las pausas de Discord no se presentan como una petición de volver a iniciar sesión. |
| Ajustes de memoria y reparación | Implementados con pruebas de perfiles de RAM, validación de archivos y bloqueo de operaciones concurrentes. |
| Avatar de cuenta | Desarrollo 0.1.18: Discord por defecto; cuenta Premium vinculada puede alternar skin oficial. Se retiró la carga manual de avatar. Mantiene aparte el cambio de skin oficial. |
| Borrado local de modpack | Terminado con confirmación; conserva mundos, capturas y opciones por defecto. Eliminar también esos datos exige una selección adicional. |
| Desinstalación de aplicación/componentes | Implementada con controles de alcance y confirmación. No se utilizó para generar este informe. |
| Enlace a Discord y registros | Implementados. Acceso a comunidad, actividad y diagnósticos con filtrado de credenciales. |

### 2.2 Administrador

| Función | Estado y alcance comprobado |
| --- | --- |
| Aplicación e instalador independientes | Terminados. Icono y estilo verdes, versión propia y canal de actualización separado del Launcher. |
| Acceso Discord Administrador u Owner | Terminado y desplegado. Exige uno de esos roles en el servidor oficial de VillaWolf. Un rol de jugador no permite entrar a las rutas administrativas. |
| Perfil con nombre/avatar | Terminado. Botón superior derecho, cuenta Discord y conexión de publicación. |
| Menús principales | Edición de interfaz, Carpetas y archivos, Información del servidor y Configuración de Discord (cuarto menú solicitado explícitamente). Información del servidor sigue No disponible; no implica automatización de hosting. |
| Selección de lanzador y cierre de menús | Terminados. Selector y acciones alineados, menús de edición al seleccionar, cierre visible. Edición carga directamente sin el botón adicional Editar. |
| Creación de nuevos modpacks | Terminada para el catálogo actual: nombre, rol y canal propios. Crear localmente no publica ni convierte el borrador en visible para jugadores hasta completar la publicación. |
| Carpeta CurseForge por lanzador | Terminada y persistente; evita que la selección de carpeta se borre o se reutilice en otro modpack. |
| Análisis y fuentes oficiales | Terminado. Lee la instancia, detecta el perfil Forge, compara cambios, busca fuentes exactas por metadatos/huellas y excluye contenido privado. |
| Bloqueo de mods sin fuente exacta | Implementado. No publica archivos no resueltos. Un paquete analizado no equivale a un paquete publicable. |
| Preparación, revisión y publicación | Terminadas. Contenido seleccionado, instalación aislada, resumen, confirmación de prueba del juego y revisión antes de activar. Actualiza catálogo/manifiestos/historial de forma comprobada. |
| Edición de interfaz independiente | Terminada. Publica nombre, fondo y títulos/descripciones de noticias y actualizaciones; conserva versión, mods, Minecraft, Forge y configuraciones. |
| Vista previa | Implementada en edición de interfaz; retirada de la carga de archivos para simplificar ese flujo. |
| Progreso y pasos plegables | Implementados. Pasos se minimizan al avanzar y progreso de publicación queda junto al paso 3. |
| Confirmación con estilo VillaWolf | Implementada para publicación y retirada, con diálogos propios de la aplicación. |
| Historial y recuperación | Terminados. Historial se consulta al abrir su menú. Recuperar prepara una versión nueva; no activa automáticamente ni sobrescribe el historial anterior. |
| Retirar lanzador del catálogo | Terminado. Confirmación y conservación de manifiestos históricos y carpeta original. |
| Token local cifrado | Terminado. Guardar, indicador de conexión y borrar la copia para reemplazarla. No retorna el token al renderer ni lo incluye en paquetes. |
| Publicación central sin repartir tokens | Implementada y desplegada. Administrador u Owner publica mediante el Worker con el token central; no recibe la credencial. |
| Diferenciar fallo del servicio y ausencia de token | **Corregido y publicado en 0.1.18**. No transforma una pausa de Discord en Guarda el token. |

## 3. Cambios recientes e historial desde 0.1.16

| Componente / versión | Cambios reales | Estado |
| --- | --- | --- |
| Launcher 0.1.18 | Cuenta con botones de plataformas, Microsoft guiado, código automático y avatares Discord/skin oficial; compatibilidad de catálogo por servidor. | Publicada; paquete y arranque verificados |
| Administrador 0.1.21 | Creación visual de cuatro pestañas en oscuro, borradores compactos y comunidades con anuncios opcionales. | Publicada; 268 pruebas y arranque aislado aprobados |
| Servicio 1.2.0 / Bot 0.2.0 | Metadatos por comunidad, cola persistente, anuncios de releases y auditoría con cambios reales. | Worker desplegado; bot pendiente por token 401 |
| Launcher 0.1.16 | Reducción de consultas repetidas durante navegación/descargas; comprobación inicial de roles; pausa de Discord con explicación correcta; refresco de imágenes y uso del icono incluido en el paquete como respaldo; carpetas legibles y migración tolerante a carpetas ocupadas; apertura de raíz o carpeta individual según el botón. | Publicada y previamente instalada/verificada. No elimina los límites de Discord. |
| Administrador 0.1.17 | Reutiliza brevemente la autorización para tareas locales, manteniendo comprobaciones sensibles; menús de edición directos; historial directo sin Consultar publicaciones; acciones del selector y Cerrar menú ordenadas; corrección/instalación de paquete y snapshots para recuperar el arranque. | Publicada y previamente instalada/verificada. |
| Administrador 0.1.18 | Nuevo módulo publication-connection.cjs. Sólo una respuesta exitosa configured:false habilita el uso del token local. Los errores de Discord/red se conservan y no se convierten en token ausente. Agrupa consultas simultáneas de conexión. Mantiene verificaciones de publicación y mejora las instrucciones del paquete. | Publicada; 39 pruebas específicas pasaron, arranque del ASAR con perfil aislado e integridad local/remota/pública comprobados; canal independiente activado. Instalación sobre perfil habitual pendiente. |
| Bot local 0.1.0 / Worker sin nueva versión asignada | Proyecto aislado discord.js, ventana de configuración cifrada, bandeja y acceso local de escritorio. Worker local recibe actualizaciones firmadas/secuenciadas; sincronización completa, eventos de roles y control de desconexión/caducidad. Tablas adicionales creadas en D1; clave de conexión guardada por el propietario como Secret. Server Members Intent guardado en Discord y pertenencia del bot confirmada. | Integración desplegada y sincronización real comprobada. Falta ensayo de retirada/reposición de roles reales y desconexión/suspensión de la PC. |
| Administrador 0.1.19 | Publica el diseño sobre el HEAD vigente cuando el manifiesto y la entrada de catálogo del propio lanzador no cambiaron; conserva commits de documentación, aplicaciones y otros lanzadores. Mantiene rechazo de cambios del propio mundo y publicaciones simultáneas. | Publicada, 32 pruebas relacionadas y 5 regresiones nuevas; paquete y descargas verificados. |
| Documentación, 13-10-2026 | Se crea ESTADO_DESARROLLO.md, se comprueban releases/rama/health y se ejecutan 201 pruebas existentes. Se añade una regla documental de mantenimiento para futuros cambios. | Cambio documental; no añade funciones a las aplicaciones. |

No se atribuyen cambios nuevos al Launcher 0.1.17. Administrador 0.1.19 está asignado para corregir conflictos de diseño por cambios ajenos al modpack.

## 4. Funciones en desarrollo

### Bot de roles en la PC del propietario — activo; verificación parcial de escenarios

- Usa Gateway de Discord con Guilds y GuildMembers; no solicita contenido de mensajes ni presencia.
- Configuración protegida con Electron safeStorage/Windows en una carpeta de datos independiente. El Launcher y el Administrador no contienen la clave del bot.
- Recibe miembros, cambios de roles y salidas; prepara una sincronización inicial completa y reconcilia después de reconectar.
- Envía al Worker datos mínimos de pertenencia/roles/avatar con HMAC, marca temporal, generación y secuencia. No transmite el token del bot a las aplicaciones.
- El código local del Worker rechaza firmas falsas, mensajes vencidos, servidores no autorizados y repeticiones. No usa una sincronización incompleta para autorizar.
- La comprobación del bot se invalida al informar desconexión o al superar 90 segundos sin señal. El diseño vuelve a OAuth si el bot no está disponible; no concede acceso indefinidamente por una lista antigua.
- **Verificado en producción:** tablas role_bot_state/role_bot_members creadas sin modificar identidades/sesiones, ROLE_BOT_KEY guardada como Secret y pertenencia del bot al servidor oficial comprobada mediante API (HTTP 200).
- **Activado y verificado:** Worker 567cc551 desplegado, ROLE_BOT_ENABLED=true y estado local «Bot conectado. Roles sincronizados.». Prueba con sesiones cifradas reales: catálogos de Launcher y Administrador HTTP 200 muestran Minecraft Extremo y Mundo Conejil, autorización de ambos mundos HTTP 200, conexión central GitHub HTTP 200/configured=true.
- Tiempos observados en una prueba: catálogo Administrador 1.024 ms, catálogo Launcher 616 ms, autorización Extremo 304 ms y Conejil 357 ms. Una medición no garantiza rendimiento bajo carga. No se ejecutó Minecraft ni una publicación nueva en este ensayo.
- **No verificado en producción:** retirada/reposición real de roles y comportamiento bajo carga; las comprobaciones de esta prueba no mostraron contador.
- La ventana local informa sincronización pendiente. running:true significa proceso iniciado, no servicio de permisos operativo.
- La PC debe permanecer encendida, sin suspensión y con Internet. No se ha instalado inicio automático de Windows.

### Corrección Administrador 0.1.18 — publicada y verificada

- Pruebas de pausa, primera consulta fallida, respuesta incompleta, ausencia central confirmada, recuperación y peticiones simultáneas.
- Instalador generado; se comprobó que main.cjs y publication-connection.cjs dentro del ASAR coinciden con las fuentes.
- Falta instalar/probar la publicación real y activar el canal independiente de actualización.

## 5. Funciones pendientes y decisiones aprobadas

| Trabajo | Estado / condición |
| --- | --- |
| Completar el bot local y desplegar integración | Activo en la PC del propietario; catálogos y autorización comprobados. Pendiente prueba de cambios reales de roles y disponibilidad continua. |
| Alojamiento continuo del bot | Pendiente. Oracle rechazó Micro y A1 en Querétaro por falta de capacidad. La máquina no se creó. La alternativa temporal aprobada es esta PC. |
| Servidor Discord por lanzador | **Planeado y aprobado.** Crear lanzador pedirá nombre, ID de servidor e ID de rol. El catálogo actual todavía no almacena guildId por modpack. |
| Acceso de jugadores en servidores ajenos | Planeado. El bot debe estar en el servidor del modpack; jugador necesita ese rol allí. No exigir pertenencia al Discord oficial para esos jugadores. |
| Administración de comunidades externas | Planeada con regla aprobada: incluso el administrador del servidor de un amigo debe tener Administrador u Owner en el Discord oficial de VillaWolf. No basta con ser administrador de su propio servidor. |
| Aislamiento entre administradores y modpacks | Pendiente definir/probar límites de edición por propietario o equipo. El acceso administrativo actual es central; no inventar equipos independientes ya operativos. |
| Fabric / NeoForge | No implementados como soporte completo. El preparador actual rechaza perfiles ajenos a Forge. Minecraft 1.21.1 con Fabric no está acreditado. |
| Más perfiles/versiones Minecraft | Parcial: perfiles Forge dinámicos y Java adecuado existen. Cada combinación necesita validación; no se afirma compatibilidad universal. |
| Microsoft Premium y skin oficial | Parcial. Código de Microsoft/Xbox/Minecraft y cambio de skin existe y tiene pruebas simuladas. La autorización real de Minecraft Services falló y se solicitó aprobación; falta confirmar y probar acceso completo. |
| Firma digital | Pendiente. SignPath Foundation rechazó la solicitud por visibilidad/adopción insuficientes según el correo aportado. No hay firma de confianza concedida. |
| Preparación automática de servidor Minecraft | Planeada. Detectar compatibilidad cliente/servidor, dependencias y loader; no basta excluir mods visuales. |
| Subida SFTP/API, copias y reinicio del hosting | Planeados. No hay un hosting integrado y verificado ni una actualización automática de servidor acreditada. |
| Icono editable y borradores retomables | Planeados. Existen borradores básicos de creación y paquetes locales preparados; no equivalen a guardar/restaurar toda una sesión de edición. |
| Privilegios Premium adicionales | Planeados, sin prometer temas ni acceso anticipado, que el usuario excluyó. |
| Distribución y recuperación ante fallos | Ampliar pruebas de actualización interrumpida, rollback y equipos independientes. |
| Documentación antigua | Actualizar README, ROADMAP y CODE_SIGNING_POLICY para resolver versiones y estados desfasados. Este informe identifica la discrepancia; no reescribe esos documentos por inferencia. |

## 6. Errores conocidos y correcciones

| Problema | Situación |
| --- | --- |
| Pausas/contador Discord | **Persistente en producción.** Debe respetarse el límite del proveedor. Menos consultas y cachés ayudan, pero no autorizan a ignorar retry_after. Bot activo: el estado sincronizado evita esas consultas; la comprobación directa puede volver a mostrar límites si el bot no está disponible. |
| Guarda el token después de una pausa | **Corregido y publicado en Administrador 0.1.18.** Las instalaciones que permanezcan en 0.1.17 aún pueden confundir fallo temporal con conexión ausente. No se acreditó un borrado periódico del token. |
| Mundo no visible durante fallos temporales | Biblioteca persistente y mensajes implementados; requiere respuesta válida para actualizar permisos. No confundir invisibilidad/fallo de consulta con borrado de archivos. |
| Fondo publicado no cambia tarjeta/inicio | Corregido en 0.1.16 con refresco y fallback a un recurso realmente empaquetado. Biblioteca instalada mostró ambos mundos con imagen. |
| Administrador no arrancaba | Reparación previa de instalación/snapshots y comprobación del paquete 0.1.17. Sigue pendiente una matriz más amplia de actualizaciones en otras PCs. |
| Carpetas ocupadas al renombrar | Corregido: se conserva ruta antigua y se reintenta; no se mezclan ni borran mundos. |
| Mods sin fuente exacta | Bloqueo deliberado, no resuelto para cualquier archivo. Buscar versión oficial exacta, volver a analizar o usar intervención admitida; no desactivar controles. |
| Restricciones CurseForge | API disponible, pero algunos autores requieren descarga oficial asistida. No garantizar descarga automática total. |
| Microsoft/Minecraft no autoriza la app | Pendiente de resolución/prueba real. Pruebas unitarias no acreditan aprobación de Microsoft. |
| Bot: sincronización pendiente | Corregido y comprobado: código/activación desplegados y roles sincronizados. Dependencia conocida: PC encendida/conectada. |
| Oracle sin capacidad | Bloqueo externo confirmado para Micro/A1 en Querétaro. No se contrató Pago por uso. |
| Renovación OAuth y actualización del snapshot D1 | Observación técnica pendiente: tras renovar el token, la comparación con el cifrado anterior puede impedir escribir el snapshot en esa petición. Falta una regresión específica y revisión. Las verificaciones sensibles siguen existiendo; no declararlo corregido. |

## 7. Seguridad

- Autenticación Discord mediante OAuth; Launcher y Administrador tienen propósitos de sesión separados. Credenciales OAuth del servidor cifradas, tokens de sesión almacenados como hash y vencimiento.
- Datos locales de sesión/credenciales protegidos con safeStorage/Windows, fuera de la carpeta de instalación. No guardar en texto claro si el cifrado no está disponible.
- Biblioteca cifrada por cuenta. Una copia de catálogo no sustituye una autorización para descargar o jugar.
- Administrador requiere roles centrales. El servicio vuelve a comprobar permisos antes de activar publicaciones; los botones ocultos no constituyen la protección.
- Publicación central restringida al repositorio y rama fijados y a catálogo/manifiestos/historial bajo updates. Bloquea código de las aplicaciones, releases, otras ramas/repositorios y sobrescritura forzada del historial.
- Los secretos de Discord, GitHub y CurseForge residen en el servicio; el bot usa un almacén local separado. Este informe no incluye valores de secretos.
- Los tokens locales de GitHub no tienen un borrado por tiempo implementado; GitHub puede aplicar expiración/revocación propia. No concluir que el token se perdió a partir de un error de red.
- Validación de hosts oficiales, rutas, redirecciones, tamaño y hashes; confirmación para borrar/retirar/desinstalar y publicar. Conservación de mundos por defecto.
- La firma/HMAC del bot protege los envíos, pero **no es firma digital del instalador**.
- La autorización del launcher no expulsa una partida ya iniciada ni impide usar otro launcher. La seguridad del servidor Minecraft requiere configuración propia, aún pendiente.
- El bot no se distribuye dentro del Launcher. Alojamiento alternado entre PCs de jugadores no implementado ni recomendado: expondría su credencial y no garantizaría disponibilidad.
- Política de privacidad actualizada para el bot: datos de roles en D1, almacenamiento cifrado local, retención del estado y límite de vigencia de 90 segundos. Las comunidades externas siguen pendientes.

## 8. Arquitectura y repositorio

**Repositorio remoto:** [tonyvillalobosmejia-netizen/champagne-vol5-modpack](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack).
**Rama destino verificada:** preparacion-paso97.
**HEAD remoto observado antes de sincronizar este informe:** babe69b45ad39899efdbcafabd58028c8addf0d1.
**Carpeta de edición local:** %USERPROFILE%/OneDrive/Desktop/mi-launcher-forge-inicial. Esta carpeta no contiene .git; no afirmar que sea un checkout local de la rama.
**Correspondencia remota:** el proyecto de las aplicaciones está bajo launcher/; el informe local en la raíz del proyecto corresponde a launcher/ESTADO_DESARROLLO.md en GitHub.

| Área | Rutas / responsabilidad |
| --- | --- |
| Launcher | src/main.js: proceso Electron, IPC y coordinación. src/preload.js y renderer/HTML/CSS: interfaz aislada. Módulos champagne-* separan autenticación, perfiles, descarga, actualización, sesión, biblioteca, presentación, instancias y soporte. |
| Administrador | tools/admin-modpack/main.cjs, preload.cjs, renderer.js, index.html y style.css; engine.cjs prepara/publica; módulos de token, catálogo, fuentes, confirmaciones y actualización. |
| Bot local | auth-server/roles-bot/: proyecto aislado discord.js, bridge.cjs, Electron de configuración, renderer y archivos estáticos. Acceso local VillaWolf Bot.cmd. No es un servicio Windows instalado. |
| Backend desplegado | auth-server/cloudflare/worker.mjs; Cloudflare Worker villawolf-auth con binding DB hacia D1 villawolf-identidades. wrangler.json contiene configuración pública; secretos se administran aparte. |
| Base de datos | schema.sql: usuarios, reservas, flujos OAuth, sesiones y límites. roles-bot-schema.sql añade dos tablas adicionales, creadas en producción el 13-10-2026. |
| Distribución de modpacks | updates/catalog.json, updates/stable-v2.json e historial/versions; cada modpack adicional usa updates/packs/<id>/stable.json, history.json y versions/. |
| Distribución de apps | Releases separadas; Launcher usa latest/download/latest.yml. Administrador usa updates/admin/latest.yml y release admin-v<versión>. |
| Compilación | Electron, electron-builder/NSIS; tools/compilar-launcher.cjs y tools/compilar-admin.cjs. Dependencias npm y lockfiles. |
| Datos persistentes | Datos de cuenta fuera de instalación; instancias bajo MiLauncher/instances y registro metadata/instance-folders.json; carpetas CurseForge originales separadas. |
| Pruebas | tests/ y src/tests/. SQLite emula D1 y se simulan proveedores/procesos cuando se indica; evidencia de prueba real se conserva aparte. |

El campo interno game.serverId identifica el perfil/modpack; **no debe confundirse con el ID de servidor Discord por mundo**, todavía pendiente de implementar.

Servicio público: [villawolf-auth](https://villawolf-auth.tony-villalobos-mejia-973.workers.dev/health). Health respondió HTTP 200 con D1, catálogo, API CurseForge y publicación GitHub configurados. Health no prueba por sí solo una autorización o publicación real ni acredita la integración del bot.

## 9. Pruebas y evidencias

### Ejecutadas el 13-10-2026 para este informe

- Se ejecutaron las **34 entradas de pruebas existentes** en tests/ y src/tests/ mediante node --test.
- **201 pruebas pasaron; 0 fallos, 0 omitidas.** Resultado de proceso: 0. Duración aproximada: 12 segundos.
- Cobertura: autenticación/sesiones/roles, D1 simulado, publicación limitada, revocación, descargas y hashes, CurseForge, contenido privado, perfiles/Java, reparación, eliminación, carpetas, actualizadores, presentación, Microsoft simulado y conexión central.
- Bot: **7 pruebas** de sincronización completa, cambios/revocación, caducidad/desconexión, firmas/servidores autorizados, repetición, generaciones y emisor firmado. Integradas en las 201; no sumar otra vez.
- Tres pruebas adicionales de integración HTTP del Worker pasaron (0 fallos): autorización y revocación de jugador, revocación de Administrador/Owner y retorno a Discord al desconectar. Ejecutadas por separado de la suite de 201; total comprobado: 204 pruebas. No equivalen a una revocación real en producción.
- Administrador 0.1.18: **5 regresiones específicas** de conexión central; integradas en las 201.
- Se consultaron API pública de releases/HEAD y /health. No se modificaron funcionalidades para generar el informe.

### Evidencia anterior de la entrega 0.1.16 / 0.1.17

- 189 pruebas automatizadas pasaron antes de publicar esas versiones.
- Prueba aislada completa de crear/preparar/publicar un modpack, filtrarlo por rol, descargar/aplicar archivos y retirar permiso; GitHub/proceso Java simulados en ese ensayo.
- Prueba real local de **Minecraft Extremo**: 14 JAR oficiales existentes importados tras comprobarlos, archivos restantes descargados, 46 mods instalados, Java iniciado y aún activo 30 segundos después.
- Registros mostraron inicialización de gráficos/audio/texturas sin error fatal de carga observado. **No se entró a un mundo en esa prueba**, por lo que no acredita toda la experiencia de juego.
- Biblioteca instalada mostró Mundo Conejil y Minecraft Extremo con imagen, sin errores de render reportados.
- Instaladores finales de Launcher 0.1.16 y Administrador 0.1.17 terminaron con código 0; snapshots/ASAR instalados coincidieron con paquetes.
- Limpieza anterior eliminó alrededor de 5,81 GiB de compilaciones intermedias de esa entrega, conservando datos/sesiones/instancias. No hubo limpieza adicional para este informe.
- Evidencia local de referencia: outputs/villawolf-correccion/verificacion-final.json en el espacio de trabajo de Codex; no contiene credenciales y no equivale a un ensayo posterior del bot.

### Falta verificar

1. Ya verificado: pertenencia, estado de sincronización y despliegue. Pendiente comprobar retirada/reposición real de roles.
2. Retirar/reponer rol real y comprobar biblioteca, descarga, JUGAR y publicación; probar desconexión/suspensión/reinicio del bot.
3. Medir las consultas y pausas con varios usuarios y ambos clientes simultáneos.
4. Instalar Administrador 0.1.18 sobre el perfil habitual y publicar interfaz real bajo una pausa para confirmar que no pide un token inexistente. La publicación y canal ya están verificados.
5. Actualización automática entre versiones en otra PC; cierre inesperado, red interrumpida, carpetas ocupadas y conservación de sesiones/mundos.
6. Partida real y entrada a mundo de cada modpack nuevo. El análisis aislado no reemplaza esa prueba.
7. Microsoft oficial de extremo a extremo cuando haya autorización; Forge en otras combinaciones; Fabric/NeoForge tras implementarlos.
8. Comunidades Discord externas, separación de permisos y catálogo con guildId después de programarlo.

## 10. Recomendaciones y orden de trabajo

1. Completar conexión/despliegue del bot y probar permisos reales, manteniendo un acceso alternativo seguro cuando la PC esté apagada.
2. Verificar actualización de Administrador 0.1.17 a 0.1.18 sobre perfiles reales y en otra PC; la distribución ya está activa.
3. Implementar servidor Discord por modpack con migración compatible para los existentes y autorización central de Administrador u Owner; probar acceso cruzado antes de publicar.
4. Añadir métricas limitadas de consultas/latencia y estados de conexión, evitando registrar cuerpos OAuth, claves o datos privados. Respetar límites de Discord y del plan gratuito de D1.
5. Revisar el caso de renovación OAuth/snapshot y la política de privacidad del bot antes de su uso general.
6. Mantener versiones independientes, manifiestos y hashes comprobados; mejorar recuperación de actualizaciones interrumpidas y ampliar pruebas en PCs distintas.
7. Programar soporte de nuevos loaders y hosting de Minecraft como trabajos separados, con sus propias pruebas y decisiones de proveedor.
8. Resolver la firma del instalador y alinear documentación antigua. No prometer descarga automática de archivos cuya distribución esté restringida.

## Sincronización documental

Este archivo representa el estado comprobado de la fecha indicada. La copia local contiene desarrollos aún no publicados; sincronizar el informe no despliega el Worker, no publica instaladores y no activa el bot. El enlace GitHub del documento debe comprobarse después de sincronizarlo. Cada siguiente cambio importante debe actualizar esta sección y las tablas correspondientes.

### Despliegue del bot, 13-10-2026
Código activo 567cc551 y activación en Production comprobados. Guardar la configuración desde una pestaña anterior activó brevemente la versión anterior del código; se volvió a desplegar el código preparado sobre la configuración vigente. La ruta firmada rechaza solicitudes sin firma (HTTP 401), y el bot confirmó sincronización. No se publicaron instaladores nuevos en este paso.

Verificación adicional en D1: ready=1, señal recibida hacía 22 segundos y 5 miembros presentes sincronizados, mediante consulta agregada sin mostrar identidades ni roles individuales. Código/pruebas/privacidad sincronizados en preparacion-paso97, commit fb581aebe684ab95098433679fc75ebf789ed582.

### Publicación Administrador 0.1.18, 13-10-2026

- Se recompiló el instalador con la política de privacidad vigente. 39 pruebas del Administrador pasaron (0 fallos, 0 omitidas); son regresiones ya incluidas en pruebas anteriores, no 39 pruebas nuevas adicionales.
- Arranque de main/preload/interfaz del paquete ASAR verificado con perfil aislado, sin usar ni modificar la sesión habitual. El primer criterio del ensayo buscaba un menú oculto antes de autenticar; se corrigió el criterio a la pantalla inicial y la prueba pasó.
- ASAR verificado: versión 0.1.18, main y módulo de conexión iguales al código local, sin almacenes privados empaquetados. Instalador de 115.467.886 bytes; SHA-512 y tamaño coinciden con latest.yml.
- Instalador, blockmap y latest.yml descargados desde GitHub y comparados mediante SHA-256 y tamaño. Release admin-v0.1.18 publicada; canal updates/admin/latest.yml activado mediante commit f40e1c901479c09cd974eb02956b56372ccaf83b. El latest general de GitHub sigue siendo v0.1.16 del Launcher.
- Código de esta corrección sincronizado mediante commit 6c34fcfe90da34718f085f76265529ccb069045e. No cambia catálogo, versiones del modpack ni archivos del juego.

Comprobación del actualizador real desde 0.1.17: inicialmente el CDN de GitHub devolvió latest.yml 0.1.17 pese a que el commit contenía 0.1.18. Tras propagarse, el canal público devolvió 0.1.18 y NsisUpdater detectó correctamente la actualización desde 0.1.17. La prueba no descargó ni instaló automáticamente en el perfil habitual. El Administrador instalado comprueba al abrir, descarga la versión nueva y espera a que no haya tareas antes de reiniciarse e instalarla.

### Administrador 0.1.19 — corrección del conflicto de diseño, publicada

La edición de interfaz rechazaba publicar si cualquier archivo de la rama cambiaba después de cargar el diseño, incluso informes o publicaciones de las aplicaciones. Ahora compara el manifiesto del lanzador y su entrada de catálogo entre ambos commits; si son iguales, usa el HEAD y árbol vigentes para conservar los cambios ajenos. Si cambian el modpack, la presentación o su acceso, exige recargar. Se mantiene la comprobación final de publicación simultánea, force:false, verificación de bytes y autorización.

32 pruebas relacionadas pasaron (0 fallos), incluyendo 5 regresiones nuevas: commit ajeno aceptado, manifiesto cambiado rechazado, rol cambiado rechazado, otros lanzadores conservados y escritura simultánea bloqueada. Compilación con código 0, arranque del paquete con perfil aislado e integridad ASAR/instalador/latest.yml comprobados. Publicación y descargas públicas verificadas. No se publicaron cambios visuales del usuario como parte de esta reparación.

Publicación 0.1.19: código 8fb17403dd52dd60d9fd40fd0f168f084f41f79b, canal 7b653af63a3f3b001232fdb392a17f5494c4bc22. Instalador de 115.468.142 bytes, SHA-256 954b603e0737e18bc3fba3c8d97fd8d05ecef1c65be52313e7402f5e2574379b. No se instaló sobre el perfil habitual ni se publicó el diseño del usuario; prueba real de publicar su edición pendiente. La versión estable del Launcher sigue en 0.1.16.

Canal público 0.1.19 propagado y comprobado: NsisUpdater detectó 0.1.19 desde 0.1.18 usando el feed habitual, sin descargar ni instalar en el perfil del usuario. La copia antigua 0.1.18 dejó de servirse después de la propagación de GitHub.

## Estado adicional, 14-10-2026: eliminación y diagnóstico de preparación

### Eliminación definitiva — parcial, sin desplegar ni publicar
El usuario autorizó desarrollar la eliminación global de un lanzador, mundos/configuraciones de sus instalaciones VillaWolf y preparaciones del Administrador; pidió conservar la carpeta original de CurseForge. Código local añade endpoint central limitado al modpack elegido, índice mínimo de eliminaciones en catálogo/D1, limpieza por registro de carpetas y espera mientras Minecraft está abierto. Borrar una instalación local deja de exigir rol de juego. La lista del Administrador se actualiza sin depender de una segunda consulta después de borrar.

La suite completa más reciente pasó: 236 pruebas, 0 fallos y 0 omitidas, incluyendo limpieza, nombres de Forge y preparación/publicación simulada. Los paquetes preliminares 0.1.17/0.1.20 necesitan recompilarse y verificarse porque el código cambió después de compilarlos. No están publicados ni instalados. El Worker activo sigue 567cc551; la tabla deleted_packs no se creó en producción, y el borrador del editor requiere verificación antes de cualquier despliegue. No se borró ningún modpack ni mundo real en estos ensayos; se usaron carpetas aisladas.

Límites: los commits históricos de GitHub y copias externas no se purgan; se conserva un identificador mínimo para evitar reapariciones y completar limpieza. Hasta 250 archivos publicados por lanzador; un historial mayor requiere eliminación por lotes. PCs desconectadas o launchers antiguos necesitan conectarse y actualizarse para recibir la limpieza.

### Compatibilidad de nombres Forge y diagnóstico — implementados localmente, no publicados
El usuario informó que eliminó la carpeta que producía el error y autorizó admitir los archivos válidos de Forge. Se mantiene su instrucción de no publicar nuevas versiones ni actualizar el servidor Minecraft.

Causa confirmada del segundo error: modPathKey en src/champagne-update-paths.js usaba una lista de caracteres que rechazaba los corchetes de mods/dungeons-and-taverns-ancient-city-overhaul-1 [Forge].jar. La regla ahora acepta nombres Windows válidos con corchetes, Unicode y puntuación. src/champagne-file-names.js centraliza la validación; mods siguen siendo JAR dentro de mods, y configuraciones/recursos siguen limitados a sus rutas y formatos administrados. Se rechazan rutas externas, enlaces, dispositivos reservados y nombres ambiguos. Esto no acredita compatibilidad con todos los loaders, versiones de Minecraft o dependencias de mods. Referencia: https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file.

Contenido remoto incompleto se generaba en la guardia inicial de prepareContent, src/champagne-remote-content.js, antes de descargar: identificador, versión, lista no vacía, máximo de 2.000 y concordancia de expectedFiles. No se puede determinar cuál falló en el paquete original porque su carpeta fue eliminada; no se atribuye al shader ComplementaryReimagined ni al instalador de Forge. Se sustituyó el mensaje genérico por diagnósticos de dato o recurso afectado, causa y cantidades cuando corresponda. Los errores de descarga no exponen la URL completa, parámetros ni credenciales. tools/admin-modpack/engine.cjs muestra el contexto del paquete y comprueba el límite antes de prepararlo; src/champagne-config-sync.js comparte ese límite y la validación de nombres.

Pruebas: tests/verificar-nombres-forge.cjs añade 13 casos, incluido el JAR exacto con [Forge], nombres Unicode, rutas peligrosas, junction real, contadores incompletos, hashes y URLs no autorizadas. El flujo analizar → preparar → comprobar → publicar se probó con GitHub simulado y carpetas desechables: archivos originales, mundo e historial conservados. Suite completa: 236 éxitos, 0 fallos, 0 omitidas. Se mantienen hashes, fuentes oficiales y restricciones de distribución. No se modificaron archivos originales de CurseForge. Falta reproducir el paquete real con la nueva versión, recompilar/verificar instaladores y probar en la aplicación instalada. La edición local y este informe aún no se sincronizaron con GitHub; rama objetivo preparacion-paso97 del repositorio tonyvillalobosmejia-netizen/champagne-vol5-modpack.

### Publicación autorizada en preparación, 14-10-2026
Instaladores finales 0.1.17/0.1.20 recompilados con código 0. Integridad de fuentes empaquetadas y metadatos comprobada; Administrador arrancó en perfil aislado. Cloudflare activó el Worker 475d159f tras confirmación expresa del usuario y creación no destructiva de deleted_packs. Consulta real de Administrador: catálogo HTTP 200 con Mundo Conejil y Minecraft Extremo, publicación central configurada. No se ejecutó borrado real. Publicación de instaladores aún en preparación; no se actualizó el servidor Minecraft.

### Launcher 0.1.17 / Administrador 0.1.20 — publicados, 14-10-2026
Autorización de publicación recibida después de la investigación. Ambas releases e instaladores, blockmap y latest.yml públicos descargados y comparados por SHA-256 y tamaño. Canales activados: Launcher por releases/latest; Administrador por updates/admin/latest.yml. Código sincronizado en commit 3eb2e804377856b16d925b266c6f7b15bcb86766, rama preparacion-paso97. Compilaciones y arranque de main/preload/interfaz con perfiles aislados terminaron con código 0. Suite de 236 pruebas aprobada. Worker 475d159f activo y tabla deleted_packs creada sin borrar datos. Consulta administrativa real HTTP 200. Eliminación definitiva habilitada y probada en simulaciones, no ejecutada con mundos reales. El caso original de contenido incompleto sigue sin reproducirse porque su carpeta fue eliminada; la nueva versión ofrece diagnóstico preciso. No se actualizó el servidor Minecraft ni se sustituyó la instalación habitual durante estas pruebas.

Se preparan guías visuales para Discord con la interfaz actual y datos de ejemplo; no acreditan descargas ni publicaciones reales. VillaWolf Bot se personalizó como VillaWolf · Guardián: avatar y banner con recursos existentes de VillaWolf, descripción guardada. Respuesta de la API oficial confirmó avatar/banner y pertenencia al servidor. No se cambiaron credenciales, permisos ni intents.

### Discord y verificación final de canales, 14-10-2026
Se actualizó la bienvenida, enlaces de descarga, guía inicial de jugadores y guía inicial privada de administración. Se publicaron novedades de Launcher 0.1.17 y Administrador 0.1.20, tutorial de jugadores con dos imágenes adjuntas y dos tutoriales privados de administración con una imagen cada uno. Capturas de la interfaz actual con datos de ejemplo y sin credenciales, alojadas también en launcher/docs/tutoriales; documentación visual sincronizada mediante commit a0887669abdfaf70fb9f4616feda91c7e4786fd3. Se respetaron los canales no-tocar y no se modificaron permisos ni asignaciones. El bot sólo sincroniza roles; sigue ejecutándose en esta PC y vuelve a OAuth cuando no está disponible.

NsisUpdater real confirmó Launcher 0.1.17 desde 0.1.16 y Administrador 0.1.20 desde 0.1.19, sin descargar ni instalar en el perfil habitual. Consulta real del Launcher tras despliegue: catálogo HTTP 200 filtrado por rol y autorización de Mundo Conejil HTTP 200. No se ejecutó Minecraft ni se borró un mundo real durante esta publicación.

### Verificación de permisos del bot en Racoon Team — 2026-10-14

- Configurado mediante Discord un permiso individual para VillaWolf · Guardián en la categoría privada de pruebas: ver canales, enviar mensajes, insertar enlaces, adjuntar archivos y leer historial. Ambos canales heredan el permiso.
- Verificado por API: ambos canales siguen privados y permiten los cinco permisos al bot; su rol global Miembro conserva permisos 0. No se otorgó Administrador ni gestión de canales.
- Envío real y lectura posterior confirmados en prueba-actualizaciones-modpack y prueba-actualizaciones-launcher. Mensajes identificados como pruebas, sin menciones y sin anunciar una release. El helper evita repetir el mismo mensaje de prueba.
- Esta comprobación no demuestra todavía el flujo completo de cola de anuncios de la nueva versión ni la publicación de instaladores.

### Preparación de publicación — 14 de octubre de 2026

- Batería completa ejecutada por terminal: **268 pruebas, 268 aprobadas, 0 fallos, 0 omitidas** (41,1 s). No acredita todas las combinaciones de Minecraft ni equipos.
- Versiones locales: Launcher 0.1.18, Administrador 0.1.21, Bot 0.2.0, Worker 1.2.0. Instaladores en compilación; todavía no publicados en el momento de este registro.
- Migraciones aditivas 0004, 0005 y 0006 ejecutadas correctamente en D1; no modifican tablas de sesiones existentes. Punto de recuperación previo guardado.
- El propietario pidió priorizar la publicación: se limita el cierre a arranque, permisos e integridad, sin otra ronda exhaustiva.

### Cierre de publicación — 15 de octubre de 2026

- Código publicado en preparacion-paso97, commit ccede4e65f629238ad9e396c08e305e221439cae. Canales activados por commit posterior, sin sobrescribir historial.
- No se modificaron modpacks publicados, mundos ni carpetas originales de CurseForge para esta actualización de aplicaciones.
- El token del bot no se borra al reiniciar ni actualizar: se restaura desde bot-credentials.bin mediante safeStorage. No puede autorrenovarse si Discord lo revoca; el propietario debe reemplazarlo de forma privada.

### Reconexión del bot — 15 de octubre de 2026

El propietario reemplazó el token de forma privada. Discord users/@me y las comprobaciones de pertenencia/permisos de Racoon responden correctamente. El estado del bot confirma conexión y roles sincronizados. El bloqueo HTTP 401 anterior queda corregido. No se repitió la batería de pruebas ni una publicación de modpack real; la cola completa y auditoría de una publicación siguen pendientes de ensayo real.

### Corrección de borradores anteriores — 15 de octubre de 2026

- Administrador 0.1.22 en preparación. Causa confirmada en código: admin-analyze y admin-design consultaban borradores para cualquier ID del catálogo, pero draft-store sólo admitía session y pack-16hex. Mundo Conejil usa champagne-vol5 y fallaba después de resolver las fuentes.
- Corregido: admite los IDs seguros del catálogo; los anteriores usan un prefijo catalog- para no colisionar con session, acciones o pendientes. Conserva los borradores nuevos existentes sin migrarlos. Si no hay borrador devuelve null. No se cambian JAR, hashes, rutas de CurseForge ni mundos.
- 16 pruebas específicas aprobadas, 0 fallos: borradores, creación/preparación/publicación simulada y diseño independiente. Publicación e instalación pendientes en este registro.

### Navegación y Discord editables — 15 de octubre de 2026

- Administrador 0.1.22 publicado y verificado: corrección de IDs anteriores.
- En desarrollo 0.1.23: Crear nuevo lanzador junto a Subir carpetas; actualización en cuatro pasos (Carpeta, Contenido, Comprobación y Publicación), una sola pantalla visible y botones Anterior/Siguiente. Crear permite guardar borrador o continuar directamente a analizar y preparar su publicación; mantiene prueba del juego, revisión y confirmación final. No publica automáticamente un borrador.
- Cuarto menú principal autorizado por el propietario: Configuración de Discord. Permite editar servidor oficial/externo, rol, anuncios opcionales de modpack/Launcher, canales y menciones; verifica permisos y exige confirmación al guardar. Para publicados modifica catálogo/presentación mediante el motor existente, conservando mods y versión; para borradores guarda localmente.
- 16 pruebas específicas aprobadas, incluyendo carga de configuración Discord, rechazo de otro ID y cancelación sin alterar ajustes. Revisión de interfaz con API ficticia a 1280 y 640 px: sin desbordamiento y paneles exclusivos. No equivale a publicar un modpack real.

- Recorrido visual adicional (API ficticia): Crear y continuar abre directamente Contenido con título de creación; Comprobación sólo habilita la revisión tras preparar; Publicación exige las dos confirmaciones. Cambio de menú oculta el anterior. Sin desbordamiento horizontal a 640 px. Capturas guardadas en revision-villawolf; no son publicaciones reales.

### Publicación confirmada Administrador 0.1.23 — 15 de octubre de 2026

- Release admin-v0.1.23 publicada; instalador, blockmap y latest.yml descargados públicamente y verificados contra sus hashes/tamaños. Canal independiente activado en commit 1ad3ec5c7cbf2e034e61a41d90e5366058dfe710. Launcher latest permanece v0.1.18.
- Código de esta mejora: 48db9e0da82e227d5b5458b6b4627ad4bd7cf4f3 en preparacion-paso97, carpeta launcher. Arranque del paquete en perfil aislado aprobado y ASAR cotejado con los archivos actuales; sin almacenes privados.
- Las comprobaciones de interfaz usan fixtures sin publicar en servicios reales. No se modificó ningún modpack de jugadores durante esta distribución.

## Administrador 0.1.24 — flujo de publicación simplificado

**Estado: publicado y verificado.** Repositorio `tonyvillalobosmejia-netizen/champagne-vol5-modpack`, rama `preparacion-paso97` (código remoto bajo `launcher/`; checkout local sin .git).

- El botón inferior ejecuta «Analizar y continuar», «Preparar y comprobar» y «Revisar publicación» según la etapa. Se retiran de la vista los botones de análisis/preparación duplicados. Se conservan selección de contenido, hashes, fuentes oficiales, prueba del juego y confirmación final.
- Después del éxito, el estado queda «Publicado», el botón se desactiva y no se vuelve a invocar publicación. Un análisis/paquete nuevo reinicia el estado. Cancelaciones y fallos permiten reintentar sin perder la preparación.
- Causa del error posterior a Mundo Conejil 0.1.7: el servicio consumía correctamente la preparación tras publicar, pero la interfaz mantenía el envío habilitado. El registro aportado confirma la publicación; los dos errores siguientes no implican que se haya deshecho. No se ha republicado ni modificado ese modpack.
- Anuncio y auditoría figuraban en cola según el registro del propietario; entrega en Discord no verificada en esta corrección.
- Pruebas específicas: 19 aprobadas, 0 fallos, incluyendo secuencia analizar/preparar/publicar, bloqueo del segundo envío, nueva preparación y reintentos tras cancelación/error. Los ensayos de servicios usan fixtures; no son una publicación real de modpack.
- Sin cambios en Launcher, Bot, Cloudflare, mundos, historial, sesiones ni archivos originales de CurseForge.

### Evidencia de publicación 0.1.24

- Release pública: https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.24 . Código: `374c547312471a24e32e16cde6eb8e47624f7b58`; canal Administrador: `5f3a6dcc14af25447dca8a89e9762690c7baddc8`.
- Instalador, blockmap y latest.yml descargados públicamente y verificados por tamaño/SHA-256. Instalador: `a93b569b3b0743de47a40325a218398a5f0cdc02240fbc42b87df9da24dcc0fe` (115482367 bytes). ASAR: 357 archivos, fuentes coincidentes, sin almacenes privados. Arranque del paquete aprobado en perfil aislado. No se ha ejecutado el instalador sobre el perfil habitual del propietario.
- El canal latest del Launcher sigue en v0.1.18. No se desplegó Cloudflare ni se republicaron modpacks.
- Crear y continuar a publicación usa la misma activación de manifiesto y catálogo: el ensayo integrado verifica que el lanzador pasa de no estar publicado a aparecer al consultar la biblioteca para su rol, permite descargar/arrancar con fixtures y rechaza al retirar el rol. No requiere otra publicación manual del catálogo. Un Launcher abierto debe consultar la biblioteca para recibir el cambio; no se implementó envío en tiempo real a ventanas abiertas.

### Incidencia de actualización automática tras 0.1.24

El 15 de octubre se comprobó que la API de GitHub contenía 0.1.24 mientras la URL raw habitual aún devolvía 0.1.23; el servidor anuncia caché max-age=300. La variante refs/heads ya devolvía 0.1.24. Se instaló directamente en esta PC el mismo instalador publicado, tras cotejar SHA-256; salida 0 y versión del ASAR instalado 0.1.24. No se cambiaron los datos de usuario ni se creó otra release. La propagación del endpoint original no queda confirmada por esta instalación directa.

## Corrección 0.1.25 / servicio 1.2.1 — catálogo, cola y avisos

Servicio 1.2.1 desplegado en Cloudflare (ce784964); Administrador 0.1.25 en desarrollo, no publicado todavía.

- Causa de lanzador ausente: API de GitHub contenía el nuevo lanzador mientras el raw leído desde el servicio devolvía un catálogo anterior. Con conexión central configurada, el catálogo se lee por API. Verificación real: la sesión del propietario recibe Mundo Conejil y juaaaaaannnn; ambos verifican acceso HTTP 200.
- Causa de reporte pendiente: manifiesto Mundo Conejil de 34.870.427 bytes; la respuesta blob base64 de GitHub superaba 2 MiB (48.044.022 bytes). Se leen metadatos por streaming desde el commit confirmado, omitiendo únicamente payloads base64 para el resumen. No cambia archivos, hashes ni validación de publicación. Reintento real confirmado HTTP 200, auditoría encolada; entrega final del bot por verificar.
- Cola del Administrador: un evento fallido conserva su registro y deja pasar los siguientes de la misma cuenta; reintento automático cada 120 segundos cuando está inactivo.
- Avisos futuros de Launcher y Administrador breves: versión y enlace oficial; canal oficial Launcher y canal privado Administrador, además de comunidades con anuncios habilitados. Auditoría privada conserva resumen de cambios.
- Pruebas: 18 de anuncios, cola remota y manifiestos grandes; 32 de catálogo, permisos, GitHub central, cola local y eliminación. Todas aprobadas.
- El propietario autorizó limpieza de versiones anteriores en esta PC y GitHub. Aún no ejecutada; conservar versiones activas, mundos, sesiones, carpetas originales y commits. Procesar primero los eventos que necesitan manifiestos históricos.

### Ajustes finales del servicio 1.2.2

Se añade auditoría de cambios confirmados sólo en catálogo (rol, servidor o anuncios) aunque el manifiesto conserve los mismos bytes; se comprueba el cambio real del mismo lanzador contra el catálogo padre. La última publicación pendiente correspondía a ese caso. Revalidación automatizada aprobada. El instalador 0.1.25 pasó integridad, exclusión de almacenes privados y arranque aislado (358 archivos, SHA-256 7130dded136fda94815f9da1bfb0818bcd505934cb340f8673f200154d9193d9).

## Mantenimiento y auditoría — 15 de octubre de 2026

- **Administrador 0.1.25 publicado e instalado:** instalador de 115482627 bytes; SHA-256 7130dded136fda94815f9da1bfb0818bcd505934cb340f8673f200154d9193d9. Arranque aislado e integridad del paquete aprobados. Launcher permanece en 0.1.18.
- **Corregido:** la lectura del catálogo usa la API GitHub para evitar la copia raw obsoleta. El lanzador de prueba juaaaaaannnn sí fue verificado; después fue eliminado por una acción independiente registrada en el repositorio. No se recreó.
- **Corregido:** el manifiesto de Mundo Conejil 0.1.7 ocupa 34870427 bytes; la respuesta base64 de GitHub excedía el límite de lectura del servicio y bloqueaba auditorías posteriores. Se leen metadatos mediante stream con límites, conservando hashes y sin alterar el paquete. La cola continúa con eventos posteriores si uno falla y conserva los pendientes.
- **Auditoría de eliminación:** registra nombre e ID del administrador autenticado, nombre del lanzador y fecha, sólo tras confirmar el commit de borrado. No genera una eliminación ficticia para probarlo en producción. Ocho pruebas de eliminación central y cinco de mensajes aprobadas (13/13), incluyendo ausencia de reporte cuando el borrado falla y ausencia de duplicados al repetirlo.
- **Avisos de aplicaciones:** breves, con versión y enlace; no copian el detalle de las notas. Comprobación idempotente de releases durante el sondeo firmado del bot, máximo una vez por minuto. La entrega de estos dos avisos se está verificando; no debe confundirse con los registros de modpacks ya comprobados.
- **Limpieza autorizada PC y GitHub:** eliminadas 12 carpetas de compilaciones antiguas, 6091324139 bytes (6,09 GB). Conservados los instaladores actuales del Launcher y Administrador. En GitHub se eliminaron 21 releases antiguas y sus tags, con 2467506050 bytes en assets; también cuatro archivos de snapshots antiguos de Mundo Conejil y sus entradas antiguas del índice. Se conserva 0.1.7, el manifiesto estable y el historial de commits. No se reescribió Git: sus blobs históricos siguen en commits anteriores.
- **Preservado:** mundos, instalaciones actuales, sesiones, originales de CurseForge y código fuente. No se purgaron carpetas de datos o backups sin clasificar.
- **Pruebas específicas previas a 0.1.25:** 51 casos de catálogos, permisos, publicación central, manifiestos grandes, colas y anuncios aprobados; el conjunto histórico de 268 corresponde a una publicación anterior y no se presenta como repetido ahora.

- **Cierre de mantenimiento:** retiradas además 15 preparaciones locales obsoletas de Mundo Conejil 0.1.5/0.1.6 (450153697 bytes), compuestas sólo por manifiestos y metadatos de revisión/publicación. No contenían mundos. Total local retirado: 6541477836 bytes.
- **Pendiente concreto:** los dos canales oficiales de avisos de aplicaciones niegan Enviar mensajes al bot. Discord rechazó que el propio bot cambie esos permisos (HTTP 403); se requiere sesión del propietario en el navegador para habilitar el envío exclusivamente en esos canales. La cola conserva los avisos para reintento. Registro privado de publicaciones sí se ha entregado.
- **Servicio activo:** Worker 1.2.2, despliegue 39e003ab confirmado en Cloudflare; bot reiniciado con la credencial cifrada existente y plantilla de eliminación actualizada. 7/7 pruebas de releases/cola aprobadas tras el ajuste de sondeo. Administrador 0.1.25 y Launcher 0.1.18 confirmados también en los paquetes instalados de esta PC.


## VillaWolf Bot 0.2.1 — instalador y acceso administrativo (publicado)

- Interfaz oscura con acentos amarillos y logos existentes de VillaWolf.
- Instalador Windows x64 independiente publicado en https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.1. Descargas públicas verificadas por SHA-256. Arranque aislado del paquete correcto; interfaz y bloqueo inicial sin sesión comprobados. No se ha instalado en otra computadora.
- Autenticación Discord reutiliza el servicio central con propósito `admin`: exige Administrador u Owner del Discord oficial. Antes de guardar el token, copiar la clave de conexión e iniciar se comprueba acceso en el servidor. La sesión administrativa se guarda cifrada separadamente.
- El token del bot se conserva cifrado en la PC; nunca se incorpora al instalador ni se descarga automáticamente por iniciar sesión. Las cuentas autorizadas de esta PC pueden utilizarlo. No existe sincronización de tokens entre computadoras.
- Pruebas automatizadas del control de acceso: 5 casos aprobados (sin sesión, permiso rechazado, autorizado, revocación y cierre). Inicio OAuth real de esta versión pendiente de comprobar con el propietario.
- Repositorio: `tonyvillalobosmejia-netizen/champagne-vol5-modpack`, rama `preparacion-paso97`, código bajo `launcher/`. Esta copia local no contiene `.git`.
- Los resultados manuales propuestos previamente por el propietario siguen pendientes de autorización documental; no se han agregado como pruebas propias.


## VillaWolf Bot 0.2.2 (publicado)
Versión visible y botón Buscar actualizaciones. Consulta exclusivamente releases estables del Bot; ofrece abrir el instalador oficial cuando existe una versión superior. Es una actualización manual: requiere ejecutar el instalador. No reinicia ni detiene el bot automáticamente. Conserva las credenciales cifradas. Cuatro pruebas automatizadas de actualización aprobadas. Arranque aislado del paquete, versión y botón comprobados. Instalador publicado: https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.2. Descargas verificadas mediante SHA-256.


## VillaWolf Bot 0.2.3 (publicado)
Iconos amarillos propios separados de los iconos verdes del Administrador. Se aplican a ventana, bandeja, ejecutable, instalador y accesos directos; el logo interior utiliza la misma imagen amarilla sin filtro CSS. Icono multirresolución comprobado y arranque aislado correcto. Instalador publicado: https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.3. Descargas verificadas mediante SHA-256.


### Limpieza local posterior a Bot 0.2.3
Se eliminaron instaladores y compilaciones locales 0.2.1/0.2.2, etapas de empaquetado y perfiles aislados de pruebas: 1126676462 bytes. Se conservan el Bot instalado 0.2.3 y su distribución actual, el código, token y sesión cifrados. El paquete instalado coincide por SHA-256 con el actual y los archivos cifrados permanecieron sin cambios.
También se retiró la copia descomprimida de empaquetado de 0.2.3, ya instalada y verificada. Total de limpieza del Bot: 1526345305 bytes; se conserva el instalador 0.2.3 y sus hashes.


### Limpieza local Launcher y Administrador
Se verificó por SHA-256 que las instalaciones corresponden al Launcher 0.1.18 y Administrador 0.1.25. Se eliminaron las distribuciones antiguas locales Launcher 0.1.11/0.1.12, la etapa de compilación del Administrador y las copias descomprimidas de los paquetes actuales. Espacio retirado: 1810570038 bytes. Se conservan instaladores actuales, código, mundos, instancias, modpacks, historial, sesiones y carpetas originales de CurseForge. No se modificaron las instalaciones ni los archivos de sus perfiles.


### Limpieza de la carpeta de programación
Se retiraron 83 respaldos antiguos de código, auxiliares de releases anteriores, configuraciones generadas obsoletas, capturas antiguas y logs de prueba (11055724 bytes). Antes se comprobaron referencias desde src/tools/auth-server/tests y se conservaron las herramientas vigentes. Se verificaron 132 archivos de código: contenido sin cambios. Permanecen dependencias, pruebas, herramientas de compilación, scripts de publicación actuales, historial de resultados y datos de trabajo. No se modificaron funciones ni versiones.


### Organización de archivos externos de desarrollo
Se trasladaron 907 archivos de documentación, capturas y herramientas históricas a `.champagne-admin/archivo-local/`, verificando hashes antes y después. El índice es `docs/ARCHIVOS_LOCALES.md`. Se preservaron 16 archivos originales del RAR en un ZIP ligero y se retiraron sus dependencias antiguas, 12 perfiles temporales sin mundos y el acceso de desarrollo del Bot. Espacio neto liberado: 199451612 bytes. Se conservaron perfiles con posibles mundos. No se modificaron las funciones ni versiones, ni se trasladaron instalaciones o credenciales activas. Los archivos importados permanecen excluidos de GitHub.


## Estabilización 005, 003, 002, 001 y 006 — 15/10/2026 (preparado localmente)

Versiones publicadas e instaladas conservadas: Launcher 0.1.18, Administrador 0.1.25, Bot 0.2.3 y servicio 1.2.2. Desarrollo: correcciones locales sobre esas bases; no se asignó una versión nueva. Repositorio de referencia: tonyvillalobosmejia-netizen/champagne-vol5-modpack, rama preparacion-paso97, código remoto bajo launcher/. Esta copia no contiene .git; no se hizo commit, push, publicación ni despliegue.

- 005 — Corregido localmente: reutilización acotada de contenido remoto verificado y comprobantes recientes de SHA-256; cachés separadas por transporte, subida reutilizable de blobs por contenido y credencial; reintentos sólo para GET y blobs idempotentes, sin reintentar permisos, límites 429 o activación de rama. Conserva validación final, cambios de la carpeta, hashes, fuentes oficiales e historial. Un avance de rama ajeno puede conservarse; cambios del mismo modpack o sus permisos bloquean la activación. No cambia el formato del manifiesto ni excluye recursos. La reducción de descargas se verificó con transportes simulados; no se midió un ahorro real de red ni un tiempo de publicación en producción.
- 003 — Corregido localmente: colas cifradas y acotadas de errores de Launcher/Administrador/Bot, deduplicación local e idempotencia remota por evento, diagnósticos saneados en la cola existente y avisos breves con botones privados. Consulta/copia exige Administrador u Owner del servidor central. Copiar abre texto seleccionable; Discord no copia directamente al portapapeles. Los fallos de ejecución de Minecraft no se envían. Los fallos internos 5xx del servicio se registran cuando su base de datos está disponible. Los diagnósticos no provocan consultas extra a Discord ni bloquean la biblioteca por sus propios límites.
- 002 — Corregido localmente: después del catálogo autorizado devuelve las tarjetas sin esperar imágenes. Las imágenes se hidratan en segundo plano con concurrencia limitada y caché breve; resultados de cuentas anteriores no se aplican. Se conserva la comprobación de permisos al descargar y jugar.
- 001 — Corregido localmente: estado Discord real separado de roles y anuncios, latencia únicamente cuando está disponible, historial acotado saneado y persistido cifrado, consultable y copiable. No se cambió el protocolo ni los intervalos de sincronización de Discord.
- 006 — Corregido localmente: vista principal/edición/perfil/asistente determinan visibilidad. Se retira el botón redundante Subir carpetas y archivos. Crear nuevo lanzador se oculta al editar y reaparece al cerrar. Perfil oculta selector y herramientas, conservando Cerrar menú. Se conservan las operaciones reales de creación, eliminación y publicación.
- 004 — Continúa en observación. No se reprodujeron publicaciones ni se investigaron por separado los registros históricos.

### Validación automatizada de esta tanda

108 pruebas relevantes aprobadas, 0 fallidas, en 16 archivos de pruebas. Se comprobaron rutas, integridad, conflictos, cachés, autorización, revocación de roles, colas, saneamiento, estados, navegación, sesiones y creación/publicación simuladas. Una prueba integral tenía un entorno VM sin temporizadores y asumía selección síncrona; se adaptó al nuevo contrato conservando sus comprobaciones de permisos y archivos. Además, 6 comprobaciones de interfaces/estados en Chromium aislado con datos ficticios y sin servicios de producción. Comprobación de sintaxis: 33 archivos JavaScript. Evidencia local privada: .champagne-admin/qa-estabilizacion/.

### Comprobaciones pendientes y límites

Preparado para una actualización de prueba, con autorización posterior. No se generaron instaladores ni se desplegó Cloudflare; las aplicaciones instaladas siguen sin estas correcciones. Falta comprobar con cuentas reales los botones privados de Discord y su latencia, reconexión real del Bot y rendimiento con modpacks grandes. Un fallo de D1 impide guardar diagnósticos remotos mientras dure la avería; no se añadió infraestructura alternativa. No se modificaron originales de CurseForge, mundos, sesiones o credenciales reales. Los resultados manuales propuestos anteriormente por el propietario siguen separados y pendientes de su autorización documental; no se presentan como pruebas ejecutadas aquí.

### Archivos de esta tanda

- tools/admin-modpack/engine.cjs
- tools/admin-modpack/reliable-request.cjs
- tools/admin-modpack/verified-content-cache.cjs
- tools/admin-modpack/main.cjs
- tools/admin-modpack/navigation-state.js
- tools/admin-modpack/index.html
- tools/admin-modpack/renderer.js
- tools/admin-modpack/wizard.js
- tools/preparar-admin-instalador.cjs
- tools/compilar-bot.cjs
- src/main.js
- src/champagne-auth.js
- src/champagne-diagnostic.js
- src/champagne-problem-reporter.js
- src/champagne-problem-monitor.js
- src/champagne-library-hydrator.js
- auth-server/cloudflare/worker.mjs
- auth-server/cloudflare/application-reports.mjs
- auth-server/roles-bot/main.cjs
- auth-server/roles-bot/state.cjs
- auth-server/roles-bot/bridge.cjs
- auth-server/roles-bot/notifications.cjs
- auth-server/roles-bot/announcement.cjs
- auth-server/roles-bot/diagnostics.cjs
- auth-server/roles-bot/preload.cjs
- auth-server/roles-bot/index.html
- auth-server/roles-bot/renderer.js
- auth-server/roles-bot/style.css
- tests/verificar-optimizacion-publicacion.cjs
- tests/verificar-diagnosticos-aplicaciones.cjs
- tests/verificar-biblioteca-progresiva.cjs
- tests/verificar-estados-bot.cjs
- tests/verificar-navegacion-admin.cjs
- tests/verificar-admin-modpack.cjs
- tests/verificar-catalogo-discord.cjs
- tests/verificar-crear-lanzador-e2e.cjs
- tests/fixtures/estabilizacion-preload.cjs
- tests/fixtures/estabilizacion-ui.cjs
- ESTADO_DESARROLLO.md


## 2026-10-15 — Instalación local de prueba de las correcciones 005, 003, 002, 001 y 006

**Estado: instalado localmente; no publicado ni desplegado.** Autorización del propietario limitada a compilar, instalar y realizar comprobaciones básicas. Se reutilizó el trabajo previamente validado (108 pruebas automatizadas y 6 comprobaciones de interfaz); no se repitió el diagnóstico ni se reimplementaron las correcciones. Repositorio de referencia: tonyvillalobosmejia-netizen/champagne-vol5-modpack, rama preparacion-paso97, prefijo remoto launcher/. Esta carpeta no dispone de metadatos Git locales.

- Launcher: base 0.1.18, Administrador: base 0.1.25, Bot: base 0.2.3. Cada paquete instalado contiene localTestBuild=20261015.1 y muestra «PRUEBA LOCAL 20261015.1» en el título. Los números públicos y los archivos fuente de versión permanecen sin cambios. Se mantuvo la versión numérica base para conservar la validación estricta de compatibilidad de manifiestos.
- Compilaciones e instaladores privados en .champagne-admin/prueba-local-20261015-1/. La protección de actualización de la propia aplicación sólo se añadió a las copias de empaquetado: no consulta ni instala versiones públicas durante la prueba. No se cambiaron los feeds públicos ni se deshabilitaron actualizaciones de modpacks.
- Las tres instalaciones NSIS finalizaron con código 0. Se comprobó el marcador de prueba y los módulos corregidos dentro de los app.asar instalados; se verificaron 10 módulos clave contra los fuentes locales y ausencia de archivos privados de sesión/credenciales en los paquetes.
- Recuperación: copias completas de los binarios anteriores en restauracion/<aplicación>/instalacion; copias privadas de datos sin cachés ni preparados en restauracion/<aplicación>/datos. Se compararon los archivos protegidos antes y después de instalar, antes de abrir las aplicaciones: 6 Launcher, 5 Administrador y 4 Bot, idénticos. No se restauraron ni cambiaron credenciales. RESTAURAR.md indica los tres instaladores públicos anteriores conservados y el procedimiento de recuperación. Los respaldos privados no deben sincronizarse con GitHub.

**Comprobaciones básicas realizadas en las aplicaciones instaladas (distintas de las automatizadas anteriores):**

- Launcher abre correctamente con identidad e iconos conservados. La biblioteca muestra el requisito de iniciar sesión. Antes de instalar no existían account-session.bin ni microsoft-session.bin en su carpeta habitual de datos; por eso no se da por aprobada la persistencia de sesiones de Discord/Microsoft ni la biblioteca con permisos e imágenes reales en esta instalación. Quedan para la inspección del propietario con sesión iniciada. No se iniciaron sesiones nuevas ni Minecraft.
- Administrador abre, recupera su cuenta Discord y muestra conexión central de GitHub disponible. Se abrieron Perfil, Crear nuevo lanzador (con su borrador existente), edición de Mundo Conejil y Carpetas y archivos. Se observó separación de vistas y disponibilidad del flujo Nueva actualización/Historial y sus etapas. No se preparó ni publicó ningún modpack ni se modificaron los campos del borrador.
- Bot abre, conserva acceso administrativo y clave cifrada. Conectó con Discord y mostró Roles sincronizados. Se verificaron estados independientes de conexión, roles y anuncios, e historial de actividad legible. «Anuncio pendiente» permanece visible sin convertir la conexión en desconectada; no se da por verificado el envío de ese anuncio. La latencia apareció sin medición; no se forzaron desconexiones para probarla.
- Ninguna instalación falló. Las comprobaciones con sesión del Launcher y el envío de diagnósticos privados completo son pendientes, no aprobadas. No se probó la renovación de tokens vencidos ni instalación en otra computadora.

**Dependencia de Cloudflare (parcial):** la cola cifrada, saneamiento, integración cliente y estados/historial están incluidos localmente. La nueva ruta /v2/application/problem, persistencia en la cola del Worker y lectura firmada para botones privados de diagnóstico requieren desplegar el Worker preparado. No se desplegó: recepción, entrega y consulta/copia en Discord no se presentan como verificadas de extremo a extremo. No se cambiaron permisos, roles ni canales de Discord.

No se publicaron releases, modpacks ni cambios en GitHub. No se modificaron originales de CurseForge, mundos, instancias, tokens ni claves. Los datos de usuario se conservaron en sus rutas anteriores. Instalación completada; la siguiente inspección manual queda a cargo del propietario.


## 2026-10-15 — Error 007: reintentos de integridad del Administrador

**Terminado y probado localmente; no compilado, instalado, publicado ni desplegado.** Se conserva el diagnóstico previo: los SHA-256 recibidos en los fallos reales de Mundo Conejil 0.1.8 no se registraron y no se atribuye su origen al proveedor, red o servicio sin evidencia. La versión publicada 0.1.8 no se modificó.

- Las descargas verificadas del Administrador comparten un presupuesto de hasta tres intentos totales por archivo entre fallos HTTP transitorios y discrepancias SHA-256; se desactiva el reintento HTTP interno sólo en estas llamadas para evitar multiplicación. Esperas: 400 y 800 ms. Fuentes autorizadas y redirecciones conservan las reglas existentes. Los errores permanentes de autorización y fuentes no admitidas no obtienen nuevos reintentos.
- Sólo se reintenta el archivo afectado. Los comprobantes aprobados mantienen sus claves y caducidad del Error 005; las descargas fallidas no se almacenan y no se retienen sus buffers en el error. El contenido remoto sólo entra en caché tras validar hash y tamaño. No cambian hashes esperados ni formatos de manifiesto.
- Tras tres discrepancias, el error muestra nombre de archivo, intentos, SHA-256 esperado y recibido, tamaño recibido y aviso de publicación detenida por integridad. No incluye URL ni parámetros de credenciales. El progreso anuncia cada nuevo intento.
- Se mantienen comprobaciones de cambios de archivos, conflictos del mismo modpack, verificación de bytes publicados antes de activar y activación sin sobrescribir el historial. No se modificaron Launcher, Bot, Cloudflare, mundos, archivos originales, sesiones, claves ni configuraciones personales.

**Pruebas ejecutadas con simulaciones: 38 aprobadas, 0 fallidas.** Primera ejecución: 37 pruebas en verificar-integridad-admin.cjs, verificar-optimizacion-publicacion.cjs y verificar-admin-modpack.cjs. Después se añadió y ejecutó únicamente una prueba adicional de publicación simulada recuperada, aprobada. Cubren éxito al primer/segundo/tercer intento, diagnóstico terminal, bloqueo sin activar, descarte de fallos, caché aprobada y caducidad, archivos posteriores, presupuesto mixto HTTP/hash, fuentes/redirecciones rechazadas y protecciones del Error 005. No hubo solicitudes de red reales ni publicación de modpacks.

Archivos modificados: engine.cjs, reliable-request.cjs, verified-content-cache.cjs, verificar-integridad-admin.cjs, verificar-optimizacion-publicacion.cjs, verificar-admin-modpack.cjs y ESTADO_DESARROLLO.md. Los tres primeros pertenecen exclusivamente al Administrador. Versiones públicas y aplicaciones de prueba instaladas permanecen sin cambios; para probar esta corrección en la aplicación instalada se requiere autorización posterior para compilar e instalar.

Limitaciones: una discrepancia permanente sigue bloqueando la publicación; los intentos agregan como máximo 1,2 segundos de espera además del tiempo de descarga. Los comprobantes pueden caducar según sus plazos existentes. Los reintentos no prueban ni resuelven por sí solos la causa histórica de los bytes diferentes.


## 2026-10-15 — Administrador PRUEBA LOCAL 20261015.2 instalado

**Instalación local completada, no publicada.** Sólo se compiló y actualizó VillaWolf Administrador, base 0.1.25, localTestBuild=20261015.2. El título identifica PRUEBA LOCAL 20261015.2. Se verificó que engine.cjs, reliable-request.cjs y verified-content-cache.cjs dentro del app.asar generado e instalado son idénticos a los fuentes corregidos del Error 007. El paquete no contiene archivos privados de sesión.

- Se respaldaron binarios de PRUEBA LOCAL 20261015.1 y datos privados necesarios en .champagne-admin/prueba-local-20261015-2/restauracion/instalacion y restauracion/datos. Los seis archivos protegidos de configuración y sesión resultaron idénticos antes y después de instalar, antes de abrir la nueva aplicación. Se preservan los preparados y archivos originales sin reemplazarlos. El procedimiento RESTAURAR.md permite reinstalar la compilación anterior sin desinstalar ni borrar datos.
- Instalador NSIS terminó con código 0. Se abrió el ejecutable instalado y se observó la cuenta Discord autorizada y la conexión central de GitHub disponible en Perfil. El actualizador muestra que está desactivado para la prueba 20261015.2; el bloqueo reside en la copia de empaquetado y no modifica el canal público.
- Comprobaciones controladas: 16 pruebas seleccionadas aprobadas, 0 fallidas (11 de integridad y 5 de publicación/protecciones simuladas). Además se probaron cuatro escenarios directamente con los módulos preparados para el paquete: éxito en intento 1, 2 y 3 con reutilización de comprobante, y tres discrepancias con bloqueo sin comprobante. Se cubrió continuidad hacia archivos posteriores, presupuesto HTTP/hash compartido, fuentes rechazadas, conservación de caché y protecciones de cambios de archivos/conflictos del Error 005. No hubo publicaciones reales ni descargas masivas.
- Launcher y Bot no se compilaron ni reinstalaron; se compararon sus app.asar antes y después y permanecen idénticos. No se desplegó Cloudflare ni se publicaron cambios en GitHub. Mundo Conejil 0.1.8 no fue republicado, revertido ni modificado. No se alteraron originales de CurseForge, mundos, credenciales, sesiones ni configuraciones personales.

La inspección manual del nuevo reintento en uso real queda a cargo del propietario. Las pruebas simuladas no confirman la causa histórica de las discrepancias. No hay fallos de instalación pendientes. Evidencia local: .champagne-admin/prueba-local-20261015-2/resultado-instalacion.json.

Comprobación visual adicional de 20261015.2: se abrió y cerró Perfil y se seleccionó Mundo Conejil; se mostraron Edición de interfaz, Carpetas y archivos, Información del servidor y Configuración de Discord. No se ejecutó ninguna operación de modificación/publicación.


## 2026-10-15 — Preparación de distribución 0.x de desarrollo

**En preparación; todavía no publicado en esta entrada.** Numeración disponible comprobada en GitHub: Launcher 0.1.19, Administrador 0.1.26 y Bot 0.2.4. Todas las versiones 0.x son de desarrollo/pruebas; 1.0.0 queda reservada para el lanzamiento definitivo. Se usan los canales existentes, sin canal beta ni prerelease separado.

Launcher incluye 002 y parte local de 003. Administrador incluye 005, 006, 007 y parte local de 003. Bot incluye 001, historial cifrado/saneado/copiable y parte local de 003. No se añaden rediseños. Fuentes e instaladores de distribución excluyen las marcas y bloqueos PRUEBA LOCAL: vuelven a usar sus actualizadores habituales sin alterar sus URLs.

Validaciones de distribución seleccionadas: 9 pruebas de actualizador Bot/Administrador y persistencia de sesión aprobadas; una prueba adicional de desconexión/reanudación, resincronización y fallo temporal de roles del Bot aprobada con clientes simulados, sin interrumpir el bot real. El primer intento de esta nueva simulación falló por ausencia de Buffer en su entorno VM; se corrigió únicamente el entorno de prueba y pasó. No se repitió la auditoría general ni las 38 pruebas de integridad ya aprobadas.

Los fuentes pendientes del Error 003 del Worker se sincronizan con el repositorio para conservar sus pruebas y dependencias; **no se despliega Cloudflare**. El envío y consulta de diagnósticos de extremo a extremo siguen pendientes de autorización y despliegue. La firma pública Windows continúa pendiente según CODE_SIGNING_POLICY.md; se conserva el estado de distribución anterior sin desactivar controles.

Validaciones previas a distribución: los tres paquetes arrancaron en Electron con datos temporales y red desactivada. Se verificaron versiones, módulos corregidos, ausencia de credenciales/rutas privadas y de bloqueos PRUEBA LOCAL. Los tres instaladores PE son válidos; SHA-512 y tamaños coinciden con latest.yml de Launcher y Administrador, y se generaron SHA256SUMS.txt para las tres aplicaciones. Los paquetes aún esperan publicación al registrar esta comprobación.

GitHub CI detectó un fallo de su simulador antiguo src/tests/verificar-actualizador.js al resolver el nuevo módulo de diagnóstico. Se actualizó sólo el simulador para resolver módulos desde src y emitir el cierre de la aplicación simulada, liberando los monitores de errores entre casos. Las 22 pruebas de ese archivo aprobaron; no se modificó código de las aplicaciones ni sus binarios para este ajuste.


## 2026-10-15 — Publicados Launcher 0.1.19, Administrador 0.1.26 y Bot 0.2.4

**Distribución completada y verificada.** No son releases beta separadas ni prereleases: el ciclo 0.x completo es desarrollo/pruebas. La versión 1.0.0 no se creó.

- Launcher: https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.19
- Administrador: https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.26
- Bot: https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.4

Los instaladores, blockmaps y archivos de integridad/metadatos se subieron primero como borradores y se verificaron por tamaño/SHA-256 antes de publicar. Se verificaron de nuevo las 11 descargas públicas tras publicar, usando las URLs definitivas de los assets. Los borradores tenían URLs temporales untagged; la verificación local se ajustó para leer las URLs definitivas de GitHub, sin reemplazar assets.

Launcher ocupa releases/latest con v0.1.19; Administrador conserva updates/admin/latest.yml, actualizado en commit 49fc503c3dfbced5fdd47bc0d4ad321a400636a5; Bot conserva la consulta por tags bot-v. Se ejecutaron los controladores habituales con electron-updater real para comprobar detección desde Launcher 0.1.18 y Administrador 0.1.25, y el controlador real del Bot desde 0.2.3: detectaron respectivamente 0.1.19, 0.1.26 y 0.2.4. Sólo se consultaron metadatos en esa prueba; no se instaló ni descargó automáticamente un ejecutable.

Se comprobó que las cinco releases anteriores mantienen sus IDs y assets originales, sin sobrescribir instaladores. El árbol remoto updates/ conserva todos sus archivos anteriores salvo el canal del Administrador autorizado; Mundo Conejil 0.1.8 y los demás modpacks no se modificaron. No hubo despliegue de Cloudflare, cambios de permisos, instalación local de estas releases ni eliminación de respaldos. Código y documentación se sincronizaron en la rama preparacion-paso97 del repositorio de referencia.

Pendientes: Error 003 central requiere autorización/despliegue/pruebas del Worker; firma pública Windows pendiente; pruebas manuales en otras computadoras todavía no realizadas. Las instalaciones PRUEBA LOCAL de esta PC conservan intencionalmente sus bloqueos de actualización: para pasar a la distribución publicada hay que ejecutar su instalador, no se quitaron esos bloqueos remotamente. La conservación de datos se validó previamente en las instalaciones locales de prueba y se cotejaron identidad y módulo de almacenamiento cifrado entre los paquetes actuales y los instalados; no se afirma una instalación real de estas releases en otra PC.

GitHub CI posterior al ajuste del simulador también terminó correctamente: npm test y compilación Windows aprobados en https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/actions/runs/38815563979. Fue ejecutado por el workflow existente del repositorio, sin despliegue ni publicación automática de nuevas versiones.


## 2026-10-16 — Launcher 0.1.20 instalado en esta PC

Instalador oficial contrastado por SHA-256, instalación NSIS finalizada con código 0. ASAR instalado: versión 0.1.20 sin marca PRUEBA LOCAL, src/main.js idéntico al código publicado. Aplicación abierta con ventana VillaWolf Launcher y proceso respondiendo. Seis archivos locales de configuración/estado protegidos permanecieron idénticos antes de abrir. Respaldo de instalación anterior y datos en .champagne-admin/instalacion-launcher-020-20261016-001020. No se modificaron instancias, mundos ni modpacks, ni se reinstalaron Bot o Administrador. No se comprobó en esta operación renovación de sesiones vencidas ni arranque de Minecraft. Actualización documental local; pendiente sincronizar esta entrada con futuros cambios autorizados.


## 2026-10-16 — Registro de limpieza dañado tras abrir Launcher 0.1.20

Causa confirmada del error JSON repetido cada cinco segundos: metadata/deleted-packs.json contenía 97 bytes nulos; instance-folders.json y selected-pack.json eran JSON válidos. No se determinó el origen de la corrupción. Se cerró únicamente Launcher y se respaldó el archivo dañado en .champagne-admin/registro-limpieza-danado-20261016-1792131221911.bin. Se recuperaron los cuatro IDs del catálogo público oficial validado (también 97 bytes), mediante temporal, fsync y reemplazo. Launcher 0.1.20 reabierto y respondiendo; lectura de cola válida. La comprobación controlada no ejecutó limpieza. No se editaron mods, mundos, sesiones ni originales de CurseForge.

Protección permanente preparada únicamente en código local: escritura temporal con fsync/reemplazo para cola y registro de instancias, diagnóstico que identifica el archivo dañado sin interpretar bytes inválidos como órdenes de borrado y supresión del mismo aviso repetido por el temporizador hasta recuperarse. Sin recuperación automática inventada de IDs. Archivos: champagne-pack-purge.js, main.js, verificar-limpieza-lanzador.cjs. Nueve pruebas específicas aprobadas, cero fallidas; sintaxis de main.js correcta. Incluye archivo nulo sin borrado, fallo de reemplazo conservando registro anterior, persistencia, rutas, enlaces y aislamiento de otros mundos. No se generaron instaladores, publicaron versiones ni desplegaron servicios. La protección nueva requiere futura compilación; el arreglo de datos sí está aplicado a esta PC.


## 2026-10-16 — Comprobación de avisos en Discord

Consulta autorizada mediante UI del canal registro, sin borrar mensajes ni enviar anuncios. Diagnósticos privados comprobados: Launcher 0.1.20 pack-catalog (06:11:17.412Z): Inicia sesión con Discord para ver tus mundos; refresh-presentation (06:11:17.398Z): Elige un modpack autorizado en tu biblioteca; launcher (06:11:21.491Z): error JSON de limpieza. Se entregaron aproximadamente a las 00:21–00:23 locales, después de generarse a las 00:11 y antes de la reparación en cuanto a origen. Las referencias distintas no demuestran duplicación de entrega del Bot. El código guarda hasta diez reportes cifrados, envía uno por flush y conserva versión/fecha originales; deduplicación local de cinco minutos sólo en memoria. La instrumentación genérica captura también resultados ok=false de estados esperados (sin sesión/sin modpack), generando ruido. Pendiente clasificar esos estados y mejorar agrupación/persistencia de deduplicación; sin modificar código ni publicar por esta comprobación. No se atribuyen todos los avisos al registro dañado: los dos estados de acceso son diferentes.


## 2026-10-16 — Administrador público 0.1.26 instalado en esta PC

Actualización autorizada desde PRUEBA LOCAL 20261015.2 mediante el instalador oficial existente, contrastado por SHA-256 b994097ab85007f0967dea8faa5c10b45ba83251837f49ec9ec765ce469827ae. NSIS terminó con código 0; doce archivos protegidos de datos, configuración y borradores permanecieron idénticos antes de abrir. Respaldo de binarios anteriores y datos en .champagne-admin/instalacion-admin-026-20261016-003934. Ventana del Administrador abierta y respondiendo sin marca PRUEBA LOCAL; versión 0.1.26 del paquete comprobada. No se comprobó renovación de tokens ni se publicó un modpack para probar. Launcher y Bot no se reinstalaron, ni hubo despliegues o releases. Los preparados y originales de CurseForge permanecen en su ubicación. Entrada documental local pendiente de próxima sincronización autorizada.


## 2026-10-16 — Bot: evitar envío tardío de diagnósticos antiguos

Implementado localmente en Bot 0.2.6: sólo los trabajos kind=diagnostic con fecha válida de hasta una hora se publican al canal. Los de más de una hora, sin fecha o con fecha futura mayor de cinco minutos no consultan ni envían al canal. Se conserva el payload y se confirma con el resultado existente retry a 24 horas, nunca como sent: el servicio conserva el registro para consulta. En cada revisión posterior el diagnóstico seguirá fuera de la ventana y no se publicará. No es un borrado ni un archivado terminal; por compatibilidad con Worker 1.2.3 consume una comprobación diaria por trabajo antiguo. No cambia avisos de versiones/modpacks ni auditorías. La política evita avisos tardíos, pero un diagnóstico que tarde más de una hora tampoco anunciará aunque sea real: permanece registrado.

Consulta real autorizada de D1: no había diagnósticos pending/uncertain/leased al comprobar; no se cancelaron ni eliminaron filas ni mensajes existentes. El Bot se detuvo brevemente y volvió a arrancar durante la preparación. Veinte pruebas específicas aprobadas, cero fallidas: filtro, fecha, frontera de una hora, reinicio, continuidad a reporte reciente, envío/reconciliación/menciones y regresión de sincronización. Fuentes: notifications.cjs, package.json y package-lock.json del Bot; compilar-bot.cjs; verificar-diagnosticos-antiguos.cjs. No cambia Launcher, Administrador ni Cloudflare para este filtro. Instalación local aún pendiente al registrar esta entrada; no se publicó release.


Instalación local de Bot 0.2.6 completada el 16 de octubre: compilación NSIS exitosa, cinco archivos protegidos idénticos antes de abrir; respaldo en .champagne-admin/instalacion-bot-026-20261016-005345. ASAR instalado 0.2.6 y notifications.cjs idéntico al fuente probado. Estado real: autorizado, ejecutándose, conectado y roles del servidor oficial listos. No se enviaron mensajes reales de prueba ni se crearon releases/despliegues. Versión pública del Bot sigue siendo 0.2.5; desarrollo e instalación de esta PC 0.2.6. Para restaurar binarios, cerrar sólo Bot y recuperar la carpeta instalacion del respaldo conservando datos actuales; no restaurar credenciales automáticamente. El filtro se comprobó con simulaciones, no con una inyección de errores en producción.


## 2026-10-16 — Copia central de nuevas versiones de modpacks (preparada localmente)

Worker 1.2.4 local prepara un mensaje independiente en VillaWolf, canal publicaciones-modpack 1559335322926710794, por cada nueva versión confirmada en GitHub. Incluye notas, nombre/versión, portada a través del Bot existente y Publicado por con el nombre del administrador tomado del recibo y la sesión verificada (no del formulario). Sin menciones. Destino fijo independiente de los anuncios configurables por comunidad, incluso si están desactivados. Conserva la auditoría en registro; no anuncia borradores ni simples cambios de interfaz/Discord, ni reproduce versiones históricas. ID persistente por pack/versión/destino evita duplicados al reintentar.

Treinta y nueve pruebas seleccionadas aprobadas, cero fallidas: publicación confirmada y autoría, aviso central con externos activados/desactivados, anti-suplantación, deduplicación, auditoría, colas, entrega y menciones. Pruebas con mocks/SQLite; no se publicó modpack ni se envió anuncio de prueba. Cambios: worker.mjs y verificar-catalogo-discord.cjs. No requiere reinstalar Bot, Launcher ni Administrador. Pendiente autorización de despliegue del Worker por la restricción previa del propietario; producción sigue 1.2.3.

Permisos del destino central consultados en metadatos firmados y frescos del Bot (3 segundos): Ver canal, Enviar mensajes, Insertar enlaces, Adjuntar archivos y Leer historial permitidos; Administrador desactivado. No se modificaron permisos.


## 2026-10-16 — Copia central de publicaciones activada en producción

Despliegue expresamente autorizado por el propietario. Worker villawolf-auth 1.2.4 activo, versión Cloudflare eecab311-1b99-4ded-a585-8dc80e9883cd; health público HTTP 200 y versión 1.2.4 comprobados. Rollback disponible a 861107e4-0321-4e9d-bbae-c6c7a822ff15 (1.2.3). Sin migraciones D1 ni cambios de credenciales o permisos. Bot 0.2.6 local sigue conectado, autorizado y con roles ready.

Las próximas nuevas versiones de modpacks confirmadas generarán su copia independiente en 1559335322926710794, con notas y administrador del recibo verificado, sin menciones. Se mantiene el aviso configurable de cada comunidad y la auditoría de registro. No se hizo backfill de versiones antiguas, no se encoló anuncio de prueba ni se publicó modpack. Treinta y nueve pruebas simuladas aprobadas anteriormente; falta observar la primera entrega real tras una próxima publicación del propietario. No requiere reinstalar aplicaciones.


