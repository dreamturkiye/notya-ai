# OPEN COMMITMENTS — Notya AI

**Why this file exists.** Work agreed in a session and deferred to "next time" was getting lost and
resurfacing weeks later as "why was this never done?". Chat history is not a tracking system.
Anything deferred goes here with a date and who it waits on, or it does not count as agreed.

Last reviewed: 2026-09-19 (NOTYA-EYLEM düzeltme turu — sessiz yol kapandı, ilaç uyarıları kartta)

---

## Standing rule — mobile check on every change (Kaan, 2026-09-13)

Every new feature, UI change, or fix Claude ships to Notya from now on must be verified to
display and work correctly on mobile devices (iPhone and Samsung/Android web) before being
considered done — not just typechecked. This applies going forward to all surfaces: doktor
dashboard, İnceleme, not sayfası, reçete, Sağlığım portal, intake forms, everything.

Practical check for each PR that touches UI, before calling it finished:
- Screenshot or render at a real mobile width (390px iPhone, 360px Galaxy) — claude-in-chrome
  navigate + screenshot at that viewport, or the visualizer mockup tool when no live page exists yet.
- Confirm: no horizontal overflow, buttons/inputs reachable and not cut off, text wraps instead of
  truncating silently, touch targets aren't so small they're unusable, modals/panels fit the screen.
- If a change is desktop-only by nature (e.g. a purely server-side calc with no new UI), no mobile
  check is needed — but any new button, form, panel, badge, or page does need one.
- Record what was checked (and any gap found) in the PR description / ledger, same as other work.

## ASI-KARNESI-01 — aşı karnesi fotoğrafından okuma + dijital aşı karnesi + hekim onaylı hatırlatma (2026-09-19)

**Kaynak — Dr. Gökhan Mamur (pediatri, gerçek beta hekim), aynen:** *"Burada bir resim yükleme düğmesi olmalı. Diyelim ki
hasta doktora 2 yaşındayken ilk kez geldi. Doktoru hastanın elindeki aşı karnesinin resmini çekip bu sayfadaki resim
yükle dosyasına yüklesin. Orada AI aşı karnesini okuyup tüm aşıları bu sistemdeki aşı kayıtlarına geçsin. Sonra, bir de
dijital aşı karnesi olmalı ebeveynin cep telefonundan ulaşabileceği. Türkiye'de hâlâ anne babalar kağıda yazılmış aşı
kayıtlarını ellerinde taşıyorlar, param parça oluyor."*

**Kaan'ın üç kararı (2026-09-19, bağlayıcı):**
1. **Onay biçimi: TOPLU ONAY + satır düzeltme.** Hekim okunan listeyi görür, her satırı (aşı adı, doz, tarih) düzeltir ya
   da çıkarır, tek düğmeyle hepsini onaylar ("belki okunan bir veri doğru scan edilmedi"). Onaysız satır YOK.
2. **Karneden okunan aşılar GÖRSEL OLARAK AYRI** — klinikte uygulanan dozlarla karışmaz.
3. **Hatırlatma HEKİM ONAYIYLA.** Yaklaşan aşılar hekime listelenir, hekim açıp bakar, onaylayıp gönderir. Otomatik gönderim YOK.

### A+B — karne yükle ve oku, görsel ayrım (PR 1)
- Hasta dosyası › Aşılar › **📷 Aşı karnesi yükle** (`components/doktor/AsiKarnesiOkuma.tsx`): "Fotoğraf çek"
  (`accept="image/*" capture="environment"` — telefonda kamera doğrudan açılır) + "Dosya seç" (fotoğraf/PDF). Büyük telefon
  fotoğrafı istemcide ≤ 2400 px JPEG'e küçültülür (4 MB Kasa sınırı + model görüntü sınırı). Belge **MEVCUT Kasa yolundan**
  (`POST /api/doktor/documents`, kategori "Aşı karnesi", şifreli `medical_documents`) kaydedilir — yeni saklama yolu yok.
- Okuma: `POST /api/doktor/asilar/karne { adim: 'oku' }` → Kasa belgesi `lib/ai/cagir.ts` üzerinden görev
  **`goruntu-inceleme` = GÜÇLÜ (Sonnet)**. Neden: görüntü okuması hekimin karar verdiği klinik veridir; skill
  `ai-model-politikasi` "görüntü ve inceleme — istisnasız GÜÇLÜ" der ve cagir.ts'in görsel emniyeti zaten yükseltir — yine
  de doğru görev tipi verildi (HIZLI'ya hiç alınmadı). Sabit talimat (`KARNE_SISTEM`) `onbellek: true` — hasta verisi system
  bloğunda yok, prompt caching bozulmaz. Hasta adı modele gitmez; model kişi adı/TC aktarmaz, yalnız doğum tarihi (kimlik
  uyarısı için, kaydedilmez).
- **Uydurma yok** (`lib/asi/karneOkuma.ts`): model "emin değilim" dediği satırda verdiği tarih/doz ATILIR; okunamayan alan,
  yalnız ay/yıl, takvimde olmayan gün, gelecek ya da doğumdan önceki tarih null → satır **"Okunamadı — elle girin"**.
  Kısmi okuma normal; iyi satırlar yanında okunamayanlar kırmızı işaretli gelir.
- **SB Ulusal Aşı Takvimi eşleşmesi**: pediatri aşı motorunun `kayitSerisi` eşleştirmesi (takvim kopyalanmadı —
  `lib/asi/ulusalAsiTakvimi.ts` tek kaynak). Onay ekranında iki grup: "SB Ulusal Aşı Takvimi" ve "Özel / takvim dışı aşılar".
- **Toplu onay**: `{ adim: 'onayla', hekimOnayi: true }` — yalnız hekim (sekreter 403); `hekimOnayi !== true` → 400; okunamadı
  satır hekim düzeltmeden ya da "karneyle karşılaştırdım, böyle kalsın" demeden gelirse TÜM istek reddedilir (yarım kayıt
  yok). Yazılan satır: `kaynak='beyan'`, `belge_id` (Kasa kanıt izi), `hekim_onay_at`, notlar öneki.
- **Görsel ayrım**: Aşılar listesinde her satırda paylaşılan `Rozet` (`lib/doktor/aracUi`): "Karneden aktarıldı · hekim
  onaylı" (bilgi/mavi) · "Bu klinikte uygulandı" (iyi/yeşil) · elle girilmiş beyan (nötr; hitap yaş kuralından) + kaynağa
  göre sol kenar rengi. Yeni tasarım dili yok.
- Migration `084_asilar_karne_kaniti.sql` (yalnız ekleme: `belge_id`, `hekim_onay_at`). Uygulanmamış ortamda rota kanıt
  izini notlar önekinde tutar.
- Testler: `lib/asi/karneOkuma.test.ts` (saf), `lib/asi/asiRotalari.test.ts` (gerçek rota: onaysız kayıt yok, düzeltilen değer
  yansır, GÜÇLÜ model, sekreter 403, yabancı belge 404), hasta-izolasyon vakası (A↔B).

### C — Sağlığım'da dijital aşı karnesi: PDF indir · cihazdan paylaş · yazdır (PR 2)
- **Evrensel portal modülü "Aşı Karnesi"** (`/portal/hasta/[token]/asi-karnesi`): branş kapısı YOK — bu token'ın doktoruna ait
  aşı kaydı varsa her branşta açılır (aşı kaydı pediatri dışında da tutulur; `kategori` ayırır). `lib/portal/moduller.ts`
  (`asiKaydi`, `ASI_KARNESI_NAV`), `PortalBundle.asiKarnesi`, emptyBundle, demo (sentetik).
- **Tek içerik** `lib/asi/karneBelgesi.ts`: ekran, yazdırma (aynı ekran + `@media print`) ve PDF aynı modelden ve aynı
  sabitlerden çizilir (kaynak etiketi, açıklama, e-Nabız metni, sıra). PDF üreticisi TEK (`lib/asi/karnePdf.tsx`) — portal
  (`GET /api/portal/hasta/[token]/asi-karnesi/pdf`) ve hekim (`GET /api/doktor/asilar/karne/pdf`, Aşılar sekmesi) aynı
  fonksiyonu çağırır; test iki PDF'in metninin birebir aynı olduğunu doğrular.
- İçerik: ad soyad + doğum tarihi (yalnız karne diliminde ve PDF'te; Sağlığım karşılama başlığı hâlâ adsız), yapılan aşılar
  (ad · doz · tarih · kaynak: "Karneden aktarıldı · hekim onaylı" / "Klinikte uygulandı" / "Beyana göre kaydedildi"),
  sıradaki aşı = **hekimin girdiği** `sonraki_doz_tarihi` (bugün ve sonrası; takvim motoru portalda çalışmaz — hesaplama,
  "eksik/gecikmiş" çıkarımı yok), hekim/klinik, oluşturulma tarihi. **Klinik yorum yok** (test: yasak kelime listesi).
- **e-Nabız uyarısı ZORUNLU — neden:** aile bu karneyi okul kaydı / yurt dışı gibi resmî işlemde geçerli belge sanmasın.
  Resmî ve eksiksiz kaynak T.C. Sağlık Bakanlığı e-Nabız'dır; bizim karne yalnız bu muayenehanenin kayıtlarının özetidir
  (dış kurumda yapılan ve karneye aktarılmamış doz burada yoktur). Yanlış beklenti = aile resmî işlemde reddedilir ya da
  eksik bir dozu "yapılmış" sanır. Bu yüzden metin ekranda listeden ÖNCE, tam boyutta, çerçeveli; yazdırmada ve PDF'te de
  var; küçültülemez/gizlenemez (testler: SSR sırası, print CSS'te gizlenmez, PDF metninde var).
- **Üç eylem (Kaan):** (1) **PDF indir** — dosya cihaza iner (dosya adında hasta adı yok: `asi-karnesi-YYYY-MM-DD.pdf`).
  (2) **Paylaş** — yalnız cihazın kendi paylaşım sayfası (Web Share API + `canShare({files})`); iOS için PDF önceden
  hazırlanır (paylaşım dokunuştan hemen sonra açılmalı). Destek yoksa düğme GÖSTERİLMEZ, yerine açık ipucu: "PDF'i indirip
  kendi e-postanızdan ya da mesaj uygulamanızdan gönderebilirsiniz." mailto'ya ek denenmez. (3) **Yazdır** — portalde
  `window.print()` + `ASI_KARNESI_YAZDIRMA_CSS` (kabuk/gezinme/alt bilgi/düğmeler gizli, beyaz zemin + siyah metin,
  satırlar `break-inside: avoid`, e-Nabız uyarısı ve kaynak rozeti basılır); hekim tarafında aynı PDF gizli çerçevede
  yazdırılır (izin yoksa yeni sekmede açılır).
- **C6 (e-postayla gönder) İPTAL — Kaan'ın kararı ve gerekçesi:** *"Burada Resend'e gerek yok… Eğer birisine e-mail etmek
  istiyorsa direkt kendi e-mailinden yollasın. Bizimle bir alakası yok."* Sağlık verisini Notya'nın e-posta altyapısından
  geçirmek gereksiz bir KVKK sorumluluğu ve maliyettir; ebeveyn belgeyi indirir, paylaşmak isterse KENDİ e-postasından /
  WhatsApp'ından yollar. Notya adres SORMAZ, SAKLAMAZ, GÖNDERMEZ. Resend / `lib/mail/resend.ts` / `notifyPatientEmail.ts`
  bu iş için kullanılmadı ve değiştirilmedi. **Regresyon koruması:** `lib/asi/asiKarnesi.test.ts` karne yüzeylerinde
  e-posta gönderen/adres soran herhangi bir şey (Resend, notifyPatient, mailto, e-posta alanı) ve karne portal API'sinde
  GET /pdf dışında rota bulursa kırılır — ileride biri geri eklemeye kalkarsa gerekçe burada.
- **Türkçe karakter (PDF):** mevcut rapor PDF'i (`app/api/doktor/raporlar/pdf`) yerleşik Helvetica kullanıyor; Helvetica'da
  ı/İ/ş/Ş/ğ/Ğ glifi YOK. Karne PDF'i aynı deseni (react-pdf, beyaz zemin) izler ama gömülü **Liberation Sans** kaydeder
  (`pdfjs-dist/standard_fonts` — zaten kurulu, yeni bağımlılık yok; `next.config.mjs` outputFileTracingIncludes ile yalnız iki
  PDF rotasının paketine girer). react-pdf `textTransform: uppercase` yerel ayar bilmediğinden ("TARIH") büyük harf
  `toLocaleUpperCase('tr-TR')` ile üretilir. Test üretilen PDF'in METNİNİ pdfjs ile çıkarır ve ı ş ğ İ Ş Ğ ö ç ü'yü arar;
  Next paketlemesi altında da doğrulandı (dev sunucu).
- **Hasta izolasyonu:** portal PDF'i dışarıdan hasta kimliği almaz (token satırından); PIN çerezi olmadan 401, uydurma token
  404, A'nın PIN çerezi B'nin token'ında 401; başka doktorun bu hastaya iliştirdiği aşı karneye/PDF'e girmez. Hekim PDF'i:
  hastaSahibiMi → yabancı hasta 404. Envanter + hasta-izolasyon vakaları eklendi.
- Mobil: 390px'te karne ekranı (yatay taşma yok, düğmeler 44px), yazdırma çıktısı (print media → PDF) ve hekim eylemleri
  ekran görüntüsüyle kontrol edildi.

### D — hekim onaylı aşı hatırlatması (PR 3)
- **Önce kontrol edildi:** pediatri kohort paneli aşı gecikmesini takvim motoruyla (hekimin girdiği tarih değil) bayraklıyor ve
  toplu "kontrol hatırlatması" gönderiyor; doktor ana sayfasında aşı listesi YOK. Buna karşılık **otomatik** bir günlük cron
  vardı: `/api/cron/asi-hatirlatma` — `sonraki_doz_tarihi` 7 gün kala hekim onayı olmadan aileye WhatsApp atıyor ve mesajda
  aşı adı + doz yazıyordu. Kaan'ın kararıyla (otomatik gönderim YOK) **kaldırıldı** (rota + `vercel.json` takvimi + envanter);
  pediatri aşı planlayıcısındaki "(aileye hatırlatma)" etiketi "hatırlatma listenize düşer — onayınızla gönderilir" oldu.
  Önceden cron'un işaretlediği satırlar listede "Hatırlatma gönderildi" olarak görünür (doğru).
- **Liste — yeni araç değil:** `components/doktor/AsiHatirlatmaListesi.tsx` mevcut **Pediatri kohort** ve **Aile hekimliği
  kohort** panellerine ve **hasta dosyası › Aşılar** sekmesine (yalnız o hasta) takılır. Kaynak: hekimin girdiği
  `sonraki_doz_tarihi` — 30 gün içinde yaklaşan ya da ≤ 90 gün önce geçen; aynı hastada sonraki dozu daha sonra kaydedilmiş
  satır listelenmez (aynı kural Sağlığım karnesinin "sıradaki aşı"sında da). `GET /api/doktor/asilar/hatirlatma[?patientId]`.
- **Gönderim:** hekim satırı açar → gidecek metnin AYNISINI görür (önizleme sunucudan) → "Onayla ve gönder" →
  `POST { asiId, hekimOnayi: true }`. Yalnız hekim (sekreter listeyi görür, gönderemez); `hekimOnayi !== true` → 400.
  `hatirlatma_gonderildi` atomik işaretlenir (yalnız işaretli değilse — eşzamanlı iki tık tek mesaj), tekrar → 409. Kanal
  MEVCUT Sağlığım mesaj yolu (`hasta_mesaj_konulari` + `hasta_mesajlar` + gövdesiz e-posta bildirimi, pediatri kohortuyla
  aynı) — yeni kanal yok; mesaj yazılamazsa işaret geri alınır. Tarih değişirse (`PATCH asilar/[id]`) işaret zaten sıfırlanır.
- **Metin sade, klinik iddiasız:** "Merhaba, [Çocuğunuzun kayıtlı bir sonraki aşı tarihi | Kayıtlı bir sonraki aşı tarihiniz]
  GG.AA.YYYY. Randevu için muayenehanemizi arayabilir ya da bu mesaja yanıt yazabilirsiniz. Aşı kayıtlarınızı Sağlığım › Aşı
  Karnesi bölümünde görebilirsiniz." + acil notu. Aşı adı, doz, tıbbi öneri YOK. "Çocuğunuzun" yalnız yaş kuralından
  (`veliOnamGerekliMi`, 18 yaş altı), branştan değil.
- Testler: `lib/asi/hatirlatma.test.ts` (pencere, karşılanmış doz, metin, cron yok, hiçbir cron asilar'a dokunmaz),
  `lib/asi/asiRotalari.test.ts` (onaysız 400 + mesaj yok, onaylı → önizlemedeki metin gönderilir, ikinci 409, sekreter 403,
  yabancı kayıt 404), hasta-izolasyon (POST/GET vakaları + hekim düzeyi liste A↔B, kirli satır dahil).
- Mobil: 390px'te liste, önizleme ve gönderim ekran görüntüsüyle kontrol edildi.

### OPEN
- **Canlı uçtan uca karne okuma — kredi yüklendikten sonra.** ANTHROPIC_API_KEY kredisi tükenmiş olabilir; akış saf
  fonksiyon + gerçek rota testleriyle (sahte model) doğrulandı. Kredi gelince: sentetik bir karne fotoğrafıyla
  (el yazısı + soluk kaşe) Aşılar › Aşı karnesi yükle → onay ekranı → kaydet; okunamadı satırların işaretlendiğini gör.
- **Rapor PDF'inde (Aylık rapor, `app/api/doktor/raporlar/pdf`) aynı Helvetica sorunu** — Türkçe ı/ş/ğ/İ bozuk çıkar.
  Bu işin kapsamı dışında bırakıldı; düzeltme: karne PDF'indeki font kaydını (`lib/asi/karnePdf.tsx`) oraya da uygulamak.
- Portal karnesi yalnız **gelecekteki** sonraki doz tarihini gösterir; tarihi geçmiş sonraki doz portalda "sıradaki" olarak
  görünmez (başka yerde yapılmış olabilir — yorum yapmamak için). Hatırlatması hekim listesinde (D).
- Hatırlatma listesi yalnız Pediatri ve Aile hekimliği kohort panellerinde + her branşta hasta dosyası › Aşılar'da. Aşı
  kaydını başka branşlar da tutuyorsa (enfeksiyon, dahiliye kendi `dahiliye_asilar` tablosunu kullanıyor) o kohort
  panellerine de aynı satır tek satırla takılabilir — branş talebi gelirse.
- Pediatri kohortunun takvim tabanlı "aşı zamanı geldi" toplu hatırlatması ile bu satır bazlı hatırlatma ayrı kaynaklardır
  (takvim motoru vs hekimin girdiği tarih); aynı gün ikisi birden gönderilirse aile iki mesaj alabilir. Birleştirme ayrı iş.
- iPhone galerisinden seçilen HEIC fotoğraf: Safari çoğunlukla JPEG'e çevirir; çeviremeyen tarayıcıda Kasa "Desteklenen
  türler" hatası verir (dürüst hata, sessiz kayıp yok). Gerekirse HEIC desteği ayrı iş.

## NOTYA-EYLEM — Ayşe dosyaya kayıt HAZIRLAR, hekim ONAYLAR (Kaan, 2026-09-19)

**Kaynak — Dr. Gökhan Mamur, canlı:** "Ayşe'ye Danış"ta doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi;
Ayşe *"veri girişi yapabilen bir araç değilim"* dedi. Bu cümle kodda hiçbir yerde yazmıyordu — prompt'unda hiç yazma
sözcüğü olmayan bir modelin genellemesiydi. **Kaan:** bu 30+ branşın tamamı ve klinik dikeyi için çekirdek yetenek,
"build now". Mimari: `docs/AYSE-EYLEM-MIMARISI.md`. As-built: `docs/README_EYLEM.md`.

**İlişki modeli KİLİTLİ:** Ayşe HAZIRLAR, hekim KAYDEDER. Model hiçbir şey yazmaz; araç çağrısı yalnız taslak üretir.
Cihaz Köprüsü ile aynı kural: onay kartı HER ZAMAN, sessiz yazma ASLA.

| # | Kalem | Durum |
|---|---|---|
| NOTYA-EYLEM-01 | Omurga: `core/eylemler/*` (types, z, sema, kayit, araclar, oneri, onayla, geriAl, yasakli, istem, hasta, bosluk) | **DONE** |
| NOTYA-EYLEM-02 | Tablolar `eylem_onerileri` + `eylem_kayitlari` + RLS (migration **085**), uygulandı | **DONE** |
| NOTYA-EYLEM-03 | Onay kartı `components/core/EylemKarti.tsx` (tekil + toplu; hasta adı/doğum tarihi büyük = yanlış hasta koruması; eksik alan sarı-boş; kaynak satırı; T2 önce→sonra; 390px) | **DONE** |
| NOTYA-EYLEM-04 | API `POST /api/doktor/eylem` (onayla / vazgec / geri_al / toplu_onayla) + `GET ?hastaId` bekleyen tepsisi; `doktorOturum` (sekreter klinik kayıt onaylayamaz) | **DONE** |
| NOTYA-EYLEM-05 | T1 eylemler: asi_kaydi_ekle, ilac_ekle, alerji_ekle, kronik_hastalik_ekle, olcum_ekle, bas_cevresi_ekle, kontrol_randevusu_olustur, dosya_notu_ekle | **DONE** |
| NOTYA-EYLEM-06 | T2 eylemler (diff + dokunuş): ilac_sonlandir, ilac_doz_degistir, alerji_kaldir, hasta_bilgisi_duzelt | **DONE** |
| NOTYA-EYLEM-07 | Prompt düzeltmesi: yetenek paragrafı (`core/eylemler/istem.ts`) üç yüzeyde aynı metin; personaEngine'in "Kaydettim / Ekledim / Yazıldı" kuralı **kaldırıldı** (olmamış kaydı olmuş gösteriyordu); not-konsult'a 4. yetenek eklendi; konsult prompt'u kart adını sistemin koyduğunu söylüyor | **DONE** |
| NOTYA-EYLEM-08 | Üç yüzeyde kart: Danış (`/api/doktor/konsult` + `HastaKonsult.tsx`), yazılı sohbet (`/api/asistan/chat` + `YaziliSohbet.tsx`), not içi kutu (`/api/doktor/not-konsult` + `inceleme/page.tsx`). Yeni ekran yok | **DONE** |
| NOTYA-EYLEM-09 | Testler (37): T3 yokluğu (liste + fiil regex), kayıt tutarlılığı, araç süzgeci + branş kapısı (30+ branş × eylem), tahmin→eksik alan, zod yeniden doğrulama, makullük, mükerrer, idempotans, süre dolması, geri alma (T1 evet / T2 hayır / 24 saat), branş görevi, proaktif boşluk. `npm test` içinde | **DONE** |
| NOTYA-EYLEM-10 | Çapraz-doktor izolasyon: envanterde `T`, pakette 4 vaka (GET / onayla / vazgec / geri_al) A↔B iki yönde | **DONE** |
| NOTYA-EYLEM-11 | İkinci yazma yolu YOK: `lib/doktor/hastaKayitAlanlari.ts` (alerji/kronik), `gununNotunaVitalEkle` (vitaller), `lib/randevu/cakisma.ts` (çakışma — mevcut POST **ve** PATCH rotaları da buna geçirildi) | **DONE** |
| NOTYA-EYLEM-12 | P2 toplu kart (bir turda çok araç → tek `grup_id` → "Seçilenleri kaydet") + proaktif boşluk teklifi (LLM'siz, yalnız ilk doktor turunda) | **DONE** |
| NOTYA-EYLEM-13 | P3 branş eylemleri: jine_gorevi_ekle (KD), derm_gorevi_ekle (dermatoloji), dahiliye_gorevi_ekle (dahiliye). Pediatri kendi eylemini gerektirmedi — aşı/ölçüm zaten temel, baş çevresi kapıyı kapsam motorundan alıyor | **DONE** |
| NOTYA-EYLEM-14 | Kill switch `AYSE_EYLEM_KAPALI=1`, 24 saat süre dolması, belge metni güvenilmez (araç yalnız doktor turunda) | **DONE** |
| NOTYA-EYLEM-15 | Beta kontrol listesi v8 — "Ayşe'ye dosyaya kayıt yaptırın (aşı, ilaç, ölçüm) + Geri al" maddesi (`docs/beta/Notya-Beta-Test-Listesi-DrGokhan-v8.html`) | **DONE** (PDF basılmadı — tarayıcıdan Yazdır → PDF; sahibi Kaan) |

### OPEN — bu PR'da YAPILMAYANLAR (2026-09-19, sahibi Claude, Kaan onayıyla sıraya girer)

- **NOTYA-EYLEM-16 — `takip_gorevi_olustur` (P1 listesindeydi, ŞİPLENMEDİ).** Ortak/çekirdek bir görev tablosu YOK: 31
  branşın her birinin kendi `*_gorevleri` tablosu var ve hiçbirini gösteren branştan bağımsız bir ekran yok. Yeni bir
  `takip_gorevleri` tablosu açmak, hekimin hiçbir yerde göremeyeceği bir kayıt üretirdi ("yeni ekran yok" kuralı). Hasta
  hatırlatması (`hasta_hatirlatma`) doğru yer değil — o hastaya WhatsApp/SMS gider, yani T3. Karar: ortak görev
  omurgası ayrı iştir; bugünkü takip ihtiyacını `kontrol_randevusu_olustur` karşılıyor (Randevular'da görünür).
- **NOTYA-EYLEM-17 — `konsultasyon_taslagi` (P1 listesindeydi, ŞİPLENMEDİ, gerek kalmadı).** AYSE-KONSULTASYON-01 aynı
  gün bu akışı zaten daha zengin bir editörle şipledi (Ayşe istem metnini taslak yazar, hekim düzenler/onaylar).
  İkinci bir yol açmak "tek yazma yolu" kuralını bozardı.
- **NOTYA-EYLEM-18 — `onayli_nota_ek` (T2 listesindeydi, ŞİPLENMEDİ).** Mimari "yalnız mevcut revizyon/yeniden onay
  yolundan" diyor; o yol bugün belge analizi onay rotasına bağlı ve onaylı bir klinik notu sohbetten değiştirmenin
  hukuki ağırlığı bir kartın taşıyabileceğinden fazla. Hekim not sayfasından düzenleyip yeniden onaylıyor.
- **NOTYA-EYLEM-19 — sesli seansta araç çağrısı + sözlü onay (P3, ŞİPLENDİ 2026-09-20).** `POST /api/asistan/ses-eylem`;
  ses kapıları; `/asistan` clientTools; `buildVoiceSystemPrompt` doğal akış; **canlı** ElevenLabs base
  agent’lara (Ayşe/Mehmet/Elif) `scripts/_el-tool-kur.mts` / `npm run ses:eylem-tools` ile
  `dosyaya_kayit_hazirla` · `eylem_onayla` · `eylem_vazgec` bağlandı (hasta_bul ile aynı yol). Kalan:
  Dr. Gökhan ile bir mic smoke (yazıver → Evet).
- ~~**NOTYA-EYLEM-20 — klinik dikeyi Doktor’a birleştirme.**~~ **REDDEDİLDİ 2026-09-22 (Kaan).**
  Klinik kendi kategorisidir (Doktor / Mali / Avukat gibi). Aynalama geri alındı:
  onboarding → `/dashboard/klinik`, Araçlar → `/klinik-tools`, TUS SpecialtyKey’den 8 dal çıkarıldı.
  Exceptional derinlik Klinik yüzeyinde, 10 dal tek tek (8 motorlu + derm/estetik-cerrahi sırada).
- ~~**NOTYA-EYLEM-21 — ilaç etkileşim uyarısının KART ÜZERİNE basılması (mimari §5).**~~ **KAPANDI 2026-09-19**
  (`fix/eylem-sessiz-yol-ve-etkilesim`) — aşağıdaki "2026-09-19 düzeltme turu" tablosuna bakın.
- **NOTYA-EYLEM-22 — canlı uçtan uca model testi.** Üretimde propose→commit→satır→geri al akışı QA hesabıyla
  doğrulandı (sentetik hasta), ama **gerçek bir Claude araç çağrısıyla değil**: doğrulama commit/undo yolunu
  (`/api/doktor/eylem`) sürer, aracı modelin çağırdığı adımı sürmez. ANTHROPIC kredisi ve bir gerçek oturum gerekiyor
  (ASI-KARNESI-01'deki aynı açık kalemle aynı kapı).
- **NOTYA-EYLEM-23 — mobil kontrol (standing rule).** Kart 390px için yazıldı (alanlar alt alta, düğmeler sarmalı) ama
  **gerçek cihazda/tarayıcıda görülmedi** — bu oturumda canlı kart üretecek bir model turu koşulmadı. Dr. Gökhan'ın
  v8 maddesi bunu ilk gerçek kullanımda yakalar; ayrıca Claude bir sonraki oturumda 390px ekran görüntüsü alacak.

### 2026-09-19 düzeltme turu — `fix/eylem-sessiz-yol-ve-etkilesim` (Kaan yönlendirdi)

Şiplenen paketin kendi raporunda adı konmuş iki açık: **(1)** eski sessiz klinik yazma yolu
`/api/asistan/chat` üzerinden hâlâ erişilebilirdi; **(2)** ilaç etkileşim uyarısı karta basılmıyordu.

| # | Kalem | Durum |
|---|---|---|
| NOTYA-EYLEM-21 | **İlaç uyarıları kartın ÜSTÜNDE.** `core/eylemler/ilacUyari.ts` (LLM'siz, yeni satıcı/çağrı yok): alerji (ad/marka/sınıf + ilacın kendi "… alerjisi" kontrendikasyonu) `ciddi`; aynı etken madde aktif (Parol + Minoset) `ciddi`; etkileşim `ciddi`; yaş kontrendikasyonu ("6 ay altı bebek") `ciddi`; pediatrik mg/kg + dosyadaki son kilo `bilgi`; ilaç tabloda yoksa "kontrol edilemedi" `bilgi`; modelin kendi cümlesi **"Ayşe'nin notu"** etiketiyle `orta` — asla `ciddi`. Kart: şiddet renkli, Türkçe, alanların üstünde, **katlanabilir değil**, her satırda `Kaynak:`. `ciddi` uyarı hekimi ENGELLEMEZ; düğme **"Uyarıyı gördüm, kaydet"**e döner, kayıt ikinci dokunuşla gider. Toplu kartta satır başına aynı kural. Onay anında kontrol **yeniden** koşar (ilaç listesi değişmiş olabilir) → onaysızsa 409 + güncel uyarılar, öneri `taslak` kalır. Onay `eylem_kayitlari.uyari_onayi`'ya yazılır. Migration **086** (`uyari_detay`, `uyari_onayi`), yalnız ekleme | **DONE** |
| NOTYA-EYLEM-24 | **Eski sessiz yazma yolu KAPALI.** `lib/asistan/actionExecutor.ts` artık hiçbir tabloya yazmaz (modülde `supabase` / `createClient` / `.insert(` yok, testle zorlanıyor). Envanter: `ADD_NOTE_CONTENT` → `dosya_notu_ekle` **taslağı + onay kartı**; `ADD_PRESCRIPTION` / `SET_DIAGNOSIS` → T3, hazırlanmaz bile, Ayşe ekrana yönlendirir; `CREATE_PATIENT` / `CREATE_SESSION` / `UPDATE_SESSION` → yazılmaz, ekrana yönlendirir (seans açmak **hasta onayını** da kaydediyordu); `GENERATE_DOCUMENT` → klinik dışı, kalır (yalnız şablon metni). Bilinmeyen tip → **şüphede klinik**. Tek çağıran: `/api/asistan/chat` | **DONE** |
| NOTYA-EYLEM-24a | **Prompt temizliği.** `lib/asistan/personaEngine.ts` JSON biçiminden `"action": null veya { "type": "ACTION_TYPE", "data": {} }` **kaldırıldı**; yerine "dosyaya kayıt bu JSON'dan YAPILMAZ, tek yol araçlardır" kuralı. Başka hiçbir prompt eski eylemleri reklam etmiyor (tarandı) | **DONE** |
| NOTYA-EYLEM-24b | **Muhafız test** `core/eylemler/tests/sessizYol.test.ts` (13): sohbet/ses giriş noktalarından içe aktarma grafiği yürünür, grafikteki hiçbir dosya klinik tabloya yazamaz (izinli: `core/eylemler/*` + paylaşılan `hastaKayitAlanlari` / `gununNotunaEkle`), grafikte `calistir()` hiç çağrılmaz, omurgada `calistir()`'i yalnız `onayla.ts` çağırır, sesli ajanın araç listesi salt okunur (`hasta_bul`), eski tip adları eylem anahtarı olamaz (`yasakli.ts` → `ESKI_SESSIZ_EYLEM_TIPLERI`, kayıt defteri yüklemede fırlatır), prompt eylem reklamı yapmıyor. **Mutasyonla doğrulandı**: sohbet rotasına tek bir `notes.update` eklenince kırmızı | **DONE** |
| NOTYA-EYLEM-25 | **Etkileşim eşleştirmesi düzeltildi.** `checkInteractions` yalnız diğer ilacın `name` alanına bakıyordu; bu yüzden SINIF olarak yazılmış her etkileşim ("NSAIDs", "ACE inhibitörleri", "SSRI/SNRI") sessizce hiç eşleşmiyordu — ibuprofen+ramipril, naproksen+metilprednizolon, sertralin+sumatriptan "etkileşim yok" okunuyordu. Aynı motor artık `category` ve marka listesini de okuyor; yanlış pozitife karşı muhafazakâr (bir ifade ancak BÜTÜN anlamlı sözcükleri eşleşirse yakalar) | **DONE** |
| NOTYA-EYLEM-26 | **Hafıza bir güvenlik kontrolünü yumuşatamaz** (mimari §5). `ilacUyari.ts` yalnız ilaç tablosunu ve hastanın kendi kayıtlarını içe aktarır; hafıza/tercih/persona okumaz. Test hem kaynağı (yorumlar elenerek + içe aktarma listesi birebir) hem davranışı sınar: hafızaya "uyarı gösterme" yazıldığında çıktı birebir aynı, kapı yine kapalı | **DONE** |
| NOTYA-EYLEM-27 | `lib/security/hasta-izolasyon.test.ts` "Asistan eylemleri" vakası güncellendi: artık **yabancı dosyaya da kendi dosyasına da** sessizce yazılamadığı sınanıyor. Eski pozitif kontrol ("kendi seansına not yazabilmeli") bilerek tersine çevrildi — o yol artık karttan geçiyor | **DONE** |

### AÇIK — bu turda YAPILMAYANLAR (2026-09-19, sahibi Claude)

- **NOTYA-EYLEM-28 — ilaç tablosu 18 molekül.** Deterministik etkileşim/alerji hükmü yalnız
  `lib/asistan/turkishDrugs.ts`'teki 18 molekül için verilebiliyor. Dışındaki bir ilaçta kart
  **susmuyor**, "etkileşim kontrolü yapılamadı" diyor (sessizlik temiz kâğıt sanılmasın) — ama bu
  gerçek bir kapsam açığı. `/doktor-tools/ilac-interaksiyon` aracı kapsamlı ama **LLM tabanlı**
  (Groq/xAI çağrısı): kart yolunda bilerek kullanılmadı — "yeni satıcı yok, yeni ücretli çağrı yok"
  kuralı ve her karta bir dış çağrı eklemenin maliyeti. Doğru çözüm ayrı iş: SGK/TİTCK ilaç listesi
  + ATC kodu üzerinden deterministik bir etkileşim kaynağı (ürün kararı, Kaan).
- **NOTYA-EYLEM-29 — sınıf bazlı etkileşimlerin bir kısmı hâlâ yakalanmıyor.** Tablo bazı
  etkileşimleri hiçbir ilacın `category`'siyle eşleşmeyen sözcüklerle yazıyor ("Antihipertansifler",
  "QT uzatan ilaçlar", "Aminoglikozidler"). Eşleştirici bilerek muhafazakâr: eşleşmediğinde uydurmak
  yerine susuyor. Tablo metinleri ATC/sınıf sözlüğüne bağlanınca kapanır (NOTYA-EYLEM-28 ile aynı iş).
- **NOTYA-EYLEM-30 — pediatrik doz AŞIMI hükmü verilmiyor.** Mevcut motor (`calculatePediatricDose`)
  mg/kg aralığını metin olarak üretiyor; bazı ilaçlarda bu "mg/kg/doz", bazılarında "mg/kg/gün" ve
  hesaplayıcı ikisini de "mg/gün" diye yazıyor. Reçete edilen dozla karşılaştırıp "aşıldı" demek bu
  veriyle yanlış hüküm üretebilirdi. Kart bu yüzden dozu **bilgi** olarak gösteriyor, hüküm vermiyor.
  Ayrı iş: doz birimini tabloda yapısallaştırmak.
- **NOTYA-EYLEM-31 — "Ayşe'nin notu" yalnız yazılı sohbette.** `proactiveWarning` alanı yapısal
  olarak yalnız `/api/asistan/chat` yanıtında var; Danış ve not içi kutu düz metin döndürüyor, orada
  modelin uyarı cümlesi baloncukta kalıyor (karta taşınmıyor). Deterministik kontroller üç yüzeyde de
  aynı çalışıyor. Ayrı iş: konsult yanıtını yapısallaştırmak.
- **NOTYA-EYLEM-32 — mobil kontrol (standing rule).** Uyarı bloğu ve "Uyarıyı gördüm, kaydet"
  düğmesi 390px için yazıldı (blok tam genişlik, düğme ≥44px, sarma açık) ama **gerçek tarayıcıda
  görülmedi** — NOTYA-EYLEM-23 ile aynı açık kalem, aynı sahibi.

## NOTYA-MALIYET-01 — AI model/maliyet politikası: klinik kalite > maliyet (Kaan, 2026-09-19)

Tetik: test aşamasında ~$20 harcandı. Kaan: *"Bütün kullanımlarda Sonnet 4.6 ve Haiku'yu ekonomik bir şekilde
kullanması lazım."* Aynı gün, bağlayıcı düzeltme: *"Röntgenlerde ve diğer incelemelerde de Sonnet'i kullan.
Kesinlikle application'ın kalitesinin düşmesini istemiyorum."* → Öncelik: **KLİNİK KALİTE > MALİYET**. Tasarruf yalnız
klinik olmayan işlerden ve kaliteye dokunmayan tekniklerden (prompt caching, modele giden geçmiş) gelir.
Skill: `.cursor/skills/ai-model-politikasi/SKILL.md` (Kaan). PR'lar: #339 (politika + caching + ölçüm), bu PR (kalan
çağrı yerleri + sızma testi + ledger).

### Mimari
- **Tek model kaynağı** `lib/ai/modeller.ts` (`modelSec(gorev)`, `gucluModel()`, `hizliModel()`). Varsayılan GÜÇLÜ =
  `claude-sonnet-4-6`, HIZLI = `claude-haiku-4-5-20251001`. Vercel'de `NOTYA_MODEL_GUCLU` / `NOTYA_MODEL_HIZLI` ile kod
  değişmeden değiştirilebilir (geçersiz değer → varsayılan).
- **Tek kapı** `lib/ai/cagir.ts` (`aiCagir`). Uygulamadaki her Claude isteği buradan geçer.
- **Sızma testi** `lib/ai/model-sizmasi.test.ts`: `claude-(sonnet|haiku|opus)-<sürüm>` kod içinde yalnız `modeller.ts`'te;
  `messages.create` / `api.anthropic.com` yalnız `cagir.ts`'te (app, lib, core, components, specialties, types).

### Görüntü ve inceleme — İSTİSNASIZ Sonnet (Kaan talimatı)
- Ayrı görev tipi `'goruntu-inceleme'` (GÜÇLÜ); `modeller.test.ts` HIZLI'ya çekilmesini kilitler.
- **Kod seviyesinde güvence:** `cagir.ts` mesajda `image` ya da `document` (PDF) bloğu görürse çağıranın görevi ne olursa
  olsun GÜÇLÜ modele yükseltir (`etkinSecim`, test: `cagir.test.ts` — HIZLI görevlerin hepsi görselle GÜÇLÜ'ye çıkar).
- Kapsam: röntgen, OCT, fundus, ön segment, dermatoskopi, USG, MR, BT, mamografi, EKG ve her görüntü yorumu —
  `core/belgeler/yazar.ts` (Tier A taslak; belge_analizleri, göz ve dermatoloji ekleri, konsültasyon yanıt raporunun
  belge taslağı), `core/lab/cikarim.ts` (lab PDF/görsel), `lib/ingestion/pipeline.ts` analiz (2048) + ikinci geçiş (1024).
- `pipeline.ts` etiketleme çağrısı (20 token) görevi `siniflandirma` olarak yazıldı ama mesajında görsel/PDF olduğu için
  güvence onu da **Sonnet'e yükseltir**. Bilinçli: "her türlü görsel çağrı GÜÇLÜ" kuralı "etiketleme HIZLI kalabilir"
  iznine üstün tutuldu. Ek maliyet: belge başına ~1 görsel girdi farkı, 20 çıktı token.
- Not: `lib/ingestion/pipeline.ts` klinik değil **mali** belge hattıdır (Derya — z raporu, fatura, banka). Klinik
  `belge_analizleri` hattı `core/belgeler/tierA.ts → yazar.ts`'tir; ikisi de GÜÇLÜ.

### Çağrı → kademe → neden (tam envanter, 2026-09-19)
| Çağrı yeri | Görev | Kademe | Neden |
|---|---|---|---|
| `lib/doktor/soapUret.ts` soapNotuUret (sessions/end, ses-yukle) | soap (8000) | GÜÇLÜ | Muayene/SOAP notu |
| `lib/ai/noteGenerator.ts` generateMedicalNote | soap (4000) | GÜÇLÜ | Tıbbi not |
| `lib/ai/noteGenerator.ts` diğer 9 üretici (hukuk, terapi, mali ×2, İK, emlak, sigorta, eğitim, toplantı) | not-uretimi | GÜÇLÜ | Mesleki not — dar HIZLI listesinde değil |
| `sessions/[id]/end` sağlık meslekleri seans notu | not-uretimi (1500) | GÜÇLÜ | Klinik seans kaydı |
| `doktor/konsult`, `doktor/not-konsult` | klinik-analiz | GÜÇLÜ | Klinik konsültasyon / SOAP düzenleme |
| `doktor/ilaclar/doz-oner` | klinik-analiz (400) | GÜÇLÜ | Doz önerisi |
| `doktor/araclar/erecete` | klinik-analiz (2500) | GÜÇLÜ | E-reçete + etkileşim — TASK.md'deki "HIZLI'ya geçebilir" önerisi Kaan talimatıyla **geçersiz** |
| `core/lab/yorum.ts` labRaporYaz | klinik-analiz (2500) | GÜÇLÜ | Lab çıkarımı sonrası klinik yorum |
| `lib/dr-ayse/groq.ts` (epikriz, gelişim taraması, belge ingest özeti, sandbox) | klinik-analiz | GÜÇLÜ | Klinik çıktı (ICD-10 eşleme de SOAP/not-konsult içinde, GÜÇLÜ) |
| `core/belgeler/yazar.ts`, `core/lab/cikarim.ts`, `pipeline.ts` analiz ×2 | goruntu-inceleme | GÜÇLÜ | Görüntü/belge — istisnasız |
| `pipeline.ts` detectType | siniflandirma → görselle GÜÇLÜ | GÜÇLÜ | Yukarıya bak |
| `avukat/dilekce`, `avukat/sozlesme-analiz` | uzman-analiz | GÜÇLÜ | Hukuk analizi |
| `avukat/portal` (müvekkil) | sohbet-uzman (800) | GÜÇLÜ | Hukuki süre/dosya bilgisi. #339 öncesi WIP bunu HIZLI'ya almıştı — geri alındı |
| `asistan/mali-chat`, `asistan/avukat-chat` | sohbet-uzman | GÜÇLÜ | Mevzuat/hukuk tavsiyesi |
| `asistan/chat` | yönlendirici | **varsayılan GÜÇLÜ** | Aşağıya bak |
| `help/chat` | kisa-yanit (200) | HIZLI | Yardım/destek (dar liste) |
| `mali/edevlet` (useAI) | kisa-yanit | HIZLI | Görevden önce de Haiku'ydu; e-Devlet adım rehberi (yardım niteliğinde). OPEN aşağıda |
| `lib/doktor/hafiza.ts` sohbettenOgren / ozetGerekirseGuncelle | cikarim / ozet | HIZLI | Hafıza tercih çıkarımı / profil özeti — hasta klinik verisi alınmaz (dar liste) |
| `lib/doktor/soapUret.ts` stilProfiliDamit (notes approve) | cikarim | HIZLI | Doktorun düzeltmelerinden tercih çıkarımı (dar liste). OPEN aşağıda |

### Asistan sohbeti — şüphede GÜÇLÜ (`asistanModelYonlendir`)
Sıra: hasta bağlamı (seçili hasta, çözülen dosya, çoklu eşleşme) → GÜÇLÜ, istisnasız · eylem niyeti → GÜÇLÜ · klinik
kök/kısaltma (ilaç, tanı, tetkik, görüntü, lab, doz, risk/skor, "hasta" kelimesi dahil) → GÜÇLÜ · **dar istisna → HIZLI:**
mesajın tamamı selam/teşekkür/hal-hatır/vedalaşma kelimeleri (en az bir çekirdek sosyal kelime, ≤8 kelime) ya da açık
uygulama terimi (ekran, menü, şifre, abonelik…) içeren kısa klinik-sinyalsiz soru · geri kalan her şey → GÜÇLÜ.
"evet / tamam / olur / peki" bilerek sosyal sayılmaz (asistanın klinik önerisine onay olabilir). Testler:
`lib/ai/modeller.test.ts` (belirsiz → GÜÇLÜ, net sosyal → HIZLI, hasta bağlamında kısa mesaj → GÜÇLÜ).

### Tasarruf — nereden geliyor
1. **Prompt caching** (cache_control ephemeral, 5 dk). SDK `@anthropic-ai/sdk` 0.27.3: prompt caching API'de GA; SDK
   gövdeyi olduğu gibi iletir (`cagir.ts` tipi `never` ile geçer), `usage.cache_*` alanları yanıtta gelir → sürüm
   yükseltmeye gerek görülmedi (yükseltme tüm tipleri etkiler, ayrı iş). Uygulandığı yerler:
   - `asistan/chat`: 1) persona + know-how + kurallar (hekim × persona sabit) 2) tüm system (hafıza + aktif hasta + branş
     kilidi + dosya — aynı sohbette turdan tura aynı). Metin ve sıra birebir eski prompt (`sistemParcalari.test.ts`).
   - `doktor/not-konsult`: kimlik + yetenekler + alan anahtarları + düzenleme kuralları (branş kapsamı başına sabit).
     Tek metin değişikliği: "Bugün (TRT)" satırı taslağın hemen önüne taşındı (içerik aynı).
   - `doktor/konsult`: SISTEM + hasta dosyası (aynı hastanın konsültasyonunda sabit) tek kırılma noktası.
   - `asistan/mali-chat`, `asistan/avukat-chat`: kimlik + kurallar + JSON biçimi.
   - Asgari önbelleklenebilir uzunluk: Sonnet 4.6 = 1024 token, Haiku 4.5 = 4096. mali/avukat sabit blokları büyük
     ihtimalle 1024'ün altında → orada önbellek sessizce devreye girmez (zarar yok, fayda yok). Asıl kazanç asistan/chat
     (uzman know-how bloğu) ve konsult (hasta dosyası).
2. **Geçmiş kırpma**: asistan/mali/avukat sohbetinde modele giden geçmiş 20 → 8 mesaj (`SOHBET_GECMIS_MESAJ`); saklanan
   geçmiş (ekran + doz-kaynak kontrolü) 20 kalır.
3. **HIZLI kademe** yalnız dar listede (yardım, hafıza, net sosyal tur, uygulama sorusu).

### Kalite riski nedeniyle yapılmadı
- **max_tokens düşürülmedi.** Fatura üretilen token'a göredir; tavanı düşürmek tasarruf getirmez, yalnız kesilme (F3)
  riski getirir. Mevcut tavanların hepsi korundu; mali-chat 800 → 1600 ve avukat-chat 1500 → 1600'e **çıktı** (F3 ile
  aynı gerekçe, maliyet etkisi yok). F3 kurtarma (`asistanYanitiCoz`) ve testi değişmedi, yeşil.
- **Branş kilidi asistan/chat'te sabit bloğa taşınmadı.** Kilit metni "yukarıdaki genel talimatlarla çeliştiğinde
  ÖNCELİKLİDİR" diyor; hafıza/hasta bloğunun üstüne çıkarsa önceliği onları kapsamaz. Bunun yerine ikinci kırılma
  noktası tüm system'i (kilit dahil) önbelleğe alıyor — sıra değişmedi.
- **konsult / not-konsult geçmişi kırpılmadı** (20 / 16): konsültasyon dizisinin kendisi klinik iş ürünü.
- **pipeline detectType + extract birleştirilmedi** (çift çağrı): tür başına ayrı çıkarım promptları var; birleştirmek
  prompt değişikliği = doğrulanmamış kalite riski. Başka gereksiz çift çağrı bulunmadı (asistan/chat'teki hafıza
  çağrısı regex kapılı, profil özeti 5 seansta bir).
- Hiçbir klinik iş HIZLI'ya alınmadı.

### Model adı düzeltmeleri
- `asistan/avukat-chat`: `claude-sonnet-5` yazıyordu → artık politika (GÜÇLÜ = Sonnet 4.6). Not: `claude-sonnet-5`
  aslında geçerli, daha yeni ve daha ucuz bir model kimliği ($2/$10 vs Sonnet 4.6 $3/$15 per MTok) — OPEN aşağıda.
- `sessions/[id]/end:76` `'claude-sonnet-4'`: API çağrısı DEĞİL, `notes.ai_model` **etiketi**ydi (notu üreten
  generateAccountingNoteV2 zaten Sonnet 4.6). Yalnız etiket `modelSec('not-uretimi').model` yapıldı, davranış aynı. Diğer
  `ai_model` etiketleri (end, ses-yukle) de politikadan. `lib/db/schema.sql`'deki tarihsel `DEFAULT 'claude-sonnet-4'`
  DDL belgesi olduğu için dokunulmadı (kod değil; sızma testi yalnız kod dosyalarını tarar).

### Ölçüm — `ai_token_kullanim` (migration 082, uygulandı 2026-09-19)
- **Ad çakışması:** görev metni `ai_kullanim` diyordu; o ad NOTYA-KOTA-01'in canlı günlük kota tablosu (doctor_id, gun,
  kova, sayac). #339 kısa süre o tabloya yazmayı denedi — kolonlar uymadığı için her ekleme reddedildi (veri bozulmadı,
  kota satırları 24/24 aynı). Bu PR'da ad `ai_token_kullanim`; `cagir.test.ts` yanlış tabloya yazmayı kilitler.
- Kolonlar: created_at, doctor_id (auth.users, set null), gorev, model, input_tokens, output_tokens, cache_read,
  cache_creation, kesildi (stop_reason = max_tokens → F3 izleme). **Prompt, yanıt, hasta kimliği/verisi yok; patient_id
  kolonu bilerek yok.** RLS açık: hekim yalnız kendi satırını okur; istemci yazamaz (yazan servis rolü, `lib/ai/kullanim.ts`).
  Kayıt hatası çağrıyı asla düşürmez.
- Görünüm `ai_token_kullanim_gunluk` (gün TRT × görev × model toplamları) — yalnız servis rolü / SQL Editor.
- **Maliyet izleme** (SQL Editor; fiyatlar per MTok: Sonnet 4.6 in $3 / out $15 / cache yazma $3.75 / okuma $0.30;
  Haiku 4.5 in $1 / out $5 / yazma $1.25 / okuma $0.10):
  ```sql
  select gun, gorev, model, cagri, kesilen,
    round(( case when model like '%haiku%'
      then input_tokens*1.0 + output_tokens*5 + cache_creation*1.25 + cache_read*0.10
      else input_tokens*3.0 + output_tokens*15 + cache_creation*3.75 + cache_read*0.30 end) / 1e6, 4) as usd,
    round(100.0 * cache_read / nullif(cache_read + cache_creation + input_tokens, 0), 1) as onbellek_isabet_pct
  from ai_token_kullanim_gunluk where gun >= current_date - 7 order by gun desc, usd desc;
  ```
  Hekim başına: `select doctor_id, sum(...) from ai_token_kullanim group by 1`. `kesilen > 0` ise ilgili görevin tavanı
  gözden geçirilir (F3).

### OPEN
- **Canlı doğrulama — kredi yüklendikten sonra** (ANTHROPIC_API_KEY bakiyesi 2026-09-19'da tükenmiş, API 400 "credit
  balance is too low"): (1) asistan/chat'te aynı sohbetin 2. turunda `ai_token_kullanim.cache_read > 0`; (2) not-konsult
  sabit bloğu 1024 token eşiğini geçiyor mu (`cache_creation > 0`) — geçmiyorsa ya kabul ya da blok genişletme kararı;
  (3) her rotadan en az bir satır düşüyor mu; (4) "merhaba" → Haiku, "evet" → Sonnet satırları; (5) görselli bir belge
  analizinde model = Sonnet. Şu an yalnız saf fonksiyonlar ve kurallar testle doğrulandı.
- **Kaan kararı — Sonnet 5:** `NOTYA_MODEL_GUCLU=claude-sonnet-5` tek env değişikliğiyle GÜÇLÜ kademeyi daha yeni ve
  ~%33 daha ucuz modele taşır. Klinik kalite doğrulanmadan yapılmadı (Kaan açıkça "Sonnet 4.6" dedi). Önerilen:
  SOAP + görüntü için küçük bir karşılaştırmalı değerlendirme, sonra karar.
- **Kaan kararı — stilProfiliDamit HIZLI mı kalsın?** Dar listedeki "tercih çıkarımı"dır ama çıktısı her yeni SOAP'a
  "MUTLAKA uy" diye enjekte edilir (klinik tercih ≥2 örnekte). Değişmedi (görevden önce de Haiku); GÜÇLÜ'ye almak düşük
  maliyetli bir güvenlik payı olur.
- **Kaan kararı — mali/edevlet HIZLI mı kalsın?** Görevden önce de Haiku'ydu, e-Devlet adım rehberi; "mali analiz
  sonucu" değil. Değişmedi.
- `@anthropic-ai/sdk` 0.27 → güncel sürüm yükseltmesi ayrı iş (tipler: `cache_control`, `document` bloğu, `usage.cache_*`
  şu an geniş tiple geçiyor).

## ARACLAR-CILA-01 — 27 branş aracını aynı istisnai kaliteye çıkarma (Kaan, 2026-09-19)

Tespit: beş branşın araçları farklı sprintlerde yazıldı; paylaşılan bileşen kütüphanesi her sprintte
büyüdü ama öncekiler geriye doldurulmadı. Göz kabuğunda 3 paylaşılan parça vardı, pediatri kabuğunda 12;
aynı `Secim` bileşeninin beş ayrı kopyası dolaşıyordu. Kaan: "aynı sırayla yürüt, tüm branşlar aynı
istisnai kaliteye gelsin." Dört faz, ayrı PR'lar.

### Faz 1 — paylaşılan araç UI kütüphanesi + geriye doldurma (ŞU PR)

**Tek kaynak: `lib/doktor/aracUi.tsx`.** Pediatri kabuğunda olgunlaşan parçalar buraya taşındı:
stil sözlüğü (`kutu/etiket/kucuk/metin/satir/btn/ghost/input/hata/uyari/kirmizi/iyi/kaydir`),
`Alan`, `Etiketli`, `Secim`, `Segment`, `Onay`, `Kutu`, `Sayi`, `Katlanir`, `TaslakNotu`, `Rozet`,
`OneriRozet`, `Istatistik`, `KopyalaButonu`, `panoyaKopyala`, branştan bağımsız `HastaSecici`,
`useUrlHasta` ve `useHastaVerisi` (eski `usePediHasta`ın genel hâli).

Branş rengi `AracVurguSaglayici` bağlamıyla verilir (teal / dahiliye teal / pembe); her branşın
KENDİ kabuğu duruyor — branş kapısı (`doktorAraciBransaUygun`), başlık ve renk vurgusu orada.
`gozStil` / `dermStil` / `dahStil` / `kdStil` / `pediStil` dışa aktarımları `aracStil(<vurgu>)`
sonucunu gösteren ince sarmalayıcı olarak KALDI — 27 aracın importu kırılmadı. Davranış değişmedi.

**Geriye doldurulan araçlar (13 + 2 kohort paneli):**

| Branş | Araç | Ne eklendi |
|---|---|---|
| Göz | GİL EK-3/G kodları | Segment (tip), `Alan` etiketleri, manşet kalem sayısı, kayan liste, satır başına `KopyalaButonu`, katlanır kaynak notu, TASLAK rozeti |
| Göz | VA / logMAR | OD/OS ETDRS farkı manşet kartı, yön rozeti, özet kopyalama, katlanır yöntem notu, TASLAK rozeti |
| Göz | SUT anti-VEGF kapı | Göz + basamak segmenti, `Onay`, engel/uyarı manşeti, kayan geçmiş tablosu, katlanır SUT dayanakları, TASLAK rozeti |
| Göz | SGK rapor taslağı | Göz segmenti, görünür alan etiketleri (`Etiketli`), katlanır MFK/görüntüleme, eksik sayısı manşeti, `KopyalaButonu`, TASLAK rozeti |
| Göz | Kohort paneli | `Istatistik` manşet kartları, bayraklar `Rozet` |
| Derm | PASI / EASI | Skor segmenti, manşet skor kartları, katlanır SCORAD, TASLAK rozeti |
| Derm | GÖP izotretinoin kapı | Yerel `Onay` kopyası kaldırıldı (ortak), engel sayısı manşeti, katlanır asitretin notu, TASLAK rozeti |
| Derm | Fototerapi defteri | 5 `Istatistik` kartı, katlanır MED/yanık bölümü, kayan defter tablosu, TASLAK rozeti |
| Derm | Yama D2/D4 | Takvim manşet kartları, durum rozeti, kayan antijen listesi, TASLAK rozeti |
| Derm | Kohort paneli | `Istatistik` manşet kartları, bayraklar `Rozet` |
| Dahiliye | SCORE2 / KVR | Cinsiyet + statin segmenti, risk/kova/statin açığı manşeti, katlanır lipid bölümü, TASLAK rozeti |
| Dahiliye | KDIGO CKD | Cinsiyet segmenti, evre + izlem manşeti, kronisite rozeti, katlanır önceki eGFR, TASLAK rozeti |
| Dahiliye | Polifarmasi STOPP/START | İlaç/öneri sayısı manşeti, engelleyici öneri rozeti, TASLAK rozeti |
| Dahiliye | CHA₂DS₂-VASc / HAS-BLED | Cinsiyet + endikasyon segmenti, skor + KrKl manşeti, HAS-BLED rozetleri, katlanır ilaç listesi, TASLAK rozeti |
| Dahiliye | SGK ilaç raporu | Cinsiyet / DM tipi / endikasyon segmenti, eksik + SUT tamam manşeti, kontrol listesi rozetleri, TASLAK rozeti |

**Klinik davranış değişmedi:** hiçbir hesap, eşik, kaynak metni veya motor çağrısı değiştirilmedi;
değişen yalnız sunum ve etkileşim. Doz kilidi, kaynak kilidi ve hekim kilidi dili korundu.

**Yeni bekçiler:** `lib/doktor/aracUi.test.ts` (tek kaynak — hiçbir kabuk ortak bileşeni yeniden
tanımlamaz, eski `*Stil` adları durur, branş kapısı yerinde, geriye doldurulan her araçta
`Istatistik` + `TaslakNotu` var) ve üç SSR paketi: `specialties/{goz-hastaliklari,dermatoloji,
dahiliye}/tests/araclarUi.test.ts` (gerçek `react-dom/server` çıktısı, pediatri `ui.test.ts` kalıbı,
branş sızıntısı kontrolü dâhil). Mevcut assertion'ların hiçbiri zayıflatılmadı.

**Mobil:** ortak `kaydir` kabı geniş tabloları kendi kabında kaydırıyor (sayfa 390 px'te yatay
kaymıyor), ortak `input` artık her branşta `minHeight: 44`, `Segment` parçaları ≥ 44 px.

### Faz 2 — "Bugünkü muayene formuna ekle" tüm araçlarda (2026-09-19)

Sorun: her araç "TASLAK — nota otomatik yazılmaz" ile bitiyordu ve hekim sonucu ELLE tekrar
yazıyordu — araçların çözmesi gereken sorunun ta kendisi.

**Yeni mekanizma icat edilmedi.** M-CHAT-R/F, gelişim taraması ve `/api/doktor/pediatri/tarama`
ile AYNI yazma yolu: `lib/doktor/gununNotunaEkle.ts` → bugünün açık notunun Değerlendirme alanı,
dönüş bağlantısı `lib/doktor/muayeneFormuYolu.ts` (`MuayeneFormunaDon`).

| Parça | Ne yapar |
|---|---|
| `lib/doktor/aracNotu.ts` | Saf fonksiyon: blok metnini kurar. Başlık + tire işaretli satırlar (düz metin, hekim düzenler), `(araç çıktısı — hekim ekledi)` etiketi, 11 haneli T.C.-benzeri dizi maskeleme, 24 satır / 300 karakter tavanı. |
| `POST /api/doktor/araclar/nota-ekle` | Tek yazma ucu. `hastaSahibiMi()` geçmeden HİÇBİR okuma/yazma yok; yabancı kimlik 404. Yanıt `{ ok, notId }` (mevcut `eklenenNotId` düz şekli). |
| `MuayeneFormunaEkle` (aracUi) | Her aracın sonuç kartındaki ortak düğme. Hasta seçili değilse pasif + "Önce hasta seçin"; eklenecek satır yoksa pasif; eklendikten sonra "Muayene Formuna Dön →". |

**Eylemi alan 19 araç:** göz VA / SUT anti-VEGF / SGK rapor · derm PASI-EASI / GÖP / fototerapi /
yama · dahiliye SCORE2 / CKD / polifarmasi / antikoagülan / SGK rapor · pediatri doz / büyüme /
aşı planı · KD gebelik takvimi / analık raporu / MEC / sezaryen endikasyon notu.
VA aracına bu iş için hasta seçici de eklendi (daha önce yoktu).

**Bilerek dışarıda kalanlar:** GİL EK-3/G kod arama (hastaya bağlı klinik çıktı değil, kod
kataloğu), beş kohort paneli (tek hasta çıktısı yok — zaten 1-tap hatırlatma yolu var), Gelişim &
tarama paneli (kalem başına kendi nota-ekleme akışı zaten var; Faz 2'nin referans uygulaması odur).

**Hekim kilidi:** hiçbir şey otomatik yazılmaz — tek yol hekimin bastığı düğmedir; eklenen metin
tanı / doz / evre iddiası içermez, aracın ekranda zaten gösterdiği satırlardır ve blok "araç çıktısı"
diye etiketlenir. `TaslakNotu` dili her araçta yerinde kaldı.

**Bekçiler:** `lib/doktor/aracNotu.test.ts` (10 vaka: blok biçimi, boş blok yazılmaz, T.C. maskeleme,
tavanlar, UTC+3 gün) · `lib/doktor/aracUi.test.ts` Faz 2 bölümü (19 aracın hepsi eylemi taşır; hiçbiri
kendi `fetch`'ini icat etmez; sunucuda sahiplik kontrolü yazmadan ÖNCE) · `lib/security/hasta-izolasyon.test.ts`
yeni çapraz-doktor vakası (A→B ve B→A: yabancı hastaya 404, kurbanın notuna satır yazılmıyor) ·
`lib/security/hastaIzolasyonEnvanteri.ts`'te rota `T` (test) olarak sınıflandı.

### Faz 3 — seri değerler için kalıcılık (2026-09-19)

Sorun: araçlar durumsuzdu — VA aracını yenileyince önceki vizit değerleri gidiyordu; GİB, PASI,
persentil her vizit yeniden giriliyordu.

**Karar: yeni tablo AÇILMADI.** Mevcut desenler önce araştırıldı ve beşinin de kendi kanonik kaydı
zaten vardı; Araçlar yüzeyi o kayda bağlandı. (Genel bir `arac_olcumleri` tablosu ikinci bir hasta
verisi yüzeyi ve ikinci bir izolasyon sınırı demek olurdu; bekçi testi böyle bir tablonun
eklenmediğini de doğruluyor.)

| Araç | Kullanılan mevcut kayıt | Okuma | Yazma (hekimin açık eylemi) |
|---|---|---|---|
| Göz VA / logMAR | `goz_muayeneler` (VA jsonb + `gib_sag`/`gib_sol`) | `GET /api/doktor/goz` → son ölçüm "önceki vizit" alanlarına ön doldurulur | `POST /api/doktor/goz { adim:'olcum' }` — "Bu vizitin ölçümünü kaydet". Araca GİB OD/OS alanları ve "VA hangi alana yazılsın (uzak sc / uzak cc)" segmenti eklendi. |
| Derm PASI / EASI | `derm_skor_anlari` (+ `ek` jsonb) | `GET /api/doktor/dermatoloji` → son skor gösterilir, bölge dökümü `ek`'ten geri yüklenir | `POST /api/doktor/dermatoloji { action:'skor' }` — bölge dökümü `ek.arac='pasi-easi'` ile saklanır |
| Dahiliye SCORE2 / KVR | `dahiliye_kvr` | `GET /api/doktor/dahiliye` → yaş, cinsiyet, ofis SBP, eGFR/UACR, sigara/ASKVH/DM-TOD/statin/ezetimib ön doldurulur | `POST { adim:'kvr' }` |
| Dahiliye KDIGO CKD | `dahiliye_ckd` (+ lab serisi) | `GET /api/doktor/dahiliye` → eGFR, UACR, RAS/SGLT2/NSAİİ ve aktif ilaç listesi ön doldurulur | `POST { adim:'ckd' }` |
| Pediatri büyüme | onaylı not vitalleri (`/api/doktor/hastalar/[id]/buyume-egrileri`) | zaten okunuyordu; "önceki vizit" şeridi eklendi (son kayıtlı kilo/boy/baş çevresi) | ölçüm muayene notunun onayıyla kalıcı olur — araç ikinci bir kayıt açmaz |
| KD gebelik izlem | `gebelikler` + izlemler (`/api/doktor/gebelik`) | zaten ön dolduruyordu (SAT/TDT, Rh, çoğul, risk, yapılan taramalar, izlem haftaları) | gebelik kaydı Gebelik sekmesinde yazılır — araç ikinci bir kayıt açmaz |

**Ortak parçalar:** `KayitButonu` (hasta seçili değilse pasif + nedeni; "kayıt yalnız bu düğmeyle
olur, arka planda sessizce yazılmaz") ve `OncekiVizit` şeridi — ikisi de `lib/doktor/aracUi.tsx`'te.

**Hasta izolasyonu:** yeni uç eklenmedi; kullanılan dört uç (`goz`, `dermatoloji`, `dahiliye`) zaten
envanterde ve çapraz-doktor paketinde. Ön doldurma yalnız hekimin kendi hastası için çalışır.

### Faz 4 — iki yeni EVRENSEL araç (2026-09-19)

Kaan: "sırf araç olsun diye araç yapma." Yalnız bu ikisi onaylandı; başka yeni araç eklenmedi.
İkisi de `ORTAK_DOKTOR_ARACLARI` (branslar: null) — her branş görür, kapı `OrtakAracKabugu` içinde.

**A) Muayene sonu paketi — `/doktor-tools/muayene-sonu`**
Vizitin kapanış ritüeli tek akışta: reçete · rapor · kontrol randevusu · portal özeti · SGK provizyon.
MEVCUT rotalar BAĞLANDI, hiçbiri yeniden yazılmadı (`/doktor-tools/erecete`, `/doktor-tools/sgk-rapor`,
`/dashboard/doktor/randevular`, `/doktor-tools/hasta-portali`, `/doktor-tools/sgk-medula`). Her adım
isteğe bağlı; işaretlemek bir işlem yapmaz, yalnız kapanış özetine yazılır. Araç kendi yazma isteğini
açmaz (bekçi: dosyada `method: 'POST'` yok); kapanış özeti yalnız Faz 2'nin ortak düğmesiyle nota eklenir.

**B) Sık kullandıklarım / hızlı şablonlar — `/doktor-tools/sablonlarim`**
Hekimin KENDİ vizit şablonları: alışılmış tanı + reçete taslağı + kontrol aralığı + not; tek dokunuşla
açılır, tamamen düzenlenebilir, sık kullanılanlar üste çıkar (kullanım sayacı).
- Kalıcılık: yeni tablo `doktor_sablonlari` (migration `056_doktor_sablonlari.sql`, yalnız ekleme,
  idempotent, RLS + `doctor_id = auth.uid()` politikası). **Uygulandı** (2026-09-19).
- **DOKTOR-IZOLASYON** (hasta-izolasyon değil — burada hasta verisi yok): rota hiçbir yerde
  `patient_id` almaz; her okuma/yazma `doctor_id = oturum sahibi` ile daraltılır, id ile gelen
  güncelleme/silme de aynı daraltmayı taşır → başka hekimin şablonu bulunamaz (404).
  `lib/security/hastaIzolasyonEnvanteri.ts`'te `incelendi` olarak kapsamıyla kayıtlı.
- **DOZ KİLİDİ:** Notya hazır şablon, ilaç ya da doz ÖNERMEZ. Araç boş başlar; reçete taslağı
  tamamen hekimin kendi yazdığı metindir. Bekçi testi kaynakta etken madde adı ve "… mg" aramaz.

**Yeni assertion'lar (mevcutların hiçbiri zayıflatılmadı):**
`lib/doktor/doktorAraclari.test.ts` — evrensel = 30/30 branş + serbest metin adlar + branşsız hepsi
iki aracı görür ve derin linki açabilir; sayfalar `OrtakAracKabugu` ile korunur ve açılış ızgarasında
gömülü değildir; muayene sonu paketi beş mevcut rotayı bağlar ve kendi yazma isteğini açmaz; şablon
rotası hasta verisine dokunmaz ve her sorgusu doctor_id ile daralır; migration yalnız ekleme yapar.
`lib/doktor/sablonlar.test.ts` (saf yardımcılar) ve `lib/doktor/ortakAraclarUi.test.ts`
(gerçek `react-dom/server`: dürüst boş durum, hiçbir adım ön işaretli değil, TASLAK dili, branş sızıntısı yok).

### Deploy — Kaan'ı bekliyor (2026-09-19)

Dört fazın dördü de main'e birleşti. **Deploy, Kaan'ın Vercel–GitHub bağlantısını onarmasını
bekliyor:** entegrasyon kopuk (proje ayarlarında bağlı repo görünmüyor, otomatik deploy gelmiyor).
Bu yüzden bu sprintte Vercel beklenmedi ve deploy tetiklenmedi — yalnız merge edildi. Bağlantı
onarıldığında main'deki dört faz tek deploy'da canlıya çıkar; `056_doktor_sablonlari.sql` veritabanına
zaten uygulandı (yalnız ekleme, mevcut veri değişmedi).

## Open — KD form alanlarına sesli giriş (2026-09-18)

Boss (KD canlı): Kadın Sağlığı & Gebelik formları (SAT, Gravida/Para, lohusa izlem…) klavye
ile dolduruluyor; muayene sırasında sesle girmek istiyor.

**Mevcut:** SOAP / Ayşe sesli seansı ve yazılı “Ayşe'ye Danış” not gövdesini üretir.
Yapılandırılmış KD alanlarına (tarih / sayı / seçenek) henüz dikte bağlanmadı.

**Plan (Kaan onayı sonrası):** (a) odaklı alana Web Speech / cihaz diktesi; (b) Ayşe'ye
“SAT 12 Mart, Gravida 2 Para 1” demek → alanlara yazma (not-konsult tarzı structured fill).
SOAP sesli akışı bozulmaz. Bekliyor: Kaan öncelik (a vs b).

## Open — KD-ISIMLENDIRME-02: `kadin-dogum` veri değerini tekilleştirme göçü (2026-09-18) — Kaan kararı bekliyor

**Arka plan.** KD-ISIMLENDIRME-01 (2026-09-18) branşın hekim/hasta gören adını her yerde **"Kadın Hastalıkları ve
Doğum"** yaptı ve bütün çözücüleri tek `bransAnahtari()`'na bağladı. Veri değeri bilinçli olarak DEĞİŞTİRİLMEDİ:
`'kadin-dogum'` ve `'kadin-hastaliklari-dogum'` ikisi de yaşıyor, ikisi de aynı branşa çözülüyor ve bu bir testle
kilitli (`lib/specialties/kd-isim-esdegerligi.test.ts`). Ledger: `docs/KD-ISIMLENDIRME-LEDGER.md`.

**Öneri (yapılmadı): tek değer `kadin-hastaliklari-dogum`.**

1. **Veri (salt-okunur sayım 2026-09-18):**
   - `public.users.specialty = 'kadin-dogum'` → **2 satır** (1 gerçek hekim, 1 QA `qa.kd@notya.ai`) → `'kadin-hastaliklari-dogum'`.
     (Karşılaştırma: `'kadin-hastaliklari-dogum'` zaten 1 satır.)
   - `auth.users.raw_user_meta_data->>'specialty' = 'kadin-dogum'` → **2 satır** → aynı güncelleme (`jsonb_set`).
   - `sessions.specialty`, `hasta_intake_formlari.brans`, `clinic_members.specialty`, `belge_analizleri.brans`: **0**
     `'kadin-dogum'` satırı — göç gerekmiyor (`session/new` seansı zaten kanonik anahtarla açıyor). `specialty_records`
     tablosu üretimde yok (Zod yükü yalnız bellek içi).
   - Tarayıcı önbelleği `localStorage.notya_doktor_specialty` eski değeri tutabilir — çözücü okudukça zararsız.
   - Göç dosyası: `lib/db/migrations/0xx_kd_specialty_tekil.sql`, tek transaction, yalnız `WHERE specialty = 'kadin-dogum'`;
     öncesinde etkilenen `id` listesi (yalnız id + eski değer) ledger'a yazılır.
2. **Kod (göçle aynı iş, göç uygulanıp doğrulandıktan SONRA merge):**
   - `specialties/kadin-dogum/schema.ts` ve `specialties/dermatoloji/schema.ts` `z.literal('kadin-dogum')` →
     `'kadin-hastaliklari-dogum'`; `lib/specialties/kadin-dogum-live.ts` payload; `specialties/kadin-dogum/fixtures/*.json`.
   - `specialties/kadin-dogum/manifest.ts` `id` → `'kadin-hastaliklari-dogum'`.
   - Klasör `specialties/kadin-dogum/` → `specialties/kadin-hastaliklari-dogum/`: 34 dosyada ~100 yol referansı (2026-09-18 sayımı), `next.config.mjs`
     `outputFileTracingIncludes`, `package.json` test globları, `prompts/index.ts` `path.join`, `bridges/derm-kadin-dogum.ts`
     + derm manifest köprü kimliği, `lib/specialties/kadin-dogum*.ts` dosya adları, DOM `data-specialty` işaretleri.
   - `scripts/kd-prompts-smoke.mts` QA hesabı kanonik değerle.
   - **`LABEL_ALIASES['kadin-dogum']` KALIR** (eski localStorage, eski dışa aktarımlar, geri alma). Eşdeğerlik testi de
     kalır; yalnız gerekçe "canlı değer" → "eski değer" olarak güncellenir.
3. **Geri alma:** göç öncesi alınan `id` listesiyle `UPDATE … SET specialty = 'kadin-dogum' WHERE id = ANY(…)`
   (users + auth metadata). Çözücü iki değeri de okuduğundan veri, koddan bağımsız geri alınabilir; kod PR'ı revert
   edilirse de alias iki değeri kabul ettiği için hesap bozulmaz. Sıra: göç → doğrula (KD hekimi girişi: Araçlar'da
   5 KD aracı, Sağlığım KD modülü, SOAP'ta KD kilidi, Asistan'da Fatma) → kod PR'ı.
4. **Neden şimdi tek başına yapılmadı:** (a) canlı beta hekim (Dr. Gökhan) KD tarafını her gün kullanıyor — hesabının
   branş değeri haberi olmadan değişmemeli; (b) iki paralel sprint (pediatri, KD araçları) `specialties/kadin-dogum/`
   altına yeni dosya ekliyor — klasör yeniden adlandırması açık dallarını çakıştırır, sprintler kapanınca tek seferde
   yapılmalı; (c) kullanıcıya görünen kazanç yok: ad düzeltmesi KD-ISIMLENDIRME-01 ile zaten canlıda.

**Bekliyor:** Kaan — onay + zamanlama (paralel sprintler kapandıktan sonra, Dr. Gökhan'a haber verilerek).

---

Login sayfasına "Şifremi unuttum" linki eklendi (PR pending) ama gerçek self-servis akış DEĞİL —
tıklayınca "Notya ekibiyle iletişime geçin" diyor. Gerçek e-postalı sıfırlama şu an mümkün değil,
iki bağımsız blokaj var:
1. RESEND_API_KEY tanımlı değil — e-posta gönderme altyapısı (lib/mail/resend.ts) zaten var ve
   hasta portalı bildirimlerinde kullanılıyor, yalnız anahtar eksik olduğu için no-op çalışıyor.
2. Supabase projesinin Redirect URL allow-list'i yalnız localhost'a izin veriyor — production
   domaini eklenmemiş; bu proje-seviyesi bir ayar (Supabase dashboard veya Management API personal
   access token gerekir, servis anahtarıyla değiştirilemez).

Kaan RESEND_API_KEY sağlarsa (Resend ücretsiz katmanı yeterli) ve/veya Supabase Redirect URL'lerine
https://notya-ai.vercel.app eklerse, gerçek self-servis "şifremi unuttum → e-posta → link → yeni
şifre" akışı bir oturumda kurulabilir.

## CLOSED — bayat Supabase fetch taraması (opened 2026-09-14, closed 2026-09-16)

**CLOSED 2026-09-16 (PR fix/no-store-sweep-2):** `scripts/codemod-no-store.mjs` (bracket-matching codemod, idempotent) wrapped the remaining 41 raw `createClient(...)` calls under app/api + lib with `cache: 'no-store'` (merged into existing `global`/`auth` option objects where present, 0 manual). Its `--check` mode runs in `npm test` as `lib/supabase/noStore.test.ts`, so any future raw client without no-store fails CI. Rule stands: prefer the shared no-store client; if a raw client is unavoidable the guard forces the option.


PR #170 (2026-09-10) 34 dosyada ham `createClient(...)` çağrılarına `cache: 'no-store'` sardı,
ama arama deseni yalnız `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)` şeklindeki
satırları yakalıyordu. Bugün hasta portalının Büyüme Eğrileri verisinin sessizce `null` döndüğü
bulundu — kök sebep `app/api/portal/hasta/[token]/route.ts`'nin URL/anahtarı yerel değişkenlerde
(`supabaseUrl`, `serviceRoleKey`) tutması, deseni kaçırması. O dosya düzeltildi (PR bu oturumda).

Aynı taramayla (`createClient(` var ama `no-store` yok ve `servisSupabase()` da kullanmıyor)
~40 başka dosya çıktı — hepsi doğrulanmadı, bazıları POST-only/webhook olduğu için muhtemelen
risksiz. Adaylar: portal/hasta alt-rotaları (mesajlar, unlock), klinik/me, klinik/members,
entegrasyon/* (yonetim, hl7/al, fhir/isle), avukat/* (dilekce, sozlesme-analiz, ictihat-ara),
mali/ebeyan, mali/portal-admin, sessions/start, sessions/[id]/end, notes/whatsapp,
users/profile, users/me, doktor/belgeler/ingest, doktor/ilaclar/doz-oner, doktor/goruntuleme
(ve alt rotaları), doktor/hatirlatma, doktor/araclar/* (icd10, erecete, epikriz, sgk-rapor,
ilac-interaksiyon, hasta-portali), asistan/learn, asistan/chat, asistan/avukat-*, asistan/mali-chat,
billing/webhook, help/chat, lib/portal/toolsUi.ts, lib/transcription/deepgramClient.ts,
lib/security/auditLogger.ts, lib/sandbox/supabase.ts, lib/doktor/integrations.ts,
lib/asistan/actionExecutor.ts.

Öncelik: GET rotaları (okuma sonucu bayat servis edebilenler) — users/me, users/profile,
doktor/goruntuleme, portal/hasta/[token]/mesajlar, klinik/me, klinik/members. POST/webhook
rotalarının riski daha düşük ama gözden geçirilmeli. Ayrı bir oturumda dosya dosya doğrulanıp
düzeltilmeli — bugünkü gibi kör bir toplu regex yerine.

## Program — specialty chapters on one spine (2026-09-14, Kaan)

Decision: the baseline (SOAP, İnceleme/onay, reçete/Medula, epikriz, randevu+hatırlatma, Sağlığım
portal, aşılar, intake, Ayşe sesli+yazılı, 1 saat+30 dk kayıt) is universal. Each specialty is a
"chapter" declared once in `lib/specialties/<key>.ts` via `SpecialtyProfile` and resolved through
`specialtyProfile(key)` (`lib/specialties/registry.ts`). Unbuilt specialties fall back to the
baseline automatically.

Build method (Kaan's direction, accepted): research-build each chapter to 80-90% BEFORE a
specialist sees it (specialists react to what's in front of them — immunization lesson), then a
real doctor revises. Guardrails that do not move: official Turkish sources only (SB, TUK
societies, SUT/TİTCK); deterministic code calculators only from validated PUBLIC instruments
(Neyzi/M-CHAT/GİDR pattern — Denver II lesson); Ayşe image review is decision support, never
"tanı"; every chapter ships with its `specialistReview` checklist.

Order: Wave 0 = registry (DONE: profile.ts, pediatri.ts, registry.ts — declarative, unwired) →
wire hasta dosyası tabs, ölçüm sırası, epikriz unvan to read the profile → Ayşe vision + shared
photo/media timeline (Claude Sonnet 4.6 is already multimodal; `hasta_goruntulemeler` exists as
storage-only). Wave 1 = Kadın Hastalıkları ve Doğum FIRST (Kaan 2026-09-14: Dr. Gökhan has delivered 3000+
babies and can guide — fastest path to a second specialist-validated chapter; SB Doğum Öncesi
Bakım Yönetim Rehberi + lohusa izlem protokolü, same public-source pattern as GİDR; fetal
biometry reuses the Neyzi percentile engine + chart; tetanoz reuses aşılar; expectant-mother
portal reuses Sağlığım). Then Dermatoloji (image-native, own breadth like pediatri), then Aile
Hekimliği. Wave 2 = Dahiliye, Göz Hastalıkları (NOT "optometri" — optisyen is a separate,
non-diagnosing profession in Turkey).
Wave 3 = Psikiyatri (TR-validated scales, deterministic), Kardiyoloji (EKG on vision). Acil Tıp
and surgical branches last (hospital-based / lower muayenehane volume).

Assumption: customer = Turkish private-practice physicians (muayenehane/poliklinik).

### Sağlığım — specialty-specific portal modules (DECIDED 2026-09-17, Kaan)

Core Sağlığım shell stays universal (PIN, mesajlar, ziyaretler, sonuçlar, ilaçlar, öykü, KVKK/112).
**Beyond core, portals are specialty-specific** — pediatri ≠ göz ≠ KD ≠ dahiliye ≠ derm. Same
core values; section UI/data via registry modules, not one identical Takip for every branş.
Skill: `.cursor/skills/specialty-hasta-portali/SKILL.md`. Audits must score a **Hasta portalı**
depth row (`specialty-audit-report`). Today’s gebelik/büyüme/dahiliye-anket bolt-ons are Partial;
new chapters (Göz first next) ship doctor chapter + portal module in the same program.

**SAGLIGIM-PORTAL-REGISTRY — SHIPPED 2026-09-17 (Part A of the Göz all-in-one brief).** `SpecialtyProfile.portal`
(`PortalModulu`: id, nav, bundleKeys, eligibility, copyHints, views, derinlik) declared on pediatri (büyüme/hedef boy,
Partial), KD (Gebeliğim + jine reminders, Partial), dahiliye (new registry entry `lib/specialties/dahiliye.ts`, ön anket,
Partial), dermatoloji (**Missing**, declared honestly, mounts nothing), göz (Gözlerim). `lib/portal/moduller.ts`
decides per token (doctor `users.specialty` × active pregnancy / KD chart / dahiliye cards / growth data × age). The
portal API loads core always and builds büyüme / gebelik / jine slices only for attached modules; `PortalShell` nav
extras come from `bundle.portal.nav`; Takip and home mount widgets only via `portalModulAktif`; the ön anket API uses
the same eligibility. **Leaks fixed:** büyüme curves were computed for every patient with a DOB (adults included);
Pap/HPV reminders for every woman in any practice; the ön anket shortcut fetched for every token. Rules: a doctor
whose chapter has its own module never gets another chapter's chart-data modules (göz/derm/KD/dahiliye → no büyüme,
Pap/HPV only for KD); Gebeliğim follows an active pregnancy for any practice (mixed care); baseline-branch doctors
(aile hekimi, endokrin…) get chart-data modules only when the data exists. Assumption (recorded): unknown
`users.specialty` = baseline branch, not pediatri. Tests: `lib/portal/moduller.test.ts` (10, in `npm test`).

### Göz Hastalıkları — chapter (SHIPPED 2026-09-17; was queued)

**GOZ-EXCEPTIONAL-01 — SHIPPED 2026-09-18 (Claude, #317 #318 #319 + audit PR).** Post-exceptional audit:
`public/goz-exceptional-audit.html` → https://notya-ai.vercel.app/goz-exceptional-audit.html — **16/16 domains Strong**,
0 Partial, 5 göz-only Araçlar, all 10 game changers shipped, poliklinik wow ~90% (from ~72%).
- #317 Araçlar (specialty-only, `['goz-hastaliklari']`): VA/logMAR, SUT anti-VEGF kapı, SGK rapor taslağı, GİL EK-3/G, Göz kohort
  (`/api/doktor/goz/kohort`, 1-tap hasta-güvenli hatırlatma). 29 foreign branşlar never see them (tested in a loop).
- #318 chapter + migration `053_goz_exceptional.sql` (additive, **applied** and verified: 4 new tables RLS + 2 policies each):
  RAPD + refraksiyon, Fundus→DR (hekim onaylı), lazer log, glokom Shaffer/Spaeth/paki/GA-OCT meta + EGS 5 ön ayarları
  ("öneri — hekim kilitler"), IVT odası listesi (server-enforced, wrong-eye guard), katarakt biyometri (no IOL power) + post-op,
  biyomikroskopi + keratokonus, ROP kartı + age gate, acil şablon (yıkama zamanlayıcısı, yazdırılabilir liste), intake kırmızı
  bayrak kutuları → acil bandı, "Şeridi Objektif'e yaz", chart recall. `olgunluk: 'beta-hazir'` (new union member).
- #319 Belge Tier A ↔ dual-sign: `core/belgeler/tierA.ts` shared by Belge analiz + Göz › Görüntü › Asistana raporla; OD/OS required,
  single-field fundus ≤%70, model diagnoses → "olası bulgu — evre değildir", goz_dr never written; checklist scaffold fallback.
- Tests: `test:goz` 116/116, `npm test` 978/978 (+ izolasyon A↔B for kohort GET/POST, lazer, hatirlatma, belge_taslak,
  asistana_raporla). Smoke: `scripts/goz-smoke.mts` 57/0, `scripts/goz-exceptional-smoke.mts` 88/0 (live Tier A call on a
  synthetic image returned kalite düşük → scaffold fallback, as designed). MD field checklist: `docs/GOZ-MD-BETA.md`.
- Also fixed in passing: legacy `goz-smoke.mts` intake insert had been silently failing (see INTAKE-KANAL-DEFAULT) and its
  OCT read check depended on insert order.

**Closed by GOZ-EXCEPTIONAL-01:** GOZ-AYSE-VISION auto-read (now Belge Tier A → dual-sign), Fundus→DR handoff, RAPD UI, refraction,
biyomikroskopi, keratokonus/CXL, gonyo/paki/VF meta, laser log, IVT checklist, biometry + post-op card, GİL draft depth, ROP UI,
cover/Hirschberg/Krimsky, acil şablon, intake red-flag checkboxes, strip→Objektif, göz-only Araçlar (0 → 5), recall path.

**OPEN (decisions for Kaan / Boss):**
- **GOZ-MD-BETA-SIGNOFF — decision needed.** Maturity is `beta-hazir`, deliberately **not** `uzman-dogrulandi` (no Boss/CEO
  confirmation in the sprint thread). Needed: (1) name a practising göz hekimi for the 5-day field week in `docs/GOZ-MD-BETA.md`;
  (2) Boss/CEO written OK after it → flip `lib/specialties/goz-hastaliklari.ts` `olgunluk` and re-issue the audit.
- **GOZ-TOD-TEXTS (still open; substitute shipped).** TOD Glokom / Retina / Pediatrik birim texts are members-only. Glaucoma
  intervals ship as EGS 5 presets (primary PDF, pages cited) labelled "öneri — hekim kilitler"; OCT interval is never filled
  (EGS gives none). Needed: a member login to read TOD and add the TR column (TR wins on conflict).
- **GOZ-SMS-RECALL (infra).** `TWILIO_SMS_FROM` is not configured, so recall = Sağlığım message + e-posta bildirimi (no body) +
  dönüş görevi + the doctor's own WhatsApp (`whatsapp_kisisel`). When an SMS sender exists, add the channel in `_kohort.ts`.
- **GOZ-IMAGING-REAL-QA.** Tier A path verified live only on a synthetic image. Real fundus / OCT draft quality is judged in the
  MD field week (Gün 2); no Tier B fundus engine is registered (`goz motorlar: {}`) — adding one needs `motor_kayit` validation.
- **GOZ-AUDIT-CANVAS.** The specialty-audit skill also asks for a Cursor canvas; this Claude Code run shipped the public HTML
  (share path) only. A Cursor agent can mirror it into `canvases/` if wanted.
- **INTAKE-KANAL-DEFAULT (hygiene, not göz).** `009_intake_asilar.sql`: `gonderim_kanali` default `'link'` is not in its own
  CHECK list (`whatsapp|eposta|elden`), so any insert that omits it fails. The app always sets it (`intake-formlari` route →
  `'elden'`); only direct/script inserts break. Decide: add `'link'` to the CHECK or change the default to `'elden'`.

**Pre-sprint:** `public/goz-presprint-audit.html` → ~8% wow bar (chapter Missing).
**Post-sprint:** `public/goz-post-sprint-audit.html` → 11/18 Strong, ~77% wow bar (#292/#293).
**Remaining-gaps re-audit (independent, 2026-09-17):** `public/goz-remaining-gaps-audit.html`
→ https://notya-ai.vercel.app/goz-remaining-gaps-audit.html — Claude Strong ratings verified
(`test:goz` 61/61); 7 Partial domains + chart-tab chrome leak + MD beta still open.

**GOZ-GAPS CLOSE — SHIPPED 2026-09-17 (Composer).** Closed Partial backlog after Claude chapter:
Ayşe dual-sign scaffold + same-eye OCT compare; `goz_kuru_goz` OSDI/Schirmer/TBUT (migration 049);
SB Ulusal Görme Taraması 2019 sevk eşikleri; EK-3/G GİL codes G10090–G10115 (no prices);
intake filled form in `goz-smoke`; CHART-TAB-POLICY specialty-gate (universal helper — Deri/ped no longer
leak onto exclusive chapters); dermatoloji Sağlığım **Derim** Partial (patient-safe). Skills:
`specialty-universal-vs-chapter` (universal → all ~29; chapter stays chapter) +
`specialty-hasta-portali` (each portal unique). Honest leftovers: TOD members-only PDFs (intervals stay
hekim), GİL Medula path intentional out, GOZ-MD-BETA. `test:goz` 70/70.

**GOZ-CHAPTER — SHIPPED 2026-09-17 (#292, Claude).** `specialties/goz-hastaliklari/**` + `lib/specialties/goz-hastaliklari.ts`
(VA/GİB first-class olcumler, Gözlerim module Strong) + migration `048_goz_chapter.sql` (goz_* tables, oct/fundus/on_segment
modalities; applied) + `/api/doktor/goz` + hasta dosyası › **Göz** (only for göz doctors). Engines: VA (logMAR/letters, PS/EH/IH
non-numeric), glokom (hekim target/intervals, no titration), DR (TEMD 2026 screening + TEMD vs ICO 2017 dual column,
`catisma`), anti-VEGF (SUT 4.2.33 verified line by line: basamak, rapor type/duration, loading, implant spacing, switch rule,
8 mg, response class), SGK rapor drafts, acil red flags, katarakt checklist, ön segment cards (SUT 4.2.33.D), pediatric bridge,
strip + intake→Subjektif, dual-sign OCT/fundus reads. Prompts lock wired (SOAP/chat/ses/stil). Dahiliye bridge: closing an open
`sevkler(hedef=goz)` writes `dahiliye_dm.son_goz_dibi` and closes `dm_goz`. Sağlığım › Gözlerim + `/portal/demo-goz`.
Tests: `npm run test:goz` (61), npm test 584/584. Smoke: `scripts/goz-smoke.mts` 48 steps/checks 0 failures (QA doctor
`qa.goz@notya.ai`, password only in .env.local); `scripts/goz-prompts-smoke.mts` 7/0 (real SOAP + chat). Screenshots 360/390px,
no horizontal overflow (smoke-out/goz, gitignored).

**Assumptions recorded (low-risk, made without asking):** TEMD "minimal retinopati" = hafif NPDR and "ileri evre" = orta NPDR+
or any DMÖ (TEMD gives no ICDR table) — shown next to ICO, hekim locks the date; glaucoma and pediatric intervals are hekim
fields because TOD birim texts are members-only; ICD-10 suggestions on SGK drafts (H35.3/H36.0/H34.8/H44.2/H25.9) are marked
"hekim doğrular"; `rapor_metni` on OCT/fundus rows stays visible in Sağlığım › Sonuçlar because it is doctor-typed at upload
(same as every modality); a GİL draft is an info note because the SUT text has no GİL rapor rule.

**Open / intentional outs (Göz)** — superseded by the GOZ-EXCEPTIONAL-01 block above:
- GOZ-TOD-TEXTS — still open; EGS 5 presets shipped as the substitute (see above).
- GİL Medula path — intentional out; GİL bilgi notu now has anti-VEGF-quality sections + kilit + "Medula'da hekim e-imza" CTA.
- Real ophthalmologist beta — GOZ-MD-BETA pack shipped (smoke + `docs/GOZ-MD-BETA.md`); sign-off OPEN (GOZ-MD-BETA-SIGNOFF).

**Closed 2026-09-17 (gap-close):** GOZ-AYSE-VISION, GOZ-COMPARE, GOZ-EK3G (codes), GOZ-SB-GORME, GOZ-INTAKE-SMOKE,
GOZ-DRYEYE, CHART-TAB-POLICY (universal specialty-gate), dermatoloji Derim Partial.

**SAGLIGIM PART C — portal honesty pass (2026-09-17, updated gap-close):** pediatri büyüme Partial (gated), KD Gebeliğim + jine
Partial (gated), dahiliye ön anket Partial (gated), dermatoloji **Derim Partial** (foto/kontrol/lab/fototerapi — no tanı;
→ **Strong** 2026-09-18, DERM-EXCEPTIONAL-01), göz
Gözlerim Strong. Smoke proves a göz practice gets no büyüme/gebelik/jine/anket, including a 6-year-old with kilo/boy.
**CHART-TAB-POLICY SHIPPED:** exclusive-chapter doctors (göz/derm/KD/dahiliye/…) no longer get other chapters' chart tabs;
baseline/aile may still use age/sex mixed-care rules. See `lib/doktor/hastaDosyaSekmeleri.ts` +
`.cursor/skills/specialty-universal-vs-chapter`.

### Dermatoloji (Deri ve Zührevi) — chapter (DERM-EXCEPTIONAL-01, 2026-09-18)

**DERM-EXCEPTIONAL-01 workstreams C (kısmi) / D / E — SHIPPED 2026-09-18.** Exit audit:
`public/derm-exceptional-audit.html` — **21/21 domains Strong** (was 4/21 Strong in `derm-final-audit.html`),
0 Partial/Thin/Missing, 10/10 game changers shipped, poliklinik wow ~90% (from ~50%). Aynı yöntem ikizi:
`public/goz-exceptional-audit.html`. Audit Doktor Araçları'na **bağlanmaz** (test ile kilitli).

- **Belge Tier A → derm dual-sign okuma köprüsü.** `specialties/dermatoloji/imaging/belgeKopru.ts` (pure) +
  `POST /api/doktor/dermatoloji` `action: 'goruntu-okuma'` (`eylem: 'belge_taslak' | 'asistana_raporla'`) →
  `derm_vision_reads` **asistan taslağı**, uzman onayı zorunlu (asistan kendi taslağını onaylayamaz).
  Modaliteler: `derm`, `dermatoskopi`, `yara`. Kurallar: **vücut bölgesi zorunlu** (okuma lezyon başınadır;
  "tüm vücut" reddedilir — TBSE ayrı akış), **Fitzpatrick bilinmiyorsa güven ≤ %70** (`core/belgeler/fusion`
  cap tablosuyla aynı sınır), model tanıları **"olası bulgu — tanı değildir"** olarak yazılır (resmî tanıyı
  hekim lezyon kartında kilitler, histopatoloji esastır), analiz hatalı/kalitesi düşükse köprü reddeder ve
  morfoloji kontrol listesi iskeleti önerilir. Tek Tier A yolu: `core/belgeler/tierA.ts` (göz ile ortak).
  UI: `specialties/dermatoloji/ui/BelgeAnalizOzet.tsx` → **"Görüntü okumasına aktar"** (bölge girişi + Fitzpatrick uyarısı).
  Migration `054_derm_exceptional.sql` (additive: `kaynak`, `belge_id`, `belge_analiz_id`, `modalite`, `bolge`,
  `fitzpatrick_bilinmiyor`, `guven_ust_pct`, `asistan_rapor` + aynı analiz ikinci kez aktarılamaz unique index).
  **Ortak Belge sayfasındaki köprü kutusu göz-özel kalır** (`bransKurali.goruntuOkumaKoprusu`) — OD/OS seçimi
  derm ekranına sızmaz; derm köprüsü kendi chapter UI'sinde çalışır.
- **Sağlığım › Derim → Strong.** `lib/specialties/dermatoloji.ts` `portal[0].derinlik = 'Strong'`,
  `olgunluk: 'beta-hazir'`. Hekim tetikli hatırlatmalar hasta diliyle: aylık kan testi (β-hCG) vadesi,
  fototerapi seansı, yama testi D2/D4, yara/dikiş/biyopsi kontrolü, tüm vücut deri kontrolü (TBSE), kontrol
  fotoğrafı — geciken / yaklaşan işaretiyle. Motor: `specialties/dermatoloji/engines/portal-derim.ts` (pure).
  Başlıklar görev **kodundan** sabit hasta-güvenli metne çevrilir; hekimin klinik görev metni hastaya taşınmaz.
  Kalkan: `hastaDiliTemizMi` — skor (PASI/EASI/SCORAD/DLQI/SALT), doz (mg, mg/kg, J/cm²), ilaç adı ve tanı
  yakalanır. Portal API `derm_gorevleri.ad`'ı seçmez (testle kilitli).
- **MD beta paketi.** `docs/DERM-MD-BETA.md` (5 günlük saha kontrol listesi, `docs/GOZ-MD-BETA.md` ikizi) +
  `scripts/derm-exceptional-smoke.mts` (sentetik hasta, QA hekimi `qa.derm@notya.ai`; köprü, bölge/modalite
  reddi, Derim hatırlatmaları, portal PIN akışı, audit'in Araçlar'a bağlı olmaması).
- **Testler:** `specialties/dermatoloji/tests/belgeKopru.test.ts` (köprü + branş sızması: derm rotası göz
  modalitelerini köprülemez, BelgeAnalizÖzet'te OD/OS / persentil sözcüğü yok), `lib/portal/derim.test.ts`
  (Derim Strong + hatırlatma motoru + hasta dili kalkanı), `lib/security/hasta-izolasyon.test.ts` (yeni
  A↔B vakası: `goruntu-okuma belge_taslak` yabancı Belge analizini 404 ile reddeder). `test:derm`,
  `test:brans-sizmasi`, `test:izolasyon` (192) yeşil.

**OPEN (Dermatoloji — karar / erişim gerekiyor, tahmin edilmedi):**
- **DERM-054-MIGRATION.** `lib/db/migrations/054_derm_exceptional.sql` — **applied 2026-09-18** (`node scripts/run-sql-migration.mjs 054_derm_exceptional.sql` → success). Additive: skor/fototerapi/yama/SUT/acil/dermoskopi tables+cols + Belge dual-sign vision columns on `derm_vision_reads`. Canlı smoke: `npx tsx scripts/derm-exceptional-smoke.mts` artık çalıştırılabilir.
- **DERM-MD-BETA-SIGNOFF.** Olgunluk bilerek `beta-hazir`, `uzman-dogrulandi` **değil**. Gereken: (1) `docs/DERM-MD-BETA.md`
  için pratisyen bir dermatolog adı + 5 günlük saha haftası; (2) Boss/CEO yazılı onayı → `lib/specialties/dermatoloji.ts`
  `olgunluk` çevrilir ve audit yeniden yayınlanır.
- **DERM-MEDULA-BIYOLOJIK.** Canlı Medula e-imza gönderimi yok (göz GİL ile aynı sınır). Shipped substitute: biyolojik
  SUT rapor taslağı + eksikler + kilit + "Medula'da hekim e-imza" CTA.
- **DERM-FORM014-BILDIRIM.** BZBH Form 014 ağ bildirimi (TSİM) yok. Shipped substitute: yazdırılabilir taslak + kontrol
  listesi; "bildirim formudur, onam formu değildir" prompt kilidi (KD-DERM-SAFETY-FINDINGS F4).
- **DERM-FOTOFINDER-SYNC.** FotoFinder / MoleMax cihaz senkronu yok. Shipped substitute: elle foto serisi (aynı `lezyon_id`)
  + interaktif bölge haritası + dual-sign okuma.
- **DERM-IMAGING-REAL-QA.** Tier A yolu yalnız sentetik görüntüyle doğrulandı (model okuyamazsa morfoloji kontrol listesi
  yedeği düşer). Gerçek dermoskopi taslak kalitesi MD saha haftasında yargılanır; kayıtlı Tier B dermoskopi motoru yok —
  eklemek `motor_kayit` doğrulaması ister (eklendiğinde füzyon cap'i %70'ten yükselir, dual-sign akışı aynı kalır).
- **DERM-SMS-RECALL (altyapı, göz ile ortak).** `TWILIO_SMS_FROM` yapılandırılmadığı için hatırlatma = Sağlığım mesajı +
  e-posta bildirimi (gövdesiz) + dönüş görevi + hekimin kendi WhatsApp'ı.

## Kadın Hastalıkları ve Doğum — Wave 1, first slice shipped 2026-09-14 (night)

Shipped for Dr. Gökhan's morning review: lib/clinical/gebelik.ts (Naegele/USG dating, SB DÖB
4-izlem takvimi with per-visit items, guideline-threshold alerts, kilo alım hedefi — all
deterministic), migration 020 (gebelikler, gebelik_izlemleri — APPLIED), /api/doktor/gebelik,
HastaGebelik.tsx tab (visible for female patients ≥12y; tab #12, appended so no renumbering),
registry chapter lib/specialties/kadin-dogum.ts (olgunluk: arastirma), beta list v7 item 10.

Second slice, same night (Kaan: "build the rest with the 3 references"): fetal biyometri persentilleri
(INTERGROWTH-21st official tables embedded verbatim from intergrowth21.com + Hadlock EFW —
lib/clinical/fetalBiyometri.ts), lohusa izlemi (SB DSBYR, migration 021 lohusa_izlemleri),
kadın sağlığı (KETEM tarama motoru, kontrasepsiyon kataloğu, menopoz çerçevesi — kadin_sagligi
table, /api/doktor/kadin-sagligi), printed Gebe İzlem Kartı (…/gebelik/yazdir, letterhead, A4,
USG + doğum + lohusa sections), portal "Gebeliğim" (PortalBundle.gebelik, GebeligimView).
References used for KHD (the "3" + SB): SB DÖB Yönetim Rehberi 2018, SB Doğum Sonu Bakım
Yönetim Rehberi, SB Kanser Tarama Standartları (KETEM), TJOD kılavuzları; TMFTP for USG practice.

Third slice, same night (Kaan: "make sure genetic/non-genetic disease tests like Down
syndrome are included"): genetik/kromozomal tarama — İkili test (NT+PAPP-A+free β-hCG),
üçlü/dörtlü test (AFP/hCG/estriol/inhibin A), NIPT (T21/T18/T13), invaziv test (CVS/amniyosentez)
— lib/clinical/genetikTarama.ts, migration 022 genetik_taramalar (APPLIED), wired into
/api/doktor/gebelik + HastaGebelik.tsx panel + printed Gebe İzlem Kartı.

CRITICAL BOUNDARY HELD: this module records lab-reported results only — it does NOT calculate
a combined aneuploidy risk ratio (e.g. "1/250"). That requires FMF/Astraia-certified,
lab-calibrated MoM software; computing it ourselves would repeat the Denver II/WHO-percentile
mistake at higher stakes (drives invasive-testing/termination decisions). NT gets only a
conservative ABSOLUTE flag (≥3.5mm), not a CRL-specific percentile curve — verified terminology
against FMF's own Turkish teaching material and current Turkish practice literature before
building. İleri anne yaşı (≥35) computed as a simple deterministic threshold — uncontroversial.
Verified: threshold logic tested at boundary (3.5mm exactly flags, 16hf correctly out-of-window).

Fourth slice, same night (Kaan supplied a detailed 10-section KHD reference doc — Williams
Obstetrik/Berek&Novak/Temel KHD Bilgisi + SB DÖBYR 2026 — and asked to audit built vs. spec):

Built tonight in response: pediatri köprüsü (canlı doğumda "Doğum Gerçekleşti" now takes
APGAR/kilo/boy/baş çevresi/cinsiyet and **must** create the newborn's Bebek kartı —
029 dogum_olaylari + bebek_kartlari linked to anne, plus gebelikler.yenidogan_patient_id.
Taburcu paketi / NTP / izlem extras: migration 036 (reuses 029 maddeler/yenidogan_tarama jsonb). Optional skip is gone.
Migration 023: gebelikler gained olu_dogum/ektopik (D/E), önceki sezaryen
sayısı/kesi tipi, çoğul gebelik tipi, risk_sinifi, ilk_vizit_lab, indirekt_coombs, anti_d_uygulamalari;
gebelik_izlemleri gained servikal_uzunluk, ogtt, gbs_kultur, tehlike_isaretleri. genetikTarama.ts
gained nazalKemik field, kordosentez/fetal-eko invaziif options, SUT_KODLARI, TEHLIKE_ISARETLERI
list, ozelPratikAralik() (private-practice overlay schedule, informational only, SB minimum stays
primary).

Explicitly NOT built, and why (full list is now in kadin-dogum.ts specialistReview, organized by
the reference doc's own A-J section letters so review is fast):
- Most of the new migration-023 fields have DB columns but no form UI yet (ran out of time, not
  hidden — every one is named in specialistReview)
- Erken gebelik (4-8hf) viability tracking, late-pregnancy fetal well-being tests (NST/BPP/Doppler)
- F. Obstetric emergency/decision algorithms (partograf, Bishop score, VTE risk score, HELLP/
  eclampsia, IUGR Doppler staging) — KASITLI: needs verified clinical algorithms, same Denver-II
  discipline, not attempted without a source
- G. Full separate gynecology suite (PCOS/infertility-IVF referral, urogynecology/POP-Q,
  gynecologic oncology triage, surgical templates, adolescent gyn, gebe okulu) — essentially
  untouched beyond KETEM/kontrasepsiyon/menopoz; likely needs its own "Jinekoloji Vizit" flow
- D. Real USG image/DICOM storage, e-Nabız/PACS integration — only measurement JSON is stored
- H. e-Doğum/e-Nabız/legal-document government system integration — no API access, not faked
- E. Gebelik aşı şeması (Td dose-sequence, Tdap window, flu-season reminder) as a real reminder
  engine — pediatri's Aşılar module has no pregnancy equivalent yet

Still open (chapter specialistReview):
- Fetal biyometri persentilleri (needs a chosen open reference: Hadlock / INTERGROWTH-21st / TR)
- Gebe İzlem Kartı + Obstetrik USG raporu + Doğum raporu printed templates (letterhead pattern)
- Lohusa izlem (SB protokolü), jinekoloji (KETEM HPV/smear takvimi, kontrasepsiyon, menopoz)
- Sağlığım portal "Gebeliğim" week-by-week view
- Ayşe gestational-week-aware SOAP/persona overlay (profile.promptNotlari exists, not wired)
- Wave 0 wiring still pending: hasta dosyası tabs / ölçüm order / epikriz unvan should read the
  registry (today's tab is still hardcoded + gated by patient sex/age)

## Architecture decision (Kaan 2026-09-14 gece): core/ vs specialties/*/{manifest,schema,protocols,ui,prompts,tests}

Direction accepted. Mapping from what exists today, so migration is a checklist not a guess:
- manifest.ts  = lib/specialties/<key>.ts (SpecialtyProfile) — already basically this shape.
- schema.ts + protocols/ = lib/clinical/<engine>.ts per specialty (buyumeEgrisi/mchatR/
  gelisimTaramasi for pediatri; gebelik/fetalBiyometri/lohusaVeJinekoloji/genetikTarama for
  kadin-dogum) — currently flat under lib/clinical/, needs splitting by specialty.
- ui/ = components/doktor/Hasta*.tsx (HastaBuyumeEgrileri, HastaMchat, HastaGelisimTaramasi,
  HastaGebelik) — free to move, plain imports, no URL constraint.
- prompts/ = personaEngine.ts specialty overlays + the inline system prompts in route.ts files
  (gebelik's genetik-tarama AI call, epikriz's system prompts) — currently the most tangled,
  needs care, not a fast move.
- API routes stay physically under app/api/** (Next.js app-router ties URL to file location);
  route files become thin imports from specialties/*/ once the logic moves there — route.ts
  itself never becomes the home of the logic.
- tests/ was the real gap — no persisted tests existed before tonight; verification was all
  throwaway scripts deleted after each check. FIXED for tonight's code: lib/clinical/mchatR.test.ts,
  fetalBiyometri.test.ts, gebelik.test.ts, genetikTarama.test.ts added and wired into the existing
  `npm test` script (tsx --test, node:test/node:assert — matches lib/clinical/yasamsalBulgular.test.ts
  convention). 53/53 pass including the 19 new ones.

Sequencing decision: did NOT mass-move tonight's live, just-shipped pediatri/KHD code into the
new folder shape — no test-suite-backed refactor of working production code at this hour, hours
before Dr. Gökhan's review. Instead: (1) tests are the one piece that's genuinely done and safe
to do immediately — done above; (2) the NEXT specialty (Dermatoloji, Wave 1) starts directly in
the new shape from a blank slate — zero migration risk since nothing exists yet to break;
(3) migrating pediatri/kadin-dogum's existing files into specialties/* is a deliberate, tracked,
one-file-at-a-time task for a future session, each move verified by the test suite above, not a
bulk rename.

## Waiting on the founder

| Since | Item | Why it matters |
|---|---|---|
| 2026-09-15 | **NOTYA-BELGE-06 — Supabase project region: confirm EU in the dashboard** before doctors send belge analyses at scale | The spec says Supabase EU; the vault + belge_analizleri hold de-id hashes and reports. One dashboard look. |
| 2026-09-15 | **NOTYA-BELGE-07 — license letters: Stanford (EchoNet-Dynamic weights) and VisionFM authors** — Claude drafts, Kaan sends | Both are ❌/⚠️ for commercial use; replies take weeks and cost nothing. Until then echo = describe-only, fundus = zero-shot. |
| 2026-09-15 | **NOTYA-BLE-03 — Dr. Gökhan: Samsung Android phone (Kaan 2026-09-15 — native Web Bluetooth, no extension needed); which Bluetooth device(s) he owns still unknown — live test scheduled 2026-09-16 (see CANLI OTURUM TO-DO)** | First real pairing decides the first row of docs/CIHAZ-UYUMLULUK.md — the list grows only from field-paired devices (standing rule). |
| 2026-09-15 | **NOTYA-BLE-04 — KVKK transfer position per vendor cloud** (Withings, Eko Connect, Kardia Pro) before any T4 adapter is written | Vendor clouds hold patient data outside TR; conversation first, adapter second. |
| 2026-09-15 | **Reinstall the Notya PWA on an Android phone after the BLE deploy** | The Web Share Target (Eko app → Paylaş → Notya) registers at install time; an already-installed PWA needs a reinstall once. |
| 2026-09-09 | **Medula e-reçete — ask Dr. Gökhan four things (his SCREEN is no longer needed — see Operator row): (1) how he writes e-reçete today — an MBYS/entegratör program, or paper; (2) does he have a Medula Doktor username/password; (3) does he hold an e-imza (NES) card, and on which PC; (4) his SGK tesis kodu** | Unblocks the zero-cost line: P1 "Medula'ya hazır reçete" (barkod/SGK ürün adı, doz+periyot kodları, kutu adedi from mg/kg, SUT checks — antibiyotik kısıtları / rapor gerektiren ilaç / yaş-doz limits — at reçete onay time, "📋 Medula için kopyala" like the HBYS bridge; ~1 session, public SGK reference data, no licence) and P2 "Medula Doldurucu" Chrome extension (autofills Medula Doktor's reçete form inside the doctor's own logged-in session; he reviews and presses e-imza; no credentials stored, no SGK approval, no server; ~1–2 sessions but cannot be built blind — needs his screen). P3 (Medula web service + e-imza signing component + Bakanlık MBYS/entegratör registration) stays gated behind paying doctors per the USS-P4 decision. Wording rule: P1/P2 are "Medula'ya hazırlama / form doldurma", never "Medula entegrasyonu" until P3. Decided 2026-09-09: game-changer shortlist kept = (a) Ayşe on the patient's side via WhatsApp (parked — Kaan wants no Twilio/Meta per-message cost; revisit only with a zero-cost channel), (b) Medula P1/P2 (this item), (c) Ayşe as resepsiyon (parked with (a), same channel). |
| 2026-08-25 | **Configure custom SMTP in Supabase (Resend / Postmark / SendGrid)** — dashboard setting + DNS records | **LAUNCH BLOCKER for the doctor section.** Signup currently uses Supabase's built-in mail sender, which is development-grade and rate-limited; QA hit `email rate limit exceeded` after a handful of attempts. On launch day the first few doctors register, then every later signup silently fails to receive its confirmation link — no confirmation, no login, no trial. No custom SMTP is configured anywhere (`SMTP_*`, `RESEND_*`, `SENDGRID_*` all absent) and the app does not send its own mail. Needs account credentials and domain DNS, so it is a founder action |
| 2026-08-25 | **Complete the signup end-to-end test** once SMTP is live | The flow genuinely stops at the confirmation e-mail, so register → confirm → login → 15-day trial → dashboard cannot be verified until the mail path works |
| 2026-08-26 | **Decide the sender domain** (notya.ai vs alternative) | Undecided as of 2026-08-26. Does NOT need to block SMTP: Resend verifies any owned domain, and the Supabase sender is one config field — a subdomain of an already-owned domain unblocks the E2E today and the brand domain can be swapped in later |
| 2026-08-27 | **Submit the two Pabau partner applications** (Claude drafts, founder submits under the Notya brand) | (1) Referral Partner Program — up to 20% recurring revenue up to 3 years per referred clinic; (2) App Marketplace listing — distribution into Pabau's 3,000+ practices. Until approval, product and landing say only "Pabau ile çalışır" with a trademark note |
| 2026-08-27 | **Merge PR #19 (NOTYA-AUTH-01)** | Auth convention (session refresh, one 401); deploys to production on merge. /klinik landing (#25) merged and live 2026-08-30 |
| 2026-08-28 | **Pabau E2E with a real key** | The connect flow validates against live Pabau before storing (verified: bad key → 401 Invalid API Token) but end-to-end needs a real clinic API key — a Pabau trial account or a pilot clinic's key, pasted at /dashboard/klinik/pabau |
| 2026-09-01 | **Randevu sistemi end-to-end test** | Live (PR #44): /dashboard/doktor/randevular, /dashboard/doktor/personel, secretary invite via /davet/personel/[token]. Not yet verified with a real secretary account or a real WhatsApp reminder send — code path and cron wiring confirmed, live send not. Invite a real sekreter, book a real randevu, confirm the reminder fires ~2-3h before |
| 2026-08-28 | **Klinik uzman voice E2E** | /asistan/klinik rides the existing ElevenLabs base agents with prompt/voice overrides (the same mechanism /asistan uses in production). Needs one real mic session per gender to confirm overrides land |

## Operator work

| Since | Item | Note |
|---|---|---|
| 2026-09-16 | **NOTYA-DAH-01 — İç hastalıkları V1 SHIPPED** | Header chips from approved labs; HT card with Uzlaşı 2025 classes/targets/buckets, confirmed-HT rule, combo class suggestion (doctor picks), dirençli HT detection from hasta_ilaclar → sevk; DM card (TEMD 2026 cadence, annual tasks, göz sevk, eGFR drug warnings, no insulin titration); lipid (doctor LDL target, statin-ALT trend, CK/TG warnings); tiroid mini; check-up template + interval + DXA; ilaç list reuse + eGFR<30 text warnings + polifarmasi; red-flag gate; sevk with last lab panel. Migration 033; 5 test groups; docs/README_DAHILIYE.md. |
| 2026-09-16 | **NOTYA-DAH-AUDIT — pre-wow specialty audit SHIPPED** | Same KD-style audit: depth pills, wow bars, HYP/Uzlaşı/TEMD matrix, private-clinic pain, 15 game changers. HTML `public/dahiliye-presprint-audit.html` → https://notya-ai.vercel.app/dahiliye-presprint-audit.html; docs/README_DAHILIYE_AUDIT.md; Araçlar link. Verdict: V1 cards real; breadth ~1/30 of KD — wow sprint before/alongside DAH-02. |
| 2026-09-16 | **NOTYA-DAH-02 — reçete yazımı → hasta_ilaclar auto-update on the muayene; SCORE2 only if a reviewed formula lands; first real dahiliye patient (KB → lab → raporla → Onayla)** — waits on Claude / Kaan | Backlog expanded by audit: check-up ledger, home-BP, DM closed loops, CKD, anemi, obezite/GLP-1, portal, prompts/, SGK rapor şablonları (see audit Sprint A/B/C). |
| 2026-09-16 | **NOTYA-DERM-02 — Dermatoloji eksik paket SHIPPED** | Audit: skorlar/fototerapi/yama/GOP already existed; built the gaps — ABCDE + resmi tanı + melanom acil rule, biyopsi/küçük cerrahi işlem paketi with onam + wound-care tasks + patoloji bound to the same lezyon, izotretinoin gate (approved βhCG + onam, monthly task, cross-task to kadın-doğum), biyolojik gate from approved labs (new canonical keys IGRA/HBsAg/AntiHBc/AntiHCV/HIV/PPD), pediatrik templates → bebek kartı, kozmetik tab off by default. Migration 032; docs/README_DERMATOLOJI.md. |
| 2026-09-16 | **NOTYA-DERM-03 — first real derm patient through the spine (dermoskopi foto → ABCDE → biyopsi → patoloji)** — waits on Kaan (a derm beta doctor) | — |
| 2026-09-16 | **NOTYA-JINE-04 / KD-05 — WOW SPRINT SHIPPED** | CYBH CDC-TR tedavi + NAAT/TOC/partner printable; full MEC + EC (LNG/UPA/Cu) + postpartum start; menoraji LNG-IUS→TXA→cerrahi ladder; 1-tap USG rapor+SUT; Anti-D closed loop; e-Doğum wizard; private package ledger; CS defense pack; ürojine+IOTA sevk; infertilite+ sevk paketi; şiddet+KOK yıllık (JINE-03); portal Pap/HPV/RİA reminders. Engines + UI tabs + API adımlar + migration 035 + tests. |
| 2026-09-16 | **NOTYA-JINE-02 — Jinekoloji V2 SHIPPED** (Berek / Speroff / TJOD goldens) | AUB PALM-COEIN with örnekleme rule (PMP, ≥45, risk <45) and Hb/ferritin from approved labs; PMP pathway gate (TVUS ET + örnekleme; sitoloji kapatmaz); KOK WHO-MEC gate (4 = block with logged ≥15-char override, 3 = caution, alternatives); endometriozis card (no staging; sevk → görevler); tekrarlayan kayıp (APS/kavite/TSH rutin, trombofili önerilmez); erken gebelik kaybı with definitive TVUS criteria + β-hCG trend + Rh anti-D task, bound to active gebelik <20 hf; ref_code dipnotlar behind the clinician "Kaynak" toggle. Migration 031; 6 tests; docs/README_JINEKOLOJI_V2.md. |
| 2026-09-16 | **NOTYA-JINE-03 — şiddet tarama + endometriyal örnekleme→Belgeler + KOK yıllık TA/kilo — SHIPPED inside JINE-04** | Siddet checkbox + sevk görevleri; kok_yillik API; örnekleme bridge remains via aub_guncelle + Belgeler flow. |
| 2026-09-16 | **NOTYA-JINE-01 — Jinekoloji spine SHIPPED** (KD spec part H, beyond minimal) | Due engine (SB + ofis), HSGM serviks action tree with doctor-locked plan + kolposkopi görevi, CYBH ön tanı + partner rule + first-ulcer HIV/RPR list + HSV pregnancy hooks, PCOS Rotterdam/TJOD 2023 counter, RİA schedule gated on STI screening, HRT pre-check that refuses start on hard contraindication, lezyon notes, infertilite step 1, kırmızı bayraklar → görevler. Renders for every female patient (mounted in HastaGebelik). Migration 030; 7 tests. |
| 2026-09-16 | **NOTYA-KD-02 — Kadın-doğum obstetrics spine SHIPPED** (audit fix on Kaan's "eksik paket" spec) | Task engine with exact week windows + hard reminders + miss alternatives; 13 TJOD-style onam templates (printable, snapshot at signing, tüp ligasyonu box); travay partograf with WHO alert/action logic; fetal distres note; C/S decision timestamp + SB endikasyon list (doctor selects); C/S preop/intraop/postop/SSVD; preterm card (steroid/MgSO4/PPROM rules, no orders); PPH classifier → acil; anne/bebek complications; lohusa 3 visits; taburcu gate (NTP-1/HepB-1/VitK/işitme or documented exception); live birth → bebek kartı + bebek patient record with pediatri tasks (ROP/YDYBÜ/üroloji rules). Migration 029; 9 tests; docs/README_KADIN_DOGUM.md. |
| 2026-09-16 | **NOTYA-KD-03 — anestezi cross-view of C/S preop + anestezi tipi; genel cerrahi reuse of PPH shell; e-imza on onam** — waits on Claude (after KD field test) | Data is in place; visibility rules and e-imza are the next slice. |
| 2026-09-16 | **NOTYA-KD-04 — first real gebe through the spine with a KD doctor (görevler → onam → partograf → doğum → taburcu → bebek)** — waits on Kaan (a KD beta doctor) | The pediatric beta (Dr. Gökhan) only exercises the bebek side. |
| 2026-09-16 | **NOTYA-LAB-01 — Belgeler LAB + TREND SHIPPED** (overnight, Kaan's spec improved) | Two-pass extraction (structural + Claude vision) reconciled cell by cell; 80+ canonical keys with TR/EN aliases, LOINC, unit conversion in code; flags from printed refs only; Δ/trend arithmetic + templated Turkish trend sentence; criticals by rule → "Hekim şimdi baksın"; identity guard; per-doctor "bunu ALT say" aliases; persona writer with 30-branş emphasis + validator (≤3 tanılar, caps 70/85, dose stripped from reçete ipucu); Onayla → last note Objektif with locked [Lab] block; approved rows become priors. Migration 028 applied; 10 tests; docs/README_LAB.md. |
| 2026-09-16 | **NOTYA-LAB-02 — "Lab değerlendirme" muayene auto-create** | SHIPPED: when the patient has no note, Onayla creates a completed `kontrol` session + empty SOAP note ("Lab değerlendirme (belge).") and attaches the [Lab] block to it. Same path for image/sound belgeler ("Belge değerlendirme"). |
| 2026-09-16 | **NOTYA-LAB-03 — Belgeler list: Lab filter + summary card** | SHIPPED: `GET /api/doktor/belgeler/lab?patientId=` returns per-document summaries; vault list shows "N parametre · x yüksek · y düşük · z kritik" + up to 3 chips (e.g. ALT ↑) and a Tümü / Lab filter. |
| 2026-09-16 | **NOTYA-LAB-04 — specialty computed lines** | SHIPPED: `ozelHesaplar()` — Kre slope (mg/dL/ay, ≥2 priors; nefroloji/dahiliye/üroloji/onkoloji/aile), Δ HbA1c in points (endokrin/aile/dahiliye/göz), serial troponin with direction (kardiyoloji/acil), Δ Hb/Plt/Neu (hematoloji/onkoloji). Injected into the writer as "BRANŞ HESAPLARI (aynen işle)" and shown as `Hesap:` bulgular. Tested. |
| 2026-09-16 | **NOTYA-LAB-05 — first real lab PDF from Dr. Gökhan (pediatric hemogram/CRP) through the pipeline; record extraction accuracy in docs/MOTOR-UYUMLULUK.md** — waits on Kaan (a real report) | Smoke test passes on a synthetic digital PDF; scanned/photo reports are vision-only until tested. |
| 2026-09-15 | **NOTYA-BELGE-09 — own golden-set evaluation for txrv-densenet121** (CheXpert val or PadChest subset; per-code AUROC into motor_kayit.dogrulama_auroc) — waits on Claude; needs the dataset download (CheXpert requires registration by Kaan) | Registry currently cites the published AUROCs; the release-gate rule wants ours. |
| 2026-09-15 | **NOTYA-BELGE-01 — Notya Belgeler multi-engine medical AI, step 0+1 SHIPPED** (core/, all 30 branşlar) | Tier A live: "Asistana raporla" on every vault document → client de-id (EXIF strip/downscale; audio → spectrogram + quality metrics) + KVKK checkbox → Claude vision persona writer (Ayşe/Mehmet/Elif/genel) → ontology (~110 bulgu_kodu) → fusion + cap table enforced in code (95/85/70/60 pediatric/55 serbest/0 kalite düşük) + acil by rule → belge_analizleri; doctor edits özet, locks resmi tanı, Onayla → notes.content_objektif (+ not_duzenlemeleri + muayene_revizyonlar), Plan → Muayeneyi onayla (locked). Migration 025 applied; motor_kayit seeded (claude-vision active, 7 Tier B rows inactive). 17 fusion/router tests. Docs: docs/BELGELER-MOTOR-MIMARISI.md, docs/README_BELGELER.md. No GPU host (Kaan). |
| 2026-09-15 | **NOTYA-BELGE-02 — Tier B engine modules** | SHIPPED 2026-09-15: **txrv-densenet121** (TorchXRayVision CXR, Apache-2.0) exported to ONNX (parity 0.0 vs stock forward), hosted on Supabase Storage `motorlar/`, runs in the browser via self-hosted onnxruntime-web (WebGPU/WASM), 18 labels mapped to the ontology, registry active (own CheXpert-val eval still pending → NOTYA-BELGE-09). STILL OPEN (each needs a gated download or training, not a code change): hear-icbhi / hear-circor (HeAR is HAI-DEF gated on HF — Kaan accepts terms once; probes trained on ICBHI/CirCor), ptbxl-inception1d (weights from the benchmarking repo), grazpedwri-yolo + fracatlas-yolo (train own heads), rsna-boneage. |
| 2026-09-15 | **NOTYA-BELGE-03 — automatic de-id: OCR redaction of burned-in text (Tesseract.js) + face blur (MediaPipe) for dış göz / yüz derm** — waits on Claude | V1 = doctor checkbox "görüntüde kimlik yok"; automation removes the human step. |
| 2026-09-15 | **NOTYA-BELGE-04 — DICOM single-slice import** | SHIPPED 2026-09-15: `core/belgeler/dicom.ts` (dicom-parser in the browser; uncompressed CR/DX/CT/MR/US; window/level from tags or percentiles; MONOCHROME1 inverted; RGB first frame; tags never leave the device). Compressed transfer syntaxes refused with a clear message. |
| 2026-09-15 | **NOTYA-BELGE-05 + NOTYA-BLE-06 — Ayşe/SOAP awareness** | SHIPPED 2026-09-15: `lib/doktor/hastaDosyaDerleyici.ts` adds "## CİHAZ VE BELGE DEĞERLENDİRMELERİ" (approved cihaz_olcumleri + approved belge_analizleri) before Vizit Geçmişi, so every SOAP/konsült prompt sees device readings and approved reports. Beta checklist item still waits on Dr. Gökhan's first real report (NOTYA-BELGE-07/BLE-07). |
| 2026-09-15 | **NOTYA-BELGE-08 — docs/MOTOR-UYUMLULUK.md field rule** (standing): an engine is "sahada test edildi" only after a real doctor reviewed ≥20 drafts and belge_revizyonlar was read | Same discipline as CIHAZ-UYUMLULUK. |
| 2026-09-15 | **NOTYA-BLE-01/02 — Cihaz Köprüsü shipped** (universal Bluetooth device capability, core/, all branşlar) | Built: core/bluetooth (6 standard GATT medical profiles, IEEE 11073 decoders, 20 tests), migration 024 (cihaz_olcumleri, doktor_cihazlar, cihaz_uyumsuzluk_raporlari — applied live), /api/doktor/cihaz-olcum (+/dosya → vault 'cihaz-kaydi'), 📶 Cihazdan al + 🎧 Cihazdan gelen dosya in İnceleme vitaller and the note page, PWA share_target + sw.js v4 + /cihaz/paylas, audio in DocumentViewer. Architecture: docs/CIHAZ-KOPRUSU-MIMARI.md. Decisions locked by Kaan: iOSWebBLE + Bluefy for iPhone, confirm card always, PWA. |
| 2026-09-15 | **NOTYA-BLE-05 — docs/CIHAZ-UYUMLULUK.md is field-only** (standing rule) | Never mark a device compatible from a spec sheet; failed pairings log to cihaz_uyumsuzluk_raporlari and move to the list as *uyumsuz*. |
| 2026-09-15 | **NOTYA-BLE-06 — Ayşe awareness of device-sourced vitals/files** (open, waits on Claude after first field pairing) | Flag `(cihazdan: <cihaz>)` on vitals and "steteskop kaydı mevcut" in the SOAP/konsült context. No audio interpretation — by design. |
| 2026-09-15 | **NOTYA-BLE-07 — beta checklist v8 item 13 "📶 Cihazdan ateş al"** (waits on NOTYA-BLE-03) | Added once we know which device Dr. Gökhan will test with. |
| 2026-09-10 | **Day-2 fix sweep from Gökhan's/Kaan's live use (PRs #152–#184) — all branş-agnostic unless noted** | Shipped: randevu saat 15-dk select; dashboard Hocam/bugünkü muayene/son notlar adı/landing copy; mobile menu redesign; + Randevu ekle left on phone; hatırlatma via doctor's own WhatsApp (wa.me); randevu edit e-posta optional+saved; intake rules (e-posta zorunlu, all mandatory except conditional explanations, sigorta order, alerji vertical, baş çevresi optional, date ≤ today, branş default = doctor's, Şehir field, TR labels + dd.mm.yyyy + two-column review); intake → hasta kaydı aktarım; kronik_hastaliklar array crash fix; cinsiyet TR everywhere; markdown renderer for all model text; seans branş lock via refreshed token (30 branş, canonical keys); ALL 34 server Supabase clients no-store (stale İnceleme queue); İnceleme shows patient name; every note field editable in İnceleme (başvuru, vitaller, evde dikkat, veli özeti) + Ayşe edits land in them (key normalization, embedded-JSON parse); hekim adı in veli özeti; reçete: draft drugs for unapproved note, full_name fallback, editable letterhead (satirlar/diploma/logo, migration 017), A5 standard, footer removed; note detail page (Muayene Geçmişi → tam not → yeniden onay); print attestation removed, Diploma No under signature; ilaç sıklık list. Branş: only intake pediatri overrides and pediatri-specific SUT age rules are pediatri-only; Medula SGK branş kodu mapped for 5 kılavuz-verified branşlar, others null (doctor selects in Medula). Beta checklist v3 (docs/beta, ~/Downloads). Open, Claude: (a) remaining 25 SGK branş kodları from Tablo 9; (b) Diploma No + adres fields also in Ayarlar profile (today only via reçete letterhead editor); (c) rule for new API routes: use `servisSupabase()` or the no-store client pattern — never a bare `createClient`. |
| 2026-09-09 | **Reçete — both routes served now (Kaan: "handle paper AND MBYS doctors")** | `/dashboard/doktor/notlar/[id]/recete`: print-ready A5 Turkish reçete (hekim başlığı, hasta/yaş, tarih, tanı ICD-10, Rp. lines with S: talimat + kutu, kaşe/imza + Diploma No blank) for paper doctors; same page offers "MBYS / Medula için kopyala" and "⬇ e-Reçete XML" (erecete.s1.xsd) for MBYS doctors; Ayşe's SUT/age warnings shown on screen, not printed. Linked from the note print page. (a) DONE 2026-09-10 PRs #176–#181 (users.recete_baslik letterhead + Diploma No); (b) kutu adedi editable on screen (PR #149), true kutu içeriği still waits on the SGK ilaç listesi (barkod work) — open, Claude; (c) DONE 2026-09-16 (renkli reçete: `lib/doktor/receteRengi.ts` classifies by etken madde — kırmızı = uyuşturucu, yeşil = psikotrop incl. tramadol/pregabalin/modafinil; the reçete page prints controlled drugs on their own KIRMIZI/YEŞİL sheet with an RRS note and keeps them off the normal reçete; uncertain substances (kodein, tapentadol, ketamin, gabapentin, psödoefedrin) only raise a "reçete türünü doğrulayın" screen note — list grows from TİTCK duyuruları, never from brand names); (d) DONE 2026-09-09 PR #149 (recete-yolu hafıza fact); still open: ask each doctor at onboarding "reçeteyi nasıl yazıyorsunuz: kâğıt / MBYS / Medula" and store it as a `uygulama` hafiza fact so the preferred button is highlighted and Ayşe's opener can say "3 reçete yazdırılmayı bekliyor". |
| 2026-09-09 | **Medula P1 — SHIPPED; P2 VOID (researched); P3 is the real path** | Research in `docs/MEDULA-KILAVUZ.md`. Kaan asked why Gökhan's screen was needed — checked SGK's own portal: Medula Doktor Uygulaması is for taking the hekim password, viewing past reçete/rapor and adding to returned ones; it is NOT a reçete-writing form, so a form-filling extension has nothing to fill. The login page links a "Yeni Medula Hekim uygulaması" (medeczane.sgk.gov.tr/hekim/) that returns a server error today — watch it. Live: "📋 Medula için kopyala" + Ayşe SUT/age/duration warnings; `GET /api/doktor/medula/recete`. Proven on SGK's public test env: `ereceteSorgula` returns a business-rule answer (auth + envelope + WSSE + field order OK). Open, Claude: (a) `ereceteGiris` 9999 "XML yapısı bozuk" — diff against SGK `ornek_erecete.xml`, retry with a real barkod; (b) barkod mapping via `aktifIlacListesiSorgula` (needs a tesis kimliği, 17:00–08:00); (c) P3-b local signer agent (open-source XAdES-BES, zero licence) — design in the doc; (d) Tablo 9 code tables unverified. **Waits on Kaan/Gökhan:** how he writes e-reçete today (MBYS or paper), Medula Doktor credentials, NES card + which PC, tesis kodu. Rule: no "Medula entegrasyonu" claim until P3 live. |
| 2026-09-09 | **Mobile pass for GÜN-01/02 — DONE at 390px** | Verified in a real 390px Chrome window: dashboard header line, vertical program list (badges wrap, no overflow), yazılı sohbet opener bubble. Found + fixed on the way (PR #143): Next 14 patched `fetch` served a stale PostgREST response to `/api/doktor/gun-programi` (first empty call got cached); `servisSupabase()` now forces `cache: 'no-store'` on every Supabase request — global, protects all pratik routes. Open, Claude: (a) pre-existing clip on `/asistan` at 390px — the "Pediatri Uzmanı" subtitle under the avatar is covered by the fixed mic panel; (b) 360px (Galaxy) not screen-captured — layout has no fixed widths >360, but a real Samsung pass on Gökhan's phone is the only proof. |
| 2026-09-09 | **Günün Programı (NOTYA-GUN-02) — SHIPPED** | Dashboard "Bugün" = kim/kaçta/neden list with Ayşe briefing per randevu. Open follow-ups, Claude: (a) ICD descriptions in `notes.icd10_codes` are English ("Acute suppurative otitis media") — the briefing shows them as-is; add a TR description lookup from the ICD catalog at note generation so the briefing (and PDF) read Turkish; (b) same list inside `/dashboard/doktor/randevular` day view (today only dashboard); (c) tap-to-expand row showing full son vizit plan without leaving the dashboard. |
| 2026-09-09 | **Günün Başı / Günün Sonu (NOTYA-GUN-01) — SHIPPED** | Ayşe opens and closes the day on dashboard, yazılı sohbet and sesli seans. Open follow-ups, Claude: (a) named follow-ups in the opener ("Ali'nin idrar kültürü geldi") once lab results have a structured landing place — today only counts (yeni belge) are safe to state; (b) optional evening WhatsApp "günün sonu" via the existing cron once Gökhan says he wants it (opt-in, not default — companion, not spam); (c) sekreter-facing variant ("bugün doktorun 14 randevusu var") when personel accounts are in daily use. **Waits on Kaan:** whether the dashboard opener should also render for the klinik vertical once klinik = doktor mirroring is decided. |
| 2026-09-09 | **Meslektaş hafızası (NOTYA-OGRENME-03) — SHIPPED** | Unified memory layer (`lib/doktor/hafiza.ts`, migration 016 applied live). Open follow-ups, Claude: (a) a small "Ayşe hakkımda ne biliyor" panel on the doktor settings page (`GET/POST /api/doktor/hafiza` already exist — transparency + KVKK-friendly forget); (b) feed `asistan_actions.was_corrected` (chat-side drug corrections) into `hafizaKaydet(kategori klinik, kaynak duzeltme)` so chat corrections count toward the 2-evidence rule like note edits do; (c) wire `hafizaBloguSohbet` into the mali/avukat chat routes once those verticals have real users (same module, one import). **Waits on Kaan:** seans = working day (current) vs each muayene — one-line change in `seansIsle` if he wants the latter. |
| 2026-09-01 | **Restore a working typecheck** — DONE (PR #42) | Dropped `baseUrl` + `ignoreDeprecations` from tsconfig; `moduleResolution: bundler` with `paths` doesn't need `baseUrl` on TS 6, and dropping it removes the TS5101 abort. Re-run is clean, 0 errors — the 66 predicted here were fixed incidentally by PRs #38–#41 in the interim. `next.config.mjs` already has `ignoreBuildErrors: false` |
| 2026-08-25 | **Workflow verification (QA item 5)** | Not started: doctor workflows end-to-end — hasta ekle, belge yükleme, reçete, rapor, SGK |
| 2026-08-25 | **True 390px visual verification** | Chrome's resize_window moves the window but not the viewport, so mobile layout was proved from the code rather than seen. NOTYA-MOBILE-01 fixed the grids; a real device pass is still worth doing |
| 2026-08-25 | **Tailwind conversion for /doktor** | The page is built from ~102 inline style objects, which is why it could not hold a media query. The CSS-block fix is correct but the section is worth converting properly when the launch is not imminent |
| 2026-08-25 | **Only 8 media queries in the whole app** | /doktor is fixed. Other surfaces (mali, avukat, dashboard sub-pages) have not been audited for mobile |
| 2026-08-25 | **Auth guard convention fix** | The NOTYA-ILAC-04 session-key bug came from a route ignoring a pattern the app already had. One convention, applied to every doktor route, folded into whichever PR next touches them |
| 2026-08-26 | **`ruhsatAskida` not surfaced in the UI** — DONE (PR #42) | Flagged per-pack in the search dropdown, sunum select, and a warning banner in HastaIlaclar + shared IlacSecici. Brand badge only fires when every pack of the brand is suspended (6 brands are partial: CLIACIL, ILARIS, KARVEA DUO, MINOSET, RIVOTRIL, +1) |
| 2026-08-26 | **214 SGK barcodes with no TİTCK match** | 2.5% of records have no etken madde (no barcode match, no unambiguous eşdeğer grubu). Mostly allergen extracts and serums. Searchable by name; left blank rather than guessed. Re-check after the next TİTCK weekly list |
| 2026-08-26 | **TİTCK / SGK refresh cadence** | Both lists change weekly. `scripts/import-sgk-ilac.mjs` then `scripts/import-titck-etken.mjs` — no schedule exists yet. A stale list means a withdrawn drug still shows as reimbursed |
| 2026-09-01 | **tsconfig `baseUrl` deprecation (TS5101)** — DONE (PR #42) | `baseUrl` dropped, `paths` alone is enough under `moduleResolution: bundler` |
| 2026-09-01 | **Çalışma saatleri (working hours) settings UI** | Backend is live (`doktor_calisma_saatleri` table + GET/PATCH `/api/doktor/calisma-saatleri`, defaults to 09:00–18:00 weekdays) but there is no settings page to edit it, and randevu booking does not yet block times outside working hours or auto-suggest free slots from it. Worth building once the day-view calendar has real usage to learn from |
| 2026-09-01 | **Randevu haftalık/aylık görünüm** — DONE (PR #44–#60) | Month grid + day view live; agenda/list views and drag-to-reschedule added 2026-09-02 |
| 2026-09-02 | **Karşılama e-postası + hasta formu — Onayla anında** | The moment the doctor clicks Onayla: friendly welcome email + intake form link go out automatically. Intake link generation and the `kanal` (whatsapp/eposta) parameter already exist; only the mail transport is missing. **Waits on Kaan: domain decision.** Once the domain is picked: DNS (SPF/DKIM) → SMTP → email branch wired into the Onayla hook — Claude builds it same day |
| 2026-09-02 | **Klinik meslektas v2 kalemleri** | (a) Sesli asistan (ElevenLabs Ayse) icin dosya erisimi — konsult su an metin sohbet (Ayse'ye Danis sekmesi); ses entegrasyonu ayri is. (b) Konsult icinde rontgen/EKG gorselini inline acma (v1 kayit listesi + Goruntuleme sekmesine yonlendirme). (c) Eski hastalara e-posta backfill (yeni kayitlarda zorunlu; eskilerde bos). (d) Cron hatirlatmalarin TRT denetimi. (e) Randevu API'sinde e-posta sunucu tarafi zorunlulugu (su an istemci zorunlu kiliyor; sekreter/asistan cagrilari icin sunucu dogrulamasi eklenmeli). Claude yapar |
| 2026-09-02 | **Sadelik O6 — Araclar emekliligi (v2)** | Asistanin karsiladigi araclar kullanim verisiyle tek tek kaldirilacak: ilac-interaksiyon (Ayse dosyadan proaktif uyariyor), hatirlatma (cron+randevu akisi), hasta-portali (intake linkleri). Kullanim birikince Claude yapar |
| 2026-09-02 | **SOAP ogrenme v2 + not PDF** | (a) not_duzenlemeleri farklarini periyodik damitip doktor stil profiline cevir ve prompta ekle (v1 few-shot bugun aktif). (b) Onayli notun PDF/yazdir cikti. (c) Inceleme Reddet butonuna gercek yeniden-uretim akisi. Claude yapar |
| 2026-09-02 | **SOAP-03 kapanan kalemler** | Ses dosyasi yukle->SOAP (ElevenLabs Scribe, ham ses silinir), plan surekliligi (onceki vizit plani degerlendirilir), Yazdir/PDF sayfasi (attestasyon + duzenleme sayisi + imza alani). Kalan: ekranda satir-satir versiyon gecmisi UI (log tabloda birikiyor); ambient diarized kayit v2. Claude yapar |
| 2026-09-03 | **Sesli-Ayse (ElevenLabs) dosya bilinci + kademe zorlamasi** | (a) ElevenLabs ajanina webhook tool eklenip dosya sorgulari sunucudan cevaplanacak (endpoint + kisa omurlu token mimarisi hazir degil; ajan konfigurasyon oturumu gerekli - Kaan ile birlikte). (b) Abonelik lansmaninda kademe zorlamasi: temel=yazili sohbet, orta/pro=sesli 1:1 + seans limitleri (ai_kullanim tablosu altyapi olarak hazir). Claude yapar |
| 2026-09-22 | **Klinik ayrı kategori (KLINIK-AYRI-01) — SHIPPED** | Kaan düzeltmesi: Klinik Doktor’a birleşmez. klinik-uzman / saglik-uzmani → `/dashboard/klinik` (Hastalar / Randevular / `/klinik-tools`). 8 dal exceptional Klinik yüzeyinde; TUS SpecialtyKey’den çıkarıldı. Fizyo ≠ FTR, psikolog ≠ psikiyatri, odyo ≠ KBB. Derm / estetik-cerrahi Klinik landing dalı — TUS chapter’a alias yok. Audit: `/klinik-exceptional-audit.html`. | SHIPPED |
| 2026-09-22 | **Klinik 10 dal exceptional (KLINIK-10-EXCEPTIONAL) — LOCAL, no publish until go** | 10/10 landing dal Klinik yüzeyinde exceptional. Seans/kohort KLINIK-90 ile derinleşti. Audit: `/klinik-exceptional-audit.html`. | SUPERSEDED by KLINIK-90 |
| 2026-09-22 | **Klinik mevzuat / KVKK / kayıt (KLINIK-MEVZUAT-01)** | Her dal SB + Hasta Hakları + KVKK m.6 + kayıt-arşiv ile revize. Katalog: `lib/klinik/klinikMevzuat.ts`. Evrensel Klinik araç: `/klinik-tools/kayit-kvkk` (10 dal). **Açık / iddia yok:** canlı SBİYS-USS senkronu; 5070 e-imza resmi kayıt; “20 yıl saklama” (2025 Özel Hastane metni “ilgili mevzuat”). Soğuma sabit gün sayısı yönetmelikte yok — Hasta Hakları + yargı. | SHIPPED |
| 2026-09-22 | **Klinik 90 bar (KLINIK-90)** | 10/10 honest wow ≥90 (90–92). Seans + iki nüsha rıza cihaz dosyasında; gerçek kohort (geciken / rıza-eksik / 112); 5 yeni 3. araç (long-guvenlik, psikolog-vade, diyet-takvim, ergo-seans, odyo-oda); hasta dosyasında dal paneli. **Hâlâ iddia yok:** SBİYS, e-imza, sunucu seans tablosu. Audit: `/klinik-exceptional-audit.html`. | SHIPPED |
| 2026-09-22 | **Klinik Hasta Portalı (KLINIK-PORTAL-01)** | 10/10 dal aynı Sağlığım kabuğu + dal modülü. Klinik hekim/müttefik mint: `/klinik-tools/hasta-portali` (aynı izolasyon API). Doktor `/doktor-tools/hasta-portali` değişmedi. TUS Derim/Yaram/FTR sızmaz. | SHIPPED |
| 2026-09-04 | **Resend + sender domain for Sağlığım patient mail** | Code is live (`lib/mail/resend.ts`, notify on practice reply). Needs `RESEND_API_KEY` + verified `RESEND_FROM_EMAIL` on Vercel **after domain is fixed**. Without it, patient e-mail notifies silently skip. |
| 2026-09-04 | **Sağlığım SMS/e-posta OTP (stronger access gate)** | 6-digit doctor PIN shipped. OTP each session (Epic-like) waits on domain + Resend/SMS. Build after domain is fixed. |

## CANLI OTURUM TO-DO (Dr. Gökhan) — 2026-09-03 itibarıyla açık defter
Kural: canlı oturum sırasında gözlemlenen HER şey (hata, sürtünme, istek, fikir) anında buraya işlenir; oturum sonrası önceliklendirilir. Çözülen kalemin durumuna [x] konur.

| Zaman (TRT) | Gözlem | Tür | Durum |
|---|---|---|---|
| 2026-09-03 14:15–14:28 | Seansı Bitir 2x500+504 — maxDuration + toleranslı parse ile çözüldü (PR #89) | hata | [x] |
| 2026-09-03 ~15:00 | e-Reçete "Sunucu hatası" — Groq ölü anahtar; Anthropic geçişi (PR #90, #91) | hata | [x] |
| 2026-09-03 15:39–15:48 | Dr. Gökhan 3 referans linki gönderdi: notlar Türk anamnez geleneğinde yazılmalı (şikayet→hikaye→özgeçmiş→soygeçmiş→alışkanlıklar; FM→lab→tanı→tedavi akışı). Motor kuralları revize edildi (PR #95). 3. link bozuk/eksik — yeniden istenecek | istek | [x] |
| 2026-09-03 ~16:10 | 3. link içeriği Kaan üzerinden geldi: FM sistematiği (genel durum + İns/Palp/Perk/Osk, batında İns→Osk→Perk→Palp, sistem terminolojisi). Objektif kuralı sistematik düzene genişletildi (PR #96) | istek | [x] |
| 2026-09-05 | **FHIR Gateway P2-P4 (hastane eklentisi devami)** | P2: PDF DocumentReference + kurum yonetim ekrani + Vercel cron kaydi. P3: ilk gercek hastane onboarding (MRN esleme, OAuth, onlarin test ortami). P4: muayenehane katmani icin dogrudan Saglik.Net/USS gonderimi (ayri ray, sertifikasyon isi). P1 TAMAM: mapper + kuyruk + HAPI kaniti (PR #107). Claude yapar |
| 2026-09-05 | HBYS satici hedef sirasi (Kaan zorluk tablosu) | P3 kanal sirasi: 1) Sisoft + Probel (olgun API/HL7), 2) Fonet (ortaklik API), 3) Enlil (interface engine), 4) Talya/Kardelen/Meddata (musteriye ozel). SB HBYS.API spesifikasyonu ilk onboardingde cekilecek. Ilk mektuplar odeyen doktorlarla | K+C |
| 2026-09-06 | QA BOT PASS #1 (test hesabi qa.test@notya.ai, sentetik hasta) | SONUC: cekirdek dongu UCTAN UCA YESIL - giris, hasta olustur, yazili seans, not uretimi (guven %95, anamnez duzeni tam, vitaller dogru, mg/kg hesap dogru, ayirici tani + kritik bulgular paneli), Incele+Onayla. BULGULAR: (1) /login 404 - kucuk, /giris gercek yol; (2) DUZELTILDI PR #114: manuel hasta ekleme bloklu idi (formda olmayan eposta alani + TC zorunlulugu adim-1de ateslenmis); (3) eposta dogrulamasi adim-1de adim-3 alanina bakiyordu - kok neden sira hatasi. ACIK KARAR (Kaan): veli e-postasi zorunlu mu opsiyonel mi kalsin (su an opsiyonel) | C yapti |
| 2026-09-06 | QA BOT PASS #2 (derin ozellikler) | DUZELTILDI: #1 /login->/giris 308 (PR 116); #4 Muayene Gecmisi HER hastada bostu - sessions sorgusu notes(...) gomme yerine kolon saniyordu, catch sessizce yutuyordu (PR 117); #5 FHIR worker notes.status kolonu yok, approved_at olmali (PR 117). DOGRULANDI YESIL: dosya zaman cizelgesi notu gosteriyor + Yazdir/PDF; yazdir sayfasi HBYS koprusu iki dugme (kopyala->Kopyalandi, HTML indir) calisiyor; Ayse chart-aware konsult MUKEMMEL - yazdigimiz notu okuyup tani+ICD+antibiyotik+doz+takip dogru getirdi. ACIK: sesli Ayse dosya bilinci (bilinen sinir), kota/tier davranisi test edilmedi (yeni hesap limitsiz)
| 2026-09-06 | QA BOT PASS #3 (yuksek-riskli yuzeyler) | UCU DE YESIL, sifir bug. (1) RECETE/ETKILESIM: varfarin kronik ilac kayitli hastada 2. vizitte antibiyotik onerisi - motor TMP-SMX+varfarin ciddi etkilesimini (CYP2C9, K vit, kanama YUKSEK) gercek farmakoloji ile yakaladi, amoksisilin-klavulanati daha guvenli secenek onerdi, ibuprofen+varfarin GI kanama icin parasetamol onerdi, INR takibi sart dedi - jenerik kutu degil, gercek ikili-ilac muhakemesi. (2) PLAN SUREKLILIGI: 2. vizit notu onceki vizit planina + kronik ilaca (Coumadin) atif yapti. (3) BELGE YUKLEME: type-to-search hasta secimi, dosya ekle, X Kaldir kontrolu, Kasaya yukle->Kasa(0->1), arsivde Lab Sonucu etiketiyle + inline onizleme + Indir/Kapat. Uctan uca calisiyor | C |
| 2026-09-16 (planlı oturum) | **📶 CİHAZ KÖPRÜSÜ CANLI TEST — Dr. Gökhan, Samsung Android telefon** (Kaan 2026-09-15: cihazı Samsung Android; yarınki oturumda test edilecek). Adımlar: (1) Chrome veya Samsung Internet ile notya-ai.vercel.app'i "Ana ekrana ekle" ile PWA olarak (yeniden) kur — Paylaş hedefi kurulumda kayıt olur. (2) İnceleme → Yaşamsal Bulgular → 📶 Cihazdan al: hangi Bluetooth cihazı var (termometre marka/model? steteskop?) — seçicide görünüyorsa eşleştir, ölçümü cihazda yap, onay kartında değeri gör, Nota ekle, notu onayla; görünmüyorsa "uyumsuz (özel protokol)" olarak docs/CIHAZ-UYUMLULUK.md'ye ilk satır. (3) 🎧 Cihazdan gelen dosya: telefondan bir ses/PDF dosyası yükle, Belgeler sekmesinde çal/aç. (4) Varsa Eko/başka cihaz uygulaması → Paylaş → Notya → /cihaz/paylas akışı. (5) Her başarısız eşleşme cihaz_uyumsuzluk_raporlari tablosuna düşer — oturum sonrası oku. | test | [ ] |
| 2026-09-16 (planlı oturum) | Cihaz testi sonucu → NOTYA-BLE-03 kapanır (ilk saha cihazı), NOTYA-BLE-07 beta checklist v8 madde 13 "📶 Cihazdan ateş al" yazılır, NOTYA-BLE-06 (Ayşe cihaz farkındalığı) başlar. | takip | [ ] |

## Renkli Reçete Sistemi (RRS) — 2026-09-16

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **NOTYA-RRS-01 — RRS iş akışı, entegrasyonsuz P1** (Kaan: "fully build as part of e-reçete aracı"): migration 037 `rrs_receteler` (note+renk başına 1 kayıt; bekliyor → duzenlendi); `lib/doktor/rrs.ts` (RRS alan sırasında kopyalanabilir metin, TC bilerek yok, adımlar, adres); `/api/doktor/rrs` GET/POST/PATCH (pratikOturum, hasta doktora ait mi kontrolü, satırlarda TC reddi); reçete sayfasında renkli sayfaya `RrsPaneli` (kopyala → RRS'yi aç → numara → kaydet; kâğıtta yalnız "RRS Reçete No"); e-reçete aracına `RrsBekleyenler` kartı (bekleyen RRS kayıtları + elle girilen ilaçta kontrole tabi uyarısı). Onaysız notta kayıt açılmaz. | SHIPPED |
| 2026-09-16 | **NOTYA-RRS-02 — takip kalemleri** (waits on Claude, after Dr. Gökhan's first yeşil reçete): (a) hafıza sorusu "RRS'yi siz mi, sekreteriniz mi düzenliyor" (`rrs-yolu` uygulama fact) ve sekreter rolüne yönlendirme; (b) RRS kayıtlarının hasta dosyası ilaç satırında ve Ayşe dosya bağlamında görünmesi ("RRS'de düzenlendi, no …"); (c) kırmızı reçete miktar/süre sınırları ekranda (RRS zaten uyguluyor — yalnız ön uyarı); (d) RRS web servisi entegrasyonu = P4 rayı (SBSGM MBYS kaydı), ödeyen doktor sonrası. | OPEN |

## e-Reçete — kimlik bir kez, gönderim Notya'dan (2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **NOTYA-ERECETE-01 — Ayarlar › e-Reçete + SGK kimlik doğrulama** (Kaan: "must have for all specialties; test with Dr. Gökhan or the other beta tester"): migration 038 `users.erecete_ayar` JSONB (TC + hekim şifresi encryptPII, tesis kodu, SGK branş kodu, ortam, e-imza yöntemi, son test); `lib/medula/ayar.ts` (+tests); `/api/doktor/erecete-ayar` GET (maskeli) / PUT / POST test = gerçek ortamda salt-okunur `ereceteSorgula('0')` ile kimlik doğrulama (kayıt açmaz, imza istemez); page `/dashboard/doktor/ayarlar/erecete` (nereden alınır rehberi dahil); reçete sayfasında `EReceteDurum` şeridi ("Medula'ya gönder" imza aracı gelene kadar pasif); BRANS_SGK `lib/medula/brans.ts`'e taşındı, Medula taslağı ayardaki branş kodunu önceler. Research findings: SGK web servisi = TC + Kurumsal Hekim Şifresi (Basic/WS-Security, her istekte), tesis kodu, 2016'dan beri imzasız kayıt yok, PIN işlem bazlı; **RRS renklirecete.saglik.gov.tr → SB Reçetem (recetem.enabiz.gov.tr)** — renkli + beyaz, hekim girişi yalnız e-imza, Doktor Bilgi Bankası kontrolü; entegre MBYS'ler için token ile imzasız yönlendirme var ama vendor kimliği KTS/SBSGM kaydı ister (P4). Reçetem linkleri/metinleri güncellendi. | SHIPPED |
| 2026-09-16 | **NOTYA-ERECETE-02 — Notya İmzacı (e-imza aracı) + canlı gönderim** — waits on Kaan/beta doctor: (1) e-imza var mı (kart/USB token hangi PC, ya da mobil imza), (2) tesis kodu, (3) hekim şifresi → Ayarlar'a girilir, "Bağlantıyı test et" ✅ olunca: XAdES-BES yerel imza aracı (açık kaynak kütüphane, lisans yok; PIN her reçetede), `imzaliEreceteGiris` ile canlı kayıt, e-reçete no nota + yazdırmaya. Mobil imza yolu operatör sözleşmesi ister (maliyet) — token öncelikli. | OPEN |
| 2026-09-16 | **NOTYA-ERECETE-03 — Reçetem tek tık** — KTS-kayıtlı MBYS vendor kimliği (SBSGM) alınınca Reçetem token yönlendirmesi (`Auth/…Login?accessToken`) ve HbysRaporEkle; P4 rayı, ödeyen doktor sonrası. Ayrıca MBYS/USS bildirim zorunluluğu aynı kayıtla çözülür. | OPEN (P4) |

## Dahiliye wow sprint — v2 brief (2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **NOTYA-DAH-WOW-v2 — revised sprint brief** `docs/DAH-WOW-BRIEF-v2.md` (Kaan: audit v1 brief, improve order/depth, add game changers from TR dahiliye practice + care quality): dependency-ordered Waves 0–4 with a QA gate each (tsc + tests + prod Ready, Claude audits at wave boundaries), objective "Strong" rubric (engine+tests+table+UI+Kaynak+smoke), SCORE2 source spec (ESC 2021 high-risk region calibration for Türkiye + SCORE2-OP + SCORE2-Diabetes, worked-example tests), check-up merge moved LAST, home-BP + portal logs merged into one table. Six NEW game changers: İlaç izlem takvimi (W1.6), Erişkin aşı takvimi (W2.6), Muayene öncesi hasta anketi (W2.7), Antikoagülan kartı (W3.2), Ramazan DM/HT rehberi (W3.7), Kronik kohort paneli + recall (W4.1); care nudges folded into DM/lipid/HT cards (SGLT2/GLP-1 indication flags, hipoglisemi riski, statin intensity gap, frailty/PHQ-2, KB ölçüm tekniği). Build = Cursor, wave by wave. | BRIEF WRITTEN — build waits on Cursor start |
| 2026-09-16 | **NOTYA-DAH-WOW-NEXT** — seven cards: yaşlı polifarmasi deprescribing (STOPP/START); hasta hedef kartı + Turkish eğitim yaprakları; sigara bırakma paketi; Vit D / B12 eksikliği + SGK rapor; e-Nabız geçmiş PDF → Belgeler import; gut/ürik asit card; osteoporoz DXA T-skoru card (TEMD_OSTEO). **SHIPPED 2026-09-17 (Kaan authorized).** Each card follows the wow pattern: pure engine + tests (in `npm test`), migrations `046_dahiliye_wow_next.sql` + `047_dahiliye_sgk_vitamin.sql` (both applied), API steps in `app/api/doktor/dahiliye/_wow5.ts` (hooked from route.ts GET/POST), and UI `ui/DahiliyeWow5.tsx` — Dahiliye › **Bakım+** row (Polifarmasi · Hedef kartı · Sigara · Vit D/B12 · Gut · Osteoporoz) and Belge › **e-Nabız**, 2 taps. Kaynak ref_code on every suggestion; hekim lock before the note (`kart_nota` writes only a locked plan). New verified refs: STOPP_START_V3 (Eur Geriatr Med 2023;14:625), ACR_GUT2020, EULAR_GUT2016 (checked via Crossref). **C1** `engines/polifarmasi.ts`: ≥65, 24 own-words class-level rules from hasta_ilaclar + approved eGFR/K/Na + card flags (ASKVH, AF, KY, DM, KOAH, osteoporoz, albuminuria, positive fall screen). A blocking stop needs a ≥15-char override reason, enforced in the engine, the API and a DB check. `dahiliye_polifarmasi_kararlari` log; hasta_ilaclar is never touched. **C2** `engines/hedefKart.ts`: only locked goals (HT hedef lock, DM hedef HbA1c, LDL/KVR locks); unlocked → "Hekiminiz belirleyecek"; 4 printable one-pagers (yaşam, HT, DM ayak/göz, statin) in our own words, no doses; print HTML only after hekim approval (`dahiliye_hedef_kartlari` + lock hedef/kart). **C3** `engines/sigara.ts`: pack-years, HSI, stage of change, 5A, ALO 171, NRT/vareniklin/bupropion class only with contraindication flags, 1 wk / 1 mo / 3 mo / 6 mo görevler, sigara_birakma sevk. No SGK template: stated honestly, current rules verified by the hekim. **C4** `engines/vitamin.ts`: approved VitD/B12/folat → status, next test, replacement class (hekim writes dose); SGK templates `vitd` (E55.9) and `b12` (D51.9 / E53.8) in `sgkRapor.ts`. **C5** inbound only: `core/lab/enabiz.ts` + belgeler/lab `cikar kaynak=enabiz` (vision pass with a per-row printed-date instruction; dates validated as not future and not before DOB; duplicates removed; panel_type `enabiz_gecmis`; dated row editing on the lab page). Identity guard and tablo onayla → raporla → Onayla gate unchanged; undated rows never reach approved series. No live e-Nabız pull. **C6** `engines/gut.ts`: flare classes (NSAİİ removed for eGFR<30 / KY / OAC; kolşisin eGFR and interaction checks), ULT indication strong/conditional/none, target <6 (<5 with tophi), ladder + prophylaxis, diet, septic-arthritis red flag in the strip, romatoloji/üroloji sevk. **C7** `engines/osteoporoz.ts`: T-score from an approved DXA belge (`tSkoruCikar`, saved only by hekim "Belgeden al") or hekim entry; WHO classes, clinical osteoporosis from fragility fracture, risk flags, class-level plan (bisphosphonate eGFR<35 guard), secondary work-up, DXA interval + görev; FRAX not computed (licensed). Unit tests 460 → 507 + enabiz 3. Smoke: new synthetic 78-year-old patient, local run **150 requests / 58 checks / 0 failures**. It caught one real bug: an SGK sablon check constraint, fixed in 047. Screenshots in `public/dahiliye-smoke/next-*.jpg`; post-sprint + gaps audit HTML updated. Real MD field beta still out of scope (not faked). | SHIPPED |

## DAH-WOW build log (Claude builds, 2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **DAH-WOW Wave 0 SHIPPED** — W0.1 prompts/ lock (`specialties/dahiliye/prompts/system.md`, `soap-dahiliye.md`, `asistan-ogrenme.md`, `tools.ts`); W0.2 Rx→hasta_ilaclar: already live since PR #150 (muayene onayı writes hasta_ilaclar; dahiliye reads it live, no fork) — İzlem sekmesi reads the same rows; W0.3 kart contract (`engines/kart.ts`, `dahiliye_kart_kilitleri`, adım `kilit` with allowed-field validation); W0.4 vizit şeridi (`engines/serit.ts`, sticky bar + 1-tap plan taslağı + kopyala). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 1 — core SHIPPED**: W1.1 şerit live; W1.2 KVR (`engines/score2.ts`: kural kovası ASKVH/DM+TOD/KBH → LDL hedef → statin yoğunluk açığı; SCORE2 katsayıları EHJ 2021 suppl. p9 değerleriyle kodda, **SCORE2_ONAYLI=false kilidi**: sayısal risk doğrulamaya kadar dönmez; SCORE2-OP/Diabetes ledgered); W1.3 CKD KDIGO (`engines/ckd.ts`, ısı haritası, kronisite, hızlı düşüş, plan, nefro sevk paketi → sevkler); W1.5 ev kayıtları (`dahiliye_ev_kayitlari`, `engines/evKayit.ts` beyaz önlük/maskeli, glukoz hipo); W1.6 ilaç izlem takvimi (`engines/ilacIzlem.ts`, 13 kural, görevler dahiliye_gorevleri'ne). Migration 039. UI `DahiliyeWow.tsx` (KVR · KBH · İzlem · Ev kayıt sekmeleri). KANONIK: UACR, Retic eklendi. | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-VERIFY** — waits on Claude (1 fetch): compare `engines/score2.ts` KATSAYI/OLCEK with EHJ 2021 ehab309 Updated Supplementary p9 (SCORE2 coefficients, S0 0.9605/0.9776, region scales), add 3 published worked examples to tests, flip `SCORE2_ONAYLI=true`. Until then the KVR card shows kural kovası + "doğrulama bekliyor". DONE 2026-09-17. **Source:** SCORE2 working group & ESC Cardiovascular risk collaboration, *SCORE2 risk prediction algorithms*, Eur Heart J 2021;42(25):2439–2454, doi:10.1093/eurheartj/ehab309 — file "SCORE2 Updated Supplementary Material.docx" (dated 2021-09-16) inside `ehab309_supplementary_data.zip`, downloaded from PMC8248998 (pmc.ncbi.nlm.nih.gov/articles/instance/8248998/bin/ehab309_supplementary_data.zip). academic.oup.com was behind a Cloudflare challenge, and PMC serves the supplement as DOCX, not PDF. **Compared line by line:** Suppl. methods Table 2 (log SHR ×9 per sex, S0 0.9605/0.9776, centring), Table 3 (scale1/scale2 for low/moderate/high/very high × sex), Table 4 calibration formula. **Discrepancies: none.** The diabetes term (0.6457/0.8096) is left out on purpose, per the table footnote. Tests: Table 4 worked example (50-year-old smoker, SBP 140, TChol 6.3, HDL 1.4; uncalibrated 0.0541/0.0332; calibrated M 0.0631/0.0811/0.0881/0.1506, F 0.0434/0.0523/0.0713/0.1414) in 5 tests, asserted against the published numbers; a changed scale or coefficient makes them fail (checked). The brief's suggested TC 5.5 / HDL 1.3 example does not appear in the supplement, so it was not used. `SCORE2_ONAYLI=true`; new Kaynak ref `ESC_SCORE2`; hekim lock unchanged (score → kova taslak → `kilit kvr.kategori`; no auto-note). Smoke: second synthetic patient (non-DM) → 8.8% through approved labs + lock; 90 requests / 21 checks / 0 failures; screenshot `public/dahiliye-smoke/kvr-score2.jpg`; audit row SCORE2/KVR → Strong (20/22). | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-OP** — SCORE2-OP (≥70) as a separate engine with its own ONAYLI gate + published worked examples. **SHIPPED 2026-09-17 (gate opened):** `engines/score2op.ts` holds ehab312 "Supplementary material_20210604_v2.docx" (PMC8248997) coefficients (match main-paper Table 2) + **Suppl. Methods Table 1** region scales (Türkiye = high: men 0.08/1.15, women 0.38/1.09). Tests reproduce Table 3 steps 1–2 (LP 0.5029/0.3298; uncalibrated 0.2442/0.2966) and Table 1 calibration of the same patient (low 15.2%/18.6%; high 30.6%/27.8%). **Resolution of the old contradiction:** Suppl. Methods Table 2 step 3 explicitly requires Table 1 scales; Table 3's "low-region" −0.85/0.82 and −0.61/0.89 do not exist in Table 1 and are a documentation error (kept as a negative test that the formula still matches those wrong numbers). Main-paper 16%→37% / 14%→44% is an approximate Figure S9 non-HDL chart read, not a continuous TC/HDL worked example. `SCORE2_OP_ONAYLI=true`. KVR ≥70 → SCORE2-OP % + kova taslak (≥70 thresholds 7.5/15); hekim locks; Kaynak `ESC_SCORE2_OP`. Smoke: synthetic 75 y male smoker Table-3 lipids → 27.8%, kova çok yüksek, hekim lock. | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-DIABETES** — SCORE2-Diabetes (ESC 2023, ehad260) for DM 40–69 as a separate engine with the same ONAYLI gate + published worked examples. **SHIPPED 2026-09-17:** `engines/score2diabetes.ts` holds the coefficients from Supplementary Methods Table 1 (PMC10361012 `supplementary_material.pdf`). They match line by line the formulas in the official calculator (`appendix_2.xlsx`, "values" sheet); s0 and region scales are the same as SCORE2. `tests/score2diabetes.test.ts` reproduces the published numbers: (1) main-paper Results, moderate region, 60 y: men 11.0% / 17.2%, women 12.7%; (2) low region 12.9% / 9.8%, very high 31.2% / 34.0%; (3) the official calculator's stored example, LP + uncalibrated risk + 4 regions × 2 sexes (high region men 15.39% / women 16.01%). Caveat on the ledger: the main text's women "7.9%" computes to 7.6% with these coefficients; the other 7 values match within ±0.05, so 7.9% is left out of the tests. `SCORE2_DIABETES_ONAYLI=true`. KVR card: ASKVH / DM+TOD / severe CKD → very high with no score (unchanged). Otherwise DM 40–69 → SCORE2-Diabetes: high-risk region (Türkiye), HbA1c % → mmol/mol by the IFCC–NGSP master equation, eGFR and HbA1c only from onayli rows, age at diagnosis from the DM card tanı tarihi or the new KVR input (`045_dahiliye_score2_dm.sql`, applied). ESC 2023 thresholds (<5 / 5–<10 / 10–<20 / ≥20) → kova taslak (never below a rule bucket such as orta KBH). Kaynak `ESC_SCORE2_DIABETES`; hekim locks. Any missing input → no number, the missing items are named, and the TEMD "en az yüksek" fallback stays. Smoke: synthetic DM 60 y patient on unapproved labs → no score; after Onayla → 12.5% high region, kova yüksek, hekim lock. | SHIPPED |
| 2026-09-16 | **DAH-WOW W1.4 SGK rapor şablonları SHIPPED** — `specialties/dahiliye/engines/sgkRapor.ts` + `tests/sgkRapor.test.ts` (HT/DM/statin/DOAK ilaç kullanım raporu; etken madde yalnız hasta_ilaclar, lab yalnız onaylı, T.C./ad saklanmaz, CHA₂DS₂-VASc hekim işaretli, mekanik kapak DOAK kilidi engeli); migration `040_dahiliye_sgk_rapor.sql`; `app/api/doktor/dahiliye/route.ts` adım sgkrapor/sgkkilit (e-Nabız zarfı `enabizSgkRapor`, hekim kimliği Medula ayarından); UI `DahiliyeWow.tsx` "SGK rapor" sekmesi (yazdır/PDF, zarf kopyala, hekim onayı). Wave 1 complete. | SHIPPED |
| 2026-09-16 | **DAH-WOW W1.5 portal entry** — closed by W2.7: Sağlığım › Takip › Muayene öncesi anket writes `dahiliye_ev_kayitlari` (kaynak=portal). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 2 SHIPPED — care loops**: W2.1 DM döngü (`engines/dmLoop.ts`: FIB-4, SGLT2/GLP-1 kardiyo-renal bayrak, hipoglisemi riski, ayak foto/FIB-4 görevleri); W2.2 anemi (`engines/anemi.ts`); W2.3 obezite/GLP-1 (`engines/obezite.ts`, bariatrik = sevk); W2.4 KETEM (`engines/tarama.ts`, jine tarihleri ortak); W2.5 HT panel + 14 gün lab takibi (`engines/htPanel.ts`); W2.6 erişkin aşı (`engines/asi.ts`, HYP); W2.7 ön anket (`engines/anket.ts`, portal `app/api/portal/hasta/[token]/dahiliye-anket/route.ts` + `app/portal/hasta/[token]/on-anket/page.tsx`, Takip kısayolu). Tests: `tests/{dmLoop,anemi,obezite,tarama,asi,anket}.test.ts`. Migration `041_dahiliye_wow_w2.sql`. Server `app/api/doktor/dahiliye/_ortak.ts` + `_wow2.ts`; UI `specialties/dahiliye/ui/DahiliyeWow2.tsx`, grouped tabs in `DahiliyeHome.tsx`; `lib/doktor/gununNotunaEkle.ts` alan param. | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 3 SHIPPED — breadth cards**: W3.1 KY/GDMT (`engines/hf.ts`); W3.2 antikoagülan (`engines/antikoagulan.ts`: TTR, DOAK uygunluk, HAS-BLED checklist); W3.3 KOAH/astım (`engines/pulm.ts`); W3.4 ofis GI + H. pylori (`engines/gi.ts`); W3.5 EKG 1-tap rapor + kırmızı kapı (`engines/ekg.ts`); W3.6 tiroid nodül TI-RADS tarzı (`engines/tiroidNodul.ts`); W3.7 Ramazan DM/HT (`engines/ramazan.ts`); W3.8 check-up paket defteri + birleşik rapor (`engines/checkupPaket.ts`). Tests `tests/{hf,antikoagulan,pulmGi,ekgNodul,ramazanCheckup}.test.ts`. Migration `042_dahiliye_wow_w3.sql`. Server `app/api/doktor/dahiliye/_wow3.ts`; UI `specialties/dahiliye/ui/DahiliyeWow3.tsx`; kart kilit alanları genişletildi (`engines/kart.ts`). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 4 SHIPPED — close**: W4.1 kronik kohort paneli (`engines/kohort.ts`, `app/api/doktor/dahiliye/_kohort.ts`, `app/api/doktor/dahiliye/kohort/route.ts`, `app/doktor-tools/dahiliye-kohort/page.tsx`; 1-tap recall via Sağlığım mesajları, klinik değer yok); W4.2 bakım kalitesi dürtmeleri (`engines/nudge.ts`: KB ölçüm tekniği kapısı şeritte, FRAIL, düşme, PHQ-2; `_wow4.ts`; NudgeBar; sonuç nota yalnız "Nota ekle" ile); rubric fixes (izlem/kırmızı/ilaç güvenliği ref_code, tiroid tanı kilidi); W4.3 `public/dahiliye-post-sprint-audit.html` (Araçlar'dan link). Migration `043_dahiliye_wow_w4.sql`. Tests `tests/kohortNudge.test.ts`. Audit result (strict §2): 0/22 Strong · 19/22 at 5/6 (smoke screenshot pending) · 3 Partial (SCORE2/KVR, Lab/Belgeler shared, prompts). | SHIPPED |
| 2026-09-16 | **DAH-WOW-SMOKE** — rubric criterion 5 for all domains. DONE 2026-09-17: dedicated QA doctor `qa.dahiliye@notya.ai` (specialty dahiliye; qa.test pediatri untouched; password only in .env.local), synthetic patient + approved lab panels via the real Onayla route, `scripts/dahiliye-smoke.mts` (83 API calls, 15 checks, 0 failures, re-runnable), 24 real headless-browser screenshots in `public/dahiliye-smoke/`, audit re-scored to 19/22 Strong (SCORE2/KVR, Lab/Belgeler, prompts/ stay Partial with reasons). Fixed along the way: onayla `notes.specialty` 500 on the no-muayene path; apiksaban "kriter yok" with no creatinine → "değerlendirilemez". | SHIPPED |
| 2026-09-17 | **DAH-WOW-SMOKE-FU** — seen in smoke screenshots: check-up kalem "Kırılganlık + düşme taraması" not auto-ticked from dahiliye_taramalar; Bakım kalitesi bar keeps "Nota ekle" after the result was added. DONE 2026-09-17: (1) `engines/checkupPaket.ts` kalem `tarama: ['frail','dusme']` — `paketDurumu` takes tarama dates (new `taramaTarihleri` in `_wow3.ts`, used by both GET and birleşik rapor) and ticks the item (kaynak `tarama`, checkbox locked like lab/belge) when BOTH a FRAIL and a düşme screening exist on/after paket tarihi or ≤12 months before it (annual nudge window); (2) migration `044_dahiliye_tarama_nota.sql` (applied) adds `dahiliye_taramalar.nota_eklendi_at`, set by `notaekle` only after `gununNotunaEkle` succeeds; NudgeBar shows "✓ notta" instead of "Nota ekle" for that result (a new screening row gets the CTA again). Tests: new check-up tarama test; smoke +2 checks — prod (old code) 2 failures, local with fix 84 istek / 17 kontrol / 0 hata. | SHIPPED |
| 2026-09-17 | **DAH-LAB-BELGELER** — close the Lab/Belgeler Partial row in the post-sprint audit. DONE 2026-09-17. **Engine re-audit:** new `core/lab/cikarim.test.ts` (in npm test) runs a synthetic digital PDF (`core/lab/fixtures/sentetikLabPdf.ts`, ASCII, no real document) through pdfjs → rows → canonical_key/units/flags. It also covers CSV header, BOM + semicolon and headerless fallback, printed-name aliases, `trTarihIso`, the vision pass via a stub client, and yapı/görsel reconciliation. **Bugs found and fixed:** (1) CSV `"8,2"` was parsed as 82 by SheetJS number parsing, a 10× HbA1c error; UTF-8 names ("Açlık Kan Şekeri") were garbled and dropped. CSV is now decoded as UTF-8 text with `raw: true`. (2) Inside Next the pdfjs fake worker could not load `pdf.worker.mjs`, so the structural pass failed silently and only Claude vision ran. The worker is now loaded in-process (`globalThis.pdfjsWorker`). (3) CSP had no `frame-src`, so the vault PDF preview (blob: iframe) was blocked on every document. `frame-src 'self' blob:` was added in `middleware.ts`; verified only by the console error going away, because headless Chromium has no PDF viewer. **Rubric C4:** `specialties/dahiliye/engines/labKaynak.ts` + tests. For dahiliye doctors, the raporla output gives each tanı a golden ref_code by ICD-10 chapter and the öneri one per abnormal lab group, shown behind the Kaynak toggle on the lab page. **Hekim lock (UI):** "Onayla ve son muayeneye ekle" now looks disabled until a tanı is locked (it already was disabled, and the route returns 400). **Display:** strip LDL/eGFR are rounded for display only (119.877 → 120). **Smoke:** `scripts/dahiliye-smoke.mts` adds a third synthetic patient and runs the real path: multipart vault upload → `cikar` (yapı + görsel) → `onayli=false` and the strip stays empty → raporla without tablo onayı 409 → tablo onayla → raporla → Kaynak check → Onayla without a tanı 400 → PATCH hekim tanısı → Onayla → `onayli=true` → strip HbA1c 7.9 %. Result: 103 requests, 33 checks, 0 failures. 6 real UI screenshots `public/dahiliye-smoke/lab-*.jpg`. Audit row Lab/Belgeler → Strong (21/22). | SHIPPED |
| 2026-09-17 | **DAH-PROMPTS-LOCK** — close the prompts/ Partial row honestly. DONE 2026-09-17. **Rubric:** brief §2 now has a separate **prompts rubric**: (a) exists + complete, (b) reviewed against goldens with no book text, (c) wired at runtime, (d) hekim lock language. Criteria 1–2 are N/A by design; no engine or table was invented. **Real gap found:** nothing loaded `specialties/dahiliye/prompts/*` at runtime (the KD/derm prompts/ folders aren't loaded either; not in scope here). **Wiring:** `specialties/dahiliye/prompts/index.ts` (fs loader; throws if a file is missing) is used by `lib/doktor/soapUret.ts` `soapSistemPromptu` → `sessions/[id]/end` + `sessions/ses-yukle` (new `doktorBransi` = users.specialty, so the lock applies even without a session context), by `asistan/chat/route.ts` (system.md + tools map), by `doktor/hafiza/route.ts` (compact lock in the voice sesBlogu) and by `stilProfiliDamit` via `notes/[id]/approve` (asistan-ogrenme.md). tools.ts is a read-only step map in the prompt, not Anthropic tool calls (chat has no tool loop; dotted names would be invalid anyway; card writes stay hekim actions). For dahiliye, SOAP `receteOnerisi` doz/kullanım/mg are stripped in code (`dahiliyeReceteDozsuz`). `next.config` `outputFileTracingIncludes` traces the .md files; confirmed in the `.nft.json` of all 5 routes. **Review fix:** system.md rule 5 excluded ACEi/ARB/statin from the pregnancy warning. It now says ACEi/ARB and statin are contraindicated, and everything else gets "gebelikte gözden geçir". ESC_SCORE2 was added to the Kaynak list. **Tests:** `specialties/dahiliye/tests/promptsLock.test.ts` (11). **Runtime:** `scripts/dahiliye-prompts-smoke.mts` on `next start`: 4/4 (hafıza lock loaded; real SOAP 200, reçete without doses; chat flags ACEi contraindication with no mg). Audit prompts/ row → Strong on the prompts rubric → 22/22. | SHIPPED |
| 2026-09-17 | **DAH-PROMPTS-FU** — seen in the prompts smoke SOAP output for an adult dahiliye patient: aiDegerlendirme ended with "Büyüme/VKİ değerlendirmesi için büyüme persentili bölümüne bakınız". The shared `soapKurallari()` carries pediatri growth-percentile wording for every branch. Scope it to pediatri/çocuk branches. The KD/derm `prompts/` folders are also not loaded at runtime (same gap dahiliye had). DONE 2026-09-17 in two PRs, one per specialty. **Shared bleed:** fixed once in `soapKurallari(pediatrik)` / `pediatrikKapsam()` (KD-PROMPTS-LOCK #278). It was confirmed on real generated notes before the fix: dahiliye (the original sighting), **kadın doğum** (27-week prenatal note, aiDegerlendirme "Büyüme persentiline bakınız"), and **dermatoloji** (24-year-old nodülokistik akne note with kilo/boy dictated, 2/2 runs "Büyüme persentiline bakınız"; without kilo/boy, 0/2). Every adult branch was affected. After the fix: 0 hits in KD (4 notes: 2 direct, the `next start` smoke and the production smoke) and derm (5 notes including the `next start` smoke). Pediatric prompt text is byte-identical. **KD:** prompts/ wired, plus a second bug: profile `kadin-dogum` was not recognised by `session/new`, so KD notes ran as "genel" (see KD-PROMPTS-LOCK). **Derm:** prompts/ wired, no extra routing bug: `session/new` already sends `dermatoloji`, and no KD/dahiliye lock text reaches a derm prompt (tested) (see DERM-PROMPTS-LOCK). **Folder completeness vs dahiliye:** KD and derm both have system.md + tools.ts + soap-*.md + asistan-ogrenme.md (+ vision-asistan.md), so nothing is missing and nothing was authored. | SHIPPED |
| 2026-09-17 | **KD-PROMPTS-LOCK** (DAH-PROMPTS-FU, kadın doğum half; PR #278). DONE 2026-09-17. **Trace:** nothing loaded `specialties/kadin-dogum/prompts/*` at runtime; only `tools.ts` was re-exported from `index.ts`, and no route used it. There was also a second gap. Real KD profiles store `users.specialty = 'kadin-dogum'`, which `app/session/new` did not recognise. SOAP therefore ran with `context.specialty = 'genel'` and the "genel" persona ("…pediatride kilogram başına dozlamayı esas alırsın"). **Bleed verified on a real note:** a synthetic 27-week prenatal SOAP (transcript only, via `soapNotuUret`) ended aiDegerlendirme with "Büyüme persentiline bakınız (uygulama büyüme modülünde)". **Fix (shared):** `soapKurallari(pediatrik)` + `pediatrikKapsam()`. Growth-percentile/Neyzi, baş çevresi, prenatal öykü, mg/kg and veli wording now apply only to pediatri/çocuk branches and to mixed-age genel/aile, which keep the guard. Locked adult branches get "VKİ sınıfı veya persentil hesaplayıp sayı uydurma" instead. Pediatric output is byte-identical to before (checked). This also fixes the adult dahiliye note from DAH-PROMPTS-FU. `soapPersonaAnahtari` falls back to users.specialty for the persona, and `session/new` maps `kadin-dogum` → `kadin-hastaliklari-dogum`. **Wiring:** `specialties/kadin-dogum/prompts/index.ts` (fs loader, throws on a missing file) feeds `soapSistemPromptu` (system.md + all 4 soap-*.md with a pick-by-visit-type line + tools map; SB/ACOG as two aiDegerlendirme lines), asistan chat (system.md + vision-asistan.md + tools map), hafıza sesBlogu (system.md without the citation bullets) and `stilProfiliDamit` (asistan-ogrenme.md). `next.config` traces the .md files; confirmed in the `.nft.json` of all 5 routes. **Review fix:** the vision disclaimer in system.md / vision-asistan.md was ASCII ("destegi, tani degildir"). It now uses the `VISION_DISCLAIMER` UI text. **Tests:** `specialties/kadin-dogum/tests/promptsLock.test.ts` (13, including tools.ts = manifest whitelist, cited roles = manifest books, no-bleed on shared rules). **Runtime:** `scripts/kd-prompts-smoke.mts` on `next start` with QA doctor `qa.kd@notya.ai` (users.specialty `kadin-dogum`, synthetic patient deleted after): 4/4. The hafıza lock loaded. A real SOAP call without context.specialty returned 200 with no persentil/Neyzi/büyüme/veli text and SB/ACOG columns in aiDegerlendirme. Chat on a high-risk ikili tarama answered "tanı değil" → NIPT / CVS / amniyosentez. The KD `prompts/` folder is complete vs dahiliye (system, tools, soap-*, asistan-ogrenme, plus vision); nothing new was authored. | SHIPPED |
| 2026-09-17 | **DERM-PROMPTS-LOCK** (DAH-PROMPTS-FU, dermatoloji half). DONE 2026-09-17. **Trace:** nothing loaded `specialties/dermatoloji/prompts/*` at runtime; `tools.ts` was only re-exported from `index.ts`. Unlike KD, routing was fine: `users.specialty = 'dermatoloji'` is a SPECIALTIES key, so `session/new` sends it and the SOAP persona was already the Dermatoloji one. **Bleed:** present before #278 (see DAH-PROMPTS-FU). On main after #278 it was gone before any derm wiring (2 notes), and it stays gone with the lock (2 local notes + smoke). **Wiring:** `specialties/dermatoloji/prompts/index.ts` (fs loader, throws on a missing file) feeds `soapSistemPromptu` (system.md + soap-derm / soap-phototherapy / soap-procedure with a pick-by-visit-type line + tools map), asistan chat (system.md + vision-asistan.md + tools map), hafıza sesBlogu (system.md without the citation bullets) and `stilProfiliDamit` (asistan-ogrenme.md). `dermatolojiMi` matches /derma/ (router) and "Deri ve Zührevi". `soapPersonaAnahtari` maps that unvan to `dermatoloji`. `next.config` traces the .md files; confirmed in the `.nft.json` of all 5 routes. **Review fix:** the vision disclaimer was ASCII ("destegi, tani degildir"). It now uses the `VISION_DISCLAIMER` UI text. **Tests:** `specialties/dermatoloji/tests/promptsLock.test.ts` (12, including tools.ts = manifest whitelist, every manifest book role cited, no KD/dahiliye lock in derm prompts, adult rules). **Runtime:** `scripts/derm-prompts-smoke.mts` on `next start` with QA doctor `qa.derm@notya.ai` (users.specialty `dermatoloji`, synthetic patient deleted after): 5/5. The hafıza lock loaded. A real fototerapi SOAP call without context.specialty, with kilo/boy dictated, returned 200 with no persentil/Neyzi/veli/ACOG text; the phototherapy template flagged the missing J/cm² and cumulative dose plus the TBSE reminder. Chat on "is this mole melanoma" answered "karar desteğidir, tanı değildir" → dermoskopi, uzman onayı. **Lock effect seen in notes:** before the lock, fototerapi notes had no J/cm² / TBSE structure; now they do. | SHIPPED |
| 2026-09-17 | **DERM-PROMPTS-FU** — seen in DERM-PROMPTS-LOCK notes. (1) Same dose issue as KD-PROMPTS-DOZ-FU: the derm lock has no dose rule, and receteOnerisi / aiDegerlendirme carry izotretinoin "0,5 mg/kg/gün ≈30 mg/gün" and cumulative "120–150 mg/kg" from memory. The same hekim decision applies to both specialties. (2) One akne note called the izotretinoin onam "BZBH Form 014 benzeri". BZBH Form 014 is in system.md's `state` citation list but is not an izotretinoin consent form, so a hekim should review that list line and the GÖP isotretinoin onam wording. (3) Model text leaks the internal id name `coreImageId` into aiDegerlendirme ("fotoğraf kaydı (coreImageId) … alınmamış"). Consider a lock line to say "fotoğraf" in doctor-facing text. Not authored here (clinical/prompt content). | SHIPPED → KD-DERM-SAFETY-FINDINGS F1 (doses) + F4 (form name, coreImageId) |
| 2026-09-17 | **KD-PROMPTS-DOZ-FU** — seen in KD-PROMPTS-LOCK notes: the KD lock has no dose rule (dahiliye's system.md has "Doz yazma"), so the model still writes doses from memory. Examples: receteOnerisi anti-D "300 mcg (1500 IU) IM", aspirin "81 mg/gün" in aiDegerlendirme, and once "anti-D (300 mcg)" in the plan body when the hekim never said a dose. It also cited "ACOG Practice Bulletin No. 222" from memory instead of `protocols/acog-map.ts`. Needs a hekim decision on the KD dose policy (strip like `dahiliyeReceteDozsuz` or allow) and then a system.md rule. Not authored here. | SHIPPED → KD-DERM-SAFETY-FINDINGS F1 |
| 2026-09-17 | **ASISTAN-PERSONA-BRANS-FU** — seen in the KD chat smoke: with no personaId, `/api/asistan/chat` falls back to `getPersonaForSpecialty('genel')` → pediatri "Prof. Dr. Ayşe Kaya" for a KD doctor. The KD lock is appended and governs the content, but the persona identity (and `proactiveDoseExample`) is still pediatric. Pick the default persona from users.specialty. The long KD chat answer also hit `max_tokens` mid-JSON, so the route fell back to raw text and `speech` carried the ```json fence and the truncated tail. Make the parser salvage truncated JSON (as `jsonKurtar` does for SOAP) or raise the limit. | SHIPPED → KD-DERM-SAFETY-FINDINGS F2 (persona) + F3 (truncated JSON) |
| 2026-09-17 | **NOTYA-DAH-GAPS-AUDIT — remaining gaps after 22/22 Strong** | Fresh audit (not a re-grade): `public/dahiliye-gaps-audit.html` → https://notya-ai.vercel.app/dahiliye-gaps-audit.html; Araçlar link. Open now: DAH-SCORE2-OP, DAH-SCORE2-DIABETES, DAH-PROMPTS-FU, ledger hygiene; NEXT pack (7 cards) waits on Kaan; real MD beta still QA-only. Intentional outs unchanged. **Refreshed 2026-09-17:** SCORE2-Diabetes, the NEXT pack (7/7), SCORE2-OP (`SCORE2_OP_ONAYLI=true` — Table 2 mandates Table 1 scales; Table 3 step-3 typo documented) and ledger hygiene are marked shipped; the real MD beta is still open. | SHIPPED |
| 2026-09-16 | **DAH-02** (Rx → hasta_ilaclar + dahiliye cards) — covered by DAH-WOW W0.2 (live since PR #150) and SGK rapor etken madde reading hasta_ilaclar (W1.4). | SHIPPED |

## KD-DERM-SAFETY-FINDINGS (2026-09-17)

Real findings from the KD-PROMPTS-LOCK (#278) and DERM-PROMPTS-LOCK (#279) test notes, fixed in priority order, one PR each.

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **F1 — no "invented doses" lock for kadın doğum / dermatoloji** (closes KD-PROMPTS-DOZ-FU, DERM-PROMPTS-FU (1)). **Trace:** dahiliye had a prompt rule (system.md #2 "Doz yazma … hekim dozu yazar") and a code check, `dahiliyeReceteDozsuz`. That check only stripped `receteOnerisi`, so the plan body, `aiDegerlendirme` and `ilaclar` were never covered. **Fix:** (a) `## Doz kilidi (kırılmaz)` in `specialties/kadin-dogum/prompts/system.md` (anti-D, tokolitik, oksitosin/misoprostol, MgSO4, antenatal steroid, aspirin, LMWH, demir/folik asit/D vit/iyot, kontraseptif, acil kontrasepsiyon, HRT) and `specialties/dermatoloji/prompts/system.md` (izotretinoin günlük+kümülatif, biyolojik/sistemik, topikal steroid potens sınıfı only, antibiyotik/antifungal kürleri, fototerapi J/cm²). Plain lines, so the rule reaches SOAP, chat and voice; ÖNCELİK + SOAP receteOnerisi line as in dahiliye. (b) New `lib/doktor/dozKilidi.ts` code check for dahiliye/KD/derm (`dozKilitliBrans`): receteOnerisi doz/kullanım always stripped (the old dahiliye function, now shared). Any dose token (mg, mcg, IU, ünite, mL, mU/dk, mg/kg/gün, ranges, ≈) whose number is in neither the transcript nor the kimliksiz patient context is replaced with "[doz hekim tarafından belirlenir]" in every note field and `ilaclar`, and listed in a "⚠ Doz kontrolü (hekim onayı)" line in aiDegerlendirme. Doses the hekim dictated are kept exactly. Lab units (mg/dL, g/dL, mL/dk/1.73, mIU/mL) and 50/75/100 g OGTT are excluded. The same check runs on `/api/asistan/chat` speech (source = doctor's messages + patient file + verified drug context). **Verified:** `lib/doktor/dozKilidi.test.ts` (9, in npm test) uses the literal failing strings (anti-D (300 mcg) in plan, aspirin 81 mg/gün, izotretinoin 0,5 mg/kg/gün ≈30 mg/gün, 120–150 mg/kg); KD/derm promptsLock tests assert the rule reaches all 3 surfaces. **Real regression** `scripts/doz-kilidi-smoke.mts` on `next start` with qa.kd / qa.derm and synthetic patients, no dose dictated: KD anti-D SOAP, KD aspirin SOAP, KD anti-D chat, derm izotretinoin SOAP, derm izotretinoin chat → **18/18, run twice**. The code check never had to fire (the model itself wrote "Doz hekim tarafından belirlenir" / "Doz kilidi: sayısal doz yazılmamıştır"); chat pointed to KÜB / TDD Akne instead of a number. tsc clean, npm test 431/431. | SHIPPED |
| 2026-09-17 | **F2 — chat persona defaulted to pediatri for KD / derm doctors** (ASISTAN-PERSONA-BRANS-FU persona half). **Trace:** `/api/asistan/chat` picked `requestedPersona \|\| prefs.preferred_persona \|\| getPersonaForSpecialty(body.specialty = 'genel')`, and 'genel' resolves to pediatri Ayşe. Also found: nothing ever writes `doctor_preferences.preferred_persona`, and the column default is `'elifsahin'` (`lib/db/asistan_schema.sql`). All 3 prod rows held that value, so from their 2nd chat every doctor (any branch) got the **nöroloji** colleague. The /asistan page always opened on Ayşe. `getSpecialistForSpecialty` had no alias for users.specialty `kadin-dogum` or "Deri ve Zührevi Hastalıklar", and "İç Hastalıkları" lost its match to the combining dot left by `toLowerCase`. **Fix:** `varsayilanPersonaId(request specialty, users.specialty)` in `lib/asistan/personaEngine.ts`: a branch doctor gets their branch colleague; genel / aile / pediatri / unknown keep Ayşe (b9406a9). It uses the strict `findSpecialistForSpecialty` (added aliases + U+0307 strip). The chat route uses it for new sessions and stops reading `preferred_persona`. The /asistan page applies it when the doctor has no saved tab. The written-chat labels use the active persona's name, not a hardcoded "Ayşe". **Verified:** `lib/asistan/personaEngine.test.ts` (4, in npm test). Real `/api/asistan/chat` on `next start` with no personaId (both QA doctors carry preferred_persona = elifsahin): qa.kd → Prof. Dr. Fatma Çelik (Kadın Hastalıkları ve Doğum), qa.derm → Prof. Dr. Selin Aksoy (Dermatoloji); before: pediatri (1st chat) / nöroloji (later). **Mobile:** /asistan as qa.kd at 390px and 360px (gstack browse): header "Fatma Çelik Hocam", scrollWidth = viewport (no overflow), written-chat panel fits. Gap found and handed to F3: the written-chat panel shows "Yanıt alınamadı." for every answer (route returns `speech`, UI reads `response`). tsc clean, npm test 435/435. | SHIPPED |
| 2026-09-17 | **F3 — long KD chat answer cut off and shown as raw JSON** (ASISTAN-PERSONA-BRANS-FU second half). **Trace:** `/api/asistan/chat` ran `max_tokens: 800` and `JSON.parse(whole text)`, falling back to `speech = rawResponse`. On long questions the real model returns a short JSON wrapper (`"speech": "… aşağıda derledim"`), writes the actual content as markdown **after** the object, and hits max_tokens. Reproduced 3/3 with the real KD chat prompt. So the parse failed and the doctor got the ```json fence, the object and the cut tail. Also found (F2 mobile check): the written-chat panel read `response/message/cevap`, but the route returns `speech`, so **every** answer displayed as "Yanıt alınamadı.". Long markdown table lines also widened the panel to 515px on a 390px screen. **Fix:** new `lib/asistan/yanitCoz.ts` `asistanYanitiCoz(raw, stop_reason)`: a complete object keeps its fields, and trailing markdown after it is appended to speech. On a cut (max_tokens or unclosed object), speech is salvaged up to the cut and the escape tail is dropped. The action is dropped (a half-written action never runs), and a Turkish note is appended: "Yanıt uzunluk sınırında kesildi. Devamı için "devam et" yazın ya da soruyu daraltarak tekrar sorun." A JSON-shaped reply with no readable speech shows "Yanıt tamamlanamadı." plus the note, never the object. The route uses the parser and logs cuts, and max_tokens goes 800 → 1600. The prompt says the whole answer goes inside speech and long topics come in parts. The panel reads `data.speech` through the same parser as a guard, and bubbles use `overflowWrap: anywhere`. **Verified:** `lib/asistan/yanitCoz.test.ts` (8, in npm test), including the real wrapper+markdown shape and escape cuts. `scripts/asistan-kesik-yanit-smoke.mts` 3/3: the real model cut mid-JSON (old parse fails, raw text) → clean Turkish + note; the real route long KD answer → 200, 3.2k chars, no raw JSON, cut note. **Mobile / UI** (qa.kd, `next start`, gstack browse) at 390px and 360px: the long answer renders as markdown with the cut note, no ```json / {"speech", scrollWidth = viewport, 0 overflowing elements. "devam et" continues the answer in the same session. Before the fix: "Yanıt alınamadı." and a 515px panel. Not fixed (pre-existing): `HafifMarkdown` renders markdown tables as pipe text. tsc clean, npm test 443/443. | SHIPPED |
| 2026-09-17 | **F4 — derm note text: invented consent form name, leaked internal field name** (DERM-PROMPTS-FU (2)(3)). **Reproduced on main** (real `soapNotuUret`, derm lock, synthetic izotretinoin visit with "onam bir sonraki vizitte", "fotoğraf çekemedik"), 4 runs: `coreImageId` in doctor text 2/4 ("standardize lezyon fotoğrafı (coreImageId)"), invented consent form 2/4 ("tedavi onam formu (BZBH Form 014)", "BZBH Form 014 (gebelik önleme programı formu)"). **Trace:** derm system.md listed "BZBH Form 014" under `state` with no meaning; it is the notifiable communicable / zührevi disease report, not a consent form. The derm SOAP lock literally said "Fotoğraf/dermoskopi kimliği (coreImageId) …", and soap-*.md / tools.ts use storage field names. **Fix:** (a) derm system.md: the state line says Form 014 is the bildirim form, "onam formu değildir"; new `## Onam ve form adları (kırılmaz)`: no invented form names or numbers, izotretinoin onam only as "izotretinoin onam formu", form text stays with the hekim. It reaches SOAP, chat and voice. (b) derm SOAP lock line reworded without the id. KD and derm SOAP/chat locks: new rule, no internal field or tool names in doctor-facing text, use the clinical word. (c) Code, all branches: `lib/doktor/klinikMetin.ts` `notMetinleriniTemizle` on every string of the generated note (`soapNotuUret`) and `doktorMetniTemizle` on chat speech. Internal ids (coreImageId, dicomId, pathologyId, photoId, lesionId, VisionRead, islem_oncesi, uzman_onayli, generic `…Id`) are replaced with the clinical word, and a parenthetical id is dropped. A "Form NNN" reference in a consent sentence becomes "onam formu (hekimin kullandığı form)"; real bildirim sentences (sifiliz, TSİM, bulaşıcı) keep Form 014. **Verified:** `lib/doktor/klinikMetin.test.ts` (5, in npm test) on the literal leaked strings, with no false positives on clinical text; derm promptsLock (d) test. `scripts/derm-not-metni-smoke.mts` on the same synthetic visit after the fix: **8/8** (4 runs), and the raw model output before the code cleaner was already clean in 4/4 (prompt fix alone). The notes now say "İzotretinoin onam formu bir sonraki vizitte imzalatılacak" and "lezyon fotoğrafı ve dermoskopi görüntüsü alınamamıştır". Server-side text only, no UI change, so no mobile check needed. tsc clean, npm test 449/449. | SHIPPED |

## NONURGENT-CLEANUP (2026-09-17)

Three known non-urgent items from the KD-PROMPTS-LOCK (#278) and F3/F4 (#282/#283) follow-ups. Standing rule applied (Kaan, 2026-09-17): Turkish references and practice first (TİHUD, TEMD, SB/HYP, Uzlaşı, SGK, the Turkish specialty society, e.g. TJOD). An international source is used only when no Turkish one exists or the Turkish guideline defers to it.

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **KD-KAYNAK-KILIDI — KD notes / chat cited guideline document numbers from memory.** **Reproduced** on the real routes (`next dev`, qa.kd, `scripts/kd-kaynak-kilidi-smoke.mts`, `SMOKE_ETIKET=once`). 4 of 5 KD chat answers had an unverifiable number: PPH "ACOG Practice Bulletin #183" (not in the repo's verified list), GBS "ACOG Practice Bulletin 797" (797 is a Committee Opinion, so the document type was invented), PPROM "ACOG PB 188" (acog-map has PB 217), and "Clinical Consensus 1" (postpartum pain) cited for PPH. The 3 SOAP cases had none. The prompt only said "ACOG Practice Bulletin / Committee Opinion" and "TR hekim pratik gold standard: ACOG", so the model recalled numbers itself and cited ACOG first. **Fix:** (a) `specialties/kadin-dogum/prompts/system.md`: Turkish source first (SB rehberleri DÖBYR / Riskli Gebelikler / Doğum Sonu Bakım, SUT/SGK, TJOD). ACOG stays as the separate "klinik öneri" column, or is used where no Turkish equivalent exists. New `## Kaynak kilidi (kırılmaz)`: no document number or year from memory, for international **or** Turkish sources. The rule reaches SOAP, chat and voice. (b) `protocols/dogrulanmis-kaynaklar.ts` is the only citable list, copied from sources already verified in the repo (acog-map rows + related documents named in their notes, DÖBYR 2026 / Yayın No. 1402, TJOD PKOS 2023, TJOD Endometriozis 2014). Each topic names its Turkish equivalent first: DÖBYR for izlem / OGTT / anti-D / aneuploidy / NST, Riskli Gebelikler for PE / preterm, Doğum Sonu Bakım for postpartum. GBS and CS/VBAC have no Turkish guideline in the repo, so they get no invented one. The list is rendered into the SOAP and chat lock from code. (c) Backstop `lib/doktor/kaynakKilidi.ts`: a numbered ACOG PB/CO/CC/OCC/CS, SMFM Consult Series, RCOG Green-top or NICE NG/CG citation, a TJOD/TMFTP/DÖBYR year, or a Yayın No. is kept only if it is in the list **and** its topic is discussed in the same answer / field. Otherwise it becomes the organisation name ("ACOG önerileri", "TJOD …") plus a "⚠ Kaynak kontrolü (hekim onayı)" line (SOAP aiDegerlendirme / chat bubble) and a server log. Wired into `soapNotuUret` (KD) and `/api/asistan/chat` (KD). Internal source-role ids (`pratik_altin_standart_tr_hekim`) no longer leak into doctor text (klinikMetin). **Verified:** `lib/doktor/kaynakKilidi.test.ts` (8, the literal failing strings, in npm test). promptsLock KD test for the Kaynak kilidi. Real-route smoke after the fix, two consecutive runs 24/24: no unverified number reaches the doctor, and the model obeyed the lock (backstop did not fire) in all 5 chat + 3 SOAP cases. Answers now cite "SB Doğum Sonu Bakım Yönetim Rehberi", "DÖBYR 2026" and "ACOG CO 797". Topic check tuned on real output: whole-answer topic, not a ±200-char window, because answers cite in a closing Kaynak table. **Not done / noted:** year-only ACOG claims ("reaffirmed 2023") are prompt-covered only. The model still attributes content to named SB rehberleri, which cannot be checked against book text. `citeProtocol()` now TR-first (SB → Temel KD → ACOG → Williams; product directive 2026-09-17 overrides prior ACOG-first display ranking). PPH blood-loss "≥500 mL" dose-lock false positive fixed in `dozKilidi` (volume thresholds excluded). tsc clean, npm test 521/521. | SHIPPED |
| 2026-09-17 | **MD-TABLO — markdown tables rendered as raw pipe text in chat** (noted in F3 #282 / F4 #283). **Trace:** every doctor-facing AI bubble (Asistan yazılı sohbet, hasta konsult, not-konsult, epikriz, SGK rapor) uses the dependency-free `components/asistan/HafifMarkdown.tsx`. It supported bold / bullets / label rows only, so `\| SB \| ACOG \|`, `\|---\|`, `## heading` and `---` showed literally. No markdown library in package.json. **Fix:** extended HafifMarkdown (no new dependency). A pure parser `lib/asistan/markdownTablo.ts` (GFM pipe tables: header + separator, alignment colons, rows with/without outer pipes, short/long rows, escaped pipes, a trailing-space separator as the model writes it) renders a real `<table>` with bold cells. `#`/`##`/`###` render as headings and `---` as a rule. The table sits in a horizontal scroll wrapper with `width: 0; minWidth: 100%`. The first attempt (`maxWidth: 100%`) still let the table's max-content width grow the chat panel to 421px on a 390px screen, left edge cut. **Verified:** `lib/asistan/markdownTablo.test.ts` (4, real answer shapes, in npm test). Real app (`next dev`, qa.kd, gstack browse): asked Fatma Çelik for a GDM 75 g vs 50+100 g SB/ACOG comparison. The real answer rendered 1 table (3 columns, 8 rows) with 0 raw `\|` / `#` / `---` lines and 0 console errors. Desktop 1280: the table scrolls inside the fixed 530px panel. **390px and 360px:** document scrollWidth = viewport, panel 16→374 / 16→344, the table scrolls inside the bubble (655px table in a 268/241px wrapper). Screenshots `smoke-out/md-tablo-{desktop,390,360}.png`. Seen in the answer: the model wrote "Conflict: true" (echo of system.md's `conflict: true` wording). Cosmetic, left as is. tsc clean, npm test 521/521. | SHIPPED |
| 2026-09-17 | **DAHILIYE-BETA-REHBERI — real dahiliye MD field-beta path, documented** (documentation only, no simulated doctor). `docs/DAHILIYE-BETA-REHBERI.md` (Turkish, for the beta internist): 0 invariable rules (asistan drafts / hekim locks, flag ≠ tanı, no dose, approved lab rows only, nothing auto-stopped/sent). 1 account + branş (onboarding Dahiliye; the tab shows for dahiliye/aile/genel doctors on adult patients; default colleague Zeynep Arslan, checked against `varsayilanPersonaId`; e-Reçete optional). 2 the `scripts/dahiliye-smoke.mts` path as doctor steps: KB + şerit + ölçüm tekniği, Belgeler lab → Asistana raporla → Onayla (unapproved rows stay out), e-Nabız PDF, the HT/DM/Lipid/KVR-SCORE2/KBH/Tiroid table, Ev kayıt / İzlem / Ön anket, Check-up birleşik rapor, 1-tap plan, Kohort panel. Every row has a "hekim kilidi" column. 3 the 7 WOW-NEXT cards with their gates (override ≥15 chars, Belgeden al, FRAX not computed, …). 5 end-of-session checklist (incl. no invented dose or guideline number). 6 what to do if something looks wrong. Every button label was checked against the UI source. Images are only the existing synthetic QA screenshots in `public/dahiliye-smoke/`, labelled "Örnek ekran — QA verisi". No invented screenshots; Vit D/B12, e-Nabız and gut have no screenshot and are described in text. Linked from `docs/README_DAHILIYE.md` and from the new `docs/beta/README.md` index, next to Dr. Gökhan's beta test lists (those were not linked anywhere before). **Found:** there is **no in-app feedback / support channel**. The guide says so and gives the current beta practice from Dr. Gökhan's lists: notes to Kaan by WhatsApp / e-posta, no patient identity. | SHIPPED |
| 2026-09-17 | **BETA-GERI-BILDIRIM-KANALI** — **DECIDED (2026-09-17):** beta döneminde in-app "Sorun bildir" **yapılmayacak**. Beta hekimler geri bildirimi **WhatsApp / e-posta** ile, **hasta kimliği olmadan** Kaan'a iletir. In-app kanal (kimliksiz ekran bağlamı + free text) **deferred until post-beta** — Kaan'dan bekleyen karar yok. Guide wording: `docs/DAHILIYE-BETA-REHBERI.md` §6, `docs/beta/README.md`. | DECIDED / deferred-until-post-beta |

| 2026-09-17 | **F1 dose-lock false positive — PPH ≥500 mL** — `uydurmaDozTemizle` no longer treats blood-loss volume thresholds (mL with ≥/≤/PPH/kan kaybı context) as invented drug doses; real mg/mcg/IU doses still locked. Regression in `lib/doktor/dozKilidi.test.ts`. | SHIPPED |
| 2026-09-17 | **citeProtocol TR-first** — citation display order SB/national TR → Temel KD → ACOG → Williams (overrides prior ACOG-first ranking for Notya display). Test updated in `sources-acog.test.ts`. | SHIPPED |

## MOBILE-REVIEW — two-day build, phone widths (2026-09-17)

Scope: everything shipped in the dahiliye wow sprint, the e-reçete / renkli reçete work, and the KD/derm prompt-lock work. Layout/rendering only; clinical logic, locks, Kaynak content and the dose guard were not touched. **Method:** real app (`next dev`, `qa.dahiliye@notya.ai`, synthetic smoke patients from `scripts/dahiliye-smoke.mts`), gstack browse (headless Chromium) at **360 / 390 / 412 / 428px** (+1280 regression). Per surface: body/document scrollWidth vs viewport; elements past their card or the viewport, including ones the global `overflow-x: hidden` silently cuts; controls under 24px; sticky behaviour when scrolled; a visual read of every screenshot. Evidence: `smoke-out/mobile-review/*-{once,sonra}.png` (gitignored, same as MD-TABLO). Temporary fixtures: synthetic `hasta_ilaclar` rows (Pantoprazol/Alprazolam/Morfin QA, no dose) on the smoke note for the split sheets, and a known PIN on the smoke portal token. Removed afterwards; the next smoke run reseeds the token.

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **Checked, already fine.** All 31 dahiliye sections (Özet, HT, DM, DM döngü, Lipid, KVR, KBH, Tiroid, Anemi, Obezite, Tarama/Aşı, İzlem, Ev kayıt, Ön anket, KY, Antikoagülan, Solunum, GI, EKG, Ramazan, the 7 WOW-NEXT cards: Polifarmasi, Hedef kartı, Sigara, Vit D/B12, e-Nabız, Gut, Osteoporoz; plus Check-up, İlaçlar, SGK rapor, Sevk): no page-level side-scroll at any width. Also fine: the expanded 1-tap plan, the check-up ledger and birleşik rapor, the nefro sevk text, the Hedef kartı table (fits at 282px), the e-Nabız upload card, the EReceteDurum strip, the RrsPaneli on the kırmızı/yeşil sheets (each color on its own sheet), and chat tables at 360–428 on /asistan, hasta konsult and not-konsult. No KD/derm UI file changed in the window (only prompts/safety), so none was re-rendered. | CHECKED |
| 2026-09-17 | **#288 (1/3):** SGK rapor select, fixed at 380px, ran past the card at all widths → `maxWidth 100%`. Görev ✓ 27×19 → 36×28; "Nota ekle" 63×19 and two lines → 28px, one line. Kohort rows didn't wrap (3-line badge ovals, 4-line button) → wrap. **Belge/lab page** 2-column grid never stacked (report in a 188px column, body 393–629px) → new `.notya-grid-yigin` (≤768px `minmax(0,1fr)`; a plain `1fr` let the lab table push the column to 629px). Lab table scrolls in its own wrapper, and "Resmi tanıya al" drops under the text. **Portal takip + ön anket:** white hero CTA on a white panel ("Gönder", "Anketi doldur" read as text), panels flush to the screen edge → `sg-pin-btn` + `.sg-fade` inset. | SHIPPED |
| 2026-09-17 | **#289 (2/3):** Ayarlar › e-Reçete 2-column inputs cut placeholders at 360 → stack. Reçete page kutu −/+ 20×20 → 28×28 (still hidden in print); "← Geri" nowrap. **Reçetem bekleyenler showed the patient name as raw JSON** `{"ad":"…"}` for every patient (`name_encrypted` is `{ad,soyad}` JSON) → `/api/doktor/rrs` GET decodes it; plain-text HL7 names pass through. | SHIPPED |
| 2026-09-17 | **3/3 — chat markdown (verifies #286 across the full answer):** the table fix held, but a long `**Label:** value` row (label track `max-content` + `nowrap`) pushed the chat panel to 445px on a 360px screen and cut the left edge, table included. Fix: `fit-content(45%) minmax(0,1fr)` with a wrapping label, plus `overflowWrap: anywhere` on the HafifMarkdown root (HastaKonsult's bubble let an unbroken token spill). Verified with a stubbed answer (wide 4-column table, long label, 90-character unbroken token, long URL, headings, rule) in the real /asistan chat, hasta konsult and inceleme not-konsult at 360/390/412/428: body = viewport, no content past the bubble, table scrolls inside; 1280 unchanged. Epikriz / SGK rapor use the same component, but their answers need a live LLM run, so they weren't rendered. Guard test in `lib/asistan/markdownTablo.test.ts`. | SHIPPED |
| 2026-09-17 | **MOBILE-STICKY-GLOBAL — no `position: sticky` in the app actually sticks** (desktop too): the vizit şeridi, DoktorNav, KD/derm strips, note header, klinik/mali/avukat navs. Cause: `app/globals.css` `html, body { overflow-x: hidden }` makes `body` a scroll container while the window scrolls. Verified: with `overflow-x: clip` sticky works (`smoke-out/mobile-review/sticky-serit-360x640-clip-deneme.png`), but then (a) the nav becomes sticky on every page, taking 65px of a 640px phone screen, and (b) the dahiliye şerit (136px tall at 360) and the KD/derm strips park at `top: 0` **under** the nav (z 100). Today the şerit simply scrolls away and covers nothing. **Not changed:** app-wide chrome behaviour beyond this review. If wanted: `overflow-x: clip` on html/body (keep `hidden` as the fallback line), strips `top: <nav height>`, and a one-line collapsed şerit under 480px. | OPEN (Kaan decision) |
| 2026-09-17 | **HEDEF-KARTI-KB-UNDEFINED** (found in the review, not layout): Hedef kartı shows "Tansiyon **undefined mmHg altı**" and the KB lock input shows "undefi". `specialties/dahiliye/engines/hedefKart.ts` reads `kbHedef.sbpUst/dbpUst`, but the HT target is stored as `{sbp, dbp}` (check-up report prints `HT: hedef: {"dbp":80,"sbp":130}`), so the status is also computed against `undefined` (always hedef dışı). Clinical logic, left for a separate ticket. | OPEN |
| 2026-09-17 | Minor, not changed: placeholders cut in narrow fixed-width dahiliye inputs ("hedef INR aralığı", "T total kalça", "uyanınca ilk sigara (dk)"); the value is still typed and shown normally. Headless caveat: native `<select>` / date pickers and the iOS 16px-focus zoom can't be judged in headless Chromium, so they need a real iPhone/Galaxy pass. | NOTED |

## KASA-BELGE-01 — "Kasadaki belge açılmıyor" (Dr. Gökhan, canlı, 2026-09-17)

Dr. Gökhan uygulamayı kullanırken bildirdi: bir hastanın Kasa'sına lab sonucu PDF'i yükledi, listede
**"Hasta I_ki laboratuvar sonuc_ları.pdf"** olarak göründü (Türkçe harfler bozuk), tıklayınca altta
dosya adı + "İndir" / "Kapat" olan bir panel açıldı ama **belge içeriği görünmedi**. Ayrıca bu
yüklemenin bir **AI değerlendirmesine** gidip sonucun **muayene formuna** eklenebilmesi gerektiğini
hatırlattı; öyle olmadığını gördüğünü söyledi.

**Yeniden üretildi** gerçek rotalarla: `next dev` + sentetik QA doktoru (`qa.dahiliye@notya.ai`) +
sentetik hasta ("TEST — Kasa Belge Smoke") + sentetik lab PDF'i (`core/lab/fixtures/sentetikLabPdf.ts`),
`scripts/kasa-belge-smoke.mts`. Dr. Gökhan'ın hesabına, hastalarına ve belgelerine dokunulmadı.
Tarayıcı doğrulaması gerçek Google Chrome ile (headless shell'de PDF eklentisi yok).

**Üç ayrı kök neden bulundu; ilk ikisi tek kaynaktan: Türkçe harfler.**

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **Belge açılmıyor = indirme rotası 404. Asıl hata CSP veya görüntüleyici değil, HTTP başlığıydı.** `app/api/doktor/documents/[id]/download/route.ts` ham dosya adını `Content-Disposition: inline; filename="…"` içine yazıyordu. HTTP başlıkları yalnız Latin-1 taşır; **ğ ş ı İ Latin-1'de yok**, Node başlığı reddedip atıyor, istek rotanın genel `catch`'ine düşüp **404 "Dosya indirilemedi"** dönüyordu. Sonuç: Türkçe adlı her belgede hem önizleme hem **İndir** ölüydü (DocumentViewer `objectUrl` alamadığı için İndir bağlantısı da tıklanmıyordu). **ç ö ü Latin-1'de olduğu için o adlar tesadüfen çalışıyordu** — hata bu yüzden "bazen oluyor" gibi görünüyordu. Ölçüldü: `ascii.pdf` 200, `sonuç.pdf` 200, `sonucları.pdf` **404**, `ığş.pdf` **404**, `çöğüş-Öçü.pdf` **404**. **Fix:** `contentDispositionAd()` (lib/vault/validation.ts) — RFC 5987: ASCII yedek `filename=` + gerçek adı taşıyan `filename*=UTF-8''…`. Sessiz 404'ün aylarca hatayı gizlemesini önlemek için rotaya `console.error` eklendi. **Verified:** indirme 200, baytlar yüklenenle birebir aynı (1191/1191), Chrome'da İndir dosyayı **"Hasta İki laboratuvar sonuçları.pdf"** adıyla kaydediyor, PDF blob iframe'de tam sayfa render oluyor (`smoke-out/kasa-iframe.png`). | SHIPPED |
| 2026-09-17 | **Dosya adı bozulması (I_ki / sonuc_ları).** `sanitizeFileName` izin listesi önceden-birleşik ("precomposed") Türkçe harfleri sayıyordu (`ğüşıöçĞÜŞİÖÇ`), ama **macOS dosya adlarını NFD (ayrışmış) verir**: "İ" = "I" + U+0307, "ç" = "c" + U+0327. Taban harf `\w` ile geçiyor, birleşen işaret listede olmadığı için `_` oluyordu — ekrandaki "I_ki" / "sonuc_ları" tam olarak bu. **Fix:** önce `normalize('NFC')`, sonra Unicode duyarlı süzgeç (`\p{L}\p{N}`), böylece Türkçe/Kürtçe/Arapça adlar aynen kalır; yol ayıracı, denetim karakteri ve baştaki nokta hâlâ temizlenir. Ayrı bir "görünen ad" alanına gerek olmadı — depolama anahtarı zaten `db:{uuid}`, dosya adı hiçbir zaman anahtar değil. **Verified:** yükleme → kayıt → liste → indirme zincirinin tamamında ad `"Hasta İki laboratuvar sonuçları.pdf"`. | SHIPPED |
| 2026-09-17 | **Aynı hata sınıfı ikinci yerde: aylık rapor PDF indirme.** `app/api/doktor/raporlar/pdf/route.tsx` ay adını başlığa ham yazıyordu; **şubat / mayıs / ağustos / kasım / aralık** (12 ayın 5'i) Latin-1 dışı harf taşıdığı için o aylarda rapor indirme 500 veriyordu. Aynı `contentDispositionAd()` ile düzeltildi. İnceleme sırasında bulundu, Dr. Gökhan bildirmedi. | SHIPPED |
| 2026-09-17 | **AI değerlendirme + muayene formu: boru hattı VAR, eksik olan bağlantıydı (keşfedilebilirlik, kod değil).** NOTYA-BELGE-01 (`Asistana raporla` → taslak rapor → resmi tanı kilidi → Onayla → SOAP Objektif) ve NOTYA-LAB-01 (`Lab` → tablo çıkar → onayla → raporla) zaten çalışıyor ve **hasta dosyası › Belgeler sekmesinde** (`PatientDocumentVault`) düğmeleri var. Ama Dr. Gökhan'ın yükleme yaptığı **`/dashboard/doktor/belgeler` ("Belge Kasası")** sayfasının liste satırlarında yalnız ad + tür + boyut + Sil vardı; sayfa çıkışsız bir arşiv gibi duruyordu. **Fix (yeni AI mantığı yazılmadı):** Kasa satırlarına aynı iki bağlantı eklendi — "Asistana raporla" → `/dashboard/doktor/hastalar/{hastaId}/belgeler/{belgeId}`, "Lab" → aynı yolun `/lab`'ı — ve listenin başına ne yaptıklarını anlatan bir satır. **Verified (uçtan uca, gerçek rotalar + gerçek Claude):** Kasa'ya yüklenen PDF → `cikar` 6 satır → `tablo_onayla` → `raporla` (taslak özet üretildi) → hekim tanısı kilitlenmeden `onayla` **400** (hekim kapısı duruyor) → tanı kilitlendi → `onayla` 200 → muayene notunun `content_objektif` alanında `[Lab] … E11.9` bloğu. Tarayıcıda: Kasa'daki "Asistana raporla" bağlantısı gerçek analiz sayfasını açıyor (taslak özet, olası tanılar + ICD-10, "Onayla → Muayene Objektif", `smoke-out/kasa-asistana-raporla.png`). | SHIPPED |
| 2026-09-17 | **Temizlik:** `DocumentViewer` içinde ölü PDF.js CDN yükleyicisi (`ensurePdfJs` / `renderPdf` / canvas + sayfa okları) duruyordu — `pdfPages` hiç set edilmediği için o kod hiç çalışmıyordu, ama "belge açılmıyor" hatasını araştıran herkesi yanlış yere bakmaya itiyordu. Kaldırıldı; PDF önizleme tek yoldan, blob iframe ile. | SHIPPED |
| 2026-09-17 | **Değişmedi, bilerek:** CSP'de `object-src` yok (→ `default-src 'self'`). Gerçek Chrome'da blob iframe PDF'i sorunsuz render ediyor (`frame-src 'self' blob:` yeterli), bu yüzden politika genişletilmedi. Ayrıca `next.config.mjs` ile `middleware.ts` iki ayrı CSP tanımlıyor; pratikte middleware'inki kazanıyor (tek başlık ölçüldü) ama **ikisi ayrışmış durumda** — `next.config.mjs`'deki kopyada `frame-src` yok. Bugün zararsız; ileride Next davranışı değişirse ya da biri yalnız birini güncellerse sessizce belge önizlemesini kırar. Tek kaynağa indirmek ayrı, küçük bir iş. | OPEN (Kaan kararı) |

**Mobil kontrol (standing rule):** 360 / 390 / 428 / 1280px, gerçek Chrome. İki bağlantı eklenince
satır 360px'te **kendi kutusunu 29px aşıyordu** (satır genişliği 290, scrollWidth 319) — sayfa
yan kaymıyordu ama içerik kesiliyordu. Düzeltme: satıra `flexWrap: 'wrap'`, dosya adına
`flex: '1 1 140px'` + `minWidth: 0`. Sonrası: her genişlikte `scrollWidth ≤ width`, 360'ta ad üstte,
üç eylem altta; 1280 tek satır, değişmedi. Ekran görüntüleri `smoke-out/kasa-mobil-*.png` (gitignored).

## RANDEVU-IPTAL-REAKTIVASYON — canlı hata, Dr. Gökhan (2026-09-17)

**Nasıl geldi.** Dr. Gökhan uygulamayı kullanırken bildirdi: bir randevuyu iptal etti, takvimde
üstü çizili göründü, sonra üstüne tıklayıp saatini değiştirdi ve Güncelle'ye bastı — randevu HÂLÂ
iptal görünüyordu. Sorusu: *"Bu randevu nasıl yeniden aktif oluyor?"* Ayrıca aynı modaldeki
doğrudan iptal düğmesinin "hiç tepki vermediğini" söyledi.

**Kök sebep 1 — iptal tek yönlü bir kapıydı (asıl hata).** Takvimin üstü çizili göstermesi BAYAT
ARAYÜZ DEĞİLDİ; veri gerçekten `durum='iptal'` kalıyordu. Saat düzenlemesinin `durum`'a dokunmaması
doğru davranış (kaydetmek bir randevuyu sessizce aktifleştirmemeli) — asıl eksik, geri dönüş
yolunun HİÇ OLMAMASIYDI. `app/dashboard/doktor/randevular/page.tsx` içinde durum değiştiren her
düğme iki kapının arkasındaydı: gün kartında `rv.durum !== 'iptal'`, modalda
`duzenlenenRandevu.durum !== 'iptal'`. Yani randevu iptal olur olmaz Onayla/Tamamlandı/Gelmedi/
Yeniden Planla/Sil dahil TÜM aksiyonlar gizleniyordu; modal "Mevcut durum: İptal" rozetinden
ibaret kalıyordu. Kodda iptal edilmiş bir randevuya başka bir durum gönderebilen tek bir tıklama
yolu yoktu — iptal kalıcıydı. Dr. Gökhan'ın sorusunun cevabı gerçekten "olmuyor"du.

**Kök sebep 2 — modaldeki İptal Et düğmesi bayat bayrak yüzünden kayboluyordu.** `duzenlemeyeAc()`
`modalIptalAcik`/`modalIptalNedeni`'yi sıfırlamıyordu ve modalı ARKA PLANA dokunarak kapatmak
(`formuSifirla()` çağırmadan sadece `setFormAcik(false)`) bayrağı açık bırakıyordu. Sonraki açılışta
aksiyon satırının tamamı (İptal Et dahil) gizli geliyor, üstelik önceki iptal nedeni metni de
duruyordu — kullanıcı gözünden "düğme tepki vermiyor".

**Kök sebep 3 — hatalar yutuluyordu.** `durumDegistir()` oturum yoksa sessizce `return` ediyor,
PATCH 4xx/5xx dönerse yanıtı hiç kontrol etmeden `yenile()` çağırıyordu; `silIslemi()` de aynı.
Her iki durumda doktor için sonuç: düğmeye bas, hiçbir şey olmasın, hiçbir açıklama çıkmasın.

**Kök sebep 4 — reaktivasyonda çift kayıt açığı (düzeltirken bulundu).** `durum` değişimi
çakışma kontrolünü hiç tetiklemiyordu. İptalden sonra o saat başka bir hastaya verilmiş olabilir;
kontrolsüz bir reaktivasyon iki randevuyu aynı saate koyardı — çift kayıt engelleme bu üründe
opsiyonel değil.

**Ne yapıldı.**
- Yeni `lib/randevu/randevuDurum.ts`: `randevuGuncellemePlani()` (bir PATCH gövdesinin hangi
  sütunlara dokunduğunu hesaplayan saf fonksiyon) + `randevuAksiyonlari()` (duruma göre hangi
  düğmelerin görüneceği). API rotası ile arayüz artık aynı cümleyi kuruyor; aksiyon listesinin iki
  ayrı yerde, iptal dalı eksik biçimde tekrarlanması hatanın ta kendisiydi.
- **"↺ Aktif Hale Getir"** aksiyonu: hem düzenleme modalında (iptal nedeni + neden Güncelle'nin
  yetmediğini anlatan açıklama ile birlikte) hem gün görünümü kartında. `durum='planlandi'` yazar,
  `iptal_nedeni`'ni temizler, `hatirlatma_gonderildi`'yi sıfırlar (hasta yeniden hatırlatma alsın).
  Modal KAPANMAZ, rozet anında "Planlandı"ya döner — Dr. Gökhan'ın yapmak istediği "aktif et +
  saatini değiştir" tek akışta bitsin diye.
- Reaktivasyon artık çakışma kontrolünden geçiyor; slot dolmuşsa 409 + "Önce saati değiştirin,
  sonra aktif hale getirin". Buna karşılık İPTAL durumundaki bir randevunun saatini değiştirmek
  artık çakışma kontrolü İSTEMİYOR (iptal satırı kimsenin önünü kesmiyor, kesilmemeli de).
- İptal edilmiş randevu gün görünümünde artık Yeniden Planla ve Sil'e de erişebiliyor (eskiden
  tek bir düğmesi yoktu).
- `duzenlemeyeAc()` ve arka plana dokunarak kapatma artık modal durumunu sıfırlıyor; `durumDegistir()`
  ve `silIslemi()` başarı/başarısızlık döndürüyor ve hatayı ekranda gösteriyor (modal açık kalıyor).
- Dokunma hedefi: `aksiyonBtn` / `modalAksiyonBtn` 28px → 36px (`minHeight` + inline-flex).

**Doğrulama.** `scripts/qa-randevu-iptal-reaktivasyon.mts` GERÇEK PATCH route handler'ını sahte
oturum + bellek içi tablo ile çalıştırıp Dr. Gökhan'ın adımlarını birebir tekrarlıyor (SENTETİK
QA doktoru/hastası — gerçek hesaba, gerçek hastaya, production veritabanına dokunmuyor, PHI yok):
oluştur → iptal (üstü çizili) → saati değiştir + Güncelle (hâlâ iptal, doğru) → Aktif Hale Getir
(Planlandı, iptal nedeni temiz) → slot dolmuşken reaktivasyon (409) → boş saate taşıyıp aktif et
(Planlandı). Regresyon testi `lib/randevu/randevuDurum.test.ts` (12 test) `npm test`'e eklendi;
596/596 yeşil, `npx tsc --noEmit` temiz. Mobil (standing rule): modalın yeni iptal bloğu 360px ve
390px'te gerçek CSS ile render edildi — yatay taşma yok, metin sarıyor, düğmeler 123×36.

---

## CLOSED — onaydan muayene formuna dönüş yolu yoktu (NOTYA-MUAYENEYE-DON-01, 2026-09-17)

**Şikayet (Dr. Gökhan, canlı).** Hasta dosyasında M-CHAT-R/F'i uyguladı, puanladı,
"Bugünkü Muayene Formuna Ekle"ye bastı. Her şey doğru çalıştı: yeşil onay paneli sonucu
("Otizm özelliği yok", puan, risk) ve "Bugünkü muayene formuna eklendi." mesajını gösterdi.
Tek eksik: oradan sonucu yazdığı muayene formuna dönecek bir bağlantı yoktu — formu menüden
elle bulmak zorunda kalıyordu.

**Paylaşılan mı, kopyalanmış mı (tarama sonucu).** İkisi birden — ve ayrım tam da düzeltmenin
şeklini belirledi:
- **Sunucu tarafı PAYLAŞILMIŞ.** `lib/doktor/gununNotunaEkle.ts` tek bir yardımcı ve ~10 rota
  onu çağırıyor (mchat, gelişim-taraması, gebelik, jinekoloji, dahiliye, göz, dermatoloji).
  Önemlisi: zaten hangi nota yazdığını (`notId`) döndürüyordu — veri hep oradaydı, kimse
  arayüze taşımıyordu.
- **Arayüz tarafı KOPYALANMIŞ (forked).** Ortak bir "eklendi" onay bileşeni YOKTU. Her tüketici
  onayı kendi yerel string state'inde tutuyordu (`setNotEklendi` / `setMesaj`) ve kendi
  `<div>`'inde çiziyordu; `calistir(body, ok)` yardımcısı 5 branş kabuğunda birbirinin kopyası.
  Yani "tek yerde düzelt, herkes kazansın" diye bir yer mevcut değildi — önce yaratmak gerekti.

**Ne yapıldı.**
- Yeni **`lib/doktor/muayeneFormuYolu.ts`** (saf, test edilebilir): `muayeneFormuYolu(notId)`
  (hekimin düzenleyip yeniden onaylayabildiği `/dashboard/doktor/notlar/[id]` sayfası),
  `MUAYENE_FORMUNA_DON` etiketi tek kaynakta, ve `eklenenNotId(yanit)` — iki farklı API yanıt
  şeklini (`{notEkleme:{eklendi,notId}}` ve düz `{ok,notId}`) tek kurala indiriyor.
- Yeni **`components/doktor/MuayeneFormunaDon.tsx`** — eksik olan ortak bileşen. Kasıtlı olarak
  ikincil: düz bağlantı, dolgu yok, 12px, uygulamadaki mevcut "Notu aç →" deseniyle aynı teal
  (#2DD4BF) — birincil yeşil onayla yarışmıyor. `notId` yoksa hiç çizilmiyor, yani not
  gerçekten eklenemediyse hekim ölü bir bağlantıya tıklayamıyor.
- Bağlanan tüketiciler (her biri kendi kopyalanmış onay kutusunda): `HastaMchat` (şikayetin
  kendisi), `HastaGelisimTaramasi`, `HastaGebelik` (izlem / lohusa / genetik tarama),
  `BugunkuJineMuayene`, `DahiliyeHome` ve `GozHome` kabukları.
- `notId`'yi zaten atan rotalara geri koyduk: göz (`olcum_nota`, `intake_nota`), dahiliye
  (`notaekle`, `kart_nota`, `polifarmasi_nota`, `anketsoap`, `htpanel`, `ekgonay`, `sgkkilit`).
- Bayat bağlantı koruması: mesaj başına bir bağlantı. `GozHome`/`HastaGebelik`'te `setMesaj`
  sarmalandı, yeni her mesaj bağlantıyı düşürüyor; yalnız gerçekten nota yazan akışlar geri
  koyuyor. Böylece alakasız bir onayın altında bir önceki notun bağlantısı asılı kalmıyor.

**Etiket.** "Muayene Formuna Dön →" — Dr. Gökhan'ın istediği sözcükler. Uygulamadaki mevcut
yakın kural "Notu aç →" (belge/lab analizi onayları); görsel dil ondan alındı ama metin
korunmadı: oradaki eylem "başka bir yerden notu aç", buradaki "az önce çalıştığın forma dön".

**Doğrulama.** `scripts/qa-muayene-formuna-don.mts` GERÇEK `POST /api/doktor/mchat` handler'ını
ve GERÇEK `wow4Post` (dahiliye "Nota ekle") fonksiyonunu sahte oturum + bellek içi tablolarla
çalıştırıyor (SENTETİK QA doktoru/hastası — gerçek hesaba, gerçek hastaya, production
veritabanına dokunmuyor, PHI yok). Dr. Gökhan'ın senaryosu birebir: 20 soru normal yanıtlandı →
0/20 "Otizm özelliği yok" → forma eklendi → bağlantı çıkıyor ve **tam olarak** satırın yazıldığı
nota gidiyor (genel not listesine değil), önceki not içeriği korunuyor. İkinci tüketici (dahiliye
taraması, ayrı/kopyalanmış onay arayüzü) aynı şekilde doğrulandı. Negatif durum: bugün muayene
yoksa onay da bağlantı da çıkmıyor. Regresyon testi `lib/doktor/muayeneFormuYolu.test.ts`
(8 test) `npm test`'e eklendi; **607/607 yeşil, `tsc --noEmit` temiz**.

**Mobil (standing rule).** Yeni onay satırı gerçek inline stilleriyle 360px ve 390px'te render
edildi: yatay taşma yok (ölçüldü, taşan öğe listesi boş), bağlantı mesajın altına sarıyor,
dokunma hedefi 149×36 (12px metin korunarak `minHeight: 36` ile büyütüldü — repo'nun 36px
dokunma hedefi kuralı).

**Açık kalan (kapsam dışı bırakıldı, kasıtlı).** Göz rotasının `olcum_nota`/`intake_nota`
adımları not eklenemediğinde HTTP 200 + `{ok:false}` dönüyor; kabuktaki `calistir` yalnız HTTP
durumuna baktığı için bu halde yine de başarı mesajı yazıyor. Bu ÖNCEDEN VAR OLAN bir etiketleme
hatası, bu iş onu yaratmadı ve büyütmedi (bağlantı o durumda doğru şekilde çıkmıyor). Ayrı bir
düzeltme hak ediyor.

**Branş kapsamı (cross-specialty-parity).** Bu dal açıldığında
`.cursor/skills/cross-specialty-parity/SKILL.md` henüz yoktu; #296 ile main'e indi ve merge
sırasında alındı, sözleşme geriye dönük uygulandı. Kapsam bloğu PR gövdesinde.
## CROSS-SPECIALTY-PARITY — standing rule + retroactive sweep of 2026-09-17 (Kaan)

**Standing rule, now a skill.** `.cursor/skills/cross-specialty-parity/SKILL.md` (new; sits beside
`specialty-audit-report` and `specialty-hasta-portali`, neither touched). It says: a fix is reported
from one branş's screen but is not finished until you can name which of Notya's 30 registry branches
(`lib/doktor/specialties.ts`) it reaches and why. Before closing any change to the shared spine
(SOAP, İnceleme/onay, reçete/Medula, Belge Kasası, randevu/takvim, epikriz, Asistan sohbet, Sağlığım
kabuğu, intake, lab çıkarım, doz/kaynak kilidi), name the shared files you touched; for the ~26
baseline-only branches a properly-scoped shared fix covers them **by construction** with no
per-branş verification — the single exception being behavior gated by specialty (`users.specialty`,
`SpecialtyKey`, `specialtyProfile`, persona id, eligibility rule), which must be walked; and for each
chapter that owns a `specialties/<slug>/` folder, check individually whether it forked the thing you
fixed (its own `prompts/system.md` wording, its own copy of a UI component or guard) and would
therefore miss it. The chapter list is **read live** (`ls specialties/` + the `CHAPTERS` map in
`lib/specialties/registry.ts`), never hardcoded, because it grows every sprint. Every shared-spine PR
must carry a **"Branş kapsamı"** block naming what was checked; "fixed X" alone is not enough, and
"no fork found, nothing to do" is an expected, valid result — inventing chapter changes to have
something to show is listed as an anti-pattern.

**Retroactive sweep — today's shared-spine fixes, what was checked.** Commits reviewed by diff (not
title): F1 doz kilidi (#280), F2 varsayılan persona (#281), F3 ham JSON yanıt (#282), F4 iç alan /
uydurma form adı (#283), KD-KAYNAK-KILIDI + MD-TABLO (#286), PPH doz-kilidi FP (07ef910),
MOBILE-REVIEW 1–3 (#288/#289/#290), DAH-LAB-BELGELER ortak lab motoru (#276),
RANDEVU-IPTAL-REAKTIVASYON (#294), KASA-BELGE-01 (#295). Chapters checked individually: dahiliye,
dermatoloji, kadın-doğum (göz-hastaliklari excluded — another agent was mid-build on it).

*Correctly shared, no fork anywhere, nothing to do:* F3 `lib/asistan/yanitCoz.ts` and F4
`lib/doktor/klinikMetin.ts` run ungated on both the chat and SOAP paths. F2 `varsayilanPersonaId`
resolves through `findSpecialistForSpecialty` over the whole 30-specialist catalog. The MD-TABLO
renderer (`lib/asistan/markdownTablo.ts` + `components/asistan/HafifMarkdown.tsx`) has no forked copy
— every consumer (İnceleme, epikriz, SGK rapor, konsült, sohbet) imports the shared one. Kasa
(`lib/vault/validation.ts`, `components/doktor/DocumentViewer.tsx`), randevu (`lib/randevu/randevuDurum.ts`,
`app/api/doktor/randevular/`) and the lab engine (`core/lab/cikarim.ts`) likewise have no chapter
copy. The MOBILE-REVIEW work split cleanly: `.notya-grid-yigin` and the portal pages are shared, the
rest were dahiliye-only components with no derm/KD counterpart to mirror.

*Found and fixed — the dose-invention guard reached 4 branches out of 30.* F1 built the guard in
shared files (`lib/doktor/dozKilidi.ts`, `lib/doktor/soapUret.ts`, `app/api/asistan/chat/route.ts`)
but gated it behind `dozKilitliBrans` — dahiliye, kadın doğum, dermatoloji, göz. The other ~26
branches ran the same SOAP and chat code with **no backstop at all**: a kardiyoloji note carrying
"metoprolol 50 mg" the hekim never said, or a pediatri note with an invented mg/kg, shipped as
written. Split into two strengths rather than widening the gate, because the guard does two different
jobs: `soapDozKilidi` (unchanged, chapters only) is the full lock and also strips `doz`/`kullanim`
from `receteOnerisi` — that is a **product policy** their prompts promise, and forcing it on pediatri
would delete the kg/doz reçete önerisi that NOTYA-SOAP-02 §3 designs for. New `soapDozUydurmaKilidi`
applies the **safety backstop only** (invented dose → `[doz hekim tarafından belirlenir]` + a
"⚠ Doz kontrolü (hekim onayı)" line in aiDegerlendirme) and now runs for every other branch; a dose
the hekim actually dictated is still passed through untouched, and receteOnerisi doses survive. The
chat cleaner was hoisted out of the `dozKilitliBrans` block so it runs for all branches, with the
chapters additionally told in-bubble why a number disappeared (matching how KD's kaynak kilidi
already behaves there).

*Found and fixed — dahiliye's own prompt had drifted behind KD/derm.* F1 wrote a full
`## Doz kilidi (kırılmaz)` block into `specialties/{kadin-dogum,dermatoloji}/prompts/system.md` but
gave dahiliye only the code refactor, leaving its terser rule #2 without the three clauses that stop
the model writing a number in the first place: don't invent from memory/guideline, pass a dictated
dose through unchanged instead of "correcting" it, and give no number when asked for a dose in chat.
Added those to dahiliye's `Kırılmaz kurallar` #2 (so they reach the compact voice lock too) plus a
full `## Doz kilidi (kırılmaz)` section with dahiliye's own drug scope (antihipertansif, statin, OAD,
SGLT2i/GLP-1, insülin titrasyonu, antikoagülan, levotiroksin, allopürinol/kolşisin, D vit/B12,
bifosfonat, demir, PPİ, antibiyotik), matching the KD/derm pattern. Asserted in
`specialties/dahiliye/tests/promptsLock.test.ts`.

*Checked, correctly NOT generalized.* The citation lock (`lib/doktor/kaynakKilidi.ts`) stays KD-only
by construction: it needs a per-chapter verified-source list to compare against
(`specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar.ts`), and running it without one would
strip every citation as unverified. Extending it is a **chapter build** (each chapter authors its own
verified list), not a missing parity fix — noted here so the next chapter sprint picks it up rather
than assuming the guard already covers them.

Ship bar: `npx tsc --noEmit` clean, `npm test` 605/605 (was 600 — 5 new parity tests).

## HASTA-FORMU-SIGORTA-OPSIYONEL — Dr. Gökhan, canlı, 2026-09-17

**Nasıl geldi.** Dr. Gökhan ekran görüntüsüyle bildirdi: Hasta Bilgi Formu'nun 4. bölümünde
(**Sağlık Güvencesi**) üç alan kırmızı yıldızla zorunlu işaretliydi — **Özel Sigorta Şirketi**,
**Poliçe / Üyelik Numarası**, **Kurum / İşveren Adı** — oysa üçünün de ipucu metni zaten
`Yoksa "Yok" yazın` diyordu. Hastaların çoğunun özel sigortası yok; alan zorunlu kaldığı için
hasta formu gönderebilmek adına kutuya **"Yok" yazmak zorunda** kalıyordu. Talep: alanlar kalsın,
ipucu kalsın, **zorunluluk kalksın**.

**Kök sebep — şema ile ipucu metni ayrışmıştı.** `lib/intake/coreAlanlar.ts` alan başına tek bir
`zorunlu` bayrağı tutuyor; hem formun kırmızı yıldızı, hem istemci doğrulaması, hem sunucu
doğrulaması bu bayraktan okuyor. Üç alanda bayrak `true` bırakılmış ama placeholder "yoksa boş
geçebilirsin" diyordu. Tek satırlık bir çelişki, ama hastaya "Yok" yazdırdığı için veriyi de
kirletiyordu: "Yok" dizesi ile boş alan aynı bilgiyi taşır, ikincisi dürüst olanı.

**Ne yapıldı.**

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **Üç sigorta alanından `zorunlu: true` kaldırıldı** (`lib/intake/coreAlanlar.ts`). Alanlar da ipucu metinleri de aynen duruyor — yalnız kırmızı yıldız ve doğrulama gitti. `sigortaTuru` (Sağlık Güvenceniz: SGK / özel / ücretli) **zorunlu kaldı**: onda "Yok" ipucu yok ve hangi güvenceyle geldiği klinik/mali olarak gerçekten gerekli. | SHIPPED |
| 2026-09-17 | **Aynı desen dört yerde daha vardı, hepsi düzeltildi.** Dr. Gökhan üçünü bildirdi ama `yoksa "Yok" yazın` ipucu taşıyan başka zorunlu alanlar da vardı: çekirdekte **Geçirdiğiniz Ameliyatlar** ve **İlaç Adı ve Dozu**, pediatri uyarlamasında **Özgeçmiş — Hastalık / Ameliyat** ve **Kullanılan İlaç / Takviyeler**. Kural: ipucu metni "yoksa boş bırakabilirsin" diyorsa alan zorunlu olamaz — nerede geçerse geçsin. Toplam **7 alan** isteğe bağlı oldu. | SHIPPED |
| 2026-09-17 | **Zorunluluk/desen kuralı tek gövdeye indirildi** (`lib/intake/dogrula.ts`). Kural aynı anda iki yerde yaşıyordu: `app/intake/[token]/page.tsx` içindeki gönder döngüsü ve `app/api/intake/[token]/route.ts` içindeki sunucu döngüsü. İkisi de artık `intakeIlkHata()` çağırıyor, yalnız hastaya gösterilen metni kendileri biçimlendiriyor (sunucu mesajları birebir korundu). İstemcideki elle yazılmış TC kontrolü de kalktı — şemadaki `desen`/`desenHata` zaten aynı kuralı, aynı Türkçe mesajla taşıyor. Ayrıca boş + isteğe bağlı bir alan artık desen kontrolüne takılmıyor. **Birleştirirken çıkan yan bulgu:** istemcinin boşluk testi `!yanitlar[id]` idi ve `[]` (hiç seçim yapılmamış checkbox-grup) JavaScript'te truthy olduğu için istemci bunu DOLU sayıyordu; sunucu ise boş sayıp 400 dönüyordu. Yani zorunlu bir checkbox grubunu hiç işaretlemeyen hasta, istemciden geçip sunucudan geri çeviriliyordu. Ortak gövdede `[]` artık iki tarafta da boş. | SHIPPED |
| 2026-09-17 | **Downstream: bağımlılık yok, tek pürüz düzeltildi.** `sigortaSirketi` hiçbir yerde okunmuyor; `policeNo`/`kurumAdi` yalnızca `lib/doktor/hastaDosyaDerleyici.ts`'in **gizli** listesinde (AI'ya hiç gönderilmiyorlar) ve derleyici zaten `v == null \|\| v === ''` olanı atlıyor. `hastaKaydinaAktar.ts` boş değer yazmıyor (`yaz()` boşu eler, `kronikHastaliklar` "yok"u süzer), `kullanilanIlaclar` boşken `kullaniyorMu='Hayır'` yedeği devrede. SGK rapor şablonlarındaki `kurumAdi` **başka bir alan** (doktorun Medula tesis bilgisi), intake formuyla ilgisi yok. Tek gerçek pürüz: doktorun inceleme görünümünde (`components/doktor/HastaIntake.tsx`) boş dize satırı bomboş bırakıyordu — `degerGoster()` yalnız `null/undefined` için `—` basıyordu. Boş dize ve boş dizi de artık `—` basıyor. | SHIPPED |

**Doğrulama.** `scripts/qa-intake-sigorta-opsiyonel.mts` **gerçek** `POST /api/intake/[token]`
route handler'ını, PostgREST'i fetch seviyesinde taklit ederek çalıştırıyor — **sentetik** hasta,
sentetik token, sentetik şifreleme anahtarı; production veritabanına, Dr. Gökhan'ın hesabına veya
gerçek bir hastaya dokunmuyor, PHI yok. Üç sigorta alanı (ve "Yok" ipuçlu diğerleri) **boş**
gönderildi: **HTTP 200**, `durum='dolduruldu'`, kayıtta değerler `["","",""]`, hasta kaydına
aktarım boşlarla sorunsuz çalıştı. Karşı kontrol: `ad` boşken hâlâ **400** — zorunlu alan koruması
duruyor. Regresyon testi `lib/intake/coreAlanlar.test.ts` (4 test) `npm test`'e eklendi; içinde
şemayı tarayıp `yoksa "Yok" yazın` ipuçlu **hiçbir** alanın zorunlu olmadığını doğrulayan bir test
var, yani ipucu ile bayrak bir daha ayrışamaz. Testin gerilemeyi gerçekten yakaladığı, bayrak
geçici olarak geri konularak ölçüldü (3 test kırmızıya döndü). main ile birleştirildikten sonra **616/616 yeşil,
`npx tsc --noEmit` temiz.**

**Mobil kontrol (standing rule) — YAPILMADI, gerekçesi:** bu hotfix worktree'sinde Supabase
kimlik bilgisi yok, dolayısıyla geçerli bir intake token'ı üretilemiyor ve form sayfası canlı
render edilemiyor (token'sız sayfa yalnız hata dalını gösterir). Görsel delta yalnızca **karakter
çıkarıyor**: etiketten satır içi ` *` kalkıyor, doktor görünümünde boş hücre `—` oluyor. Yeni
düğme/panel/rozet/sayfa yok, hiçbir kutu genişlemiyor. Yine de gerçek cihazda göz gezdirilmesi
gerekirse Kaan'ın bir sonraki oturumunda 15 saniyelik bir kontrol yeter.

## RANDEVU-HASTA-ARAMA-TR — canlı hata, Dr. Gökhan (2026-09-17)

**Nasıl geldi.** Dr. Gökhan "Yeni Randevu" penceresinde "Hasta ara" kutusuna **"Hasta iki"** yazdı
ve Enter'a bastı. Sistemde kayıtlı hastanın adı **"Hasta Iki"** — NOKTASIZ büyük I ile. Hiçbir
öneri çıkmadı, form "kayıtlı değilse aşağıya isim ve telefon girerek kayıtsız randevu
oluşturabilirsiniz" moduna düştü ve *"Kayıtlı hasta seçin veya hasta adı girin."* doğrulama hatası
verdi. Beklentisi: harfleri yazdıkça eşleşen kayıtlı hastaların canlı listelenmesi.

**Kök sebep — Türkçe I/i katlaması, eksik otomatik tamamlama DEĞİL.** Canlı arama zaten vardı
(`app/dashboard/doktor/randevular/page.tsx`, hasta listesini çekip istemci tarafında süzüyordu).
Bozuk olan eşleştirmeydi: süzme doğrudan `toLocaleLowerCase('tr-TR')` kullanıyordu. Türkçe locale
I ile i'yi **kasten ayrı tutar** — yazım için doğru, arama için yıkıcı:

```
'Hasta Iki'.toLocaleLowerCase('tr-TR')  →  'hasta ıki'   (I → ı, noktasız)
'Hasta iki'.toLocaleLowerCase('tr-TR')  →  'hasta iki'
'hasta ıki'.includes('hasta iki')       →  false
```

Yani "Hasta Iki" diye kayıtlı bir hasta, "hasta iki" yazımıyla **hiçbir zaman** bulunamıyordu.
Aynı hatalı katlama uygulamada **üç ayrı yerde** kopyalanmıştı (randevu formu, Hastalar listesi,
`components/doktor/HastaTypeahead.tsx`) ve iki yerde daha ham `toLocaleLowerCase` vardı
(Belgeler, Cihaz paylaş) — hepsi aynı sessiz hatayı taşıyordu.

**İkinci semptomun açıklaması (Dr. Gökhan'ın daha önce sorduğu "boş TC" notu).** Kayıtsız bir
randevu ONAYLANDIĞINDA `app/api/doktor/randevular/[id]/route.ts` serbest isimden
`otomatikHastaKaydiOlustur()` ile **yeni bir `patients` satırı** açıyor — TC Kimlik, doğum tarihi,
cinsiyet BOŞ. Zincir şu: arama Türkçe I yüzünden kayıtlı hastayı bulamaz → doktor ismi elle yazar
→ kayıtsız randevu → onay → aynı kişi için ikinci, demografisi boş bir dosya → o dosyaya yazılan
muayene notunda TC/Doğum/Cinsiyet boş görünür. Dr. Gökhan'ın "acaba mükerrer hasta mı oluştu"
şüphesi doğruydu; sebebi bu arama hatasıydı. `scripts/qa-randevu-hasta-arama-tr.mts` Adım 5 bunu
gerçek route handler'la sentetik veride üretip gösteriyor.

**Ne yapıldı.**
- Yeni `lib/utils/turkceArama.ts` — tek ortak arama katlaması: dört I biçimi (I ı İ i) **tek kovaya**
  iner, ardından küçük harf + NFD ile aksan düşürme (ö→o, ş→s, ğ→g, ç→c, ü→u) ve boşluk sadeleştirme.
  `trAramaNormalize` / `trIcerir` / `trAyniAd` / `trParcaEslesir`. Dosyanın başında açık uyarı:
  bu fonksiyon YALNIZ arama içindir, ekrana/veritabanına yazılacak metne uygulanmaz.
- `lib/utils/turkceArama.test.ts` — 11 saf fonksiyon testi; `npm test`e eklendi. "iki/Iki/İki/IKI/ıkı/
  İKİ/ıKi" × "Hasta Iki/Hasta İki/HASTA IKI/hasta ıkı/Hasta iki" matrisinin tamamı, NFD ile ayrışık
  yazılmış İ, ve **alakasız adların eşleşMEmesi** (katlama her şeyi eşitlemiyor) kilitlendi.
- Beş arama yeri tek fonksiyona geçti: randevu formu, Hastalar listesi, `HastaTypeahead`
  (üç doktor aracı bunu kullanıyor), Belgeler hasta seçici, Cihaz paylaş hasta seçici.
- Randevu formundaki "Hasta ara" gerçek bir typeahead oldu: liste form açılırken BİR kez çekilir,
  süzme anlıktır (tuş başına istek yok — bu yüzden debounce da yok, gecikme eklemek burada sadece
  zarar verirdi), ↑/↓ ile gezilir, **Enter artık formu göndermez** (canlı hatada Dr. Gökhan'ı
  doğrudan doğrulama hatasına düşüren davranış buydu) — Enter seçili satırı seçer.
- Aynı adlı iki hasta listelenirse satırın altında kayıt tarihi çıkıyor (ayırt edici). Listeye
  başka kimlik bilgisi taşınmadı — bir seçim listesine PHI eklemenin gerekçesi yok.
- **Kayıtsız randevu artık sessiz varsayılan değil.** Serbest isim/telefon alanları yalnız doktor
  (a) gerçekten arayıp sonuç bulamayınca çıkan "Hasta kayıtlı değil — kayıtsız randevu oluştur"
  düğmesine bastığında veya (b) ipuçtaki açık bağlantıya tıkladığında açılıyor. Hiçbiri olmadan
  Kaydet'e basılırsa hata metni ne yapılacağını söylüyor. Kayıtsız modda yazılan isim kayıtlı bir
  hastayla eşleşiyorsa kırmızı uyarı + "Bu kayıtlı hastaya bağla" düğmeleri çıkıyor — ikinci dosya
  açılmadan önce insana sorulan son kapı.

**Doğrulama.** `scripts/qa-randevu-hasta-arama-tr.mts` — GERÇEK route handler'ları
(`GET /api/doktor/hastalar`, `POST /api/doktor/randevular`, `PATCH /api/doktor/randevular/[id]`)
sahte oturum + bellek içi tablo ile çalıştırır. Kullanılan doktor ve hastalar TAMAMEN SENTETİKTİR;
Dr. Gökhan'ın hesabına, gerçek hastalara veya production veritabanına dokunmaz, PHI içermez.
Şifreleme anahtarı süreç içinde üretilen atılabilir bir test anahtarıdır. Eski katlama 0 sonuç,
yeni katlama 1 sonuç veriyor; seçilen hastayla açılan randevunun `patient_id` dolu,
`hasta_adi_serbest` null ve takvimde `kayitliHasta: true`. `npx tsc --noEmit` temiz, 611 test yeşil.

**Mobil kontrol (standing rule).** Yeni panel/düğmeler 390px ve 360px genişlikte gerçek
Chromium'da render edildi (`/tmp/qa-mobil/randevu-hasta-ara.html`, globals.css ile): yatay taşma
yok (`scrollWidth === innerWidth`), uzun hasta adları kırpılmadan sarıyor, turuncu kayıtsız CTA iki
satıra sarıyor ve kesilmiyor. Sonuç satırları 44–56px. Satır içi metin bağlantıları ilk render'da
16px dokunma hedefiydi — `padding: 8px 4px` + 14px punto ile 33px'e çıkarıldı (metin akışını bozmadan).

**AÇIK MADDE — mükerrer hasta kaydı birleştirme yolu yok.**
- *Var olan:* kayıtsız bir RANDEVUYU sonradan gerçek hastaya bağlamak çalışıyor — randevuyu
  düzenlemeye açıp listeden hasta seçmek `PATCH { patientId }` gönderir, `patient_id` yazılır ve
  serbest metin temizlenir (QA Adım 6'da doğrulandı).
- *Olmayan:* Adım 5'teki gibi **zaten açılmış** kopya bir `patients` satırını gerçek hasta dosyasıyla
  birleştiren bir ekran ya da uç nokta YOK. Kopya kayıt ve ona yazılmış notlar/belgeler ortada
  kalıyor. `grep -i "birleştir\|merge"` doktor tarafında hiçbir şey döndürmüyor.
- *Sonuç:* Dr. Gökhan bu hata yüzünden farkında olmadan kopya dosya açmış olabilir. Yapılması
  gereken iki iş: (1) hasta dosyası birleştirme akışı (iki kaydı seç → notlar/belgeler/randevular
  hedefe taşınır → kaynak arşivlenir), (2) mevcut kopyaların tespiti için aynı doktorda Türkçe
  katlamayla aynı ada düşen kayıtları listeleyen bir bakım taraması. İkisi de bu PR'ın kapsamı
  dışında; Kaan'ın önceliklendirmesini bekliyor.
- `otomatikHastaKaydiOlustur()` kasten DEĞİŞTİRİLMEDİ: aynı ada düşen kaydı sunucuda sessizce
  yeniden kullanmak, gerçekten iki farklı aynı adlı hastayı birleştirme riskini taşır — klinik
  olarak kopya kayıttan daha kötü. Karar insana bırakıldı (kayıtsız moddaki kırmızı uyarı).

## ONAY-SONRASI-DONUS — canlı hata, Dr. Gökhan (2026-09-17)

**Nasıl geldi.** Dr. Gökhan bir muayene notunda düzeltme yaptı ve **Onayla**'ya bastı. Onaydan
sonra **"Bekleyen not yok"** yazan İnceleme Kuyruğu ekranında kaldı; oradan ne az önce onayladığı
nota ne de hastanın dosyasına dönebildi. Beklentisi: onaydan sonra notun **kesinleşmiş halinin**
(PDF/son görünüm) karşısına gelmesi ve gerekirse oradan yeniden düzeltip yeniden onaylayabilmesi.

**Kök sebep — onay sonrası hedefi hesaplayan bir yer yoktu.** Üç ayrı onay noktası vardı ve üçü de
kendi kararını veriyordu:
- `app/dashboard/doktor/inceleme/page.tsx` → onay başarılıysa **yalnızca** `setNotes(prev.filter(...))`
  ile notu listeden siliyordu. Hiçbir yere gitmiyordu. Kuyrukta tek not varsa liste anında boşalıyor
  ve `notes.length === 0` dalı devreye giriyordu — ekranda tek bir `<div>Bekleyen not yok</div>`.
  O div'de **hiç bağlantı yoktu**: onaylanan nota da, hastanın dosyasına da. Dr. Gökhan'ın gördüğü
  ekran tam olarak burasıydı. (Üst menü duruyordu, yani teknik olarak tam bir çıkmaz değildi — ama
  onayladığı notun ve hastasının izi tamamen kaybolmuştu; şikayetin anlamı buydu.)
- `app/session/new/page.tsx` → `notuOnayla()` onaydan sonra `/dashboard/doktor`'a (genel pano)
  atıyordu; "Not Revizyonu" düğmesi de o notun formuna değil **genel kuyruğa** gönderiyordu.
- `app/dashboard/doktor/notlar/[id]/page.tsx` → tek doğru davranan yer: onaydan sonra
  `/notlar/[id]/yazdir`'a gidiyordu. Yani hedef zaten **vardı**, iki tüketici onu bilmiyordu.

Yani eksik olan sayfa değil karardı: "onaydan sonra hekim nereye gider" sorusunun tek bir cevabı
yoktu. Kesinleşmiş not görünümü (`/dashboard/doktor/notlar/[id]/yazdir`) zaten üretimdeydi —
hasta dosyasındaki "Muayene Geçmişi"nden bir vizite tıklandığında açılan sayfanın ta kendisi, ve
üstünde **"✏️ Yeniden Düzenle"** düğmesiyle muayene formuna, oradan da yeniden onaya giden yol
hazırdı. Hiçbir şey yeniden yazılmadı; var olan yola bağlandı.

**Ne yapıldı.**
- Yeni `lib/doktor/onaySonrasiYol.ts` — kararın tek kaynağı. `onaylananNotYolu()` (kesinleşmiş not),
  `hastaDosyasiYolu()` (hasta yoksa listeye düşer — ölü bağlantı üretmez) ve `onaySonrasiHedef(notId,
  kalanBekleyen)`. Kural: **kalanBekleyen > 0 → kuyrukta kal** (hekim sırayı işliyorsa akışı bölme),
  **kalanBekleyen === 0 → kesinleşmiş nota git**. `lib/doktor/muayeneFormuYolu.ts` (MUAYENEYE-DON-01)
  üstüne kuruldu, kopyalanmadı.
- `lib/doktor/onaySonrasiYol.test.ts` — 8 saf test; `npm test`e eklendi.
- **İnceleme Kuyruğu:** onay artık hedefi bu fonksiyondan soruyor. Kuyruk boşaldıysa kesinleşmiş
  nota yönlendiriyor; kuyrukta iş varsa sayfada kalıyor ama üstte yeşil bir şeritle "✓ Not onaylandı
  — <hasta>" + "Onaylanan notu aç →" + "Hasta Dosyası →" duruyor (onaylanan not gözden kaybolmuyor).
- **"Bekleyen not yok" ekranı** meşru bir durum (hekim kuyruğa doğrudan girip bir şey bulamayabilir),
  bu yüzden kaldırılmadı — **çıkışlandırıldı**: her zaman Hasta Listesi / Ana Sayfa bağlantıları,
  son onaylanan not varsa ayrıca ona ve hastasının dosyasına doğrudan bağlantı.
- `app/session/new/page.tsx`: onay sonrası artık genel panoya değil kesinleşmiş nota gidiyor;
  "Not Revizyonu" not kimliği varsa doğrudan **o** notun muayene formuna gidiyor (kuyruğa değil).
  Ses dosyasından not üretme akışı kuyrukta bırakılıyor — orada yeni bir bekleyen not var, doğru hedef.
- `notlar/[id]` ve `notlar/[id]/yazdir` aynı tek kaynağa geçti. Yazdır sayfasındaki
  "← Hasta Dosyası" bağlantısı **koşulsuz** hale getirildi: hastaya bağlı olmayan notta (seansa hasta
  seçilmeden üretilen not) o sayfanın hiçbir çıkışı kalmıyordu, artık "← Hastalar"a düşüyor.
- Onay yanıtı döndüğünde "kuyrukta kaç not kaldı" kararı artık render anındaki bayat listeden değil
  `notlarRef`ten okunuyor (hızlı ardışık onaylarda yanlış hedef seçilmesin).

**Doğrulama.** `scripts/qa-onay-sonrasi-donus.mts` — GERÇEK route handler'ları
(`GET /api/notes?pending=true`, `POST /api/notes/[id]/approve`, `GET /api/notes/[id]`) sahte oturum +
bellek içi tablolarla çalıştırır. Kullanılan doktor ve hasta TAMAMEN SENTETİKTİR; Dr. Gökhan'ın
hesabına, gerçek hastalara veya production veritabanına dokunmaz, PHI içermez. Doğrulananlar:
(1) kuyrukta tek not → düzelt → onayla → kuyruk boşalır ve hedef kesinleşmiş nota döner;
(2) o sayfa gerçekten onaylanmış notu ve düzeltmeyi gösteriyor, hasta dosyası bağlantısı hastanın
dosyasına gidiyor; (3) oradan **yeniden düzeltme + yeniden onay** döngüsü çalışıyor (onaylı not
tekrar onaylanıp içeriği güncelleniyor); (4) kuyrukta başka bekleyen not varsa akış bölünmüyor;
(5) hastaya bağlı olmayan notta dönüş hasta listesine düşüyor. `npx tsc --noEmit` temiz,
`npm test` 635/635 yeşil, `npm run build` başarılı.

**Mobil kontrol (standing rule).** Yeni onay şeridi ve çıkışlı boş-kuyruk kartı gerçek Chrome'da
390px ve 360px genişlikte render edildi (`/tmp/qa-mobil/onay-donus.html`): yatay taşma yok
(taşma = 0px), uzun hasta adı kırpılmadan sarıyor, dört bağlantının hepsi 36px yükseklikte ve
76–133px genişlikte (mobil dokunma hedefi kuralı).

**Kapsam dışı bırakılan.** "Reddet" düğmesi hâlâ notu yalnız ekrandan düşürüyor (sunucuya bir şey
yazmıyor) — bu ayrı ve daha eski bir konu, bu PR'da değiştirilmedi. Reddetme de kuyruğu
boşaltabildiği için artık en azından çıkışlı boş ekrana düşüyor.

---

## NOTYA-SUPERUSER-BRANS-01 — iki kişiye özel branş değiştirici (Kaan, 2026-09-17)

**Ne istendi.** Kaan ve Dr. Gökhan Mamur kendi TEK hesapları üzerinde aktif branşı hızlıca
değiştirebilsin (Gökhan: Kadın Doğum'u kontrol et → Pediatri'ye dön), onboarding'i baştan
çalıştırmadan ve kimse veritabanını elle düzenlemeden. Notya'daki diğer HER hekim bundan
hiç etkilenmeyecek: yeni arayüz yok, görünür değişiklik yok.

**Doğrulanan hesaplar (production `users` + `auth.users`, 2026-09-17 — tahmin edilmedi).**
Yalnız bu iki kimlik izin listesinde:

| Kimlik (user id) | E-posta | O günkü branş |
|---|---|---|
| `c4989e29-a219-45b6-bf17-18e260e3c7f9` | kaanari@mac.com | pediatri |
| `94c4db57-8b89-4880-80be-143f88f4bcc1` | dr.gokhanmamur@gmail.com | pediatri |

**⚠️ KAAN'IN ONAYINI BEKLEYEN AÇIK MADDE — Dr. Gökhan'ın İKİNCİ hesabı.**
Sorgu, Gökhan adına iki hesap buldu:

- `94c4db57-…` / **dr.gokhanmamur@gmail.com** — ekran görüntüsündeki adres; son giriş **2026-07-27**.
- `9030fe09-0a5f-484b-9cc9-3e1e1b0b5178` / **dr.gokhan@notya.ai** — son giriş **2026-09-17** (bugün).

İkisi de "Dr. Gökhan Mamur", ikisi de `is_superadmin`, ikisi de `specialty=pediatri`. Talep
"tam olarak iki hesap" dediği ve isim olarak gmail adresi verildiği için **gmail hesabı**
listeye alındı. Ama son giriş tarihine bakılırsa Gökhan fiilen **dr.gokhan@notya.ai** ile
çalışıyor olabilir — o zaman seçiciyi göremez. **Kaan: hangisi Gökhan'ın günlük hesabı?**
`@notya.ai` ise `lib/auth/superuserBranslar.ts` içine tek satır eklemek yeterli (kimlik
yukarıda yazılı); gmail ise yapılacak bir şey yok.

**Kontrol nerede duruyor.**
- `lib/auth/superuserBranslar.ts` — izin listesi + `bransDegistirebilir()`. Tek karar noktası.
- `app/api/users/superuser-brans/route.ts` — **sunucu tarafı, bağımsız ve açık** kontrol.
  `GET` yetkisiz oturuma sadece `{ yetkili: false }` döner (liste içeriği sızmaz);
  `POST` izin listesinde olmayanı **403** ile reddeder. Arayüzdeki gizleme kozmetiktir.
- `components/doktor/BransDegistir.tsx` — üst menüdeki kompakt "Branş: [seçici]".
  Yetkisiz her oturumda `null` döner. Değişimde `users.specialty` + `auth` metadata birlikte
  yazılır (yarım geçiş yok), `notya_doktor_specialty` önbelleği güncellenir, sonra tek temiz
  `location.reload()`.

**Yeniden kullanılan branş kaydı (yeni liste AÇILMADI).** Doğrulama `BRANS_ETIKETLERI`
(`lib/intake/bransSorulari.ts`) üzerinden — 30 branş, `SpecialtyKey` birliğiyle ve
`lib/doktor/specialties.ts` içindeki `SPECIALTIES` anahtarlarıyla **birebir aynı** (test bunu
da doğruluyor). Açılır liste de aynı kayıttan, Türkçe etiketleriyle geliyor.

**Doğrulama.**
- `lib/auth/superuserBranslar.test.ts` (8 test, `npm test`e eklendi) — listenin **tam olarak
  iki kimlik** olduğunu, büyük/küçük harf ya da parça eşleşmesinin geçmediğini, `__proto__`
  gibi değerlerin branş sayılmadığını doğruluyor.
- `scripts/qa-superuser-brans.mts` — GERÇEK route handler'ları (`GET/POST
  /api/users/superuser-brans`, `GET /api/users/me`) sahte oturum + bellek içi tablolarla:
  Pediatri → Kadın Doğum → Pediatri gidiş-dönüşü, panonun yeni branşı göstermesi, yetkisiz
  hesabın 403 alması ve branşının DEĞİŞMEMESİ, 401 ve geçersiz branşta 400.
  **Production veritabanına yazmaz.**
- **Canlı tarayıcı kontrolü (gerçek dev sunucu + gerçek Supabase).** Sentetik, izin listesinde
  OLMAYAN bir hekim hesabı (`qa.superuser.brans@notya.ai`) açıldı: panoda `#superuser-brans`
  **yok**, üst menü değişmemiş, `GET` → `{"yetkili":false}`, doğrudan `POST` → **403**, branşı
  `kardiyoloji` olarak kaldı. Pozitif taraf için izin listesi **yalnız yerelde, commit
  edilmeden** o sentetik kimliğe çevrildi: seçici 30 branşla göründü, Kadın Doğum'a geçiş
  sayfayı yeniledi, `/api/users/me` yeni branşı döndü; sonra yama geri alındı (`diff` ile
  temiz olduğu doğrulandı) ve sentetik hesap **silindi**. Kaan'ın ve Gökhan'ın gerçek
  hesaplarına dokunulmadı.
- **Mobil (standing rule).** 390px'te üst menü: yatay taşma 0, seçici 124×36px (36px dokunma
  hedefi kuralı), "Çıkış Yap"ın üstünde kendi satırında. 1280px'te tek satıra sığıyor
  (seçici 148px'e daraltıldı, geniş hâli "Çıkış Yap"ı alt satıra itiyordu).
- `npx tsc --noEmit` temiz, `npm test` **651/651** yeşil.

**Bu PR'da onarılan, ALAKASIZ ve ÖNCEDEN VAR OLAN kırık test.**
`specialties/kadin-dogum/tests/live-wiring.test.ts` kırmızıydı: `c82402f` (evrensel branş
kapıları) hasta dosyasındaki `pediatriSekmesiUygun` çağrısını `pediatriAracSekmesiUygun`
olarak yeniden adlandırdı ama testteki ad bayat kaldı. Kapının kendisi yerinde — yalnız
testteki ad güncellendi. Bu PR'ın konusuyla ilgisi yok; "tüm testler yeşil" çıtası için
onarıldı.

**Ayrı ve ÖNCEDEN VAR OLAN açık (bu PR kapsamı dışı, bilerek dokunulmadı).**
Genel `POST /api/users/profile` rotası, oturum açmış **herhangi bir** hekimin kendi
`specialty` alanını serbestçe yazmasına zaten izin veriyor (`profession_type: 'doktor'` +
`specialty` gönderilmesi yeterli) — izin listesi yok. Yani bu yeni rota bir hekime
teknik olarak yeni bir yetenek vermiyor; yaptığı şey o işi **arayüzde** yalnız o iki kişiye
açmak. Yeni rotanın kendi bağımsız 403 kontrolü yine de var (istendiği gibi). Profil
rotasının bu davranışı daraltılmalı mı, ayrı bir karar — **Kaan'a açık madde.**

---

## NOTYA-AVATAR-01 — karşılama ekranında hekim avatarı (Kaan + Dr. Gökhan, canlı, 2026-09-17)

**Ne istendi.** Karşılama ekranındaki "Hoş geldiniz, Dr. …" yanında küçük bir avatar: hekimin
Ayarlar'dan yüklediği fotoğrafın **karikatürleştirilmiş** hâli, Hedef Boy sayfasındaki karakter
görselinin ruhuna yakın. Kaan'ın gerekçesi: duygusal bağ.

### Önce araştırıldı: bu depoda görsel üretme yeteneği VAR MI? — HAYIR.

Karikatürleştirme iddiasında bulunmadan önce Hedef Boy'un o görseli nasıl ürettiği uçtan uca
okundu. Bulgu net:

| Bakılan yer | Gerçekte ne var |
|---|---|
| `components/hedefBoy/HedefBoyManken.tsx` | `KARAKTER` sabiti → `public/hedef-boy/{baba,anne,cocuk-erkek,cocuk-kiz}.png` — **önceden çizilmiş dört sabit PNG**. Cinsiyete göre seçilir, boya göre ölçeklenip konumlandırılır. Üretim yok. |
| `app/api/doktor/hastalar/[id]/hedef-boy/route.ts` | Saf Tanner aritmetiği (`hesaplaHedefBoy`) + şifreli not okuma/yazma. Tek bir görsel çağrısı bile yok. |
| `package.json` | `@anthropic-ai/sdk` (metin), `@deepgram/sdk` (ses), `@elevenlabs/client` (ses), `tesseract.js` (OCR). **Görsel üreten hiçbir paket yok.** |
| Depo geneli arama (`dall-e`, `stability`, `replicate`, `images.generate`, `fal.ai` …) | Sıfır isabet. `openai` geçen üç dosya var ama hepsi Groq/xAI'nin **`/chat/completions`** taban URL'si — yalnız metin. |

Yani Hedef Boy'daki "3D cartoon aile" bir sanatçı çıktısıdır, bir model çıktısı değil.
**Sonuç: gerçek karikatürleştirme bu depoda bugün mümkün değil.**

### Bu yüzden ne YAPILMADI

CSS filtresiyle (posterize/kontrast/`filter: saturate()` vb.) "karikatür" taklidi
**yapılmadı**. Bu bir fotoğrafı karikatür yapmaz; yalnız karikatürleştirilmiş gibi görünen bir
etiketle hekimi yanıltır. Kaan'a yanlış bilgi vermektense eksik özellik vermek yeğdir.

### Ne SHIPPED

| Tarih | Madde | Durum |
|---|---|---|
| 2026-09-17 | **Ayarlar › Profil fotoğrafı** (`/dashboard/doktor/ayarlar/profil`) — yükle / değiştir / kaldır, canlı önizleme. Ayarlar hub'ına ilk sıraya kart eklendi. Mevcut `ayarlar/erecete` alt sayfa desenine birebir uyar. | SHIPPED |
| 2026-09-17 | **Saklama:** yeni `doctor_avatars` tablosu (migration `050_doktor_profil_fotografi.sql`), hekim başına tek satır, `doctor_id` PK. Baytlar kasadakiyle **aynı** AES-256-GCM zarfıyla (`lib/vault/crypto`) şifrelenir. RLS: kasa blob'larıyla aynı duruş — yalnız service-role rotası okur/yazar. Herkese açık URL üretilmez. | SHIPPED |
| 2026-09-17 | **Rota** `app/api/doktor/profil/avatar` (GET/POST/DELETE), `doktorOturum` + `servisSupabase` (no-store) üzerinden, her sorgu `doctor_id = user.id` kapsamında. Kapılar: yalnız JPEG/PNG/WebP, en fazla 2 MB. | SHIPPED |
| 2026-09-17 | **Karşılama ekranı** (`app/dashboard/doktor/page.tsx`): adın solunda 52px yuvarlak avatar. Fotoğraf varsa **gerçek fotoğraf**; yoksa **baş harfli avatar** (hasta dosyası kimlik başlığıyla aynı teal halka). Avatar, ad gibi `localStorage`'dan ilk boyamada gelir — her girişte baş harften fotoğrafa atlama olmaz. | SHIPPED |
| 2026-09-17 | **Baş harf Türkçe doğru.** Mevcut `basHarfler` (hasta dosyası) `toUpperCase()` kullanıyor; o "ismail" → **"I"** verir. Yeni `doktorBasHarfleri` `toLocaleUpperCase('tr-TR')` kullanır → **"İ"**, ayrıca unvanı eler ("Prof. Dr. Ayşe Yılmaz" → "AY", "PD" değil). | SHIPPED |

**Doğrulama (sentetik, PHI yok).** `scripts/qa-doktor-avatar.mts` — GERÇEK rota handler'larını ve
GERÇEK AES-GCM şifrelemesini çalıştırır; yalnız oturum ve Supabase istemcisi bellek içi sahtedir.
Fotoğraf, betiğin ürettiği damalı bir PNG'dir (gerçek kişi değil). 17/17 kontrol geçti: yükleme
201 → satır **şifreli** yazıldı (düz PNG imzası veritabanında yok) → GET baytları **birebir**
geri verdi (150/150) → 2 MB üstü ve PDF **400** → oturumsuz **401** → reddedilen yüklemeler
mevcut fotoğrafı bozmadı → DELETE sonrası yeniden baş harfli avatar.
Mobil (zorunlu 390px kontrolü): karşılama paneli gerçek `DoktorAvatar` bileşeniyle 390px
çerçevede ölçüldü — metin kutusu 299px → 233px'e daralıyor, **yatay taşma yok**, başlık düzgün
sarıyor; fotoğraflı, baş harfli ve Türkçe ("İÇ") üç durum da temiz (`smoke-out/avatar-390.png`).

### YAPILACAK — migration production'a elle uygulanmalı (Kaan)

| Tarih | Madde | Durum |
|---|---|---|
| 2026-09-17 | **`050_doktor_profil_fotografi.sql` production'da HENÜZ UYGULANMADI.** Bu depoda migration'lar `next build`'in parçası değil, elle çalıştırılıyor (`npm run migrate:supabase` ise `001_doctor_profile.sql`'e sabitlenmiş — bu dosyayı çalıştırmaz). Kod canlıda ama tablo yok. **Uygulanacak komut** (`.env.local` içinde `DATABASE_URL`/`SUPABASE_DB_URL` olan bir checkout'tan): `node scripts/run-sql-migration.mjs 050_doktor_profil_fotografi.sql`. Bu çalıştırılmadan Ayarlar'dan yükleme "Fotoğraf kaydedilemedi" der. Ben çalıştıramadım: bu worktree'de veritabanı kimlik bilgisi yok ve başka bir checkout'a dokunmam istenmedi. | TODO (Kaan / bir sonraki oturum) |
| 2026-09-17 | **Migration uygulanana kadar canlı GÜVENLİ — ölçüldü, varsayılmadı.** Tablo yokken rota davranışı sahte `42P01 relation does not exist` ile sınandı: `GET` **200 `{avatar:null}`** döndü, yani karşılama ekranı baş harfli avatarla normal çalışır, kırılmaz; `POST` **500 + Türkçe "Fotoğraf kaydedilemedi"** döndü, çökme yok. Yani bu PR canlıdaki hiçbir şeyi bozmuyor; yalnız yükleme özelliği migration'a kadar uykuda. | VERIFIED |

### AÇIK — Kaan'ın kararı bekleniyor

| Tarih | Madde | Durum |
|---|---|---|
| 2026-09-17 | **Gerçek karikatürleştirme ertelendi.** Bugün gönderilen avatar hekimin **gerçek fotoğrafıdır**, stilize edilmiş hâli değil. Yapılabilmesi için **yeni bir dış görsel-üretme entegrasyonu** gerekir; bu bir kod işi değil, önce bir **sağlayıcı kararı**: (a) hangi sağlayıcı (görselden-görsele stilize eden bir servis), (b) API anahtarı + Vercel ortam değişkeni, (c) maliyet/hekim (tek seferlik üretim, sonuç önbelleğe alınır — her sayfa açılışında değil), (d) **KVKK**: hekimin yüzü Türkiye dışındaki yeni bir işleyene gider; `app/kvkk/page.tsx`'teki işleyen listesi ("Anthropic, OpenAI") ve `lib/security/pseudonymize.ts` notu güncellenmeli, hekimden ayrı açık rıza alınmalı. Altyapı buna hazır: `doctor_avatars` satırına stilize edilmiş ikinci bir görsel eklemek şema açısından küçük bir iştir. | OPEN (Kaan: sağlayıcı seçimi) |

## ELEVENLABS-LIVE-MODERATION — "Voices with live moderation enabled cannot be used for agents" (Kaan, canlı, 2026-09-17)

**Belirti.** Kadın Hastalıkları ve Doğum → Prof. Dr. Fatma Çelik sesli asistanı açılmadı:
"Bağlantı kurulamadı. Tekrar deneyin. (Voices with live moderation enabled cannot be used for agents: 'HZh2tWL1clJO95e2…')".

**Kök sebep (canlı doğrulandı, yalnız metadata değil).** ElevenLabs'te paylaşılan kütüphaneden
kopyalanan bazı Professional Voice Clone seslerinde *sahibi* `sharing.live_moderation_enabled=true`
açmış. Bu sesler TTS'de çalışır ama ConvAI agent oturumunda WebSocket 1008 ile kapanır. Notya
kodunda veya agent ayarında bunu açıp kapatan bir düğme yok; tek çözüm başka voice_id.

**"Tüm kadın sesleri professional → hepsi risk altında" varsayımı yanlış çıktı.** Hesaptaki TR
seslerin *tamamı* (erkekler dahil) `category: professional` + `sharing.status: copied`; bu tek
başına sorun değil. Belirleyici alan `sharing.live_moderation_enabled`. 16 TR_VOICES girdisinin
(13 benzersiz ses) her biri için gerçek agent bağlantısı açıldı (signed URL → WS →
`conversation_initiation_client_data` + `tts.voice_id` override → ilk `audio` paketi):
13 sesten **10'u çalışıyor, 3'ü 1008 ile reddedildi**, metadata ile birebir aynı.

| Anahtar | Bozuk voiceId | Yerine | Neden bu ses | Etkilenen personalar |
|---|---|---|---|---|
| `asli` | `HZh2tWL1clJO95e2qMt2` (Aslı) | `58oUR7g9xaf9pbxNCyws` (Günnur) | Kullanılmayan uygun TR kadın ses yok (aşağıda); çalışan sesler içinde ölçülen ses seviyesi iyi (~-20 dBFS, klip yok), sakin tempo; Ece ~-31 dBFS ile çok kısık | Doktor: **Fatma Çelik (KD)**, Cemre Taş (spor hek.); **Mali Derya Yılmaz**; klinik Fizyoterapi (Uzm. Aylin Doğan) |
| `bahadir` | `LIayCu3NIwyEyDw2fhqs` (Bahadır) | `pGMp7Agf4sG0hyhiiGiw` (Abdulkadir) | Avukat kadrosunda başka kimsenin kullanmadığı tek çalışan TR erkek ses → "iki avukat aynı ses değil" kuralı korunuyor | Doktor: Caner Koç (radyoloji), Kerem Ersoy (beyin cerr.); **Avukat Can Bey** |
| `halil` | `6U25IshsKGd7nVhRbPOT` (Halil Aykut) | `YRAJxpPvdBUTgvjBUHlB` (Eyüp) | ~-18 dBFS, doktor kadrosunda yalnız 2 kullanım | Doktor: Serkan Güneş (enfeksiyon), Yusuf Akın (aile hek.) |

Anahtar adları ve F/M dizileri aynen kaldı; persona→slot ataması değişmedi, yalnız bu üç
anahtarın voiceId'si değişti (ayseHanim/leyla ortak-ses emsaliyle aynı yaklaşım).

**ElevenLabs tarafında da değişen (API PATCH, yalnız `conversation_config.tts.voice_id`;
prompt ve platform_settings değişmediği diff ile doğrulandı):**
- `agent_0501kwjca1qaeymv4c34444feshb` (Can Yılmaz — İdare Hukuku): base ses Bahadır → Abdulkadir.
  Tüm avukat agent'ları `tts.voice_id` override'ına **izin vermiyor**; bu yüzden Can Bey kod
  değişikliğiyle düzelemezdi — base ses değişmeden 1008 live-moderation, base ses değişip kod
  değişmeseydi "Override for field 'voice_id' is not allowed". İkisi birlikte canlı doğrulandı.
- `agent_4301kvraprgwf5btftn0k836t55m` (Derya Yılmaz — Mali Müşavir): base ses Aslı → Günnur.
  Override açık olduğu için kod düzeltmesi tek başına yetiyordu; base ses override'sız
  bağlantılara karşı sağlamlık için düzeltildi.
- Geri almak gerekirse: aynı PATCH'i eski voice_id ile atmak yeterli (eski değerler yukarıda).

**Doğrulama.** Düzeltme sonrası `npx tsx scripts/elevenlabs-ses-denetimi.ts --canli`: 13/13 ses
agent oturumu açıp ses akıttı. Fatma Çelik: `PERSONAS.fatmacelik.voiceId` = Günnur, Ayşe base
agent'ı üzerinden canlı bağlantı OK. Can Bey (kendi agent'ı + Abdulkadir) ve Mali (kendi agent'ı
+ Günnur) canlı OK. Eski Aslı voiceId negatif kontrol olarak hâlâ 1008 veriyor.

**Regresyon kontrolü.** API bu durumu temiz bir alanla gösteriyor (`sharing.live_moderation_enabled`),
o yüzden iki katman eklendi:
- `lib/asistan/elevenVoices.test.ts` (npm test'te, ağsız): bilinen 3 live-moderation voiceId'sinin
  TR_VOICES'a, doktor/avukat/mali/klinik personalarına geri dönmediğini ve avukat seslerinin
  benzersiz kaldığını kilitliyor.
- `npm run ses:denetim` (`scripts/elevenlabs-ses-denetimi.ts --canli`, ELEVENLABS_API_KEY ister):
  her TR_VOICES sesinin metadata'sını + gerçek agent bağlantısını dener. **Yeni ses eklerken
  çalıştırın.** Ses sahibi live moderation'ı ileride *açarsa* ağsız test bunu yakalayamaz —
  yalnız bu script yakalar.

### AÇIK — Kaan (ses kalitesi, kod dışı)
- **Kullanılabilir, kullanılmayan uygun TR ses yok.** Hesaptaki diğer TR adaylar: "Wise Educator —
  Ayşe Hanım" (`sMFjOtbPhx5GdIeKUBDN`, metadata'ya göre live moderation kapalı ama 2026-08-14'te Flash'ta Türkçe tıp
  konuşmasında peltek/"slurry" olduğu için bilerek bırakılmış — Ayşe Kaya'ya bağlanması
  amaçlanmıyor, emekli) ve "Sibel Malkoç" (`qLdPxFtPuffoxx5gieBJ`, "aşırı doygun" deneyi geri
  alınmış). Hesaba ait "Defne" / "Mia Siren" generated sesleri flörtöz companion sesleri — hekim
  için uygun değil. Bu yüzden üç persona grubu artık başka bir personayla aynı sesi paylaşıyor
  (Günnur: 4 doktor + avukat Dilek Hanım + Mali + 2 klinik; Abdulkadir: Mehmet Demir dahil
  5 doktor + avukat Can Bey + 1 klinik; Eyüp: 4 doktor + avukat Bora Bey).
  **Daha iyi çözüm:** ElevenLabs Voice Library'den live moderation *kapalı* 2–3 yeni TR ses
  (1 kadın, 2 erkek) eklemek ya da kendi PVC/Voice Design sesimizi üretmek — hesap/Library
  işlemi, bu oturumda bilerek yapılmadı. Eklendikten sonra yalnız ilgili TR_VOICES anahtarının
  voiceId'sini değiştirip `npm run ses:denetim` çalıştırmak yeterli.
- **Gökhan sesi çok kısık** (flash_v2_5 ölçümü ~-33.6 dBFS; Abdulkadir ~-16, Leyla ~-18). Emre Aydın
  (KBB), Barış Uysal (göğüs hast.), avukat Murat Bey ve klinik Saç Ekimi bu sesi kullanıyor.
  Bu düzeltmenin kapsamı dışı; çalışıyor ama duyulabilirlik şikâyeti gelirse ilk aday.
- **Ece de kısık** (~-31 dBFS) — dosyadaki eski "Ece was too quiet" notu ölçümle doğrulandı
  (Aylin Erdem, klinik Ergoterapi).
- Vercel'de `AVUKAT_AGENT_CANBEY` / `MALI_MUSAVIR_AGENT_ID` env'i farklı bir agent'a işaret
  ediyorsa o agent'ın base sesi de kontrol edilmeli (env değerleri okunmadı; kod varsayılan
  agent'ları düzeltildi).
---

## HASTA-IZOLASYON — doktorlar arası hasta sızıntısı denetimi + kalıcı korkuluk (Kaan, 2026-09-17)

**Ne istendi (Kaan).** Hastalar hiçbir koşulda doktorlar arasında sızmamalı: bir doktor başka bir
doktorun hastasını göremez, listeleyemez, arayamaz, düzenleyemez — tersi de. Varsayım değil,
zorlanan bir korkuluk.

### Mimari bulgu (düzeltmelerin dayandığı gerçek)

Her sunucu rotası Supabase'e **service-role** ile bağlanır (`lib/doktor/serverAuth.ts` —
`servisSupabase`, `doktorOturum`, `pratikOturum`); service-role **RLS'i atlar**, bilerek. Yani
izolasyonun **birincil** denetimi her rotadaki `doctor_id` kapsamıdır; RLS yalnız herkese açık anon
anahtarıyla PostgREST'e doğrudan gelen isteklere karşı **ikinci hat**tır. İki istisna görüldü:
`app/api/doktor/goruntuleme/*` kullanıcı JWT'li anon istemci kullanır ve **tarayıcı**
`app/session/new/page.tsx`'te `sessions` satırını anon istemciyle **kendisi** ekler — ikisinde de
RLS devrede ama politikalar yalnız `doctor_id`'yi denetliyordu, hastanın kime ait olduğunu değil.

### Ne denetlendi

| Kapsam | Sayı | Yöntem |
|---|---|---|
| API dosyaları | 146 `route.ts` + 6 yardımcı (`app/api/doktor/dahiliye/_*.ts`) | Her dosya satır satır: dışarıdan gelen her kimlik (URL/query/body/form/model çıktısı) ilk okuma/yazmadan önce doktora bağlanıyor mu |
| Paylaşılan yardımcılar | `hastaDosyaDerleyici`, `hastaCozumleyici`, `receteAktarim`, `gununNotunaEkle`, `gunOzeti`, `actionExecutor`, `lib/portal/*`, `lib/vault/*` | Aynı |
| Tablolar | migration'lardaki tüm `CREATE TABLE`'lar (~135) + koddan kullanılıp repoda tanımı olmayanlar | Hasta/doktor kolonu, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY` |
| Portal | `app/api/portal/hasta/[token]/**` | Token → (hasta, doktor); her okuma o doktora mı kapsanıyor |

Doğru çalışan (şablon alınan) yerler: `lib/vault/service.ts` (`assertPatientOwned`), `goz`
(`hasta()`), `jinekoloji` (`hastaDogrula()`), `dahiliye` (`hastaBilgi()`), `hastalar/[id]`,
`notes/[id]`, `notes/[id]/approve`, `cihaz-olcum`, `mesajlar`, `erecete`, `sgk-rapor`,
`hasta-portali`, `intake-formlari`, `belgeler/lab`, `belgeler/analiz`. Tek kontrol yardımcısı bunların
aynı sorgusu: **`lib/doktor/hastaSahipligi.ts`** (`hastaSahibiMi`, `seansSahibi`).

### Bulunan ve DÜZELTİLEN açıklar (hepsi regresyon paketinde, iki yönde sınanıyor)

| # | Rota | Açık | Etki | Düzeltme |
|---|---|---|---|---|
| F1 | `POST /api/sessions/start` | `patient_id` gövdeden, sahiplik yok | Başka doktorun hastasına seans → not, reçete aktarımı, portal zinciri | `hastaSahibiMi` → 404 |
| F2 | `POST /api/sessions/[id]/end` | Seans URL id'siyle, doktorsuz okunuyor; "önceki vizit" notu doktorsuz; durum güncellemeleri kapsamsız | **B'nin son onaylı planı + tanısı A'nın yapay zekâ bağlamına ve notuna** | `seansSahibi` (seans + hastası doktorun) → 404; sorgu + 3 güncelleme `doctor_id`'li |
| F3 | `POST /api/doktor/araclar/epikriz` | Tek-vizit dalında `hastaId` hiç doğrulanmıyor; `baslikKur` doktorsuz | **B'nin hastasının adı, doğum tarihi, cinsiyeti** A'nın epikrizinde | İki dalda sahiplik → 404; başlık sorgusu `doctor_id`'li |
| F4 | `POST /api/doktor/asilar` | Sahiplik yok | Yabancı hastaya aşı + hatırlatma SMS'i | 404 |
| F5 | `POST /api/doktor/belgeler/ingest` | Sahiplik yok | Yabancı hastaya belge + depolama | 404 |
| F6 | `POST /api/doktor/dermatoloji/spine` | `lezyon_degerlendir` / `lezyon_tani` `derm_lezyonlar`'ı çıplak body id'siyle günceller; `islem` lezyon id'sini doğrulamaz; GET sahipliksiz | **A, B'nin lezyon değerlendirmesini ve resmi tanısını değiştirir** | `lezyonBu`: lezyon, bu hastanın doktora kapsanmış derm dosyasına ait olmalı → 404; GET sahiplik |
| F7 | `GET/POST /api/doktor/dermatoloji` | Sahiplikten önce `hasta_derm` otomatik açılıyor | Yabancı hastaya derm dosyası/fotoğraf meta (`patient_share`) | 404 |
| F8 | `GET/POST /api/doktor/gebelik` | `baslat` yabancı hastaya gebelik açar; GET başlığı `patients`'ı doktorsuz okur | **B'nin hastasının adı + doğum tarihi** | İkisinde sahiplik; başlık `doctor_id`'li |
| F9 | `POST /api/doktor/mchat` | Sahiplik yok | Yabancı hastaya test + nota ekleme | 404 |
| F10 | `POST /api/doktor/gelisim-taramasi` | Hasta sorgusu var ama bulunamayınca durmuyor | Yabancı hastaya kayıt | 404 |
| F11 | `POST /api/doktor/kadin-sagligi` | `upsert onConflict: patient_id`, sahiplik yok | **B'nin satırının üstüne yazar ve `doctor_id`'yi A yapar (ele geçirme)** | 404 |
| F12 | `POST /api/doktor/gebelik/dogum` (`komplikasyon`) | `bebek_kartlari` body id'siyle, doktorsuz | B'nin bebek kartına yazı | okuma + yazma `doctor_id`'li |
| F13 | `POST /api/doktor/goruntuleme/yukle` | RLS yalnız `doctor_id`'yi denetliyor, hasta sahipliği yok | Yabancı hastaya görüntü (portalına kart) | Yüklemeden önce 404 |
| F14 | `POST/GET /api/doktor/randevular` (+ `gun-programi`, `gunOzeti`) | POST yabancı `patientId` kabul eder; GET `hastaBilgisi` `patients`'ı doktorsuz çözer | **A (veya sekreteri) B'nin hastasının ADINI ve TELEFONUNU takvimde görür**; hatırlatma SMS'i B'nin hastasına | POST 404; tüm ad/telefon/ilaç/intake okumaları `doctor_id`'li |
| F15 | `PATCH /api/doktor/randevular/[id]` | Kendi randevusunu herhangi bir `patientId`'ye bağlar | F14 ile aynı sızıntı | 404 |
| F16 | `POST /api/doktor/ilaclar` | Sahiplik yok; `onay_durumu` varsayılanı `'onayli'` | **A'nın yazdığı ilaç B'nin hastasının Sağlığım portalında "aktif ilaç" olarak görünür** | 404 |
| F17 | `POST /api/sessions/ses-yukle` | `patientId` doğrulanmıyor; "önceki vizit" sorgusu kapısız ve doktorsuz | **B'nin son planı + tanısı A'nın notuna** | Ses okunmadan önce 404; sorgu `doctor_id`'li; yolda `..` reddi |
| F18 | `POST /api/asistan/chat` | `patientId` → `patients.select('*')` doktorsuz, **model sistem istemine** JSON olarak | B'nin hasta satırı (şifreli alanlar + kimlikler) Claude'a | 404; okuma `doctor_id`'li |
| F19 | `POST /api/asistan/learn` | `asistan_actions` id ile, doktorsuz güncelleniyor | Başka doktorun kaydına yazı | `doctor_id`'li |
| F20 | `lib/asistan/actionExecutor.ts` | Model çıktısındaki `patientId`/`sessionId`'ye güven; yabancı seansa not açabiliyor | B'nin seans geçmişine A'nın notu (B'nin muayene geçmişi tüm notları gömer) | `CREATE_SESSION` → `hastaSahibiMi`; not eylemleri → `seansSahibi` |
| F21 | `GET /api/portal/hasta/[token]` (+ mesajlar, dahiliye-anket, `lib/portal/*`) | Okumalar yalnız `patient_id` ile | Başka doktorun o hasta id'sine iliştirdiği satır hastanın portalında | 19 okuma + mesaj/kart/e-posta yardımcıları token'ın `doctor_id`'sine de kapsandı (tüm kolonlar `NOT NULL` — meşru satır kaybı yok) |
| F22 | `POST /api/notes/[id]/approve` + `hastaDosyaDerleyici` + `receteAktarim` | Onayda reçete, seansın `patient_id`'sine sahiplik bakılmadan aktarılıyor; hasta dosyası çocuk satırları `patient_id` ile okunuyor | Kirli seanstan yabancı hastaya ilaç; kirli satırlar yapay zekâ bağlamına | Aktarım yalnız sahip olunan hastaya; dosya ve "mevcut ilaç" okumaları `doctor_id`'li |

**Savunma derinliği (açık değildi, ama kirli veriyi yaymasın diye):** `notes` kuyruğu, `son-notlar`,
`rrs`, `medula/recete`, `yenidogan`, `hastaCozumleyici` ("son hastam", aday özetleri), iki
hatırlatma cron'u (SMS yalnız satırın sahibi doktorun hastasına) — hasta okumaları `doctor_id`'li.

### Veritabanı katmanı — RLS

Migration'lara göre **49 hasta/doktor tablosunda RLS hiç açılmamıştı** (024 cihaz, 025 belge analizi,
028 lab, 029 doğum, 030/031 jinekoloji, 032 derm, 033/039 dahiliye, 035, 037 RRS,
`doctor_integrations` ve `audit_logs`). Bunlar kapalı kaldıkça, herkese açık anon anahtarı + **herhangi bir**
oturumla PostgREST üzerinden tüm doktorların satırları okunup yazılabilir (Supabase varsayılan
GRANT'leri) — uygulama kodu hiç devreye girmeden. 040–047 dahiliye tabloları "RLS açık, politika
yok" (yalnız sunucu) duruşunda — o doğru, dokunulmadı.

Yazıldı: **`lib/db/migrations/052_hasta_izolasyon_rls.sql`** (idempotent, olmayan tabloyu atlar):
1. RLS kapalı hasta tablolarında RLS + "yalnız kendi satırın" (`doctor_id = auth.uid()`).
2. Doktor kolonu olmayan, yalnız sunucunun kullandığı tablolar (`kurum_hasta_eslesme`,
   `fhir_*`, `audit_logs`, `motor_kayit`): RLS, politika yok.
3. `patient_id` taşıyan her tabloya **RESTRICTIVE** hasta sahipliği (yalnız daraltır):
   tarayıcının anon istemciyle `sessions` eklemesi artık yabancı hastaya yapılamaz.
Service-role rotaları etkilenmez; tarayıcıdan bu tablolara doğrudan erişen başka kod yok
(denetlendi: tarayıcı yalnız `sessions`, `users`, `mali_*`, `avukat_*` ve depolama kullanıyor).

### Kalıcı korkuluk — `npm test`'in içinde, bundan sonra her değişiklikte

| Dosya | Ne yapar |
|---|---|
| `lib/security/hasta-izolasyon.test.ts` | **Gerçek route handler'ları**, iki sentetik doktor (A, B) + sentetik hastaları. 51 vaka × (pozitif kontrol + A→B + B→A) + kirli veri, portal ve asistan senaryoları = **165 test**. Çapraz koşuda: kurbanın işareti yanıtta yok, kurbanın satırları değişmedi, kurbanın kimliğine yeni atıf yok, yapay zekâ bağlamına / model isteğine kurban girmedi, beklenen 404. |
| `lib/security/hasta-izolasyon-envanter.test.ts` | Hasta ağaçlarındaki **her** API dosyası (+ hasta kimliği kullanan her diğer dosya) `lib/security/hastaIzolasyonEnvanteri.ts`'te sınıflı olmalı; `test` olanlar pakette gerçekten koşmalı; hasta/doktor kolonlu her tabloda RLS bir migration ile açılmalı. **Sınıflanmamış yeni rota → `npm test` kırmızı.** |
| `lib/security/testing/sahteSupabase.ts` | Bellek içi PostgREST alt kümesi; bilmediği her yöntemde **hata fırlatır** (sessiz yutup sahte yeşil üretemez). |
| `.cursor/skills/hasta-izolasyon/SKILL.md` | Kalıcı kural + birleştirme öncesi kontrol listesi (CLAUDE.md tablosunda). |

**Paketin gerçekten yakaladığı kanıtlandı (sahte yeşil değil):**
- Düzeltmeler geri alınıp **orijinal kod** üzerinde koşuldu → **62 test kırmızı**, hepsi yukarıdaki
  açıklara karşılık gelen çapraz-doktor testleri; hiçbir pozitif kontrol kırılmadı.
- Talep edilen VERIFY: `ilaclar` POST'taki eklenen sahiplik kontrolü geçici olarak silindi →
  `npm run test:izolasyon` **2 kırmızı** ("SIZINTI: A doktoru B doktorunun hastasına/kaydına yazı
  açtı" + tersi) → kontrol geri kondu → **171/171 yeşil**.
- Envanter bekçisi: 052 geçici olarak çıkarıldı → RLS testi `lab_satirlar`, `dahiliye_ht`,
  `sevkler`, `belge_analizleri` … listesiyle kırmızı → geri kondu → yeşil.
- Tam paket: `npx tsc --noEmit` temiz, **`npm test` 841/841 yeşil**.

### AÇIK — Kaan'ın erişimi/kararı gerekiyor (bu oturumda yapılamadı, tahmin edilmedi)

| Tarih | Madde | Durum |
|---|---|---|
| 2026-09-17 | **052'yi production'a uygulayın.** Migration'lar build'in parçası değil (050 gibi). Önce 052 başındaki salt-okunur sorguyla canlı RLS durumunu görün (repo ile canlı farklı olabilir — ben canlıyı göremedim: bu worktree'de DB kimlik bilgisi yok, başka checkout'a dokunmam istenmedi). Sonra `.env.local`'lı bir checkout'tan: `node scripts/run-sql-migration.mjs 052_hasta_izolasyon_rls.sql` (ya da SQL Editor). Uygulandıktan sonra aynı sorgu: listelenen tablolarda `rls = true`, politika ≥ 1. Uygulanana kadar birincil koruma (uygulama kodu) zaten canlıda; açık kalan yalnız anon-anahtar + PostgREST doğrudan erişim yüzeyi. | OPEN (Kaan) |
| 2026-09-17 | **Canlıda kirli satır taraması (salt-okunur).** Yukarıdaki yazma açıkları kullanılmışsa (kasıtlı ya da yanlış hasta seçimiyle) `doctor_id`'si hastanın doktoruyla uyuşmayan satırlar olabilir. Kod artık bunları hiçbir okumada göstermiyor, ama görülüp temizlenmeli. Her `patient_id`+`doctor_id` tablosu için: `select '<tablo>' t, count(*) from <tablo> x join patients p on p.id = x.patient_id where x.doctor_id <> p.doctor_id;` (randevular/asilar/hasta_intake_formlari için `doktor_id`). Sonuç sıfır değilse satırlar tek tek incelenmeli — silme kararı klinik kayıt olduğu için Kaan'ın. | OPEN (Kaan) |
| 2026-09-17 | **Depolama kovaları büyük olasılıkla HERKESE AÇIK.** `goruntuleme/yukle` `getPublicUrl()` ile, `belgeler/ingest` `/storage/v1/object/public/hasta-belgeler/…` ile URL üretiyor → URL'yi bilen herkes (doktor olsun olmasın) hasta görüntüsünü/belgesini indirebilir. Kova ayarları ve storage politikaları repoda yok (panelde). Kontrol: Supabase › Storage › `hasta-goruntuleme`, `hasta-belgeler`, `ses-kayitlari` → "Public" kapalı mı, politikalar `{auth.uid()}/` önekine mi kısıtlı. Kapatmak, görüntülerin doktor ekranında ve portalda imzalı URL'lerle gösterilmesini gerektirir — görüntüleme akışını değiştiren bir ürün değişikliği, gözetimsiz yapılmadı. Yeni yüklemeler için Belge Kasası (`lib/vault`, şifreli, public URL yok) zaten doğru yol. | OPEN (Kaan: kova ayarını görüp karar) |
| 2026-09-17 | **Repoda tanımı olmayan tablolar:** `not_duzenlemeleri` (notun önce/sonra klinik metni), `fhir_audit`, `fhir_export_kuyruk`, `kurum_*`, `ai_kullanim`. RLS durumları bilinmiyor; 052 var olanlarını kapatıyor (`not_duzenlemeleri` → doktor politikası). Uygulama sonrası sorguyla teyit edin. | OPEN (052 ile birlikte) |
| 2026-09-17 | **Cron kimlik doğrulaması taklit edilebilir** (izolasyon dışı, ama güvenlik): `cron/*` ve `entegrasyon/fhir/isle` GET, dışarıdan gönderilebilen `x-vercel-cron: 1` başlığına güveniyor → herkes hatırlatma/KVKK imha/FHIR dışa aktarım işlerini tetikleyebilir (yanıtlar PHI içermiyor; işler kendi kurallarıyla çalışıyor). Önerilen: yalnız `Authorization: Bearer $CRON_SECRET` (Vercel bunu `CRON_SECRET` tanımlıysa otomatik gönderir). Cron'ları kırma riski olduğu için gözetimsiz değiştirilmedi — önce Vercel'de `CRON_SECRET` tanımlı mı bakılmalı. | OPEN (Kaan) |
| 2026-09-17 | **Tasarım kısıtı (bilgi):** hasta tek doktora aittir (`patients.doctor_id`); klinik (`clinic_members`) içinde hasta paylaşımı YOK. Bir gün klinik-içi paylaşım istenirse bu denetimin tüm kontrolleri (ve 052) "doktor" yerine "yetkili üye" modeline taşınmalı — tek tek rotada değil, `hastaSahipligi.ts`'te. | Bilgi |
| 2026-09-17 | **Sandbox** (`/api/sandbox/*`) paylaşılan erişim anahtarıyla çalışan, ayrı `sandbox_*` tablolu, yalnız simüle hasta içeren demo; çok-doktorlu değil (`doctor_id` sorgudan geliyor). Gerçek hasta verisi girilmemeli. | Bilgi |

## BRANS-ALAN-SIZMASI — branşa özgü alan / kelime başka branşa sızmaz (Kaan, canlı, 2026-09-17)

**Ne istendi (Kaan).** Bir branşa özgü olan (form, dosya, kelime, bölüm, alan) hiçbir zaman başka branşa
taşınmamalı. Baseline (ortak omurga) ile branş deltası temiz ayrılmalı; branşa özgü içerik yalnız o branşın
hekiminde, açık bir kapının arkasında görünmeli — varsayılan olarak asla. `cross-specialty-parity`'nin ayna
görüntüsü: o "omurga düzeltmesi her branşa", bu "branş içeriği yalnız kendi branşına". Kaan bir **KD hekim
hesabında** iki canlı hata buldu.

### İki bildirilen hata — kök neden ve düzeltme

| Hata | Kök neden | Düzeltme |
|---|---|---|
| **Yaşamsal Bulgular formunda "Baş Çevresi"** (KD) | `SpecialtyProfile.olcumler` baş çevresini doğru biçimde **yalnız pediatri** için ilan ediyordu (`kosul: 'pediatrik'`) ama **hiçbir ekran profili okumuyordu**. `inceleme/page.tsx` ve `notlar/[id]/page.tsx` `['ates', …, 'basCevresi']` listesini **koşulsuz sabit** yazmıştı — kapı yoktu, bozuk da değildi: hiç bağlanmamıştı. Ayrıca SOAP JSON şablonu her branşta `"basCevresi"` anahtarı taşıyordu (KD'de dikte edilen fetal HC annenin vitaline yazılabiliyordu). | Form alanları artık sunucunun hesapladığı `bransKapsami.olcumler`'den (profil → `lib/specialties/kapsam.ts` → `notOlcumleri`), tek ortak bileşen `components/doktor/YasamsalBulgularFormu.tsx`. SOAP JSON şablonunda `basCevresi` yalnız pediatrik; model çıktısı süzgeci `vitalleriKapsamaGoreSuz` SOAP üretiminde ve not-konsult önerisinde pediatrik ölçümü atar. Neyzi persentili (`buyumePersentilleri`) de yalnız pediatrik bağlamda hesaplanır. Gizlenen alanın mevcut değeri silinmez (klinik kayıt), yalnız çizilmez. |
| **"Hasta/veli özeti" + özet metninde "veli"** (KD) | SOAP **üretim** promptu zaten pediatri kapısındaydı (DAH-PROMPTS-FU). Sızıntı dört yerden: (1) İnceleme / not sayfası / yazdır **etiketleri** ("Hasta/veli özeti", "veliye/hastaya", "Veliye anne-babaya anlatır gibi"), (2) "↻ Notuma göre yenile" düğmesinin Ayşe'ye **gönderdiği istek** ("hasta/veli özetini yeniden yaz"), (3) `not-konsult` **sistem promptu** ("veliye giden özet", "Veli özeti (taslak)", koşulsuz Neyzi kuralı) — model KD özetini veli diliyle yeniden yazıp portala gönderiyordu, (4) kapının kendisi delikti: `pediatrikKapsam` regex'i `/^(genel\|aile)/` **genel-cerrahi**'yi yakalıyordu; `some()` eski bir `'pediatri'` değerini (superuser branş değiştirici) KD'nin önüne geçiriyordu; branşı olmayan hekim (`null`, `'genel'`) pediatrik sayılıyordu. | Tüm hitap metinleri tek dosyada `lib/specialties/hitap.ts` (pediatrik set / "hasta" seti — erişkin sette "veli" yok, "hasta/veli" gibi muğlak ifade yok). Karar tek fonksiyonda `pediatrikBaglamMi()`; `pediatrikKapsam` artık onun ince sarmalayıcısı. `not-konsult` promptu `lib/doktor/notKonsultPromptu.ts`'e taşındı (test edilebilir), hitap / vital anahtarları / persentil kuralı notun kapsamından. |

### Mimari (düzeltmenin dayandığı şekil — yeni if/else değil, mevcut kaydın uzantısı)

- `SpecialtyProfile.pediatrikBaglam` + **`PEDIATRIK_BAGLAM: Record<SpecialtyKey, …>`** (`lib/specialties/profile.ts`,
  `lib/intake/bransSorulari.ts` şeklinde: 30 branş açıkça yazılı, varsayılan yok): pediatri + çocuk cerrahisi
  `her-zaman`; aile hekimliği (ve branşsız "genel") `cocuk-hastada` = **yaşı bilinen <18**; diğer 27 branş `asla`.
- `PEDIATRIK_OLCUMLER` baseline'dan ayrı; `baselineProfile()` yalnız pediatrik bağlamı olan branşa ekler.
- **Tek karar noktası `lib/specialties/kapsam.ts`**: `bransAnahtari` (kanonik anahtar; `'kadin-dogum'` çözülür,
  `'genel'` → null), `etkinBrans` (seans branşı → hekim branşı), `pediatrikBaglamMi`, `notOlcumleri`,
  `bransKapsami`, `vitalleriKapsamaGoreSuz`. Sunucu yardımcısı `kapsamSunucu.ts` (hekim branşı + hasta doğum
  tarihi, `doctor_id` kapsamlı). İstemci varsayılanı `kapsamIstemci.ts`: paket yoksa baseline + "hasta".
- `registry.ts`: `specialtyProfile(null)` artık **pediatri değil** baseline "genel" (eskiden `|| 'pediatri'`).

### Ne denetlendi (Phase 2 envanteri)

İki bağımsız tarama + elle okuma: `app/dashboard/**`, `app/api/**`, `app/portal/**`, `components/**`, `lib/**`,
`core/**`, `specialties/*/prompts`. Kategoriler: vitaller/muayene formu (baş çevresi, Neyzi; KD SAT/fundus;
göz VA/GİB; derm/dahiliye), hasta↔veli dili (portal, SOAP, yazdır/PDF, epikriz, konsult, asistan, Aşılar,
LLM bağlamı), anamnez/intake bölümleri, SOAP/epikriz/SGK şablonları, portal shell, `specialties/<slug>/`
kodunun ortak sayfalara import'u, "bilinmeyen branş = pediatri" varsayılanları, gevşek branş regex'leri.

**Doğru kapılı bulunanlar (dokunulmadı):** intake (`BRANS_SORULARI` + `coreBolumlerIcin` — model desen),
portal modülleri (`lib/portal/moduller.ts`), Doktor Araçları (`branslar` + deep-link guard, Hedef Boy),
Göz sekmesi + mount, bölüm prompt kilitleri (`dahiliyeMi/kadinDogumMi/dermatolojiMi/gozMi`), onam yazdır
(yalnız KD DogumSpine'dan erişilir), lab kaynakları (`bransKey === 'dahiliye'`), yazdır vital satırı (veri
güdümlü), SOAP pediatri persona kg-doz satırı.

### Bulunan ve DÜZELTİLEN diğer sızıntılar

| # | Yer | Sızıntı | Düzeltme |
|---|---|---|---|
| L1 | `app/api/doktor/araclar/epikriz/route.ts` (tüm seanslar) | Branş **sabit `'pediatri'`**: her hekimin epikrizi "Kliniği: Pediatri (Çocuk Sağlığı)" başlığı ve "Çocuk Sağlığı ve Hastalıkları Uzmanı" **imzasıyla** basılıyordu (resmî belge); prompt her hastada "sağlam çocuk kontrolleri / AŞI KARNESİ" istiyordu | Branş notun kapsamından (hekimin branşı); branş yoksa satır yazılmaz; prompt metinleri `lib/doktor/epikrizMetinleri.ts` — pediatrik satırlar yalnız pediatrik bağlamda (pediatri promptu bayt bayt aynı, testle doğrulandı) |
| L2 | aynı rota (tek vizit) | `seansBilgi?.specialty \|\| 'pediatri'`; "Anne beyanına göre çocuğun…", "doğum bilgileri" satırları | Aynı kapsam; erişkin metni "Hastanın beyanına göre…" |
| L3 | `app/doktor-tools/epikriz/page.tsx` | Yardım metni "sağlam çocuk kontrolleri … aşı karnesi" (her branş) | Nötr metin |
| L4 | `notlar/[id]/yazdir/page.tsx` | Basılı belgede "Hasta / Veli Özeti" + Neyzi persentil satırı her branşta | Kapsamdan etiket; persentil sunucuda kapılı |
| L5 | `app/dashboard/doktor/hastalar/[id]/page.tsx` | `?tab=dahiliye` / `?tab=deri` derin bağlantısı `DahiliyeHome` / `HastaDermatoloji`'yi **branş kapısı olmadan** mount ediyordu | Mount, sekme düğmesiyle aynı boolean'a bağlandı (`dahiliyeUygun`, `deriAraci`) |
| L6 | aynı sayfa — Dahiliye sekme regex'i | `/…\|genel\|…\|göğüs\|…/` **genel-cerrahi** ve **göğüs cerrahisi**'ni yakalıyordu (cerrah Dahiliye bölümünü görüyordu) | `dahiliyeSekmesiBransi()` (`hastaDosyaSekmeleri.ts`), cerrahi dışlanır, testli |
| L7 | `pediatriAracSekmesiUygun` | Doğum tarihi **bilinmeyen erişkin** hastada kardiyoloji/üroloji/… hekimine M-CHAT, gelişim, büyüme, bebek sekmeleri | Bilinmeyen yaş yalnız pediatri hekiminde açık; diğerlerinde yaşı bilinen <18 şart |
| L8 | `components/doktor/HastaAsilar.tsx` (Aşılar sekmesi, her branş) | "Hasta/veli beyanı" seçeneği; yeni kayıt varsayılanı `'pediatrik'`; SB çocukluk dönemi takvimi düğmesi erişkin hastada | Hitap kapsamdan; varsayılan kategori hasta yaşından; takvim yalnız çocuk hasta / pediatrik bağlamda |
| L9 | `lib/doktor/hastaDosyaDerleyici.ts` (SOAP, konsult, not-konsult, epikriz, asistan bağlamı) | Modele giden başlık "ÖZGEÇMİŞ — hasta/veli beyanı" her hastada | Veri güdümlü: form veli tarafından doldurulduysa (`veliYakinligi`) "veli beyanı", değilse "hasta beyanı" |
| L10 | `app/dashboard/doktor/page.tsx` | "Yeni bebek — pediatri iş listesi" KD hekiminin ana sayfasında; bebek sekmesi KD'de kapalı olduğundan çıkmaz yol | Yalnız pediatrik bağlamı olan branşta (`pediatrikBaglamKurali !== 'asla'`); görevler silinmez (superuser pediatri modunda görür) |
| L11 | `app/portal/_components/HomeHero.tsx` | Sağlığım karşılamasında her hastaya "Bebek sağlığı" görseli | Yalnız büyüme modülü bağlıysa; diğerlerinde "Sağlıklı yaşam" |
| L12 | `notlar/[id]/recete/page.tsx` | Reçete başlığı yer tutucusu "Dr. Gökhan Mamur / Çocuk Sağlığı ve Hastalıkları Uzmanı" (her hekim) | Nötr yer tutucu |
| L13 | `components/doktor/HastaIntake.tsx` | (Ters yön) KD profili `'kadin-dogum'` anahtar sayılmadığı için KD hekiminin gönderdiği formda KD bölümü yoktu | `bransAnahtari()` ile kanonik anahtar |

### Kalıcı korkuluk (yerinde)

| Dosya | Ne |
|---|---|
| `.cursor/skills/brans-alan-sizmasi/SKILL.md` | Kaan'ın `661ace9` ile eklediği kural metni temel alındı (değiştirilmedi); bu iş ekledi: iki hatanın kök nedeni, tek karar noktası (`kapsam.ts`) ve `PEDIATRIK_BAGLAM`, içerik türü → mekanizma tablosu, varsayılan/regex tarama komutları, "üç katman" kuralı (etiket + prompt + model çıktısı), iki yönlü test, **"Branş sızıntısı" PR bloğu** (ortak bileşen PR'ında zorunlu), kontrol listesi |
| `.cursor/rules/brans-alan-sizmasi.mdc` | `alwaysApply` (Kaan'ın metni) + gerçek kapı dosyaları, "bilinmeyen = baseline", üç katman, test komutu |
| `CLAUDE.md`, `cross-specialty-parity`, `specialty-universal-vs-chapter` | Bağlantılar Kaan'ın `661ace9` commit'inden (aynen) |
| `lib/specialties/brans-alan-sizmasi.test.ts` (26 test) | 30/30 branş döngüsü; `YasamsalBulgularFormu` **gerçek render** (react-dom/server): Baş Çevresi KD/dahiliye/derm/göz/kardiyoloji/cerrahide yok (hasta çocuk olsa bile), pediatride var ve son sırada; SOAP / not-konsult / epikriz promptlarında erişkin branşta veli / Neyzi / sağlam çocuk yok, pediatride var; sekme kapıları; **kaynak kilidi** (ortak sayfalarda sabit "Baş Çevresi" / "veli" / `'pediatri'` yok, bölüm mount'ları kapıda) |
| `lib/specialties/brans-alan-sizmasi-rotalar.test.ts` (5 yürüyüş) | Aşağıdaki VERIFY — gerçek route handler'ları, sentetik hekimler |
| `npm run test:brans-sizmasi` | İkisi; ikisi de `npm test` içinde |

**Sahte yeşil değil:** `pediatrikBaglamMi` geçici olarak eski davranışa ("her zaman pediatrik") çevrildi → iki
pakette **11 test kırmızı** (5 rota yürüyüşünün hepsi dahil) → geri alındı → yeşil. Mevcut iki test yeni politikaya
güncellendi (bilinçli): `specialties/kadin-dogum/tests/promptsLock.test.ts` (eski "genel/aile/null = pediatrik"
beklentisi → yaş güdümlü; genel-cerrahi ve KD+eski-pediatri delikleri eklendi) ve
`specialties/dahiliye/tests/promptsLock.test.ts` (kırılgan `'doktorBransi })'` dize kontrolü → aynı niyetli regex).

### VERIFY — sentetik QA hekimleriyle (gerçek hesap / gerçek hasta yok)

`brans-alan-sizmasi-rotalar.test.ts`: 9 sentetik hekim — **pediatri** (çocuk hasta), **KD** (`users.specialty =
'kadin-dogum'`, gerçek KD profil değeri), **KD + "genel" seans**, **dahiliye**, **dermatoloji**, **göz**,
**kardiyoloji**, **aile hekimliği** (çocuk ve erişkin hasta) — her biri 5 gerçek rotadan geçer; veritabanı /
model sahte (`lib/security/testing/sahteSupabase.ts`, HASTA-IZOLASYON-01 altyapısı):

| Yol | Pediatri | KD / dahiliye / derm / göz / kardiyoloji / aile-erişkin |
|---|---|---|
| `GET /api/notes` → `YasamsalBulgularFormu` render | Baş Çevresi alanı + Neyzi persentili var; "Hasta/veli özeti" | Baş Çevresi yok, persentil yok, "Hasta özeti"; baseline 7 alan aynı |
| `GET /api/notes/[id]` (not sayfası / yazdır) | "Hasta / Veli Özeti" | "Hasta Özeti"; KD+genel seans → KD |
| `POST /api/sessions/[id]/end` (gerçek `soapUret`) | prompt veli + `"basCevresi"` taşır; model değeri kalır | prompt'ta veli / `basCevresi` yok; model "baş çevresi 28" yazsa bile nota **girmez**, diğer vitaller kalır |
| `POST /api/doktor/not-konsult` (UI'nin gönderdiği istekle) | istek + prompt veli, Neyzi | istek + prompt'ta veli / Neyzi yok; önerilen baş çevresi süzülür |
| `POST /api/doktor/araclar/epikriz` (tüm seanslar + tek vizit) | "Kliniği: Pediatri (Çocuk Sağlığı)", çocuk uzmanı imzası | "Kliniği: Kadın Hastalıkları ve Doğum" / "İç Hastalıkları (Dahiliye)" / "Göz Hastalıkları" + kendi unvanı; prompt'ta sağlam çocuk / aşı karnesi yok |

Aile hekimliği + çocuk hasta pediatri gibi davranır (bebek izleminde baş çevresi, veli dili). Canlı tarayıcı
yürüyüşü yapılmadı: notya.ai bu ortamdan erişilemiyor, vercel.app SSO arkasında, production'a sentetik hesap
yazmak kural dışı — doğrulama yerel ve rota düzeyinde.

`npx tsc --noEmit` temiz · `npm test` **878/878** yeşil.

### Düzeltme — VELI-YASAL-ONAM: "veli" yaşa bağlı, branşa değil (Kaan, 2026-09-17, #312 sonrası)

**Kaan'ın hukuki düzeltmesi (aynen):** "Evet. 18 yaşını doldurmamış her çocukta klinik kayıt ve tıbbi onam için veli /
yasal temsilci bilgisi alınır. Pratik kural: Ad, soyad, yakınlık (anne, baba, vasi), telefon; mümkünse kimlik teyidi;
rutin işlemde onam veliden. İstisna dar: Acil / hayati tehlike: veli yokken müdahale edilir, sonra bildirilir; Evlilik
veya mahkeme ile ergin kılınmışsa kendi onamı yeter (belge şart). SGK provizyonu çocuğun T.C. kimliğiyledir; veli kaydı
fatura için değil, onam, iletişim ve dosya içindir."

**Ne yanlıştı.** #312, "veli" dilini klinik içerikle aynı kapıya (`pediatrikBaglamMi` / `PEDIATRIK_BAGLAM`) bağlamıştı:
göz / KBB / ortopedi / kardiyoloji / derm hekiminin 10 yaşındaki hastası notta, yazdırda ve Aşılar'da "hasta" diye
anılıyordu. Türk hukukunda veli/yasal temsilci onamı branştan bağımsız olarak her reşit olmayan hastada gerekir.

**Düzeltme — iki eksen, iki fonksiyon (`lib/specialties/kapsam.ts`):**

| Eksen | Fonksiyon | Neye bakar | Neyi sürer |
|---|---|---|---|
| KLİNİK (değişmedi) | `pediatrikBaglamMi()` | branş (`PEDIATRIK_BAGLAM`) + aile/branşsızda yaş | Baş Çevresi alanı, Neyzi persentili, sağlam çocuk / aşı karnesi / doğum bilgileri, prenatal öykü, mg/kg satırı, `basCevresi` süzgeci |
| HUKUKİ (yeni) | `veliOnamGerekliMi(dogumIso, nowMs?)` | **yalnız yaş**: takvim yaşı (TRT) < 18 — branş girdisi yok; doğum gününde 18 dolar; bilinmeyen / gelecek tarih → false | — |
| HİTAP (yeni) | `veliDiliMi(g)` = `veliOnamGerekliMi ‖ pediatrikBaglamMi` | ikisi | `bransKapsami().veliDili` → `hitap.ts` veli seti; pediatri / çocuk cerrahisi önceki gibi her zaman veli dilinde |

`hitapMetinleri(veliDili)` artık bu karardan beslenir (metinler aynı — pediatri etiketleri bayt bayt değişmedi).
`soapKurallari(pediatrik, veli)` ve `epikrizTekVizitSistem(pediatrik, veli)` ikinci eksen aldı (verilmezse ilkiyle
aynı → pediatri promptu değişmedi, testle kilitli).

**Tüketici izi (eski pediatri-only veli kapısının her kullanıcısı — hepsi yeni kurala geçti):**

| Yer | Önce | Şimdi |
|---|---|---|
| İnceleme "Hasta/veli özeti" + "Evde dikkat … (veliye/hastaya)" + yer tutucu (`inceleme/page.tsx`) | `bransKapsami.hitap` ← pediatrik | aynı alan ← `veliDili` |
| "↻ Notuma göre yenile" isteği (`hitap.ozetYenileIstegi`) | ← pediatrik | ← `veliDili` |
| Not sayfası etiketleri (`notlar/[id]/page.tsx`) + yazdır "Hasta / Veli Özeti" (`yazdir/page.tsx`) | `/api/notes/[id]` paketi | paket `veliDili` taşır, hitap ondan |
| SOAP üretim promptu (`soapUret.ts` — sessions/end + ses-yukle) | 6 hitap satırı `ped()` | `hitap()` ← `veliDiliMi`; klinik `ped()` satırları dokunulmadı |
| not-konsult promptu (`notKonsultPromptu.ts`) — "veliye giden özet", "Veli özeti (taslak)" | `kapsam.hitap` | aynı (paket `veliDili`'den); Neyzi kuralı hâlâ `kapsam.pediatrik` |
| Epikriz tek vizit — "Anne beyanına göre çocuğun…" örnek satırı | `ped()` | `hitap()` ← `kapsam.veliDili`; "doğum bilgileri", tarama/aşı ve kapsamlı epikrizde sağlam çocuk / AŞI KARNESİ hâlâ `pediatrik` |
| Aşılar "Hasta/veli beyanı" (`HastaAsilar.tsx`, hasta dosyası sayfası) | `hitapMetinleri(pediatrikBaglam)` | yeni `veliDili` prop'u ← `veliDiliMi`; SB çocukluk takvimi ve varsayılan kategori hâlâ `pediatrikBaglam` / `cocukHasta` |
| Portal (Sağlığım) | etiketi yok; `hasta_ozeti` metnini gösterir | metin yukarıdaki SOAP / konsult promptlarından geldiği için otomatik düzeldi |
| `hastaDosyaDerleyici` "veli beyanı / hasta beyanı" (L9) | veri güdümlü (`veliYakinligi`) | değişmedi — formu kimin doldurduğunu söyler, doğru |

**Dokunulmayanlar (bilinçli):** Baş Çevresi alan kapısı, Neyzi hesabı, sağlam çocuk / aşı karnesi epikriz satırları,
`PEDIATRIK_BAGLAM`, `pediatrikKapsam`, sekme görünürlüğü (M-CHAT / büyüme / bebek kartı) ve Kadın Sağlığı sekmesi
politikaları — hepsi aşağıda ayrı OPEN olarak duruyor. Yeni UI öğesi yok (yalnız mevcut iki etiket setinden hangisinin
seçildiği değişti; veli seti pediatride zaten canlı) → mobil kontrol gerekmedi.

**Kalıcı korkuluk.** `brans-alan-sizmasi` SKILL + `.mdc` kuralı + `CLAUDE.md`: Kaan'ın ilk metni korundu, altına
düzeltme notu eklendi ("veli" = yaş, her branş; klinik içerik = branş) + yeni anti-desen (veli'yi branşa, baş çevresini
yalnız yaşa bağlamak).

**VERIFY (sentetik QA, gerçek hasta/hesap yok).** `brans-alan-sizmasi-rotalar.test.ts`'e 7 yeni sentetik hekim:
**göz + çocuk** (4 y), **kardiyoloji + ergen** (16 y), **KBB + çocuk / KBB + erişkin**, **ortopedi + ergen /
ortopedi + erişkin**, **çocuk cerrahisi + çocuk** (mevcut göz / kardiyoloji erişkin eşleriyle birlikte). Gerçek 5 rota:

| Yol | göz / KBB / ortopedi / kardiyoloji + **reşit olmayan** | aynı branşlar + **erişkin** | pediatri / çocuk cerrahisi / aile+çocuk |
|---|---|---|---|
| `GET /api/notes` (+ `YasamsalBulgularFormu` render) | "Hasta/veli özeti", "veliye/hastaya"; **Baş Çevresi yok, Neyzi null** | "Hasta özeti", veli yok | veli + Baş Çevresi + Neyzi (değişmedi) |
| `GET /api/notes/[id]` (not / yazdır) | "Hasta / Veli Özeti"; persentil null | "Hasta Özeti" | "Hasta / Veli Özeti" |
| `POST /api/sessions/[id]/end` (gerçek `soapUret`) | prompt veli dilinde; `"basCevresi"`, "Neyzi standartları", "pediatride prenatal", "pediatride mg/kg" **yok**; model baş çevresi yazarsa nota girmez | veli yok | veli + pediatrik klinik satırlar |
| `POST /api/doktor/not-konsult` (UI isteğiyle) | istek + prompt veli; Neyzi yok; baş çevresi önerisi süzülür | veli yok | veli + Neyzi |
| `POST /api/doktor/araclar/epikriz` | kendi branş başlığı / unvanı; tek vizitte veli beyanı; sağlam çocuk / doğum bilgileri yok | veli yok | değişmedi |

Birim paketi: 30/30 branş × {4 y, 16 y, erişkin, bilinmeyen} döngüsü (klinik ve hitap eksenleri ayrı ayrı),
`veliOnamGerekliMi` sınırları (18. doğum gününün bir günü öncesi / günü, gelecek tarih), `soapKurallari` /
`epikrizTekVizitSistem` pediatri bayt eşitliği, Aşılar kaynak kilidi. **Sahte yeşil değil:** `veliDiliMi` geçici olarak
eski kurala (`pediatrikBaglamMi`) çevrildi → **9 test kırmızı** (rota yürüyüşleri dahil) → geri alındı → yeşil.
Bilinçli değişen eski test: "KD / dahiliye / … çocuk hastada SOAP promptunda veli yok" — Kaan'ın düzeltmesiyle tersine
döndü (erişkin hasta için hâlâ kilitli).

`npx tsc --noEmit` temiz · `npm test` **885/885** yeşil.

### Ek — INTAKE-VELI-ACIL: intake veli bölümü her branşta (yaşa bağlı) + isteğe bağlı Acil Durumda Aranacak Kişi (Kaan, 2026-09-17, #314)

**İstenen (Kaan, VELI-YASAL-ONAM #313 incelemesi sonrası).** (1) 18 yaşını doldurmuş hastada "veli" kavramı hiçbir
yerde kalmasın, intake formu dahil (#313 hitabı düzeltmiş, formun kendi veli bölümünü pediatri-only bırakıp OPEN
işaretlemişti). (2) Erişkin intake formuna, ABD hasta kabul pratiğindeki gibi, acil durumda aranacak kişi alanı — ama
önce Türk sağlık pratiğinde gerçekten yerleşik mi doğrulansın; **isteğe bağlı, asla zorunlu değil**.

**Türk pratiği teyidi (aynı oturumda web araştırması — yeniden araştırılmadı):** üç bağımsız kaynak —
(a) hastane **yatış / kabul formu** geleneği: "hasta yakını adı, adresi, telefonu" bölümü; (b) genel **Kişisel Sağlık
Bilgi Formu** rehberi: "acil durumlar için aranacak kişi" açıkça isteniyor; (c) T.C. Sağlık Bakanlığı **e-Nabız**'ın
kendi **"Acil Durumda Aranacak Kişi Listesi"** özelliği. → Gerçek, yerleşik uygulama.

**Kalıcı kural (yalnız bu iş için değil):** "Acil Durumda Aranacak Kişi" alanları uygulamanın **her yerinde isteğe
bağlıdır** — intake, hasta kartı, portal ya da ileride bu alana dokunan herhangi bir yüzey hiçbir alanını `zorunlu`
yapamaz; boş form gönderilebilir. Veli bölümünden **ayrıdır** (veli = hukuki temsil / onam; acil kişi = yalnız
iletişim) — alanları, etiketleri birleştirilmez; bir hastada ikisi birden (reşit olmayanın velisi + ayrı bir büyükanne)
ya da yalnız biri olabilir. Kilit: `brans-alan-sizmasi.test.ts` (30/30 branşta `acilKisi*` zorunlu değil) + skill notu.

**Bulunan durum.** Acil durum kişisi formda **zaten vardı** — İletişim Bilgileri içinde üç alan, **üçü de zorunlu**
(`acilKisiAdi`, `acilKisiTelefon`, `acilKisiYakinlik`). Kaan'ın "asla zorunlu değil" kuralını ihlal ediyordu. Yeni alan
eklenmedi; mevcut alanlar ayrı, isteğe bağlı bölüme taşındı (id'ler aynı → eski gönderimler aynı etiketle okunur).

| Bölüm | Önce | Şimdi |
|---|---|---|
| **Veli / Yasal Temsilci** | yalnız `BRANS_SORULARI.pediatri` içinde alt başlık: yakınlık (Anne/Baba/Diğer, zorunlu) + "Diğer" metni; yaş kapısı yok (pediatride erişkine de çıkıyordu), göz / KBB / ortopedi / kardiyoloji formunda hiç yoktu; sunucu doğrulamıyordu (yalnız core doğrulanır) | ortak omurga `VELI_BOLUMU` (`lib/intake/coreAlanlar.ts`), Kimlik Bilgileri'nin hemen ardından, her branşta aynı nesne. Alanlar (Kaan'ın pratik kuralı): ad*, soyad*, yakınlık* (Anne/Baba/**Vasi**/Diğer), "Diğer ise yakınlığı" (eski `veliDigerAdSoyad` metni, isteğe bağlı), telefon* (yeni), **Kimlik teyidi yapıldı** onay kutusu (yeni, isteğe bağlı — "mümkünse") |
| Veli kapısı | — | `IntakeBolum.veliKosulu` → `intakeBolumGorunur` → **`veliOnamGerekliMi`** (kapsam.ts, yeniden yazılmadı), formdaki `dogumTarihi` yanıtıyla. Doğum tarihi girilmeden bölüm çizilmez; girilince (reşit değilse) belirir — gebelik haftasının `gosterEger` deseniyle aynı sıra bağımlılığı. Reşit olmayanda **zorunlu** (istemci + sunucu aynı `dogrula.ts`); erişkinde çizilmez, doğrulanmaz, **kaydedilmez** (`intakeGorunmeyenYanitlariAyikla` — istemcide doğum tarihi erişkine düzeltilince ve sunucuda POST'ta) |
| **Acil Durumda Aranacak Kişi (isteğe bağlı)** | İletişim Bilgileri'nde 3 zorunlu alan | ayrı bölüm, her branş her yaş, hiçbir alanı zorunlu değil; yakınlık serbest metin (radyo seçimi isteğe bağlı bölümde geri alınamıyor — boş bırakılabilirlik için metin). Mevcut isteğe bağlı alan deseni: yıldız yok + "(isteğe bağlı)" (Anne boyu alanı gibi) |
| Hitap (`veliDiliMi`) | reşit olmayan **veya** pediatrik bağlam → pediatri / çocuk cerrahisi hekimindeki **erişkin** hasta da veli dilindeydi | yaşı bilinen erişkin **hiçbir branşta** veli dili almaz; pediatrik bağlam yalnız yaş bilinmiyorsa veli diline düşer. SOAP, not-konsult, İnceleme / not / yazdır etiketleri, Aşılar — hepsi bu tek fonksiyondan |
| LLM bağlamı (`hastaDosyaDerleyici`) | acil kişi gizli, veli metni modele gidiyordu | veli ad / soyad / telefon / "Diğer" metni / kimlik teyidi de gizli; yakınlık gider ("veli beyanı" kararı `veliYakinligi`'nden, artık her branşta doğru) |

**Depolama — migration yok.** Tüm intake yanıtları zaten tek şifreli blobda (`hasta_intake_formlari.form_data_encrypted`,
`encrypt()` — 009 migration yorumu: "patients.notes_encrypted ile aynı desen", TC kimlik dahil). Veli ve acil kişi
alanları aynı blobda şifreli; hekim Hasta Bilgi Formu sekmesinde etiketleriyle görür. Hasta kartına (`patients`) ayrı
kolon açılmadı — kartta bu bilgiyi gösteren yüzey yok (ürün kararı gerekirse ayrı iş).

**Görünen bölüm numarası** boşluk bırakmaz (bölüm çizimi `components/intake/IntakeBolumleri.tsx`'e taşındı, sayfa onu
kullanır; testte gerçek render). Yeni UI öğesi / stil yok — mevcut bölüm ve alan çizimi aynen.

**VERIFY (sentetik QA, gerçek hasta/hesap yok).** `brans-alan-sizmasi-rotalar.test.ts` › 6: 8 sentetik hekim —
**pediatri + çocuk**, **pediatri + 20 yaş**, **göz + çocuk / erişkin**, **kardiyoloji + ergen / erişkin**, **KBB + çocuk**,
**ortopedi + erişkin** — gerçek rotalar: hekim `POST /api/doktor/intake-formlari` (elden) → hasta `GET /api/intake/[token]`
→ dönen şema `IntakeBolumleri` ile gerçekten çizilir → `POST /api/intake/[token]` → hekim `GET /api/doktor/intake-formlari/[id]`:

| | reşit olmayan (her branş) | erişkin (pediatri dahil) |
|---|---|---|
| Veli / Yasal Temsilci bölümü | var, alanlar yıldızlı | **yok**; çizilen formda "veli" kelimesi yok |
| Acil Durumda Aranacak Kişi | var, yıldızsız | var, yıldızsız |
| Veli boş gönderim | **400** "Veli / Yasal Temsilcinin Adı alanı zorunludur" | — |
| Acil kişi tamamen boş gönderim | 200 (veli dolu) | **200** |
| Kaydedilen (çözülen) yanıt | veli alanları var | istemci veli alanı gönderse bile **veli izi yok** |

Ayrıca pediatri + 20 yaş hekimi 5 mevcut rota yürüyüşüne eklendi: İnceleme / not / yazdır "Hasta özeti", SOAP ve
not-konsult promptlarında veli yok, baş çevresi (klinik, branş) yerinde. Birim paketi (`brans-alan-sizmasi.test.ts`):
30/30 branşta veli bölümü tek ortak nesne ve branş bölümünde veli alanı yok, acil alanları hiçbir branşta zorunlu değil,
17/18 yaş sınırı, render numaralandırma, doğrulama, kayıt süzgeci, kaynak kilitleri. **Sahte yeşil değil:** veli kapısı
geçici olarak kapatıldı → **9 kırmızı**; acil telefonu zorunlu yapıldı → **4 kırmızı**; ikisi de geri alındı → yeşil.
Bilinçli değişen eski test: "30/30 branş veli dili" — pediatri / çocuk cerrahisi + erişkin artık "hasta".

Canlı tarayıcı yürüyüşü yapılmadı: notya.ai bu ortamdan erişilemiyor, vercel.app SSO arkasında, production'a sentetik
hesap yazmak kural dışı — doğrulama yerel, gerçek rota + gerçek render düzeyinde (#312 / #313 ile aynı).

`npx tsc --noEmit` temiz · `npm test` **894/894** yeşil.

### AÇIK — karar gerekiyor (tahmin edilmedi)

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-17 | **Bilinen çocuk hastada baseline branşlarda pediatri sekmeleri** (kardiyoloji, KBB, üroloji, ortopedi… → Büyüme, M-CHAT, Gelişim, Bebek kartı) | Aynı gün yazılmış CHART-TAB-POLICY (`hastaDosyaSekmeleri.ts`) bunu bilerek açık bırakıyor ("baseline/aile mixed care"); Kaan'ın yeni kuralı ("pediatri alanı kardiyoloji hekimine çıkmaz") ise tersini söylüyor. Politikayı sessizce çevirmedim. **Öneri:** `pediatriAracSekmesiUygun`'u `pediatrikBaglamMi`'ye bağla (pediatri/çocuk cerrahisi her zaman, aile yalnız çocukta, diğerleri asla) — tek fonksiyon, testler 30/30 döngüyle hazır. | OPEN (Kaan) |
| 2026-09-17 | **"Kadın Sağlığı & Gebelik" sekmesi her branşta** (≥12 yaş kadın hastada tam KD bölümü: NST, risk formu, VTE, gebe kartı) | "Mixed care" politikası olarak belgelenmiş; ama tam KD bölüm UI'sinin göz/derm/kardiyoloji hekimine açılması tam da bu denetimin sızıntı tanımı. Gebelik bilgisi ise her branş için güvenlik bilgisi (isotretinoin, görüntüleme, ilaç). **Öneri:** her branşa salt-okunur "Gebelik durumu" çipi; tam KD bölüm UI'si yalnız KD (±aile) hekimine. Sunucu tarafı (`/api/doktor/gebelik`, `jinekoloji`, `kadin-sagligi`) bugün yalnız hasta sahipliğine bakıyor, branşa değil — karar verilince orada da aynı kapı. | OPEN (Kaan) |
| 2026-09-17 | **Pediatri dışı branşta reşit olmayan hasta** (göz, KBB, derm, ortopedi 10 yaşında hasta görür) | #312 "veli"yi yalnız pediatri (+ çocuk cerrahisi) branşına bağlamıştı. **Kaan'ın kararı (2026-09-17, aynen):** "18 yaşını doldurmamış her çocukta klinik kayıt ve tıbbi onam için veli / yasal temsilci bilgisi alınır. … rutin işlemde onam veliden. İstisna dar: Acil / hayati tehlike: veli yokken müdahale edilir, sonra bildirilir; Evlilik veya mahkeme ile ergin kılınmışsa kendi onamı yeter (belge şart). SGK provizyonu çocuğun T.C. kimliğiyledir; veli kaydı fatura için değil, onam, iletişim ve dosya içindir." → hitap artık yaş güdümlü, her branşta (`veliOnamGerekliMi` / `veliDiliMi`); baş çevresi / Neyzi / sağlam çocuk branşta kaldı. Ayrıntı: yukarıda "Düzeltme — VELI-YASAL-ONAM". | **KAPANDI** (2026-09-17, VELI-YASAL-ONAM) |
| 2026-09-17 | **Ergin kılınmış reşit olmayan hasta** (evlilik / mahkeme kararı — kendi onamı yeter, belge şart) | Hasta kaydında bunu tutan alan yok (`lib/db/schema.sql` + migrations: `patients` yalnız ad, doğum tarihi, cinsiyet, TC hash, telefon, not; kodda "ergin" / "emansipasyon" / yasal ehliyet araması boş); uydurulmadı. Bugün bu hasta da <18 olduğu için veli dili alır — güvenli taraf, ama hukuken yanlış hitap. Gerekenler: (1) veri alanı (ör. ergin kılınma türü + belge tarihi/no, şifreli), (2) hekimin bunu **nereye** işleyeceği (hasta kartı mı, intake mı, belge yükleme mi) ve kimin doğrulayacağı, (3) sonra `veliOnamGerekliMi`'ye tek dal. Acil/hayati tehlike istisnası nota hitap değişikliği gerektirmez (veli sonradan bilgilendirilir) — ayrı alan gerekmedi. | OPEN (Kaan — alan + yer kararı) |
| 2026-09-17 | **Reşit olmayan hastada veli bilgisi TOPLAMA** (Kaan'ın pratik kuralı: ad, soyad, yakınlık — anne/baba/vasi —, telefon; mümkünse kimlik teyidi) | Bu iş yalnız **hitabı** düzeltti. Veli bilgisini toplayan tek yer pediatri intake bölümü ("Veli / Yasal Vasi": yalnız yakınlık Anne/Baba/Diğer + "Diğer" ise ad soyad) — göz / KBB / ortopedi hekiminin gönderdiği formda veli bölümü yok ve hiçbir yerde veli telefonu / kimlik teyidi alanı yok. Intake + hasta kartı veri modeli değişikliği (ürün kararı), bu işin kapsamı dışında bırakıldı. **Öneri:** `coreBolumlerIcin` omurgasına yaş güdümlü (`veliOnamGerekliMi`) "Veli / Yasal Temsilci" bölümü: ad, soyad, yakınlık (anne/baba/vasi/diğer), telefon, kimlik teyidi onay kutusu — her branşta aynı. | **KAPANDI** (2026-09-17, #314 — öneri aynen uygulandı; ayrıntı: aşağıda "Ek — INTAKE-VELI-ACIL") |
| 2026-09-17 | **Pediatri hekiminin erişkin hastasında pediatri branş bölümü** ("Çocuğunuz Hakkında", doğum / gelişim soruları, "Çocuğunuzun geçirdiği hastalıklar", "Ailede sigara") | #314 ile erişkin hastanın formunda veli bölümü ve "veli" kelimesi yok (testli). Ama pediatri **branş** bölümü klinik içerik olarak `PEDIATRIK_BAGLAM` = her-zaman kuralıyla yaştan bağımsız çıkıyor; ebeveyne hitap ediyor. Kural değiştirilmedi (klinik eksen branş güdümlü — BRANS-ALAN-SIZMASI). **Öneri:** pediatri hekimi erişkin hasta görüyorsa (geçiş dönemi 18–21) branş bölümü baseline başvuru nedeni + sağlık geçmişine düşsün; tek karar noktası: intake GET'te form doğum tarihi yok → istemci tarafında `veliKosulu` benzeri bir yaş koşulu. | OPEN (Kaan) |
| 2026-09-17 | **Aile hekimliği ve branşsız hekim = `cocuk-hastada`; çocuk cerrahisi = `her-zaman`** | Aile hekimleri SB Bebek-Çocuk İzlem Protokolü'nü (baş çevresi dahil) uyguluyor; eskiden aile/genel **her** hastada pediatrik dil alıyordu — şimdi yalnız yaşı bilinen çocukta (daha dar, sızmaz). Çocuk cerrahisinin tüm hastaları çocuk (intake zaten "Çocuğunuz" diyor) ve baş çevresi alanı onda önceden de vardı. | Karar uygulandı — teyit (Kaan / Dr. Gökhan) |
| 2026-09-17 | **İlan edilmiş ama hiç çizilmeyen bölüm ölçümleri** (ters yön) | KD profili `sonAdetTarihi`, `fundusYuksekligi`; göz profili VA ve GİB ×2 ilan ediyor, ama not vital hattı (`NOT_VITAL_ANAHTARLARI`) bunları taşımıyor — gerçek kayıt bölüm tablolarında (gebelik, `goz_*`). Forma eklemek SOAP çıkarımı, onay, yazdır ve portal biçimini değiştirir (ürün kararı). **Öneri:** bölüm tablolarında kalsın; profilde "kaynak: bölüm" işaretiyle "ilan edilip okunmayan" tuzağı kapansın. | OPEN (ürün) |
| 2026-09-17 | **Asistan persona varsayılanı pediatri** | `VARSAYILAN_PERSONA = 'aysekaya'` (pediatri Ayşe: "yetişkin dozu asla önerme"), `specialistsCatalog` `genel: 'pediatri'` + `getSpecialistForSpecialty` pediatri yedeği, `asistan/signed-url` `\|\| 'pediatri'` — aile / branşsız / bilinmeyen hekimde pediatri personası. Ses/persona sistemi paralel bir çalışmanın alanında (ElevenLabs dalı) — çakışmamak için dokunulmadı. **Öneri:** aile/genel için nötr "genel pratisyen" personası; bilinmeyen → pediatri değil. | OPEN |
| 2026-09-17 | **Bölüm prompt kilitleri not-konsult / epikriz / doz-öner'e ulaşmıyor** (parite, ters yön) | SOAP ve asistan sohbeti dahiliye/KD/derm/göz `*Kilidi` ekliyor; `not-konsult`, epikriz ve `ilaclar/doz-oner` eklemiyor (doz-öner "doz yazma" kilidini de atlıyor). Sızıntı değil, `cross-specialty-parity` + doz kilidi işi. | OPEN (parite) |
| 2026-09-17 | **Geçmiş kayıtlar** | Bu düzeltmeden önce üretilmiş KD/erişkin notlarında `hasta_ozeti` içinde "veli" ve `vitaller.basCevresi` olabilir (portal veri güdümlü gösterir). Klinik kayıt — dokunulmadı. (VELI-YASAL-ONAM sonrası: reşit olmayan hastanın notunda "veli" artık doğru — sayımda doğum tarihi <18 olanları ayrıca hariç tutun; ters yönde, #312 ile bu düzeltme arasında pediatri dışı branşta çocuk hastaya üretilmiş özetler "hasta" dilinde kalmış olabilir.) Salt-okunur sayım: `select count(*) from notes n join sessions s on s.id = n.session_id where coalesce(s.specialty,'') not in ('pediatri','cocuk-cerrahisi') and (n.hasta_ozeti ilike '%veli%' or n.vitaller ? 'basCevresi');` Düzeltme kararı hekimin. | OPEN (Kaan) |

---

## GORUNTULEME-BRANS-SIRALI — görüntüleme modaliteleri branşa göre SIRALANIR, asla KISITLANMAZ (Kaan, 2026-09-18)

**Karar (Kaan + Claude tasarım görüşmesi, yeniden tartışılmaz).** Görüntüleme yükleme seçicisinde ne branşa özel kısa
liste ne de herkese aynı düz liste: hekimin **kendi branşındaki sık modaliteler üstte**, geri kalan **her** modalite
"Diğer görüntülemeler" başlığı altında, seçilebilir. Hiçbir modalite gizlenmez, yasaklanmaz — yalnız sıra değişir.

**Neden kısıtlama değil.** Branşa özel sıkı liste meşru bir yüklemeyi er geç engeller: katarakt öncesi EKG'si gelen göz
hekimi, hastanın elinde getirdiği dış merkez kardiyoloji / MR raporu. Hekim o zaman yanlış bir modaliteye yazar (ya da
"Diğer"e) ve veri kalitesi sessizce aranamaz bir kovaya düşer. Herkese aynı 14'lü düz liste ise göz hekimini her gün
mamografi / dermatoskopi çiplerinin yanından geçirir. Sıralama ikisini de çözer.

**Bu bir brans-alan-sizmasi kapısı DEĞİLDİR — "düzeltip" kapıya çevirmeyin.** O kural (baş çevresi KD formunda,
"veli" erişkin hastada) bir branşa özgü **içeriğin** başka branşın formuna sızmasını engeller. Görüntüleme modaliteleri
ise her hekimin dışarıdan meşru olarak alabileceği **ortak klinik sözlüktür**. Onları sıralamak UX'tir; branşa göre
gizlemek o kuralı yanlış yere uygulamak olur. Kodda da, testte de, burada da bu ayrım açıkça yazılı.

### Ne yapıldı

| Yer | Değişiklik |
|---|---|
| `lib/doktor/imagingModalities.ts` | `BRANS_GORUNTULEME_ONCELIGI` (kanonik branş anahtarı → sık kodlar), `bransGoruntulemeGruplari(brans)` → `{ oncelikli, digerleri }`, `bransGoruntulemeSirasi(brans)` → tam sıralı kod listesi. Eşlemesiz / bilinmeyen / boş branş → öncelikli grup boş, varsayılan `IMAGING_MODALITIES` sırası (hata yok, boş başlık çizilmez). |
| `app/dashboard/doktor/goruntuleme/page.tsx` (Görüntüleme → **Yükle**) | Hekimin branşı `/api/users/me` → `bransAnahtari` ile okunur. Eşleme varsa iki çip satırı: "Branşınızda sık kullanılanlar" + "Diğer görüntülemeler" (mevcut çip / küçük gri başlık stili, yeni UI kalıbı yok); yoksa eskisi gibi tek satır. `/api/users/me` başarısızsa varsayılan sıra. |
| Değişmeyen | Kanonik kodlar, `normalizeImagingModality`, `portalKind`, renkler, saklanan değer, varsayılan seçili çip (Röntgen), `?modalite=` derin bağlantıları (derm "Dermoskopi ekle" vb.), yükleme rotası. Mevcut kayıtlar ve Sağlığım portalı etkilenmez. |

Eşlemeler (UX tercihi, klinik eşik değil — ayarlanabilir): göz `oct, fundus, on_segment, us (B-scan)` · kardiyoloji
`ekg, eko, bt (koroner BT), xray` · kalp-damar cerrahisi `eko, bt, ekg, us, xray` · dermatoloji `dermatoskopi, derm, yara`
· plastik cerrahi `yara, derm` · KD `us, mamografi, mri` · dahiliye `xray, us, bt, ekg` · pediatri `xray, us, ekg` ·
ortopedi `xray, mri, bt, us` · FTR `xray, mri, us` · nöroloji `mri, bt` · beyin cerrahisi `mri, bt, xray` · göğüs hst.
`xray, bt, pet` · onkoloji `pet, bt, mri, us` · radyoloji `xray, bt, mri, us, mamografi, pet` · acil `xray, bt, us, ekg` ·
üroloji `us, bt, xray` · genel cerrahi `us, bt, xray`. Diğer branşlar (psikiyatri, KBB, endokrin, …) varsayılan sırada.

### Seçici yüzey envanteri (hangisi sıralama gerektirdi)

| Yüzey | Sonuç |
|---|---|
| `/dashboard/doktor/goruntuleme` Yükle paneli — `IMAGING_MODALITIES` çipleri | **Tek gerçek modalite seçicisi → sıralama bağlandı.** |
| Belgeler (`/dashboard/doktor/belgeler`) "Belge Türü" (Lab Sonucu / Görüntüleme Raporu / EKG / Röntgen / … / Diğer) | Modalite seçicisi değil, belge kasası kategorisi (şifreli kasa, `hasta_goruntulemeler`'e yazmaz). 8 öğe, dokunulmadı. |
| Hasta belgesi analizi (`hastalar/[id]/belgeler/[belgeId]`) motor seçimi | Ayrı sözlük (`core/belgeler/ontoloji` `MODALITE_TR`: cxr, ses_kalp, serbest…) ve zaten `bransKurali` ile branşa göre; `IMAGING_MODALITIES` değil. Dokunulmadı. |
| Derm bölümü "Dermoskopi ekle" / "Klinik foto ekle" / yama takvimi | Bağlam zaten özgül: `goruntulemeCaptureHref(…, 'dermatoskopi' \| 'derm')` modaliteyi önceden seçerek aynı Yükle panelini açar. Tam liste eklenmedi — hekim panelde yine her çipi görür. |
| Göz bölümü kartları (`GozKartlar`) | Yalnız OCT/fundus/ön segment **okuma** / gösterim; seçici yok. Dokunulmadı. |
| Hasta dosyası "Görüntülemeyi aç ›" | Aynı Yükle paneline gider — sıralama orada. |
| Ayşe / asistan | Modalite sunan CTA bulunmadı (vision-tools yalnız `/api/doktor/goruntuleme` okur). |

### Serbest metin modalite var mı? (araştırılan bilinmeyen)

**Arayüzde yok.** Hekim yalnız sabit çiplerden seçer; `?modalite=` sorgu parametresi de `imagingModalityMeta` ile kanonik
etikete çevrilir. Serbest metin yalnız API katmanında mümkün: `/api/doktor/goruntuleme/yukle` her dizgiyi
`normalizeImagingModality` ile kanonik koda çevirir, tanınmayan → `diger`. Ayrıca **"Diğer" çipi bugün de gösterilmiyor**
(696c0d3'ten beri `code !== 'diger'` süzgeci — bu iş korudu, değiştirmedi). Yani "engellenen yükleme" riski serbest
metinle azalmıyor: listede olmayan bir tetkik (EEG) ya en yakın çipe yazılıyor ya da Belge Kasası'na "Diğer" + not ile
gidiyor. Kısmi hafifletme: "Başlık / vücut bölgesi" alanı serbest metin (ör. "EEG"), ama modalite kodunu değiştirmez.
Tam liste her branşta açık olduğu için bu iş riski artırmıyor.

### Kalıcı korkuluk

`lib/doktor/imagingModalities.test.ts` (`npm test` içinde, 18 test): 6 branşta sık kodlar önde; **30 branş + null / boş /
bilinmeyen için her kanonik kod listede tam bir kez** — hata mesajı "SIRALANIR, asla KISITLANMAZ/GİZLENMEZ — bu
brans-alan-sizmasi kapısı değildir" der; eşlemedeki her anahtar gerçek branş, her kod kanonik; yükleme rotası branşa
bakmaz; eşlemesiz branş → tam varsayılan sıra; göz hekimi EKG'yi "Diğer görüntülemeler"de görür, `EKG` → `ekg`
(portalKind `ekg`) — önceki gibi; `normalizeImagingModality` her etiket/kod için değişmedi.

`npx tsc --noEmit` temiz · `npm test` **914/914** yeşil. Mobil: çip satırları mevcut yatay kaydırmalı satır stilini aynen
kullanıyor, yalnız iki küçük başlık eklendi; canlı 390/360 px ekran görüntüsü alınmadı (sayfa oturum arkasında,
notya.ai bu ortamdan erişilemiyor, production'a sentetik hesap yazmak kural dışı) — ilk canlı kullanımda göz atılmalı.

### AÇIK

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-18 | **GORUNTULEME-EEG-EMG — EEG / EMG kanonik modalite değil** | Nöroloji intake'i soruyor (`lib/intake/bransSorulari.ts` `goruntulemeTestNoro`: "EEG Yapıldı", "EMG Yapıldı") ama `IMAGING_MODALITIES`'te kodları yok: API'ye EEG gelirse `diger`e düşer, arayüzde ise çipi yok (Diğer çipi de yok) — nöroloji hekimi EEG'yi yanlış çipe ya da Belge Kasası'na yazar. EEG/EMG görüntüleme değil **nörofizyoloji**; `hasta_goruntulemeler`'e mi girer, ayrı "tetkik" türü mü olur, portalda nerede görünür — ürün kararı. Kod uydurulmadı. | OPEN (Kaan) |
| 2026-09-18 | **"Diğer" çipi Yükle panelinde yok** | 696c0d3'ten beri bilinçli süzgeç; bu iş korudu. Sonuç: listede olmayan tetkik yanlış modaliteyle saklanabilir (varsayılan seçili çip "Röntgen"). **Öneri:** "Diğer görüntülemeler" satırının sonuna "Diğer" çipi + zorunlu başlık; ya da EEG/EMG kararıyla birlikte ele alınsın. | OPEN (Kaan) |
| 2026-09-18 | **DERM-EXCEPTIONAL-01 A — uzman doğrulaması ve klinik eşik teyidi** | Dermatoloji bölüm derinliği Strong'a çıkarıldı (PASI/EASI bölge çalışma sayfası, SCORAD/DLQI/UAS7/SALT/IGA, fototerapi v2 + MED, yama ICDRG + Avrupa baz serisi, biyolojik SUT taslağı, acil bandı, PSOKİD / TDD AD basamak kartları, vücut haritası, Form 014 taslağı, kozmetik lot). `olgunluk` bilinçli olarak `beta-hazir` — **uzman-dogrulandi değil**. Teyit bekleyenler: (1) EASI / SCORAD / SALT bant kesim noktaları ve PASI "onluk kuralı" eşikleri hekimle kilitlenmeli; (2) biyolojik SUT rapor süresi / rapor tipi ve ilgili SUT madde numarası hekim-idare teyidiyle (taslakta bilinçli olarak yazılmıyor); (3) Avrupa baz serisi alerjen listesi ünite hazır bandıyla karşılaştırılmalı (konsantrasyon / vehikül yazılmadı — test maddesi kararı hekimin); (4) fototerapi doz adımı ve MED birimleri ünite protokolüne göre hekim onayı. **Öneri:** beta hekimle tek oturumda bu 4 başlık gözden geçirilsin, sonra `olgunluk: 'uzman-dogrulandi'`. | OPEN (Kaan + beta hekim) |
| 2026-09-18 | **DERM-EXCEPTIONAL-01 A — 054 migration Supabase'e uygulandı** | `lib/db/migrations/054_derm_exceptional.sql` applied live 2026-09-18 via `node scripts/run-sql-migration.mjs 054_derm_exceptional.sql` (success). Additive only: skor `ek` jsonb + SCORAD/IGA/BSA, fototerapi v2, `derm_med_kayitlari`, yama ICDRG, kozmetik lot, `hasta_derm` acil/basamak, `derm_biyolojik_raporlar`, `derm_dermoskopi_skorlari`, Belge dual-sign vision cols; RLS doktor-kendi + 052 restrictive. | SHIPPED |

## KD-ARACLAR-01 — beş kadın-doğum-only Doktor Aracı (Kaan, 2026-09-18)

**Sınıf (specialty-doktor-araclari):** beşi de **branşa özgü** → `BRANS_DOKTOR_ARACLARI`, `branslar: ['kadin-hastaliklari-dogum']`.
Kanonik anahtar resolver'dan okundu: `portalBransAnahtari` (`lib/portal/moduller.ts`) `kadın|kadin|jinek|obstet` →
`'kadin-hastaliklari-dogum'`; eski `'kadin-dogum'` ve serbest metin "Kadın Hastalıkları ve Doğum" aynı anahtara çözülür (testte).
**Görmemesi gerekenler:** pediatri, dahiliye, kardiyoloji, göz, dermatoloji ve `BRANS_ETIKETLERI`'ndeki diğer 29 anahtar —
`lib/doktor/doktorAraclari.test.ts` 30/30 döngüyle liste + derin bağlantı (`doktorAraciBransaUygun`) iki yönden kilitler.
Kabuk `specialties/kadin-dogum/ui/araclar/KdAracKabugu.tsx` (GozAracKabugu kalıbı: oturum + branş kapısı + `/doktor-tools`'a
yönlendirme, tr-TR hasta arama, 44 px). Landing yalnız kart; stüdyo gömülmez.

### Ne SHIPPED

| Araç | Rota | Motor (yeniden kullanılan) |
|---|---|---|
| Gebelik takvimi & tarama pencereleri | `/doktor-tools/kd-gebelik-takvim` | `sat-edd` (Naegele, Robinson CRL), `test-windows` (tek pencere kaynağı), `izlem-calendar` (DÖBYR 4 izlem + ACOG kadansı, `evaluateCadence` çift sütun), `dogum-spine` `kacirilinca` alternatifi, `clinic-fit.doneWindowIdsFromClinic` (hasta seçilince). "Kapanmak üzere — geri alınamaz" bandı yalnız ikili / üçlü-dörtlü / detaylı USG için; OGTT / anti-D / GBS / NIPT ikincil "Bu hafta kapanıyor". NIPT pencere sonu "kaçırıldı" değil "pencere geçti". |
| Doğum & analık rapor asistanı | `/doktor-tools/kd-dogum-rapor` | `engines/araclar.analikIzni` — tekil 8+16 hf (168 g), çoğul 10+16 hf (182 g); erken doğumda kullanılamayan günler doğum sonrasına; geç doğumda öncesi uzar, sonrası kısalmaz; hekim onayıyla doğuma 2 hf kalana dek çalışma → çalışılan gün doğum sonrasına. İstirahat raporu taslağı (hekim kilitler), "rapor almadan istirahat → ödenek ÖDENMEZ" hasta notu, emzirme ödeneği bilgi notu. Medula / e-imza canlı gönderim YOK ("Medula'da hekim e-imza ile girilir"). |
| Kontrasepsiyon MEC danışmanı | `/doktor-tools/kd-mec` | `kontrasepsiyon-mec` aynen (`yontemMec`, `acilKontrasepsiyon`, `postpartumKontrasepsiyonBaslangic`) — kopyalanmadı. Acil seçeneklerin motor `ad` alanı doz içerdiği için UI katalog adını gösterir (testle kilitli: UI'da doz yok). |
| Obstetrik risk & sezaryen endikasyon notu | `/doktor-tools/kd-risk` | Preeklampsi risk → aspirin başlama penceresi (12+0–28+0, ideal < 16+0; doz yazılmaz), GDM riski, SSVD tartışma alanları, Robson (WHO) grubu, `dogum-spine.CS_ENDIKASYONLARI`'ndan **hekimin seçip kilitlediği** endikasyon notu (hiçbir endikasyon önceden seçili değil; bulgu + zaman + alternatif konuşuldu olmadan kilit açılmaz). |
| KD kohort paneli | `/doktor-tools/kd-kohort` + `GET/POST /api/doktor/gebelik/kohort` | `engines/kd-kohort` — lohusa 1. hf (DSBYR 1. izlem 2–5. gün) ve 6. hf (3. izlem 30–40. gün) en üstte, turuncu, ayrı blok; kapanan tarama penceresi, geciken DÖBYR izlemi (geç başvuru kuralıyla), OGTT / anti-D / GBS zamanı, smear/HPV (`jinekoloji-spine.dueHesapla`). 1-tap hatırlatma: Sağlığım mesajı + e-posta bildirimi (7 gün tekrar yok), satırda dosyayı aç (Gebelik) + kişisel WhatsApp. Mesaj hasta-güvenli (tanı/değer/ilaç/hafta yok, 112 yönlendirmesi). |

**Hasta izolasyonu:** yeni rota `lib/security/hastaIzolasyonEnvanteri.ts`'te `T`, yardımcı `_kohort.ts` `I(...)`; `hasta-izolasyon.test.ts`'e GET + POST vakaları (pozitif + A→B + B→A, sahneye sentetik lohusa gebeliği eklendi). Her sorgu `doctor_id` kapsamlı; POST kimlikleri önce `kdKohortVerisi(doctorId)` süzgecinden geçer. Diğer dört araç yeni uç açmaz: hasta seçilince mevcut `GET /api/doktor/gebelik` (hastaSahibiMi) okunur. Hiçbir araç nota / dosyaya yazmaz. Migration yok.

**Doğrulama:** `npx tsc --noEmit` temiz · `npm test` **1159/1159** (main üzerinde, derm + pediatri dahil; KD eklemesi +25 test). Yerel geçici harness (commit edilmedi) + headless tarayıcı ile 390 px'te beş araç tıklanarak denendi: yatay taşma yok, ikili kapanıyor bandı, erken doğum yeniden hesabı, MEC 4 (≥35 + sigara), aspirin penceresi, endikasyon kilidi, kohort lohusa bloğu (sentetik satırlar). Bu turda eklenen düzeltmeler: tüm girdilere görünür etiket, segment düğmeleri 44 px, hasta listesi hatasında "Liste yüklenemedi".

### Kaynaklar (bu oturumda gerçekten açılanlar)

- **Analık süreleri — brief'ten farklı, güncel hukuk uygulandı.** Brief "doğum sonrası 8 hafta, toplam 112 / 126 gün" diyordu; bu, 01.05.2026 öncesi hukuk. **7578 sayılı Kanun** (RG 01.05.2026, sayı 33240, aynı gün yürürlük) 4857 s.K. md. 74 ve 5510 s.K. md. 18'i değiştirdi: doğum sonrası **16 hafta**, toplam tekil **24 hafta (168 gün)**, çoğul **26 hafta (182 gün)**; hekim onayıyla çalışma "doğuma 3 hafta" → **2 hafta** kalana kadar. **SGK Genelgesi 2026/13** ödeneği "doğumdan önceki 8 ve sonraki 16 haftalık sürede, hekimin vereceği istirahata bağlı olarak" öder; 01.05.2026'da devam eden raporlar başvurusuz 8 hafta uzatıldı. (alomaliye.com Genelge 2026/13 metni; Nazalı duyurusu; SGK "Analık Hali" sayfası.)
- **"Rapor almadan istirahat → ödenmez":** SGK "Analık Halinde Geçici İş Göremezlik Ödeneği Ödenmesi" — "Gebelik istirahatinin başladığına dair rapor almaksızın istirahate ayrılan sigortalıya doğumun gerçekleştiği tarihe kadar olan süreye ait geçici iş göremezlik ödeneği ödenmeyecektir"; hekimden izin olmadan çalışılan dönem de ödenmez; doğum tahmini tarihten farklıysa sistem süreleri yeniden hesaplar. (Sayfa 2022 tarihli — 112 gün ifadesi eski; kural cümlesi için kullanıldı.)
- **Emzirme / prim şartları:** SGK "Analık Hali" — emzirme ödeneği için doğumdan önceki 1 yılda ≥ 120 gün, analık GİÖ için ≥ 90 gün kısa vadeli prim. Tutar gösterilmez (yıllık belirlenir).
- **DÖBYR izlem asgarisi:** en az 4 izlem, ilki 14. haftaya kadar — repo `izlem-calendar.SB_IZLEM_WINDOWS` (≤14, 18–24, 28–32, 36–38; DÖBYR 2026 HSGM Yayın No. 1402) + SB e-kütüphane DÖBYR özeti ile teyit.
- **Aspirin:** SMFM 2021 güncel kontrol listesi (PMC13344198; ACOG/SMFM Practice Advisory ile teyitli) — 6 yüksek + 8 orta risk (ırk faktörü TR bağlamında listelenmedi; "düşük gelir / sosyal dezavantaj" tek başına "düşünülebilir"), ≥ 1 yüksek veya > 1 orta → önerilir, 12–28 hf, ideal 16 hf öncesi. ACOG CO 743 sayfası 402 döndü (paywall); numarası yazılmadı.
- Diğer tüm pencere / numara (SUT P.901.120 / P.904.090, ACOG PB 190 / 205 / CO 797 / CC 8) repo'da zaten doğrulanmış kaynaklardan (`test-windows`, `acog-map`, `dogrulanmis-kaynaklar`).

### Öneri — hekim kilitler (preset; kaynakla doğrulanmış eşik değil)

| Preset | Değer | Neden preset |
|---|---|---|
| "Kapanmak üzere" / "yaklaşıyor" eşiği | kapanışa ≤ 7 gün / açılışa ≤ 14 gün | Planlama UX eşiği, klinik aralık değil. |
| GDM risk listesi (6 faktör) + "erken glukoz değerlendirmesi tartışılır" | — | Bu oturumda TR / ACOG metni açılamadı; 24–28 hf OGTT (DÖBYR) herkes için ayrıca gösteriliyor. |
| Aspirin "yasal asgari" sütunu | "Doğrulanmış Türk rehberi eşiği bu araçta yok" | SB/TJOD aspirin eşiği bulunup doğrulanamadı; klinik sütun SMFM/ACOG. |
| SSVD tartışma notları | klasik/T kesi veya rüptür → "genellikle aday değil"; < 18 ay aralık → tartışılmalı; ≥ 2 sezaryen → ayrıntılı danışmanlık | Klinik derinlik ACOG PB 205 (repo'da doğrulanmış numara); Türk rehberi yok; karar değil tartışma notu. |
| Lohusa kabul pencereleri (kohort) | 1. hf: 2–7. gün kaydı; 6. hf: 30–49. gün kaydı; liste 90 gün | DSBYR pencereleri (2–5, 30–40) + kayıt gecikmesine tolerans. |
| Robson grubu | WHO 10 grup, alanlardan türetilir | "hekim doğrular" etiketi; sezaryen notuna yalnız hekim kilitleyince girer. |

### AÇIK

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-18 | **Analık — brief'teki 112/126 gün eski hukuk** | 7578 s.K. sonrası 168/182 gün uygulandı (yukarıda). Brief'i yazan tarafa bildirilmeli; pazarlama / eğitim metinlerinde 112 gün geçiyorsa güncellenmeli. | OPEN (Kaan — bilgi) |
| 2026-09-18 | **Geç doğumda SGK ödemesi** | Araç doğum öncesi istirahati gerçek doğuma kadar uzatır, doğum sonrasını 16 hf tam bırakır (SGK "sistem yeniden hesaplar"). Tahmini tarihten sonraki günler için ek rapor gerekip gerekmediği Genelge 2026/13 tam metninde doğrulanmadı. | OPEN (SGK metni) |
| 2026-09-18 | **Hekim onayıyla çalışma (2 hafta) — SGK ödeme mekaniği** | Genelge 5510 md. 18'den "doğuma 3 hafta kalıncaya kadar çalışma" ibaresinin çıkarıldığını söylüyor; İş K. 74 yeni hali "2 haftaya kadar". Araç İş K. 74'e göre çalışılan günü doğum sonrasına ekler — SGK tarafının aynı hesabı yaptığı teyit edilmeli. Varsayılan 0 gün, gelişmiş ayarda. | OPEN (SGK metni) |
| 2026-09-18 | **657 s.K. memurlar** | Araç 4/a–4/b (5510 / 4857) kurallarını modeller; memur analık izni ayrı rejim. Arayüzde memur seçeneği yok. | OPEN (ürün kararı) |
| 2026-09-18 | **Üçlü / dörtlü penceresi** | Brief "16–18 hf" diyor; motor `TEST_WINDOWS.triple_quad_afp` 16+0–20+0 (SUT P.904.090 ile birlikte repo kaynağı). Araç tek kaynak olarak motoru kullanır; "ideal 16–18" alt penceresi istenirse kaynağıyla `test-windows`'a eklenmeli. | OPEN (klinik teyit) |
| 2026-09-18 | **GBS penceresi** | Brief "36–37 hf"; motor SB sütunu 35–37 (DÖBYR), ACOG CO 797 ~36–37 — araç ikisini çift sütunda gösterir, kohort 35+0'da açar. | OPEN (klinik teyit) |
| 2026-09-18 | **Kohort hatırlatması sonrası dönüş görevi yok** | Göz kohortu `goz_gorevler`'e "hatırlatma_takip" açar; KD'de gebelik dışı (serviks) hastalar için `gebelik_id`'siz görev tablosu yok. Yeni tablo = migration; bu sprintte açılmadı. | OPEN (Kaan) |
| 2026-09-18 | **MEC motoru sadeleştirilmiş ofis seti** | `kontrasepsiyon-mec` 2 kategorisini hiç döndürmez (kısıt yoksa 1 → araç "MEC 1–2" yazar); aurasız migren, diyabet, SLE vb. girdisi yok. Araç bunu dipnotta söyler; motor genişletmesi ayrı iş (brief motoru yeniden yazmayı yasaklıyordu). | OPEN (klinik kapsam) |
| 2026-09-18 | **Paralel pediatri branch'i** | `doktorAraclari.ts` / test'e yalnız ekleme yapıldı (derm bloğunun altına 5 satır, dosya sonuna test bloğu; pediatri ve derm girişleri ve testleri aynen korundu, origin/main üzerine yeniden uygulandı). Mevcut tek satır değişti: `kd.length === ORTAK` → `ORTAK + KD_ROTALARI.length` (KD'nin sıfır aracı olduğunu iddia eden satır — sıkılaştırıldı, zayıflatılmadı). | Bilgi |

## PEDI-ARACLAR-02 — pediatri Araçlar'ın kalan üç aracı: aşı & telafi, gelişim/tarama paneli, kohort (Kaan, 2026-09-18)

**Sınıf (specialty-doktor-araclari):** üçü de **branşa özgü** → `BRANS_DOKTOR_ARACLARI`, `branslar: ['pediatri']` (tek anahtar).
**Görmemesi gerekenler:** dahiliye, kardiyoloji, göz, KD (kanonik + eski + serbest metin), dermatoloji, aile hekimliği, branşsız ve
`BRANS_ETIKETLERI`'ndeki diğer tüm anahtarlar — `lib/doktor/doktorAraclari.test.ts` 30/30 döngüyle liste + derin bağlantı
(`doktorAraciBransaUygun`) kilitli; pediatri beş stüdyonun beşini de görür. Kabuk: mevcut `PediAracKabugu` (yalnız ekleme:
`useUrlHasta`, `Rozet`, `OneriRozet`, `Istatistik`, `PediHastaOzet.dogumBilgisi`). Sunucu kapısı `pediOturum` (users.specialty → pediatri).

### Ne SHIPPED

| Araç | Rota | Bağlanan motor (kopya yok) |
|---|---|---|
| Aşı takvimi & telafi planlayıcı | `/doktor-tools/pedi-asi` | `engines/asiPlan.ts` → doz listesi `lib/asi/ulusalAsiTakvimi.ts`'ten (6'lı dönem) ve `lib/clinical/yenidogan` `ASI_V1`'den (önceki 5'li + Hep B 0-1-6) türetilir. Doğum tarihi **ya da "14 aylık"** yeter; yapıldı / bugün yapılabilir / zamanı geldi / gecikti / planlı; telafi: seri **baştan başlamaz**, kalan dozlar min. yaş + min. aralık + 1. dozdan aralıkla zincir halinde bugünden ileri; GBP: min. aralıktan önce yapılan doz **geçersiz → yalnız o doz tekrarlanır** (hekim kapatabilir); canlı enjeksiyon aşıları aynı gün / ≥ 4 hf, BCG KKK'dan 4 hf sonra; ≥ 72 ay DaBT-İPA-Hib yok (Td şeması); aşısız ≥ 6 yaş BCG yok, > 3 ay BCG PPD ile; hiç aşısız 12–71 ay / ≥ 72 ay için genelge tablosu kartı. Prematüre: takvim yaşı; < 2000 g Hep B (TND 2026), < 34 hf BCG, ≤ 32 hf / ≤ 1500 g ROP notu. Hasta seçilince `/api/doktor/asilar` okunur; hekim dozu işaretler (burada / beyan, tarih düzeltilebilir), "aşı kartından hızlı giriş" (seçilen döneme kadar beyan), tek dokunuşla `POST /api/doktor/asilar` (isteğe bağlı sonraki doz tarihi → mevcut aşı hatırlatma cron'u). Özel/ücretli aşılar (`OZEL_ASILAR`) ayrı grup. Min. yaş/aralık ön ayarları hekim-düzenlenebilir (tarayıcıda). |
| Gelişim & tarama paneli ("bu vizitte hangi tarama?") | `/doktor-tools/pedi-gelisim` + `GET/POST /api/doktor/pediatri/tarama` | `engines/gelisimPlan.ts` → SB İzlem Protokolü vizit takvimi; işitme (ABR, ≤ 30. gün), işitme risk faktörü, kırmızı refle (0–10 yaş), görme (36–48 ay Lea, 6 yaş), ROP, **GİDR** (`lib/clinical/gelisimTaramasi` — 6–9 ay / 18. ay / 24–36 ay, prematürede düzeltilmiş yaş), **otizm** (SB: 18 ay, 24 ay, 3 yaş — araç **M-CHAT-R/F**, `HastaMchat` bileşeni olduğu gibi takılır; 30 ay üstünde klinik değerlendirme), D vitamini, demir, 9. ay Hb. GİDR için `HastaGelisimTaramasi` olduğu gibi takılır. Diğer taramalar işaretlenir; "Bugünkü Muayene Formuna Ekle" **aynı yol** `lib/doktor/gununNotunaEkle` (+ `MuayeneFormunaDon`). Nota yalnız hekim basınca tek satır. |
| Pediatri kohort paneli | `/doktor-tools/pedi-kohort` + `GET/POST /api/doktor/pediatri/kohort` | `engines/kohort.ts` → aşı (`asiPlani`, yalnız kaydı tutulan seriler), kaçan izlem (`vizitPlani` + seanslar + KD bebek görevleri), persentil kayması (`buyume.persentilKaymalari`, Neyzi, onaylı not vitalleri), D vit / demir (hasta_ilaclar + panel + bebek görevi; "süresi doldu"), işitme · görme · otizm gecikmesi. 1-tap veli hatırlatması (Sağlığım mesajı + e-posta bildirimi, 7 gün tekrar yok; tanı/ölçüm/ilaç yok, 112), mesaj önizleme, satırda dosyayı aç (ilgili sekme), **aşı planı / gelişim paneli derin bağlantısı (`?hasta=`)**, kişisel WhatsApp. |

**Veritabanı:** `lib/db/migrations/055_pedi_taramalar.sql` — yalnız ekleme (yeni `pedi_taramalar`, RLS + doktor politikası + 052 ile aynı RESTRICTIVE hasta sahipliği). **Supabase'e uygulandı ve doğrulandı** (relrowsecurity = true, iki politika, schema_migrations 055). Tablo yoksa panel çalışmaya devam eder ve bunu söyler.

**Hasta izolasyonu:** yeni rotalar envanterde `T` (tarama, kohort), `_kohort.ts` `I(...)`; `hasta-izolasyon.test.ts`'e 4 vaka (tarama GET/POST — POST nota ekleme yolunu da pozitifte sınar; kohort GET/POST; pozitif + A→B + B→A). Sahnede her sentetik hekimin hastasına bir KKK kaydı eklendi (kohort pozitif kontrolü). Her sorgu `doctor_id`/`doktor_id` kapsamlı; POST kimlikleri önce `pediHasta` / `pediKohortVerisi(doktorId)` süzgecinden geçer.

**Doğrulama:** `npx tsc --noEmit` temiz · `npm test` yeşil (pediatri motor + SSR + katalog + izolasyon). Yerel geçici harness (commit edilmedi, sentetik veri) + headless tarayıcı ile **390 px ve 1280 px**'te üç araç tıklanarak denendi: yatay taşma yok (scrollWidth = 390), doz işaretleme → liste anında yeniden hesap, kaydet çubuğu, tarama işaretle → nota ekle, kohort filtre/önizleme. Bu turda bulunan ve düzeltilen: `position: sticky` kabuğun `overflow-x: hidden`'ı yüzünden çalışmıyordu → sabit alt çubuk; "18 aylık" 17 ay görünüyordu → yaş takvim ayıyla geri hesaplanıyor; 20 aylıkta GİDR başlığı yanlış pencereyi adlandırıyordu → kaçan pencere adıyla; > 6 ay işitme kaydı yokluğu "gecikti" değil "teyit et".
Ayrıca main'deki kırmızı `tsc`: `lib/portal/takibim.test.ts` test girdisinde tipte olmayan `nav: []` kaldırıldı (assertion aynı).

### Kaynaklar (bu oturumda açılanlar — resmi siteler doğrudan açılmadı, Wayback kopyaları okundu)

- **Aşı takvimi:** SB asi.saglik.gov.tr "Aşı takvimindeki son güncellemeler" (6'lı karma 2/4/6 + 18. ay rapel; 1. ay Hep B kaldırıldı); HSGM 2020 aşı takvimi PDF + "Aşılama takviminde değişiklik" (KKK 2. doz ve DaBT-İPA **48. ay**, Td **13 yaş** — aile hekimliğinde). Bunlara göre `lib/asi/ulusalAsiTakvimi.ts` düzeltildi: "İlkokul 1. sınıf (78 ay)" → **48. ay**; "İlkokul 8. sınıf" → **13 yaş**; "Anne HBsAg(+) ise 1. ayda ek doz" notu **yanlıştı** (TND 2026: ≥ 2000 g'da ek doz yok, doğumda aşı + HBIG). Hasta dosyası Aşılar sekmesi aynı dosyayı okuduğu için orası da düzeldi.
- **Telafi kuralları:** SB **GBP Genelgesi 2009/17** (dosyamerkez.saglik.gov.tr .doc): baştan başlamaz; kısa aralıklı doz geçersiz; DaBT-İPA-Hib 4 hf / 4 hf / 3. dozdan ≥ 6 ay; Hep B 4 hf, 8 hf, 1. dozdan ≥ 16 hf; KPA < 12 ay 4 hf, rapel ≥ 4 ay sonra ve ≥ 12 ay; kızamık içeren aşılar 4 hf; canlı enjeksiyon aşıları aynı gün / 4 hf; BCG kızamık aşısından 4 hf sonra; DaBT-İPA-Hib 72 aydan sonra yok; BCG > 3 ay PPD ile, aşısız > 6 yaş gerekmez; hiç aşısız 12–71 ay ve ≥ 72 ay tabloları.
- **Prematüre:** **TND 2026** prematüre aşılama kitapçığı (neonatology.org.tr) — takvim yaşı, tam doz; < 2000 g Hep B şemaları; BCG < 34 hf kuralı.
- **İzlem / tarama / profilaksi:** **SB Bebek, Çocuk, Ergen İzlem Protokolleri 2018** (genelge 2019/12; WHO politika arşivindeki PDF) — vizit takvimi ve gün pencereleri (≤ 24 ay), kırmızı refle, görme (yenidoğan, 36–48 ay, ilkokul 1), sevk eşikleri (< 0,5 · ≤ 0,7 · 2 sıra), ROP (≤ 32 hf / ≤ 1500 g, 4. hf), GİDR (en az 3: 6–9 ay, 18. ay, 24–36 ay; ≤ 37 hf düzeltilmiş yaş), otizm (18 ay, 24 ay, 3 yaş), D vitamini 400 IU ilk günden 12. ay sonuna, demir 4. ay kontrol → 10 mg/gün 12. aya / preterm-< 2500 g 2 mg/kg/gün 2. aydan 5 ay, 9. ay Hb/Htc. **HSGM Yenidoğan İşitme Taraması güncel test protokolü** — tarama ABR ≤ 72 sa, 7–15. gün, 15–30. gün; 30. günden sonra tarama yok.
- İkincil (haber / dernek): 6'lı karma başlangıcı **14 Nisan 2025**; **suçiçeği 2. doz 48. ay, Eylül 2026** (49–72 ay telafi; resmi yazı no bulunamadı); **HPV** Bakan 2025 sonu dedi, program dışında (klimik, ekmud).

### Öneri — hekim kilitler (resmi metinde sayı bulunamadı; ekranda rozetli)

| Preset | Değer | Neden |
|---|---|---|
| Karma min. yaşlar | 1. doz 6 hf; rapel 12 ay; okul öncesi rapel 4 yaş; rapel → okul öncesi 182 g | Genelgede aralık var, min. yaş yok. |
| KPA 1. doz min. yaş + yaşa göre doz azaltma | 6 hf; 12–23 ay 2 doz, 24–59 ay tek doz, ≥ 5 yaş gerekmeyebilir | Genelge KPA'dan önce; ACIP mantığı, "öneri" notu. |
| OPA aralığı | 28 g | Genelgede OPA aralığı okunmadı. |
| Hep A 2. doz aralığı | 180 g | Resmi metinde bulunamadı. |
| Suçiçeği 2. doz aralığı + > 72 ay kapsamı | 90 g; 72 ay üstü "hekim kararı" | 2. doz ikincil kaynakla; aralık hiçbir kaynakta yok. |
| 6'lı geçiş kuşağı | kayıttaki ürün, yoksa doğum ≥ 14.02.2025 → 6'lı | Başlangıç tarihi ikincil; geçiş kuşağında karışık seri olabilir — segmentle değişir. |
| "Gecikti" eşiği / "yaklaşıyor" | önerilenden 30 gün sonra / 30 gün içinde | Ürün UX eşiği, klinik aralık değil. |
| 30 / 36 / 48 / 60 ay ve 6–21 yaş izlem pencereleri | ay başından 60 g; yaş gününden 90 g | Protokol vizit var der, gün penceresi yazmaz. |
| 6 yaş görme penceresi | 72–84 ay | Protokol "ilkokul 1. sınıf"; ay aralığı yok. |
| Özel aşı "yaşı uygun" rozetleri | rota 6 hf–8 ay, MenACWY ≥ 9 ay, MenB ≥ 2 ay, grip ≥ 6 ay, HPV ≥ 9 yaş | Ürüne göre değişir; yalnız konuşma ipucu. |
| Kohort gürültü kuralları | aşı: yalnız kaydı tutulan seri; izlem: daha önce muayene olmuş + son 180 g; işitme bayrağı 31–180. gün | Ürün kararı (ASM dozları / doğumhane taramaları kayıtta olmayabilir). |

### AÇIK

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-18 | **Denver** | Brief "Denver" istedi; NOTYA-GELISIM-01 (Kaan 2026-09-14) "Denver II adı geçmeyecek" (telifli, madde/norm yok). Panelde GİDR + M-CHAT-R/F kullanıldı; GİDR'de gecikme işaretliyse "standart gelişim değerlendirmesine yönlendirme" satırı çıkar, test adı verilmez. İki talimat çelişiyor — Kaan karar verir. | OPEN (Kaan) |
| 2026-09-18 | **SB 5 soruluk otizm formu** | Protokolün kendi formu (isme yanıt, göz teması, işaret takibi, tekrarlayıcı davranış, konuşma gecikmesi) — madde metni birebir okunmadığı için eklenmedi. 18/24 ayda M-CHAT-R/F, 3 yaşta "klinik değerlendirme → işaretle". | OPEN (metin doğrulama) |
| 2026-09-18 | **`lib/clinical/yenidogan/constants.ts` ile çelişkiler (KD/yenidoğan alanı, bu sprintte dokunulmadı)** | `KAYNAK.dvit` / `TABURCU_ETIKET.dvit` "1. hafta → 2 yaş" — SB 2018: **ilk günden 12. ay sonuna**. `SB_BEBEK_IZLEM` pencereleri protokolden dar (15. gün 15–15 ↔ 11–29; 41. gün 41–41 ↔ 30–59; 2. ay 55–70 ↔ 60–89; 4. ay 110–130 ↔ 120–150 …). `ASI_V1` önceki takvim (HEPB2 30. gün) — bebek görevleri 6'lı dönem bebeklere eski dozu yazıyor olabilir. Pediatri aracı kendi doğrulanmış tablosunu kullanır; yenidoğan paketi KD sahibinin onayıyla hizalanmalı. | OPEN (KD + pediatri) |
| 2026-09-18 | **GİDR kayıt ekranı takvim yaşı kullanır** | `HastaGelisimTaramasi` / `/api/doktor/gelisim-taramasi` basamağı takvim yaşından seçer; protokol ≤ 37 hf için düzeltilmiş yaş der. Panel düzeltilmiş yaşı gösterir ve uyarır; bileşen değiştirilmedi (hasta dosyası ortak bileşeni). | OPEN |
| 2026-09-18 | **Bebek kartı `yenidogan_tarama.isitme` biçimi** | Kohort/panel `true` / `'gec'` → geçti, `'kaldi'` → ileri değerlendirme okur; başka biçim yazılıyorsa kayıt görünmez (bayrak çıkabilir). KD taburcu paketinin yazdığı gerçek değer canlı veride teyit edilmeli. | OPEN |
| 2026-09-18 | **Kohort hatırlatması sonrası dönüş görevi yok** | KD kohortuyla aynı durum: pediatri için genel görev tablosu yok (bebek_gorevleri `kind` kısıtlı). | OPEN (Kaan) |
| 2026-09-18 | **Sonraki doz tarihi → mevcut WhatsApp cron'u** | Aşı planlayıcı "sonraki doz tarihini de yaz" işaretliyse `asilar.sonraki_doz_tarihi` dolar; mevcut `/api/cron/asi-hatirlatma` 7 gün kala aileye WhatsApp atar (Aşılar sekmesindeki davranışın aynısı, kutu görünür ve kapatılabilir). **2026-09-19: cron kaldırıldı — hatırlatma artık hekim onaylı (ASI-KARNESI-01 D).** | Bilgi |
| 2026-09-18 | **Özel aşı dozu planlayıcıdan kaydedilmez** | Ürüne göre doz/şema değiştiği için özel aşılar yalnız bilgi + kayıt gösterir; ekleme hasta dosyası › Aşılar sekmesinden. | OPEN (ürün kararı) |

## KONSULTASYON-01 — kapalı döngü konsültasyon (yönlendirme) sistemi (Kaan, 2026-09-19)

Kaan (CEO), kelimesi kelimesine: *"İşitme sorunu olabileceğini düşündüm, hastayı KBB'ye yönlendirdim. KBB raporuna göre
işitme problemi olmadığını tespit ettim ve devam ettim. Show proof — evet, KBB'den gelen rapor burada, şu tarihli, şu
hocadan."* Amaç yalnız "gönderdim" demek değil: **uzmanın raporunu geri alıp kendi dosyasına kanıt olarak eklemek.**
Portal sorusuna EVET: yönlendirme ve sonucu hastanın Sağlığım portalinde görünür.

**Sınıf:** evrensel (baseline spine, ~30 branşın hepsi). Branş klasörüne gömülmedi; branşlar yalnız önerilen hedef
listesine **sıra** katkısı yapar (`SpecialtyProfile.konsultasyonHedefleri`: pediatri → KBB, göz, çocuk cerrahisi;
dahiliye → bölümün zaten yazdığı sevk hedefleri). Doktor Araçları'na yeni araç AÇILMADI.

### Araştırma bulguları — tasarımı bunlar belirledi (Claude, 2026-09-19, gerçek kaynaklardan)

| # | Bulgu | Tasarıma etkisi |
|---|---|---|
| 1 | **"Sevk" yanlış kelime — kozmetik değil.** Türk sağlık sisteminde sevk SGK'nın düzenleyici aracıdır: SUT eki **EK-2/F "Hasta Sevk Formu"** ya da e-imzalı **e-sevk**; **5 işgünü** geçerlilik; hasta sevk edildiği **branşa** başvurmazsa sevk geçersiz; esas amacı sevk zinciri ve yol/gündelik/refakatçi giderlerinin SGK'ca karşılanması; ağırlıkla yerleşim yeri dışına, kurumlar arası nakil. Muayenehane hekiminin meslektaşından klinik görüş istemesi **bu değildir**. Ürünü "Sevk" diye etiketlemek olmadığı bir SGK belgesi görüntüsü verir (Notya'nın başka yerlerde reddettiği sahte resmiyet). | UI'de birincil terim **"Konsültasyon"**, eş anlamlı "yönlendirme". "Sevk" yalnız gerçek SGK sevkinden söz ederken. Yazdırılabilir form başlığı "KONSÜLTASYON İSTEM FORMU" ve altında: *bu belge SGK sevk belgesi (SUT EK-2/F / e-sevk) değildir; kurumlar arası SGK sevki gerekiyorsa MEDULA üzerinden düzenlenir.* Tablo adı `sevkler` VERİ olarak kaldı (dahiliye/göz/KD yazıyor) — yorumlarla açıklandı. |
| 2 | **TTB ve SKS bu iş akışını zaten tanımlıyor.** Müdavi hekim YAZILI istem yapar; istemde hastanın özellikleri ve konsültasyonun NEDENİ "çok açık ve anlaşılır", KISALTMASIZ; konsültan hekim hasta ile ilişkisi süresince en az müdavi hekim kadar sorumludur; konsültasyon görüşü RESMİ OLARAK HASTA DOSYASINA yazılır. İstem formunda: hastanın tanımlayıcı bilgileri, muhtemel/kesin tanılar, mevcut hali, istenme NEDENİ, istenme TARİHİ, aciliyet. SKS: istem-yanıt süreleri branş/hekim bazlı analiz edilir (kalite göstergesi). | Kaan'ın akışı Türkiye'nin resmi standardı — icat edilmedi, uygulandı. `klinik_soru` zorunlu (≥ 10 karakter), olası kısaltmalar işaretlenir (engellenmez — `olasiKisaltmalar`), `aciliyet` rutin/öncelikli/acil, `istem_tarihi`; form alanları `tanilar` + `mevcut_durum` (spec'e EK iki nullable kolon — TTB form içeriği için). Yanıt süresi: "N gündür bekliyor" + kohort satırı. |
| 3 | **KVKK bizim lehimize — açık rıza modalı gerekmiyor.** KVKK m.6/3: sağlık verileri "kamu sağlığının korunması, koruyucu hekimlik, tıbbi teşhis, tedavi ve bakım hizmetlerinin yürütülmesi" amacıyla **sır saklama yükümlülüğü** altındaki kişilerce **açık rıza aranmaksızın** işlenebilir. Tedavi amacıyla konsültasyon istemek ve dönen raporu hastanın dosyasına işlemek bu istisnanın tam içinde. m.10 **aydınlatma** yükümlülüğü devam eder. | Açık rıza modalı EKLENMEDİ. Aydınlatma: Sağlığım'da "KBB'ye yönlendirildiniz (tarih) · Sonuç alındı (tarih)" — hastanın verisinin kimle/ne amaçla paylaşıldığını bildirir; klinik içerik göstermez. |

### Ne yapıldı — PR 1: veri + API

| Parça | Ayrıntı |
|---|---|
| Migration `058_konsultasyon.sql` | **Yalnız ekleme**, yeni tablo YOK: `sevkler`'e nullable `klinik_soru, hedef_brans, hedef_hekim, aciliyet, istem_tarihi, yanit_tarihi, yanit_ozeti, belge_id → medical_documents, note_id → notes` + (spec'e ek) `tanilar, mevcut_durum, son_hatirlatma_at`; `aciliyet` CHECK; iki dizin. `durum`'a CHECK eklenmedi — eski `acik` / `kapandi` geçerli; mevcut satırlar UPDATE edilmedi. RLS: 052'nin satır düzeyi politikası (doctor_id + RESTRICTIVE hasta sahipliği) yeni kolonlara aynen uygulanır. |
| Migration canlıda | 2026-09-19 `node scripts/run-sql-migration.mjs 058_konsultasyon.sql` → **uygulandı ve doğrulandı**: `relrowsecurity = true`; politikalar `hasta_izolasyon_kendi_satiri` (PERMISSIVE) + `hasta_izolasyon_hasta_sahipligi` (RESTRICTIVE), satır düzeyi → yeni kolonlar kapsanır; 12 yeni kolon + `sevkler_aciliyet_check`, `sevkler_belge_id_fkey`, `sevkler_note_id_fkey`. Mevcut satırlar değişmedi (4 `acik`, 1 `kapandi`). Migration uygulanmadan önce de rota çökmez: GET `tabloHazir: false`, POST Türkçe 500. |
| Durum anlamı (`lib/doktor/konsultasyon.ts`) | Yeni istem **`yanit_bekleniyor`** ile açılır. Eski `acik` = yanıt bekleniyor, eski `kapandi` = yanıtsız kapandı (okumada eşdeğer, yazmada dokunulmaz). `yanitlandi` yalnız hekimin kendi özet cümlesiyle. Geçişler: yanıtlanmış kayıt yanıtsız kapatılamaz; kapanmış kayda geç gelen rapor eklenebilir; yanıtsız kayıt nota eklenemez; hatırlatma yalnız bekleyen kayıtta, 7 günde bir. |
| Rota `app/api/doktor/konsultasyon/route.ts` (evrensel) | GET `?patientId` (çizelge + bağlı Kasa raporu + Tier A belge taslağı durumu + hedef seçenekleri) · GET `?bekleyen=1` (hekimin yanıt bekleyenleri, tüm hastalar) · GET `?form=<id>` (istem formu: antet + hasta tanımlayıcıları + 18 yaş altı veli satırı, `veliDiliMi`) · POST istem · PATCH `yanit` / `belge_bagla` / `kapat` / `nota_ekle` / `hatirlat`. Paylaşılan no-store istemci (`doktorOturum`). |
| Hasta izolasyonu | patientId → `hastaSahibiMi` önce (404); konsültasyon id → `id` + `doctor_id` aynı sorguda **ve** satırın hastası yeniden doğrulanır; belgeId → `medical_documents` `id` + `doctor_id` + **aynı hasta** + silinmemiş; bekleyen listesinde hasta adı yalnız `doctor_id` kapsamlı `patients`'tan çözülür (başka hekimin hastasına düşmüş kirli satır listeden düşer). `hasta-izolasyon.test.ts`'e 9 vaka (pozitif + A→B + B→A), sahneye Kasa raporu + iki konsültasyon + hileli konsültasyon satırı; envanterde `T`. **Mutasyonla doğrulandı:** satır ve belge sahiplik filtreleri kaldırılınca 6 kimlik vakasından 5'i iki yönde kırmızı; 6.'sı (form) ikinci hat (hasta okuması `doctor_id`) sayesinde yine sızdırmadı. |
| Kapanış döngüsü (mevcut sistemler bağlandı) | Kasa (`medical_documents`) → rapor `belge_id`'ye bağlanır → varsa `belge_analizleri` Tier A taslağı "TASLAK" olarak gösterilir (hekim onayı ayrı, mevcut akış) → hekimin kendi cümlesi → `yanitlandi` → hekim basınca `lib/doktor/gununNotunaEkle` (Değerlendirme alanına düz metin blok, T.C. kimlik benzeri dizi maskeli) → `note_id` kaydı. Otomatik nota yazma yok. |
| "Hatırlat" | Hastaya Sağlığım mesajı (mevcut kohort hatırlatma deseni + e-posta bildirimi, gövde e-postada yok): branş adı + "raporu getirin" — klinik soru / tanı yok. |
| Testler | `lib/doktor/konsultasyon.test.ts` (17 — doğrulama, geçişler, eski kayıt eşdeğerliği, not bloğu, portal sızıntısı, yönelme eki) · `lib/doktor/konsultasyon-rota.test.ts` (5 — Kaan'ın akışı uçtan uca gerçek rotayla; geçişler; **geri uyum**: dahiliye `sevk` adımı aynı tabloya yazar ve dahiliye GET okur, yanıtlanınca açık listeden düşer; göz "açık dahiliye göz sevki" köprüsü eski `acik` satırı okumaya devam eder). |

### Ne yapıldı — PR 2: arayüz + yazdırılabilir istem formu + Kasa bağlantısı

| Parça | Ayrıntı |
|---|---|
| Hasta dosyası › **Konsültasyonlar** sekmesi (evrensel) | `lib/doktor/hastaDosyaSekmeleri.ts` — her branş bayrağı kombinasyonunda, Belgeler'in hemen ardından; `?tab=konsultasyon` derin bağlantısı. Bileşen `components/doktor/HastaKonsultasyonlar.tsx`, ortak kütüphane `lib/doktor/aracUi.tsx` (Alan, Segment, Katlanir, Rozet, TaslakNotu, vurgu). |
| "Show proof" kartı | Durum rozeti (yanıt bekleniyor · N gündür — 30 günden sonra kırmızı), hedef branş, aciliyet, klinik soru, istem tarihi, konsültan hekim; yanıtlandıysa hekimin özet cümlesi + yanıt tarihi + **📎 rapor** (Kasa'dan satır içinde `DocumentViewer`) + **"Muayene notuna eklendi →"** (`note_id` → muayene formu) ya da **"Bugünkü muayene formuna ekle"** (hekim basar); açıksa **Yanıt ekle / Hatırlat / Yanıtsız kapat**; kapanmışsa "Geç gelen raporu ekle"; eski dahiliye/göz/KD satırları "eski kayıt" rozetiyle. |
| Yanıt ekleme | Kasa'dan rapor seçimi (+ "kasaya yükleyin ›" derin bağlantısı), seçilen belgenin mevcut Tier A değerlendirmesi varsa **TASLAK** kutusunda + "Taslağı özete aktar (düzenleyin)" + "Belgeyi değerlendir (Asistana raporla) ›" (mevcut `belge_analizleri` akışı, hekim onayı ayrı). Özet hekimin cümlesi; nota kendiliğinden yazılmaz. |
| Yeni istem formu | Hedef branş (önerilen grubu üstte), klinik soru + canlı **kısaltma uyarısı** (engellemez), aciliyet (Rutin/Öncelikli/Acil), konsültan hekim; katlanır "İstem formu ayrıntıları": tanılar, mevcut durum, ek not. Altta: SGK sevk belgesi olmadığı. |
| **KONSÜLTASYON İSTEM FORMU** (yazdır/PDF, A4) | `/dashboard/doktor/hastalar/[id]/konsultasyon/[kid]/yazdir` — reçete/epikriz/gebe kartıyla aynı antet (`recete_baslik`); hasta tanımlayıcıları, istem tarihi, istenen branş, aciliyet kutuları, klinik soru, tanılar, mevcut durum (boşsa el yazısı satırları), 18 yaş altında "Veli / yasal temsilci" satırı (`veliDiliMi`, yaşa bağlı), istem yapan hekim kaşe/imza, **konsültan hekim yanıt alanı**; altta: *SGK sevk belgesi (SUT EK-2/F / e-sevk) değildir; kurumlar arası SGK sevki MEDULA üzerinden*. Kağıt `components/doktor/KonsultasyonIstemFormuKagidi.tsx`. |
| Kasa yükleme | `/dashboard/doktor/belgeler` — seçili hastanın rapor bekleyen konsültasyonu varsa İSTEĞE BAĞLI "Bu bir konsültasyon yanıtı mı?" → konsültasyon seçimi (+ `?konsultasyon=` derin bağlantı) → isteğe bağlı yanıt özeti. Yükleme başarılıysa belge `belge_id`'ye bağlanır (özet yazıldıysa `yanitlandi`). Belge türüne **"Konsültasyon raporu"** eklendi; "Sevk" türü gerçek SGK sevk belgeleri için kaldı. |
| Mobil kontrol (standing rule) | Geçici yerel QA sayfası (commit edilmedi, sentetik veri) + headless tarayıcı, **390 px**: çizelge, yeni istem formu, yanıt formu, istem formu kağıdı — `scrollWidth = 390` (yatay taşma yok), 36 px altı dokunma hedefi yok, konsol hatası yok (tek uyarı QA sayfasının kendi hidrasyon ayrımından). |
| Testler | `lib/doktor/konsultasyonUi.test.ts` (SSR, 14 — kart durumları, "show proof", eski kayıt, UI'de "sevk" kelimesi yok, branşa özgü alan yok, 44 px; yeni form; istem formu kağıdı: başlık, SGK notu, TTB alanları, veli satırı yaşa bağlı) · `hastaDosyaSekmeleri.test.ts` +1 (sekme evrensel). |

### Ne yapıldı — PR 3: Sağlığım portalı + kohort satırı

| Parça | Ayrıntı |
|---|---|
| Sağlığım › Ziyaretler › **Yönlendirmeleriniz** (Kaan: EVET) | Çekirdek omurga (her branş) — `PortalBundle.yonlendirmeler`; chapter modülü DEĞİL (`lib/portal/moduller.ts` başlığında not). Satır: *"KBB'ye yönlendirildiniz (12.09.2026) · Sonuç alındı (18.09.2026)"* / "· Sonuç bekleniyor" / "· Takip kapatıldı". Portal sorgusu yalnız `id, hedef_brans, istem_tarihi, created_at, durum, yanit_tarihi` seçer — klinik soru, tanılar, mevcut durum, yanıt özeti, rapor ve konsültan adı **sorguya hiç girmez**; token'ın doktoruna kapsanır; yalnız bu akışla açılmış (`hedef_brans` dolu) kayıtlar. KVKK m.10 aydınlatmayı destekler. Demo portalına sentetik tek satır (göz demosunda yok). |
| Kohort satırı (yeni araç YOK) | `components/doktor/KonsultasyonKohortSatiri.tsx` mevcut **yedi** kohort paneline takıldı (dahiliye, derm, göz, KBB, KD, pediatri, psikiyatri — yalnız `app/doktor-tools/*-kohort/page.tsx`; `specialties/psikiyatri/**` ve `specialties/kulak-burun-bogaz/**` dosyalarına dokunulmadı). "Yanıt bekleyen konsültasyonlar (N)", en uzun bekleyen üstte, "N gündür açık" (14 gün sarı, 30 gün kırmızı — ürün UX eşiği, klinik eşik değil), hasta dosyası › Konsültasyonlar'a bağlantı. **SKS uyumu:** son 180 günde yanıtlananların istem → yanıt medyanı (yalnız ölçüm). |
| Mobil (390 px) | Kohort satırı ve portal demo Ziyaretler: `scrollWidth = 390`, konsol hatası yok. Bulunan ve düzeltilen: portal satırındaki tarih başlığı tarayıcı saat diliminde bir gün geri kayıyordu (gün değeri öğlen UTC ile biçimleniyor); alt not kenara yapışıktı. |
| Testler | Gerçek portal rotası: yeni kayıt görünür; `GIZLI-SORU/TANI/DURUM/YANIT/KONSULTAN`, rapor adı, eski hesaplayıcı satırı ve başka hekimin aynı hastaya düşmüş satırı portala **girmez**. Kohort: sıralama + medyan. SSR: kohort satırı, 7 panelde takılı ve Araçlar'a yeni rota/tile açılmadığı, portal bölümü (liste boşsa hiç çizilmez). `hasta-izolasyon` portal testleri hileli konsültasyon satırıyla koşar. |

### AÇIK

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-19 | **Notya→Notya hekimler arası paylaşım (istem ve raporun konsültan Notya hekimine dijital gitmesi / geri gelmesi)** | Bilinçli olarak KAPSAM DIŞI. Ağ etkisi için değerli (iki Notya hekimi arasında kağıtsız döngü), ama bu **başka bir veri sorumlusuna aktarım**dır: m.6/3 istisnası tedavi amaçlı işlemeyi kapsar, fakat platform üzerinden başka muayenehaneye hasta verisi göndermek ayrı bir KVKK değerlendirmesi (aktarım — m.8, açık rıza ya da istisna gerekçesi, aydınlatma metni), iki hekim arasında paylaşım/iptal modeli, erişim süresi ve denetim izi tasarımı ister. Ayrıca hasta-izolasyon kuralının ("bir hekimin hastası asla başka hekime görünmez") **bilinçli, hasta onaylı bir istisnası** olur — bu kural değişikliği Kaan kararıdır. Bugün: konsültan raporu Kasa'ya hekim tarafından yüklenir. | OPEN (Kaan — KVKK + paylaşım modeli) |
| 2026-09-19 | **Eski satırlar Sağlığım'da gösterilmez** | Dahiliye/göz/KD'nin bir kısmı hesaplayıcıların kendiliğinden açtığı sevk önerileri (FIB-4 → gastroenteroloji, HT → nefroloji…). Hekim bunları hastaya "yönlendirme" olarak bildirmedi; geriye dönük portal görünürlüğü açılmadı. Portal yalnız `hedef_brans` dolu (bu akışla açılmış) kayıtları gösterir. Hekim ekranında eski kayıtlar "eski kayıt" rozetiyle görünür ve kapalı döngüye alınabilir. | Karar (geri alınabilir) |
| 2026-09-19 | **Spec'e ek kolonlar** | `tanilar`, `mevcut_durum` (TTB istem formu içeriği), `son_hatirlatma_at` (hatırlatma sıklık sınırı). Hepsi nullable, yalnız ekleme. | Bilgi |
| 2026-09-19 | **Kohort paneli olmayan branşlar** | Yedi branşın kohort paneli var; diğer ~23 branşta "yanıt bekleyen" çapraz-hasta listesi yalnız API'de (`GET ?bekleyen=1`) — hasta dosyasındaki çizelge her branşta çalışır. Yeni araç açılmadı (brief). Öneri: Günün programı / ana sayfaya küçük sayaç. | **KAPANDI** — KONSULTASYON-02 (aşağıda): evrensel Bekleyen Konsültasyonlar aracı + ana sayfa sayacı |
| 2026-09-19 | **Hatırlatma yalnız hastaya** | "Hatırlat" hastaya Sağlığım mesajı gönderir (raporu getirin). Konsültan hekime hatırlatma yok — Notya→Notya paylaşımı kararına bağlı. | OPEN |
| 2026-09-19 | **Eski dahiliye/göz/KD yazıcıları hâlâ UI'de "sevk" diyor** | Dahiliye "Sevk" adımı, göz "açık dahiliye göz sevki", KD "Sevk notu" metinleri bu brief'te değiştirilmedi (branş klasörleri + mevcut akışlar kırılmasın). Sonraki adım: bu yüzeylerde "Konsültasyon istemi" diline geçiş ve istemi yeni akışa yönlendirme (hedef_brans + klinik soru). | OPEN |

## KONSULTASYON-02 — bekleyen konsültasyon takibi 30 branşın hepsinde (Kaan kararı, 2026-09-19)

**Boşluk (Claude denetimi, Kaan onayı 2026-09-19).** KONSULTASYON-01 rotası, hasta dosyası › Konsültasyonlar sekmesi,
istem formu, Kasa bağlantısı ve Sağlığım "Yönlendirmeleriniz" zaten evrenseldi. Ama döngüyü *kapalı* yapan parça —
"3 haftadır yanıt gelmedi" hatırlatması — yalnız `components/doktor/KonsultasyonKohortSatiri.tsx` içindeydi ve o satır
yalnız kohort paneli OLAN 7 branşa takılıydı (dahiliye, göz, derm, KD, pediatri, psikiyatri, KBB). Kalan ~23 branşın
hekimi konsültasyon oluşturabiliyor, dosyalayabiliyordu; ama yanıt gelmeyen istemleri çapraz-hasta göremiyordu —
takip değil, yalnız dosyalama.

**Karar — Kaan, seçenek #1: evrensel "Bekleyen konsültasyonlar" yüzeyi.** 23 branşa 23 ayrı kohort paneli
kurulmadı. Gerekçe: (1) bekleyen konsültasyon listesi branştan bağımsızdır — KBB'ye yönlendiren kardiyolog ile
pediatrist aynı soruyu sorar ("kimin yanıtı gelmedi?"); branş kohortu ise branşın klinik göstergelerini (HbA1c,
aşı gecikmesi, PHQ-9…) izler ve her branş için ayrı bir ürün kararıdır, bu işin kapsamı değildir. (2) Tek araç tek
kod yolu demektir; 23 kopya aynı mantığın 23 kez kaymasına davetiye. (3) Kohort paneli olan 7 branş zengin satırı
korur; araç onlar için ikinci giriş noktasıdır.

**Sonuç: konsültasyon döngüsü artık 30 branşın hepsinde kapalı** — istem → yanıt bekleniyor → (en uzun bekleyen üstte
izlenir, hatırlatılır, gerekirse yanıtsız kapatılır) → rapor Kasa'da → hekimin cümlesi → yanıtlandı.

**Sınıf (Doktor Araçları kapısı):** yeni evrensel araç → `ORTAK_DOKTOR_ARACLARI` (`branslar: null`); görünürlük:
tüm ~30 branş, kimse hariç değil (branşı boş hekim dahil). `BRANS_DOKTOR_ARACLARI`'na eklenmedi.

### Ne yapıldı

| Parça | Ayrıntı |
|---|---|
| Araç `/doktor-tools/bekleyen-konsultasyonlar` | `OrtakAracKabugu` + `components/doktor/araclar/BekleyenKonsultasyonlar.tsx`, ortak kütüphane `lib/doktor/aracUi.tsx` (Istatistik, Rozet, kutu/etiket/ghost/btn stilleri) — yeni tasarım dili yok. Hekim düzeyinde liste, hasta seçici yok. Üstte sayaçlar (yanıt bekleyen · 14–29 gün · 30 gün ve üzeri · son 180 günün istem → yanıt medyanı). Satır: hasta adı, hedef branş, klinik soru (≤300 karakter), istem tarihi, "N gündür bekliyor", aciliyet rozeti (Acil / Öncelikli / Rutin), eski kayıt rozeti, son hatırlatma. Eylemler: **Yanıt ekle** (hasta dosyası › Konsültasyonlar'a `&yanit=<id>` ile gider; o kartın MEVCUT yanıt formu açık gelir ve karta kaydırılır — yeni form yok) · **Hasta dosyası** · **Hatırlat** (7 gün sınırı dolmadıysa pasif + "Sonraki hatırlatma …") · **Yanıtsız kapat** (aynı onay metni; satır listeden düşer). |
| Tek kaynak (iki yüzey aynı veriyi farklı göstermesin) | `lib/doktor/konsultasyon.ts`: `bekleyenListesi()` (durum süzgeci + sahiplik süzgeci + sıra: en uzun bekleyen üstte, aynı günde acil → öncelikli → rutin, sonra id), `beklemeVurgusu()` (14 / 30), `bekleyenOzeti()`, `hatirlatmaBeklemesi()`. Araç, 7 kohort satırı (`KonsultasyonKohortSatiri` — eşiği artık yeniden tanımlamıyor, yeni araca bağlantı eklendi) ve ana sayfa özeti bunları kullanır. Tarayıcı işlemleri `lib/doktor/konsultasyonIstemci.ts` (PATCH, onay/başarı metinleri, dosya yolu) — hasta dosyası kartı da buna geçti. |
| API (yeni rota YOK) | Mevcut `GET /api/doktor/konsultasyon?bekleyen=1` zaten "hekimin yanıt bekleyenleri"ydi → minimal genişletme: satıra `klinikSoru` + `sonHatirlatmaAt`; `?bekleyen=sayi` → aynı listeden `{ sayi, dikkat, kirmizi, enUzunGun }` (hasta adı çözülmez). Paylaşılan no-store servis istemcisi (`doktorOturum`). |
| Hasta izolasyonu | Kimlik girdisi yok; kapsam oturumdaki hekim: `sevkler.doctor_id = user.id` + ad/sahiplik yalnız `patients.doctor_id = user.id`'den; haritada olmayan hastanın satırı (başka hekimin hastasına düşmüş kirli satır) liste **ve** sayıdan düşer. `hasta-izolasyon.test.ts`: `?bekleyen=sayi` vakası (pozitif + A→B + B→A) + "A hekimi B'nin bekleyenlerini GÖREMEZ" (iki yön; liste yalnız kendi istemi, sayı = 1 — B'nin satırı ve A'nın B hastasına kirli satırı sayılmaz) + oturumsuz 401. **Mutasyonla doğrulandı:** `sevkler` ve `patients` `doctor_id` filtreleri kaldırılınca 4 test kırmızı. |
| Ana sayfa özeti | `components/doktor/BekleyenKonsultasyonOzeti.tsx`, `app/dashboard/doktor/page.tsx`'te karşılama panelinin (ve varsa yeni bebek iş listesinin) altında, branş koşulu yok. Yalnız sayı > 0 iken tek satırlık panel ("3 yanıt bekleyen konsültasyon · en uzun 32 gündür · Takip et →"), 0 ya da hata iken hiçbir şey çizilmez. Ana sayfa paneliyle aynı görsel dil (#0D1C33, ince hat, tabular rakam). |
| Mobil (standing rule) | Geçici yerel QA sayfası (commit edilmedi, sentetik veri) + headless tarayıcı, **390 px ve 360 px**: araç listesi, sayaçlar, ana sayfa özeti, kohort satırı — `scrollWidth` = viewport (yatay taşma yok), araç satırı ve özetteki tüm bağlantı/düğmeler ≥ 44 px, konsol hatası yok. |
| Testler | `doktorAraclari.test.ts` +2: araç `ORTAK_…`'ta, `branslar: null`, `BRANS_…`'ta yok; `BRANS_ETIKETLERI`'ndeki **her** anahtar + resmi etiket + kohortlu 7 + kohortsuz ≥20 branş listede görür ve derin linki açar; sayfa `OrtakAracKabugu` + kendi rotası, hasta seçici yok, ticari metin (mevcut branş-özel assertion'lar değişmedi). `konsultasyon.test.ts` +7 saf: eşik sınırları, sıralama, durum süzgeci (eski `acik` dahil), sahiplik süzgeci, alan eşlemesi, özet, hatırlatma sınırı. `konsultasyonUi.test.ts` +9 SSR: satır alanları, vurgu, eylem bağlantıları ve 44 px, pasif Hatırlat, sayaçlar, boş/hazır değil/yükleniyor, "sevk" ve branş alanı yok; ana sayfa özeti 0'da boş, >0'da araca bağlı; kohort satırı ve araç aynı `beklemeVurgusu`. KONSULTASYON-01'in "Araçlar'a konsültasyon rotası açılmadı" iddiası Kaan kararıyla güncellendi: tek konsültasyon aracı, evrensel. `konsultasyon-rota.test.ts`: `?bekleyen=sayi` listeyle aynı sayıyı verir, ad taşımaz. |

### AÇIK

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-19 | **14 / 30 gün eşiklerinin kaynağı** | SKS konsültasyon istem → yanıt süresinin izlenmesini ister (KONSULTASYON-01 bulgu #2), ama bu muayenehane akışı için sayısal bir gün sınırı koymaz — 14 / 30 ürün UX ipucudur (KONSULTASYON-01 kohort satırından devralındı). Arayüzde "klinik bir süre sınırı değildir" yazıyor. Kurum/hekim bazlı ayar istenirse `BEKLEME_*_GUN` tek yerde. | OPEN (Kaan — ayar istenirse) |
| 2026-09-19 | **Liste tavanı 200** | `?bekleyen` sorgusu en eski 200 bekleyen satırı okur (KONSULTASYON-01'den); sayı da bu tavanla sınırlı. Tek hekimde 200+ açık istem beklenmiyor; olursa sayfalama. | Bilgi |
| 2026-09-19 | **Günün programında bekleyen konsültasyon işareti** | Randevusu olan hastanın bekleyen konsültasyonu brifingde "rapor getirdi mi?" diye hatırlatılabilir. Bu işin kapsamı dışında bırakıldı (ana sayfa özeti + araç yeterli). | OPEN (öneri) |


## AYSE-KONSULTASYON-01 — istem düzenlenebilir + Ayşe istem ve yanıt özetini TASLAK yazar (Dr. Gökhan + Kaan, 2026-09-19)

**Kaynak — Dr. Gökhan Mamur (gerçek beta hekim), canlı kullanımda, kelimesi kelimesine:**
1. *"Bu yazıyı boş forma yazdıktan sonra oluştura bastım... sonra bu sayfa çıktı. Eğer doktor değiştirme yapmak
   istiyorsa yapamıyor, yani düzeltme olanağı yok."*
2. *"Hani asistan (Ayşe Kaya) diyoruz ya... 'şöyle bir durum var, bununla ilgili profesyonel tonda bir e-posta yaz bir
   göreyim' gibi. Yani AI fikri alıp konsültasyon notunu yazıyor, hem de muayene dosyasına bakıp oradan da bilgi
   alarak. Sonra doktor AI'ın yazısını görünce onu onaylayıp konsültasyon notu ortaya çıkarabilir. Mümkün mü?"*

**Kaan'ın kararları (2026-09-19, bağlayıcı):** (1) yapılacak. Taslak DOLU gelsin — hekim formu açtığında metin hazır,
ayrı düğme yok. Ayşe BÜTÜN vizitleri dikkate alır, AĞIRLIK SON MUAYENEDE. Aynı mantık DÖNÜŞTE: gelen raporu Ayşe okur,
özet taslağı çıkarır, hekim onaylayıp dosyaya işler.

**İstem kilidi kuralı (Claude'un operasyonel kararı, Kaan'a bildirildi):** istem `acik` / `yanit_bekleniyor` iken
DÜZENLENEBİLİR; yanıt geldikten (`yanitlandi`) sonra — ve yanıtsız kapatılmış kayıtta — istem KİLİTLİDİR, yalnız yanıt
tarafı işlenir. Kilit **sunucuda** (`gecisIzinli(durum, 'duzenle')` → 409), UI yalnız düğmeyi gizler. Düzenleme izi
tutulur; üzerine sessizce yazılmaz.

### PR A — istem düzenleme + düzenleme izi

| Parça | Ayrıntı |
|---|---|
| Migration `083_konsultasyon_revizyonlar.sql` | **Yalnız ekleme**: yeni tablo `konsultasyon_revizyonlar (sevk_id → sevkler, doctor_id, patient_id, alan, onceki, sonraki, created_at)` + dizin + RLS (kendi satırı + RESTRICTIVE hasta sahipliği, 052 deseni). `jsonb` kolon yerine tablo seçildi: `belge_revizyonlar` / `muayene_revizyonlar` (025) ile aynı desen; satır başına sınırsız büyüyen dizi yok. **Canlıya uygulandı 2026-09-19** (`run-sql-migration.mjs`): `relrowsecurity = true`, politikalar `hasta_izolasyon_kendi_satiri` (PERMISSIVE) + `hasta_izolasyon_hasta_sahipligi` (RESTRICTIVE), 0 satır. |
| API (yeni rota YOK) | `PATCH /api/doktor/konsultasyon { id, islem: 'duzenle', klinikSoru?, aciliyet?, hedefHekim?, tanilar?, mevcutDurum?, not? }`. Hedef branş değişmez (başka branş = yeni istem). Yalnız DEĞİŞEN alanlar güncellenir; her biri için `onceki → sonraki` izi **güncellemeden önce** yazılır — iz yazılamazsa değişiklik yapılmaz (500, "değişiklik yapılmadı"); güncelleme başarısızsa iz geri alınır. Değişiklik yoksa 400 (boş iz yok). Yanıt özeti düzeltmesi (`islem: 'yanit'`, önceki özet varken) de `yanit_ozeti` izi bırakır; ilk yanıt iz değil, kaydın kendisidir. `GET ?patientId` her satıra `duzenlemeler` (eskiden yeniye) ekler — hekim + hasta kapsamlı; tablo yoksa boş. |
| Hasta izolasyonu | Konsültasyon kimliği mevcut `satirBu()` ile (`id` + `doctor_id` aynı sorguda, sonra satırın hastası `hastaSahibiMi`). İz satırı hekime + hastaya bağlı yazılır/okunur. `hasta-izolasyon.test.ts` yeni vaka: `PATCH duzenle` — pozitif (kendi istemi düzenlenir + iz A'ya/A'nın hastasına bağlı) + A→B + B→A (404, kurbanın metni ve izi değişmez, kurbana atıf yok). |
| UI | Kart: yanıt beklerken **Düzenle** (ghost, 44 px) → `IstemDuzenleFormu` (mevcut metin dolu, kısaltma uyarısı engellemez, "önceki metin düzenleme geçmişinde saklanır"); yanıtlanmışta düğme yok, istem satırında "istem kilitli (yanıt geldi)", **Yanıtı düzelt** kalır. **Düzenleme geçmişi (N)** — `Katlanir`, her durumda (yanıtlanmış dahil) görülebilir: tarih · alan · önceki metin. Ortak `aracUi` bileşenleri; yeni tasarım dili yok. |
| Testler | Rota (gerçek handler): yanıt beklerken düzenlenir + iki iz (önceki metin kaybolmaz, sıralı); değişiklik yok / kısa soru → 400; yanıtlandı → **409, metin ve iz değişmez**; yanıt düzeltmesi izi; eski `acik` düzenlenir, yanıtsız kapanmış → 409; **iz tablosu yazılamazsa değişiklik yapılmaz**. Saf: kilit tablosu, yalnız değişen alanlar, çok satırlı mektup korunur. SSR: Düzenle görünürlüğü, kilit metni, geçmiş. |

### PR B+C+D — Ayşe istem ve yanıt özeti TASLAĞI yazar, hekim onaylar

| Parça | Ayrıntı |
|---|---|
| Model kademesi ve neden | **İstem taslağı → `klinik-analiz` (GÜÇLÜ / Sonnet)** — hekimin meslektaşına imzalayacağı klinik metin üretimi; SKILL.md "klinik üretim" satırı, HIZLI listesinde değil (kalite > maliyet). **Yanıt taslağı → `goruntu-inceleme` (GÜÇLÜ)** — konsültan raporu PDF/fotoğraf okunur; `cagir.ts` görsel/belge bloğunda zaten yükseltir, görev tipi yine doğru verildi. İkisi de `lib/ai/cagir.ts` üzerinden (ölçüm `ai_token_kullanim`, kademe garantisi); model adı string yok (`model-sizmasi.test.ts` yeşil). Kota kovası: mevcut `konsult`. |
| Maliyet disiplini | Sabit system prompt (`ISTEM_TASLAK_SISTEMI` / `YANIT_TASLAK_SISTEMI`: biçim, ton, hekim kilidi, sentetik örnek) `cache_control` ile işaretli; hasta dosyası özeti **user mesajında**, işaretsiz. Bağlam: son muayene tam (alan başına ≤1500 karakter), önceki vizitler tek satır (tarih · tanı · ≤220 karakter değerlendirme · ilaç adları), en yeni 12; daha eskiler yalnız sayı; önceki vizitlerin planı/ham metni gitmez. Son muayenede klinik içerik yoksa model **çağrılmaz**. Yanıtta mevcut `belge_analizleri` taslağı varsa model çağrılmaz. |
| API (yeni rota YOK) | `POST /api/doktor/konsultasyon { islem: 'istem_taslagi', patientId, hedefBrans, not? }` · `{ islem: 'yanit_taslagi', id, belgeId?, deid? }`. İkisi de **hiçbir şey kaydetmez**. Başarısızlık = `200 { ok:false, neden, error }` (yumuşak hata) — form boş ama kullanılabilir; istemci her hatayı "Taslak oluşturulamadı, elle yazabilirsiniz." cümlesine indirir (ham sunucu/oturum hatası hekime gösterilmez). |
| İstem taslağı | Kaan'ın kuralı: bütün vizitler okunur, ağırlık son muayenede. Dr. Gökhan'ın biçimi: "Sayın Meslektaşım," → başvuru şikayeti + bulgular → değerlendirme ve başlanan tedavi → ilgili geçmiş → "… açısından <branşın resmi adı> konsültasyonunuzu rica ederim." → "Saygılarımla," + `users.full_name` + hekimin uzmanlık adı. Selamlama ve imzayı **sunucu** ekler (model ad uyduramaz). Kısaltmasız: hedef branş `resmiUnvan` ile ("KBB" değil "Kulak Burun Boğaz Hastalıkları"). Kimlik (ad, T.C., telefon, intake kimlik/veli/sigorta alanları) modele gitmez. Veli dili yaşa bağlı (`veliDiliMi`). |
| Klinik güvenlik | Prompt: yalnız dosyadaki bilgi; tanı/evre/doz uydurma yok; tanının kesinliği korunur; `DOSYA_YETERSIZ` / `RAPOR_OKUNAMADI` kaçış yolu. **Kod:** `uydurmaDozTemizle` — istemde dosyada geçmeyen sayılı doz, yanıtta (rapor metni sunucuda doğrulanamadığı için) her sayılı doz `[doz hekim tarafından belirlenir]` olur. **F3:** ham JSON, kod çiti içinde JSON, `max_tokens` ile kesilmiş çıktı hekime gösterilmez. `doktorMetniTemizle` (iç alan adları, uydurma form no). |
| Yanıt taslağı — mevcut boru hattı | Kontrol edildi: `belge_analizleri` (NOTYA-BELGE-01 Tier A) görüntü/inceleme **değerlendirmesi** üretir (modalite, tanı olasılıkları, bulgu kodları; psikiyatride kapalı; görüntüde kimlik olmadığı onayı ister) — konsültan mektubunun özetini üretmez. Karar: **önce onu KULLAN** (aynı belge için değerlendirme varsa ve `hata/kalite_dusuk/modalite_uyusmazlik` değilse onun özeti taslak olur, model çağrılmaz); yoksa tek, dar bir özet çağrısı. Paralel ikinci analiz **tablosu/yolu açılmadı**; taslak kaydedilmez. PDF kasadan hekim + hasta kapsamlı okunur (boru hattıyla aynı); fotoğraf tarayıcıda `core/belgeler/deid` ile EXIF'siz küçültülmüş türev olarak gelir (`deid_gerekli` el sıkışması). |
| Hekim kilidi / onay | İstem: "Konsültasyon istemi oluştur"a basmadan kayıt yok. Yanıt: taslak dolu gelir, düğme **"Onayla ve kaydet"** — basılmadan durum `yanitlandi` olmaz (testle doğrulandı). Özet hekimin cümlesi olarak kaydedilir; nota kendiliğinden yazılmaz. |
| UI | Yeni istem formu: hedef branş seçilir seçilmez Ayşe yazar (ayrı düğme yok); "Ayşe yazıyor… beklemeden kendiniz de yazabilirsiniz"; **TASLAK · Ayşe · hekim onayı bekliyor** rozeti + `TaslakNotu`; düzenlenince "Ayşe taslağı · düzenlendi"; hekimin yazdığının üstüne **yazılmaz** (yazmaya başladıysa "Ayşe'nin taslağını kullan" onaylı); isteğe bağlı "Ayşe'ye kısa not" + "Bu notla yeniden yaz" (Dr. Gökhan'ın "şöyle bir durum var… yaz" akışı). Yanıt formu: bağlı rapordan özet taslağı dolu gelir; eski "Taslağı özete aktar" kutusu bu akışa katıldı. `istemOzu()`: mektup biçimli istemde not bloğu, bekleyen listesi ve Kasa seçicisi "Sayın Meslektaşım," yerine talep paragrafını gösterir. `klinikSoru` tavanı 1000 → 4000 (mektup). |
| Mobil (standing rule) | Geçici yerel QA sayfası (commit edilmedi, sentetik veri) + headless tarayıcı, **390 px** — PR A'nın düzenleme formu ve geçmişi de dahil: `scrollWidth = 390`, taşan öğe yok; yeni düğmeler ≥ 44 px; hata yolunda metin alanı etkin ve "Taslak oluşturulamadı, elle yazabilirsiniz." görünüyor. 44 px altı yalnız KONSULTASYON-01'den kalan iki satır içi ipucu bağlantısı ("kasaya yükleyin ›", "Belgeyi değerlendir ›"). Bulunan ve düzeltilen: taslak hatasında ham 401 metni ("Oturum bulunamadı…") gösteriliyordu. |
| Testler | `konsultasyonTaslagi.test.ts` (18, saf): iki görev de GÜÇLÜ ve HIZLI'ya düşmüyor; istek gövdesinde sabit blok önbellekli ve hasta verisiz; bağlam ağırlığı (son tam, önceki tek satır, plan gitmez, 12 sınırı, boş seans); F3 (JSON, kesilme, boş, DOSYA_YETERSIZ); kod doz kilidi; mektup biçimi ve tavan; hata yolu (ağ/sunucu/boş → tek cümle); hekimin metni ezilmez. `konsultasyon-taslak-rota.test.ts` (12, gerçek rota): taslak dolu + kayıt yok; yakalanan model isteğinde GÜÇLÜ model, önbellek, son muayene, kimlik ve **başka hekimin kirli notu yok**; kredi yok → yumuşak hata ve elle oluşturma çalışıyor; dosya boşsa model çağrılmıyor; PDF / fotoğraf (türev) / mevcut `belge_analizleri` yolu; onaysız `yanitlandi` olmuyor; A↔B 404 ve kasadan yabancı belge okunmuyor. `hasta-izolasyon.test.ts` +3 vaka (istem taslağı, yabancı konsültasyonun yanıt taslağı, kendi konsültasyonu + yabancı rapor) + kirli satır testi (iki yön); **mutasyonla doğrulandı** (sahiplik kontrolü kaldırılınca kırmızı). SSR +6. `model-sizmasi`, KONSULTASYON-01 testleri ve F3 testleri değişmeden yeşil. |
| E) SKILL dosyası | `.cursor/skills/ai-model-politikasi/SKILL.md` #340 (2ca0a72) ile zaten main'de — çalışma ağacı temiz, commit edilecek fark yok. |

### AÇIK

| Tarih | Madde | Gerekçe + öneri | Durum |
|---|---|---|---|
| 2026-09-19 | **Canlı uçtan uca doğrulanmadı** | Taslaklar sahte modelle gerçek rota üzerinden sınandı; `ANTHROPIC_API_KEY` kredisi tükenmiş olabileceği için canlı Sonnet çağrısı denenmedi. Kredi dolunca: sentetik QA hastasıyla KBB istem taslağı + bir PDF rapordan yanıt özeti; `ai_token_kullanim`'da `klinik-analiz` / `goruntu-inceleme` satırları ve `cache_read` > 0 (ikinci çağrıda) kontrol edilmeli. | OPEN (Kaan — kredi) |
| 2026-09-19 | **Önbellek eşiği** | Sonnet önbelleği ≥ 1024 token'lık bloklarda devreye girer. İstem prompt'u örnekle birlikte bu sınıra yakın; yanıt prompt'u muhtemelen altında (işaret zararsız, etkisiz). Ölçüm `ai_token_kullanim.cache_read` ile yapılmadan "tasarruf" denmez. | OPEN (ölçüm) |
| 2026-09-19 | **Yanıt taslağı kaydedilmiyor** | Mevcut belge değerlendirmesi yoksa yanıt formu her açılışta raporu bir kez okur (hekim özet yazmadıysa). Paralel analiz deposu açmamak için bilinçli. Maliyet ölçümde görünürse: taslağı `belge_analizleri`'ne ayrı `engine_set` ile yazmak ya da `sevkler`'e nullable taslak kolonu (ürün kararı). | OPEN (öneri) |
| 2026-09-19 | **Fotoğraf raporlarda kimlik görünür** | Konsültan raporu doğası gereği hasta adını taşır. PDF'ler NOTYA-BELGE-01'de de olduğu gibi kasadan modele gidiyor; fotoğraf EXIF'siz türev olarak gidiyor, ama belge analizi akışındaki "görüntüde ad/T.C. yok" onayı burada istenmiyor (her raporda olumsuz olurdu). Model ad yazmaz (prompt). KVKK değerlendirmesi PDF ile aynı sınıf — Kaan'ın teyidi gerekli. | OPEN (Kaan — KVKK) |
| 2026-09-19 | **Kasa yükleme akışında taslak yok** | `/dashboard/doktor/belgeler`'deki "Bu bir konsültasyon yanıtı mı?" isteğe bağlı özet alanı Ayşe taslağı almaz; rapor orada bağlanır, özet taslağı hasta dosyası › Konsültasyonlar › Yanıt ekle'de dolu gelir. | OPEN (öneri) |
| 2026-09-19 | **Tanılar / mevcut durum alanları** | Taslak yalnız istem metnini doldurur; TTB formunun "tanılar" ve "mevcut durum" alanları elle. Son muayenenin tanısı deterministik olarak (AI'sız) önerilebilir. | OPEN (öneri) |
| 2026-09-19 | **Kısaltma uyarısı imzadaki büyük harfleri yakalar** | `olasiKisaltmalar` tamamı büyük harf 2–6 harfli sözcükleri bulur; imzada büyük harfli ad varsa uyarı çıkar (engellemez). | Bilgi |

- 2026-09-22 — Kokpit boş randevu durumu: bugün planlı randevu yokken muayene yapılmışsa "Bugün N muayene yapıldı, planlı randevu yok" yazıyor; muayene de yoksa eski "Bugün için randevu yok" metni kalıyor (`app/dashboard/doktor/page.tsx`).

- 2026-09-22 — İzlemede (tek görülme, henüz tekrarlanmadı): geçmişe dönük işlenen bir muayenede (Umutcan Türkoğlu) Yaşamsal Bulgular (kilo/boy/baş çevresi) revizyon ekranında görünüyordu ama ilk üretilen Yazdır/PDF raporunda yoktu; not tekrar açılıp kaydedildikten sonra raporda göründü. Kaynak: Dr. Gökhan bu hastaya NOTYA-OGRENME-03/çoklu-muayene arama testi için geçmiş muayeneleri arka arkaya yüklüyor — hızlı ardışık not kaydetme, PDF rotasının kayıttan önceki bir anlık görüntüyü okumasına (stale read/race condition) uygun bir senaryo. Tekrarlarsa bu bağlamda yeniden üret— hasta gerçek değil, doğum tarihi/yaş uyuşmazlığı da bu yüzden (persentil motoru doğru davrandı, beklenen uyarı). Asıl izlenecek olan: çoklu-muayene sorgusu (Ayşe'ye "bu hastanın geçmişi" tipi sorular) tüm notlardan mı yoksa yalnız son nottan mı yanıt veriyor — test edilen özelliğin gerçek başarı kriteri bu.

- 2026-09-22 — DÜZELTİLDİ: not düzenleme sayfasında (`notlar/[id]/page.tsx`) "Kaydet ve yeniden onayla" ve "Notu AI ile yeniden değerlendir" düğmeleri `aiDurum === 'bekliyor'` iken kilitleniyordu; arka plandaki `/api/doktor/not-konsult` çağrısının zaman aşımı olmadığı için yavaş/donan bir yanıtta hekim notunu hiç kaydedemiyordu (canlıda Dr. Gökhan'ı bloke etti, çoklu-muayene yükleme sırasında görüldü). Düzeltme: Kaydet düğmesi artık yalnız `durum === 'kaydediyor'` iken kilitli (AI önerisi arka planda beklese de not her zaman kaydedilebilir); `aiYenidenOku` fetch'ine 30sn `AbortController` zaman aşımı eklendi, süresi dolarsa `hata` durumuna düşer ve 3.5sn sonra kendini sıfırlar — artık sonsuza kadar kilitlenmiyor.

- 2026-09-22 — DÜZELTİLDİ (Kaan direktifi, "öğrenme + doğallık, hepsini şimdi sırayla"): İKİ arıza bulunup düzeltildi.
  (1) MESLEKTAŞ HAFIZASI — aşama (seans sayısı) ile gerçek bilgi (doktor_hafiza kayıtları) birbirinden KOPUKTU: `sohbettenOgren` (gerçek öğrenmeyi yazan tek fonksiyon) yalnız yazılı sohbet/"Ayşe'ye Danış" ekranına bağlıydı; Dr. Gökhan'ın aslında kullandığı yüzeyler (not içi "Ayşe ile bu notu konuşun" kutusu, sesli muayene) hiçbir şey öğretmiyordu — 10. seansta "MESLEKTAŞ" tonu ("bilinen tercihleri SORMADAN uygula") tetiklenirken hafıza pratikte BOŞ olabiliyordu (sahte tanıdıklık). Düzeltme: `not-konsult` ve sesli muayene bitimi (`sessions/[id]/end`, `ses-yukle`) artık aynı `ogrenmeyeDeger`/`sohbettenOgren` kapısından geçiyor (sesli muayenede yalnız DOKTOR etiketli/anlatım metni kullanılıyor). Ayrıca `asamaKurali` artık `kesinKayitlar.length > 0` bakar — gün sayısı MESLEKTAŞ/ORTAK seviyesinde olsa bile hiçbir şey öğrenilmemişse Ayşe "SORMADAN uygula" DEMEZ, bildiğini varsaymaz — gün sayısı yüksek + bilgi yok artık sıcak ama dürüst bir ton üretiyor.
  (2) DOĞALLIK — `lib/asistan/personaEngine.ts`: her eylem sonrası birebir aynı "Başka bir şey var mı Hocam?" kapanışı ZORUNLU idi (onlarca seansta belirgin bot izi) — kural artık çeşitlilik istiyor, sabit kapanış değil. Proaktif uyarı örnekleri (doz/etkileşim/alı vs.) birebir kalıp olarak verilmişti — modele "bunlar üslüp örneğidir, kelimesi kelimesine kopyalama" uyarısı eklendi. `npm test` çalıştırıldı: 2534 testten 2533 geçti, personaEngine/sistemParcalari testleri (sabit+değişken = eski prompt eşitliği) dahil yeşil.
  AÇIK KALAN (ilerideki bir tur için): sesli canlı Ayşe (ElevenLabs gerçek zamanlı konuşma ajanı, muayene kaydı değil) henüz bu öğrenme kancasına bağlı değil — o akış Next.js sunucusuna tur tur dönmüyor, ayrı bir entegrasyon gerekir.

- 2026-09-22 — YENİ BULGU (ilgisiz, `npm test` tam koşumunda görüldü, benim değişikliklerimle alakasız): `NOTYA-EYLEM-24` muhafız testi (`core/eylemler/tests/sessizYol.test.ts`) KİRMİZI — `app/api/doktor/{pediatri,goz,gebelik,dermatoloji}/_kohort.ts` `hasta_mesaj_konulari` tablosuna eylem omurgasının DıŞINDA, doğrudan yazıyor (sessiz yazı yolu kapandı kuralının istisnası). Başka hiçbir test etkilenmedi (2534/2534 → 2533/2534). İncelenip ya bu 4 dosya eylem kartına taşınmalı ya da test bilinçli bir istisna olarak güncellenmeli.

- 2026-09-22 — DÜZELTİLDİ: yukarıdaki NOTYA-EYLEM-24 bulgusu gerçek mimari kusurdu, test gevşetilerek değil dosya bölünerek düzeltildi — 4 _kohort.ts dosyasında (pediatri/göz/gebelik/dermatoloji) salt-okunur kohort-toplama (sohbet/ses arama yolundan da içe aktarılıyor) ile hasta_mesaj_konulari'na YAZAN hatırlatma fonksiyonu aynı dosyadaydı; statik ithalat-grafiği dosya bazında baktığı için yazma fonksiyonu hiç çağrılmasa bile dosyayı "sohbet/sesten yazılabilir" sayıyordu. Her 4 hatırlatma fonksiyonu yeni bir `_kohortHatirlatma.ts` dosyasına taşındı (yalnız kohort/route.ts çağırır, sohbet/ses giriş noktalarından erişilemez); lib/security/hastaIzolasyonEnvanteri.ts'e 4 yeni dosya + kd-kohort.test.ts'teki bir yan etki (`.from()` sayım eşiği artık iki dosyanın toplamına bakıyor) düzeltildi. `npm test`: 2534/2534 yeşil.
  Aynı PR'da ikinci düzeltme (Kaan direktifi, önceki turda tespit edilen boşluk): canlı sesli Ayşe (ElevenLabs gerçek zamanlı konuşma ajanı) hafıza öğrenme döngüsüne hiç bağlı değildi — SDK zaten her turu `onMessage` ile tarayıcıya veriyormuş (webhook/dashboard konfigürasyonuna gerek yokmuş); app/asistan/page.tsx'e bir `messagesRef` eklendi, konuşma biterken (`endConversation`) doktor tarafı metinleri yeni `/api/asistan/ses-ogren` rotasına `keepalive: true` ile gönderiliyor, o rota da aynı `ogrenmeyeDeger`/`sohbettenOgren` kapısından geçiriyor. Klinik tabloya yazmıyor — yalnız doktor_hafiza/doktor_iliski. Güvenlik envanterine eklendi.
  Branch: fix/eylem24-ve-sesli-ogrenme.

- 2026-09-22 — EKLENDİ (Kaan direktifi: "iş sırası + tempo da öğrenilsin, yalnız açık söylenenler değil"): `lib/doktor/hafiza.ts` — 5-seanslık özet çağrısı (`ozetGerekirseGuncelle`) artık iki ek gözlem girdisi alıyor: `sohbetOrnekleriDerle` (doktorun kendi mesajlarından birebir örnek, en son 4 asistan_sessions oturumundan — tempo/üslup için) ve `eylemSirasiOzeti` (asistan_actions'tan LLM'siz çıkarılan seans-içi eylem sırası, "A→B→C", yalnız en az 2 anlamlı adımlı seanslarda). Haiku özet promptu bu ikisini görerek paragrafa doktorun gerçek konuşma temposunu ve tekrar eden iş sırasını (varsa, net değilse bahsetmeden) katar — ayrı bir LLM çağrısı değil, mevcut 5-seans çağrısına binen ek metin (ekonomi bozulmaz). `npm test`: 2534/2534 yeşil. Branch: feat/tempo-ve-is-sirasi.

- 2026-09-22 — AÇIK (Kaan direktifi: "tüm branşlar pediatri/KD-Jine seviyesine"): bu başlanmıyor çünkü kod tabanı taraması (specialties/ klasör derinliği + app/api/doktor/<brans> satır sayısı) gösteriyor ki dahiliye (1105 satır, 39/32 dosya), dermatoloji (973, 57/20), göz (896, 29/7), gebelik+jinekoloji (778+513, 52/21) zaten ciddi özel motor/protokol/UI'a sahip — kalan ~24 branş (kardiyoloji, nöroloji, KBB, psikiyatri, romatoloji, vb.) 315–450 satır aralığında, hala böyle bir özel klinik protokol motorundan yoksun (paylasılan pediatri-şekilli tabanı kullanıyor). Bu LOC taraması kaba bir göstergedir, gerçek klinik eksiklik listesi değil — Kaan'ın kendi kurduğu süreç ("discuss first, then implement", her branş için Türkiye kılavuzu araştır) her branş için ayrı bir araştırma turu gerektiriyor; 24 branşı tek oturumda, araştırmadan, kılavuz doğrulamadan kodlamak yanlış klinik içerik riski taşır. 2026-09-14 dalga sırasına göre (KD → Dermatoloji → Aile Hekimliği) ilk ikisi zaten yapıldı; sıradaki Aile Hekimliği, veri de bunu doğruluyor (315 satır, hala taban seviyesinde). Önerilen sonraki somut adım: Aile Hekimliği için Türkiye kılavuz araştırması (SB birinci basamak, TAHUD) + bölüm planı — Kaan onaylayınca inşa başlar (kendi süreci: research → discuss → implement).

- 2026-09-22 — YENİ ÖZELLİK (NOTYA-GECMIS-MUAYENE-01, Dr. Gökhan'ın çoklu-muayene test hastası ihtiyacından): takvimden randevu tarihi seçip muayene başlatmanın notu backdate ETMEDİĞİ doğrulandı (`sessions.started_at`/`notes.created_at` her zaman DB varsayılanı NOW(), randevuyla hiç bağlantısı yok) — Ayşe'nin "bunu yapamam" demesi doğruydu, hayal değildi. Bunun yerine "Yeni Seans" ekranına (`app/session/new/page.tsx`) opsiyonel "Geçmişe dönük tarih" alanı eklendi (datetime-local, max=şimdi) — doktor kendi seçtiği tarihi girer, boş bırakırsa hiçbir şey değişmez. Hem yazılı/sesli dikte yolunda (`sessions/[id]/end`) hem dosya yükleme yolunda (`sessions/ses-yukle`) sunucu tarafında da doğrulanıyor (yalnız geçmiş, en fazla 10 yıl öncesine kadar — gelecek/geçersiz tarih sessizce yok sayılır, istemciye güvenilmez). Mali müşavirlik/allied-health yolları kapsam dışı bırakıldı (farklı ürün). `npm test`: 2534/2534 yeşil. Branch: feat/gecmis-muayene-tarihi.
  Dr. Gökhan'a iletilecek: artık "Yeni Seans" ekranında muayeneyi başlatmadan hemen önce "Geçmişe dönük tarih" alanı var — orada istediği tarihi seçip her muayeneyi o tarihle kaydedebilir, takvime hiç gerek yok.

- 2026-09-22 — YAPILACAK (Kaan direktifi, NOTYA-GECMIS-MUAYENE-01 üzerine): "Geçmişe dönük tarih" alanı şu an her doktora görünüyor — bu geçici, Dr. Gökhan'ın çoklu-muayene test hastasını kurması için. Dr. Gökhan işini bitirince bu SERBEST (rastgele 10 yıla kadar geriye tarih seçebilme) alan normal deneme/ücretli doktorlara GÖRÜNMEMELİ — keyfi geriye tarihleme veri bütünlüğü/istismar riski taşır. Kapatma şekli: ya bir feature-flag/beta-doktor listesiyle görünürlüğü kilitle, ya da alanı tamamen kaldır ve NOTYA-RANDEVU-TARIH-01 (aşağıdaki randevu-bağlı otomatik tarih özelliği) yeterliyse ona devret. Dr. Gökhan'ın test hastası tamamlandığında bu maddeyi uygula.

- 2026-09-22 — YENİ İSTEK (Dr. Gökhan, Kaan aracılığıyla — NOTYA-RANDEVU-TARIH-01): tüm muayeneler bir randevuyla başlıyor; doktor onay verdiğinde muayenenin zaman damgası şu anki "onay/işlem anı" yerine o randevunun tarih+saatiyle eşleşmeli. Kod incelemesi bulgusu: `app/dashboard/doktor/randevular/page.tsx`'teki "🩺 Muayeneyi Başlat" butonu şu an `/session/new?patientId=...` açıyor, randevunun kendi tarih/saatini HIÇ taşımıyor — kopukluk burada. Kaan uygulama planındaki "DÜZENLENEBİLİR bırakılır" önerisini DÜZELTTİ: doktorun değer düzenleyebilmesi "cook the books" riski — tüm doktorlar için kalıcı randevu-bağlı tarih OTOMATİK ve DÜZENLENEMEZ olmalı.

- 2026-09-22 — UYGULANDI (NOTYA-RANDEVU-TARIH-01, Kaan'ın düzeltmesiyle): "🩺 Muayeneyi Başlat" (hem gün görünümündeki hem modal içindeki iki düğme) artık randevunun `baslangic` değerini `randevuBaslangic` query paramıyla `session/new`'e taşıyor. `session/new` sayfasında bu değer SALT-OKUNUR bir rozet olarak gösteriliyor ("Bu muayene randevu saatiyle kaydedilecek: ...") — düzenlenebilir bir alan/input DEĞİL, doktorun değiştirebileceği hiçbir kontrol yok. Randevu değerini otomatik kullanır (sunucu tarafında aynı `tarih` paramı üzerinden, NOTYA-GECMIS-MUAYENE-01'deki doğrulamayla aynı mekanizma); randevusuz (walk-in) muayenede parametre yok, davranış aynen bugünkü gibi kalır (şimdiki zaman) — Kaan'ın sorduğu tam olarak buydu. NOTYA-GECMIS-MUAYENE-01'deki ayrı manuel test alanı (geçici, Dr. Gökhan'ın test hastası için) hala duruyor ve dokunulmadı — aynı gating TODO'su (yukarıda) hala geçerli, iki mekanizma birbirinden bağımsız (manuel alan set edilmişse o öncelikli, randevu değeri yalnız manuel boş bırakıldığında devreye girer). `npm test`: 2543/2543 yeşil. Branch: feat/randevu-tarih.
  ARA OLAY: bu özellik ilk kez uygulanırken (commit henüz atılmamış, iş ağacında) Cursor'ın KLINIK-AYNA-01 push'ı onay alınmadan yapılmış (Kaan: "screwed up") ve tip hatalarıyla `main`'i kırmıştı; Cursor bunu geri alırken aynı çalışma dizininde (`~/notya-ai`) yaptığı işlem Claude'un henüz commit edilmemiş yerel değişikliklerini de sildi — iş kaybolmadan (Claude hafızasından) yeniden uygulandı ama bu, aynı klasörü paylaşan ajanların birbirinin commit edilmemiş işini silebileceğini gösteriyor. İkinci belirti: docs commit'i ilk denemede yanlışlıkla başka bir yerel dala (Cursor'ın çalıştığı varsayılan `feat/klinik-10-exceptional`) düştü — paylaşılan dizinde çalışırken hangi dalın checkout edildiği herhangi bir anda değişebiliyor. İleride: her ajan kendi feature branch'inde çalışıp sık sık commit etsin (yalnız iş ağacında tutmak riskli), commit öncesi `git branch --show-current` ile doğrulansın.
