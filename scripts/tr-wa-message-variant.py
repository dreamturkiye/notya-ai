#!/usr/bin/env python3
"""Generate structurally unique TR WhatsApp cold-outreach copy.

Anti-ban: name-only swaps of the same body look identical to spam detectors.
This script rotates openings, bullet order/subset, and CTA wording so each
send differs in structure — not just the doctor name.
"""
from __future__ import annotations

import argparse
import hashlib
import random
import re
import sys
from datetime import datetime, timezone

# Specialty bullet pools (Turkish). Pick 4 of N and shuffle.
BULLETS: dict[str, list[str]] = {
    "kd": [
        "gebelik takvimi ve izlem notları",
        "USG / NST rapor taslağı",
        "sezaryen ve ameliyat notu",
        "doğum epikrizi ve antetli baskı",
        "hasta portalı (randevu + sonuçlar)",
        "muayene sırasında asistan desteği",
    ],
    "derm": [
        "dermatolojik muayene notları",
        "lezyon / takip fotoğrafları",
        "reçete ve kontrol hatırlatmaları",
        "hasta portalı (randevu + sonuçlar)",
        "muayene sırasında asistan desteği",
    ],
    "pedi": [
        "çocuk muayene ve büyüme notları",
        "aşı / kontrol hatırlatmaları",
        "reçete akışı",
        "veli portalı (randevu + sonuçlar)",
        "muayene sırasında asistan desteği",
    ],
}

OPENINGS = [
    "Merhaba Dr. {ad}, Notya’dan yazıyorum.",
    "Dr. {ad}, merhaba — Notya ekibinden ulaşıyorum.",
    "İyi günler Dr. {ad}. Notya’dan kısaca yazmak istedim.",
    "Merhaba Dr. {ad}. Klinik temposunu koruyan bir asistan üzerine kısa not.",
    "Dr. {ad} merhaba, Notya (klinik asistan) tarafındayım.",
]

BRIDGES = [
    "Özetle: muayene notu, takip ve hasta iletişimi tek yerde — her karar sizin onayınızla.",
    "Kısaca: branşa özel muayene ekranı + hasta portalı + asistan.",
    "Amaç: kağıt / dağınık WhatsApp notunu azaltıp muayene temposunu korumak.",
    "Notya, branşınıza özel akışı tek ekranda topluyor; kayıtlar daha düzenli kalıyor.",
]

CTAS = [
    "Uygun olursa 10 dk’lık kısa bir bakış ayarlayabilirim — ister misiniz?",
    "İlginiz olursa size özel kısa bir demo planlarım. Uygun mu?",
    "Kısa bir bakış ister misiniz, yoksa şimdilik geçeyim mi?",
    "Uygun bir zamanınız olursa bir cümleyle dönüş yeterli.",
    "İsterseniz sayfaya bakıp “tamam” yazmanız yeter; detayı sonra konuşuruz.",
]

CLOSINGS = [
    "Saygılarımla",
    "İyi çalışmalar",
    "Teşekkürler, iyi günler",
]

LINKS = {
    "kd": "www.notya.ai/kadin-dogum",
    "derm": "www.notya.ai/dermatoloji",
    "pedi": "www.notya.ai/pediatri",
}


def specialty_key(raw: str) -> str:
    s = (raw or "").strip().lower()
    if s in ("kd", "kadin-dogum", "kadın-doğum", "kadın hastalıkları", "jinekoloji"):
        return "kd"
    if s in ("derm", "dermatoloji", "derma"):
        return "derm"
    if s in ("pedi", "pediatri", "çocuk", "cocuk"):
        return "pedi"
    # default from Turkish specialty labels in ledger
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
        r"dr\.?\s*[oö]gr\.?\s*[uü]yesi|dr\.?)\s*",
        "",
        n,
        flags=re.I,
    )
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
    bridge = rng.choice(BRIDGES)
    bullets = list(BULLETS[key])
    rng.shuffle(bullets)
    chosen = bullets[:4]
    bullet_block = "\n".join(f"• {b}" for b in chosen)
    cta = rng.choice(CTAS)
    close = rng.choice(CLOSINGS)
    link = LINKS[key]

    # Two layout families to break fingerprint further
    layout = rng.choice(["A", "B", "C"])
    if layout == "A":
        body = (
            f"{opening}\n\n"
            f"{bridge}\n\n"
            f"{bullet_block}\n\n"
            f"Sayfa: {link}\n\n"
            f"{cta}\n\n"
            f"{close}"
        )
    elif layout == "B":
        body = (
            f"{opening} {bridge}\n\n"
            f"Öne çıkanlar:\n{bullet_block}\n\n"
            f"{cta}\n"
            f"{link}\n\n"
            f"{close}"
        )
    else:
        body = (
            f"{opening}\n\n"
            f"Branşınıza uygun başlıklar:\n{bullet_block}\n\n"
            f"{bridge}\n"
            f"→ {link}\n\n"
            f"{cta}\n{close}"
        )

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
