# ACIL-MD-BETA — acil tıp saha haftası kontrol listesi

**Amaç:** Acil Tıp chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir acil tıp uzmanının 5 klinik günü** ve **Boss/CEO'nun açık onayı** gerekir.

**Ürün kapsamı:** ticari **acil tıp / acil servis** klinik akışı. Full ED bed board HIS, yatış boarding HIS, tanı auto-lock, uydurma doz ve canlı Medula e-imza kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz. Klinik karar her zaman hekimindir: tanı, ilaç, doz, "risk kapandı" kararı Notya'nın işi değildir. ESI / kritik yol bayrakları karar desteğidir — STEMI / inme tanısı yazılmaz.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'acil-tip'` → Araçlar'da 4 acil kartı (ESI · Kritik yol · Sevk · Kohort); Hedef Boy / SCORE2 / İnme tile'ları **yok**.
- [ ] Migration 078 uygulandı: `hasta_acil_tip`, `at_esi`, `at_kritik_yol`, `at_sevk`, `at_gorevleri`, `at_risk` + RLS.
- [ ] `npm run test:acil` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Acil Tıp sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Acil sonrası takip.

## Gün 1 — ESI

- [ ] ESI 1–5 + kaynak: ESI 1'de resus kaynağı zorunlu mu?
- [ ] Seviye "KARAR DESTEĞİ" — hiçbir yerde "tanı kilitlendi" yazmıyor değil mi?

## Gün 2 — kritik yol

- [ ] STEMI / inme / travma bayrakları checklist açıyor mu?
- [ ] Tanı auto-lock yok; kardiyoloji SCORE2 / nöroloji İnme tile sızmıyor mu?

## Gün 3 — sevk / risk

- [ ] Sevk/yatış paket boarding HIS vaadi taşımıyor mu?
- [ ] Açık "hemen" bayrağı varken hekim onayı olmadan risk kaydı yazılmıyor (409) — kabul?

## Gün 4 — kohort

- [ ] ESI 1–2 / kritik yol / geciken kontrol / açık bayrak → 1-tap hatırlatma.
- [ ] Hatırlatma tanı / doz / ESI sayı taşımıyor mu?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Acil sonrası takip: kontrol + hatırlatma — ESI sayı / skor yok; kısa takip (ED dürüstlüğü).
- [ ] SOAP prompts lock: doz yok, tanı hekimde, bed board HIS yok, resus → hemen eylem.
- [ ] 18 yaş altı veli dili yaşa göre; baş çevresi / Neyzi hiç yok.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim onayı.
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/acil-exceptional-audit.html`, `lib/specialties/acil-tip.ts`, `specialties/acil-tip/engines/`.
