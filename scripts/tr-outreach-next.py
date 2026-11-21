#!/usr/bin/env python3
"""
Propose the next TR WhatsApp lead that is NOT already contacted.

Source of truth for "already contacted":
  1) docs/growth/tr-outreach-ledger.csv  (gitti / zaten_gitti / wa_yok / gitmedi)
  2) docs/growth/TR-WHATSAPP-GONDERIM-PAKETI.md headings marked GİTTİ / ZATEN / WA YOK
  3) Early 2026-11-05 batch (hard seed — must never reappear as SIRADAKİ)

Anti-ban pacing (docs/growth/TR-WHATSAPP-ANTI-BAN.md):
  - Prefer WA-verified pool (tr-whatsapp-wa-pool.csv)
  - Enforce min gap / daily / hourly caps via tr-wa-send-log.csv + tr-wa-pace-state.json
  - Emit a structural message variant (not name-only swap)

Usage:
  python3 scripts/tr-outreach-next.py
  python3 scripts/tr-outreach-next.py --check-pace
  python3 scripts/tr-outreach-next.py --with-message
  python3 scripts/tr-outreach-next.py --mark-gitti "Uzm. Dr. …" --phone +905… [--note "…"] [--variant-id kd-A-1234]
  python3 scripts/tr-outreach-next.py --mark-wa-yok "…" --phone +905…
  python3 scripts/tr-outreach-next.py --mark-zaten "…" --phone +905…
  python3 scripts/tr-outreach-next.py --force-pace   # override pace gate (emergency only)
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
GROWTH = ROOT / "docs" / "growth"
LEDGER = GROWTH / "tr-outreach-ledger.csv"
CALL_READY = GROWTH / "tr-call-ready-leads.csv"
WA_POOL = GROWTH / "tr-whatsapp-wa-pool.csv"
PAKET = GROWTH / "TR-WHATSAPP-GONDERIM-PAKETI.md"
SEND_LOG = GROWTH / "tr-wa-send-log.csv"
PACE_STATE = GROWTH / "tr-wa-pace-state.json"

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

DEFAULT_PACE = {
    "restriction_ended_at": None,
    "soft_restart_hours": 48,
    "min_gap_minutes": 10,
    "soft_min_gap_minutes": 12,
    "max_per_day": 22,
    "soft_max_per_day": 16,
    "max_per_hour": 5,
    "quiet_hours_start": 9,
    "quiet_hours_start_minute": 30,
    "quiet_hours_end": 19,
    "tz": "Europe/Istanbul",
}


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


def load_pace() -> dict:
    cfg = dict(DEFAULT_PACE)
    if PACE_STATE.exists():
        try:
            cfg.update(json.loads(PACE_STATE.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            pass
    return cfg


def load_send_log() -> list[dict]:
    if not SEND_LOG.exists():
        return []
    return list(csv.DictReader(SEND_LOG.open()))


def append_send_log(
    *,
    name: str,
    phone: str,
    city: str = "",
    specialty: str = "",
    variant_id: str = "",
    notes: str = "",
) -> None:
    fields = ["sent_at_iso", "name", "phone", "city", "specialty", "variant_id", "notes"]
    rows = load_send_log()
    now = datetime.now(timezone.utc).isoformat()
    rows.append(
        {
            "sent_at_iso": now,
            "name": name,
            "phone": e164(phone) or phone,
            "city": city,
            "specialty": specialty,
            "variant_id": variant_id,
            "notes": notes,
        }
    )
    with SEND_LOG.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})


def parse_iso(s: str) -> datetime | None:
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def pace_status(now: datetime | None = None) -> dict:
    """Return pacing decision for the next cold send."""
    cfg = load_pace()
    tz = ZoneInfo(cfg.get("tz") or "Europe/Istanbul")
    now = now or datetime.now(tz)
    if now.tzinfo is None:
        now = now.replace(tzinfo=tz)
    else:
        now = now.astimezone(tz)

    soft = False
    soft_until = None
    ended = parse_iso(cfg.get("restriction_ended_at") or "")
    if ended:
        soft_until = ended.astimezone(tz) + timedelta(hours=int(cfg.get("soft_restart_hours") or 48))
        soft = now < soft_until

    min_gap = int(cfg["soft_min_gap_minutes"] if soft else cfg["min_gap_minutes"])
    max_day = int(cfg["soft_max_per_day"] if soft else cfg["max_per_day"])
    max_hour = int(cfg["max_per_hour"])

    q_h = int(cfg.get("quiet_hours_start") or 9)
    q_m = int(cfg.get("quiet_hours_start_minute") or 0)
    q_end = int(cfg.get("quiet_hours_end") or 19)
    in_quiet = (now.hour, now.minute) < (q_h, q_m) or now.hour >= q_end

    sends = []
    for r in load_send_log():
        dt = parse_iso(r.get("sent_at_iso") or "")
        if dt:
            sends.append(dt.astimezone(tz))
    sends.sort()

    last = sends[-1] if sends else None
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    hour_ago = now - timedelta(hours=1)
    day_count = sum(1 for s in sends if s >= day_start)
    hour_count = sum(1 for s in sends if s >= hour_ago)

    blockers: list[str] = []
    wait_seconds = 0

    if in_quiet:
        if now.hour >= q_end:
            nxt = (day_start + timedelta(days=1)).replace(hour=q_h, minute=q_m)
        else:
            nxt = day_start.replace(hour=q_h, minute=q_m)
        wait_seconds = max(wait_seconds, int((nxt - now).total_seconds()))
        blockers.append(
            f"quiet hours (allowed {q_h:02d}:{q_m:02d}–{q_end:02d}:00 Europe/Istanbul)"
        )

    if last:
        earliest = last + timedelta(minutes=min_gap)
        if now < earliest:
            wait_seconds = max(wait_seconds, int((earliest - now).total_seconds()))
            blockers.append(f"min gap {min_gap} min since last send ({last.isoformat()})")

    if day_count >= max_day:
        nxt = day_start + timedelta(days=1)
        nxt = nxt.replace(hour=q_h, minute=q_m)
        wait_seconds = max(wait_seconds, int((nxt - now).total_seconds()))
        blockers.append(f"daily cap {day_count}/{max_day}" + (" (soft restart)" if soft else ""))

    if hour_count >= max_hour:
        # wait until oldest in-hour send ages out
        in_hour = [s for s in sends if s >= hour_ago]
        if in_hour:
            release = in_hour[0] + timedelta(hours=1)
            wait_seconds = max(wait_seconds, int((release - now).total_seconds()))
        blockers.append(f"hourly cap {hour_count}/{max_hour}")

    ok = not blockers
    return {
        "ok": ok,
        "soft_restart": soft,
        "soft_until": soft_until.isoformat() if soft_until else None,
        "min_gap_minutes": min_gap,
        "max_per_day": max_day,
        "max_per_hour": max_hour,
        "day_count": day_count,
        "hour_count": hour_count,
        "last_send": last.isoformat() if last else None,
        "wait_seconds": wait_seconds,
        "wait_human": _fmt_wait(wait_seconds),
        "blockers": blockers,
        "now_local": now.isoformat(),
    }


def _fmt_wait(sec: int) -> str:
    if sec <= 0:
        return "0m"
    m, s = divmod(sec, 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}h {m}m"
    return f"{m}m {s}s"


def parse_paket_contacted() -> tuple[set[str], set[str]]:
    """Names + phones from paket headings marked already contacted (not SIRADAKİ)."""
    phones: set[str] = set()
    names: set[str] = set()
    if not PAKET.exists():
        return phones, names
    text = PAKET.read_text(encoding="utf-8")
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
    tokens = nn.split()
    for blocked in excl_n:
        bt = blocked.split()
        if not bt:
            continue
        if nn == blocked:
            return True
        if len(bt) >= 2 and len(tokens) >= 2:
            if tokens[-2:] == bt[-2:]:
                return True
            if set(bt).issubset(set(tokens)) and len(bt) >= 2:
                return True
    return False


def last_sent_first_name() -> str:
    """First given-name token of the most recent cold send (for back-to-back skip)."""
    sends = load_send_log()
    if not sends:
        return ""
    # last non-empty row
    for r in reversed(sends):
        nm = (r.get("name") or "").strip()
        if not nm:
            continue
        nn = norm_name(nm)
        return nn.split()[0] if nn else ""
    return ""


def propose_from_wa_pool(n: int = 5) -> list[dict]:
    """WA-verified Doktorsitesi leads first (anti false-positive bare 5xx)."""
    if not WA_POOL.exists():
        return []
    ledger = load_ledger()
    excl_p, excl_n = contacted_sets(ledger)
    skip_first = last_sent_first_name()
    rows = list(csv.DictReader(WA_POOL.open()))
    out, seen = [], set()
    deferred: list[dict] = []
    for r in rows:
        if not is_mobile(r.get("telefon", "")):
            continue
        tel = digits(r["telefon"])
        if tel in excl_p or tel in seen:
            continue
        nn = norm_name(r.get("isim", ""))
        if name_blocked(nn, excl_n):
            continue
        # Prefer whatsapp_social enrichment
        src = (r.get("kaynak_enrich") or "").lower()
        if src and "whatsapp" not in src and "wa" not in src:
            continue
        cand = {
            "isim": r.get("isim") or "",
            "brans": r.get("brans") or "",
            "sehir": r.get("sehir") or "",
            "ilce": r.get("ilce") or "",
            "telefon": e164(r.get("telefon") or ""),
            "url": r.get("url") or "",
            "skor": r.get("skor") or "0",
            "kaynak": "wa_pool",
            "ozel_muayenehane": "evet",
        }
        # Don't stack same first name right after the last send (Fatma/Fatma, Gülşah/Gülşah)
        if skip_first and nn.split() and nn.split()[0] == skip_first:
            deferred.append(cand)
            continue
        seen.add(tel)
        out.append(cand)
        if len(out) >= n:
            break
    if len(out) < n:
        for cand in deferred:
            tel = digits(cand["telefon"])
            if tel in seen:
                continue
            seen.add(tel)
            out.append(cand)
            if len(out) >= n:
                break
    return out


def propose(n: int = 5) -> list[dict]:
    wa = propose_from_wa_pool(n)
    if len(wa) >= n:
        return wa
    ledger = load_ledger()
    excl_p, excl_n = contacted_sets(ledger)
    # already have wa phones
    have = {digits(r["telefon"]) for r in wa}
    if not CALL_READY.exists():
        return wa
    cr = list(csv.DictReader(CALL_READY.open()))
    counts = Counter(digits(r.get("telefon")) for r in cr)
    bad = {p for p, c in counts.items() if c >= 3} | excl_p | {"5885648727"} | have
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
    out = list(wa)
    seen = set(have)
    for r in cands:
        tel = digits(r["telefon"])
        if tel in seen:
            continue
        seen.add(tel)
        out.append(r)
        if len(out) >= n:
            break
    return out


def build_variant(name: str, specialty: str, phone: str) -> tuple[str, str]:
    import importlib.util

    path = ROOT / "scripts" / "tr-wa-message-variant.py"
    spec = importlib.util.spec_from_file_location("tr_wa_message_variant", path)
    assert spec and spec.loader
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m.build_message(name=name, specialty=specialty, phone=phone)


def mark(
    isim: str,
    phone: str,
    durum: str,
    note: str = "",
    brans: str = "",
    url: str = "",
    variant_id: str = "",
    city: str = "",
) -> None:
    """Upsert by phone when provided. Same name + different phone → new row (eski numara)."""
    rows = load_ledger()
    tel = e164(phone)
    nn = norm_name(isim)
    found = False
    for r in rows:
        if tel and digits(r.get("telefon") or "") == digits(tel):
            r["durum"] = durum
            r["tarih"] = date.today().isoformat()
            r["not"] = note or r.get("not", "")
            r["isim"] = isim or r.get("isim")
            r["telefon"] = tel
            r["isim_norm"] = nn
            if brans:
                r["brans"] = brans
            if url:
                r["url"] = url
            r["kaynak"] = r.get("kaynak") or "cli"
            found = True
            break
    if not found and not tel:
        for r in rows:
            if norm_name(r.get("isim", "")) == nn:
                r["durum"] = durum
                r["tarih"] = date.today().isoformat()
                r["not"] = note or r.get("not", "")
                r["isim"] = isim or r.get("isim")
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
                "sehir": city,
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
    if durum == "gitti":
        append_send_log(
            name=isim,
            phone=tel,
            city=city,
            specialty=brans,
            variant_id=variant_id,
            notes=note or "gitti",
        )
        print(f"send-log: appended {tel}")


def print_pace(st: dict) -> None:
    mode = "SOFT RESTART" if st["soft_restart"] else "normal"
    print(f"\nPACE [{mode}] now={st['now_local']}")
    print(
        f"  caps: gap≥{st['min_gap_minutes']}m · {st['max_per_hour']}/h · {st['max_per_day']}/day"
    )
    print(
        f"  used: {st['hour_count']}/h · {st['day_count']}/day · last={st['last_send'] or 'none'}"
    )
    if st["soft_until"]:
        print(f"  soft until: {st['soft_until']}")
    if st["ok"]:
        print("  status: OK to send")
    else:
        print(f"  status: WAIT {st['wait_human']}")
        for b in st["blockers"]:
            print(f"    - {b}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mark-gitti", metavar="ISIM")
    ap.add_argument("--mark-wa-yok", metavar="ISIM")
    ap.add_argument("--mark-zaten", metavar="ISIM")
    ap.add_argument("--phone", default="")
    ap.add_argument("--note", default="")
    ap.add_argument("--brans", default="")
    ap.add_argument("--city", default="")
    ap.add_argument("--variant-id", default="")
    ap.add_argument("-n", type=int, default=5)
    ap.add_argument("--check-pace", action="store_true")
    ap.add_argument("--with-message", action="store_true")
    ap.add_argument(
        "--force-pace",
        action="store_true",
        help="Propose even if pace gate blocks (do not use casually)",
    )
    args = ap.parse_args()

    if args.check_pace:
        st = pace_status()
        print_pace(st)
        sys.exit(0 if st["ok"] else 2)

    if args.mark_gitti:
        # Still allow marking even if pace was violated (user already sent)
        mark(
            args.mark_gitti,
            args.phone,
            "gitti",
            args.note,
            args.brans,
            variant_id=args.variant_id,
            city=args.city,
        )
    elif args.mark_wa_yok:
        mark(args.mark_wa_yok, args.phone, "wa_yok", args.note, args.brans, city=args.city)
    elif args.mark_zaten:
        mark(args.mark_zaten, args.phone, "zaten_gitti", args.note, args.brans, city=args.city)

    # Recompute after mark-gitti so the send-log gap is visible immediately
    st = pace_status()
    print_pace(st)

    if not st["ok"] and not args.force_pace:
        print(
            "\nBLOCKED: anti-ban pace gate. Do not send the next doctor yet.\n"
            f"Wait {st['wait_human']}, then re-run with --with-message.\n"
            "(See docs/growth/TR-WHATSAPP-ANTI-BAN.md) Override only with --force-pace.",
            file=sys.stderr,
        )
        # Still show who is queued so the operator can prepare copy offline
        nxt = propose(args.n)
        if nxt:
            print("\nQUEUED (send only after wait):")
            for i, r in enumerate(nxt, 1):
                src = r.get("kaynak") or ""
                print(
                    f"{i}. {r['isim']} · {r['brans']} · {r.get('sehir')} · {r['telefon']}"
                    + (f" · [{src}]" if src else "")
                )
            if args.with_message:
                top = nxt[0]
                body, vid = build_variant(
                    top["isim"], top.get("brans") or "", top.get("telefon") or ""
                )
                print(f"\n--- PREP MESSAGE variant_id={vid} (do not send until pace OK) ---")
                print(body)
                print("--- END ---")
        sys.exit(3)

    nxt = propose(args.n)
    if not nxt:
        print("No safe next lead (ledger covers available unique mobiles).", file=sys.stderr)
        sys.exit(1)
    print("\nSAFE NEXT (WA-pool preferred; not in ledger / paket GİTTİ / early batch):")
    for i, r in enumerate(nxt, 1):
        src = r.get("kaynak") or ""
        print(
            f"{i}. {r['isim']} · {r['brans']} · {r.get('sehir')} · {r['telefon']}"
            + (f" · [{src}]" if src else "")
        )

    if args.with_message and nxt:
        top = nxt[0]
        body, vid = build_variant(top["isim"], top.get("brans") or "", top.get("telefon") or "")
        print(f"\n--- MESSAGE variant_id={vid} ---")
        print(body)
        print("--- END ---")
        print(
            "\nSEND RULES: save contact first · dismiss OG card · wait full pace gap · "
            "never reuse this body for another doctor."
        )


if __name__ == "__main__":
    main()
