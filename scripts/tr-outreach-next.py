#!/usr/bin/env python3
"""
Propose the next TR WhatsApp lead that is NOT already contacted.

Source of truth for "already contacted":
  1) docs/growth/tr-outreach-ledger.csv  (gitti / zaten_gitti / wa_yok / gitmedi)
  2) docs/growth/TR-WHATSAPP-GONDERIM-PAKETI.md headings marked GİTTİ / ZATEN / WA YOK
  3) Early 2026-11-05 batch (hard seed — must never reappear as SIRADAKİ)

Usage:
  python3 scripts/tr-outreach-next.py
  python3 scripts/tr-outreach-next.py --mark-gitti "Uzm. Dr. …" --phone +905… [--note "…"]
  python3 scripts/tr-outreach-next.py --mark-wa-yok "…" --phone +905…
  python3 scripts/tr-outreach-next.py --mark-zaten "…" --phone +905…
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GROWTH = ROOT / "docs" / "growth"
LEDGER = GROWTH / "tr-outreach-ledger.csv"
CALL_READY = GROWTH / "tr-call-ready-leads.csv"
PAKET = GROWTH / "TR-WHATSAPP-GONDERIM-PAKETI.md"

# 2026-11-05 early WhatsApp batch (before named paket / Cengiz). Never re-propose.
EARLY_BATCH_NAMES = {
    "ismail ozdemir",
    "elif dilasa pala kose",
    "hatice gursoy",
    "aylin sema tirpanci",
    "dilek basaran",
    "sema suzen caypinar",
    "sinem tekin",
    "berrin arslan",
}
EARLY_BATCH_PHONES = {
    "5448358595",  # İsmail
    "5348489034",  # Hatice
    "5058498433",  # Aylin
    "5458150451",  # Dilek ORIGINAL
    "5305910620",  # Dilek later attempt
    "5162223828",  # Dilek bad listing
    "5397938221",  # Elif
    "5549042883",  # Elif bad listing
    "5451321419",  # Sema
    "5057900571",  # Sinem
}

CONTACTED_DURUM = {"gitti", "zaten_gitti", "wa_yok", "gitmedi"}


def digits(t: str) -> str:
    d = re.sub(r"\D", "", t or "")
    if d.startswith("90") and len(d) >= 12:
        d = d[2:]
    if d.startswith("0"):
        d = d[1:]
    return d


def e164(t: str) -> str:
    d = digits(t)
    return f"+90{d}" if d else ""


def norm_name(n: str) -> str:
    n = (n or "").lower().strip()
    tr = {
        "ı": "i",
        "İ": "i",
        "ş": "s",
        "ğ": "g",
        "ü": "u",
        "ö": "o",
        "ç": "c",
        "â": "a",
        "î": "i",
        "û": "u",
    }
    for a, b in tr.items():
        n = n.replace(a, b)
    n = re.sub(r"\s+", " ", n)
    n = re.sub(r"^\d+\.\s*", "", n)
    n = re.sub(r"^w\d+-\d+\.\s*", "", n)
    n = re.sub(
        r"^(doc\.?\s*dr\.?|prof\.?\s*dr\.?|op\.?\s*dr\.?|uzm\.?\s*dr\.?|"
        r"dr\.?\s*ogr\.?\s*uyesi|dr\.?)\s*",
        "",
        n,
    )
    n = re.sub(r"\s*\(.*\)$", "", n).strip()
    return n


def load_ledger() -> list[dict]:
    if not LEDGER.exists():
        return []
    return list(csv.DictReader(LEDGER.open()))


def save_ledger(rows: list[dict]) -> None:
    fields = [
        "isim",
        "isim_norm",
        "brans",
        "sehir",
        "ilce",
        "telefon",
        "durum",
        "tarih",
        "not",
        "kaynak",
        "url",
    ]
    with LEDGER.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})


def parse_paket_contacted() -> tuple[set[str], set[str]]:
    """Names + phones from paket headings marked already contacted (not SIRADAKİ)."""
    phones: set[str] = set()
    names: set[str] = set()
    if not PAKET.exists():
        return phones, names
    text = PAKET.read_text(encoding="utf-8")
    # ## [W3-6. ]Name ← STATUS — stop phone grab at next ## so we don't bleed
    for m in re.finditer(
        r"^##\s+(?:W\d+-\d+\.\s+)?([^\n←]+?)\s*←\s*"
        r"(GİTTİ|GITTI|ZATEN[^\n]*|WA YOK[^\n]*|GİTMEDİ[^\n]*)",
        text,
        re.M | re.I,
    ):
        raw = m.group(1).strip()
        names.add(norm_name(raw))
        rest = text[m.end() :]
        nxt = re.search(r"^##\s+", rest, re.M)
        chunk = rest[: nxt.start()] if nxt else rest[:400]
        # Only header meta lines (before first fenced ``` message body)
        fence = chunk.find("\n```")
        if fence != -1:
            chunk = chunk[:fence]
        for ph in re.findall(r"\+90[\d\s]+", chunk):
            d = digits(ph)
            if d:
                phones.add(d)
    return phones, names


def contacted_sets(rows: list[dict]) -> tuple[set[str], set[str]]:
    phones, names = set(EARLY_BATCH_PHONES), set(EARLY_BATCH_NAMES)
    for r in rows:
        if r.get("durum") in CONTACTED_DURUM:
            if r.get("telefon"):
                phones.add(digits(r["telefon"]))
            nn = r.get("isim_norm") or norm_name(r.get("isim", ""))
            if nn:
                names.add(nn)
    p_paket, n_paket = parse_paket_contacted()
    phones |= p_paket
    names |= n_paket
    return phones, names


def is_mobile(t: str) -> bool:
    d = digits(t)
    return len(d) == 10 and d.startswith("5") and not d.startswith(("850", "588"))


def name_blocked(nn: str, excl_n: set[str]) -> bool:
    if nn in excl_n:
        return True
    # Also block if any excluded full name equals this name, or is a
    # multi-token subset (catches "ali suha sonmez" vs "suha sonmez").
    tokens = nn.split()
    for blocked in excl_n:
        bt = blocked.split()
        if not bt:
            continue
        if nn == blocked:
            return True
        if len(bt) >= 2 and len(tokens) >= 2:
            # last two tokens match (surname + final given) OR blocked tokens ⊆ candidate
            if tokens[-2:] == bt[-2:]:
                return True
            if set(bt).issubset(set(tokens)) and len(bt) >= 2:
                return True
    return False


def propose(n: int = 5) -> list[dict]:
    ledger = load_ledger()
    excl_p, excl_n = contacted_sets(ledger)
    cr = list(csv.DictReader(CALL_READY.open()))
    counts = Counter(digits(r.get("telefon")) for r in cr)
    bad = {p for p, c in counts.items() if c >= 3} | excl_p | {"5885648727"}
    cands = []
    for r in cr:
        od = (r.get("outreach_durum") or r.get("durum") or "").lower()
        if od in CONTACTED_DURUM:
            continue
        if not is_mobile(r.get("telefon", "")):
            continue
        tel = digits(r["telefon"])
        if tel in bad:
            continue
        nn = norm_name(r.get("isim", ""))
        if name_blocked(nn, excl_n):
            continue
        if (r.get("ozel_muayenehane") or "").lower() not in {"evet", "yes", "true"}:
            continue
        cands.append(r)
    cands.sort(
        key=lambda r: (
            -int(float(r.get("skor") or 0)),
            0 if (r.get("sehir") or "").lower() in {"istanbul", "ankara", "izmir"} else 1,
            r.get("brans") or "",
            r.get("isim") or "",
        )
    )
    out, seen = [], set()
    for r in cands:
        tel = digits(r["telefon"])
        if tel in seen:
            continue
        seen.add(tel)
        out.append(r)
        if len(out) >= n:
            break
    return out


def mark(isim: str, phone: str, durum: str, note: str = "", brans: str = "", url: str = "") -> None:
    rows = load_ledger()
    tel = e164(phone)
    nn = norm_name(isim)
    found = False
    for r in rows:
        if (tel and digits(r.get("telefon")) == digits(tel)) or norm_name(r.get("isim", "")) == nn:
            r["durum"] = durum
            r["tarih"] = date.today().isoformat()
            r["not"] = note or r.get("not", "")
            r["isim"] = isim or r.get("isim")
            r["telefon"] = tel or r.get("telefon")
            r["isim_norm"] = nn
            if brans:
                r["brans"] = brans
            if url:
                r["url"] = url
            r["kaynak"] = r.get("kaynak") or "cli"
            found = True
            break
    if not found:
        rows.append(
            {
                "isim": isim,
                "isim_norm": nn,
                "brans": brans,
                "sehir": "",
                "ilce": "",
                "telefon": tel,
                "durum": durum,
                "tarih": date.today().isoformat(),
                "not": note,
                "kaynak": "cli",
                "url": url,
            }
        )
    save_ledger(rows)
    print(f"ledger: {isim} {tel} → {durum}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mark-gitti", metavar="ISIM")
    ap.add_argument("--mark-wa-yok", metavar="ISIM")
    ap.add_argument("--mark-zaten", metavar="ISIM")
    ap.add_argument("--phone", default="")
    ap.add_argument("--note", default="")
    ap.add_argument("--brans", default="")
    ap.add_argument("-n", type=int, default=5)
    args = ap.parse_args()

    if args.mark_gitti:
        mark(args.mark_gitti, args.phone, "gitti", args.note, args.brans)
    elif args.mark_wa_yok:
        mark(args.mark_wa_yok, args.phone, "wa_yok", args.note, args.brans)
    elif args.mark_zaten:
        mark(args.mark_zaten, args.phone, "zaten_gitti", args.note, args.brans)

    nxt = propose(args.n)
    if not nxt:
        print("No safe next lead (ledger covers available unique mobiles).", file=sys.stderr)
        sys.exit(1)
    print("\nSAFE NEXT (not in ledger / paket GİTTİ / early 2026-11-05 batch):")
    for i, r in enumerate(nxt, 1):
        print(f"{i}. {r['isim']} · {r['brans']} · {r.get('sehir')} · {r['telefon']}")


if __name__ == "__main__":
    main()
