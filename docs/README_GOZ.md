# Göz Hastalıkları — chapter README

Chapter code and engine table: `specialties/goz-hastaliklari/README.md`.

- **Post-exceptional audit (GOZ-EXCEPTIONAL-01, 2026-09-18):** https://notya-ai.vercel.app/goz-exceptional-audit.html — 16/16 domains Strong, 5 göz-only Araçlar, olgunluk `beta-hazir` (MD sign-off pending)
- Final audit (2026-09-18, honest ~72%, pre-sprint for the exceptional sprint): https://notya-ai.vercel.app/goz-final-audit.html — supersedes remaining-gaps ~90% claim
- MD saha haftası kontrol listesi: `docs/GOZ-MD-BETA.md`
- Pre-sprint audit: https://notya-ai.vercel.app/goz-presprint-audit.html
- Post-sprint audit: https://notya-ai.vercel.app/goz-post-sprint-audit.html
- Remaining-gaps (historical): https://notya-ai.vercel.app/goz-remaining-gaps-audit.html
- Portal architecture (one shell, many chapters): `.cursor/skills/specialty-hasta-portali/SKILL.md`, `lib/portal/moduller.ts`
- Smoke: `scripts/goz-smoke.mts` (57/0) — QA doctor `qa.goz@notya.ai` (password only in `.env.local` as `QA_GOZ_PASSWORD`), synthetic patients "TEST Goz Smoke" (67 y) and "TEST Goz Smoke Cocuk" (6 y).
- Exceptional smoke: `scripts/goz-exceptional-smoke.mts` (88/0) — every GOZ-EXCEPTIONAL-01 step incl. a live Tier A call; synthetic "TEST Goz Exc Yetiskin" (67 y) + "TEST Goz Exc Bebek" (2 ay).

## Hekim smoke path (clinic voice)

1. Hasta dosyası › **Göz** → üstte şerit: VA OD/OS (+harf), GİB OD/OS / hedef, DR evresi, sıradaki enjeksiyon.
2. **Son vizitten kopyala** → bugün ölç → "onaylıyorum" → Kaydet → **Nota ekle (O)**.
3. **Glokom**: tanı + hedef GİB + damlalar + GA/OCT aralığı → gecikmiş GA görevi.
4. **DR**: evre + DMÖ + fundus tarihi → TEMD ve ICO iki sütun → dahiliye sevkini kapat.
5. **Enjeksiyon**: SUT kontrol (muayenehane uyarısı, implant aralığı) → kaydet → **SGK rapor** taslağı, eksikler listesi.
6. **Görüntü**: OCT yükle (Görüntüleme, modalite OCT) → taslak → uzman onayı.
7. **Kontrol** ekle (dilatasyon) → hasta Sağlığım › **Gözlerim**'de görür.
8. **RAPD** + **refraksiyon** (ölçüm bloğu) → **Şeridi Objektif'e yaz**.
9. **Fundus** Kaydet → **DR evresini güncelle** (hekim seçer + onaylar) · **DR** › lazer kaydı (PRP / fokal / grid).
10. **Glokom** › Shaffer / Spaeth, pakimetri, GA cihaz · EGS ön ayarı ("öneri — hekim kilitler").
11. **Enjeksiyon** › "yapıldı" → IVT odası listesi (onam, göz işareti, ilaç + lot, asepsi).
12. **Katarakt** › biyometri (GİL gücü yok) + post-op 1. gün / 1. hafta · **SGK rapor** › GİL bilgi notu.
13. **Ön segment** › biyomikroskopi OD/OS + keratokonus · **Görüntü** › Asistana raporla / Belge'den aktarılan taslak → uzman onayı.
14. **Pediatrik** (yalnız çocuk) › cover / Hirschberg / Krimsky, bebekte ROP kartı · **Acil** bandı › şablon + yıkama zamanlayıcısı.
15. **Araçlar** › Göz kohort → 1-tap hatırlatma.

## Intentional outs (not faked)

- ~~Ayşe automatic OCT/fundus reading~~ — **shipped (GOZ-EXCEPTIONAL-01):** Belge Tier A → dual-sign draft, uzman approves; no stage ever written.
- IOL power calculation (biometer + hekim), FRAX-like proprietary tools — never.
- SUT EK-3/G GİL list contents, TOD birim guideline texts (members-only), SB görme taraması referral cut-offs — not verified → hekim teyit / not embedded.
- e-Nabız / MBYS / Medula live submission — adapters only, hekim e-imza (draft + kilit + "Medula'da hekim" CTA).
- SMS gateway (`TWILIO_SMS_FROM` not configured) — recall goes via Sağlığım message + e-posta bildirimi + dönüş görevi + doctor's own WhatsApp.
- Oküloplastik / uvea / nöro-oftalmoloji chapters — next chapter, not on the 16-domain matrix.
