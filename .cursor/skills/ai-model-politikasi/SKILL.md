---
name: ai-model-politikasi
description: >-
  Notya'da bir LLM çağrısı (Anthropic/OpenRouter) eklerken veya değiştirirken
  uygulanan ZORUNLU kural: model adı asla dosyaya string olarak yazılmaz;
  model lib/ai/modeller.ts'teki merkezi politikadan alınır, çağrı
  lib/ai/cagir.ts'ten geçer. Birincil model HER görevde GPT-6 Luna
  (görsel/PDF dahil); Sonnet 5 yalnız dört kapıdan (G1 transport, G2 kalite,
  G3 güvenlik, G4 devre) ulaşılan koruyucudur (Kaan, 2026-09-29:
  düzenli Luna; kapılar LUNAPRO-01). 30+ branşın tamamı için geçerlidir — yeni bölüm
  (chapter) yazarken de uygulanır.
---

# AI model politikası (tüm branşlar, tüm uygulama)

**Birincil slug (Kaan, 2026-09-29):** `openai/gpt-6-luna`. Kapılar LUNAPRO-01
(2026-09-27) durur. Luna-Pro (`reasoning.mode=pro`) gecikme için kapatıldı.

| Rol | Model | Ortam değişkeni | Taşıma |
|---|---|---|---|
| **Birincil** (her görev) | `openai/gpt-6-luna` | `NOTYA_MODEL_HIZLI` | OpenRouter |
| **Koruyucu** (yalnız G1–G4) | `anthropic/claude-sonnet-5` | `NOTYA_MODEL_GUCLU` | OpenRouter; `OPENROUTER_API_KEY` yoksa Anthropic doğrudan |

Birincil: SOAP (`soap`), mesleki not (`not-uretimi`), klinik analiz
(`klinik-analiz`), görüntü/belge okuma (`goruntu-inceleme` — görsel ve PDF
dahil, model dosya + görsel girdisini destekler), hukuk (`uzman-analiz`),
uzman sohbet (`sohbet-uzman`) ve bütün hızlı işler. `GOREV_POLITIKASI`'nda
her görev `kademe: 'hizli'`; kademe artık "birincil mi koruyucu mu" demektir,
`maxTokens` görev başına aynen durur (F3).

**Ölçüt: koruyucu payı.** `v_model_yedek_gunluk` (migration 106) gün × görev
başına toplam çağrı, koruyucu çağrı, pay ve neden dağılımı. **Hedef < %15.**
Pay bunun üstüne çıkarsa önce `neden` dağılımına bak (transport → sağlayıcı;
low_conf → prompt/şema; devre → kesinti), sonra karar ver.

## Tek kaynak

- `lib/ai/modeller.ts` — `modelSec(gorev)`, `gucluModel()`, `hizliModel()`,
  `asistanModelYonlendir()`, `guvenlikSinyaliVar()`, `dusukGuvenMi()`.
  Varsayılan slug'lar yalnız burada.
- `lib/ai/cagir.ts` — `aiCagir` / `aiAkis`: tek kapı; G1–G4, ölçüm, konsol satırı.
- `lib/ai/devre.ts` — G4 devre kesici.
- `lib/ai/jsonOnar.ts` — F3 JSON onarıcı (SOAP ve G2 (d) aynı algoritma).
- `lib/ai/saglayici.ts` — OpenRouter ↔ Anthropic biçim çevirisi (system
  blokları, görsel/PDF, `tool_use` ↔ `tool_calls`, SSE akışı, usage). Önekleri
  (`openai/`, `anthropic/`) bilen tek diğer dosya.

`lib/ai/model-sizmasi.test.ts` bunu **zorlar**: `claude-(sonnet|haiku|opus)-<sürüm>`,
`gpt-<sürüm>`, `openai/…`, `anthropic/…` ve `luna-pro` yalnız bu dosyalarda
geçebilir; `messages.create` / `api.anthropic.com` yalnız `cagir.ts`'te,
`openrouter.ai` yalnız `saglayici.ts`'te. Yeni bir rotaya model adını elle
yazarsan test kırılır.

## Dört kapı

Her düşüş `ai_token_kullanim.neden`'e yazılır ve konsola tek satır düşer:
`[ai/yedek] istek=<id> gorev=<gorev> neden=<neden> alt=<kod>` — prompt,
hasta, cevap metni **yok**.

### G1 — transport (`neden = transport`)
5xx, zaman aşımı (25 sn; uzun işlerde max_tokens'la 60 sn'ye kadar), boş
gövde, ağ hatası, 429 → **birincil → 400 ms → birincil bir kez → Sonnet 5.**
4xx istek hatası düşmez (çağırana gider). Alt kod: `http_<durum>`.

### G2 — kalite (`neden = low_conf`), istek başına EN FAZLA BİR kez
Birincilin cevabı gelince, şunlardan biri doğruysa aynı istek Sonnet 5'e gider
(koruyucunun cevabı yeniden denetlenmez):

| | Koşul | Alt kod |
|---|---|---|
| a | içerik boş / yalnız boşluk | `bos` |
| b | ret (`refusal` / `content_filter`) | `ret` |
| c | düşük güven ("daha fazla bilgi şart", "emin değilim"…) | `dusuk_guven` |
| d | **yapılandırılmış iş**: F3 onarımının da kurtaramadığı JSON, ya da max_tokens kesilmesi | `json` / `kesildi` |
| e | bilinmeyen araç adı ya da JSON olmayan araç argümanı | `arac_adi` / `arac_json` |
| f | SOAP gövdesi `ai_confidence < 0.6` → gövde (A) Sonnet 5'te yeniden (`soapUret.ts`) | `soap_guven` |

(d) **Yapılandırılmış iş** = varsayılan `soap`, `not-uretimi`,
`goruntu-inceleme`; başka görevde JSON bekleyen çağrı yeri
`jsonBekleniyor: true` verir (lab yorumu, doz önerisi, e-reçete, SGK raporu,
ilaç sonlandırma, gelen belge, SOAP öneri çağrısı, sözleşme analizi,
`groqChat` jsonMode). Düzyazı üreten görüntü işi `jsonBekleniyor: false`
verir (konsültasyon yanıt özeti). **Kurtarılabilen JSON düşmez** (kod çiti,
sondaki düzyazı, stop ile yarım kalmış dizi).

(f) not zamanlaması: yalnız birincil açıkça başaramadığında bir çağrı süresi
eklenir; uzun cevap tek başına yeniden yazdırmaz. Gövde zaten koruyucudan
geldiyse (G1/G3/G4) yeniden yazılmaz; koruyucu da düşerse birincilin notu
kullanılır.

**Sesli akış (`aiAkis`)**: yalnız ilk metin parçasından **önce** düşer
(taşıma, boş, ret, bozuk araç). İlk sözden sonra kopan akış kesik tur olarak
döner (`stop_reason: max_tokens`) — F3 kurtarma ve `DEVAMI_EKRANDA` /
devam yolu işler; söylenmiş söz **asla yeniden söylenmez**.

### G3 — güvenlik (`neden = safety`), çağrıdan ÖNCE
`guvenlikSinyaliVar(kullanıcı mesajı + guvenlikBaglami)`: gebe/gebelik,
emzirme/laktasyon, pediatrik doz / mg/kg, warfarin, NSAİİ (ibuprofen,
naproksen, diklofenak), isotretinoin, kontrendikasyon. Hasta dosyası system'e
konuyorsa çağrı yeri onu `guvenlikBaglami` olarak da verir (modele ayrıca
gitmez). Sabit system metni (kurallar, branş kilidi) taranmaz. Listeyi
değiştirmek ürün kararıdır.

### G4 — devre (`neden = devre`)
Birincil model 5 dakikada ≥5 G1/G2 hatası verdiyse **10 dakika bütün
çağrılar Sonnet 5**; sonra yarı açık: tek yoklama birincile gider — başarı
kapatır, hata 10 dk daha açar. Durum süreç içidir (dış depo yok); Vercel
örnekleri bağımsızdır, soğuk örnek kapalı devreyle başlar. Testler:
`devreDurumu()`, `devreSifirla()`, `DEVRE_SAAT`.

**Emekli (2026-09-26/27):** görev (`uzman`), Onayla (`onayla`) ve görsel
(`vision`) zorunlu yükseltmeleri — `gorevNedeni()` her görevde null;
LUNA-01'in 3 numaralı pazarlık dışı kuralı (GÖRSEL = GÜÇLÜ); karar A. Eski
neden değerleri geçmiş satırlar için check listesinde durur.

## Kod seviyesinde güvenceler (kaldırma)

1. **Ham asistan metni hastaya gitmez.** Model değişikliği bunu değiştirmez.
2. **F3:** kesinti hekime ham JSON göstermez. OpenRouter'ın `finish_reason:
   length` değeri `stop_reason: max_tokens`'a çevrilir; F3 / karne / görüntü
   korumaları aynen çalışır. `maxTokens` düşürürken F3'ü kırma.
3. **Branş alan sızması, hasta izolasyonu** kuralları model seçiminden
   bağımsızdır, aynen geçerlidir.

## Taşıma ve gizlilik

- `OPENROUTER_API_KEY` doluysa iki model de OpenRouter'dan gider (ödeme tek
  yerden). Başlıklar: `Authorization`, `HTTP-Referer`
  (`NOTYA_OPENROUTER_APP_URL`), `X-Title` (`NOTYA_OPENROUTER_APP_TITLE`).
- Her OpenRouter isteği `provider: { data_collection: "deny" }` taşır.
- Boşsa (yerel / test) Anthropic modelleri eski doğrudan yoldan (SDK istemcisi
  ya da `/v1/messages`) önek atılarak gider; birincil (OpenAI) gidemez →
  Sonnet 5 (`neden = transport`). Kapılar (G1, G2, G4) yalnız OpenRouter'daki
  birincil çağrıda çalışır.
- **Yapmadığı şey:** OpenRouter Türkiye dışındadır. Bu geçiş KVKK yurt dışı
  aktarım konusunu çözmez; öyleymiş gibi yazma.

## Geri dönüş anahtarı (kill switch)

Kod değişmeden, tek yeniden dağıtımla (Vercel ortam değişkeni):

- `NOTYA_MODEL_HIZLI=anthropic/claude-sonnet-5` → **her şey** Sonnet 5'e döner.
- `NOTYA_MODEL_HIZLI=openai/gpt-6-luna-pro` → Luna-Pro'ya döner.
- `NOTYA_MODEL_GUCLU=…` → koruyucu değişir. Geçersiz değer → varsayılan.
- Dikkat: ortamda `NOTYA_MODEL_HIZLI=openai/gpt-6-luna-pro` kaldıysa kod varsayılanını **ezer**.

Varsayılan olarak `gpt-5.6-luna*` ve `claude-sonnet-4.x` seçilmez
(`model-sizmasi.test.ts` kilitler).

## Tasarruf buradan gelir

1. **Prompt caching** — `onbellek: true` → `cache_control: { type: 'ephemeral' }`, en fazla 4 kırılma.
   Paylaşılan önek (persona, kılavuz, kurallar, uygulama rehberi) hekim adı, tarih, hafıza ve hasta taşımaz.
   Hitap ayrı kırılmadır. Kararlı dosya gövdesi yalnız son kırılmada, o hekim + o hasta için durur; kesin cümle,
   kanıt ve gün özeti önbelleklenmez (soru öneki bozmasın). Klinik cevap soru metninin hash'iyle sunulmaz.
   Çapraz hekim okuması yok.
2. **Bağlam disiplini** — sohbet geçmişi kısa (`SOHBET_GECMIS_MESAJ`),
   `maxTokens` görev tipine göre gerçekçi.
3. **Koruyucu payını düşük tut** — prompt ve şema birincilde ilk seferde
   geçerli JSON üretecek kadar net olsun; G2 düşüşü hem maliyet hem süre.

## Ölçüm

Her çağrı `ai_token_kullanim`'a yazılır: `input_tokens`, `output_tokens`,
`cache_read`, `cache_creation`, `model`, `kademe`, `neden`
(transport | low_conf | safety | devre | null), `gorev`, `doctor_id`,
`kesildi`. G2 düşüşünde iki satır olur (birincilin reddedilen cevabı + koruyucu);
G1'de birincil satırı yoktur. **Prompt içeriği veya hasta verisi
kaydedilmez.** `ai_kullanim` NOTYA-KOTA-01'in kota tablosudur — ona yazılmaz.

## Yeni çağrı / yeni branş (chapter) yazarken

1. Model adı yazma — `aiCagir({ gorev, … })` kullan.
2. Çağıran cevabı JSON olarak ayrıştıracaksa `jsonBekleniyor: true` ver
   (varsayılan yapılandırılmış görevlerde gerekmez); düzyazı üreten görüntü
   işinde `jsonBekleniyor: false`.
3. Hasta dosyası system'e giriyorsa `guvenlikBaglami` ile de ver (G3).
4. Araç veriyorsan `araclar` listesindeki adlar dışında bir çağrı G2 (e)
   ile düşer — adları tutarlı tut.
5. System promptun sabit kısmını caching'e uygun yaz. Branş alan sızması ve
   hasta izolasyonu kuralları aynen geçerlidir.
