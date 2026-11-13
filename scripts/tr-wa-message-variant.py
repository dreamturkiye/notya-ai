#!/usr/bin/env python3
"""Generate high-quality, structurally unique TR WhatsApp cold-outreach copy.

Quality bar = docs/growth/TR-PEDI-OUTREACH-TEMPLATES.md (Kaan voice, branş depth,
Gökhan 30 dk, demo + deneme). Anti-ban uniqueness comes from rotating openings,
bridge lines, bullet order, soft CTAs and section order — never by gutting the message
into a thin “bullet + link” stub.
"""
from __future__ import annotations

import argparse
import hashlib
import random
import re
import sys
from datetime import datetime, timezone

# Full specialty bullet pools (keep clinical specificity).
BULLETS: dict[str, list[str]] = {
    "kd": [
        "Gebelik takvimi ve izlem",
        "Doppler'li USG ve yapılandırılmış NST",
        "Obstetrik risk (preeklampsi, GDM, SSVD)",
        "Sezaryen ve ameliyat notları",
        "Doğum epikrizi ve antetli baskı",
        "Jinekolojik operasyon notları (histerektomi, myomektomi, laparoskopi)",
    ],
    "derm": [
        "PASI / EASI",
        "İzotretinoin GÖP kapısı",
        "Fototerapi defteri",
        "Yama (D2/D4) ve dermoskopi",
        "Biyolojik SUT taslağı",
    ],
    "pedi": [
        "Büyüme ve persentil (Neyzi / WHO)",
        "Hedef boy",
        "Doz hesaplayıcı (mg/kg)",
        "Aşı takvimi ve telafi",
        "Gelişim ve tarama (M-CHAT dahil)",
    ],
}

BRANCH_LABEL = {
    "kd": "Kadın doğumda",
    "derm": "Dermatolojide",
    "pedi": "Pediatride",
}

# Openings — always name + Kaan/Notya identity (proven voice).
OPENINGS = [
    "{ad} Hocam merhaba 👋\nBen Kaan, *Notya*'dan yazıyorum.",
    "{ad} Hocam, merhaba.\nBen Kaan — *Notya*'dan ulaşıyorum.",
    "Merhaba {ad} Hocam 👋\nKaan (Notya). Kısa bir not bırakıyorum.",
    "{ad} Hocam iyi günler.\nBen Kaan, *Notya* ekibinden yazıyorum.",
]

# What Notya is — rotate wording, keep substance.
PRODUCT = [
    (
        "*Notya* — hekimler için yapay zekâ klinik asistanı.\n"
        "Muayeneyi dinler, notunuzu yazar, reçete ve rapor taslağını hazırlar, "
        "hastanızı takipte tutar — hasta portalı dahil.\n"
        "Her karar *sizin onayınızla*.\n"
        "40'tan fazla branşı kendi ihtiyaçlarıyla destekliyoruz."
    ),
    (
        "*Notya*, hekimler için yapay zekâ klinik asistanı:\n"
        "muayeneyi dinler → not + reçete + rapor taslağı → hasta takibi ve portal.\n"
        "Her adım *sizin onayınızla* ilerler.\n"
        "40+ branşta, her branşın kendi ihtiyacıyla."
    ),
    (
        "Kısaca *Notya*: muayene odasında sizinle çalışan bir klinik asistan.\n"
        "Not, reçete, rapor, takip ve hasta portalı tek yerde — kararlar yine *sizde*.\n"
        "40'tan fazla branşı kendi dilinde destekliyoruz."
    ),
]

VALUE = [
    (
        "Tipik bir günde yaklaşık *1,5-2 saat* kazanç.\n"
        "Hasta portalı gibi özellikler hem zaman kazandırır hem hastaya verdiğiniz hizmetin kalitesini yükseltir.\n"
        "Geri kalmamak önemli: hastalar giderek daha modern çalışan hekimleri tercih ediyor."
    ),
    (
        "Yoğun günlerde not / reçete / takip işlerinden yaklaşık *1,5-2 saat* geri geliyor.\n"
        "Portal + düzenli kayıt = daha iyi hasta deneyimi, daha yüksek bakım kalitesi.\n"
        "Branşta tempo değişiyor — geride kalan muayenehaneler hastayı daha modern rakiplere kaptırıyor."
    ),
    (
        "Pratikte: günde yaklaşık *1,5-2 saat* idari yük azalması.\n"
        "Hasta portalı hem sizin sürenizi korur hem hastanın aldığı hizmeti güçlendirir.\n"
        "Kısa bir bakış çoğu hekim için yeterli; bekleyen çoğu zaman kaybediyor."
    ),
    (
        "Zaman kazancı tek başına değil: portal ve düzenli takip hastaya verdiğiniz kaliteyi de artırıyor.\n"
        "Hastalar artık daha modern, daha erişilebilir hekimlerle çalışmak istiyor.\n"
        "Geride kalmamak için 10 dk’lık bir bakış çoğu zaman karar verdiriyor."
    ),
]

CTA_BLOCK = [
    (
        "Dr. Gökhan Mamur *30 dk* kısa tanıtım yapıyor 🩺\n"
        "Saatler size göre.\n\n"
        "Tanıtıma vakit yoksa ücretsiz denemeyi hemen açabiliyoruz.\n\n"
        "📅 *Tanıtım / Demo:* www.notya.io/demo\n"
        "🔗 *Ücretsiz deneme:* www.notya.io"
    ),
    (
        "İsterseniz Dr. Gökhan Mamur *30 dakikalık* kısa bir tanıtım ayarlıyor — saat sizin diliminiz.\n"
        "Tanıtıma şimdi vakit yoksa ücretsiz denemeyi de hemen açabilirsiniz.\n\n"
        "📅 Demo: www.notya.io/demo\n"
        "🔗 Deneme: www.notya.io"
    ),
    (
        "Dr. Gökhan Mamur sizin için *30 dk’lık* kısa bir tur yapıyor; uygun saati siz seçiyorsunuz.\n"
        "Şimdilik sadece bakmak isterseniz ücretsiz deneme de açık.\n\n"
        "*Tanıtım:* www.notya.io/demo\n"
        "*Deneme:* www.notya.io"
    ),
]


def specialty_key(raw: str) -> str:
    s = (raw or "").strip().lower()
    if s in ("kd", "kadin-dogum", "kadın-doğum", "kadın hastalıkları", "jinekoloji"):
        return "kd"
    if s in ("derm", "dermatoloji", "derma"):
        return "derm"
    if s in ("pedi", "pediatri", "çocuk", "cocuk"):
        return "pedi"
    if "kadın" in s or "doğum" in s or "dogum" in s:
        return "kd"
    if "derma" in s:
        return "derm"
    if "pedia" in s or "çocuk" in s or "cocuk" in s:
        return "pedi"
    return "kd"


def variant_seed(name: str, phone: str, day: str | None = None) -> int:
    day = day or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    h = hashlib.sha256(f"{day}|{phone}|{name}".encode()).hexdigest()
    return int(h[:8], 16)


def short_name(name: str) -> str:
    """Strip TR medical titles; greet with given name (first remaining token)."""
    n = (name or "").strip()
    n = re.sub(
        r"^(do[cç]\.?\s*dr\.?|prof\.?\s*dr\.?|op\.?\s*dr\.?|uzm\.?\s*dr\.?|"
        r"dr\.?\s*[oö][gğ]r\.?\s*[uü]yesi|"
        r"[oö][gğ]r\.?\s*[uü]yesi|"
        r"doktor\.?|dr\.?)\s*",
        "",
        n,
        flags=re.I,
    )
    # Second pass: leftover "Öğr. Üyesi" / "Ogr Uyesi" if Dr. was already gone
    n = re.sub(r"^[oö][gğ]r\.?\s*[uü]yesi\s*", "", n, flags=re.I)
    n = re.sub(r"\s+", " ", n).strip()
    parts = n.split()
    return parts[0] if parts else n


def build_message(
    *,
    name: str,
    specialty: str,
    phone: str = "",
    seed: int | None = None,
) -> tuple[str, str]:
    key = specialty_key(specialty)
    short = short_name(name)
    rng = random.Random(seed if seed is not None else variant_seed(name, phone))

    opening = rng.choice(OPENINGS).format(ad=short)
    product = rng.choice(PRODUCT)
    value = rng.choice(VALUE)
    cta = rng.choice(CTA_BLOCK)

    bullets = list(BULLETS[key])
    rng.shuffle(bullets)
    # Always show 5 when pool is large enough; keep depth.
    n_bullets = 5 if len(bullets) >= 5 else len(bullets)
    chosen = bullets[:n_bullets]
    label = BRANCH_LABEL[key]
    bullet_block = f"*{label}*\n" + "\n".join(f"- {b}" for b in chosen)

    layout = rng.choice(["A", "B", "C"])
    if layout == "A":
        # Classic: product → branş → value → CTA
        body = f"{opening}\n\n{product}\n\n{bullet_block}\n\n{value}\n\n{cta}"
    elif layout == "B":
        # Branş first (specialty-forward), then product, value, CTA
        body = f"{opening}\n\n{bullet_block}\n\n{product}\n\n{value}\n\n{cta}"
    else:
        # Product → value → branş → CTA (social proof earlier)
        body = f"{opening}\n\n{product}\n\n{value}\n\n{bullet_block}\n\n{cta}"

    vid = f"{key}-{layout}-{seed if seed is not None else variant_seed(name, phone) % 10000:04d}"
    return body.strip(), vid


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--name", required=True)
    ap.add_argument("--specialty", required=True)
    ap.add_argument("--phone", default="")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    body, vid = build_message(
        name=args.name, specialty=args.specialty, phone=args.phone, seed=args.seed
    )
    if args.json:
        import json

        print(json.dumps({"variant_id": vid, "message": body}, ensure_ascii=False, indent=2))
    else:
        print(f"# variant_id={vid}")
        print(body)
    return 0


if __name__ == "__main__":
    sys.exit(main())
