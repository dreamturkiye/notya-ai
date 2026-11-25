# SES-KILIT onayları


## 2026-10-29 — Ses Omurgası v2 (A–I) + founder lock — ordered and signed off by Kaan in the job brief

- Onay satırı: `Kaan-onay: 2026-10-29 Ses Omurgası v2 (A–I) + founder lock — ordered and signed off by Kaan in the job brief`
- Taban commit: `d65d59790`
- Değişen kilitli dosyalar: `.cursor/rules/ses-omurga-kilidi.mdc`, `app/api/asistan/ses-ekran/route.ts`, `app/api/asistan/ses-llm/v1/chat/completions/route.ts`, `app/api/asistan/signed-url/route.ts`, `components/asistan/AsistanOturumContext.tsx`, `lib/ai/modeller.ts`, `lib/asistan/ayseCevapla.ts`, `lib/asistan/duraklama.ts`, `lib/asistan/elevenKapi.ts`, `lib/asistan/elevenMetni.ts`, `lib/asistan/kesintiDevam.ts`, `lib/asistan/komutNiyeti.ts`, `lib/asistan/konusma.ts`, `lib/asistan/konusmaKapisi.ts`, `lib/asistan/okumaAraclari.ts`, `lib/asistan/onbellekBloklari.ts`, `lib/asistan/oturumYaz.ts`, `lib/asistan/sesAnahtarKelime.ts`, `lib/asistan/sesDevam.ts`, `lib/asistan/sesDosya.ts`, `lib/asistan/sesJetonu.ts`, `lib/asistan/sesKilit.test.ts`, `lib/asistan/sesLlm.ts`, `lib/asistan/sesMotoru.ts`, `lib/asistan/sesOmurgaV2.test.ts`, `lib/asistan/sesSaglik.ts`, `lib/asistan/sesTurKapisi.ts`, `lib/asistan/sesTurKilit.ts`, `lib/asistan/sesTurYoneticisi.ts`, `lib/asistan/sesYay.ts`, `lib/asistan/sesliOnay.ts`, `lib/asistan/soruNiyeti.ts`, `lib/db/migrations/178_ses_turu_ac.sql`, `lib/db/migrations/180_ses_turu_ac_grant_fix.sql`, `lib/db/migrations/183_ses_omurga_v2.sql`, `lib/doktor/hastaDosyaKart.ts`, `lib/doktor/ogrenme/dosyaOnbellek.ts`, `scripts/ses-ci.mjs`, `scripts/ses-kilit.mjs`

## 2026-11-20 — ASI-TAKVIM-TEK-01 bug 2 — Ayşe kayıt sınırı güvencesi: dosyada belge yokken cevaptaki 'belgelerde var' cümlesi gerçek cümleyle değiştirilir (lib/asistan/ayseCevapla.ts, tek ekleme; Kaan: 'Go and fix and ensure this does not happen in real life live version from now on.' + 'go')

- Onay satırı: `Kaan-onay: 2026-11-20 ASI-TAKVIM-TEK-01 bug 2 — Ayşe kayıt sınırı güvencesi: dosyada belge yokken cevaptaki 'belgelerde var' cümlesi gerçek cümleyle değiştirilir (lib/asistan/ayseCevapla.ts, tek ekleme; Kaan: 'Go and fix and ensure this does not happen in real life live version from now on.' + 'go')`
- Taban commit: `60385a94`
- Değişen kilitli dosyalar: `lib/asistan/ayseCevapla.ts`

## 2026-11-24 — ESNEK-A-EVAL goruntu-inceleme reasoning effort high on Luna-Pro (lib/ai/modeller.ts: Caba gains 'high', GOREV_POLITIKASI goruntu-inceleme caba 'high', derin tier takes effort from its policy row only; Kaan GO 2026-11-24 16:29 EST, measured same day, kept only if it helps)

- Onay satırı: `Kaan-onay: 2026-11-24 ESNEK-A-EVAL goruntu-inceleme reasoning effort high on Luna-Pro (lib/ai/modeller.ts: Caba gains 'high', GOREV_POLITIKASI goruntu-inceleme caba 'high', derin tier takes effort from its policy row only; Kaan GO 2026-11-24 16:29 EST, measured same day, kept only if it helps)`
- Taban commit: `cd273e7c`
- Değişen kilitli dosyalar: `lib/ai/modeller.ts`

## 2026-11-24 — ESNEK-A-EVAL revert of goruntu-inceleme reasoning effort high (lib/ai/modeller.ts back to cd273e7c; measured same day under Kaan GO 2026-11-24 16:29 EST: no accuracy gain, image reads ~3x slower, timeouts to Sonnet; the GO's keep-only-if-it-helps rule)

- Onay satırı: `Kaan-onay: 2026-11-24 ESNEK-A-EVAL revert of goruntu-inceleme reasoning effort high (lib/ai/modeller.ts back to cd273e7c; measured same day under Kaan GO 2026-11-24 16:29 EST: no accuracy gain, image reads ~3x slower, timeouts to Sonnet; the GO's keep-only-if-it-helps rule)`
- Taban commit: `6dfb188e`
- Değişen kilitli dosyalar: (yok — yalnız liste)

## 2026-11-24 — GO 1+2 (19:31 EST) — ayseCevapla.ts: citation lock for every branş against the protocol registry (bransDogrulanmisKaynaklar + protokolKaynakTemizle); persona/Özel Branş prompt stacks read turkKaynakYigini

- Onay satırı: `Kaan-onay: 2026-11-24 GO 1+2 (19:31 EST) — ayseCevapla.ts: citation lock for every branş against the protocol registry (bransDogrulanmisKaynaklar + protokolKaynakTemizle); persona/Özel Branş prompt stacks read turkKaynakYigini`
- Taban commit: `e39cd92b`
- Değişen kilitli dosyalar: `lib/asistan/ayseCevapla.ts`

## 2026-11-24 — 19:48 EST — 'Go with your recommendation': Ayşe returns hidden guideline numbers ("k") → registry ids → source chips; ayseCevapla.ts returns kaynakIdleri, AsistanOturumContext.tsx stores them on the message

- Onay satırı: `Kaan-onay: 2026-11-24 19:48 EST — 'Go with your recommendation': Ayşe returns hidden guideline numbers ("k") → registry ids → source chips; ayseCevapla.ts returns kaynakIdleri, AsistanOturumContext.tsx stores them on the message`
- Taban commit: `03e6d713`
- Değişen kilitli dosyalar: `components/asistan/AsistanOturumContext.tsx`, `lib/asistan/ayseCevapla.ts`

## 2026-11-24 — 22:13 EST — GO A: soruNiyeti.ts TIBBI_BILGI gains textbook forms (kimlere uygulanmamalı, verilir mi, endike mi, başlanmalı mı …) so general questions never fall into the records search

- Onay satırı: `Kaan-onay: 2026-11-24 22:13 EST — GO A: soruNiyeti.ts TIBBI_BILGI gains textbook forms (kimlere uygulanmamalı, verilir mi, endike mi, başlanmalı mı …) so general questions never fall into the records search`
- Taban commit: `1238b28e`
- Değişen kilitli dosyalar: `lib/asistan/soruNiyeti.ts`
