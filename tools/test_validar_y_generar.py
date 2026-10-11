import contextlib
import csv
import io
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import validar_y_generar as validator


class PartialVerificationTests(unittest.TestCase):
    def test_verify_available_checks_only_present_urls(self):
        rows = [
            {"file": "uno.jar", "sha256": "a" * 64, "url": "https://cdn.modrinth.com/uno.jar"},
            {"file": "dos.jar", "sha256": "b" * 64, "url": ""},
            {"file": "tres.jar", "sha256": "c" * 64, "url": "https://cdn.modrinth.com/tres.jar"},
        ]
        with patch.object(validator, "verify_download") as verify:
            result = validator.verify_available(rows)

        self.assertEqual(result, (2, 1))
        self.assertEqual([call.args[0]["file"] for call in verify.call_args_list], ["uno.jar", "tres.jar"])

    def test_partial_mode_reports_pending_and_never_writes_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            inventory = root / "fuentes.csv"
            with inventory.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow(["file", "sha256", "url"])
                for index in range(46):
                    url = "https://cdn.modrinth.com/uno.jar" if index == 0 else ""
                    writer.writerow([f"mod-{index}.jar", f"{index:064x}", url])

            output = io.StringIO()
            with patch.object(validator, "ROOT", root), patch.object(validator, "INVENTORY", inventory), patch.object(
                validator, "verify_download"
            ), patch.object(sys, "argv", ["validar_y_generar.py", "--verify-available"]), contextlib.redirect_stdout(output):
                result = validator.main()

            self.assertEqual(result, 0)
            self.assertIn("Fuentes presentes verificadas: 1; URLs pendientes: 45", output.getvalue())
            self.assertIn("No se creó ni publicó ningún manifiesto.", output.getvalue())
            self.assertFalse((root / "manifest.VERIFICADO.json").exists())


if __name__ == "__main__":
    unittest.main()

