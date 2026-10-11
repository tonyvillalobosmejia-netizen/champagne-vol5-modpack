# Champagne Vol.5 — Modpack

**Minecraft 1.20.1 · Forge 47.4.10 · Perfil CurseForge 0.1.0**

El perfil se administra en CurseForge; los jugadores utilizarán **Champagne Vol.5 Launcher**. La instalación de los 46 JAR y las configuraciones ya se probó localmente: Minecraft abrió y los mundos funcionaron. La conexión al servidor sigue pendiente de probar.

## Archivos de preparación

- `inventario/fuentes_46.csv`: nombres, SHA-256 y enlaces directos de las fuentes exactas identificadas previamente.
- `tools/validar_y_generar.py`: comprueba el inventario. Requiere **46 enlaces** y verifica cada descarga SHA-256 antes de generar `manifest.VERIFICADO.json`.
- `.github/workflows/verificar-inventario.yml`: valida la estructura del inventario **sin descargar ni publicar mods**.

**Estado:** 32 URLs identificadas anteriormente en Modrinth; 14 faltantes. Las 32 aún requieren nueva verificación en red. En el Paso 98 se consultaron los 14 hashes originales a la API de Modrinth y se obtuvieron **0 coincidencias exactas**. Consulta [docs/paso98_resultados.md](docs/paso98_resultados.md) para el informe de cliente/servidor. El manifiesto para Champagne Launcher **NO está listo**.

## Flujo de actualizaciones

1. Cambiar los mods en el perfil de CurseForge.
2. Exportar la nueva versión y actualizar aquí nombres, hashes y fuentes.
3. Ejecutar `python tools/validar_y_generar.py --check`.
4. Resolver los enlaces restantes mediante fuentes autorizadas.
5. Ejecutar `python tools/validar_y_generar.py --verify-downloads --version 0.1.0`.
6. Revisar las condiciones de descarga y probar una instalación limpia. Solo después publicar el manifiesto aprobado y configurar `manifestUrl` en Champagne Launcher.

## Seguridad

- **No subir** los JAR ni `mods.zip` sin revisar permisos de autores.
- El ZIP de exportación de CurseForge **no es** un instalador autónomo de Champagne Launcher.
- El `manifest.json` de CurseForge y el manifiesto de actualizaciones del launcher **son formatos distintos**.
- La rama de preparación no modifica la instalación local ni habilita **ACTUALIZAR MODPACK**.
- Encontrar una URL oficial no equivale a permiso para republicar el archivo en GitHub.
