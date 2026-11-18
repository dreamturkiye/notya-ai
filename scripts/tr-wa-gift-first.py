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
SKIP_DURUM = ESKI_DURUM | {"wa_yok", "gitmedi", "ilgilenmiyor"}

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


def mesaj_1(ad: str, brans: str, varyant: str) -> str:
    meta = KART[brans]
    given = capitalize_given(ad)
    if varyant == "A":
        return (
            f"{given} Hocam merhaba, ben Kaan, Dr. Gökhan Mamur'un ekibinden. "
            f"{meta['okunus']} hekimleri için tek sayfalık, her satırı kaynaklı bir "
            f"{meta['kart']} hazırladık: {meta['icerik']}. "
            f"Ücretsiz; isterseniz PDF olarak buradan göndereyim?"
        )
    return (
        f"{given} Hocam merhaba 🙂 Kısa bir sorum var: masanızda {meta['icerik']} "
        f"için tek sayfalık bir başvuru kartı ister misiniz? Her satırı kaynaklı bir "
        f"{meta['kart']} hazırladık, ücretsiz. \"Evet\" yazmanız yeterli, PDF'i hemen göndereyim.\n"
        f"— Kaan, Dr. Gökhan Mamur'un ekibinden"
    )


def wa_link(telefon: str, message: str) -> str:
    d = digits(telefon)
    if not d:
        return ""
    return f"https://wa.me/90{d}?text={quote(message)}"


def forbidden_in_first_message(text: str) -> list[str]:
    """Hard guard: first message must not pitch / pressure / link."""
    hits: list[str] = []
    low = text.lower()
    for bad in (
        "http://",
        "https://",
        "www.",
        "notya.io",
        "1,5-2",
        "1.5-2",
        "geri kalmamak",
        "geride kalan",
        "ücretli",
        "fiyat",
        "tl/",
    ):
        if bad in low:
            hits.append(bad)
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


def build_candidates(
    eski_phones: set[str], eski_names: set[str]
) -> tuple[list[dict], list[dict], dict]:
    """Return (eligible target rows, hold rows, stats)."""
    eligible: list[dict] = []
    hold: list[dict] = []
    stats = Counter()
    seen_phones: set[str] = set()

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
            batch.append(
                {
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
                }
            )
            progressed = True
        if not progressed:
            break
    return batch


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def write_html(path: Path, rows: list[dict]) -> None:
    cards = []
    for i, r in enumerate(rows):
        key = digits(r["telefon"])
        cards.append(
            f"""
<article class="card" data-phone="{html.escape(key)}" data-i="{i}">
  <label class="check">
    <input type="checkbox" class="sent" data-phone="{html.escape(key)}" />
    <span>Gönderildi</span>
  </label>
  <div class="meta">
    <strong>{html.escape(r['ad'])} {html.escape(r['soyad'])}</strong>
    <span class="pill">{html.escape(r['brans'])}</span>
    <span class="pill">{html.escape(r['varyant'])}</span>
    <span class="muted">{html.escape(r['sehir'])} · {html.escape(r['telefon'])}</span>
  </div>
  <pre class="msg">{html.escape(r['mesaj_1'])}</pre>
  <a class="wa" href="{html.escape(r['wa_link'])}" target="_blank" rel="noopener">WhatsApp'ta aç</a>
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
  <p class="sub">Kart teklifi · link/fiyat/FOMO yok · işaretledikleriniz telefonda kalır (localStorage)</p>
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
    text = """# WhatsApp Business — hazır yanıtlar (gift-first)

Hızlı yanıt kısayolları. Kart PDF’lerini `/evet` sonrası branşa göre ekleyin.

## /evet

```
Buyurun Hocam. Bu kartta elle baktığınız hesapları Notya her hastanız için muayene sırasında kendisi takip ediyor, hatırlatmalar dahil. Merak ederseniz 15 dakikada gösterebiliriz.
```

### Eklenecek PDF (branşa göre)

| Branş | Kart | PDF |
|------|------|-----|
| pediatri | Pediatri Pratik Kartı | https://notya-growth.vercel.app/pratik-kart/pediatri-pratik-karti-2026.pdf |
| kadın doğum | Gebelik Takip Kartı | https://notya-growth.vercel.app/pratik-kart/kd-gebelik-takip-karti-2026.pdf |
| dermatoloji | Sistemik Tedavi İzlem Kartı | https://notya-growth.vercel.app/pratik-kart/dermatoloji-sistemik-tedavi-izlem-karti-2026.pdf |

## /takip

```
Hocam kart işinize yaradı mı? Eksik ya da eklenmesini istediğiniz bir şey olursa yazın, düzeltiyoruz.
```

Kullanım: `durum = kart_gonderildi`, `gonderim_tarihi` ≥ 3 gün önce, `yanit` boş → `notlar` içine `takip_gunu` yazılır; `/takip` **bir kez**.

## /demo

```
Harika Hocam. Size uygun saati buradan seçebilirsiniz: https://www.notya.io/demo — Dr. Gökhan Mamur bizzat gösterecek.
```

## Durum makinesi

| durum | anlam |
|-------|--------|
| `hazir` | Batch’te, henüz teklif edilmedi |
| `teklif_edildi` | mesaj_1 gönderildi |
| `kart_gonderildi` | PDF gitti |
| `demo` | demo linki / randevu |
| `ilgilenmiyor` | 5 gün yanıtsız teklif veya ret |

Kural: `teklif_edildi` + 5 gün + `yanit` boş → `ilgilenmiyor` (bir daha yazma).
"""
    QUICK_REPLIES.write_text(text, encoding="utf-8")


def apply_followups(path: Path = OUT_CSV) -> dict:
    """Mutate batch CSV for takip_gunu / ilgilenmiyor rules."""
    if not path.exists():
        return {"error": "no batch"}
    with path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    today = date.today()
    stats = Counter()
    for r in rows:
        durum = (r.get("durum") or "").strip()
        yanit = (r.get("yanit") or "").strip()
        g = (r.get("gonderim_tarihi") or "").strip()
        notlar = (r.get("notlar") or "").strip()
        if not g:
            continue
        try:
            sent = date.fromisoformat(g[:10])
        except ValueError:
            stats["bad_date"] += 1
            continue
        age = (today - sent).days
        if durum == "kart_gonderildi" and not yanit and age >= 3:
            if "takip_gunu" not in notlar:
                r["notlar"] = (notlar + " | takip_gunu").strip(" |")
                stats["takip_gunu"] += 1
        if durum == "teklif_edildi" and not yanit and age >= 5:
            r["durum"] = "ilgilenmiyor"
            r["notlar"] = (notlar + " | auto_ilgilenmiyor_5g").strip(" |")
            stats["ilgilenmiyor"] += 1
    write_csv(path, rows, CSV_COLUMNS)
    return dict(stats)


def write_durum(batch: list[dict], summary: dict) -> None:
    first = batch[0] if batch else None
    lines = [
        "# TR outreach durum (canlı) — gift-first",
        "",
        "**Akış:** ücretsiz branş kartı teklifi (link / fiyat / FOMO yok).",
        f"**Batch:** {len(batch)} satır · CSV `{OUT_CSV.name}` · HTML `{OUT_HTML.name}`",
        f"**Eski pitch hariç:** {summary.get('excluded_eski', 0)} · **Hold:** {summary.get('hold', 0)}",
        "",
    ]
    if first:
        lines += [
            f"**Sıradaki:** {first['ad']} {first['soyad']} · {first['brans']} · {first['sehir']} · {first['telefon']} · varyant {first['varyant']}",
            "",
            "HTML’de büyük **WhatsApp'ta aç** butonu → Send.",
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
    ap.add_argument("--init-docs-only", action="store_true")
    args = ap.parse_args()

    write_quick_replies()
    if args.init_docs_only:
        print(f"wrote {QUICK_REPLIES}")
        return 0

    if args.apply_followups:
        stats = apply_followups()
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

    eligible, hold, stats = build_candidates(eski_phones, eski_names)
    limit = max(1, min(args.limit, MAX_BATCH))
    batch = allocate_batch(eligible, limit)

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
