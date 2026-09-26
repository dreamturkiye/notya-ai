---
name: ai-model-politikasi
description: >-
  Notya'da bir LLM çağrısı (Anthropic/OpenRouter) eklerken veya değiştirirken
  uygulanan ZORUNLU kural: model adı asla dosyaya string olarak yazılmaz;
  kademe (GÜÇLÜ = Sonnet 5 / HIZLI = GPT-6 Luna) lib/ai/modeller.ts'teki
  merkezi politikadan alınır, çağrı lib/ai/cagir.ts'ten geçer. Klinik kalite
  maliyetin ÜSTÜNDEDİR: görüntü/inceleme ve hekimin karar verdiği her çıktı
  Sonnet 5'te kalır (karar A, 2026-09-26). 30+ branşın tamamı için
  geçerlidir — yeni bölüm (chapter) yazarken de uygulanır.
---

# AI model politikası (tüm branşlar, tüm uygulama)

**Karar A — Kaan (CEO), 2026-09-26.** 2026-09-19 varsayılanının (GÜÇLÜ =
Sonnet 4.6, HIZLI = Haiku 4.5) yerine:

| Kademe | Model | Taşıma |
|---|---|---|
| **HIZLI** (varsayılan hacim) | `openai/gpt-6-luna` | OpenRouter |
| **GÜÇLÜ** (yükseltme) | `anthropic/claude-sonnet-5` | OpenRouter; `OPENROUTER_API_KEY` yoksa Anthropic doğrudan |

Neden: hacim trafiği GPT-6 Luna'da ucuzdur; **imzalanan klinik çıktı Sonnet
5'te kalır.** Taşıma hatası ile klinik risk iki ayrı kapıdır. OpenRouter'ın
`models: []` dizisi yalnız taşımadır, kalite yönlendiricisi değildir.

2026-09-19'daki öncelik aynen geçerli: *"Kesinlikle application'ın kalitesinin
düşmesini istemiyorum."* → **klinik kalite > maliyet.** Karar A'da
`sohbet-uzman` ve hiçbir klinik görev Luna'ya taşınmadı; HIZLI listesi
2026-09-19'daki dar listeyle aynıdır, yalnız o listenin modeli değişti.

## Tek kaynak

- `lib/ai/modeller.ts` — `modelSec(gorev)`, `gucluModel()`, `hizliModel()`,
  `asistanModelYonlendir()`. Varsayılan slug'lar yalnız burada.
- `lib/ai/cagir.ts` — `aiCagir` / `aiAkis`: tek kapı; iki kapı, GÖRSEL = GÜÇLÜ,
  ölçüm burada.
- `lib/ai/saglayici.ts` — OpenRouter ↔ Anthropic biçim çevirisi (system
  blokları, görsel/PDF, `tool_use` ↔ `tool_calls`, SSE akışı, usage). Önekleri
  (`openai/`, `anthropic/`) bilen tek diğer dosya.

`lib/ai/model-sizmasi.test.ts` bunu **zorlar**: `claude-(sonnet|haiku|opus)-<sürüm>`,
`gpt-<sürüm>`, `openai/…`, `anthropic/…` deseni yalnız bu dosyalarda geçebilir;
`messages.create` / `api.anthropic.com` yalnız `cagir.ts`'te, `openrouter.ai`
yalnız `saglayici.ts`'te. Yeni bir rotaya model adını elle yazarsan test kırılır.

## İki kapı

### A. Taşıma — Luna cevap veremiyor
5xx, zaman aşımı, boş gövde, 429, ağ hatası →
**Luna → 400 ms → Luna bir kez → Sonnet 5.** `neden = transport`.
4xx istek hatası yükseltilmez (çağırana gider). Kapı yalnız HIZLI kademe
OpenRouter'dan giderken çalışır; GÜÇLÜ çağrı tek denemedir (eskisi gibi).
Sesli akışta (`aiAkis`) tekrar yalnız henüz tek söz söylenmemişken yapılır.

### B. Kalite — Sonnet 5'i çağrıdan ÖNCE seç
`neden ∈ onayla | safety | vision | low_conf | uzman`. Sonnet 5, şunlardan
biri doğruysa:

| Koşul | Nerede uygulanır | neden |
|---|---|---|
| Görev `soap`, `not-uretimi` (hekim Onayla yolu: SOAP, mesleki not) | `GOREV_POLITIKASI` | onayla |
| Görev `goruntu-inceleme`, ya da mesajda image/PDF bloğu | `GOREV_POLITIKASI` + `etkinSecim` | vision |
| Görev `klinik-analiz` (reçete, ICD klinik eşleme, epikriz, konsültasyon özeti, doz, lab), `uzman-analiz`, `sohbet-uzman` | `GOREV_POLITIKASI` | uzman |
| HIZLI görevde güvenlik sinyali: gebe, emzirme, pediatrik doz (mg/kg), warfarin/NSAİİ, isotretinoin, kontrendikasyon | `guvenlikSinyaliVar` | safety |
| Luna boş, ret (`refusal` / `content_filter`) ya da düşük güven ("daha fazla bilgi şart", "emin değilim") | `dusukGuvenliYanit` | low_conf |
| Asistan: hasta bağlamı, klinik sinyal, eylem niyeti (`CREATE_PATIENT`, `ADD_COMPLAINT`, `REQUEST_DIAGNOSIS`, `ADD_PRESCRIPTION`, `GENERATE_DOCUMENT`) | `asistanModelYonlendir` → `sohbet-uzman` | uzman |
| Lab ↔ şikayet çelişkisi, hasta-facing metin (hatırlatmadan fazlası) | klinik görevlerdir → `klinik-analiz` | uzman |

**Emin değilsen → Sonnet 5.**

### Luna — yalnız bu dar liste (değişmedi)
Klinik içerik **üretmeyen**, hatası hekime yansımayan işler:

- Asistan sohbetinin **net sosyal** turları ve uygulama kullanımı soruları (`sohbet`)
- Yardım/destek sohbeti (`kisa-yanit`, `app/api/help/chat`)
- Görselsiz saf sınıflandırma/etiketleme, branş/niyet ilk geçişi (`siniflandirma`)
- Klinik veri yorumlamayan özet/çıkarım: meslektaş hafızası, doktorun üslup
  tercihleri (`ozet`, `cikarim`)
- Biçimlendirme, metin temizleme, klinik iddia içermeyen yeniden ifade
  (`bicimlendirme`) — portal hatırlatması / aşı-damla metni / "hasta girdi"
  etiketli ev günlüğü yeniden ifadesi bu sınıftadır

Bu listenin dışında hiçbir şeyi HIZLI'ya alma. Yeni HIZLI görev ürün
kararıdır; `modeller.test.ts` listeyi kilitler, `docs/OPEN-COMMITMENTS.md`'de
gerekçesiyle yazılmadan eklenmez.

## Kod seviyesinde güvenceler (kaldırma)

1. **GÖRSEL = GÜÇLÜ:** mesajda image/document bloğu varsa çağıran HIZLI görev
   verse bile HTTP çağrısından önce GÜÇLÜ'ye yükselir (`etkinSecim`).
2. **Ham asistan metni hastaya gitmez.** Model değişikliği bunu değiştirmez.
3. **F3:** kesinti hekime ham JSON göstermez. OpenRouter'ın `finish_reason:
   length` değeri `stop_reason: max_tokens`'a çevrilir; mevcut F3 / karne /
   görüntü korumaları aynen çalışır. `maxTokens` düşürürken F3'ü kırma.

## Taşıma ve gizlilik

- `OPENROUTER_API_KEY` doluysa iki model de OpenRouter'dan gider (ödeme tek
  yerden). Başlıklar: `Authorization`, `HTTP-Referer`
  (`NOTYA_OPENROUTER_APP_URL`), `X-Title` (`NOTYA_OPENROUTER_APP_TITLE`).
- Her OpenRouter isteği `provider: { data_collection: "deny" }` taşır: yalnız
  veriyi saklamayan / eğitimde kullanmayan sağlayıcılar.
- Boşsa Anthropic modelleri eski doğrudan yoldan (SDK istemcisi ya da
  `/v1/messages`) önek atılarak gider; Luna gidemez → GÜÇLÜ (`neden = transport`).
- **Yapmadığı şey:** OpenRouter Türkiye dışındadır. Bu geçiş KVKK yurt dışı
  aktarım konusunu çözmez; öyleymiş gibi yazma. ElevenLabs, Groq, Deepgram,
  faturalama ve KVKK veri yerleşimi bu politikanın kapsamında değildir.

## Geri dönüş anahtarı (kill switch)

Kod değişmeden, Vercel ortam değişkeniyle:

- `NOTYA_MODEL_HIZLI=anthropic/claude-haiku-4.5` → HIZLI eski Haiku'ya döner.
- `NOTYA_MODEL_GUCLU=…` → GÜÇLÜ değişir. Geçersiz değer → varsayılan.

Yeni kademe icat etme (Terra, Luna Pro vb. yok). Varsayılan olarak
`gpt-5.6-luna`, `claude-sonnet-4.5`, `claude-sonnet-4-6` seçilmez
(`model-sizmasi.test.ts` kilitler).

## Tasarruf buradan gelir (kaliteyi etkilemez)

1. **Prompt caching** — sabit system (persona, branş kilidi, kurallar)
   `onbellek: true` → `cache_control: { type: 'ephemeral' }`; OpenRouter'da
   system mesajının content parçasında aynen korunur (Anthropic modelleri),
   OpenAI modelleri otomatik önbellekler. Hasta bağlamı **asla** önbellekli
   blokta değildir.
2. **Bağlam disiplini** — sohbet geçmişi kısa (`SOHBET_GECMIS_MESAJ`),
   `maxTokens` görev tipine göre gerçekçi.
3. **Çift çağrı ayıklama.**
4. **Kademe** — yalnız yukarıdaki dar Luna listesinde.

## Ölçüm

Her çağrı `ai_token_kullanim`'a yazılır: `input_tokens`, `output_tokens`,
`cache_read`, `cache_creation`, `model`, **`kademe`**, **`neden`**, `gorev`,
`doctor_id`, `kesildi` (migration 105 kademe/neden ekler; uygulanmadıysa satır
onlarsız yazılır). **Prompt içeriği veya hasta verisi kaydedilmez.**
`ai_kullanim` NOTYA-KOTA-01'in kota tablosudur — ona yazılmaz.

**Bütçe hedefi:** çağrıların ~%15'i Sonnet 5. `ai_token_kullanim_gunluk`
görünümünde `kademe` / `neden` ile izlenir. Ölçüm olmadan "şu kadar tasarruf
ettik" denmez.

**Sonra yeniden değerlendirilecek (Kaan'ı bekler):** seçenek B —
`sohbet-uzman` → Luna, güvenlik yükseltmesiyle. Ölçüm görülmeden açılmaz.

## Yeni branş (chapter) yazarken

30+ branşın tamamı bu politikaya tabidir:

1. Model adı yazma — `modelSec(gorev)` / `aiCagir({ gorev })` kullan.
2. Görüntü/inceleme akışı → `goruntu-inceleme`; klinik çıktı → klinik görev
   (GÜÇLÜ). Luna'ya klinik iş verme.
3. System promptun sabit kısmını caching'e uygun yaz (hasta bağlamını sabit
   bloğa karıştırma). Branş alan sızması ve hasta izolasyonu kuralları aynen
   geçerlidir.
