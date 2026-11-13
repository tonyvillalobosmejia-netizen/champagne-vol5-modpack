# Paso 98 — Auditoría de fuentes y separación cliente/servidor

Fecha de comprobación: 2026-10-10 (México), ejecución de GitHub Actions #38111390071.

## Resultados medidos

- 46 de 46 archivos JAR originales se comprobaron localmente contra los SHA-256 del inventario.
- 32 fuentes exactas se habían identificado anteriormente en Modrinth (no descargadas de nuevo en este paso).
- Los **14 hashes restantes** se consultaron en la API oficial `/v2/version_file/{sha256}?algorithm=sha256`.
- Resultado: **0 coincidencias exactas, 14 respuestas no encontradas** (no son fallos de descarga).
- Las cuatro pruebas sin red del comparador y el trabajo de GitHub Actions finalizaron correctamente.
- La actualización automática **NO está habilitada**.

Reporte descargable: [GitHub Actions, ejecución Paso 98](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/actions/runs/38111390071), artefacto `champagne-paso98-auditoria-modrinth`.

## Fuente oficial y compatibilidad del cliente

Según las páginas de CurseForge (consulta pública):

| Archivo pendiente | Declaración del proyecto | Fuente |
| --- | --- | --- |
| `betterchunkloading-1.20.1-5.4.jar` | Solo servidor | https://www.curseforge.com/minecraft/mc-mods/better-chunk-loading-forge-fabric |
| `chunksending-1.20.1-2.8.jar` | Solo servidor | https://www.curseforge.com/minecraft/mc-mods/chunk-sending-forge-fabric |
| `fastasyncworldsave-1.20.1-2.6.jar` | Solo servidor | https://www.curseforge.com/minecraft/mc-mods/fast-async-world-save-forge-fabric |
| `limitedchunks-1.20.1-4.1.jar` | Solo servidor | https://www.curseforge.com/minecraft/mc-mods/limited-chunkloading |
| `structureessentials-1.20.1-4.8.jar` | Solo servidor | https://www.curseforge.com/minecraft/mc-mods/structure-essentials-forge-fabric |
| `gpumemleakfix-1.20.1-1.8.jar` | Solo cliente | https://www.curseforge.com/minecraft/mc-mods/fix-gpu-memory-leak |
| `alltheleaks-1.1.1+1.20.1-forge.jar` | Cliente y servidor, licencia MIT declarada | https://www.curseforge.com/minecraft/mc-mods/alltheleaks |
| `connectivity-1.20.1-7.6.jar` | Cliente y servidor | https://www.curseforge.com/minecraft/mc-mods/connectivity |
| `cupboard-1.20.1-3.5.jar` | Cliente y servidor (biblioteca) | https://www.curseforge.com/minecraft/mc-mods/cupboard |
| `leaky-1.20.1-2.3.jar` | Cliente y servidor | https://www.curseforge.com/minecraft/mc-mods/leaky |
| `recipeessentials-1.20.1-4.0.jar` | Cliente y servidor | https://www.curseforge.com/minecraft/mc-mods/recipe-essentials-forge-fabric |
| `Clumps-forge-1.20.1-12.0.0.4.jar` | Cliente y servidor en ficha general; documentación señala servidor en versiones modernas | https://www.curseforge.com/minecraft/mc-mods/clumps |
| `KryptonReforged-0.2.3.jar` | Pendiente de clasificación documentada | — |
| `modfixer-0.0.5.jar` | Pendiente de clasificación documentada | — |

**No borrar todavía los mods exclusivamente de servidor de la instancia cliente**: el usuario también juega mundos locales, que utilizan un servidor integrado, y la configuración original se probó con 46 JAR.

**No sustituir** JAR por otro del mismo nombre/versión sin coincidencia SHA-256; la API no reconoció 14 hashes, por lo que las fuentes alternativas requieren verificación independiente y comprobación de permisos de distribución.

Próximos pasos: revisar licencias y posibilidad de descarga oficial de los nueve no identificados como servidor exclusivo; preparar una rama de cliente separada solo después de pruebas funcionales y de compatibilidad con el servidor.
