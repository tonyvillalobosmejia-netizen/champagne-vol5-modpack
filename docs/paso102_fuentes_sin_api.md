# Paso 102 — Verificación de fuentes sin API de CurseForge

Fecha: 2026-10-10.

## Resultado

- Se verificaron en memoria las 32 fuentes Modrinth ya incluidas en `inventario/fuentes_46.csv`. Los tamaños y SHA-256 coinciden con el inventario local.
- Se encontró además el artefacto de Clumps 12.0.0.4 en el Maven de BlameJared, que coincide con el tamaño original (20 299 bytes) y SHA-256. El proyecto del autor declara MIT y mantiene el [repositorio del mod](https://github.com/jaredlll08/Clumps); el perfil local permite distribución a terceros. La página oficial del autor confirma que Clumps 1.17+ se requiere solo en el servidor, lo que también cubre el servidor integrado de un mundo local.
- Quedan 13 entradas sin fuente independiente verificada. No se llamó a la API de CurseForge ni se descargaron archivos desde su CDN.
- El informe reproducible está en [`inventario/verificacion_fuentes_33_paso102.json`](../inventario/verificacion_fuentes_33_paso102.json). Contiene solo nombres, tamaños, SHA-256, URL, origen y resultado; no contiene JAR.
- El archivo [`inventario/fuentes_46.csv`](../inventario/fuentes_46.csv) sigue siendo la lista completa. No se agregó URL ficticia para cubrir los 14 faltantes.

## Límite de distribución

La verificación demuestra que los bytes alojados por Modrinth y BlameJared coinciden con los archivos locales; no demuestra por sí sola permiso para redistribuirlos ni reemplaza la revisión de licencias. Clumps declara MIT y el perfil local indica distribución permitida; conserva el aviso y el texto de licencia MIT si se distribuye el archivo. La documentación de CurseForge indica que el acceso de aplicaciones de terceros depende del permiso de distribución del proyecto y de la vía oficial de acceso a su API ([permiso de distribución](https://support.curseforge.com/en/support/solutions/articles/9000207877), [acceso a la API](https://support.curseforge.com/en/support/solutions/articles/9000208346-about-the-curseforge-api-and-how-to-apply-for-a-key)). Para respetar la decisión de no usar esa API, no se convierten URLs obtenidas de perfiles o cachés de CurseForge en fuentes de descarga del launcher.

El inventario local declara `ARR` para nueve de los 14 JAR pendientes; cinco declaran MIT, LGPL, GPL-3.0 o EPL-2.0. Esas etiquetas se deben confirmar con los textos completos de licencia y las condiciones del autor antes de distribuir. El indicador `allowModDistribution=false` está guardado para `servercore-forge-1.5.2+1.20.1.jar` y `entityculling-forge-1.9.5-mc1.20.1.jar`; sus URLs de caché no deben usarse como sustituto.

## Estado del actualizador

No se generó ni publicó un manifiesto para el launcher. `manifestUrl` debe permanecer vacío hasta resolver las 14 fuentes por medios autorizados y verificar instalación limpia, firma/versionado, rollback y preservación de configuraciones y mundos.

