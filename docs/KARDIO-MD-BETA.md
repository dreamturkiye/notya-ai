# KARDIO-MD-BETA — kardiyoloji saha haftası kontrol listesi

**Amaç:** Kardiyoloji chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir kardiyoloji uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Cath lab planlama, invaziv laboratuvar HIS ve canlı Medula e-imza kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz. Klinik karar her zaman hekimindir: tanı, ilaç, doz, SCORE2 kova kilidi ve SGK e-imza Notya'nın işi değildir.

## Hazırlık

- [ ] Hekim hesabı `users.specialty = 'kardiyoloji'` → Araçlar'da 4 kart (SCORE2 · HT/KKY · SGK · Kohort); Hedef Boy / Dahiliye / Göz tile'ları **yok**.
- [ ] Migration 059 uygulandı: `hasta_kardiyoloji`, `kardio_score2`, `kardio_izlem`, `kardio_gorevleri`, `kardio_risk` + RLS.
- [ ] `npm run test:kardiyoloji` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Kardiyoloji, Araçlar › Kohort, Sağlığım › Kalbim.

## Gün 1 — SCORE2

- [ ] Girdiler eksikken risk üretilmiyor mu?
- [ ] Bant "KARAR DESTEĞİ" olarak mı okunuyor?
- [ ] Doz / statin reçetesi yazılmıyor değil mi?

## Gün 2 — HT / KKY + kırmızı bayrak

- [ ] HT/KKY izlem görevleri sınıf düzeyinde mi?
- [ ] Intake acil kutuları → 112. Form acil yerine geçmiyor.
- [ ] Açık bayrakta hekim onayı olmadan risk kaydı 409.

## Gün 3 — SGK / kohort

- [ ] SGK taslak: T.C. yok, doz yok, ICD hekimde.
- [ ] Kohort hatırlatması klinik sayı taşımıyor mu?

## Gün 4 — portal + SOAP

- [ ] Kalbim: kontrol / ölçüm hatırlatması — SCORE2 % / tanı / doz yok.
- [ ] SOAP lock: doz yok, tanı hekimde, göğüs ağrısı → 112.
- [ ] 18 yaş altı veli dili yaşa göre; baş çevresi yok.

## Çıkış (Boss)

- [ ] 5 gün notları + hekim onayı → `uzman-dogrulandi` (ayrı commit).

Kaynak: `public/kardio-exceptional-audit.html`, `lib/specialties/kardiyoloji.ts`.

### Branş sızıntısı (ship notu)
- **Eklenen:** Kardiyoloji Araçlar (4), Kalbim portal, Home, SCORE2/HT-KKY/SGK/Kohort/acil motorlar
- **Sınıf:** specialty-only — **kardiyoloji only** (NOT dahiliye, NOT kalp-damar-cerrahisi, NOT pediatri, NOT göğüs)
- **Kapı:** `BRANS_DOKTOR_ARACLARI` + `kardiyolojiSekmesiBransi` + `portal` eligibility doctor_specialty
- **Varsayılan:** baseline — pediatri değil
- **Test:** sahibi var ✅, yabancı branş yok ✅
