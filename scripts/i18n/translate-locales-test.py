#!/usr/bin/env python3

import importlib.util
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).with_name("translate-locales.py")
SPEC = importlib.util.spec_from_file_location("translate_locales", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load {SCRIPT_PATH}")
TRANSLATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TRANSLATOR)


class ReconcileCatalogTests(unittest.TestCase):
    def test_rebuild_adds_missing_removes_extra_and_uses_english_order(self):
        source = {"first": "New", "nested": {"before": "A", "after": "B"}}
        existing = {"extra": "remove", "nested": {"after": "Trad B", "before": "Trad A"}}

        rebuilt = TRANSLATOR.rebuild(
            source,
            existing,
            "root",
            {"root.first"},
            {"New": "Translated new"},
        )

        self.assertEqual(
            rebuilt,
            {
                "first": "Translated new",
                "nested": {"before": "Trad A", "after": "Trad B"},
            },
        )
        self.assertEqual(list(rebuilt), ["first", "nested"])
        self.assertEqual(list(rebuilt["nested"]), ["before", "after"])

    def test_validation_rejects_missing_extra_and_misordered_keys(self):
        english = {Path("shared.json"): {"first": "A", "second": "B"}}
        target = {Path("shared.json"): {"second": "B", "extra": "C"}}

        with self.assertRaisesRegex(RuntimeError, "keys or key order differ"):
            TRANSLATOR.validate_catalog(english, target, "fr")

    def test_validation_rejects_file_drift(self):
        english = {Path("shared.json"): {"title": "A"}}
        target = {Path("extra.json"): {"title": "A"}}

        with self.assertRaisesRegex(RuntimeError, "missing files"):
            TRANSLATOR.validate_catalog(english, target, "fr")

    def test_interpolation_variables_are_preserved(self):
        source = "Contact {company} at {email}"

        self.assertEqual(TRANSLATOR.unprotect(TRANSLATOR.protect(source)), source)


if __name__ == "__main__":
    unittest.main()
