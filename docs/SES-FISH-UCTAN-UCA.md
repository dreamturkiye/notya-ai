# NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — Ayşe Kaya uçtan uca Fish Audio

Kaan, 2026-09-28. Brief'ler: `docs/SES-FISH-UCTAN-UCA-BRIEF.md` (ilk uçtan uca iş), `docs/SES-FISH-SADECE-BRIEF.md`
(bu sürüm — beta öncesi yeni satıcı yok). Kapsam: **yalnız Ayşe Kaya (persona `aysekaya`, pediatri)**. Diğer 29 persona
değişmedi — tam ElevenLabs Conversational AI.

**Kural (Kaan):** Ayşe Kaya %100 Fish Audio — Fish dinler (`/v1/asr`), Fish konuşur (`/v1/tts`). Sıfır ElevenLabs,
başka satıcı yok, hiçbir hata durumunda başka satıcıya düşüş yok.

## Neden

İlk Fish entegrasyonu (51ed1c70 … 5e5014ee) ElevenLabs ajanını çalıştırmaya devam ediyordu (dinleme, sıra alma, Custom
LLM webhook'u; hoparlörü susturulup aynı metin Fish'e okutuluyordu): ~391 kredi/dk (tasarruf yok) ve "eager" dönüşte
ElevenLabs'in ara + kesin dökümünün İKİ Luna-Pro çağrısı açması. Bu iş ElevenLabs'i Ayşe'nin sesli yolundan tamamen
çıkarır; kulak da Fish'tir.

## Mimari

```
tarayıcı                                                   sunucu (Vercel, nodejs)
────────                                                   ───────────────────────
GET /api/asistan/fish-oturum?persona=aysekaya ───────────► ortak asistan_sessions (yeniden kullan / aç)
◄───────────────────────── { fish:true, asistan_session_id, baslangic }   (yol kapalıysa {fish:false} → GÖRÜNÜR HATA)

getUserMedia(echoCancellation, noiseSuppression, autoGainControl)
  → public/ses/mikrofon-islemcisi.js (AudioWorklet: ~7 kHz alçak geçiren + durumlu 48→16 kHz, Int16, 20 ms + RMS)
  → [YANKI KAPISI] ──(açıkken)──► SozAlgilayici (yerel VAD, lib/asistan/sozAlgilayici.ts)
                                    söz başı: RMS ≥ SOZ_ESIGI_RMS × SOZ_BASLAMA_MS (+ SOZ_ON_KAYIT_MS ön kayıt)
                                    söz sonu: SOZ_SONU_SESSIZLIK_MS sessizlik → BİR söz → wavKodla (16 kHz PCM16 WAV)
FishOturumu: söz başına TEK POST /api/asistan/fish-dinle (ham WAV) ──► oturum id+doctor_id → Fish POST /v1/asr
                                                                        (multipart audio, language=tr, model başlığı
                                                                         transcribe-1) → { metin }  + sayaç/gecikme
             döküm sırasıyla → söz başına nonce → POST /api/asistan/fish-tur ──► TurKilidi (doktor, oturum, nonce)
                                                                        → sesTurunuYurut (ElevenLabs ucuyla ORTAK çekirdek)
                                                                        → ayseCevapla(kanal:'ses', iptal)  ← TEK model çağrısı
◄──────────────────────── NDJSON  {"t":"soz","metin":…} … {"t":"bitti","iptal":false}
her cümle → fishCalar.soyle → POST /api/asistan/fish-ses (24 kHz PCM akışı) → AudioContext
ekran balonu / kartlar / [devam] → GET /api/asistan/ses-ekran yoklaması (eskisi gibi, 500 ms)
sayaç → ses_kullanim (migration 110): fish-ses (TTS bayt), fish-dinle (ASR sn + asr_ms), fish-tur (ilk_soz_ms),
        tarayıcı → POST /api/asistan/ses-kullanim (oturum sn + tur başına aşama gecikmeleri)
```

### Fish ASR — belgelenen biçim (docs.fish.audio, 2026-09-28'de bakıldı)

`POST https://api.fish.audio/v1/asr`, `Authorization: Bearer <FISH_API_KEY>`, `multipart/form-data`: `audio` (dosya baytı —
wav/mp3/opus…), `language` (isteğe bağlı), `ignore_timestamps` (varsayılan `true`). Model **başlıkla**: `model:
transcribe-1` (varsayılan) ya da `transcribe-1-pro`. Yanıt: `{ text, duration, segments[{text,start,end}], language_code,
language }`. Hata kodları 401 / 402 / 503. İstek başına 20 MB / 60 dk (fish.audio/stt). Kaynak:
docs.fish.audio/features/speech-to-text, docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text.

- **Canlı akışlı ASR yok** — bu yüzden sıra alma tarayıcıda (VAD) yapılır.
- **Türkçe**: `language` parametresi var ama belge onu "ipucu" diye tanımlıyor — otomatik dil algılama yine koşar ve
  baskındır. "80+ dil" deniyor; ayrı bir dil listesi yayınlanmamış; en çok sınanan diller İngilizce, Mandarin, Kantonca,
  Japonca, Korece. **Türkçe tıbbi konuşma kalitesi doğrulanmadı** — insan testi gerekli (aşağıda).
- Biz `language=tr` yollarız, `transcribe-1` kullanırız (`lib/asistan/fishSes.ts` `FISH_ASR_*`). Yanıttaki
  `language_code` istemciye döner (`dil`) — canlı testte Türkçe algılanıp algılanmadığı buradan görülür.

### Söz algılama (VAD) — sabitler ve gerekçe (`lib/asistan/sozAlgilayici.ts`)

| Sabit | Değer | Neden |
|---|---|---|
| `SOZ_ESIGI_RMS` | 0,02 (~−34 dBFS) | AEC + NS + AGC sonrası oda tabanı ~0,001–0,005, dizüstü mikrofonda normal konuşma ~0,03–0,2. Söz kesme eşiği (0,06) daha yüksek çünkü o, Fish'in yankı artığının üstünde kalmalı; VAD yalnız Fish susmuşken çalışır. |
| `SOZ_BASLAMA_MS` | 100 | Tık / masaya vuruş söz başlatmaz. |
| `SOZ_SONU_SESSIZLIK_MS` | **500** | Brief aralığı 400–600'ün ortası. Her tura doğrudan eklenir; düşürmek hızlandırır ama cümle içi nefeste sözü böler (bölünen söz birleşir, ama bir ASR + bir iptal edilmiş model çağrısı boşa gider). İlk ayarlanacak sabit. |
| `SOZ_ON_KAYIT_MS` | 300 | Yumuşak ilk hece kesilmesin. |
| `SOZ_KUYRUK_MS` | 150 | Sözün sonundaki sessizliğin yalnız bu kadarı yüklenir (Fish ASR saniyeyle ücretlendirir, yükleme de kısalır). |
| `EN_KISA_SOZ_MS` | 250 (sesli süre) | Öksürük / "hı" Fish'e gitmez. |
| `EN_UZUN_SOZ_MS` | 30 000 | 30 sn ≈ 960 KB; tampon sınırsız büyümez (fish-dinle üst sınırı 2 MB, Fish 20 MB). Aşan söz kapatılır, sonraki parça birleşir. |

**Ara çağrı yok:** yalnız VAD'ın bitirdiği söz Fish ASR'ye gider — büyüyen tampon için tekrar tekrar ASR çağrılmaz. Bir
söz = bir ASR = bir nonce = bir model çağrısı. Birden çok söz aynı anda yazıya dökülüyorsa sonuçlar **söz sırasıyla**
işlenir (B'nin dökümü önce dönse de).

### Tek model çağrısı (değişmedi)

1. **Tarayıcı**: bir söz = bir nonce = bir istek; istemci kendiliğinden yeniden denemez. Ayşe henüz tek cümle söylemeden
   doktor sözüne devam ederse önceki istek **bırakılır** ve iki parça tek sözde birleşir — balon güncellenir, ikinci
   balon açılmaz; oturuma yalnız birleşik söz yazılır.
2. **Sunucu kilidi** (`lib/asistan/turKilidi.ts`, süreç içi, 60 sn): anahtar `(doktorId, asistanSessionId, nonce)`. Aynı
   anahtarla ikinci istek modeli çağırmaz, çalışan / bitmiş turun yayınına abone olur. Aynı oturumda yeni nonce gelince
   sesi hâlâ akan eski tur iptal edilir.
3. **Model zinciri iptali**: `aiAkis({ iptal })` → `AiIptalHatasi` — yeniden deneme yok, koruyucuya düşüş yok, devreye
   yazı yok. Model politikası değişmedi.

### Söz kesme (barge-in) ve yankı (değişmedi — yalnız hedef VAD oldu)

- getUserMedia `echoCancellation / noiseSuppression / autoGainControl` açık — ama tarayıcı AEC'sine **güvenilmez**.
- **Yankı kapısı**: Fish duyulabilir olduğu sürece (çalıyor, kuyrukta ya da sustuktan sonra `YANKI_KUYRUK_MS` = 300 ms)
  mikrofon söz algılayıcıya **verilmez** — Ayşe'nin kendi sesi WAV'a hiç girmez.
- **Söz kesme**: kapı kapalıyken RMS `KESME_ESIGI_RMS` (0,06) üstünde `KESME_SURE_MS` (180 ms) kalırsa: Fish anında susar,
  sesi akan tur iptal edilir, kapı açılır ve son `ON_KAYIT_MS` (500 ms) ses söz algılayıcıya verilir — sözün başı
  kaybolmaz. Kapı kendiliğinden açılınca (Ayşe bitirdi) ön kayıt Fish yankısıdır, atılır.

### Hata — başka satıcıya düşüş YOK

| Hata | Davranış |
|---|---|
| `fish-oturum` `{fish:false}` / ağ (Fish anahtarı yok, oturum açılamadı) | Görüşme açılmaz, hata durumu: "Bağlantı kurulamadı. Tekrar deneyin. (Ayşe Kaya'nın ses hattı şu an açılamadı)". ElevenLabs'e düşülmez. |
| Fish ASR hatası (`fish-dinle` 502/409) | Tur açılmaz, yeniden denenmez; panelde "Sizi duyamadım — bir daha söyler misiniz?"; görüşme dinlemeye devam eder, doktor tekrar söyler. |
| Boş döküm (gürültü) | Sessizce atılır, tur yok. |
| Fish TTS hatası | "Ses şu an üretilemedi — cevap ekranınızda." (cevap ses-ekran yoklamasıyla ekranda), dinleme sürer. |
| fish-tur hatası | "Bağlantıda bir sorun oldu — bir daha söyler misiniz?" |

İstemci kod yolu (`components/asistan/AsistanOturumContext.tsx` `startConversation`):
`if (sesHattiSec(p.id) === "fish") { await fishIleBasla(...); return }` — koşulsuz döner; `fetchSignedUrl` ve
`Conversation.startSession`'dan **önce**. `fishIleBasla` içinde `Conversation.` / `signed-url` / `setVolume` /
`return false` geçmez; Fish modülleri `@elevenlabs` içe aktarmaz (test: `fishUctanUca.test.ts` "istemci kod yolu").

### Oturum / bağlam (değişmedi)

Aynı `asistan_sessions` satırı: `fish-oturum` yazılı sohbetin oturumunu (id + doctor_id eşleşirse) yeniden kullanır, yoksa
açar; sayfa hastası `hastaSahibiMi` ile doğrulanmadan yazılmaz. Persona değişimi sıfırlar (`switchPersona` +
`ayseCevapla` personaDegisti) — Fish ↔ ElevenLabs geçişi testte.

## Gecikme — başlık ölçü

Bu tasarımın akışlı ASR'de olmayan, ölçülebilir bir bedeli var:

```
doktorun son sesi ─(soz_sonu_ms ≈ 500, tasarım)─► VAD söz sonu ─(dinle_ms: WAV yükleme + Fish ASR + dönüş)─►
metin ─(ilk_soz_ms: fish-tur → model ilk cümle)─► ilk cümle ─(ilk_ses_ms: fish-ses + ilk PCM)─► Ayşe'nin ilk sesi
                                             toplam_ms = hepsi
```

Her tur için tarayıcı `soz_sonu_ms`, `dinle_ms`, `ilk_ses_ms`, `toplam_ms`'yi; sunucu `asr_ms` (Fish round trip, fish-dinle)
ve `ilk_soz_ms`'yi (fish-tur, tur başına bir kez) `ses_kullanim`'a `kaynak='gecikme'` yazar; sunucu ayrıca Vercel günlüğüne
`[ses-gecikme] asr_ms=… ` satırı basar (tablo yoksa da görünür). `scripts/fish-maliyet.mts <oturum>` aşama başına n / p50 /
p90 / en çok verir ve **ASR yükleme + dökme p50 > 1000 ms ise raporda açık UYARI** yazar (Kaan'ın çıtası).

**Ölçülmüş rakam henüz yok** — ajan gerçek Fish anahtarıyla canlı çağrı yapamaz. Karşılaştırma tabanı
(docs/OPEN-COMMITMENTS.md NOTYA-SES-FISH-01, ElevenLabs): konuşma sonu → ilk ses p50 2,6 s / p95 17 s; ASR gecikmesi p50
0,04 s. Bu tasarımda ASR adımı (`dinle_ms`) + 500 ms söz sonu, eski akışlı kulağın neredeyse sıfır ASR gecikmesinin yerine
gelir — ilk canlı testte ilk bakılacak rakam budur.

## Maliyet

Sayaçlar: `ses_kullanim` (migration 110, **yazıldı, uygulanmadı** — check kısıtı yalnız `fish`, `fish_asr`, `oturum`,
`gecikme`). Model: mevcut `ai_token_kullanim`. Rapor: `npx --yes tsx scripts/fish-maliyet.mts <asistan_session_id> [--yaz]`
→ `docs/denetim/<tarih>-fish-maliyet-<id>.md`. Hesap `lib/asistan/fishMaliyet.ts` — oranı doğrulanmayan kalem uydurulmaz.

| Kalem | Oran | Kaynak (2026-09-28) |
|---|---|---|
| Fish ASR `transcribe-1` / `transcribe-1-pro` | $0.36 / ses saati; saniyeye yukarı yuvarlanır | docs.fish.audio pricing-and-rate-limits (ASR) |
| Fish TTS s2.1-pro-free (Ayşe'nin bugünkü modeli) | $0 | aynı |
| Fish TTS s2.1-pro (ücretli karşılığı) | $15 / 1M UTF-8 bayt | aynı |
| Model (Luna-Pro / Sonnet 5, OpenRouter) | **TODO** — depoda fiyat tablosu yok | OpenRouter faturası |
| ElevenLabs tabanı | ~429 kredi/dk → **TODO USD** | kademe Kaan'da |

Yuvarlamanın istek başına uygulandığı varsayılır (fish-dinle istek başına `Math.ceil` yazar) — faturada doğrulanmalı.
Kısa sözlerde (ör. 1,2 sn → 2 sn) yuvarlama ASR maliyetini oransal olarak büyütür; mutlak tutar yine küçük
($0.0001/sn).

## Bugünkü davranışlar — Fish yolunda durum

| Davranış | Durum |
|---|---|
| NOTYA-SES-DEVAM-01 | `sesTurunuYurut` aynı; gizli `[devam]` turu `fo.gizliTur()` ile tek-dağıtım ucundan — Ayşe duyulurken, tur sürerken, doktor konuşurken ya da sözü yazıya dökülürken yollanmaz (`dinlemeSuruyor`). |
| NOTYA-SES-SESSIZ-01 | `sesiYaziliIcinSustur` Fish oturumunu da aktif sayar → `endConversation` mikrofonu, bekleyen ASR'yi, akan turu, Fish'i kapatır. |
| NOTYA-SAYFA-HASTA-01/02 | `fish-oturum` sayfa hastasını sahiplik kontrolüyle yeni oturuma koyar; `oturum-hasta` akışı değişmedi. |
| NOTYA-SES-OKU-01 | Sunucu tarafı (`ayseCevapla` okumaIstegiMi) — çekirdek aynı. |
| NOTYA-SELAM-SAAT-01 | Açılış istemci `firstMessage`, modelsiz doğrudan Fish'e; günün bloğu sunucuda. |
| Süre sınırı (60/120 dk) | `endConversation` ile kapanır. |
| "Asistanı kapat" / veda | `asistaniKapatMi` istemcide (döküm geldikten sonra; tur açılmaz). |

## Bilinen sınırlar

- Kilit süreç içidir (aynı nonce iki Vercel örneğine düşerse göremez); istemci yeniden denemediği için pratikte tek istek.
- Kesilen tur oturuma yazılmaz (balon ekranda kalır).
- VAD enerji tabanlıdır: gürültülü muayene odasında (ağlayan bebek, konuşan veli) eşik üstü arka plan sesi sözü uzatabilir
  ya da tur açabilir; `EN_KISA_SOZ_MS` ve Fish'in boş dökümü kısmen süzer. Canlıda bakılmalı.
- Fish duyulurken doktor fısıltıyla (0,06 altında) konuşursa söz kesilmez ve o ses kaybolur (yankı kapısı).
- iOS: mikrofon dokunuşta açılan AudioContext'i Fish çalarıyla paylaşır; bildirim sonrası mikrofonun sessizce kapanması
  Fish yolunda ele alınmadı — iPhone Safari testinde bakılmalı.

## Kabul — insanın yapacağı ilk gerçek konuş-dinle (ajan yapamaz)

1. Preview'da `FISH_API_KEY` (zaten var) + migration 110. **Dikkat**: birleştirme anında **tüm** Ayşe Kaya görüşmeleri bu
   yola geçer (doktor bayrağı yok) ve ElevenLabs'e geri dönüş yolu **yoktur** — geri almak = PR'ı geri almak.
2. **Önce gecikme**: 10 kısa soru → `scripts/fish-maliyet.mts <oturum>`: `dinle_ms` p50 (> 1000 ms ise çıta aşıldı),
   `toplam_ms` p50 (taban 2,6 s). Yavaşsa `SOZ_SONU_SESSIZLIK_MS`'i 400'e çekmek ilk kaldıraç.
3. **Türkçe döküm**: ~20 tıbbi cümle (ilaç adları, mg/ml, "eee" dolgusu, hasta adları) — balondaki metin doğru mu,
   `fish-dinle` yanıtındaki `dil` `tr` mi.
4. Kulaklıksız, dizüstü hoparlörü: Ayşe konuşurken sessiz dur → doktor balonu çıkmamalı. "Hocam bir saniye" de → Fish
   ~200 ms içinde susmalı, cümlenin başı dökümde olmalı.
5. Cümle ortasında nefes al → tek balon (bölünürse `SOZ_SONU_SESSIZLIK_MS` kısa).
6. Tek söz → `ai_token_kullanim`'da tek `sohbet-uzman` satırı.
7. Uzun özet → 5 cümle / 22 sn sınırı → `[devam]` ile kalanı.
8. Yazılı panele yaz → ses susmalı; mikrofon → aynı oturum. Hasta sayfası → panel etiketi. Ayşe ↔ Mehmet → sızma yok.
