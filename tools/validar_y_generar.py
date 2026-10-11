#!/usr/bin/env python3
"""Champagne Vol.5: comprueba inventario y, solo con 46 URLs correctas, prepara el manifiesto.

  python tools/validar_y_generar.py --check
  python tools/validar_y_generar.py --verify-downloads --version 0.1.0

Este programa no sube archivos JAR ni publica un release. Requiere autorización
independiente para los dominios adicionales que se añadan en el futuro.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "inventario" / "fuentes_46.csv"
ALLOWED_DOWNLOAD_HOSTS = {"cdn.modrinth.com"}
LIMIT_BYTES = 200 * 1024 * 1024

def read_entries():
    with INVENTORY.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != ["file", "sha256", "url"]:
            raise ValueError("Cabeceras esperadas: file,sha256,url")
        rows = list(reader)
    if len(rows) != 46:
        raise ValueError(f"Se necesitan exactamente 46 mods; hay {len(rows)}")
    known = set()
    for item in rows:
        name, hash_value, url = (item[key].strip() for key in ("file", "sha256", "url"))
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.+() -]*\.jar", name):
            raise ValueError(f"Nombre de JAR inválido: {name!r}")
        if name.lower() in known:
            raise ValueError(f"Nombre duplicado: {name}")
        known.add(name.lower())
        if not re.fullmatch(r"[0-9a-fA-F]{64}", hash_value):
            raise ValueError(f"SHA-256 inválido: {name}")
        if url:
            check_url(url)
        item["file"], item["sha256"], item["url"] = name, hash_value.lower(), url
    return rows

def check_url(url):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_DOWNLOAD_HOSTS:
        raise ValueError(f"Origen no aprobado: {url}")
    if parsed.username or parsed.password or parsed.fragment:
        raise ValueError(f"URL inválida: {url}")

def verify_download(item):
    req = Request(item["url"], headers={"User-Agent": "ChampagneVol5-DistributionAudit/0.1"})
    with urlopen(req, timeout=45) as response:
        check_url(response.geturl())
        if response.status != 200:
            raise ValueError(f"HTTP {response.status}: {item['file']}")
        hasher = hashlib.sha256()
        size = 0
        while True:
            data = response.read(1024 * 1024)
            if not data:
                break
            size += len(data)
            if size > LIMIT_BYTES:
                raise ValueError(f"JAR demasiado grande: {item['file']}")
            hasher.update(data)
    if hasher.hexdigest() != item["sha256"]:
        raise ValueError(f"Hash distinto del JAR original: {item['file']}")

def verify_available(entries):
    """Verifica las fuentes presentes sin generar un manifiesto parcial."""
    available = [item for item in entries if item["url"]]
    pending = len(entries) - len(available)
    for index, item in enumerate(available, start=1):
        verify_download(item)
        print(f"Verificado {index}/{len(available)}: {item['file']}")
    return len(available), pending

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Comprobar la estructura sin acceder a internet")
    parser.add_argument("--verify-downloads", action="store_true", help="Descargar/verificar y preparar el manifiesto")
    parser.add_argument("--verify-available", action="store_true", help="Verificar solo las URLs presentes; nunca crea un manifiesto")
    parser.add_argument("--version", default="0.1.0")
    args = parser.parse_args()
    if args.verify_available and args.verify_downloads:
        parser.error("--verify-available y --verify-downloads son modos excluyentes")
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?", args.version):
        parser.error("Versión inválida")
    entries = read_entries()
    pending = [item["file"] for item in entries if not item["url"]]
    print(f"Inventario válido: 46 mods; URLs presentes: {46 - len(pending)}; pendientes: {len(pending)}")
    if pending:
        print("Faltan URLs oficiales verificadas:")
        for name in pending:
            print(" -", name)
    if not args.verify_downloads:
        if args.verify_available:
            verified, missing = verify_available(entries)
            print(f"Fuentes presentes verificadas: {verified}; URLs pendientes: {missing}")
            print("No se creó ni publicó ningún manifiesto.")
            return 0
        print("No se creó ni publicó ningún manifiesto.")
        return 0
    if pending:
        print("BLOQUEADO: no se puede crear un manifiesto incompleto.", file=sys.stderr)
        return 2
    validated = []
    for index, item in enumerate(entries, start=1):
        verify_download(item)
        validated.append({"path": f"mods/{item['file']}", "url": item["url"], "sha256": item["sha256"]})
        print(f"Verificado {index}/46: {item['file']}")
    output = {
        "packId": "champagne-vol5", "version": args.version,
        "expectedFiles": 46, "files": validated, "delete": []
    }
    outfile = ROOT / "manifest.VERIFICADO.json"
    outfile.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Manifiesto validado creado en", outfile)
    print("Revisar permisos y probar en una instancia nueva antes de publicar.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError) as error:
        print("ERROR:", error, file=sys.stderr)
        sys.exit(1)

