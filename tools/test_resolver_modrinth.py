#!/usr/bin/env python3
"""Pruebas unitarias offline del resolutor de hashes."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from resolver_modrinth import inspect_version, official_url

SHA = "a" * 64

class ResolverTests(unittest.TestCase):
    def test_url_official(self):
        self.assertTrue(official_url("https://cdn.modrinth.com/data/abc/versions/v/a.jar"))
        self.assertFalse(official_url("http://cdn.modrinth.com/x.jar"))
        self.assertFalse(official_url("https://cdn.modrinth.com.evil.example/x.jar"))
        self.assertFalse(official_url("https://evil.example/x.jar"))
        self.assertFalse(official_url("https://cdn.modrinth.com@evil.example/x.jar"))

    def test_exact_hash_required(self):
        version = {"project_id": "P", "id": "V", "files": [
            {"filename": "same-name.jar", "hashes": {"sha256": "b"*64},
             "url": "https://cdn.modrinth.com/data/P/versions/V/same-name.jar"}
        ]}
        with self.assertRaises(ValueError):
            inspect_version(version, SHA)

    def test_exact_hash_accepted(self):
        version = {"project_id": "P", "id": "V", "files": [
            {"filename": "verified.jar", "hashes": {"sha256": SHA},
             "url": "https://cdn.modrinth.com/data/P/versions/V/verified.jar"}
        ]}
        match = inspect_version(version, SHA)
        self.assertEqual(match["modrinth_version_id"], "V")
        self.assertIn("cdn.modrinth.com", match["url"])

    def test_hash_with_wrong_host_rejected(self):
        version = {"files": [
            {"filename": "verified.jar", "hashes": {"sha256": SHA},
             "url": "https://untrusted.example/verified.jar"}
        ]}
        with self.assertRaises(ValueError):
            inspect_version(version, SHA)

if __name__ == "__main__":
    unittest.main()
