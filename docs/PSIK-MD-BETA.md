# PSIK-MD-BETA — psikiyatri saha haftası kontrol listesi

**Amaç:** Psikiyatri (Ruh Sağlığı ve Hastalıkları) chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir psikiyatristin 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Kapalı servis, istemsiz yatış yönetimi ve adli psikiyatri kurul işlemleri kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz. Ruh sağlığı verisi en hassas veri sınıfıdır. Klinik karar her zaman hekimindir: DSM-5-TR tanısı, ilaç, doz, "risk kapandı" kararı ve SGK e-imza Notya'nın işi değildir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'psikiyatri'` (veya "Ruh Sağlığı ve Hastalıkları") → Araçlar'da 5 psikiyatri kartı (PHQ-9/GAD-7 · Güvenlik triyaj · Psikotrop izlem · Rapor & reçete · Kohort); Hedef Boy / Dahiliye / Göz / Derm / KD tile'ları **yok**.
- [ ] Migration 056 uygulandı: `hasta_psik`, `psik_olcek`, `psik_gorevleri`, `psik_risk` + RLS.
- [ ] `npx tsx --test specialties/psikiyatri/tests/*.test.ts lib/portal/ruhsagligim.test.ts lib/doktor/doktorAraclari.test.ts lib/portal/moduller.test.ts` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Psikiyatri sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Ruh Sağlığım.

## Gün 1 — ölçek omurgası

- [ ] PHQ-9 çalışma sayfası: 9 madde, Türkçe ifadeler sahada anlaşılıyor mu? Eksik madde bırakınca toplam yorumlanmıyor mu?
- [ ] Şiddet bandı "KARAR DESTEĞİ" olarak mı okunuyor — hiçbir yerde "depresyon tanısı" yazmıyor değil mi?
- [ ] GAD-7 ve CGI-S/CGI-I: klinisyen değerlendirmesi hasta yüzüne düşmüyor mu?
- [ ] İki vizit arası değişim cümlesi ("%50 azalma — yanıt olarak yorumlanabilir") hekim dilinde doğru mu?

## Gün 2 — güvenlik / acil akışı

- [ ] Intake kırmızı bayrak kutuları → 112 yardım metni. Form acil başvurunun yerine geçmiyor dili yeterli mi?
- [ ] PHQ-9 9. madde pozitif → güvenlik değerlendirmesi uyarısı çıkıyor mu?
- [ ] Araçlar › Güvenlik triyaj: "hemen" bayrağı varken hekim onayı olmadan kayıt yazılmıyor (409) — kabul?
- [ ] Güvenlik kontrol listesi (yöntem erişimi, destek kişisi, kriz planı) poliklinik akışına uyuyor mu?

## Gün 3 — psikotrop izlem

- [ ] Lityum / valproat / klozapin / atipik AP / SSRI izlem görevleri: aralıklar sahada doğru mu?
- [ ] Notya hiçbir yerde doz, titrasyon veya kesme şeması yazmıyor değil mi?
- [ ] Onaylı lab tarihleri görev vadesini düşürüyor mu; taze tetkikte görev üretilmiyor mu?

## Gün 4 — SGK / reçete + kohort

- [ ] Araçlar › Rapor & reçete: şablon + hekimin ICD-10'u; T.C. yazılmıyor, doz alanı yok — kabul?
- [ ] Kontrole tabi ilaçta "Renkli Reçete Sistemi" uyarısı doğru mu (kırmızı / yeşil; uydurma kategori yok)?
- [ ] Kohort: PHQ yüksek / açık güvenlik bayrağı / geciken kontrol / geciken düzey → 1-tap hatırlatma.
- [ ] Hatırlatma metni klinik bilgi taşımıyor mu (tanı, ölçek adı, skor, ilaç adı yok)? Açık bayrakta "sizi arayacağız" dili doğru mu?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Ruh Sağlığım: kontrol tarihi, "doldurulacak kısa form", "ilaç güvenlik kan testi" — skor/tanı/ilaç yok.
- [ ] Portal alt notunda 112 var; risk portal mesajıyla yönetilmiyor.
- [ ] SOAP prompts lock (`specialties/psikiyatri/prompts/soap-psik.md`): doz kilidi, tanı hekimde, özkıyım → 112.
- [ ] 18 yaş altı hastada veli dili yaşa göre açılıyor; pediatrik büyüme / baş çevresi içeriği hiç görünmüyor.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim "ürün poliklinikte işime yarıyor" onayı.
- [ ] Ölçek Türkçe madde metinleri ve SUT / reçete kontrol listesi uzman teyidi (`specialistReview`).
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/psik-exceptional-audit.html`, `lib/specialties/psikiyatri.ts`, `specialties/psikiyatri/engines/`.

Araç arayüzü ortak kütüphaneden gelir (`lib/doktor/aracUi.tsx`): manşet sayı kartı, segmentli seçim,
TASLAK rozeti ve hasta seçici beş branşla aynı; psikiyatriye özel olan yalnız indigo vurgu ve
PHQ-9 / GAD-7 madde satırı. Bekçiler: `lib/doktor/aracUi.test.ts`, `specialties/psikiyatri/tests/araclarUi.test.ts`.
