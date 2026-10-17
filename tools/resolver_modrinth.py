#!/usr/bin/env python3
"""Busca coincidencias EXACTAS en Modrinth utilizando el SHA-256 del JAR original.

No instala ni publica mods. Un 200 con el mismo nombre NO basta:
exige coincidencia con hashes.sha256 del archivo en el API oficial.
Guarda CSV de candidatas y CSV de pendientes en /informes/ (gitignored).
Uso: python tools/resolver_modrinth.py
"""
import csv
import json
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "inventario" / "fuentes_46.csv"
OUTPUT = ROOT / "informes"
API = "https://api.modrinth.com/v2/version_file/"
USER_AGENT = "ChampagneVol5-Modpack-Resolver/0.1 (GitHub repo: tonyvillalobosmejia-netizen/champagne-vol5-modpack)"

def official_url(url):
    if not isinstance(url, str):
        return False
    parsed = urlsplit(url)
    return (parsed.scheme == "https" and parsed.hostname == "cdn.modrinth.com"
            and not parsed.username and not parsed.password and not parsed.fragment)

def query_by_sha256(sha):
    request = Request(
        API + quote(sha) + "?algorithm=sha256",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    try:
        with urlopen(request, timeout=25) as response:
            if response.status != 200:
                raise ValueError("Respuesta HTTP inesperada")
            data = response.read(4 * 1024 * 1024 + 1)
            if len(data) > 4 * 1024 * 1024:
                raise ValueError("Respuesta API demasiado grande")
            return json.loads(data)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise

def inspect_version(version, expected_sha):
    if not isinstance(version, dict) or not isinstance(version.get("files"), list):
        raise ValueError("Respuesta de versión incorrecta")
    for entry in version["files"]:
        hashes = entry.get("hashes") or {}
        if str(hashes.get("sha256", "")).lower() != expected_sha.lower():
            continue
        url = entry.get("url", "")
        if not official_url(url):
            raise ValueError("Coincidencia de hash, pero URL no autorizada por el filtro")
        return {
            "url": url,
            "modrinth_project_id": str(version.get("project_id", "")),
            "modrinth_version_id": str(version.get("id", "")),
            "nombre_en_modrinth": str(entry.get("filename", ""))
        }
    raise ValueError("La respuesta no contiene un archivo con el SHA-256 solicitado")

def main():
    with INVENTORY.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames != ["file", "sha256", "url"]:
            raise ValueError("Columnas inesperadas de inventario")
        entries = list(reader)
    if len(entries) != 46:
        raise ValueError(f"Se necesitan 46 mods, hay {len(entries)}")
    missing = [row for row in entries if not row["url"].strip()]
    OUTPUT.mkdir(exist_ok=True)
    found = []
    pending = []
    print("Buscando coincidencias por SHA-256 en Modrinth:", len(missing), "mods")
    for index, item in enumerate(missing, 1):
        name, sha = item["file"], item["sha256"].lower()
        try:
            data = query_by_sha256(sha)
            if data is None:
                pending.append({"file":name, "sha256":sha, "motivo":"NO_EN_MODRINTH_POR_SHA256"})
                print(f"[{index}/{len(missing)}] NO ENCONTRADO: {name}")
            else:
                matched = inspect_version(data, sha)
                found.append({"file":name, "sha256":sha, **matched,
                              "estado":"COINCIDENCIA_API_SHA256_SIN_DESCARGA"})
                print(f"[{index}/{len(missing)}] COINCIDENCIA: {name}")
        except (ValueError, HTTPError, URLError, TimeoutError, OSError) as err:
            pending.append({"file":name, "sha256":sha, "motivo":f"ERROR_CONSULTA: {err}"})
            print(f"[{index}/{len(missing)}] PENDIENTE: {name}: {err}")
        time.sleep(0.5)
    with (OUTPUT / "coincidencias_modrinth.csv").open("w", encoding="utf-8", newline="") as fh:
        cols = ["file","sha256","url","modrinth_project_id","modrinth_version_id","nombre_en_modrinth","estado"]
        writer = csv.DictWriter(fh, fieldnames=cols); writer.writeheader(); writer.writerows(found)
    with (OUTPUT / "pendientes_modrinth.csv").open("w", encoding="utf-8", newline="") as fh:
        cols = ["file","sha256","motivo"]
        writer = csv.DictWriter(fh, fieldnames=cols); writer.writeheader(); writer.writerows(pending)
    print(f"\nResultados: {len(found)} coincidencias por API, {len(pending)} pendientes.")
    print("Archivos: informes/coincidencias_modrinth.csv e informes/pendientes_modrinth.csv")
    print("Las coincidencias requieren descarga + comparación de SHA-256 antes de publicar.")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as err:
        print("ERROR:", err)
        raise SystemExit(1)
