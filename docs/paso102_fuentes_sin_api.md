# Paso 102 — Verificación de fuentes sin API de CurseForge

Fecha: 2026-10-10.

## Resultado

- Se volvieron a descargar en memoria las 32 fuentes Modrinth ya incluidas en `inventario/fuentes_46.csv`. Los 32 tamaños y SHA-256 coinciden con el inventario local.
- Las 14 entradas restantes no tienen una fuente Modrinth identificada. No se llamó a la API de CurseForge ni se descargaron archivos desde su CDN.
- El informe reproducible está en [`inventario/verificacion_modrinth_32_paso102.json`](../inventario/verificacion_modrinth_32_paso102.json). Contiene solo nombre, tamaño, SHA-256, URL de Modrinth y resultado; no contiene JAR.
- El archivo [`inventario/fuentes_46.csv`](../inventario/fuentes_46.csv) sigue siendo la lista completa. No se agregó URL ficticia para cubrir los 14 faltantes.

## Límite de distribución

La verificación demuestra que los bytes alojados por Modrinth coinciden con los archivos locales; no demuestra permiso para volver a alojarlos ni reemplaza la revisión de licencias. La documentación de CurseForge indica que el acceso de aplicaciones de terceros depende del permiso de distribución del proyecto y de la vía oficial de acceso a su API ([permiso de distribución](https://support.curseforge.com/en/support/solutions/articles/9000207877), [acceso a la API](https://support.curseforge.com/en/support/solutions/articles/9000208346-about-the-curseforge-api-and-how-to-apply-for-a-key)). Para respetar la decisión de no usar esa API, no se convierten URLs obtenidas de perfiles o cachés de CurseForge en fuentes de descarga del launcher.

El inventario local declara `ARR` para nueve de los 14 JAR pendientes; cinco declaran MIT, LGPL, GPL-3.0 o EPL-2.0. Esas etiquetas se deben confirmar con los textos completos de licencia y las condiciones del autor antes de distribuir. El indicador `allowModDistribution=false` está guardado para `servercore-forge-1.5.2+1.20.1.jar` y `entityculling-forge-1.9.5-mc1.20.1.jar`; sus URLs de caché no deben usarse como sustituto.

## Estado del actualizador

No se generó ni publicó un manifiesto para el launcher. `manifestUrl` debe permanecer vacío hasta resolver las 14 fuentes por medios autorizados y verificar instalación limpia, firma/versionado, rollback y preservación de configuraciones y mundos.

