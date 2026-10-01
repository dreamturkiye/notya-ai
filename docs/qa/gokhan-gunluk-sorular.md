# Dr. Gökhan — günlük kullanım QA seti (2026-10-01)

Kaan'ın talebi: "QOS'u bir hafta önceki seviyeye getir." Bu 50 soru, Dr. Gökhan'ın GERÇEK (production,
salt-okunur) panelinden türetildi ve doğrudan gerçek resolver/arama kodu çalıştırılarak denetlendi —
LLM'in ürettiği serbest metin değil, veri/erişim/eşleştirme katmanı test edildi.

**Hesap:** `dr.gokhan@notya.ai` (son giriş 2026-10-01 — aktif). `dr.gokhanmamur@gmail.com` ölü/test hesabı
(son giriş 2026-07-27, 0 oturum) — kullanılmadı. **Branş:** pediatri (gerçek veriden doğrulandı).
**Panel (4 hasta):** Umutcan Türkoğlu (DT 2024-06-15, 12 aşı kaydı, 26 lab satırı), Ayşe Yeşil
(DT 2021-08-10, kayıt yok), Ozay Bartalone (doğum tarihi kayıtlı değil), Rıdvan Dilmen (DT 2024-02-28,
kayıt yok). Hiçbir seans/not kaydı yok (0 satır) — SOAP/vizit-özeti soruları bu yüzden veri katmanında
test edilemedi, işaretlendi.

Doğrulama yöntemi: `hastaninSozunuCoz`, `sorguyuAyikla`/`klinikAramaYurut`, `fishBirimleriOku`/
`fishRakamlariOku` gerçek doktor id'si ile gerçek (production) Supabase'e karşı çalıştırıldı — salt
okuma, hiçbir yazma yapılmadı.

| # | Kategori | Soru | Sonuç | Not |
|---|---|---|---|---|
| 1 | İsim — direkt | Umutcan'ın dosyasını aç | PASS | tek eşleşme, Umutcan Türkoğlu |
| 2 | İsim — sonek yapışık | Umutcanın dosyası | PASS (bu oturumda düzeltildi) | Önceden `yok` dönüyordu — PR #508 kök nedeni: körindeks tam-hash eşleşmesi onek'i atlıyordu |
| 3 | İsim — apostrof sonek | Türkoğlu'nun aşıları ne durumda | PASS | tek eşleşme |
| 4 | İsim — sonek yapışık (soyad) | Türkoğlunun aşıları | PASS (bu oturumda düzeltildi) | Aynı kök neden, PR #508 ile düzeldi |
| 5 | İsim — apostrof sonek | Yeşil'in dosyasını getir | PASS | tek eşleşme, Ayşe Yeşil |
| 6 | İsim — sonek yapışık (Dr. Gökhan'ın gerçek şikayeti) | yeşilin dosyasını getir | PASS (bu oturumda düzeltildi) | PR #504'ün düzelttiği iç karşılaştırma, körindeks yüzünden hiç devreye girmiyordu — PR #508 bunu kapattı |
| 7 | İsim — tam ad + çekim eki | Rıdvan Dilmen'i açar mısın | PASS | tek eşleşme |
| 8 | İsim — soyad tek başına | Dilmen'in son kontrolü ne zamandı | PASS (çözümleme) / VERI YOK (içerik) | Hasta doğru çözüldü; kaydıtlı seans olmadığı için "son kontrol" tarihi zaten yok — sistemin icat etmemesi beklenir, bu run'da uçtan uca yanıt metni denetlenmedi |
| 9 | İsim — direkt | Ozay'ın kaydı var mı | PASS | tek eşleşme |
| 10 | İsim — dolaylı | Bartalone diye bir hastam var mıydı | PASS | tek eşleşme |
| 11 | İsim — yazım hatası / Türkçe karaktersiz | Umutcn Turkoglu dosyasini ac | PASS | dayanıklı |
| 12 | İsim — ASR bölünmüş bileşik | Umutçan Türk oğlu hastasını bul | PASS | mevcut regresyon testiyle aynı desen (fishAsrMetni) |
| 13 | İsim — ASR harf eksik | Ozay Bartalon diye hasta var mı | PASS | ad tarafı ("Ozay") tek adaya indiriyor, soyad eksik harfe rağmen sorun değil |
| 14 | İsim — persona adı tuzağı | Ayşe hastamı bul | PASS | NOTYA-HASTA-ODAK-01 koruması kasıtlı olarak `yok` döner (asistanın kendi adıyla aynı ad tek başına hasta saymaz) — bug değil, tasarım |
| 15 | İsim — belirsiz çoğul referans | hastamın dosyasını aç | PASS | 4 adaydan biri tahmin edilmiyor, doğru şekilde `yok` |
| 16 | İsim — ASR harf yer değişimi | Rıvdan Dilmen'in aşı karnesini göster | PASS | soyad ("Dilmen") tek başına tek adaya indiriyor |
| 17 | Filtre — sayım regresyonu | şu anda toplam kaç hastam var | PASS | NOTYA-SAYIM-ANDA-01 (29-09 düzeltmesi) hâlâ doğru: 4 |
| 18 | Filtre — bare sayım | kaç hastam var | PASS | 4 (tüm panel) |
| 19 | Filtre — yaş (negatif sonuç doğru) | 2 yaşından küçük hastalarım kimler | PASS | 0 — gerçekten kimse 2'den küçük değil (Umutcan ~27 ay, Rıdvan ~31 ay) |
| 20 | Filtre — yaş | 1 yaşından büyük hastalarım kimler | PASS | 3 (Ozay doğum tarihi kayıtlı olmadığı için hariç, doğru) |
| 21 | Filtre — kayıt varlığı + örtük pencere | aşı kaydı olan hastalarım kimler | **FAIL — ERTELENDİ** | "0 hasta" döndü ama Umutcan'ın 12 aşı kaydı var (sadece 90 günden eski) — soru hiç zaman aralığı istemediği halde örtük "son 90 gün" penceresi uygulanıyor. Kök neden bulundu, docs/OPEN-COMMITMENTS.md'ye NOTYA-ARAMA-PENCERE-VARSAYILAN-01 olarak kaydedildi |
| 22 | Filtre — ilaç yokluğu | ilaç kullanan hastam var mı | PASS (bu veri için) | 0 — gerçekten 0 ilaç kaydı var; ama aynı örtük pencere sorunu (#21) burada da geçerli, veri tesadüfen doğru çıktı |
| 23 | Filtre — kayıt tarihi penceresi | bu ay kayıt olan hastalarım | **FAIL — ERTELENDİ** | "4 hasta" (tüm panel) döndü; gerçekte Eylül'de kayıt oldular, Ekim'de (bu ay) 0 kayıt var. Kök neden: `patients.created_at` hiçbir aday-toplama sorgusunda pencereyle filtrelenmiyor — "kayıt olan" + zaman penceresi kombinasyonu hiç desteklenmiyor, bare-sayım yoluna düşüp pencereyi sessizce atlıyor. docs/OPEN-COMMITMENTS.md'ye NOTYA-ARAMA-KAYIT-PENCERE-01 olarak kaydedildi |
| 24 | Filtre — negatif alan sorgusu | doğum tarihi kayıtlı olmayan hastam var mı | **FAIL — ERTELENDİ** | "3 hasta" döndü — bunlar doğum tarihi OLAN hastalar, tam ters. "olmayan" negasyonu `dogum` kimlik alanı için hiç uygulanmıyor (asi/alerji/antibiyotik için var, dogum/yaş/cinsiyet için yok). docs/OPEN-COMMITMENTS.md'ye NOTYA-ARAMA-DOGUM-NEGASYON-01 olarak kaydedildi |
| 25 | Lab okuma — birim | Umutcan'ın hemoglobin değeri kaçtı | PASS | "on iki virgül dört g/dl" — gerçek Hb=12.4 g/dl değeri, PR #505'in birim-okuma düzeltmesi doğru çalışıyor |
| 26 | Lab okuma — birim | ferritin sonucu ne | PASS | "otuz iki mcg/l" — gerçek Ferritin=32 değeri |
| 27 | Lab okuma — ondalık, birimsiz | WBC kaç | PASS | "sekiz virgül dört" — gerçek WBC=8.4 |
| 28 | Lab okuma — iki değer birden | MCV ve MCHC değerlerini oku | PASS | "yetmiş dokuz virgül yedi fl, otuz üç virgül yedi g/dl" — gerçek MCV=79.7, MCHC=33.7 |
| 29 | Lab okuma — yüzde | Umutcan'ın Hct değeri yüzde kaç | QUESTIONABLE | "otuz altı virgül sekiz%" — sayı doğru okunuyor ama "%" işareti kelimeye çevrilmiyor ("yüzde" değil); gerçek TTS çıkışında Fish'in kendi normalizasyonuna bağlı, bu run'da sesli çıkış dinlenmedi — LLM/ses yargısı, deterministik değil |
| 30 | Lab yorumu — normal mi | Umutcan'ın topuk kanı sonuçları normal mi | LLM YARGISI | Ham kayıtlar "Negatif"/"Tarama sınırları içinde" — bunu "normal" diye özetlemek model yorumu, bu run'da test edilmedi |
| 31 | Aşı — tamlık | Umutcan'ın aşıları tam mı | LLM YARGISI | Yaşa göre TR aşı takvimiyle karF�ılaştırma gerektiriyor, bu run'da deterministik bir fonksiyon bulunup çalıştırılmadı |
| 32 | Aşı — eksik kontrolü | Umutcan'ın eksik aşısı var mı | LLM YARGISI | Aynı neden |
| 33 | Aşı — negatif (kayıt yok) | Rıdvan'a hiç aşı yapıldı mı | QUESTIONABLE | Veri katmanında doğrulandı: Rıdvan için 0 aşı satırı var — doğru temel "kayıtlı değil" olmalı; ama gerçek yanıt metninin bunu "hiç yapılmadı" diye kesin iddiaya çevirip çevirmediği bu run'da uçtan uca denetlenmedi |
| 34 | Aşı — negatif (kayıt yok) | Ayşe'nin son aşı tarihi ne | QUESTIONABLE | Aynı neden — 0 satır doğrulandı, yanıt ifadesi denetlenmedi |
| 35 | İlaç — negatif | Umutcan'ın kullandığı ilaç var mı | PASS | Veri katmanı doğrulandı: 0 ilaç satırı (tüm panelde) |
| 36 | İlaç — negatif + geçmiş | Rıdvan'a daha önce antibiyotik yazdım mı | PASS | 0 ilaç satırı doğrulandı |
| 37 | İlaç — negatif + liste | Ayşe'nin reçete geçmişini göster | PASS | 0 ilaç satırı doğrulandı |
| 38 | Randevu — jenerik | yarın randevum var mı | TEST EDİLMEDİ | `takvimSorusuCoz` bu run'da çalıştırılmadı — zaman/bütçe kapsamı dışında kaldı |
| 39 | Randevu — jenerik sayım | bugün kaç hastam geliyor | TEST EDİLMEDİ | Aynı neden |
| 40 | Randevu — hastaya özel | Umutcan'ın bir sonraki kontrolü ne zaman | TEST EDİLMEDİ | `randevular` tablosu bu hasta için bu run'da sorgulanmadı |
| 41 | Negasyon — vital | Ayşe'nin hiç ateşi olmadı mı | TEST EDİLMEDİ | Vital/anamnez veri kaynağı bu run'da incelenmedi |
| 42 | Negasyon — alerji | Umutcan'ın allerjisi var mı | TEST EDİLMEDİ | İntake formu alanları bu run'da incelenmedi |
| 43 | Negasyon — kronik hastalık | Ozay'ın kronik hastalığı var mı | TEST EDİLMEDİ | Aynı neden |
| 44 | Çoklu hasta — belirsizlik | hastamın dosyasını aç | PASS | bkz. #15 — 4 adaydan biri tahmin edilmiyor |
| 45 | Çoklu hasta — persona çakışması | Ayşe'yi aç | PASS (aynı kod yolu, #14 ile) | Bu tam ifade ayrıca çalıştırılmadı ama #14 ile aynı koruma mekanizması geçerli |
| 46 | Sohbet — selamlaşma | Bugün nasılsın Ayşe | LLM YARGISI | Deterministik doğrulama kapsamı dışı |
| 47 | Sohbet — yetenek sorusu | Sen neler yapabilirsin | LLM YARGISI | Aynı neden |
| 48 | Sohbet — kapanış | Teşekkürler, iyi çalışmalar | LLM YARGISI | Aynı neden |
| 49 | SOAP — not taslağı | Ayşe için SOAP notu taslağı hazırla | LLM YARGISI + VERİ YOK | Hem üretken/sübjektif hem de bu hastada hiç geçmiş vizit yok |
| 50 | SOAP — not okuma | Rıdvan'a son yazdığım notu oku | VERİ YOK | 0 not kaydı — sistemin "kayıtlı not yok" demesi beklenir, bu run'da uçtan uca denetlenmedi |


**Ek: Kaan'ın canlı doktor-paneli testinden gelen 4 yeni bulgu (2026-10-01, PR #510)** — ayrı bir oturumda, gerçek bir kullanım sırasında bulundu; kayıt dışı kalmaması için aynı tabloya eklendi.

| # | Kategori | Soru | Sonuç | Not |
|---|---|---|---|---|
| 51 | Ses — çapraz hasta (kritik) | (sesli kanalda herhangi bir soru; metin Umutcan Türkoğlu'nun cevabını gösterirken ses Ayşe Yeşil'in cevabını okudu, aynı tur) | **FAIL — MİTİGASYON (#510), kök neden KANITLANMADI** | Kaan canlı: metin doğru hastayı gösterdi, ses aynı anda başka bir hastanınkini okudu. Loglardan doğrulanmadı (bu run'da zaman/bütçe nedeniyle production log incelemesi yapılmadı). docs/OPEN-COMMITMENTS.md'deki NOTYA-SES-TUR-02 (iptal edilen bir ilk turun beyin çağrısının sunucuda durdurulmadan çalışmayı sürdürüp cevabını sonradan oturum kaydına yazması) kayıtlı TEK aday mekanizma olduğu için kapatıldı — fish-tur rotasının `cancel()`'ından `ayseCevapla`'ya artık bir `AbortSignal` taşınıyor, iptal edilen tur oturum kaydına hiç yazmıyor. Bu kanıtlanmış bir kök-neden düzeltmesi değil, savunma amaçlı bir kapatma — tekrarı izlenmeli. |
| 52 | Dosya sorgusu — alakasız mesaj | Bir tane Tesla elektrikli araba almayı planlıyorum. | **FAIL — DÜZELTİLDİ (#510)** | Kaan canlı: yeni, tamamen alakasız bir sohbette bu mesaj Umutcan Türkoğlu'nun vizit planını aynen döndürdü. Kök neden: `dosyaSoruCevap`'taki `/plan/` deseni sınır (boundary) içermiyordu, "planlıyorum" içindeki "plan" alt dizisiyle eşleşti ve sayfanın/oturumun aktif hastasına (NOTYA-SAYFA-HASTA-01 + NOTYA-AKTIF-HASTA-01) bağlı dosya cevabını tetikledi. Düzeltildi: NOTYA-DOSYA-SORU-PLAN-01, regresyon testiyle. |
| 53 | Ses — uzun özet kesintisi | (sesli kanalda) hastanın özetini oku | **FAIL — DÜZELTİLDİ (#510)** | Kaan canlı: "2-3 satır okudu, 'devamı ekranınızda' deyip durdu — doktor araba sürüyorsa yarısı olursa voice ile olmaz." Dosya-kanıtı (özet/değişim/büyüme/aşı/lab/ilaç/...) yanıtları artık sesli kanalda sınırsız okunuyor; 5-cümle sınırı (NOTYA-SES-SLUR-01, gerçek bir geç-tur peltekleşmesi için eklenmişti) yalnız sıradan sohbette kalıyor. Düzeltildi: NOTYA-SES-OZET-TAM-01, regresyon testiyle. |
| 54 | Ses — birim okuma (derece) | (sesli kanalda) "ateşi 39°C" | **FAIL — DÜZELTİLDİ (#510)** | Kaan canlı: "39°C" sesli "otuzdokuz çiş ateş" diye okundu — `BIRIM_ESLESME`'de (#505) derece işareti için hiç kural yoktu. Düzeltildi: NOTYA-TTS-BIRIM-02, `°C` / bare `°` artık "derece"ye çevriliyor, regresyon testiyle. |
| 55 | Dosya sorgusu — vizit türü yoksayılıyor | Umutcan Türkoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | **FAIL — ERTELENDİ** | Kaan canlı: en son vizitin (alakasız) özetini döndürdü, istenen vizit TÜRÜNÜ hiç aramadı. Kök neden kesin: `kanit.ts`'teki `ozetBolumu()` her zaman tüm dosyanın genel özetini üretiyor, tek bir vizit türüne göre filtreleme hiç yok. Düzeltme deseni biliniyor (`benzerBolumu`'nünkiyle aynı) ama yeni bir vizit-türü sözlüğü gerektiriyor; klinik yüzeyde regresyon riski nedeniyle bu run'da ERTELENDİ — bkz. docs/OPEN-COMMITMENTS.md, NOTYA-DOSYA-SORU-TUR-01. |

## Özet

- **PASS: 29** (isim çözümleme 15, filtre 3, lab okuma 4, ilaç negatifi 3, çoklu-hasta 2, randevu/SOAP veri-yok durumları ayrı sayıldı)
- **Bu oturumda bulunup düzeltilen: 3** (#2, #4, #6 — tek kök neden, PR #508)
- **FAIL — ertelendi (kök neden bulundu, kapsam/risk nedeniyle bu run'da düzeltilmedi): 3** (#21, #23, #24 — bkz. docs/OPEN-COMMITMENTS.md)
- **QUESTIONABLE (veri doğru, ifade/ses katmanı denetlenmedi): 3** (#29, #33, #34)
- **LLM yargısı (deterministik denetim kapsamı dışı): 8** (#30, #31, #32, #46, #47, #48, #49 kısmen)
- **Test edilmedi (bütçe/kapsam): 7** (#38, #39, #40, #41, #42, #43, #50)


## NOTYA-KAPSAM-01 — kapsam kilidi (2026-10-01, Kaan canlı: Tesla / hava durumu)

Beklenen: kapsam-dışı soruya TEK sabit ret cümlesi (ekran = ses), kapsam-içi soru normal cevap. Birim testi: `lib/asistan/kapsamKilidi.test.ts`.

| # | Soru | Beklenen |
|---|---|---|
| K1 | Tesla almak istiyorum | RET (sabit cümle) |
| K2 | Peki Model Y mi Model 3 mü daha iyi (K1'den hemen sonra) | RET (aynı konu devamı) |
| K3 | Yarın hava nasıl olacak | RET |
| K4 | Fenerbahçe maçı kaç kaç bitti | RET |
| K5 | Dolar kaç TL / bitcoin al mı | RET |
| K6 | Bana yemek tarifi ver | RET |
| K7 | Hasta ateşi hava sıcaklığına bağlı olabilir mi | CEVAP (klinik soru) |
| K8 | Amoksisilin 12 kg çocuk için doz | CEVAP |
| K9 | Bugün kaç randevum var | CEVAP (takvim) |
| K10 | Teşekkürler / tamam / tekrar söyler misin | CEVAP (sosyal tur) |
| K11 | Sen kimsin | CEVAP |
| K12 | Açılış selamı (yerel saat / hava) | DEĞİŞMEZ — yalnız kullanıcı SORUSU kapılanır |
