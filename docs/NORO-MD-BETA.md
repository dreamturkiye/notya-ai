# NORO-MD-BETA — nöroloji saha haftası kontrol listesi

**Amaç:** Nöroloji chapter `olgunluk: 'beta-hazir'`. `uzman-dogrulandi` için gerçek bir nöroloji uzmanının 5 poliklinik günü ve Boss/CEO onayı gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. İnme ünitesi / inpatient stroke HIS, tanı kilidi ve uydurma doz kapsam dışıdır.

## Hazırlık

- [ ] `users.specialty = 'noroloji'` → Araçlar'da 4 tile (İnme/TIA · MIDAS · AED izlem · Kohort); Hedef Boy / KBB / Psik / Göğüs yok.
- [ ] Migration 062 uygulandı: `hasta_noroloji`, `noro_migren`, `noro_gorevleri`, `noro_risk` + RLS.
- [ ] `npm run test:noro` ve `npm run test:brans-sizmasi` yeşil.

## Gün 1–5 (özet)

- [ ] MIDAS: eksik madde yorumlanmıyor; bant "karar desteği".
- [ ] İnme/TIA: hemen bayrakta hekim onayı olmadan 409.
- [ ] AED izlem: doz yazılmıyor.
- [ ] Kohort hatırlatması tanı/skor/doz taşımıyor.
- [ ] Nörolojimm: skor/tanı/doz yok; 112 notu var.
- [ ] 18 yaş altı veli dili yaşa göre; pediatrik büyüme / baş çevresi yok.

Kaynak: `public/noro-exceptional-audit.html`, `lib/specialties/noroloji.ts`, `specialties/noroloji/engines/`.
