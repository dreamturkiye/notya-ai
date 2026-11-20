#!/usr/bin/env python3
"""Gift-first TR WhatsApp outreach batch generator.

Replaces the long pitch (0 replies / ~120 doctors). First message is a free
specialty card offer only — no links, no price, no time-saving / FOMO pressure.

Targets: pediatri, kadın doğum (KD), dermatoloji.
Everyone else → hold list. Already-messaged (eski pitch) → excluded.

Outputs (docs/growth/):
  tr-wa-gift-batch.csv
  tr-wa-gift-batch.html
  tr-wa-gift-hold.csv
  whatsapp-hazir-yanitlar.md  (also written on --init-docs)

Usage:
  python3 scripts/tr-wa-gift-first.py                 # build next batch (max 40)
  python3 scripts/tr-wa-gift-first.py --apply-followups
  python3 scripts/tr-wa-gift-first.py --mark-eski
  python3 scripts/tr-wa-gift-first.py --limit 40
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
GROWTH = ROOT / "docs" / "growth"

LEDGER = GROWTH / "tr-outreach-ledger.csv"
WA_POOL = GROWTH / "tr-whatsapp-wa-pool.csv"
SEND_LOG = GROWTH / "tr-wa-send-log.csv"
PAKET = GROWTH / "TR-WHATSAPP-GONDERIM-PAKETI.md"
CALL_READY = GROWTH / "tr-call-ready-leads.csv"

OUT_CSV = GROWTH / "tr-wa-gift-batch.csv"
OUT_HTML = GROWTH / "tr-wa-gift-batch.html"
OUT_HOLD = GROWTH / "tr-wa-gift-hold.csv"
OUT_ESKI = GROWTH / "tr-wa-eski-mesaj.csv"
OUT_SUMMARY = GROWTH / "tr-wa-gift-batch.ozet.json"
QUICK_REPLIES = GROWTH / "whatsapp-hazir-yanitlar.md"
DURUM_MD = GROWTH / "TR-OUTREACH-DURUM.md"

TARGET_BRANS = {"pediatri", "kadin-dogum", "dermatoloji"}
MAX_BATCH = 40

# Contacted statuses from the old pitch era.
ESKI_DURUM = {"gitti", "zaten_gitti", "eski_mesaj_gonderildi"}
SKIP_DURUM = ESKI_DURUM | {"wa_yok", "gitmedi", "ilgilenmiyor", "reddetti"}
# wa_yok also lives on gift-batch rows (no WhatsApp number).
OUT_RED = GROWTH / "tr-wa-reddetti.csv"

KART = {
    "pediatri": {
        "kart": "Pediatri Pratik Kartı",
        "icerik": "aşı takvimi ve telafi ilkeleri, prematüre izlemi, düzeltilmiş yaş",
        "okunus": "Çocuk",
        "pdf": "https://notya-growth.vercel.app/pratik-kart/pediatri-pratik-karti-2026.pdf",
    },
    "kadin-dogum": {
        "kart": "Gebelik Takip Kartı",
        "icerik": "TDT hesabı, izlem ve tarama takvimi, gebelikte aşılar",
        "okunus": "Kadın doğum",
        "pdf": "https://notya-growth.vercel.app/pratik-kart/kd-gebelik-takip-karti-2026.pdf",
    },
    "dermatoloji": {
        "kart": "Sistemik Tedavi İzlem Kartı",
        "icerik": "izotretinoin, metotreksat, siklosporin ve biyolojik öncesi tarama",
        "okunus": "Dermatoloji",
        "pdf": "https://notya-growth.vercel.app/pratik-kart/dermatoloji-sistemik-tedavi-izlem-karti-2026.pdf",
    },
}

# Demo slot placeholders (Türkiye saati) — mirror docs/growth/whatsapp-hazir-yanitlar.md
SECENEK1 = "Perşembe 20:00"
SECENEK2 = "Cuma 13:00"

BRANS_SUFFIX = {
    "pediatri": "ped",
    "kadin-dogum": "kd",
    "dermatoloji": "derm",
}

VALID_DURUM = {
    "hazir",
    "teklif_edildi",
    "kart_gonderildi",
    "demo_teklif",
    "demo",
    "deneme",
    "ilgilenmiyor",
    "reddetti",
    "wa_yok",
}

CSV_COLUMNS = [
    "ad",
    "soyad",
    "brans",
    "sehir",
    "telefon",
    "varyant",
    "mesaj_1",
    "wa_link",
    "durum",
    "gonderim_tarihi",
    "yanit",
    "notlar",
    "siradaki_adim",
    "red_tarihi",
]

TITLE_RE = re.compile(
    r"^(do[cç]\.?\s*dr\.?|prof\.?\s*dr\.?|op\.?\s*dr\.?|uzm\.?\s*dr\.?|"
    r"dr\.?\s*[oö][gğ]r\.?\s*[uü]yesi|"
    r"[oö][gğ]r\.?\s*[uü]yesi|"
    r"doktor\.?|dr\.?)\s*",
    re.I,
)


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


def norm_name(name: str) -> str:
    n = (name or "").lower()
    for a, b in (
        ("ı", "i"),
        ("İ", "i"),
        ("ş", "s"),
        ("ğ", "g"),
        ("ü", "u"),
        ("ö", "o"),
        ("ç", "c"),
        ("â", "a"),
        ("û", "u"),
        ("î", "i"),
    ):
        n = n.replace(a, b)
    n = re.sub(r"[^a-z0-9\s]", " ", n)
    return re.sub(r"\s+", " ", n).strip()


def normalize_brans(raw: str) -> str | None:
    s = (raw or "").strip().lower()
    if s in ("kd", "kadin-dogum", "kadın-doğum", "kadin dogum", "kadın doğum"):
        return "kadin-dogum"
    if s in ("derm", "dermatoloji", "derma"):
        return "dermatoloji"
    if s in ("pedi", "pediatri", "çocuk", "cocuk"):
        return "pediatri"
    if "kadın" in s or "kadin" in s or "doğum" in s or "dogum" in s:
        return "kadin-dogum"
    if "derma" in s:
        return "dermatoloji"
    if "pedia" in s or "çocuk" in s or "cocuk" in s:
        return "pediatri"
    return None


def strip_titles(name: str) -> str:
    n = (name or "").strip()
    n = TITLE_RE.sub("", n)
    n = re.sub(r"^[oö][gğ]r\.?\s*[uü]yesi\s*", "", n, flags=re.I)
    # Doktorsitesi duplicate slug suffixes: "Sahin 2", "Kutuk 1"
    n = re.sub(r"\s+\d+$", "", n)
    return re.sub(r"\s+", " ", n).strip()


def split_ad_soyad(full: str) -> tuple[str, str]:
    clean = strip_titles(full)
    parts = [p for p in clean.split() if not p.isdigit()]
    if not parts:
        return "", ""
    ad = parts[0]
    # Turkish-friendly capitalisation: first letter upper, rest lower.
    ad = ad[:1].upper() + ad[1:].lower() if ad else ""
    soyad = " ".join(parts[1:]) if len(parts) > 1 else ""
    soyad = re.sub(r"\s+\d+$", "", soyad).strip()
    return ad, soyad


def capitalize_given(ad: str) -> str:
    if not ad:
        return ad
    # Prefer proper Turkish title-case for first name only.
    low = ad.lower()
    # Map ascii-folded leading i → İ when original had İ/i ambiguity is hard;
    # use simple: first char upper.
    return low[:1].upper() + low[1:]


# Live group demo — 25 Kasım 2026 (flyer). Registration link for WA outreach.
SEMINAR_LINK = (
    "https://cal.com/han-mamur-sugmbo/canli-grup-demosu"
    "?utm_source=instagram&utm_content=webinar"
)
SEMINAR_TARIH = "25 Kasım Çarşamba"
SEMINAR_SAAT = "20:00 Türkiye saati"

# Branş-specific Notya capabilities shown in the seminar invite (bullets).
SEMINAR_OZELLIK = {
    "pediatri": {
        "baslik": "Pediatri'de Notya",
        "maddeler": (
            "Muayeneyi dinler, notu siz konuşurken yazar",
            "Aşısı geciken çocukta telafi tarihlerini hesaplar",
            "Aileye aşı / kontrol hatırlatması gönderir",
            "Prematüre ve düzeltilmiş yaş izlemini takip eder",
        ),
    },
    "kadin-dogum": {
        "baslik": "Kadın doğumda Notya",
        "maddeler": (
            "Muayeneyi dinler, notu siz konuşurken yazar",
            "Her gebe için haftayı, sıradaki izlem ve taramayı takip eder",
            "Hatırlatmayı hastaya / sekretere gönderir",
            "TDT hesabı ve gebelikte aşı takvimini yanında tutar",
        ),
    },
    "dermatoloji": {
        "baslik": "Dermatoloji'de Notya",
        "maddeler": (
            "Muayeneyi dinler, notu siz konuşurken yazar",
            "İzotretinoin / metotreksat / siklosporin / biyolojik tahlil-kontrolünü takip eder",
            "Hatırlatmayı hastaya gönderir",
            "Sistemik tedavi öncesi tarama checklist'ini yanında tutar",
        ),
    },
}


def _brans_bullets(brans: str) -> str:
    oz = SEMINAR_OZELLIK.get(brans) or SEMINAR_OZELLIK["pediatri"]
    lines = [f"{oz['baslik']}:"]
    for m in oz["maddeler"]:
        lines.append(f"• {m}")
    return "\n".join(lines)


def mesaj_1(ad: str, brans: str, varyant: str) -> str:
    """First-touch: branş-detaylı canlı grup demo daveti (25 Kasım) — must-attend ton."""
    given = capitalize_given(ad)
    br = brans if brans in SEMINAR_OZELLIK else "pediatri"
    bullets = _brans_bullets(br)
    if varyant == "A":
        return (
            f"{given} Hocam merhaba, ben Kaan — Dr. Gökhan Mamur'un ekibinden.\n\n"
            f"Bu oturumu kaçırmayın: {SEMINAR_TARIH} · {SEMINAR_SAAT}. "
            f"Notya'yı Dr. Gökhan Mamur ile canlı göreceksiniz.\n\n"
            f"Katılan hekim günde 2 saate kadar kazanıyor; hastasına verdiği hizmet "
            f"bir gömlek yükseliyor ve klinik yeni bir sınıfa çıkıyor. "
            f"Katılmayan, notu elle yazmaya ve takibi tek başına taşımaya devam ediyor.\n\n"
            f"Notya en son teknoloji üründür — Türk doktorları tarafından "
            f"Türk hekimleri için hazırlanmıştır.\n\n"
            f"{bullets}\n\n"
            f"📅 {SEMINAR_TARIH}\n"
            f"🕐 {SEMINAR_SAAT}\n"
            f"📍 Online Google Meet · ücretsiz · soru-cevap var\n"
            f"🩺 Sunum: Dr. Gökhan Mamur\n\n"
            f"Kontenjan sınırlı. Yerinizi ayırmak için sadece \"kayıt\" yazın — "
            f"linki hemen gönderirim."
        )
    return (
        f"{given} Hocam merhaba 🙂\n"
        f"Kaan — Dr. Gökhan Mamur'un ekibinden.\n\n"
        f"{SEMINAR_TARIH} saat {SEMINAR_SAAT} — ücretsiz canlı grup demosu. "
        f"Burada olmayan hekim, muayene notu ve hasta takibinde geride kalır; "
        f"katılanlar günde 2 saate kadar kazanır ve hasta hizmetini yeni bir sınıfa taşır.\n\n"
        f"Notya, Türk doktorları tarafından Türk hekimleri için üretilmiş "
        f"en son teknoloji asistanıdır.\n\n"
        f"{bullets}\n\n"
        f"📅 {SEMINAR_TARIH} · {SEMINAR_SAAT}\n"
        f"📍 Online Google Meet · Dr. Gökhan Mamur\n\n"
        f"Kaçırmayın — yeriniz için \"kayıt\" yazmanız yeterli, linki hemen iletirim."
    )


def wa_link(telefon: str, message: str) -> str:
    d = digits(telefon)
    if not d:
        return ""
    return f"https://wa.me/90{d}?text={quote(message)}"


def forbidden_in_first_message(text: str) -> list[str]:
    """Hard guard: no price / one-page leftovers / no URL preview junk.

    First-touch must NOT include http(s) links — WhatsApp pulls cal.com
    OG image/logo and the preview looks bad. Send link only via /kayit.
    Seminar FOMO + günde 2 saat claim are intentional (25 Kasım webinar).
    """
    hits: list[str] = []
    low = text.lower()
    for bad in (
        "ücretli",
        "fiyat",
        "tl/",
        "tek sayfa",
        "teksayfa",
        "cal.com",
    ):
        if bad in low:
            hits.append(bad)
    for m in re.finditer(r"https?://\S+", text):
        hits.append("url:" + m.group(0).lower()[:40])
    return hits


def load_eski_phones_and_names() -> tuple[set[str], set[str], list[dict]]:
    phones: set[str] = set()
    names: set[str] = set()
    rows: list[dict] = []

    if LEDGER.exists():
        with LEDGER.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if (r.get("durum") or "") in SKIP_DURUM | ESKI_DURUM | {
                    "gitti",
                    "zaten_gitti",
                    "wa_yok",
                    "gitmedi",
                }:
                    ph = digits(r.get("telefon") or "")
                    nm = norm_name(r.get("isim_norm") or r.get("isim") or "")
                    if ph:
                        phones.add(ph)
                    if nm:
                        names.add(nm)
                    rows.append(
                        {
                            "isim": r.get("isim") or "",
                            "telefon": e164(r.get("telefon") or ""),
                            "brans": r.get("brans") or "",
                            "durum_eski": r.get("durum") or "",
                            "kaynak": "ledger",
                        }
                    )

    if SEND_LOG.exists():
        with SEND_LOG.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                ph = digits(r.get("phone") or "")
                nm = norm_name(r.get("name") or "")
                if ph:
                    phones.add(ph)
                if nm:
                    names.add(nm)
                rows.append(
                    {
                        "isim": r.get("name") or "",
                        "telefon": e164(r.get("phone") or ""),
                        "brans": r.get("specialty") or "",
                        "durum_eski": "send_log",
                        "kaynak": "send_log",
                    }
                )

    if PAKET.exists():
        text = PAKET.read_text(encoding="utf-8")
        for m in re.finditer(r"\+90(\d{10})", text):
            phones.add(m.group(1))

    # Early seed batch phones (old pitch) — never re-message.
    for ph in (
        "5448358595",
        "5348489034",
        "5058498433",
        "5458150451",
        "5305910620",
        "5162223828",
        "5397938221",
        "5549042883",
        "5451321419",
        "5057900571",
    ):
        phones.add(ph)

    return phones, names, rows


def mark_eski_in_ledger() -> int:
    """Rewrite ledger: gitti / zaten_gitti → eski_mesaj_gonderildi."""
    if not LEDGER.exists():
        return 0
    with LEDGER.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else [
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
    changed = 0
    today = date.today().isoformat()
    for r in rows:
        if r.get("durum") in ("gitti", "zaten_gitti"):
            old = r["durum"]
            r["durum"] = "eski_mesaj_gonderildi"
            note = (r.get("not") or "").strip()
            tag = f"eski_pitch→eski_mesaj_gonderildi ({today}, was {old})"
            r["not"] = f"{note}; {tag}".strip("; ")
            changed += 1
    with LEDGER.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    return changed


def write_eski_csv(rows: list[dict], phones: set[str]) -> None:
    # Deduplicate by phone.
    seen: set[str] = set()
    out: list[dict] = []
    for r in rows:
        ph = digits(r.get("telefon") or "")
        if not ph or ph in seen:
            continue
        seen.add(ph)
        out.append(
            {
                "isim": r.get("isim") or "",
                "telefon": e164(ph),
                "brans": r.get("brans") or "",
                "durum": "eski_mesaj_gonderildi",
                "kaynak": r.get("kaynak") or "",
            }
        )
    # phones-only leftovers
    for ph in sorted(phones - seen):
        out.append(
            {
                "isim": "",
                "telefon": e164(ph),
                "brans": "",
                "durum": "eski_mesaj_gonderildi",
                "kaynak": "phone_only",
            }
        )
    with OUT_ESKI.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f, fieldnames=["isim", "telefon", "brans", "durum", "kaynak"]
        )
        w.writeheader()
        w.writerows(out)


def iter_pool_rows() -> list[dict]:
    rows: list[dict] = []
    if not WA_POOL.exists():
        return rows
    with WA_POOL.open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows.append(r)
    # Prefer higher skor first.
    rows.sort(key=lambda r: int(float(r.get("skor") or 0)), reverse=True)
    return rows


def load_reddetti_exclusions() -> tuple[set[str], set[str], list[dict]]:
    """Phones + names that said no — never message again (any list)."""
    phones: set[str] = set()
    names: set[str] = set()
    rows: list[dict] = []

    def add(isim: str, telefon: str, brans: str = "", yanit: str = "", red_tarihi: str = "", kaynak: str = "") -> None:
        ph = digits(telefon)
        nm = norm_name(isim)
        if ph:
            phones.add(ph)
        if nm:
            names.add(nm)
            # also first+last tokens alone help match ASCII-folded pool rows
            for tok in nm.split():
                if len(tok) >= 4:
                    names.add(tok)
        rows.append(
            {
                "isim": isim,
                "telefon": e164(telefon) if telefon else "",
                "brans": brans,
                "yanit": yanit,
                "red_tarihi": red_tarihi,
                "kaynak": kaynak,
            }
        )

    if OUT_CSV.exists():
        with OUT_CSV.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if (r.get("durum") or "") == "reddetti":
                    full = f"{r.get('ad') or ''} {r.get('soyad') or ''}".strip()
                    add(
                        full,
                        r.get("telefon") or "",
                        r.get("brans") or "",
                        r.get("yanit") or "",
                        r.get("red_tarihi") or "",
                        "gift-batch",
                    )

    if LEDGER.exists():
        with LEDGER.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if (r.get("durum") or "") == "reddetti":
                    add(
                        r.get("isim") or r.get("isim_norm") or "",
                        r.get("telefon") or "",
                        r.get("brans") or "",
                        r.get("not") or "",
                        r.get("tarih") or "",
                        "ledger",
                    )

    if OUT_RED.exists():
        with OUT_RED.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                add(
                    r.get("isim") or "",
                    r.get("telefon") or "",
                    r.get("brans") or "",
                    r.get("yanit") or "",
                    r.get("red_tarihi") or "",
                    "red-csv",
                )

    return phones, names, rows


def sync_reddetti_csv() -> int:
    """Rewrite tr-wa-reddetti.csv from batch + ledger (dedupe by phone)."""
    _phones, _names, rows = load_reddetti_exclusions()
    seen: set[str] = set()
    out: list[dict] = []
    for r in rows:
        ph = digits(r.get("telefon") or "")
        key = ph or norm_name(r.get("isim") or "")
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "isim": r.get("isim") or "",
                "telefon": e164(ph) if ph else "",
                "brans": r.get("brans") or "",
                "yanit": r.get("yanit") or "",
                "red_tarihi": r.get("red_tarihi") or "",
                "durum": "reddetti",
            }
        )
    with OUT_RED.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["isim", "telefon", "brans", "yanit", "red_tarihi", "durum"],
        )
        w.writeheader()
        w.writerows(out)
    return len(out)


def build_candidates(
    eski_phones: set[str],
    eski_names: set[str],
    red_phones: set[str] | None = None,
    red_names: set[str] | None = None,
) -> tuple[list[dict], list[dict], dict]:
    """Return (eligible target rows, hold rows, stats)."""
    eligible: list[dict] = []
    hold: list[dict] = []
    stats = Counter()
    seen_phones: set[str] = set()
    red_phones = red_phones or set()
    red_names = red_names or set()

    for r in iter_pool_rows():
        ph = digits(r.get("telefon") or "")
        nm = norm_name(r.get("isim") or "")
        br = normalize_brans(r.get("brans") or "")
        stats["pool_total"] += 1

        if not ph or len(ph) != 10:
            stats["bad_phone"] += 1
            continue
        if ph in seen_phones:
            stats["dup_phone"] += 1
            continue
        seen_phones.add(ph)

        # Declined: match phone OR any name token (same doctor on another list).
        if ph in red_phones or nm in red_names or any(
            tok in red_names for tok in nm.split() if len(tok) >= 4
        ):
            stats["excluded_reddetti"] += 1
            continue

        if ph in eski_phones or nm in eski_names:
            stats["excluded_eski"] += 1
            continue

        if br is None or br not in TARGET_BRANS:
            hold.append(
                {
                    "isim": r.get("isim") or "",
                    "brans": r.get("brans") or "",
                    "sehir": (r.get("sehir") or "").title(),
                    "telefon": e164(ph),
                    "url": r.get("url") or "",
                    "durum": "hold",
                    "notlar": "branş free-kart kapsamı dışında",
                }
            )
            stats["hold"] += 1
            continue

        ad, soyad = split_ad_soyad(r.get("isim") or "")
        eligible.append(
            {
                "ad": ad,
                "soyad": soyad,
                "brans": br,
                "sehir": (r.get("sehir") or "").title(),
                "telefon": e164(ph),
                "isim_full": r.get("isim") or "",
                "url": r.get("url") or "",
            }
        )
        stats[f"eligible_{br}"] += 1

    return eligible, hold, dict(stats)


def allocate_batch(eligible: list[dict], limit: int) -> list[dict]:
    """Up to `limit` rows; balance branşlar; alternate A/B within each branş."""
    by_brans: dict[str, list[dict]] = defaultdict(list)
    for r in eligible:
        by_brans[r["brans"]].append(r)

    order = ["pediatri", "kadin-dogum", "dermatoloji"]
    # Round-robin pick so each branş gets roughly equal share.
    pointers = {b: 0 for b in order}
    variant_i = {b: 0 for b in order}
    batch: list[dict] = []

    while len(batch) < limit:
        progressed = False
        for b in order:
            if len(batch) >= limit:
                break
            idx = pointers[b]
            pool = by_brans.get(b) or []
            if idx >= len(pool):
                continue
            src = pool[idx]
            pointers[b] = idx + 1
            varyant = "A" if variant_i[b] % 2 == 0 else "B"
            variant_i[b] += 1
            msg = mesaj_1(src["ad"], b, varyant)
            bad = forbidden_in_first_message(msg)
            if bad:
                raise RuntimeError(f"forbidden tokens in mesaj_1: {bad}")
            row = {
                "ad": src["ad"],
                "soyad": src["soyad"],
                "brans": b,
                "sehir": src["sehir"],
                "telefon": src["telefon"],
                "varyant": varyant,
                "mesaj_1": msg,
                "wa_link": wa_link(src["telefon"], msg),
                "durum": "hazir",
                "gonderim_tarihi": "",
                "yanit": "",
                "notlar": "",
                "siradaki_adim": "",
                "red_tarihi": "",
            }
            row["siradaki_adim"] = compute_siradaki_adim(row)
            batch.append(row)
            progressed = True
        if not progressed:
            break
    return batch


def parse_iso_date(raw: str) -> date | None:
    s = (raw or "").strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def brans_qr_suffix(brans: str) -> str:
    return BRANS_SUFFIX.get(brans, "ped")


def compute_siradaki_adim(row: dict, today: date | None = None) -> str:
    """What to send next, from durum + dates + notlar flags."""
    today = today or date.today()
    durum = (row.get("durum") or "").strip()
    yanit = (row.get("yanit") or "").strip()
    notlar = (row.get("notlar") or "").strip()
    sent = parse_iso_date(row.get("gonderim_tarihi") or "")
    age = (today - sent).days if sent else None
    suf = brans_qr_suffix(row.get("brans") or "")

    if durum == "reddetti":
        return "YOK — takip etme"
    if durum == "wa_yok":
        return "YOK — WA yok"
    if durum == "hazir":
        return "mesaj_1 gönder (seminar daveti)"
    if durum == "teklif_edildi":
        if "red_sonrasi_yanit" in notlar:
            return "Yanıtla — kendisi yazdı"
        return "bekle — evet gelince /evet-" + suf
    if durum == "kart_gonderildi":
        if yanit and any(
            k in yanit.lower()
            for k in ("cevap", "hesap", "takip", "yanit", "yanıt", "nasıl")
        ):
            return f"STEP 2 gönder → /demo-{suf}"
        if age is not None and age >= 2:
            return f"STEP 2 gönder → /demo-{suf} (2g sessiz)"
        return f"bekle (STEP 1 soru) · 2g sonra /demo-{suf}"
    if durum == "demo_teklif":
        if "takip_gonderildi" in notlar:
            return "bekle — sonra ilgilenmiyor"
        if age is not None and age >= 5:
            return "STEP 3 gönder → /takip (bir kez)"
        return "bekle — /saat · /deneme · /onay · 5g → /takip"
    if durum == "demo":
        return "bekle (Gökhan toplantı linki)"
    if durum == "deneme":
        return "bekle (ücretsiz deneme)"
    if durum == "ilgilenmiyor":
        return "yazma"
    return "bekle"


def refresh_siradaki(rows: list[dict], today: date | None = None) -> None:
    for r in rows:
        r["siradaki_adim"] = compute_siradaki_adim(r, today)


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def write_html(path: Path, rows: list[dict]) -> None:
    counts = Counter((r.get("durum") or "") for r in rows)
    counter_html = (
        f'<div class="counts">'
        f'<span>teklif edildi <b>{counts.get("teklif_edildi", 0)}</b></span>'
        f'<span>kart gönderildi <b>{counts.get("kart_gonderildi", 0)}</b></span>'
        f'<span>demo <b>{counts.get("demo", 0) + counts.get("demo_teklif", 0)}</b></span>'
        f'<span>deneme <b>{counts.get("deneme", 0)}</b></span>'
        f'<span class="red">reddetti <b>{counts.get("reddetti", 0)}</b></span>'
        f'<span>cevapsız <b>{counts.get("ilgilenmiyor", 0)}</b></span>'
        f'<span>hazır <b>{counts.get("hazir", 0)}</b></span>'
        f"</div>"
    )
    cards = []
    for i, r in enumerate(rows):
        key = digits(r["telefon"])
        adim = r.get("siradaki_adim") or compute_siradaki_adim(r)
        durum = r.get("durum") or ""
        cls = "card"
        if durum == "reddetti":
            cls += " reddetti"
        elif durum in ("ilgilenmiyor", "demo", "deneme"):
            cls += " done"
        next_cls = "next red" if durum == "reddetti" else "next"
        red_line = ""
        if durum == "reddetti":
            red_line = (
                f'<div class="muted">Red: {html.escape(r.get("red_tarihi") or "")} · '
                f'“{html.escape(r.get("yanit") or "")}”</div>'
            )
        cards.append(
            f"""
<article class="{cls}" data-phone="{html.escape(key)}" data-i="{i}" data-durum="{html.escape(durum)}">
  <label class="check">
    <input type="checkbox" class="sent" data-phone="{html.escape(key)}" />
    <span>İşaretle</span>
  </label>
  <div class="meta">
    <strong>{html.escape(r['ad'])} {html.escape(r['soyad'])}</strong>
    <span class="pill">{html.escape(r['brans'])}</span>
    <span class="pill">{html.escape(r['varyant'])}</span>
    <span class="pill durum">{html.escape(durum)}</span>
    <span class="muted">{html.escape(r['sehir'])} · {html.escape(r['telefon'])}</span>
  </div>
  <div class="{next_cls}"><span class="label">Sıradaki adım</span> {html.escape(adim)}</div>
  {red_line}
  <pre class="msg">{html.escape(r['mesaj_1'])}</pre>
  {"<span class='wa muted'>WhatsApp kapalı — reddetti</span>" if durum == "reddetti" else f'<a class="wa" href="{html.escape(r["wa_link"])}" target="_blank" rel="noopener">WhatsApp\'ta aç (mesaj_1)</a>'}
</article>"""
        )

    doc = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Notya — Gift-first WA batch</title>
<style>
  :root {{
    --bg: #f6f3ee;
    --ink: #1c1917;
    --muted: #78716c;
    --card: #ffffff;
    --wa: #128c7e;
    --wa2: #25d366;
    --line: #e7e5e4;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
    background: var(--bg); color: var(--ink);
    padding: 16px; line-height: 1.4;
  }}
  h1 {{ font-size: 1.25rem; margin: 0 0 4px; }}
  .sub {{ color: var(--muted); margin-bottom: 16px; font-size: .95rem; }}
  .toolbar {{
    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
    position: sticky; top: 0; background: var(--bg); padding: 8px 0; z-index: 2;
  }}
  .toolbar button {{
    border: 1px solid var(--line); background: #fff; border-radius: 10px;
    padding: 10px 14px; font-weight: 600;
  }}
  .card {{
    background: var(--card); border: 1px solid var(--line);
    border-radius: 16px; padding: 14px; margin-bottom: 12px;
  }}
  .card.done {{ opacity: .45; }}
  .check {{ display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 8px; }}
  .check input {{ width: 22px; height: 22px; }}
  .meta {{ display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: baseline; margin-bottom: 8px; }}
  .pill {{
    background: #ecfdf5; color: #065f46; border-radius: 999px;
    padding: 2px 10px; font-size: .8rem; font-weight: 600;
  }}
  .pill.durum {{ background: #eff6ff; color: #1d4ed8; }}
  .counts {{
    display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px;
  }}
  .counts span {{
    background: #fff; border: 1px solid var(--line); border-radius: 999px;
    padding: 6px 12px; font-size: .85rem;
  }}
  .counts span.red, .counts span.red b {{ color: #b91c1c; }}
  .next {{
    background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;
    border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; font-weight: 600;
  }}
  .next.red {{
    background: #fef2f2; border-color: #fecaca; color: #b91c1c;
  }}
  .next .label {{ display: block; font-size: .75rem; color: #c2410c; font-weight: 700; letter-spacing: .02em; }}
  .next.red .label {{ color: #991b1b; }}
  .card.reddetti {{ opacity: .55; filter: grayscale(.35); background: #fafafa; }}
  .muted {{ color: var(--muted); font-size: .9rem; }}
  .msg {{
    white-space: pre-wrap; background: #fafaf9; border: 1px solid var(--line);
    border-radius: 12px; padding: 12px; font-size: .95rem; margin: 0 0 12px;
  }}
  .wa {{
    display: block; text-align: center; text-decoration: none; color: #fff;
    background: linear-gradient(135deg, var(--wa), var(--wa2));
    font-weight: 700; font-size: 1.05rem; padding: 16px; border-radius: 14px;
  }}
  #progress {{ font-weight: 700; }}
</style>
</head>
<body>
  <h1>Gift-first WhatsApp batch</h1>
  <p class="sub">4 adım: kart → merak → demo/deneme · Demo slotları: {html.escape(SECENEK1)} / {html.escape(SECENEK2)} · hazır yanıtlar: whatsapp-hazir-yanitlar.md · red → /tesekkur</p>
  {counter_html}
  <div class="toolbar">
    <span id="progress"></span>
    <button type="button" id="hide-sent">Gönderilenleri gizle</button>
    <button type="button" id="show-all">Tümünü göster</button>
    <button type="button" id="reset">İşaretleri sıfırla</button>
  </div>
  <div id="list">
    {''.join(cards)}
  </div>
<script>
const KEY = 'notya-wa-gift-sent-v1';
function load() {{
  try {{ return JSON.parse(localStorage.getItem(KEY) || '{{}}'); }}
  catch {{ return {{}}; }}
}}
function save(map) {{ localStorage.setItem(KEY, JSON.stringify(map)); }}
function refresh() {{
  const map = load();
  let done = 0, total = 0;
  document.querySelectorAll('.card').forEach(card => {{
    const ph = card.dataset.phone;
    const box = card.querySelector('.sent');
    total += 1;
    const is = !!map[ph];
    box.checked = is;
    card.classList.toggle('done', is);
    if (is) done += 1;
  }});
  document.getElementById('progress').textContent = done + ' / ' + total + ' gönderildi';
}}
document.getElementById('list').addEventListener('change', (e) => {{
  const t = e.target;
  if (!t.classList.contains('sent')) return;
  const map = load();
  if (t.checked) map[t.dataset.phone] = new Date().toISOString();
  else delete map[t.dataset.phone];
  save(map);
  refresh();
}});
document.getElementById('hide-sent').onclick = () => {{
  document.querySelectorAll('.card.done').forEach(c => c.style.display = 'none');
}};
document.getElementById('show-all').onclick = () => {{
  document.querySelectorAll('.card').forEach(c => c.style.display = '');
}};
document.getElementById('reset').onclick = () => {{
  if (confirm('Tüm gönderildi işaretleri silinsin mi?')) {{
    localStorage.removeItem(KEY);
    refresh();
    document.querySelectorAll('.card').forEach(c => c.style.display = '');
  }}
}};
refresh();
</script>
</body>
</html>
"""
    path.write_text(doc, encoding="utf-8")


def write_quick_replies() -> None:
    """Keep docs/growth/whatsapp-hazir-yanitlar.md as the source of truth.

    This helper only guards against accidental old /evet|/demo stubs.
    Full text lives in the markdown file (edited by hand / this PR).
    """
    if not QUICK_REPLIES.exists():
        raise FileNotFoundError(
            f"Missing {QUICK_REPLIES} — restore from git before generating."
        )
    text = QUICK_REPLIES.read_text(encoding="utf-8")
    # Block legacy stubs from creeping back.
    if re.search(r"^## /evet\s*$", text, re.M) and "/evet-ped" not in text:
        raise RuntimeError("legacy /evet found without /evet-ped — refuse to proceed")
    if "Harika Hocam. Size uygun saati buradan seçebilirsiniz: https://www.notya.io/demo — Dr. Gökhan Mamur bizzat gösterecek." in text:
        raise RuntimeError("legacy /demo one-liner still present — refuse to proceed")


def apply_followups(path: Path = OUT_CSV) -> dict:
    """Flag next steps from dates; after /takip once → ilgilenmiyor.

    Rules:
      kart_gonderildi + ≥2g + no reply → siradaki_adim suggests /demo-*
      kart_gonderildi|demo_teklif + ≥5g + no reply + no takip_gonderildi → /takip
      after takip_gonderildi flagged and still silent → ilgilenmiyor
      teklif_edildi + ≥5g + no reply → ilgilenmiyor
    """
    if not path.exists():
        return {"error": "no batch"}
    with path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    today = date.today()
    stats = Counter()
    for r in rows:
        # migrate old column sets
        if "siradaki_adim" not in r:
            r["siradaki_adim"] = ""
        durum = (r.get("durum") or "").strip()
        yanit = (r.get("yanit") or "").strip()
        notlar = (r.get("notlar") or "").strip()
        if durum == "reddetti":
            r["siradaki_adim"] = "YOK — takip etme"
            stats["reddetti_skip"] += 1
            continue
        sent = parse_iso_date(r.get("gonderim_tarihi") or "")
        if not sent:
            r["siradaki_adim"] = compute_siradaki_adim(r, today)
            continue
        age = (today - sent).days

        if (
            durum == "teklif_edildi"
            and not yanit
            and age >= 5
            and "red_sonrasi_yanit" not in notlar
        ):
            r["durum"] = "ilgilenmiyor"
            r["notlar"] = (notlar + " | auto_ilgilenmiyor_5g_teklif").strip(" |")
            stats["ilgilenmiyor_teklif"] += 1
            notlar = r["notlar"]

        if durum == "kart_gonderildi" and not yanit and age >= 2:
            if "step2_due" not in notlar:
                r["notlar"] = (notlar + " | step2_due").strip(" |")
                stats["step2_due"] += 1
                notlar = r["notlar"]

        if durum in ("kart_gonderildi", "demo_teklif") and not yanit and age >= 5:
            if "takip_gonderildi" in notlar:
                r["durum"] = "ilgilenmiyor"
                r["notlar"] = (notlar + " | auto_ilgilenmiyor_after_takip").strip(" |")
                stats["ilgilenmiyor_after_takip"] += 1
            elif "takip_due" not in notlar:
                r["notlar"] = (notlar + " | takip_due").strip(" |")
                stats["takip_due"] += 1

        r["siradaki_adim"] = compute_siradaki_adim(r, today)
    write_csv(path, rows, CSV_COLUMNS)
    write_html(OUT_HTML, rows)
    return dict(stats)


def mark_red_reply(*, phone: str, yanit: str) -> dict:
    """Doctor wrote back after /tesekkur → reopen as manual reply, not auto-follow-up."""
    if not OUT_CSV.exists():
        return {"error": "no batch"}
    ph = digits(phone)
    yanit = (yanit or "").strip()
    if not ph or not yanit:
        return {"error": "phone and yanit required"}
    with OUT_CSV.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    hit = None
    for r in rows:
        for col in CSV_COLUMNS:
            r.setdefault(col, "")
        if digits(r.get("telefon") or "") != ph:
            continue
        r["durum"] = "teklif_edildi"
        r["yanit"] = yanit
        note = (r.get("notlar") or "").strip()
        if "red_sonrasi_yanit" not in note:
            r["notlar"] = (note + " | red_sonrasi_yanit").strip(" |")
        # Keep red_tarihi for history; leave exclusion until sync (no longer reddetti).
        r["siradaki_adim"] = compute_siradaki_adim(r)
        hit = r
        break
    if not hit:
        return {"error": f"phone not in batch: {e164(ph)}"}
    write_csv(OUT_CSV, rows, CSV_COLUMNS)
    write_html(OUT_HTML, rows)
    sync_reddetti_csv()
    # ledger
    if LEDGER.exists():
        with LEDGER.open(encoding="utf-8") as f:
            ledger = list(csv.DictReader(f))
            fields = list(ledger[0].keys()) if ledger else []
        for row in ledger:
            if digits(row.get("telefon") or "") == ph:
                row["durum"] = "teklif_edildi"
                row["not"] = (
                    (row.get("not") or "").strip()
                    + f"; red_sonrasi_yanit: {yanit}"
                ).strip("; ")
        if fields:
            with LEDGER.open("w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=fields)
                w.writeheader()
                w.writerows(ledger)
    return {
        "ok": True,
        "ad": hit.get("ad"),
        "soyad": hit.get("soyad"),
        "telefon": hit.get("telefon"),
        "durum": hit.get("durum"),
        "siradaki_adim": hit.get("siradaki_adim"),
        "yanit": hit.get("yanit"),
    }


def refresh_batch_status(path: Path = OUT_CSV) -> dict:
    """Recompute siradaki_adim for existing batch without reshuffling doctors."""
    if not path.exists():
        return {"error": "no batch"}
    with path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        for col in CSV_COLUMNS:
            r.setdefault(col, "")
        # drop legacy notlar flags that no longer apply
        if "takip_gunu" in (r.get("notlar") or ""):
            r["notlar"] = (
                (r.get("notlar") or "")
                .replace("takip_gunu", "takip_due")
                .replace("||", "|")
                .strip(" |")
            )
    refresh_siradaki(rows)
    write_csv(path, rows, CSV_COLUMNS)
    write_html(OUT_HTML, rows)
    return {
        "rows": len(rows),
        "by_durum": dict(Counter(r.get("durum") for r in rows)),
        "by_siradaki": dict(Counter(r.get("siradaki_adim") for r in rows)),
    }


def rewrite_hazir_messages(path: Path = OUT_CSV) -> dict:
    """Regenerate mesaj_1 + wa_link for durum=hazir only (keep sent rows intact)."""
    if not path.exists():
        return {"error": "no batch"}
    with path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    rewritten = 0
    for r in rows:
        for col in CSV_COLUMNS:
            r.setdefault(col, "")
        if (r.get("durum") or "").strip() != "hazir":
            continue
        msg = mesaj_1(r.get("ad") or "", r.get("brans") or "", r.get("varyant") or "A")
        bad = forbidden_in_first_message(msg)
        if bad:
            raise RuntimeError(f"forbidden tokens in mesaj_1 ({r.get('ad')}): {bad}")
        r["mesaj_1"] = msg
        r["wa_link"] = wa_link(r.get("telefon") or "", msg)
        note = (r.get("notlar") or "").strip()
        if "seminar_25kasim" not in note:
            r["notlar"] = (note + "|seminar_25kasim").strip("|")
        rewritten += 1
    refresh_siradaki(rows)
    write_csv(path, rows, CSV_COLUMNS)
    write_html(OUT_HTML, rows)
    write_durum(
        rows,
        {
            "excluded_eski": 0,
            "hold": 0,
        },
    )
    next_row = next((r for r in rows if r.get("durum") == "hazir"), None)
    return {
        "rewritten": rewritten,
        "rows": len(rows),
        "by_durum": dict(Counter(r.get("durum") for r in rows)),
        "next": (
            {
                "ad": next_row["ad"],
                "soyad": next_row["soyad"],
                "brans": next_row["brans"],
                "sehir": next_row["sehir"],
                "telefon": next_row["telefon"],
                "varyant": next_row["varyant"],
                "mesaj_1": next_row["mesaj_1"],
            }
            if next_row
            else None
        ),
    }


def write_durum(batch: list[dict], summary: dict) -> None:
    # Prefer first hazir row as "Sıradaki"; else first row.
    first = next((r for r in batch if r.get("durum") == "hazir"), None) or (
        batch[0] if batch else None
    )
    action = next(
        (
            r
            for r in batch
            if "gönder" in (r.get("siradaki_adim") or "")
            and r.get("durum") not in ("hazir", "ilgilenmiyor", "reddetti")
        ),
        None,
    )
    red_n = sum(1 for r in batch if r.get("durum") == "reddetti")
    lines = [
        "# TR outreach durum (canlı) — gift-first (4 adım)",
        "",
        f"**Demo slotları (placeholder):** {SECENEK1} · {SECENEK2}",
        f"**Batch:** {len(batch)} satır · CSV `{OUT_CSV.name}` · HTML `{OUT_HTML.name}`",
        f"**Eski pitch hariç:** {summary.get('excluded_eski', 0)} · **Reddetti:** {red_n} · **Hold:** {summary.get('hold', 0)}",
        "",
    ]
    if first:
        lines += [
            f"**Sıradaki (mesaj_1):** {first['ad']} {first['soyad']} · {first['brans']} · {first['sehir']} · {first['telefon']} · {first['varyant']}",
            f"  → {first.get('siradaki_adim')}",
            "",
        ]
    if action:
        lines += [
            f"**Aksiyon bekleyen:** {action['ad']} {action['soyad']} · {action.get('durum')} · {action.get('siradaki_adim')}",
            "",
        ]
    lines += [
        "Hazır yanıtlar: `docs/growth/whatsapp-hazir-yanitlar.md`",
        "",
    ]
    DURUM_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, default=MAX_BATCH)
    ap.add_argument("--mark-eski", action="store_true", help="ledger gitti→eski_mesaj_gonderildi")
    ap.add_argument("--apply-followups", action="store_true")
    ap.add_argument(
        "--refresh-status",
        action="store_true",
        help="recompute siradaki_adim on existing batch (no reshuffle)",
    )
    ap.add_argument(
        "--rewrite-hazir",
        action="store_true",
        help="regenerate mesaj_1/wa_link for hazir rows only (keep teklif/red intact)",
    )
    ap.add_argument("--init-docs-only", action="store_true")
    ap.add_argument(
        "--mark-red-reply",
        action="store_true",
        help="doctor wrote back after reddetti → teklif_edildi + Yanıtla — kendisi yazdı",
    )
    ap.add_argument("--phone", default="")
    ap.add_argument("--yanit", default="")
    args = ap.parse_args()

    write_quick_replies()
    if args.init_docs_only:
        print(f"ok {QUICK_REPLIES}")
        return 0

    if args.mark_red_reply:
        print(json.dumps(mark_red_reply(phone=args.phone, yanit=args.yanit), ensure_ascii=False, indent=2))
        return 0

    if args.refresh_status:
        stats = refresh_batch_status()
        sync_reddetti_csv()
        print(json.dumps(stats, ensure_ascii=False, indent=2))
        return 0

    if args.rewrite_hazir:
        stats = rewrite_hazir_messages()
        sync_reddetti_csv()
        print(json.dumps(stats, ensure_ascii=False, indent=2))
        if stats.get("next"):
            n = stats["next"]
            print(
                f"NEXT: {n['ad']} {n['soyad']} · {n['brans']} · {n['sehir']} · "
                f"{n['telefon']} · {n['varyant']}"
            )
            print("--- mesaj_1 ---")
            print(n["mesaj_1"])
        return 0

    if args.apply_followups:
        stats = apply_followups()
        sync_reddetti_csv()
        print(json.dumps(stats, ensure_ascii=False, indent=2))
        return 0

    if args.mark_eski:
        n = mark_eski_in_ledger()
        print(f"ledger updated: {n} → eski_mesaj_gonderildi")

    eski_phones, eski_names, eski_rows = load_eski_phones_and_names()
    write_eski_csv(eski_rows, eski_phones)

    # Always ensure ledger mark when building a fresh gift batch.
    if not args.mark_eski:
        mark_eski_in_ledger()
        eski_phones, eski_names, eski_rows = load_eski_phones_and_names()
        write_eski_csv(eski_rows, eski_phones)

    red_phones, red_names, _red_rows = load_reddetti_exclusions()
    eligible, hold, stats = build_candidates(
        eski_phones, eski_names, red_phones, red_names
    )
    limit = max(1, min(args.limit, MAX_BATCH))
    batch = allocate_batch(eligible, limit)
    sync_reddetti_csv()

    write_csv(OUT_CSV, batch, CSV_COLUMNS)
    write_html(OUT_HTML, batch)
    write_csv(
        OUT_HOLD,
        hold,
        ["isim", "brans", "sehir", "telefon", "url", "durum", "notlar"],
    )

    by_brans = Counter(r["brans"] for r in batch)
    by_var = Counter(r["varyant"] for r in batch)
    by_brans_var = Counter(f"{r['brans']}:{r['varyant']}" for r in batch)

    summary = {
        **stats,
        "batch_rows": len(batch),
        "by_brans": dict(by_brans),
        "by_varyant": dict(by_var),
        "by_brans_varyant": dict(by_brans_var),
        "excluded_eski_phones": len(eski_phones),
        "hold_rows": len(hold),
        "files": {
            "csv": str(OUT_CSV.relative_to(ROOT)),
            "html": str(OUT_HTML.relative_to(ROOT)),
            "hold": str(OUT_HOLD.relative_to(ROOT)),
            "eski": str(OUT_ESKI.relative_to(ROOT)),
            "quick_replies": str(QUICK_REPLIES.relative_to(ROOT)),
        },
        "next": (
            {
                "ad": batch[0]["ad"],
                "soyad": batch[0]["soyad"],
                "brans": batch[0]["brans"],
                "sehir": batch[0]["sehir"],
                "telefon": batch[0]["telefon"],
                "varyant": batch[0]["varyant"],
                "wa_link": batch[0]["wa_link"],
            }
            if batch
            else None
        ),
    }
    OUT_SUMMARY.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_durum(batch, summary)

    print("=== GIFT-FIRST BATCH SUMMARY ===")
    print(f"batch: {len(batch)} / max {limit}")
    print(f"per branş: {dict(by_brans)}")
    print(f"per varyant: {dict(by_var)}")
    print(f"per branş×varyant: {dict(by_brans_var)}")
    print(f"excluded (eski mesaj): {stats.get('excluded_eski', 0)} pool hits; {len(eski_phones)} phones tracked")
    print(f"hold (diğer branş): {len(hold)}")
    print(f"eligible remaining after batch: {len(eligible) - len(batch)}")
    print("files:")
    for k, v in summary["files"].items():
        print(f"  {k}: {v}")
    if batch:
        n = batch[0]
        print(
            f"NEXT: {n['ad']} {n['soyad']} · {n['brans']} · {n['sehir']} · {n['telefon']} · {n['varyant']}"
        )
        print("--- mesaj_1 ---")
        print(n["mesaj_1"])
        print("--- wa_link ---")
        print(n["wa_link"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
