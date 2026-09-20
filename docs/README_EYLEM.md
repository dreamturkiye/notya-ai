# NOTYA-EYLEM — Ayşe dosyaya yazar (as-built)

**Durum:** 2026-09-19 tarihinde `feat/ayse-eylem` ile birleşti; aynı gün `fix/eylem-sessiz-yol-ve-etkilesim`
ile **eski sessiz yazma yolu kapatıldı** (NOTYA-EYLEM-24) ve **ilaç uyarıları karta basıldı**
(NOTYA-EYLEM-21). Mimari not: `docs/AYSE-EYLEM-MIMARISI.md`.
Bu dosya NE YAPILDIĞINI anlatır; tasarım gerekçesi mimari nottadır, açık kalemler
`docs/OPEN-COMMITMENTS.md` § NOTYA-EYLEM'dedir.

## Neden

Dr. Gökhan Mamur, "Ayşe'ye Danış"ta doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi.
Ayşe *"veri girişi yapabilen bir araç değilim"* dedi. Bu cümle kodda hiçbir yerde yazmıyordu — bir
modelin, prompt'unda hiç yazma sözcüğü olmadığında söylediği şeydi. Düzeltme bir reddi silmek değil,
yeteneği **sözle ve kodla** eklemekti.

## Kilitli ilişki modeli

**Ayşe HAZIRLAR, hekim KAYDEDER.** Model hiçbir şey yazmaz. Araç çağrısı yalnız bir `eylem_onerileri`
satırı (taslak) üretir; kaydı hekimin onay kartına dokunuşu yapar. Cihaz Köprüsü ile aynı kural:
onay kartı HER ZAMAN, sessiz yazma ASLA. Denetim okuması: **hazırlayan = Ayşe, onaylayan = hekim.**

## Dosyalar

| Dosya | İş |
|---|---|
| `core/eylemler/types.ts` | `EylemTanimi`, kademe/kaynak/yüzey tipleri, TRT tarih yardımcıları |
| `core/eylemler/z.ts` | zod biçimli doğrulayıcı (npm `zod` YOK — `specialties/dermatoloji/z.ts` kopyası, gövdesi birebir) |
| `core/eylemler/sema.ts` | `alanlar` → zod şeması **ve** Anthropic `input_schema`; tarih normalizasyonu |
| `core/eylemler/temelEylemler.ts` | TEMEL eylemler (her branşta aynı) |
| `core/eylemler/bransEylemleri.ts` | Branşa özel eylemler (açık kapı, varsayılan yok) |
| `core/eylemler/kayit.ts` | Kayıt defteri; yükleme anında tekillik + T3 denetimi |
| `core/eylemler/araclar.ts` | Kayıt → Anthropic araç tanımları; branş + hasta süzgeci; ~15 tavan; kill switch |
| `core/eylemler/oneri.ts` | `tool_use` → taslak. **Tahmin asla değer olarak yazılmaz** |
| `core/eylemler/onayla.ts` | ONAY: sahiplik, süre, korumalı durum geçişi (idempotans), zod, zorunlu, makullük, yazma, denetim |
| `core/eylemler/geriAl.ts` | 24 saat içinde T1 geri alma; loglanır |
| `core/eylemler/bosluk.ts` | P2 proaktif boşluk teklifi (LLM'siz, bir kez) |
| `core/eylemler/yasakli.ts` | T3 anahtarları + **eski sessiz yol tip adları** — yokluğu sınanır |
| `core/eylemler/ilacUyari.ts` | İlaç güvenlik uyarıları (alerji / aynı etken / etkileşim / pediatrik) — LLM'siz |
| `core/eylemler/istem.ts` | Yetenek paragrafı — her yüzeye AYNI metin |
| `core/eylemler/hasta.ts` | Hasta kimliğinin SUNUCU tarafında çözümü (model çıktısından asla) |
| `components/core/EylemKarti.tsx` | Onay kartı + toplu kart |
| `app/api/doktor/eylem/route.ts` | `POST adim: onayla \| vazgec \| geri_al \| toplu_onayla`, `GET ?hastaId` |
| `lib/asistan/actionExecutor.ts` | **Eski eylem kapısı** — sınıflandırır, YAZMAZ (NOTYA-EYLEM-24) |
| `lib/db/migrations/085_ayse_eylem.sql` | `eylem_onerileri`, `eylem_kayitlari` + RLS |
| `lib/db/migrations/086_eylem_ilac_uyarilari.sql` | `uyari_detay` (öneri) + `uyari_onayi` (kayıt) |

### Paylaşılan yazma yolu için çıkarılanlar (ikinci yazma yolu YOK)

| Yeni paylaşılan işlev | Kim kullanıyor |
|---|---|
| `lib/doktor/hastaKayitAlanlari.ts` — `patients.notes_encrypted` içindeki alerji/kronik | `alerji_ekle`, `alerji_kaldir`, `kronik_hastalik_ekle` |
| `lib/doktor/gununNotunaEkle.ts` → `gununNotunaVitalEkle`, `notVitalleriGeriYukle` | `olcum_ekle`, `bas_cevresi_ekle` |
| `lib/randevu/cakisma.ts` — randevu çakışma yüklemi | `POST /api/doktor/randevular`, `PATCH .../[id]`, `kontrol_randevusu_olustur` |

## Eylemler (14)

**T1 — tek dokunuş, eklemeli, geri alınabilir**

| Anahtar | Yazdığı yer | Notlar |
|---|---|---|
| `asi_kaydi_ekle` | `asilar` | `kaynak`: `kayit` (bu muayenehane) / `beyan` (dış kurum) |
| `ilac_ekle` | `hasta_ilaclar` | `aktif=true`, `onay_durumu` kolon varsayılanı (`onayli`) → **Sağlığım'da görünür** |
| `alerji_ekle` | `patients.notes_encrypted.alerjiler` | |
| `kronik_hastalik_ekle` | `patients.notes_encrypted.kronikHastaliklar` | |
| `olcum_ekle` | bugünkü notun `vitaller`'i | boy, kilo, ateş, nabız, SpO₂, tansiyon |
| `bas_cevresi_ekle` | bugünkü notun `vitaller`'i | **Ayrı eylem** — pediatrik ölçüm kapsamı olmayan branşa hiç sunulmaz |
| `kontrol_randevusu_olustur` | `randevular` | TRT; paylaşılan çakışma kontrolünden geçer |
| `dosya_notu_ekle` | bugünkü notun değerlendirmesi | geri alma yok (metin sonradan düzenlenmiş olabilir) |

**T2 — önce → sonra farkı + dokunuş** (`ilac_sonlandir`, `ilac_doz_degistir`, `alerji_kaldir`,
`hasta_bilgisi_duzelt`). Geri alma yok: fark zaten dokunuştan önce gösterildi; hekim ilgili ekrandan düzeltir.

**Branşa özel (P3):** `jine_gorevi_ekle` (kadın hastalıkları ve doğum), `derm_gorevi_ekle`
(dermatoloji), `dahiliye_gorevi_ekle` (dahiliye). Pediatri kendi eylemini gerektirmiyor: aşı ve
büyüme ölçümleri zaten temel eylemler, baş çevresi kapıyı kapsam motorundan alıyor.

**T3 — bu yoldan ASLA:** reçete/e-reçete, not onayı, resmi tanı kilidi, onam, her türlü silme,
sistemden çıkan her şey (FHIR/HL7/Medula/e-Nabız, hastaya mesaj). Kayıt defterinde **yoklukla**
zorlanır; `core/eylemler/tests/eylem.test.ts` hem yasaklı listeyi hem yasaklı FİİLİ (regex) arar.

## Yüzeyler

| Yüzey | Rota | Kart nerede |
|---|---|---|
| Ayşe'ye Danış (hasta dosyası) | `POST /api/doktor/konsult` | `components/doktor/HastaKonsult.tsx` — mesaj akışında + **bekleyen tepsisi** |
| Yazılı sohbet (`/asistan`) | `POST /api/asistan/chat` | `components/asistan/YaziliSohbet.tsx` |
| Not içi Ayşe kutusu (İnceleme) | `POST /api/doktor/not-konsult` | `app/dashboard/doktor/inceleme/page.tsx` |

Üç yüzey de aynı `core/eylemler` omurgasını, aynı yetenek paragrafını (`istem.ts`) ve aynı kartı
kullanır. Yeni ekran yok. Bekleyen tepsisi (`GET /api/doktor/eylem?hastaId`) hasta dosyasında durur:
bir yüzeyde hazırlanan kart, konuşma kapansa bile hastanın dosyasında bekler.

## Güvenlik ve kalite güvenceleri

- **Tahmin asla değer değildir.** Model bir alanı `tahmin` işaretlerse (ya da hiç kaynak bildirmezse)
  değer DÜŞER, alan `eksik_alanlar`'a girer, kartta sarı-boş görünür ve zorunluysa **Kaydet kapalıdır**.
  "Tahminen Eylül 2026" hatası yapısal olarak imkânsız: geçilecek bir değer yok.
- **Hasta kimliği sunucuda çözülür** (`core/eylemler/hasta.ts`, `doctor_id` kapsamlı). Model çıktısındaki
  hiçbir kimliğe güvenilmez. Belirsiz hasta → araç sunulmaz, Ayşe sorar.
- **HASTA-IZOLASYON-01:** öneri ve kayıt `doctor_id` ile yüklenir; hasta sahipliği yazmadan önce
  `hastaSahibiMi` ile yeniden kanıtlanır; yabancı kimlik 404. Çapraz-doktor paketinde dört vaka
  (`GET`, `onayla`, `vazgec`, `geri_al`) A↔B iki yönde koşar.
- **Yetki:** rota `doktorOturum` kullanır — sekreter klinik kayıt onaylayamaz.
- **İdempotans:** `taslak → onaylandi` geçişi TEK korumalı UPDATE. Çift dokunuş ikinci kez 409 alır,
  satır bir kez yazılır.
- **Makullük ve mükerrer** hem kart hazırlanırken (uyarı) hem ONAY anında (ret) koşar.
- **Süre:** öneri 24 saatte `suresi_doldu`; geri alma penceresi 24 saat.
- **Kill switch:** `AYSE_EYLEM_KAPALI=1` → araç sunulmaz, Ayşe özetlemeye döner.
- **Belge metni güvenilmezdir:** araçlar yalnız doktor turunda sunulur; hiçbir şey dokunuş olmadan yazılmaz.
- **Model politikası:** yeni model çağrısı YOK. Araç tanımları mevcut çağrıya eklenir (`lib/ai/cagir.ts`
  → `araclar`), yetenek paragrafı önbelleklenen sabit bloğa girer. Yeni satıcı, yeni maliyet kalemi yok.

## Eski sessiz yazma yolu — KAPALI (NOTYA-EYLEM-24)

P1–P3 şiplendiğinde `lib/asistan/actionExecutor.ts` yerinde bırakılmıştı: yeni hiçbir şey ona
yönlenmiyordu ama `/api/asistan/chat` üzerinden **hâlâ erişilebilirdi**. Model bir turda
`{ "action": { "type": "ADD_PRESCRIPTION", … } }` yazarsa satır **hekimin hiçbir dokunuşu olmadan**
veritabanına düşüyordu. Kilitli kural bunu yasaklar: *Ayşe hazırlar, hekim kaydeder; sessiz asla.*

`actionExecutor` artık bir **kapı**: hiçbir tabloya dokunmaz (modülde `supabase` / `createClient` /
`.insert(` yok — testle zorlanıyor). Her eski tip sınıflandırılır:

| Eski tip | Sınıf | Ne oluyor |
|---|---|---|
| `ADD_NOTE_CONTENT` | `klinik_eylem` | `dosya_notu_ekle` **taslağı + onay kartı**; yazmayı hekimin dokunuşu yapar |
| `ADD_PRESCRIPTION` | `klinik_t3` | Yazılmaz, hazırlanmaz bile. Ayşe anlatır, e-Reçete ekranına bağlantı verir |
| `SET_DIAGNOSIS` | `klinik_t3` | Yazılmaz. Muayene notu ekranına bağlantı |
| `CREATE_PATIENT` | `klinik_ekran` | Yazılmaz (kimlik bilgisi işi). Hasta ekle ekranına bağlantı |
| `CREATE_SESSION` | `klinik_ekran` | Yazılmaz — seans açmak **hasta onayını** da kaydediyordu. Hasta dosyasına bağlantı |
| `UPDATE_SESSION` | `klinik_ekran` | Yazılmaz. Muayene notuna bağlantı |
| `GENERATE_DOCUMENT` | `klinik_disi` | Kalır — yalnız bir şablon metni üretir, hiçbir satır yazmaz |
| bilinmeyen / uydurma tip | `klinik_ekran` | **Şüphede klinik**: reddedilir |

Klinik dışı kalanlar: `GENERATE_DOCUMENT` (metin şablonu) ve niyet sınıflandırıcısı
`lib/asistan/intentParser.ts` (yalnız model yönlendirmesi ve ilaç bağlamı için — yazmaz).
Sesli yüzeyin tek aracı `hasta_bul`, o da salt okunur.

**Prompt:** `lib/asistan/personaEngine.ts`'in JSON biçiminden `"action"` alanı **kaldırıldı**;
yerine "dosyaya kayıt bu JSON'dan YAPILMAZ, tek yol araçlardır" cümlesi kondu.

**Muhafız test** (`core/eylemler/tests/sessizYol.test.ts`, 13 test): sohbet/ses giriş noktalarından
içe aktarma grafiği yürünür; grafikteki hiçbir dosya klinik tabloya yazamaz (izinli olanlar yalnız
`core/eylemler/*` ve onun paylaştığı `hastaKayitAlanlari` / `gununNotunaEkle`), grafikte `calistir()`
hiç çağrılmaz, `calistir()`'i omurgada yalnız `onayla.ts` çağırır, sesli ajanın araç listesi salt
okunur, eski tip adları eylem anahtarı olamaz, prompt artık eylem reklamı yapmaz. Mutasyonla
doğrulandı: sohbet rotasına tek bir `notes.update` eklendiğinde test kırmızı.

## İlaç uyarıları kartın üstünde (NOTYA-EYLEM-21)

`ilac_ekle` ve `ilac_doz_degistir` kartları, hekim dokunmadan ÖNCE dört deterministik kontrolden
geçer (`core/eylemler/ilacUyari.ts`). Yeni satıcı yok, yeni model çağrısı yok, yeni ilaç veritabanı
yok: uygulamanın **kendi** ilaç tablosu (`lib/asistan/turkishDrugs.ts`, 18 molekül) + hastanın kendi
kayıtları okunur.

| Kontrol | Kaynak | Şiddet |
|---|---|---|
| Alerji (ad / marka / sınıf ve ilacın "… alerjisi" kontrendikasyonu) | Hasta dosyası + tablo | `ciddi` |
| Aynı etken madde aktif (Parol + Minoset) | Hasta dosyası + tablo | `ciddi` |
| Etkileşim (tablonun kendi `interactions` listesi) | Tablo | `ciddi` |
| Yaş kontrendikasyonu ("6 ay altı bebek") | Tablo | `ciddi` |
| Pediatrik mg/kg dozu (dosyadaki son kiloyla hesaplanır) | Tablo + dosya | `bilgi` |
| İlaç tabloda yok → "etkileşim kontrol edilemedi" | Tablo | `bilgi` |
| **Ayşe'nin notu** — modelin kendi uyarı cümlesi, etiketli | Model | `orta`, **asla `ciddi`** |

**Eşleştirme düzeltildi:** `checkInteractions` eskiden yalnız diğer ilacın `name` alanına bakıyordu,
bu yüzden **sınıf** olarak yazılmış her etkileşim ("NSAIDs", "ACE inhibitörleri", "SSRI/SNRI")
sessizce hiç eşleşmiyordu — ibuprofen + ramipril, naproksen + metilprednizolon, sertralin +
sumatriptan "etkileşim yok" okunuyordu. Motor aynı motor; artık sınıfı tutan alanı (`category`) ve
marka listesini de okuyor. Yanlış pozitife karşı muhafazakâr: bir ifade ancak **bütün** anlamlı
sözcükleri eşleşirse yakalar ("ACE inhibitörleri" → "Proton pompa inhibitörü" değil).

**Kart:** uyarılar alanların ÜSTÜNDE, şiddet renkli (kırmızı / kehribar / mavi), Türkçe,
**asla katlanabilir değil**, her satırda `Kaynak:` var. Bir `ciddi` uyarı hekimi **ENGELLEMEZ** —
yetki hekimdedir — ama düğme önce **"Uyarıyı gördüm, kaydet"**e döner; kayıt ancak o ikinci
dokunuşla gider. Toplu kartta aynı kural satır başına: ciddi uyarısı olan satır, "Uyarıyı gördüm"
kutusu işaretlenmeden seçilemez.

**Sunucu bağımsız zorlar:** `onayla.ts` kontrolü **yeniden** koşar (kart çizildiğinden beri ilaç
listesi değişmiş olabilir) ve onay gelmemişse 409 + güncel uyarılar döner; öneri `taslak` kalır.
Onaylanan kayıtta `eylem_kayitlari.uyari_onayi` = `{ uyarilar, ciddi, goruldu, onaylayan, at }`.

**Hafıza bunu yumuşatamaz.** `ilacUyari.ts` yalnız iki şey içe aktarır (ilaç tablosu + hasta kayıt
alanları); hafıza, tercih ya da persona okumaz. Test hem kaynağı (yorumlar elenerek) hem davranışı
sınar: hafızaya "uyarı gösterme" yazıldığında çıktı birebir aynı kalır ve kapı yine kapalı.

**Bilinen sınır:** tablo 18 molekül taşıyor. Dışındaki bir ilaç için deterministik etkileşim hükmü
verilmez — kart bunu **söyler** ("etkileşim kontrolü yapılamadı"), sessiz kalarak temiz kâğıt
izlenimi vermez. Tam kapsam `docs/OPEN-COMMITMENTS.md` NOTYA-EYLEM-25'te açık kalem.


## Test

```
npx tsx --experimental-test-module-mocks --test core/eylemler/tests/eylem.test.ts
npx tsx --experimental-test-module-mocks --test core/eylemler/tests/sessizYol.test.ts
npx tsx --experimental-test-module-mocks --test core/eylemler/tests/ilacUyari.test.ts
npm run test:izolasyon
npm test
```

`core/eylemler/tests/eylem.test.ts` (37 test): T3 yokluğu, kayıt tutarlılığı, araç süzgeci + branş
kapısı (30+ branş × eylem), tahmin→eksik alan, zod yeniden doğrulama, makullük, mükerrer, idempotans,
süre dolması, geri alma (T1 evet / T2 hayır / 24 saat), branş görevi, proaktif boşluk.

`core/eylemler/tests/sessizYol.test.ts` (13 test): sessiz yazma yolunun kapalılığı — yukarıya bakın.

`core/eylemler/tests/ilacUyari.test.ts` (29 test): alerji (ad / kontrendikasyon / yanlış pozitif yok),
aynı etken madde, sınıf adıyla yazılmış etkileşimlerin artık çalışması, pediatrik yaş ve mg/kg,
Ayşe'nin notunun asla `ciddi` olmaması, onay kapısı (409 → ikinci dokunuş → denetim satırı),
onay anında yeniden koşma, hafızanın kontrolü yumuşatamaması.

`lib/security/hasta-izolasyon.test.ts` — "Asistan eylemleri" vakası artık **yabancı dosyaya da kendi
dosyasına da sessizce yazılamadığını** sınar (eski pozitif kontrol bilerek tersine çevrildi).
