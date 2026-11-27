#!/usr/bin/env python3
"""Offline classification tests for scripts/sanitize-outreach-emails.py"""

from __future__ import annotations

import unittest

from importlib.machinery import SourceFileLoader
from pathlib import Path

MOD = SourceFileLoader(
    "sanitize_outreach_emails",
    str(Path(__file__).with_name("sanitize-outreach-emails.py")),
).load_module()


class ClassifyTests(unittest.TestCase):
    def test_no_mx_fails(self):
        v = MOD.classify("info@marmarapediatri.org", mx="")
        self.assertEqual(v.status, "FAIL")
        self.assertIn("known-dead", v.reason)

    def test_published_no_mx_generic(self):
        v = MOD.classify("board@example-dernek.org", mx="")
        self.assertEqual(v.status, "FAIL")
        self.assertIn("no MX", v.reason)

    def test_pleksus_warns(self):
        v = MOD.classify("cnd@cnd.org.tr", mx="10 mx2.pleksus.com.tr.")
        self.assertEqual(v.status, "WARN")
        self.assertIn("Pleksus", v.reason)

    def test_outlook_pass(self):
        v = MOD.classify(
            "marmarapediatri@bosphorusmice.net",
            mx="10 bosphorusmice-net.mail.protection.outlook.com.",
        )
        self.assertEqual(v.status, "PASS")

    def test_google_pass(self):
        v = MOD.classify("info@millipediatri.org", mx="1 aspmx.l.google.com.")
        self.assertEqual(v.status, "PASS")

    def test_yandex_pass(self):
        v = MOD.classify("tkbbd@kbb.org.tr", mx="10 mx.yandex.net.")
        self.assertEqual(v.status, "PASS")

    def test_known_dead_even_with_mx(self):
        v = MOD.classify("tdd@turkdermatoloji.org.tr", mx="10 mx2.pleksus.com.tr.")
        self.assertEqual(v.status, "FAIL")
        self.assertIn("known-dead", v.reason)

    def test_mx_to_self_warns(self):
        v = MOD.classify("info@tjov.org.tr", mx="0 tjov.org.tr.")
        self.assertEqual(v.status, "WARN")

    def test_junk_fails(self):
        v = MOD.classify("not-an-email", mx="")
        self.assertEqual(v.status, "FAIL")


if __name__ == "__main__":
    unittest.main()
