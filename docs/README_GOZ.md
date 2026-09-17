# Göz Hastalıkları — chapter README

Chapter code and engine table: `specialties/goz-hastaliklari/README.md`.

- Pre-sprint audit: https://notya-ai.vercel.app/goz-presprint-audit.html
- Post-sprint audit: https://notya-ai.vercel.app/goz-post-sprint-audit.html
- Portal architecture (one shell, many chapters): `.cursor/skills/specialty-hasta-portali/SKILL.md`, `lib/portal/moduller.ts`
- Smoke: `scripts/goz-smoke.mts` — QA doctor `qa.goz@notya.ai` (password only in `.env.local` as `QA_GOZ_PASSWORD`), synthetic patients "TEST Goz Smoke" (67 y) and "TEST Goz Smoke Cocuk" (6 y).

## Hekim smoke path (clinic voice)

1. Hasta dosyası › **Göz** → üstte şerit: VA OD/OS (+harf), GİB OD/OS / hedef, DR evresi, sıradaki enjeksiyon.
2. **Son vizitten kopyala** → bugün ölç → "onaylıyorum" → Kaydet → **Nota ekle (O)**.
3. **Glokom**: tanı + hedef GİB + damlalar + GA/OCT aralığı → gecikmiş GA görevi.
4. **DR**: evre + DMÖ + fundus tarihi → TEMD ve ICO iki sütun → dahiliye sevkini kapat.
5. **Enjeksiyon**: SUT kontrol (muayenehane uyarısı, implant aralığı) → kaydet → **SGK rapor** taslağı, eksikler listesi.
6. **Görüntü**: OCT yükle (Görüntüleme, modalite OCT) → taslak → uzman onayı.
7. **Kontrol** ekle (dilatasyon) → hasta Sağlığım › **Gözlerim**'de görür.

## Intentional outs (not faked)

- Ayşe automatic OCT/fundus reading — dual-sign record exists, vision auto-draft not wired.
- IOL power calculation (biometer + hekim), FRAX-like proprietary tools — never.
- SUT EK-3/G GİL list contents, TOD birim guideline texts (members-only), SB görme taraması referral cut-offs — not verified → hekim teyit / not embedded.
- e-Nabız / MBYS / Medula live submission — adapters only, hekim e-imza.
