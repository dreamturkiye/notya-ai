# KVKK Aydınlatma Metni (Data Protection Notice) — Türkiye

- **Jurisdiction / language:** Türkiye — Turkish
- **Published at:** `/kvkk`
- **Source file:** `app/kvkk/page.tsx` (pre-existing; updated 2026-10-17 to v6 — entity placeholder corrected, footer nav added)
- **Legal bases leaned on:** 6698 sayılı KVKK madde 10 (aydınlatma yükümlülüğü), madde 5–6 (işleme şartları, özel nitelikli veri), madde 9 (yurt dışına aktarım), madde 11 (ilgili kişi hakları)
- **Status:** This document already existed before HUKUK-01 and is the most mature of the suite (v6, dated history). Claude's 2026-10-17 change: replaced the hardcoded "Dream Türkiye" entity reference in section 1 with the honest bracketed placeholder (the company is not yet formed, so "Dream Türkiye" is a brand umbrella, not the registered data controller), and linked it into the new `/yasal` index. Not yet reviewed by a lawyer end-to-end.
- **Open for counsel:**
  1. Entity name/address/MERSİS placeholder in section 1 — fill in at company formation.
  2. Confirm the processor/controller framing in section 1 (hekim = veri sorumlusu, Notya = veri işleyen) is airtight for every clinic structure Notya sells into (solo hekim vs. klinik with employed hekimler).
  3. Confirm the sub-processor list and retention table (sections 5–6) against the final DPA once drafted.
  4. The embedded "ses profili" consent block (section 11, from `lib/asistan/sesProfili/rizaMetni.ts`) is marked in-code as awaiting lawyer approval ("AVUKAT ONAYI BEKLİYOR") — resolve before relying on it.

---

## Full text as published in-app (sections 1–11, abbreviated to the parts Claude changed; full body is in `app/kvkk/page.tsx`)

> Full text is long (11 sections covering veri sorumlusu, işlenen veriler, işleme amaçları, hukuki sebep,
> yurt dışına aktarım, saklama süresi, teknik/idari tedbirler, ilgili kişi hakları, veri ihlali bildirimi,
> e-posta bağlantısı, and the voice-profile consent block) and was not newly authored by this change — see
> `app/kvkk/page.tsx` for the authoritative, complete text. The one substantive edit on 2026-10-17:

**Section 1 — Veri Sorumlusu (before → after):**

- Before: "Veri sorumlusu: **Dream Türkiye** ("Notya AI"). İletişim: kvkk@notya.ai"
- After: "Veri sorumlusu: Notya'yı işleten teşebbüs — **[ŞİRKET UNVANI VE ADRESİ — şirket kuruluşunda
  doldurulacak]** ("Notya"). Şirket kuruluşu tamamlandığında unvan, adres ve MERSİS bilgisi bu bölümde
  ilan edilecektir. İletişim: kvkk@notya.ai"

This removes an unverified entity claim ("Dream Türkiye" is the founder's brand umbrella across several
products, not Notya's registered legal entity) in favor of an honest placeholder, per the HUKUK-01 hard
honesty rule.

Also added: a footer cross-link to the new `/yasal` index page, and an explicit "Son güncelleme: 2026-10-17
· hukuki incelemeden geçmektedir" line.

---
*Son güncelleme: 2026-10-17 (v6) · Bu metin hukuki incelemeden geçmektedir.*
