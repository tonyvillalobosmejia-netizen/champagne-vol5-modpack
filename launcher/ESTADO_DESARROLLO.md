# Estado de desarrollo de VillaWolf

**Actualizado:** 15 de octubre de 2026 (America/Mexico_City).
**Alcance:** VillaWolf Launcher, VillaWolf Administrador, autenticación/publicación central y bot de roles.
**Propósito:** compartir avances y pendientes con otra persona o ChatGPT sin conceder permisos para modificar código.

## Publicación actual — 15 de octubre de 2026

- **Publicados y verificados:** Launcher 0.1.18 y Administrador 0.1.24. Descarga pública de instaladores, blockmaps y latest.yml comprobada por SHA-256/tamaño; canales de actualización activados.
- **Pruebas:** 268 aprobadas, 0 fallos; arranque de ambos paquetes en perfiles aislados aprobado. No se repitieron todas las combinaciones de Minecraft ni la instalación habitual de esta PC.
- **Administrador 0.1.23:** formulario oscuro de cuatro pestañas, borradores locales, imagen inicial, validaciones reales y comprobación de comunidades externas. Crear borrador no publica ni anuncia.
- **Launcher 0.1.18:** cuenta renovada, Discord obligatorio/Microsoft opcional, código de dispositivo copiado automáticamente y avatar de Discord o skin oficial Premium.
- **Worker 1.2.0 desplegado:** migraciones aditivas 0004–0006 ejecutadas, ROLE_BOT_MULTI_GUILD=true y ADMIN_RELEASE_CHANNEL_ID configurado y verificado por UI. Roles, cola y auditoría implementados. No se cambiaron secretos ni tablas anteriores.
- **Bot 0.2.0 conectado:** el propietario reemplazó la credencial; comprobación de identidad por Discord aprobada y estado local «Bot conectado. Roles sincronizados». Los dos canales privados de Racoon mantienen los cinco permisos necesarios. La comprobación directa de Discord sigue disponible como respaldo.
- **Racoon Team:** bot y mensajes reales comprobados anteriormente en ambos canales privados, sin Administrador; la credencial dejó de ser aceptada al retomar el 15 de octubre. Canales y rol de pruebas se conservan.
- **Pendiente de integración real:** cola completa, auditoría de una publicación y filtrado externo con el bot reconectado. Automatizados aprobados; no presentar como ensayo real completo.

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

**Desplegado en Worker 1.2.0; entrega pendiente de reconectar el bot:** el evento de publicación confirmada compara el manifiesto del commit con su padre y añade a la auditoría privada versión anterior/nueva, cantidades de mods y archivos añadidos/modificados/retirados y cambios de nombre, Minecraft/Forge, fondo, noticias, tarjeta de actualizaciones y notas. No copia rutas locales, credenciales ni contenido de configuraciones. Una publicación sólo de diseño no afirma haber cambiado mods ni versión. El mensaje divide resúmenes largos para respetar los límites de Discord.

**Verificación:** 11 pruebas de resumen, plantillas y cola pasaron el 14 de octubre de 2026 (3 nuevas para el resumen real y sus límites). Falta verificar este registro contra una publicación y un envío reales en Discord con el bot reconectado.

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
| Launcher Windows x64 | **0.1.18** | **0.1.18** | Release publicada, descargas e integridad verificadas; arranque en perfil aislado. Instalación habitual no actualizada por este ensayo. |
| Administrador Windows x64 | **0.1.24** | **0.1.24** | Release publicada, descargas e integridad verificadas; canal independiente activado y arranque en perfil aislado. |
| Servicio Cloudflare villawolf-auth | **1.2.0** | **1.2.0** | Health confirmado; comunidades externas, auditoría y cola desplegados. ROLE_BOT_ENABLED y ROLE_BOT_MULTI_GUILD activos. |
| VillaWolf Bot local | No distribuido como instalador | **0.2.0** | Código actualizado, token persistido cifrado; identidad y conexión verificadas el 15 de octubre. Roles sincronizados. |

Publicaciones verificadas:

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
