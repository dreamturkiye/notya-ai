# KBB-MD-BETA — kulak burun boğaz saha haftası kontrol listesi

**Amaç:** Kulak Burun Boğaz Hastalıkları chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir KBB uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Ameliyathane planlama, cerrahi HIS ve koklear implant cerrahi iş akışı kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz. Klinik karar her zaman hekimindir: tanı, kayıp tipi, ilaç, doz, girişim kararı ve SGK e-imza Notya'nın işi değildir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'kulak-burun-bogaz'` (veya "Kulak Burun Boğaz Hastalıkları" / "KBB") → Araçlar'da 5 KBB kartı (Otoskopi · Odyometri · Vertigo · SGK işitme raporu · Kohort); Hedef Boy / Dahiliye / Göz / Derm / KD / Psikiyatri tile'ları **yok**.
- [ ] Migration 057 uygulandı: `hasta_kbb`, `kbb_odyometri`, `kbb_gorevleri`, `kbb_risk` + RLS.
- [ ] `npm run test:kbb` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › KBB sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Kulaklarım.

## Gün 1 — muayene omurgası

- [ ] Otoskopi kontrol listesi: sağ/sol dış kulak yolu ve TM görünümleri sahadaki dilinize uyuyor mu? Eksik bir görünüm var mı?
- [ ] Muayene edilmeyen kulak sessizce "normal" sayılmıyor, eksik olarak işaretleniyor — kabul?
- [ ] "Bu vizitte karar" başlıkları (perforasyon, bombe, akıntı, yabancı cisim) doğru yerde mi çıkıyor?
- [ ] Not hiçbir yerde tanı adı yazmıyor değil mi (otit, kolesteatom, sinüzit)?

## Gün 2 — odyometri

- [ ] 0,5 / 1 / 2 / 4 kHz eşik girişi cihaz çıktısıyla aynı sırada mı? Kemik yolu için ayrı alan gerekiyor mu (saha talebi)?
- [ ] Bant sınırları (≤25 / 26–40 / 41–55 / 56–70 / 71–90 / >90) pratiğinize uyuyor mu?
- [ ] Eksik frekansta ortalama yorumlanmıyor — kabul? Araç hiçbir yerde eşik uydurmuyor değil mi?
- [ ] Önceki ölçümle 10 dB test-retest penceresi doğru mu? Asimetri eşiği 15 dB doğru mu?
- [ ] Kayıp tipini (iletim / sensorinöral / mikst) yalnız siz seçiyorsunuz — ürün hiç atamıyor, kabul?

## Gün 3 — vertigo + kırmızı bayrak

- [ ] Manevra listesi (Dix-Hallpike · supine roll · Epley · barbekü · head impulse · Romberg) yeterli mi?
- [ ] Santral şüphesi işaretleri doğru mu? İşaretliyken ürün manevra yerine acil diyor — kabul?
- [ ] Intake kırmızı bayrak kutuları → 112 yardım metni. Form acil başvurunun yerine geçmiyor dili yeterli mi?
- [ ] "Hemen" bayrağı varken hekim onayı olmadan kayıt yazılmıyor (409) — poliklinik akışını yavaşlatıyor mu?
- [ ] Kırmızı bayrak kontrol listesi (başlangıç zamanı, taraf, nörolojik bulgu, hava yolu, antikoagülan, travma) eksiksiz mi?

## Gün 4 — SGK / rapor + kohort

- [ ] Araçlar › SGK işitme raporu: 5 şablon sahadaki rapor türlerini karşılıyor mu?
- [ ] SUT kontrol listesi maddeleri güncel mi? Odyolojik güncellik penceresi (365 gün) doğru mu?
- [ ] T.C. kimlik numarası, cihaz markası ve bedel yazılmıyor — kabul?
- [ ] Kohort: geciken kontrol / geciken işitme testi / açık kırmızı bayrak / bekleyen OSAS sevki → 1-tap hatırlatma.
- [ ] Hatırlatma metni klinik bilgi taşımıyor mu (tanı, dB, bant, ilaç adı yok)? Açık bayrakta "sizi arayacağız" dili doğru mu?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Kulaklarım: kontrol tarihi, "işitme testi randevusu", "uyku tetkiki randevusu", işlem/bakım — dB / bant / tanı / ilaç yok.
- [ ] Kulak bakımı ipuçları hastaya söylediklerinizle uyuşuyor mu?
- [ ] Portal alt notunda 112 var; acil portal mesajıyla yönetilmiyor.
- [ ] SOAP prompts lock (`specialties/kulak-burun-bogaz/prompts/soap-kbb.md`): doz kilidi, tanı hekimde, kırmızı bayrak → 112, ölçüm uydurma yasağı.
- [ ] 18 yaş altı hastada veli dili yaşa göre açılıyor; pediatrik büyüme / baş çevresi / Neyzi içeriği hiç görünmüyor (`pediatrikBaglam: 'asla'`).

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim "ürün poliklinikte işime yarıyor" onayı.
- [ ] Odyolojik bant sınırları, manevra listesi ve SUT / işitme cihazı kontrol listesi uzman teyidi (`specialistReview`).
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/kbb-exceptional-audit.html`, `lib/specialties/kulak-burun-bogaz.ts`, `specialties/kulak-burun-bogaz/engines/`.

Araç arayüzü ortak kütüphaneden gelir (`lib/doktor/aracUi.tsx`): manşet sayı kartı, segmentli seçim,
TASLAK rozeti ve hasta seçici altı branşla aynı; KBB'ye özel olan yalnız indigo/teal vurgu ve
kulak (sağ / sol / iki) satırı. Bekçiler: `lib/doktor/aracUi.test.ts`, `lib/doktor/doktorAraclari.test.ts`.
