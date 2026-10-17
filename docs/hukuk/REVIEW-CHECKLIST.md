# HUKUK-01 — Legal Review Checklist

Everything below is a Claude-drafted policy document. **No lawyer has reviewed any of it.** This
checklist exists so a lawyer engaged for each jurisdiction knows exactly what to confirm, fix, or
fill in before publication is relied on commercially. Each jurisdiction's full text is in the
sibling `docs/hukuk/<cc>/*.md` files, which are exact copies of what is published in the live app.

Company status: **Notya AI is not yet an incorporated legal entity** (per Kaan, 2026-10-04 — still
pre-revenue, deciding between Türkiye and the US for incorporation). Every entity-identity field
across every jurisdiction is a bracketed placeholder for this reason — this is not an oversight to
flag, it is the deliberate and only honest state until incorporation happens. The first action item
in every jurisdiction below is the same: fill in the real entity once it exists.

---

## Türkiye (TR) — primary market, live with real patient data

Documents: `kullanim-kosullari`, `gizlilik`, `kvkk`, `veri-isleme`, `cerez-politikasi`,
`klinik-karar-destegi`, `iade-ve-iptal`, `telif-hakki`.

1. **Entity.** Fill in `[ŞİRKET UNVANI VE ADRESİ — şirket kuruluşunda doldurulacak]` and
   `[MERSİS NO — şirket kuruluşunda doldurulacak]` everywhere they appear (Kullanım Koşulları §1,
   KVKK §1, Veri İşleme §1, Telif Hakkı §1) once the company is formed.
2. **Governing court.** Fill in `[YETKİLİ MAHKEME VE İCRA DAİRELERİ — şirket kuruluşunda
   doldurulacak]` (Kullanım Koşulları §11) — depends on the entity's registered address.
3. **Consumer status of the typical customer.** Confirm whether a hekim/klinik subscriber counts
   as "tüketici" under 6502 sayılı TKHK for this transaction (professional-use purchases usually
   fall outside the consumer definition). This determines whether the 14-day cayma hakkı in
   İade ve İptal §3 actually applies, or whether only the voluntary cancellation terms in §2 do.
4. **Cayma hakkı istisnası mechanics.** Confirm the Mesafeli Sözleşmeler Yönetmeliği m.15 exception
   (service begun with the consumer's consent before the 14 days run out) is triggered correctly
   by the actual signup flow (account activates immediately on signup), and that the required
   pre-contractual disclosure of that exception is given at the right moment in the UI, not just
   stated on the policy page after the fact.
5. **Limitation of liability (Kullanım Koşulları §10).** Confirm the carve-outs (kasıt/ağır kusur,
   consumer-protection mandatory rules) are complete and that the clause doesn't overreach what
   TBK allows to be excluded.
6. **DPA (Veri İşleme Özeti).** This page is a transparency summary, not a signed processor
   agreement. Draft the actual DPA it promises subscribers, and confirm the sub-processor list
   (Supabase, Vercel, OpenRouter, Anthropic, Deepgram, ElevenLabs, NetGSM, Meta, Google/Microsoft)
   is complete and current at the time of sign-off — it was built by reading the live code on
   2026-10-17 and will drift as providers change.
7. **AI/copyright authorship (Telif Hakkı §3).** Confirm the position that a clinician owns the
   AI-assisted note/output as part of their own clinical record holds up under FSEK's authorship
   rules for AI-assisted works — an unsettled area of Turkish copyright law.
8. **Medical-device framing (Klinik Karar Desteği).** Confirm Notya's "decision support, not a
   device" positioning doesn't trigger Sağlık Bakanlığı tıbbi cihaz mevzuatı (ÜTS registration).
   The page deliberately makes no claim either way; keep it that way until this is answered.
9. **Voice-profile consent block** embedded in `/kvkk` §11 (from
   `lib/asistan/sesProfili/rizaMetni.ts`) is marked in-code as awaiting lawyer approval
   ("AVUKAT ONAYI BEKLİYOR") — resolve before relying on it.
10. **Signup acceptance flow.** Confirm the single checkbox covering both Kullanım Koşulları and
    KVKK Aydınlatma Metni (added 2026-10-17, stored as `kosullar_onay` / `kvkk_onay` with separate
    timestamps and text versions in Supabase auth metadata) is adequate, or whether two separate
    checkboxes are required.

**Sources checked (WebSearch, 2026-10-17):** Mesafeli Sözleşmeler Yönetmeliği primary text and
cayma hakkı istisnaları commentary — see citations inline in `docs/hukuk/tr/iade-ve-iptal.md`.

---

## United States (US)

Documents: `privacy`, `terms`, `cookies`, `medical` (medical-disclaimer), `data-request`,
`accessibility`, `security`, plus `refund` and `copyright` (added 2026-10-17 to match the TR set).

1. **HIPAA posture.** The privacy page explicitly does not claim HIPAA compliance and does not
   name a state. Counsel must determine: (a) whether Notya is a business associate of the
   clinicians who use it, (b) whether a BAA needs to be offered/signed, (c) which state
   medical-privacy and consumer-privacy statutes apply given the product has no single fixed
   state of operation.
2. **State choice for refund/cancellation.** The refund page deliberately names no state; counsel
   picks one (or writes a 50-state-aware clause) and confirms against FTC negative-option-billing
   rules (the "click-to-cancel" rule and state auto-renewal statutes).
3. **DMCA safe harbor.** The copyright page names 17 U.S.C. § 512 only as something "to review
   against," not as a claimed safe harbor. If Notya wants DMCA safe-harbor protection, counsel
   must confirm the statutory designated-agent registration with the US Copyright Office is done
   — this page alone does not create that protection.
4. **FDA device question.** Medical disclaimer page makes no claim either way on device status;
   counsel confirms whether AI-based clinical decision support of this kind needs FDA
   consideration under SaMD (Software as a Medical Device) guidance.
5. **Governing law/venue** — not chosen anywhere in the US pack; counsel should decide whether to
   add one.

---

## United Kingdom (GB)

Documents: same nine keys as US.

1. **UK GDPR / DPA 2018 lawful basis.** Privacy page names the statutes but not a lawful basis or
   the controller/processor roles between Notya and the clinician — counsel to confirm and state
   explicitly.
2. **PECR cookie consent.** Given the product's cookie policy claims only strictly-necessary
   session storage, confirm no PECR consent-banner obligation applies; flag immediately if any
   analytics/ad cookie is ever added.
3. **Consumer Contracts Regulations 2013 exception.** Same mechanical question as TR: confirm the
   reg 36/37 "service begun with consent" exception is actually triggered correctly by the signup
   flow, and that pre-contract disclosure happens at the right moment.
4. **MHRA device question**, parallel to the US FDA question above.
5. **CDPA 1988 infringement procedure.** UK has no DMCA-style statutory notice-and-takedown safe
   harbor identical to the US; confirm the voluntary notice procedure on the copyright page is
   adequately worded as non-statutory.

---

## Canada (CA)

Documents: same nine keys.

1. **Province choice.** Privacy, cookies and refund pages all deliberately name no province.
   Counsel must decide whether to pick one governing province or draft province-aware language,
   since consumer-protection, cancellation and auto-renewal rules differ by province (e.g. Ontario
   Consumer Protection Act 2002 vs. Quebec's Consumer Protection Act).
2. **PIPEDA vs. provincial health-privacy overlap.** Confirm which applies to patient health data
   given the clinician (not Notya) is typically the data controller.
3. **Health Canada device question**, parallel to the US/UK items above.
4. **Copyright Act (R.S.C., 1985, c. C-42) notice regime.** Canada has its own
   notice-and-notice system (not notice-and-takedown); confirm the copyright page's voluntary
   procedure doesn't conflict with or misstate that regime.

---

## Australia (AU)

Documents: same nine keys.

1. **Non-excludable consumer guarantees — the most important AU-specific item.** The refund page
   states the Australian Consumer Law (Schedule 2, Competition and Consumer Act 2010 (Cth))
   guarantees **cannot be excluded, restricted or modified**. Counsel must verify every other
   document (especially Terms' limitation-of-liability equivalent, if one is added later) is
   consistent with this and never reads as attempting to exclude them, which is itself a
   prohibited act under the ACL.
2. **TGA device question**, parallel to the items above.
3. **Privacy Act 1988 / APPs — small business exemption.** Confirm whether Notya (pre-formation,
   likely small at launch) would fall under the small-business exemption to the Privacy Act, and
   whether handling health information removes that exemption (health information is generally
   carved out of the small-business exemption under APP guidance) — this materially changes
   compliance obligations and should not be assumed either way.
4. **Copyright Act 1968 (Cth).**

---

## New Zealand (NZ)

Documents: same nine keys.

1. **Consumer Guarantees Act 1993 s 43.** Refund page names the limit on contracting out of CGA
   guarantees where the clinician is "in trade." Counsel confirms whether a clinician/clinic
   subscriber is "in trade" for this purpose (likely yes) and that the wording doesn't attempt an
   exclusion s 43 would void.
2. **Fair Trading Act 1986** interaction with the refund/cancellation wording.
3. **Health Information Privacy Code** vs. general Privacy Act 2020 — confirm which provisions
   bind Notya directly vs. only the clinician.
4. **Medsafe device question**, parallel to the items above.
5. **Copyright Act 1994.**

---

## Uzbekistan (UZ)

Documents: same nine keys, each published in three scripts (uz-Latn, uz-Cyrl, ru) — counsel
review should cover all three, not just one, since they are independently hand-translated, not
machine-transliterated from each other.

1. **Personal-data law citation.** Existing privacy/cookies pages cite ЗРУ-547 (lex.uz/docs/4831939).
   Confirm this is still the current citation (personal-data law numbering has been amended since
   original enactment) and that the framing (processing basis, cross-border transfer handling) is
   accurate.
2. **Consumer protection citation (new, 2026-10-17).** Refund page cites Law No. 221-I of
   26.04.1996 "On Protection of Consumer Rights" (lex.uz/en/acts/14643), as amended (most recently
   by ЗРУ-1021 of 2025 per the public register at the time this was researched). Counsel should
   confirm the current amended text and that no more recent amendment changes the cited position.
3. **Copyright citation (new, 2026-10-17).** Copyright page cites Law No. 42 of 20.07.2006 "On
   Copyright and Related Rights" (WIPO Lex UZ188), as amended by Law No. ЗРУ-709 of 2021 among
   others. Counsel should confirm currency and accuracy.
4. **Native-reviewer item (standing, per Kaan's international-expansion rule).** All Uzbek-language
   legal text (Latin and Cyrillic) on this page was drafted by Claude without a native Uzbek legal
   or linguistic reviewer. This is logged as a standing open item — see the UZ entry in
   `docs/OPEN-COMMITMENTS.md` under HUKUK-01 — and should not be treated as resolved by this
   checklist alone; a native reviewer should check register, legal-term accuracy, and the Cyrillic
   transliteration fidelity against the Latin original before this is relied on with real patients.
5. **Regulator/device question.** No Uzbek medical-device regulator is named anywhere in this
   pack (unlike FDA/MHRA/Health Canada/TGA/Medsafe for the other five) — counsel should identify
   the correct body (likely the Ministry of Health / Agency for Development of the Pharmaceutical
   Industry) and decide whether the medical-disclaimer page needs an equivalent "for a lawyer to
   review against [body]" line, matching the pattern used for the other five countries.

---

## Cross-jurisdiction items

- **Sub-processor list currency.** Every jurisdiction's privacy/data-processing text references
  the same real sub-processor set (Supabase, Vercel, OpenRouter, Anthropic, Deepgram, ElevenLabs,
  NetGSM, Meta WhatsApp Business Platform, Google/Microsoft for doctor-initiated email). This list
  was built by reading the live codebase on 2026-10-17; re-verify at sign-off time, and any time a
  provider is added or removed, update all seven jurisdictions in the same change set (this is
  itself now the kind of fix the `ulke-paritesi-duzeltme` skill would flag if it drifted).
- **No compliance/certification claims anywhere.** Every page in every jurisdiction deliberately
  avoids words like "compliant," "certified," or naming a specific government approval as
  obtained. This is enforced by an automated test (`lib/ulke/yasal.test.ts`, the country packs)
  for the six non-Turkey jurisdictions; the Turkish pages were hand-reviewed for the same rule but
  have no equivalent automated check yet — consider adding one if this doc set grows further.
- **"Son güncelleme: 2026-10-17" / per-country "A lawyer has not read this" line.** Every page in
  every jurisdiction carries a visible, un-styled-away statement that legal review has not
  happened. Do not remove this line from any page until that jurisdiction's lawyer sign-off is
  actually complete — removing it before then would make the page represent something false.
