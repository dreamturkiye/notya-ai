# SES-KILIT onayları


## 2026-10-29 — Ses Omurgası v2 (A–I) + founder lock — ordered and signed off by Kaan in the job brief

- Onay satırı: `Kaan-onay: 2026-10-29 Ses Omurgası v2 (A–I) + founder lock — ordered and signed off by Kaan in the job brief`
- Taban commit: `50c0b431e`
- Değişen kilitli dosyalar: `.cursor/rules/ses-omurga-kilidi.mdc`, `app/api/asistan/ses-ekran/route.ts`, `app/api/asistan/ses-llm/v1/chat/completions/route.ts`, `app/api/asistan/signed-url/route.ts`, `components/asistan/AsistanOturumContext.tsx`, `lib/ai/modeller.ts`, `lib/asistan/ayseCevapla.ts`, `lib/asistan/duraklama.ts`, `lib/asistan/elevenKapi.ts`, `lib/asistan/elevenMetni.ts`, `lib/asistan/kesintiDevam.ts`, `lib/asistan/komutNiyeti.ts`, `lib/asistan/konusma.ts`, `lib/asistan/konusmaKapisi.ts`, `lib/asistan/okumaAraclari.ts`, `lib/asistan/onbellekBloklari.ts`, `lib/asistan/oturumYaz.ts`, `lib/asistan/sesAnahtarKelime.ts`, `lib/asistan/sesDevam.ts`, `lib/asistan/sesDosya.ts`, `lib/asistan/sesJetonu.ts`, `lib/asistan/sesKilit.test.ts`, `lib/asistan/sesLlm.ts`, `lib/asistan/sesMotoru.ts`, `lib/asistan/sesOmurgaV2.test.ts`, `lib/asistan/sesSaglik.ts`, `lib/asistan/sesTurKapisi.ts`, `lib/asistan/sesTurKilit.ts`, `lib/asistan/sesTurYoneticisi.ts`, `lib/asistan/sesYay.ts`, `lib/asistan/sesliOnay.ts`, `lib/asistan/soruNiyeti.ts`, `lib/db/migrations/178_ses_turu_ac.sql`, `lib/db/migrations/183_ses_omurga_v2.sql`, `lib/doktor/hastaDosyaKart.ts`, `lib/doktor/ogrenme/dosyaOnbellek.ts`, `lib/ulke/asistan/konusma.ts`, `lib/ulke/asistan/motorKilidi.ts`, `lib/ulke/asistan/sesTur.test.ts`, `lib/ulke/asistan/sesTur.ts`, `lib/ulke/asistan/sunucu.ts`, `scripts/ses-ci.mjs`, `scripts/ses-kilit.mjs`

## 2026-11-08 — Kaan written go 2026-11-08, ULKE-UZ-CANLI-01 (release/uz only): sunucu.ts reads the pack speech language (AJAN_DILI = AKTIF_KLINIK?.ses?.dilKodu ?? 'en') and carries the typed answer ported from release/au (canliYaziliCevabi); motorKilidi.ts holds the agent to the pack voice model (eleven_v4 for UZ) instead of eleven_flash_v2_5

- Onay satırı: `Kaan-onay: 2026-11-08 Kaan written go 2026-11-08, ULKE-UZ-CANLI-01 (release/uz only): sunucu.ts reads the pack speech language (AJAN_DILI = AKTIF_KLINIK?.ses?.dilKodu ?? 'en') and carries the typed answer ported from release/au (canliYaziliCevabi); motorKilidi.ts holds the agent to the pack voice model (eleven_v4 for UZ) instead of eleven_flash_v2_5`
- Taban commit: `d0e36609d`
- Değişen kilitli dosyalar: `lib/ulke/asistan/motorKilidi.ts`, `lib/ulke/asistan/sunucu.ts`
