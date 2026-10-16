# VillaWolf — canales de modpacks

Corte documental: 16 de octubre de 2026. Versiones de modpacks independientes de Launcher, Administrador y Bot. **Mundo Conejil 0.1.11**, Minecraft 1.20.1 / Forge 47.4.10, confirmado al consultar `stable-v2.json`; no se publica ni modifica contenido en esta revisión.

## Estructura y operación vigentes

- `catalog.json`: catálogo e identidades/roles/servidores, anuncios opcionales y retiradas.
- `stable-v2.json`, `versions/` e `history.json`: canal y metadatos del pack principal.
- `packs/<id>/stable.json`, `versions/` e `history.json`: canales independientes de otros modpacks.
- `admin/latest.yml`: canal del ejecutable Administrador, no un modpack. El actualizador del Launcher usa los assets de su release y Bot consulta tags propios.
- `stable.json` conserva un formato/canal histórico. No presentarlo como la versión actual ni borrarlo por documentar.

JUGAR comprueba permisos y actualizaciones. El Administrador prepara, verifica fuentes/hashes y activa un commit confirmado. Publicar diseño conserva mods/versión; recuperar un pack prepara una versión nueva, no restaura mundos ni reescribe historial.

La API oficial CurseForge se integra a través del servicio, junto a otras fuentes autorizadas. Algunos autores restringen descarga automática: asistencia oficial y SHA-256 siguen obligatorios. No subir JAR, mundos, cuentas, secretos ni recursos ajenos sin derechos.

Al publicar una nueva versión confirmada se mantiene el aviso configurable y se añade copia independiente en VillaWolf `1559335322926710794`, con notas, portada y administrador verificado; auditoría en registro. La copia de Worker 1.2.4 tiene pruebas simuladas; primera entrega real pendiente. Nada se anuncia por guardar archivos locales.

[Estado](../launcher/ESTADO_DESARROLLO.md) · [Administrador](../launcher/tools/admin-modpack/README.md) · [Guía](../launcher/docs/tutoriales/GUIA_VILLAWOLF.md).

## Antecedente: canal asistido 0.1.2

El detalle siguiente se conserva como evidencia histórica de 57 mods y pruebas de esa preparación. No es el inventario actual ni describe el soporte actual de CurseForge o los botones de 0.1.20.

## Champagne Vol.5 — canal asistido

`stable.json` contiene la versión 0.1.2 para Minecraft 1.20.1 / Forge 47.4.10: 57 mods, 43 descargas directas oficiales y 14 descargas manuales desde la página del archivo exacto de CurseForge. No utiliza la API de CurseForge y no contiene JAR.

Se añadieron AppleSkin, Architectury, Balm, Drippy Loading Screen, FancyMenu, Konkrete, KubeJS, Melody, Rhino, Waystones y Xaero's Minimap. Los 46 JAR anteriores conservan sus hashes.

El contenido incluye 67 archivos de configuración y scripts, con sus bytes y SHA-256, y una referencia oficial de Modrinth para Complementary Reimagined r5.7.1. El shader no se aloja aquí. Tampoco se publican mundos, opciones personales, cuentas, fingerprints de hardware, variables del jugador, ejemplos gráficos ni temas y traducciones que los mods generan desde sus propios archivos.

Requiere el launcher actualizado con soporte de contenido remoto (build 0.1.1). La actualización se inicia pulsando ACTUALIZAR MODPACK y luego INSTALAR VERSIÓN; las entradas manuales deben importarse primero cuando falten o cambien. En una instalación con los 46 mods anteriores, Balm es el único mod manual nuevo. No es un mecanismo de actualización automática del ejecutable del launcher.

Validación antes de publicar: 42 pruebas aprobadas; instalación aislada de los 57 JAR y 68 archivos de contenido usando descargas reales; actualización desde 46 a 57 sin modificar mundos, opciones ni una configuración personalizada; segunda ejecución sin cambios. Los hashes de las 43 fuentes directas y del shader se comprobaron frente a los archivos locales. No se volvió a probar Minecraft ni el servidor durante esta publicación.

Licencias y fuentes de los mods nuevos: los archivos se obtienen de las publicaciones oficiales de sus autores en Modrinth, o de CurseForge mediante descarga manual de Balm. FancyMenu exige referencias oficiales y permite descargas por launchers: https://github.com/Keksuccino/FancyMenu/blob/master/LICENSE.md . KubeJS y Architectury declaran LGPL-3.0; sus JAR no se redistribuyen aquí. Los scripts de ejemplo de KubeJS se conservan como scripts legibles, con su referencia https://kubejs.com/ .

El Pull Request #1 permanece en borrador y no se creó ningún Release. El canal se publica en la rama preparacion-paso97 para uso del launcher.


