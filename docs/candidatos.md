# Candidatos de descarga (no verificados por SHA-256)

Los JAR de la lista `inventario/fuentes_46.csv` son los del modpack local que ya funcionó.
**No copiar estas URLs al inventario hasta comprobar que el SHA-256 sea idéntico**.

## Clumps (Forge 1.20.1, 12.0.0.4)

Se ha localizado el archivo con el mismo nombre y versión en Modrinth:

- Página oficial: https://modrinth.com/mod/clumps/version/nAHGB5ls
- Candidato de descarga: https://cdn.modrinth.com/data/Wnxd13zP/versions/nAHGB5ls/Clumps-forge-1.20.1-12.0.0.4.jar
- SHA-256 que debe coincidir con tu JAR: `1d1cfcf386f182b1d0bdbe4bd4fc57b96234e8c7468e95e1575ad4dd6433243a`
- Estado: **CANDIDATO SIN COMPARACIÓN DE BYTES**.

La página del autor indica que, desde Minecraft 1.17, Clumps solo es obligatorio en el servidor; se ha dejado en el inventario del cliente para no cambiar silenciosamente la versión local que ya se probó.

Para verificar el candidato en Windows:
```powershell
Invoke-WebRequest -Uri "https://cdn.modrinth.com/data/Wnxd13zP/versions/nAHGB5ls/Clumps-forge-1.20.1-12.0.0.4.jar" -OutFile "Clumps-candidato.jar"
(Get-FileHash "Clumps-candidato.jar" -Algorithm SHA256).Hash.ToLower()
```
Si el hash es distinto, **no** usar este archivo como reemplazo.

El resto de URLs pendientes se encuentran como entradas sin URL en `inventario/fuentes_46.csv`.
