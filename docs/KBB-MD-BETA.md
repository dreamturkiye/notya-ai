# KBB-MD-BETA — kulak burun boğaz saha haftası kontrol listesi

**Amaç:** Kulak Burun Boğaz Hastalıkları chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir KBB uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Ameliyathane planlaması, cerrahi HIS ve koklear implant cerrahi iş akışı kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz. Klinik karar her zaman hekimindir: tanı, kayıp tipi, ilaç, doz, "risk kapandı" kararı ve SGK e-imza Notya'nın işi değildir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'kulak-burun-bogaz'` (veya "Kulak Burun Boğaz Hastalıkları") → Araçlar'da 5 KBB kartı (Otoskopi · Odyometri · Vertigo · SGK işitme · Kohort); Hedef Boy / Dahiliye / Göz / Derm / Psikiyatri tile'ları **yok**.
- [ ] Migration 057 uygulandı: `hasta_kbb`, `kbb_odyometri`, `kbb_gorevleri`, `kbb_risk` + RLS.
- [ ] `npm run test:kbb` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › KBB sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Kulaklarım.

## Gün 1 — odyometri omurgası

- [ ] 0,5 / 1 / 2 / 4 kHz eşikler: eksik frekans bırakınca PTA yorumlanmıyor mu?
- [ ] Şiddet bandı "KARAR DESTEĞİ" olarak mı okunuyor — hiçbir yerde "sensorinöral işitme kaybı tanısı" yazmıyor değil mi?
- [ ] Kayıp tipi (iletim / sensorinöral / mikst) yalnız hekim seçimiyle mi kayda geçiyor?
- [ ] İki ölçüm arası değişim cümlesi test-retest penceresini hekim dilinde doğru mu?

## Gün 2 — otoskopi + kırmızı bayrak

- [ ] Otoskopi sağ/sol TM ve dış kulak listeleri poliklinik cümlesine dönüyor mu? Tanı adı üretilmiyor mu?
- [ ] Intake kırmızı bayrak kutuları → 112 yardım metni. Form acil başvurunun yerine geçmiyor dili yeterli mi?
- [ ] Ani işitme kaybı / kontrolsüz epistaksis / hava yolu / santral vertigo / travma bayrakları doğru yakalanıyor mu?
- [ ] Açık "hemen" bayrağı varken hekim onayı olmadan risk kaydı yazılmıyor (409) — kabul?

## Gün 3 — vertigo / manevra

- [ ] Dix-Hallpike / Epley alanları: manevra sonuçları muayene bulgusu olarak mı okunuyor (BPPV tanısı yazılmıyor)?
- [ ] Santral şüphesi işaretliyken repozisyon önerilmiyor; 112 / acil dili çıkıyor mu?
- [ ] Notya hiçbir yerde doz, kür veya manevra "reçete"si yazmıyor değil mi?

## Gün 4 — SGK / kohort

- [ ] Araçlar › SGK işitme: şablon + hekimin ICD-10'u; T.C. yazılmıyor, cihaz markası/bedel yok — kabul?
- [ ] SUT kontrol listesi eksikken taslak "hazır" sayılmıyor mu?
- [ ] Kohort: geciken kontrol / yenilenmesi gereken işitme testi / açık kırmızı bayrak / OSAS sevk → 1-tap hatırlatma.
- [ ] Hatırlatma metni klinik bilgi taşımıyor mu (tanı, dB, bant, ilaç adı yok)? Açık bayrakta "sizi arayacağız" dili doğru mu?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Kulaklarım: kontrol tarihi, test/işlem hatırlatması — dB / tanı / doz yok.
- [ ] Portal alt notunda 112 var; acil portal mesajıyla yönetilmiyor.
- [ ] SOAP prompts lock (`specialties/kulak-burun-bogaz/prompts/soap-kbb.md`): doz kilidi, tanı hekimde, ani kayıp → 112.
- [ ] 18 yaş altı hastada veli dili yaşa göre açılıyor; pediatrik büyüme / baş çevresi içeriği hiç görünmüyor.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim "ürün poliklinikte işime yarıyor" onayı.
- [ ] Otoskopi / burun bulgu listeleri ve SUT / işitme cihazı kontrol listesi uzman teyidi (`specialistReview`).
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/kbb-exceptional-audit.html`, `lib/specialties/kulak-burun-bogaz.ts`, `specialties/kulak-burun-bogaz/engines/`.

Araç arayüzü ortak kütüphaneden gelir (`lib/doktor/aracUi.tsx`): manşet sayı kartı, segmentli seçim,
TASLAK rozeti ve hasta seçici diğer branşlarla aynı; KBB'ye özel olan indigo/teal vurgu ve sağ/sol
kulak satırı. Bekçiler: `lib/doktor/aracUi.test.ts`, `specialties/kulak-burun-bogaz/tests/araclarUi.test.ts`.
