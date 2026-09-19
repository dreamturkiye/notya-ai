# GC-MD-BETA — genel cerrahi saha haftası kontrol listesi

**Amaç:** Genel Cerrahi chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir genel cerrahi uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Ameliyathane planlaması, OR scheduling, full surgical HIS ve canlı Medula e-imza kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz. Klinik karar her zaman hekimindir: tanı, ilaç, doz, "risk kapandı" kararı Notya'nın işi değildir. Pre-op / yara / patoloji karar desteğidir — tanı kilidi yazılmaz.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'genel-cerrahi'` → Araçlar'da 4 genel cerrahi kartı (Pre-op · Yara/dren · Patoloji · Kohort); Hedef Boy / ortopedi / plastik tile'ları **yok**.
- [ ] Migration 073 uygulandı: `hasta_genel_cerrahi`, `gc_preop`, `gc_yara_dren`, `gc_patoloji`, `gc_gorevleri`, `gc_acil` + RLS.
- [ ] `npm run test:gc` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Genel Cerrahi sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Ameliyatım.

## Gün 1 — Pre-op checklist

- [ ] Checklist maddeleri kaydediliyor mu?
- [ ] Doz / OR slot / tanı kilidi yazılamıyor mu?

## Gün 2 — yara / dren

- [ ] Dren / dikiş tarihleri görev açıyor mu?
- [ ] Portal'da enfeksiyon tanısı / mL yorumu görünmüyor mu?

## Gün 3 — kırmızı bayrak

- [ ] Intake acil kutuları → 112 yardım metni.
- [ ] Akut karın / GI kanama / strangüle fıtık / anastomoz kaçağı yakalanıyor mu?
- [ ] Açık "hemen" bayrağı varken hekim onayı olmadan risk kaydı yazılmıyor (409) — kabul?

## Gün 4 — patoloji + kohort

- [ ] Patoloji "bekleniyor / geldi / hekim gördü" — tanı yazılmıyor mu?
- [ ] Geciken kontrol / pre-op / yara / patoloji / açık bayrak → 1-tap hatırlatma.

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Ameliyatım: kontrol + hatırlatma — tanı / doz yok.
- [ ] SOAP prompts lock: doz yok, tanı hekimde, akut karın → 112, OR scheduling yok.
- [ ] 18 yaş altı veli dili yaşa göre; baş çevresi / Neyzi hiç yok.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim onayı.
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/gc-exceptional-audit.html`, `lib/specialties/genel-cerrahi.ts`, `specialties/genel-cerrahi/engines/`.
