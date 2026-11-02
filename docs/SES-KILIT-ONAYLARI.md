# SES-KILIT onayları


## 2026-10-29 — Ses Omurgası v2 (A–I) + founder lock — ordered and signed off by Kaan in the job brief

- Onay satırı: `Kaan-onay: 2026-10-29 Ses Omurgası v2 (A–I) + founder lock — ordered and signed off by Kaan in the job brief`
- Taban commit: `07d3bcec8`
- Değişen kilitli dosyalar: `.cursor/rules/ses-omurga-kilidi.mdc`, `app/api/asistan/ses-ekran/route.ts`, `app/api/asistan/ses-llm/v1/chat/completions/route.ts`, `app/api/asistan/signed-url/route.ts`, `components/asistan/AsistanOturumContext.tsx`, `lib/ai/modeller.ts`, `lib/asistan/ayseCevapla.ts`, `lib/asistan/duraklama.ts`, `lib/asistan/elevenKapi.ts`, `lib/asistan/elevenMetni.ts`, `lib/asistan/kesintiDevam.ts`, `lib/asistan/komutNiyeti.ts`, `lib/asistan/konusma.ts`, `lib/asistan/konusmaKapisi.ts`, `lib/asistan/okumaAraclari.ts`, `lib/asistan/onbellekBloklari.ts`, `lib/asistan/oturumYaz.ts`, `lib/asistan/sesAnahtarKelime.ts`, `lib/asistan/sesDevam.ts`, `lib/asistan/sesDosya.ts`, `lib/asistan/sesJetonu.ts`, `lib/asistan/sesKilit.test.ts`, `lib/asistan/sesLlm.ts`, `lib/asistan/sesMotoru.ts`, `lib/asistan/sesOmurgaV2.test.ts`, `lib/asistan/sesSaglik.ts`, `lib/asistan/sesTurKapisi.ts`, `lib/asistan/sesTurKilit.ts`, `lib/asistan/sesTurYoneticisi.ts`, `lib/asistan/sesYay.ts`, `lib/asistan/sesliOnay.ts`, `lib/asistan/soruNiyeti.ts`, `lib/db/migrations/178_ses_turu_ac.sql`, `lib/db/migrations/183_ses_omurga_v2.sql`, `lib/doktor/hastaDosyaKart.ts`, `lib/doktor/ogrenme/dosyaOnbellek.ts`, `lib/ulke/asistan/konusma.ts`, `lib/ulke/asistan/motorKilidi.ts`, `lib/ulke/asistan/sesTur.test.ts`, `lib/ulke/asistan/sesTur.ts`, `lib/ulke/asistan/sunucu.ts`, `scripts/ses-ci.mjs`, `scripts/ses-kilit.mjs`

## 2026-11-02 — AU live-voice minute caps (trial 60 min, paid 150 min/month) — pricing/limits only

- Kaan's written approval, verbatim: "you have my auth to go ahead and make the changes to au voice since this is pricing and limits based changes not the actual voice architecture change"
- Onay satırı: `Kaan-onay: 2026-11-02 AU voice minute caps (trial 60 min, paid 150 min/month) — pricing/limits only`
- Taban commit: `beb4dd2f6`
- Değişen kilitli dosyalar: none. The cap is a gate in front of the locked opener (`app/api/ulke/asistan-canli/route.ulke.ts`, not hashed) plus a call-end ping (`app/api/ulke/asistan-canli/bitti/route.ulke.ts`, `components/ulke/uygulama/canliOturum.ts`), logic in `lib/ulke/uygulama/sesDakikaSiniri.ts` and `lib/billing/sesDakika.ts`. No change to voice architecture, routing, prompts, streaming or turns; `lib/asistan/ses-kilit.json` unchanged; `npm run test:ses` green (324/324).

## 2026-11-02 — AU trial model (no card): read-only gate at live-call start — pricing/limits only

- Covered by Kaan's 2026-11-02 approval above (pricing and limits, not voice architecture).
- Değişen kilitli dosyalar: none. `app/api/ulke/asistan-canli/route.ulke.ts` and `.../yazili/route.ulke.ts` (not hashed) refuse a new call / typed turn with 402 `DENEME_BITTI` once the AU free trial is over without a paid plan (`lib/ulke/uygulama/deneme.ts`). No change to routing, prompts, streaming or turns; `lib/asistan/ses-kilit.json` unchanged; `npm run test:ses` green (324/324).
