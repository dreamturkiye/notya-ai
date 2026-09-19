# FTR-MD-BETA — fizik tedavi saha haftası kontrol listesi

**Amaç:** Fizik Tedavi chapter `olgunluk: 'beta-hazir'`. `uzman-dogrulandi` için gerçek bir FTR uzmanının 5 poliklinik günü ve Boss/CEO onayı gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Tam hastane rehabilitasyon HIS, tanı kilidi ve uydurma ilaç dozu kapsam dışıdır.

## Hazırlık

- [ ] `users.specialty = 'fizik-tedavi'` → Araçlar'da 4 tile (Seans · VAS/ODI · Ev egzersiz · Kohort); Hedef Boy / Ortopedi / Nöro yok.
- [ ] Migration 065 uygulandı: `hasta_fizik_tedavi`, `ftr_seans`, `ftr_olcek`, `ftr_egzersiz`, `ftr_gorevleri`, `ftr_risk` + RLS.
- [ ] `npm run test:ftr` ve `npm run test:brans-sizmasi` yeşil.

## Gün 1–5 (özet)

- [ ] VAS/ODI: eksik madde yorumlanmıyor; bant "karar desteği".
- [ ] Kırmızı bayrak: hemen/aynı gün bayrakta hekim onayı olmadan 409.
- [ ] Seans / ev egzersiz: ilaç dozu yazılmıyor.
- [ ] Kohort hatırlatması tanı/skor/doz taşımıyor.
- [ ] FTR'm: skor/tanı/doz yok; 112 notu var.
- [ ] 18 yaş altı veli dili yaşa göre; pediatrik büyüme / baş çevresi yok.

Kaynak: `public/ftr-exceptional-audit.html`, `lib/specialties/fizik-tedavi.ts`, `specialties/fizik-tedavi/engines/`.
