# AILE-MD-BETA — aile hekimliği saha haftası kontrol listesi

**Amaç:** Aile Hekimliği chapter `olgunluk: 'beta-hazir'`. `uzman-dogrulandi` için gerçek bir aile hekiminin 5 poliklinik günü ve Boss/CEO onayı gerekir.

**Ürün kapsamı:** ticari **birinci basamak / aile hekimliği muayenehanesi**. Tam ulusal AHIS, tanı kilidi ve uydurma doz kapsam dışıdır.

## Hazırlık

- [ ] `users.specialty = 'aile-hekimligi'` → Araçlar'da 4 tile (Aşı/tarama · Kronik · Sevk · Kohort); Hedef Boy / Dahiliye WOW / Psik yok.
- [ ] Migration 063 uygulandı: `hasta_aile`, `aile_asi_tarama`, `aile_kronik`, `aile_gorevleri`, `aile_risk` + RLS.
- [ ] `npm run test:aile` ve `npm run test:brans-sizmasi` yeşil.

## Gün 1–5 (özet)

- [ ] Aşı/tarama: doz/lot yazılmıyor; vade hatırlatması.
- [ ] Kronik DM/HT: hedef sayı ve doz yok.
- [ ] Sevk/acil: hemen bayrakta hekim onayı olmadan 409.
- [ ] Kohort hatırlatması tanı/skor/doz taşımıyor.
- [ ] Sağlık Paketim: skor/tanı/doz yok; 112 notu var.
- [ ] Yetişkin hastada Baş Çevresi yok; çocuk hastada pediatrik ölçümler açılır.
- [ ] 18 yaş altı veli dili yaşa göre.

Kaynak: `public/aile-exceptional-audit.html`, `lib/specialties/aile-hekimligi.ts`, `specialties/aile-hekimligi/engines/`.
