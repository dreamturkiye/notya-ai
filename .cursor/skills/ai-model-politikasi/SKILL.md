---
name: ai-model-politikasi
description: >-
  Notya'da bir Anthropic/LLM çağrısı eklerken veya değiştirirken uygulanan
  ZORUNLU kural: model adı asla dosyaya string olarak yazılmaz; kademe
  (GÜÇLÜ/HIZLI) lib/ai/modeller.ts'teki merkezi politikadan alınır. Klinik
  kalite maliyetin ÜSTÜNDEDİR: görüntü/inceleme ve hekimin karar verdiği her
  çıktı Sonnet'te kalır. 30+ branşın tamamı için geçerlidir — yeni bölüm
  (chapter) yazarken de uygulanır. Maliyet kazancı model düşürmekten değil,
  prompt caching ve bağlam disiplininden gelir.
---

# AI model politikası (tüm branşlar, tüm uygulama)

Kaan (CEO, 2026-09-19), test aşamasında $20 harcandıktan sonra: *"Bütün
kullanımlarda Sonnet 4.6 ve Haiku'yu ekonomik bir şekilde kullanması lazım."*
Hemen ardından, aynı gün: *"Röntgenlerde ve diğer incelemelerde de Sonnet'i
kullan. Kesinlikle application'ın kalitesinin düşmesini istemiyorum."*

**Öncelik sırası nettir: klinik kalite > maliyet.**

## Tek kaynak

Model seçimi yalnız `lib/ai/modeller.ts`'ten gelir:

- `modelSec(gorev)` → o görev için kademe, model ve önerilen `maxTokens`
- `gucluModel()` / `hizliModel()` → doğrudan kademe gerekiyorsa
- Çağrılar `lib/ai/cagir.ts` sarmalayıcısından geçer (ölçüm ve kademe garantisi orada)

`lib/ai/model-sizmasi.test.ts` bunu **zorlar**: `app/` ve `lib/` altında
`claude-(sonnet|haiku|opus)-<sürüm>` deseni yalnız `modeller.ts` içinde
geçebilir. Yeni bir rotaya model adını elle yazarsan test kırılır.

## GÜÇLÜ (Sonnet) — istisnasız

Hekimin/uzmanın karar verdiği, hatanın maliyetli olduğu her çıktı:

| Alan | Örnek |
|---|---|
| **Görüntü ve inceleme** | Röntgen, OCT, fundus, ön segment, dermatoskopi, USG, MR, BT, mamografi, EKG |
| **Belge/lab** | `belge_analizleri` Tier A taslak, lab PDF sonrası klinik yorum, konsültasyon raporu özeti |
| **Klinik üretim** | SOAP/muayene notu, epikriz, klinik konsültasyon yanıtı, doz önerisi, risk skoru yorumu |
| **Kodlama/reçete** | ICD-10 klinik eşleme, e-reçete klinik içeriği, SGK rapor klinik gerekçesi |
| **Hukuk/mali sonuç** | Dilekçe, sözleşme analizi, mali analiz çıktısı |

**Kod seviyesinde emniyet:** mesaj içeriğinde bir görüntü (image) bloğu varsa,
çağıran yanlış görev tipi verse bile kademe otomatik GÜÇLÜ'ye yükselir.
Bu davranışı kaldırma.

## HIZLI (Haiku) — yalnız bu dar liste

Klinik içerik **üretmeyen**, hatası hekime yansımayan işler:

- Yardım/destek sohbeti (`app/api/help/chat`)
- Hafıza özetleme ve tercih çıkarımı (hasta klinik verisi yorumlamadığı sürece)
- Saf sınıflandırma/etiketleme (ör. ingestion'daki ~20 token'lık etiketleme)
- Biçimlendirme, metin temizleme, klinik iddia içermeyen yeniden ifade
- Asistan sohbetinin **net sosyal** turları (selamlama, teşekkür)

Bu listenin dışında hiçbir şeyi HIZLI'ya alma.

## Asistan sohbeti: şüphede kalırsan GÜÇLÜ

Varsayılan **GÜÇLÜ**; HIZLI dar bir istisnadır.

- Hasta bağlamı seçili → **GÜÇLÜ** (mesaj ne kadar kısa olursa olsun)
- Klinik terim / ilaç / tanı / tetkik / görüntü / lab / doz / risk skoru → **GÜÇLÜ**
- Araç eylemi (action) tetikleniyor → **GÜÇLÜ**
- Yalnız açıkça sosyal veya uygulama-kullanımı sorusu → HIZLI

## Tasarruf buradan gelir (kaliteyi etkilemez)

Model düşürmek listenin **en sonundadır**. Sıra:

1. **Prompt caching** — sabit system prompt (persona, branş kilidi, genel
   kurallar) `cache_control: { type: 'ephemeral' }` ile işaretlenir; değişken
   kısım (hasta bağlamı, hafıza) işaretlenmez. En büyük tek kazanç.
2. **Bağlam disiplini** — sohbet geçmişi kısa tutulur (politikadaki sabit),
   `maxTokens` görev tipine göre gerçekçi verilir.
3. **Çift çağrı ayıklama** — aynı turda gereksiz ikinci model çağrısı varsa
   birleştirilir.
4. **Kademe düşürme** — yalnız yukarıdaki dar HIZLI listesinde.

`maxTokens` düşürürken **F3 korumasını kırma**: kesinti hekime ham JSON
göstermemeli (KD-DERM-SAFETY-FINDINGS F3 ve testi).

## Ölçüm

Her çağrının `input_tokens`, `output_tokens`, `cache_read_input_tokens`,
`cache_creation_input_tokens` değerleri `ai_token_kullanim` tablosuna yazılır
(`ai_kullanim` adı NOTYA-KOTA-01'in günlük kota tablosuna aittir — ona yazılmaz).
**Prompt içeriği veya hasta verisi kaydedilmez** — yalnız sayaçlar, `doctor_id`,
görev ve model. Ölçüm olmadan "şu kadar tasarruf ettik" denmez.

## Yeni branş (chapter) yazarken

30+ branşın tamamı bu politikaya tabidir. Yeni bir bölüm eklerken:

1. Model adı yazma — `modelSec(gorev)` kullan.
2. Bölümün görüntü/inceleme akışı varsa görev tipi **GÜÇLÜ** olmalı.
3. Yeni bir system prompt kilidi eklerken sabit kısmı caching'e uygun yaz
   (hasta bağlamını sabit bloğa karıştırma, yoksa cache her turda bozulur).
