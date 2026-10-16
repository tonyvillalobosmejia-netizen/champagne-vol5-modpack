# VillaWolf — Launcher, Administrador, Bot y modpacks

Actualizado el 16 de octubre de 2026. Rama de trabajo **preparacion-paso97**, repositorio oficial `tonyvillalobosmejia-netizen/champagne-vol5-modpack`.

| Componente | Público / desplegado | Desarrollo / instalación de referencia |
| --- | --- | --- |
| Launcher | 0.1.20 | 0.1.20 instalado; protección JSON adicional sólo local |
| Administrador | 0.1.26 | 0.1.26 instalado |
| Bot | 0.2.5 | 0.2.6 instalado sólo localmente, sin release |
| Cloudflare | 1.2.4 | Copia central activa; primera entrega real pendiente |
| Mundo Conejil | 0.1.11 en stable-v2 al consultar | Versiones independientes de las aplicaciones |

[Launcher](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/v0.1.20) · [Administrador](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/admin-v0.1.26) · [Bot público](https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/tag/bot-v0.2.5).

## Componentes y documentación

- [Código y uso del Launcher](launcher/README.md): Discord obligatorio por rol/mundo, Microsoft Java opcional, biblioteca e instancias, fuentes/hashes, Forge/Java/RAM y actualizaciones.
- [Administrador](launcher/tools/admin-modpack/README.md): crear/editar/preparar/publicar modpacks, historial y Discord; acceso central Administrador u Owner.
- [Bot](launcher/auth-server/roles-bot/README.md) y [Cloudflare](launcher/auth-server/cloudflare/README.md): roles de varios servidores, sesiones, catálogos, cola, diagnósticos y auditoría.
- [Estado técnico completo](launcher/ESTADO_DESARROLLO.md), [roadmap](launcher/ROADMAP.md), [guía con capturas históricas](launcher/docs/tutoriales/GUIA_VILLAWOLF.md), [canales de modpack](updates/README.md).

Modpacks y Minecraft se desarrollan en su propio flujo. Publicar documentación o código no actualiza un modpack. Una release de aplicación no es un manifiesto de juego.

## Compatibilidad y seguridad

1.20.1 / Forge 47.4.10 / Java 17 tuvo arranque real previo; 1.21.1 / Forge 52.1.0 / Java 21 sólo preparación probada. Otros perfiles requieren ensayos individuales. Fabric, NeoForge y Quilt siguen sin soporte liberado. CurseForge es fuente/gestor, no loader.

API oficial CurseForge integrada, manteniendo restricciones de autores y descargas asistidas. No se alojan JAR de terceros sin autorización; hashes obligatorios. No subir mundos, tokens, D1, perfiles ni preparados privados.

[MIT del código propio](launcher/LICENSE) no concede derechos sobre Minecraft/mods. [Privacidad](launcher/PRIVACY.md) · [Terceros](launcher/THIRD_PARTY_NOTICES.md) · [Firma](launcher/CODE_SIGNING_POLICY.md). SignPath rechazó la solicitud según antecedente registrado; instaladores públicos sin Authenticode. No hay lanzamiento estable 1.0.0.

## Antecedente: inventario inicial Champagne Vol.5

El texto conservado debajo describe una preparación inicial de 46 mods y sus pendientes en esa fecha. No representa el canal vigente, ni significa que hoy falte integrar CurseForge o que 0.1.8 siga actual. Conservar sus inventarios/fuentes como evidencia, no como instrucciones actuales.

## Champagne Vol.5 — Modpack

**Minecraft 1.20.1 · Forge 47.4.10 · Perfil CurseForge 0.1.0**

El perfil se administra en CurseForge; los jugadores utilizarán **Champagne Vol.5 Launcher**. La instalación de los 46 JAR y las configuraciones ya se probó localmente: Minecraft abrió y los mundos funcionaron. La conexión al servidor sigue pendiente de probar.

### Archivos de preparación

- `inventario/fuentes_46.csv`: nombres, SHA-256 y enlaces directos de las fuentes exactas identificadas previamente.
- `tools/validar_y_generar.py`: comprueba el inventario. Requiere **46 enlaces** y verifica cada descarga SHA-256 antes de generar `manifest.VERIFICADO.json`.
- `python tools/validar_y_generar.py --verify-available`: verifica las URLs presentes, informa las pendientes y nunca genera manifiesto.
- `.github/workflows/verificar-inventario.yml`: valida la estructura del inventario **sin descargar ni publicar mods**.

**Estado:** 32 fuentes Modrinth y una fuente Maven de Clumps se verificaron por tamaño y SHA-256. Quedan 13 fuentes sin resolver. No se usó la API de CurseForge ni se descargó desde su CDN. Consulta [docs/paso102_fuentes_sin_api.md](docs/paso102_fuentes_sin_api.md) y el [informe verificable](inventario/verificacion_fuentes_33_paso102.json). La API de Modrinth consultada en el Paso 98 tampoco encontró hashes para los 13 archivos restantes. El manifiesto para Champagne Launcher **NO está listo**.

### Flujo de actualizaciones

1. Cambiar los mods en el perfil de CurseForge.
2. Exportar la nueva versión y actualizar aquí nombres, hashes y fuentes.
3. Ejecutar `python tools/validar_y_generar.py --check`.
4. Resolver los enlaces restantes mediante fuentes autorizadas.
5. Ejecutar `python tools/validar_y_generar.py --verify-downloads --version 0.1.0`.
6. Revisar las condiciones de descarga y probar una instalación limpia. Solo después publicar el manifiesto aprobado y configurar `manifestUrl` en Champagne Launcher.

### Seguridad

- **No subir** los JAR ni `mods.zip` sin revisar permisos de autores.
- El ZIP de exportación de CurseForge **no es** un instalador autónomo de Champagne Launcher.
- El `manifest.json` de CurseForge y el manifiesto de actualizaciones del launcher **son formatos distintos**.
- La rama de preparación no modifica la instalación local ni habilita **ACTUALIZAR MODPACK**.
- Encontrar una URL oficial no equivale a permiso para republicar el archivo en GitHub.



### VillaWolf Launcher

El código propio del launcher se publica bajo MIT en [launcher/](launcher/README.md). La licencia del launcher no concede derechos de redistribución sobre Minecraft, Forge, mods ni recursos de terceros.

[Code signing policy](launcher/CODE_SIGNING_POLICY.md) · [Privacidad](launcher/PRIVACY.md). La solicitud de firma gratuita está en preparación; SignPath no ha admitido todavía el proyecto. La versión instalada y publicada sigue siendo 0.1.8; 0.1.9 está en desarrollo.


