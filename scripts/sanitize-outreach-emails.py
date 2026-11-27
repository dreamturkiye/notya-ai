#!/usr/bin/env python3
"""MX-first sanitizer for TR outreach mailboxes.

Published iletisim pages lie. Do not send until this script says PASS.

  python3 scripts/sanitize-outreach-emails.py addr1@x addr2@y
  python3 scripts/sanitize-outreach-emails.py --csv docs/growth/tr-dernek-targets.csv

Exit 1 if any FAIL. WARN (Pleksus, MX-to-self) does not fail the process —
those need a PCO/Gmail fallback before send, not a blind retry of the same box.
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Providers that already 550/554'd dernek mailboxes in Nov 2026.
RISKY_MX_NEEDLES = (
    "pleksus.com.tr",
)

PASS_MX_NEEDLES = (
    "google.com",
    "googlemail.com",
    "gmail-smtp-in.l.google.com",
    "mail.protection.outlook.com",
    "yandex.net",
    "zoho.",
    "hostinger.com",
    "pphosted.com",
)

DEAD_MAILBOXES = {
    "info@marmarapediatri.org",  # no MX
    "info@cocuknefroloji.org",  # no MX
    "info@cocuknefroloji.org.tr",  # Pleksus 554 relay denied
    "info@istanbulkbb.org",  # no MX, no A
    "dernek@tjodistanbul.org",  # 550 user unknown
    "tdd@turkdermatoloji.org.tr",  # 550 lookup failed
    "info@dogupediatri.org",  # MX timeout
}


@dataclass
class Verdict:
    email: str
    domain: str
    mx: str
    status: str  # PASS / WARN / FAIL
    reason: str


def _dig_mx(domain: str, timeout: float = 8.0) -> str:
    try:
        out = subprocess.check_output(
            ["dig", "+short", "MX", domain],
            timeout=timeout,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return ""
    lines = [ln.strip() for ln in out.splitlines() if ln.strip()]
    return " | ".join(lines[:4])


def classify(email: str, mx: str | None = None) -> Verdict:
    addr = email.strip().lower()
    if "@" not in addr or addr.startswith("@") or addr.endswith("@"):
        return Verdict(addr, "", "", "FAIL", "not an email")
    domain = addr.split("@", 1)[1]
    if addr in DEAD_MAILBOXES:
        records = mx if mx is not None else _dig_mx(domain)
        return Verdict(addr, domain, records or "(none)", "FAIL", "known-dead mailbox — do not send")
    records = mx if mx is not None else _dig_mx(domain)
    if not records:
        return Verdict(addr, domain, "(none)", "FAIL", "no MX — site iletisim is not a mailbox")
    low = records.lower()
    hosts = []
    for part in records.split("|"):
        tok = part.strip().split()
        if tok:
            hosts.append(tok[-1].rstrip(".").lower())
    if any(h == domain for h in hosts) and not any(n in low for n in PASS_MX_NEEDLES):
        return Verdict(addr, domain, records, "WARN", "MX points at the domain itself")
    if any(n in low for n in RISKY_MX_NEEDLES):
        return Verdict(addr, domain, records, "WARN", "Pleksus MX — already 550/554 on sibling dernek boxes")
    if any(n in low for n in PASS_MX_NEEDLES):
        return Verdict(addr, domain, records, "PASS", "known mail host")
    return Verdict(addr, domain, records, "PASS", "has MX")


def emails_from_csv(path: Path) -> list[str]:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        out = []
        for row in reader:
            raw = (row.get("email") or "").strip()
            if raw:
                out.append(raw)
        return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("emails", nargs="*")
    p.add_argument("--csv", type=Path)
    args = p.parse_args(argv)
    addrs: list[str] = list(args.emails)
    if args.csv:
        addrs.extend(emails_from_csv(args.csv if args.csv.is_absolute() else ROOT / args.csv))
    if not addrs:
        p.error("pass emails or --csv")
    seen: set[str] = set()
    uniq = []
    for a in addrs:
        key = a.strip().lower()
        if key and key not in seen:
            seen.add(key)
            uniq.append(a.strip())
    fails = 0
    print(f"{'status':6} {'email':42} {'reason':48} MX")
    for a in uniq:
        v = classify(a)
        if v.status == "FAIL":
            fails += 1
        mx_short = v.mx[:70]
        print(f"{v.status:6} {v.email:42} {v.reason:48} {mx_short}")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
