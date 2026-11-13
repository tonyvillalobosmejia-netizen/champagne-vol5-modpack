# VillaWolf Bot — operación y límites

Corte: 16 de octubre de 2026. Público **0.2.5** ([release](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.5)); instalado localmente **0.2.6**, aún sin release pública. La interfaz e iconos amarillos pertenecen al Bot, no al Administrador verde.

## Acceso y disponibilidad

Discord central con Administrador u Owner para acceder a la aplicación. El token del Bot y clave de conexión se guardan cifrados localmente; una cuenta autorizada no crea un token nuevo ni recupera uno revocado. Nunca distribuir el token entre jugadores ni extraer credenciales del navegador.

Se ejecuta en esta PC; necesita proceso, conexión y equipo encendidos. Inicio automático de Windows y alojamiento 24/7 no acreditados. Oracle se intentó sin capacidad y no hay VM permanente confirmada. La interfaz tiene versión y Buscar actualización; el actualizador no sustituye el proceso Gateway ni renueva su token.

## Funciones

Sincroniza miembros/roles/metadatos por servidor mediante Gateway y Server Members Intent. Señal firmada a Cloudflare, secuencias, latidos y ready confirmado. El límite del servicio es 90 segundos; fuera de él vuelve a comprobación directa Discord. Conexión, roles y anuncios son estados separados; una cola pendiente no implica desconexión.

Clasifica errores de servicio, configuración, red/intents y permisos con espera progresiva. Historial saneado/cifrado y diagnósticos con botones privados. Pendiente limpiar campos residuales de error cuando ya hubo recuperación.

Cola de anuncios con reconciliación, confirmación y menciones limitadas. Antes de avisar releases oficiales verifica versión publicada, instalador, URL, tamaño y SHA-256. No anuncia históricos al habilitar. Copia central de nuevas versiones de modpack activada en Worker 1.2.4; autor tomado del recibo y mensaje separado del canal configurado.

## Diagnósticos antiguos — sólo 0.2.6 local

No envía diagnósticos de más de una hora, sin fecha válida o con fecha futura mayor de cinco minutos. Conserva contenido y usa retry de 24 horas, nunca un falso sent. A cada revisión seguirá sin publicarlos si siguen antiguos. No es archivo terminal y consume una consulta diaria por trabajo antiguo. Diagnósticos recientes, anuncios de versiones y auditorías siguen funcionando. No borra mensajes ya enviados ni su historial.

20 pruebas de filtro/envío/sincronización aprobadas; instalado conservando cinco archivos protegidos. Sin inyectar errores reales en producción. Clasificar estados normales de clientes y deduplicar entre reinicios siguen pendientes; el filtro de antigüedad no resuelve ambas cosas.

## Permisos y límites

Canales: Ver canal, Enviar mensajes, Insertar enlaces, Leer historial para reconciliar y Adjuntar archivos si hay portada. No necesita Administrador global ni Gestionar roles. Para avisos del Administrador sólo rol `1559330834278781048`; Launcher/copia central sin menciones. Otros servidores necesitan bot invitado y permisos propios.

«Centro de Envíos» completo, archivo terminal y política de retención son propuestas, no pantallas implementadas. Un fallo D1 puede impedir consulta/registro; no anunciar éxito ante un envío ambiguo. [Destinos y Discord](../DISCORD.md) · [Servicio](../cloudflare/README.md) · [Estado](../../ESTADO_DESARROLLO.md).

