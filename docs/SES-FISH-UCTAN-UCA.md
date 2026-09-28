# NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya uçtan uca Fish (ElevenLabs'siz)

Kaan, 2026-09-28/29. Brief: `docs/SES-FISH-UCTAN-UCA-BRIEF.md`. Kapsam: **yalnız Ayşe Kaya (persona `aysekaya`, pediatri)**.
Diğer 29 persona değişmedi — tam ElevenLabs Conversational AI.

## Neden

Bugünkü ilk Fish entegrasyonu (51ed1c70, 2b791b36, a803f667, 5e5014ee) ElevenLabs ajanını çalıştırmaya devam ediyordu
(dinleme, sıra alma, Custom LLM webhook'u); yalnız hoparlörü susturulup (`setVolume 0`) aynı metin Fish'e okutuluyordu.
Ölçülen iki sonuç: ~391 kredi/dk (Fish'ten önceki ~429 kredi/dk ile aynı — tasarruf yok, üstüne Fish maliyeti) ve
5e5014ee'deki "eager" dönüşle ElevenLabs'in ara + kesin dökümünün İKİ Luna-Pro çağrısı açması (aynı doktor sözü,
4 sn arayla, çift / bozuk doktor balonu). Bu iş ElevenLabs'i Ayşe'nin sesli yolundan tamamen çıkarır.

## Mimari

```
tarayıcı                                                  sunucu (Vercel, nodejs)
────────                                                  ───────────────────────
GET /api/asistan/fish-oturum?persona=aysekaya ──────────► ortak asistan_sessions (yeniden kullan / aç)
                                                          + createDeepgramToken (600 sn proje anahtarı)
◄──────────────────────── { fish:true, asistan_session_id, deepgram:{anahtar,url} }   (yol kapalıysa {fish:false})

getUserMedia(echoCancellation, noiseSuppression, autoGainControl)
  → public/ses/mikrofon-islemcisi.js (AudioWorklet: ~7 kHz alçak geçiren + durumlu 48→16 kHz, Int16, 20 ms + RMS)
  → [YANKI KAPISI] ──(açıkken)──► Deepgram Live WSS  (Sec-WebSocket-Protocol: token,<anahtar>)
                                  model=nova-3 language=tr interim_results endpointing=DG_SESSIZLIK_MS(400)
                                  utterance_end_ms=1000 vad_events smart_format punctuate — diarize YOK
  ◄── Results / UtteranceEnd
TurAlgilayici: is_final parçaları biriktir → speech_final (ya da yedek UtteranceEnd) → BİR söz
FishOturumu:   söz başına nonce → POST /api/asistan/fish-tur ──────► TurKilidi (doktor, oturum, nonce)
                                                                       → sesTurunuYurut (ElevenLabs ucuyla ORTAK çekirdek)
                                                                       → ayseCevapla(kanal:'ses', iptal)  ← TEK model çağrısı
                                                                       → SesYayKapisi: bitmiş cümle hemen çıkar
◄──────────────────────── NDJSON  {"t":"soz","metin":…} … {"t":"bitti","iptal":false}
her cümle → fishCalar.soyle → POST /api/asistan/fish-ses (24 kHz PCM akışı) → AudioContext
ekran balonu / kartlar / [devam] → GET /api/asistan/ses-ekran yoklaması (eskisi gibi, 500 ms)
kullanım → POST /api/asistan/ses-kullanim (Deepgram sn) · fish-ses Fish baytını kendisi yazar → ses_kullanim (migration 110)
```

### Tur algılama (TurAlgilayici — `lib/asistan/canliDinleme.ts`)

Deepgram'ın belgelediği biçim (developers.deepgram.com — understand-endpointing-interim-results,
understanding-end-of-speech-detection, utterance-end; 2026-09-28'de bakıldı):

- `is_final:false` → ara sonuç; **asla tur açmaz** (yalnız "doktor konuşuyor" sinyali).
- `is_final:true` → o parçanın kesin metni; tampona eklenir (uzun söz birden çok `is_final` taşır).
- `speech_final:true` → endpointing sessizliği: tampon = tam söz → **bir** tur, tampon boşalır.
- `UtteranceEnd` → `speech_final` gürültüde kaçarsa yedek; tampon boşsa hiçbir şey yapmaz (aynı söz iki kez gitmez).
- Model: **nova-3, `tr`**. Deepgram'ın dil tablosunda Türkçe Nova-3 ve Nova-2'de var; medical modeller yalnız
  İngilizce görünüyor — Türkçe tıbbi model yok. Dikte ayarı (`DEEPGRAM_OPTIONS`, nova-2-medical + tr) bu işte
  değiştirilmedi (aşağıda "Bilinen sınırlar").
- `DG_SESSIZLIK_MS = 400` — Dr. Gökhan'ın testinden sonra ayarlanacak tek sabit.

### Tek model çağrısı

1. **Tarayıcı**: bir söz = bir nonce = bir istek; istemci kendiliğinden yeniden denemez. Ayşe henüz tek cümle
   söylemeden doktor sözüne devam ederse (duraklayıp sürdürdü), önceki istek **bırakılır** (fetch abort) ve iki parça
   tek sözde birleşir — balon güncellenir, ikinci balon açılmaz; oturuma yalnız birleşik söz yazılır.
2. **Sunucu kilidi** (`lib/asistan/turKilidi.ts`, süreç içi `Map`, 60 sn ömür — `lib/ai/devre.ts` gibi): anahtar
   `(doktorId, asistanSessionId, nonce)`. Aynı anahtarla ikinci istek modeli çağırmaz, çalışan / bitmiş turun yayınına
   abone olur (o ana kadarki satırlar baştan, sonrası canlı). Aynı oturumda yeni nonce gelince sesi hâlâ akan eski tur
   iptal edilir. Ses turu kapandıktan sonra (ekran cevabı arka planda, NOTYA-SES-ERKEN-01) iptal edilmez.
3. **Model zinciri iptali** (yeni, zorunlu): `aiAkis({ iptal })` → OpenRouter `fetch` sinyali / Anthropic akışında
   her `next()` iptalle yarışır → `AiIptalHatasi`. İptal **taşıma hatası değildir**: yeniden deneme yok, koruyucuya
   (Sonnet 5) düşüş yok, devreye yazı yok — iptal ikinci bir model çağrısı doğurmaz. Model politikası değişmedi.

Not: `ai_token_kullanim`'da tek doktor sözü için iki satır görülebilir — biri cevap (`sohbet-uzman`), diğeri doktor
kendinden söz ettiğinde çalışan mevcut arka plan öğrenme çağrısı (`sohbettenOgren`, NOTYA-OGRENME-03, akışsız). Bu
ikinci bir cevap değildir ve bu iş onu değiştirmedi.

### Söz kesme (barge-in) ve yankı — seçilen yol

ElevenLabs kendi sesini duymamayı içeride çözüyordu; Fish aynı hoparlörden çalıyor. **Seçim: kapı + yerel enerji**.

- getUserMedia `echoCancellation / noiseSuppression / autoGainControl` açık — ama tarayıcı AEC'sine **güvenilmez**.
- **Yankı kapısı**: Fish duyulabilir olduğu sürece (çalıyor, kuyrukta ya da sustuktan sonra `YANKI_KUYRUK_MS` = 300 ms
  oda yankısı) mikrofon Deepgram'a **gönderilmez**; bağlantı `{"type":"KeepAlive"}` ile canlı tutulur (Deepgram 10 sn
  sessiz bağlantıyı kapatır). Ayşe'nin kendi sözü hiç yazıya dökülemez → kendiSelamiMi hatasının daha kötüsü yapısal
  olarak kapanır (yine de `kendiSelamiMi` istemcide ve çekirdekte süzgeç olarak duruyor).
- **Söz kesme**: kapı kapalıyken AEC sonrası sinyalin RMS'i yerelde izlenir; `KESME_ESIGI_RMS` (0,06) üstünde
  `KESME_SURE_MS` (180 ms) kalırsa: Fish anında susar (`fishCalar.kes`), sesi akan tur iptal edilir (fetch bırakılır →
  sunucuda model akışı durur, tur oturuma yazılmaz), kapı açılır ve son `ON_KAYIT_MS` (500 ms) ses Deepgram'a verilir —
  doktorun sözünün başı kaybolmaz. Kapı kendiliğinden açılınca (Ayşe bitirdi) ön kayıt Fish yankısıdır, atılır.
- Neden Deepgram `SpeechStarted` değil: belgelerde söz kesme için önerilmiyor ve VAD gürültüde tetiklenebilir; üstelik
  kapı kapalıyken Deepgram sesi hiç görmez.
- Eşikler (`lib/asistan/fishOturumu.ts` başı) canlı dinlemede ayarlanacak — aşağıdaki kabul notuna bakın.

### Oturum / bağlam

Aynı `asistan_sessions` satırı ve ortak oturum mekanizması: `fish-oturum` yazılı sohbetin oturumunu (id + doctor_id
eşleşirse) yeniden kullanır, yoksa açar; sayfa hastası `hastaSahibiMi` ile doğrulanmadan yazılmaz. Sekme / persona
değişimi a803f667'deki gibi sıfırlar (`switchPersona` + `ayseCevapla` personaDegisti) — Fish ↔ ElevenLabs geçişi testte.

## Hibritten farkı

| | Hibrit (bugün, main) | Uçtan uca (bu iş) |
|---|---|---|
| ElevenLabs oturumu | var (dinler, sıra alır, webhook'u çağırır, susturulur) | **yok** — `Conversation.startSession` çağrılmaz |
| Kulak | ElevenLabs ASR | Deepgram Live nova-3 tr |
| Sıra alma | ElevenLabs (eager + speculative) | `TurAlgilayici` (speech_final / UtteranceEnd) |
| Model çağrısı | ElevenLabs Custom LLM webhook (`ses-llm`) — ara+kesin çift çağrı | `fish-tur` — söz başına tek, nonce kilidi |
| Ses | Fish (ElevenLabs metni yeniden sentezlenir) | Fish (sunucunun kapıdan geçen cümleleri) |
| Söz kesme | ElevenLabs VAD / interruption | yerel enerji + model akışı iptali |
| Yankı | ElevenLabs içi | yankı kapısı (+ tarayıcı AEC) |

İstemci kod yolu (`components/asistan/AsistanOturumContext.tsx` `startConversation`):
`p.id === "aysekaya" && (await fishIleBasla(...)) → return` — bu satır `fetchSignedUrl` (ElevenLabs imzalı URL) ve
`startConversationWithoutFirstMessage` → `Conversation.startSession`'dan **önce** döner. `fishIleBasla` içinde
`Conversation.` / `signed-url` / `setVolume` geçmez; Fish modülleri `@elevenlabs` içe aktarmaz (test:
`fishUctanUca.test.ts` "istemci kod yolu"). `fishIleBasla` false dönerse (Fish/Deepgram anahtarı yok, oturum açılamadı)
Ayşe **düz ElevenLabs** ile konuşur — susturma / Fish katmanı olmadan. ElevenLabs yolundaki hibrit kalıntıları
(`setVolume(0)`, `onAgentChatResponsePart` → Fish, `onVadScore`, Fish'e bağlı `onModeChange`) kaldırıldı; diğer
personalar için bunlar zaten etkisizdi (yalnız Fish açıkken çalışıyorlardı). `signed-url` yanıtındaki `fish` bayrağı
kaldırıldı. Ortak ses turu mantığı `lib/asistan/sesTuru.ts`'e taşındı; `sesLlm.ts` (ElevenLabs Custom LLM ucu) onun ince
SSE sarmalayıcısı — davranış birebir (`tekBeyin.test.ts` değişmeden yeşil).

## Bugünkü davranışlar — Fish yolunda durum

| Davranış | Durum |
|---|---|
| NOTYA-SES-DEVAM-01 (sınırda kesilen turun kalanı) | Çalışır: `sesTurunuYurut` aynı; istemci gizli `[devam]` turunu `fo.gizliTur()` ile aynı tek-dağıtım ucundan yollar (Ayşe duyulurken / tur sürerken yollanmaz, sonraki yoklamada tekrar bakar). Birim testte çekirdek sınandı; tarayıcıda canlı doğrulanmadı. |
| NOTYA-SES-SESSIZ-01 (yazınca ses susar) | Çalışır: `sesiYaziliIcinSustur` artık Fish oturumunu da aktif sayar → `endConversation` mikrofonu, soketi, Fish'i kapatır. Canlı doğrulanmadı. |
| NOTYA-SAYFA-HASTA-01/02 (sayfa takibi) | Çalışır: `fish-oturum` sayfa hastasını sahiplik kontrolüyle yeni oturuma koyar; mevcut `oturum-hasta` akışı değişmedi (ortakOturumId aynı). |
| NOTYA-SES-OKU-01 ("bana anlat") | Sunucu tarafı (`ayseCevapla` okumaIstegiMi) — çekirdek aynı, değişmedi. |
| NOTYA-SELAM-SAAT-01 (yerel saatli selam) | Sesli açılış iki yolda aynı istemci `firstMessage` ("Merhaba <hitap>. Nasıl yardımcı olabilirim?") — saat sözcüğü bugün de yok; günün bloğu sunucuda doktorun diliminde. Fish yolunda açılış modelsiz, doğrudan Fish'e okunur. |
| Süre sınırı (60/120 dk) | Fish yolunda `endConversation` ile kapanır. |
| "Asistanı kapat" / veda | `asistaniKapatMi` istemcide (tur açılmaz); veda cümlesi sunucuda "Görüşmek üzere Hocam." + Fish susunca kapanış. |

## Maliyet

Sayaçlar: `ses_kullanim` (migration 110, **yazıldı, uygulanmadı**) — Deepgram gönderilen ses / bağlantı / görüşme
saniyesi (tarayıcı dakikada bir + kapanışta yollar), Fish'e giden metnin UTF-8 baytı (fish-ses). Model: mevcut
`ai_token_kullanim`. Rapor: `npx --yes tsx scripts/fish-maliyet.mts <asistan_session_id> [--yaz]` →
`docs/denetim/<tarih>-fish-maliyet-<id>.md`. Hesap `lib/asistan/fishMaliyet.ts` — oranı doğrulanmayan kalem uydurulmaz,
TODO olarak kalır.

| Kalem | Oran | Kaynak (2026-09-28) |
|---|---|---|
| Deepgram Nova-3 monolingual akış | $0.0048/dk (promosyon; normal $0.0077/dk) | deepgram.com/pricing |
| Fish s2.1-pro-free (Ayşe'nin bugünkü modeli) | $0 (30 Kasım 2026'ya kadar) | docs.fish.audio pricing-and-rate-limits |
| Fish s2.1-pro (ücretli karşılığı) | $15 / 1M UTF-8 bayt | aynı |
| Model (Luna-Pro / Sonnet 5, OpenRouter) | **TODO** — depoda fiyat tablosu yok | OpenRouter faturası |
| ElevenLabs tabanı | ~429 kredi/dk → **TODO USD** | Ajanlar artık dakikayla faturalanıyor (elevenlabs.io/pricing/agents: ek dakika $0.08, LLM ayrı); kredi→USD Kaan'ın plan kademesine bağlı |

**Ölçülmüş $/dk henüz yok** — gerçek bir görüşme yapılmadı (migration uygulanmadı, Deepgram/Fish anahtarlarıyla canlı
çağrı ajan tarafından yapılamaz). Bilinen oranlarla yalnız kulak + ses kalemleri: Deepgram, gönderilen ses dakikası
başına $0.0048 (kapı kapalı süre gönderilmez — Deepgram'ın KeepAlive süresini faturalayıp faturalamadığı
DOĞRULANMADI, rapor bağlantı süresini de ayrıca yazar); Fish bugün $0. Tamamlamak için: (1) migration 110'u uygula,
(2) bir test görüşmesi, (3) `scripts/fish-maliyet.mts`, (4) model token fiyatı ve ElevenLabs kademesi.

## Bilinen sınırlar

- Kilit süreç içidir: aynı nonce iki ayrı Vercel örneğine düşerse göremez. İstemci kendiliğinden yeniden denemediği
  için pratikte tek istek; kalıcı kilit (DB) gerekirse ayrı iş.
- Kesilen (iptal) tur oturuma yazılmaz — doktorun yarıda kalan sorusu geçmişte görünmez (balon ekranda kalır).
- Anthropic-doğrudan yolda (OpenRouter anahtarı yokken) iptal akışı bırakır; OpenRouter yolunda fetch iptal edilir.
  Sağlayıcının iptal anına kadar ürettiği token'ları faturalayıp faturalamadığı sağlayıcıya bağlı.
- Deepgram anahtarı `createDeepgramToken` ile 600 sn'lik **proje anahtarı** (auth/grant geçici jetonu değil); canlı
  bağlantının anahtar süresi dolunca kapanıp kapanmadığı belgelenmemiş — kopan bağlantı taze anahtarla en çok 3 kez
  yeniden kurulur. Canlıda doğrulanmalı.
- Söz kesme eşikleri (RMS 0,06 / 180 ms / yankı kuyruğu 300 ms) masa başında seçildi; hoparlör–mikrofon düzenine göre
  ayarlanacak. Kulaklıkla kesme en güvenilir; açık hoparlörde AEC kalıntısı eşik altında kalmalı.
- iOS: mikrofon, dokunuşta açılan AudioContext'i Fish çalarıyla paylaşır (dokunuş dışında kurulan bağlam iOS'ta askıda
  kalabilir); bildirim sonrası mikrofonun sessizce kapanması (ElevenLabs yolundaki
  `setMuted(false)` çaresi) Fish yolunda yok — iPhone Safari testinde bakılmalı.
- `lib/transcription/deepgramClient.ts` dikte ayarı `nova-2-medical` + `language: 'tr'` — Deepgram'ın dil tablosunda medical
  modeller yalnız İngilizce görünüyor (canlı bir dikte çağrısıyla teyit edilmeli). Bu işin kapsamı dışında, dokunulmadı; ayrı düzeltme gerekir.

## Kabul — insanın yapacağı ilk gerçek konuş-dinle (ajan yapamaz)

1. Vercel'de `FISH_API_KEY`, `DEEPGRAM_API_KEY`, `DEEPGRAM_PROJECT_ID` (Preview + Production); migration 110.
   **Dikkat**: Production'da Fish + Deepgram anahtarları varsa birleştirme anında **tüm** Ayşe Kaya görüşmeleri bu yola
   geçer (hibrit gibi, doktor bayrağı yok). Önce Preview'da denenmeli; geri dönüş: Deepgram anahtarını kaldırmak →
   Ayşe düz ElevenLabs.
2. Kulaklıksız, dizüstü hoparlörü: Ayşe konuşurken sessiz dur → Deepgram'a hiçbir şey gitmemeli, ekranda doktor balonu
   çıkmamalı (yankı kapısı). Ayşe konuşurken "Hocam bir saniye" de → Fish ~200 ms içinde susmalı, cümle ekrana düşmeli,
   yeni cevap gelmeli (söz kesme). Hoparlör yüksekken Ayşe kendini kesiyorsa `KESME_ESIGI_RMS`'i yükselt.
3. Tek söz → `ai_token_kullanim`'da tek `sohbet-uzman` satırı; ekranda tek doktor balonu.
4. Uzun özet → 5 cümle / 22 sn sınırı → `[devam]` ile kalanı.
5. Yazılı panele yaz → ses susmalı; mikrofon → aynı oturum.
6. Hasta sayfası aç → panel etiketi; adsız soru o hastadan.
7. Ayşe ↔ Mehmet sekme değişimi → geçmiş/hasta taşınmamalı.
8. Görüşme sonu → `scripts/fish-maliyet.mts <oturum>`.
