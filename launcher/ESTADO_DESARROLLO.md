# Estado de desarrollo de VillaWolf

**Actualizado:** 13 de octubre de 2026 (America/Mexico_City).
**Alcance:** VillaWolf Launcher, VillaWolf Administrador, autenticación/publicación central y bot de roles.
**Propósito:** compartir avances y pendientes con otra persona o ChatGPT sin conceder permisos para modificar código.

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
| Launcher Windows x64 | **0.1.16** | El código sigue declarando **0.1.16**; no se ha asignado una siguiente versión | Release pública comprobada mediante API de GitHub. Instalador probado e instalado previamente en esta PC. |
| Administrador Windows x64 | **0.1.18** | **0.1.18**, sin versión posterior asignada | Release admin-v0.1.18 publicada; instalador y descargas comprobados, canal automático activado. No se instaló sobre el perfil habitual en esta entrega. |
| Servicio Cloudflare villawolf-auth | Health informa **1.1.0** | Código local con integración opcional del bot | La versión del servicio es independiente de la de las aplicaciones. Integración del bot desplegada; versión activa 567cc551, ROLE_BOT_ENABLED=true. |
| VillaWolf Bot local | No distribuido públicamente | **0.1.0** | Conectado en esta PC y sincronizado con producción; configuración cifrada. No distribuido como instalador. |

Publicaciones verificadas:

- [Launcher 0.1.16](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.16).
- [Administrador 0.1.18](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.18).
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
| Avatar local de cuenta | Implementado: elegir imagen/skin para el avatar y restaurar el predeterminado. No equivale a cambiar la skin oficial de Minecraft. |
| Borrado local de modpack | Terminado con confirmación; conserva mundos, capturas y opciones por defecto. Eliminar también esos datos exige una selección adicional. |
| Desinstalación de aplicación/componentes | Implementada con controles de alcance y confirmación. No se utilizó para generar este informe. |
| Enlace a Discord y registros | Implementados. Acceso a comunidad, actividad y diagnósticos con filtrado de credenciales. |

### 2.2 Administrador

| Función | Estado y alcance comprobado |
| --- | --- |
| Aplicación e instalador independientes | Terminados. Icono y estilo verdes, versión propia y canal de actualización separado del Launcher. |
| Acceso Discord Administrador u Owner | Terminado y desplegado. Exige uno de esos roles en el servidor oficial de VillaWolf. Un rol de jugador no permite entrar a las rutas administrativas. |
| Perfil con nombre/avatar | Terminado. Botón superior derecho, cuenta Discord y conexión de publicación. |
| Tres menús principales | Terminados: Edición de interfaz, Carpetas y archivos, Información del servidor. El último muestra No disponible; no implica que exista automatización de servidor. |
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
| Launcher 0.1.16 | Reducción de consultas repetidas durante navegación/descargas; comprobación inicial de roles; pausa de Discord con explicación correcta; refresco de imágenes y uso del icono incluido en el paquete como respaldo; carpetas legibles y migración tolerante a carpetas ocupadas; apertura de raíz o carpeta individual según el botón. | Publicada y previamente instalada/verificada. No elimina los límites de Discord. |
| Administrador 0.1.17 | Reutiliza brevemente la autorización para tareas locales, manteniendo comprobaciones sensibles; menús de edición directos; historial directo sin Consultar publicaciones; acciones del selector y Cerrar menú ordenadas; corrección/instalación de paquete y snapshots para recuperar el arranque. | Publicada y previamente instalada/verificada. |
| Administrador 0.1.18 | Nuevo módulo publication-connection.cjs. Sólo una respuesta exitosa configured:false habilita el uso del token local. Los errores de Discord/red se conservan y no se convierten en token ausente. Agrupa consultas simultáneas de conexión. Mantiene verificaciones de publicación y mejora las instrucciones del paquete. | Publicada; 39 pruebas específicas pasaron, arranque del ASAR con perfil aislado e integridad local/remota/pública comprobados; canal independiente activado. Instalación sobre perfil habitual pendiente. |
| Bot local 0.1.0 / Worker sin nueva versión asignada | Proyecto aislado discord.js, ventana de configuración cifrada, bandeja y acceso local de escritorio. Worker local recibe actualizaciones firmadas/secuenciadas; sincronización completa, eventos de roles y control de desconexión/caducidad. Tablas adicionales creadas en D1; clave de conexión guardada por el propietario como Secret. Server Members Intent guardado en Discord y pertenencia del bot confirmada. | Integración desplegada y sincronización real comprobada. Falta ensayo de retirada/reposición de roles reales y desconexión/suspensión de la PC. |
| Documentación, 13-10-2026 | Se crea ESTADO_DESARROLLO.md, se comprueban releases/rama/health y se ejecutan 201 pruebas existentes. Se añade una regla documental de mantenimiento para futuros cambios. | Cambio documental; no añade funciones a las aplicaciones. |

No se atribuyen cambios nuevos a versiones 0.1.17 del Launcher o 0.1.19 del Administrador: no están asignadas en el código ni comprobadas como publicaciones.

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
**Carpeta de edición local:** C:/Users/tonyv/OneDrive/Desktop/mi-launcher-forge-inicial. Esta carpeta no contiene .git; no afirmar que sea un checkout local de la rama.
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
