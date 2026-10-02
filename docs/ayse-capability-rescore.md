# Ayşe capability re-score

- **Date:** 2026-10-02
- **Owner:** Claude, branch `audit/ayse-rescore`. Decisions: Kaan.
- **Scored code:** `origin/main` at `1b7a06a0` (merge of PR #518, the Ayşe restoration, 2026-10-01 21:43 -0400).
- **Type:** read-only. No product code and no test was changed. This file and one ledger entry in `docs/OPEN-COMMITMENTS.md` are the only changes.
- **Input:** the 43 rows of `docs/ayse-capability-regression-audit.md` §6, same order, same numbering.
- **Not shipped.** This branch is pushed, not merged, not deployed. Whether production serves `1b7a06a0` was **not checked** (the Vercel CLI call was not permitted in this session).

## (a) Headline

**At the audit 22 of 43 rows worked. Now 37 of 43 work, and 1 more exists that never existed before (appointment change and cancel): 38 of 43.**
**15 of the 16 rows that were LOST or DEGRADED are now WORKS. The 16th (SOAP advisory) is UNVERIFIED. No row is LOST or DEGRADED.**

| Status | Baseline (audit) | Now (`1b7a06a0`) |
|---|---|---|
| WORKS | 22 | 37 |
| WORKS-UNTESTED | n/a | 1 |
| NEW | n/a | 1 |
| DEGRADED | 6 | 0 |
| LOST | 10 | 0 |
| UNVERIFIED | 2 | 2 |
| NEVER EXISTED | 3 | 2 (carried over: still absent by design) |
| **Total** | **43** | **43** |

Where the rows went:

| From (baseline) | Rows | To (now) |
|---|---|---|
| LOST (10) | 2, 3, 9, 10, 12, 14, 21, 25, 26, 28 | all 10 WORKS |
| DEGRADED (6) | 5, 17, 19, 27, 30 | 5 WORKS |
| | 36 | UNVERIFIED |
| UNVERIFIED (2) | 13 | WORKS |
| | 40 | UNVERIFIED |
| NEVER EXISTED (3) | 15 | NEW |
| | 31, 33 | NEVER EXISTED |
| WORKS (22) | 1, 4, 6, 7, 8, 11, 16, 18, 20, 22, 23, 24, 29, 32, 34, 35, 38, 39, 41, 42, 43 | 21 WORKS |
| | 37 | WORKS-UNTESTED |

Three things to know before quoting these numbers:

1. **What "baseline" is.** The audit's status column describes `origin/main` at `7f902b41` on 2026-10-01, before the restoration. It was judged against two "last good" commits, `076720ae` (2026-09-26) and `e2371dbe` (2026-09-20). The Friday commit `0902e7d4` (2026-09-25 21:12, PR #442) is not named in the audit; it lies between PR #432 and `076720ae`. So "22 of 43" is the state at the audit, not the state on Friday. By the audit's own "last good" column, rows 9, 10, 12, 14, 21 and 25 were already lost on Friday, and row 15 never existed, so today's code does more than Friday's did on those seven rows.
2. **How mixed rows were counted.** Seven audit cells carry more than one label (11, 19, 31, 32, 33, 41, 43). Each is counted under its first label; row 33 has no label and a "last good" of "never", so it is counted as NEVER EXISTED. The audit text is copied unchanged in the table.
3. **Row 37 is not a regression.** It moved from WORKS to WORKS-UNTESTED only because this re-score requires a named test: half of the row (the "Ayşe'ye Danış" panel route) has none. Its code did not get worse.

NEVER EXISTED is not one of the six "now" statuses in the brief. Rows 31 and 33 keep it because nothing else is true: there is still no chat tool that sends a message or handles a document, by design.

### Confirmation runs (once each, on `1b7a06a0`)

| Command | Result |
|---|---|
| `npm run test:ayse` | 232 tests, 232 pass, 0 fail |
| `npm run test:izolasyon` | 372 tests, 372 pass, 0 fail |
| `npx tsc --noEmit` | clean (exit 0, no output) |
| 25 supporting test files cited as evidence below, run once in one command | 798 tests, 798 pass, 0 fail |
| `lib/specialties/brans-alan-sizmasi-rotalar.test.ts` | 6 tests, 6 pass, 0 fail |

Not run, as instructed: the full `npm test` and the live audit (`npm run denetim:eylem`).

The 25 supporting files: `kapsamKilidi`, `aktifHasta`, `konusmaBaglami`, `sesDosya`, `yarimSoz`, `personaEngine`, `acilis`, `dosyaSorgu/denetim`, `dosyaSorgu/vizitTuru` (all under `lib/asistan/`); `hastaCozumleyici`, `hastaAramaIndeksi`, `hastaDosyaKart`, `kimlikSorusu`, `soapUret`, `saglamlik`, `aramaAltinSorular`, `kapsamBugunSayim` (under `lib/doktor/`); `lib/randevu/takvimSorusu`, `lib/ai/sureButcesi`, `lib/ai/sistemParcalari`, `core/eylemler/tests/eylem`, `core/eylemler/tests/sessizYol`, `lib/iletisim/iletisim`, `lib/iletisim/iletisim-rotalar`, `lib/gelenBelgeler/gelenBelgeler`.

## (b) The 43 rows

Evidence level, shown in brackets:

- **[R]** route test: the real `/api/asistan/chat` or `/api/asistan/fish-tur` handler, in-memory database, recording fake model.
- **[U]** unit test on the real function the route calls.
- **[L]** live Luna audit, `docs/denetim/2026-10-02-ayse-eylem.md`, production pass (`uretim`), row number on both channels (`yazi` and `ses`). 60 of 60 action sentences called the expected tool.

Test files, short names: ROTA = `lib/asistan/ayseRota.test.ts` (test name is `[acik]` or `[yok]` plus the sentence), FISH = `lib/asistan/fishTur.test.ts`, KOMUT = `lib/asistan/ayseKomut.test.ts`, KAYIT = `lib/asistan/ayseKayit.test.ts`, TEK = `lib/asistan/tekBeyin.test.ts`. All five ran inside `npm run test:ayse`.

| # | Capability | Baseline status (audit, unchanged) | Now | Evidence | What changed, or why still open |
|---|---|---|---|---|---|
| 1 | Find a patient by name (suffixes, split names, ASR spelling) | WORKS (resolver tests pass; QA set rows 1-16) | WORKS | [U] `hastaCozumleyici.test.ts`: "Umutcan Türk oğlunun doğum tarihini verir misin?", "Ayşe Yeşilin son muayenesinin özetini verir misin?". [U] `hastaAramaIndeksi.test.ts`: "hic indeks satiri olmayan hekimin hastasi adla bulunur" | NOTYA-AYSE-GERI-07: a patient without index rows is now found. The production index coverage query is still not run (GERI-07a). |
| 2 | Patient whose name collides with an off-topic word (Burcu, Erdoğan, Faiz ...) | LOST when the sentence has no in-scope keyword | WORKS | [U] `kapsamKilidi.test.ts`: "NOTYA-KAPSAM-06 geçirir: Burcu Yılmaz en son ne zaman geldi?" and the three other name sentences; "full name of the doctor's own patient: in scope, although the bare gate refuses the sentence" | PR #517 (NOTYA-KAPSAM-06), merged before #518. Accepted gap: a first name alone that is also a clear off-topic word ("Yağmur var mı bugün") is still refused (KAPSAM-06c). |
| 3 | Clinical question whose words collide with the off-topic list (kriptorşidizm, araba tutması ...) | LOST | WORKS | [U] `kapsamKilidi.test.ts`: "NOTYA-KAPSAM-06 geçirir: Kriptorşidizm ne zaman opere edilir?" and the four other clinical sentences, plus 17 "çakışma sınıfı" sentences | PR #517. All nine audit sentences pass the gate. |
| 4 | Open a chart by name ("X dosyasını aç") | WORKS (deterministic since `7a2f4298`) | WORKS | [R] ROTA: "[yok] Deniz Aksoy dosyasını aç" (route `dosya-ac`) | Unchanged. Now pinned in the routing table (GERI-00). |
| 5 | Unnamed follow-up about the open patient | DEGRADED: `toplam`, `en çok`, `vaka`, `kimdi` send it to the practice-wide search | WORKS | [R] ROTA: "[acik] Toplam kaç aşısı var", "[acik] En çok hangi şikayetle geldi". [U] `aktifHasta.test.ts`: "NOTYA-AYSE-GERI-01: toplam / en çok / en sık / vaka tek başına kohort değildir" | NOTYA-AYSE-GERI-01. |
| 6 | Identity / contact questions | WORKS (code path unchanged) | WORKS | [R] ROTA: "[acik] Annesinin adı ne?" (route `kimlik`). [R] TEK: "kimlik sorusu: iki yolda aynı ekran (değerlerle); ses değeri SÖYLEMEZ" | Unchanged. |
| 7 | İlk-10 chart questions, text | WORKS (evidence path intact; 103/103 on Luna, text) | WORKS | [R] TEK: "NOTYA-LUNA-ARAMA-01: ... adla açılan hastaya İlk 10 sorusu dosyayı getirir". [U] `dosyaSorgu/denetim.test.ts`: "altın beklentiler (fikstür × soru)" | Unchanged path. The 103-question Luna audit predates the restoration and was not repeated after routes changed (gap 5). |
| 8 | İlk-10 chart questions, voice | WORKS (short chart plus evidence block; uncapped since #510) | WORKS | [R] TEK: "kanal:'ses' + İlk-10 sorusu (adsız, açık hasta) → kısa özet + kanıt bloğu". This test posts to the old `ses-llm` route. The evidence block and the uncapped speech live in the shared `ayseCevapla` (`ayseCevapla.ts:780`), which `fish-tur` calls with the same `kanal: 'ses'` (`fish-tur/route.ts:336-341`). | Unchanged. No test asks an İlk-10 question through `fish-tur` itself (gap 6). |
| 9 | General clinical question with no patient open (dose, first-line treatment, differential) | LOST when the sentence contains a search keyword: count template | WORKS | [R] ROTA: "[yok] Otitte ilk seçenek tedavi nedir", "[yok] Ateşli çocukta parasetamol dozu nedir", "[yok] Tanı koymama yardım eder misin". [R] FISH: "NOTYA-AYSE-GERI-01: dosya kelimesi geçen cümle sesli turda da sayım şablonu almaz" | NOTYA-AYSE-GERI-01. Proven: the turn reaches the model with no count sentence. Not proven: what Luna answers. |
| 10 | Any command or request with no patient resolved | LOST: count template instead of "which patient?" | WORKS | [R] KOMUT: "ad söylenmediyse araç zorlanmaz, hasta_adi alanı sunulur; model sorar", "model aracı adsız çağırırsa kart çıkmaz: Hangi hasta için Hocam?". [L] row 29: "Hangi hasta için Hocam?" on both channels | NOTYA-AYSE-GERI-01 and -03. |
| 11 | Record card with explicit wording (kaydet, yazıver, dosyaya gir) | WORKS in code; Luna tool call never audited: UNVERIFIED end to end | WORKS | [R] KOMUT: suite "komut → zorlanan araç → kart; onaydan önce hiçbir şey yazılmaz". [R] ROTA: "[acik] Ateşi 38,2, kaydet", "[acik] Aşıyı dosyaya gir". [L] rows 7, 8, 9, 18 | NOTYA-AYSE-GERI-03 forces the tool; GERI-08 closed the "never audited" part: Luna called the expected tool on both channels. |
| 12 | Record card with natural wording (alerjisini ekle, kilosunu ekle, kronik hastalıklara ekle) | LOST: quick card answers | WORKS | [R] ROTA: "[acik] Penisilin alerjisini ekle", "[acik] Kilosunu 12,4 kilo olarak ekle", "[acik] Astım tanısını kronik hastalıklara ekle". [L] rows 1, 4, 5, 6, 10, 11 | NOTYA-AYSE-GERI-03. |
| 13 | Record card, other natural wording (kes, dozunu değiştir, not al, işle, düzelt) | UNVERIFIED: reaches Luna with the tools, tool call not forced | WORKS | [R] ROTA: "[acik] Ventolini kes", "[acik] Ventolinin dozunu 2x2 olarak değiştir", "[acik] Dosyasına not al: annesi sigarayı bıraktı". [L] rows 2, 12 to 17, 19 and 20 | NOTYA-AYSE-GERI-03 (tool now forced) and GERI-08 (live). |
| 14 | Appointments: create by natural sentence | LOST. Owner: `fix/ayse-randevu-capability` | WORKS | [R] KOMUT: "oluştur: tarihli cümle takvim okumasına gitmez; kart → sesli okuma → Evet → randevu takvimde", "ses: randevu isteği → hasta → gün → saat → kart → Evet". [L] rows 21, 22, 27, 30, 31 | NOTYA-AYSE-GERI-03 and -04 (date resolved by the server). Clock times stay Turkish time (GERI-03a, product decision open). |
| 15 | Appointments: change, cancel | NEVER EXISTED as a tool. Owner: same | NEW | [R] KOMUT: "saat değiştir: tek randevu sunucuda bulunur; yalnız saat söylendiyse gün korunur; Evet taşır", "iptal: tek randevu → kart → Evet → durum iptal, satır silinmez", "HASTA-IZOLASYON-01: model randevu_id uydursa da yok sayılır". [L] rows 23, 24, 25: tool called on 6 of 6 | NOTYA-AYSE-GERI-03: tools `randevu_tasi`, `randevu_iptal`. In the live audit the patient had two future appointments, so five of six turns ended in "Hangisi?" and no card; the card and the commit are proven by the mocked tests only. |
| 16 | Calendar read (today, tomorrow, week, slot) | WORKS (deterministic; tests pass) | WORKS | [R] ROTA: "[yok] Bugün randevum var mı?", "[acik] Yarın 15:00 boş mu?", "[yok] Yarın hangi saatler boş?". [R] FISH: "modelsiz tur (takvim): model çağrılmaz, cevap yine konuşulur". [R] KOMUT: "çalışma saatlerinden randevular düşülür; kapalı gün kapalı denir" | Free slots of a day added (GERI-03). |
| 17 | Vaccine record as a table | DEGRADED: short card line or model formatting. Owner: `fix/ayse-voice-endpointing-vaccine-table` | WORKS | [R] KAYIT: "yazı ve ses aynı ekran metnini verir; model çağrılmaz; 18 kayıt, karnenin sütunlarıyla" | NOTYA-AYSE-GERI-05. Built from stored rows, no model call. |
| 18 | Exam summary: latest, or one named visit type / age | WORKS on text (#512); voice needs the word "özet" | WORKS | [U] `dosyaSorgu/vizitTuru.test.ts`: "6 aylık sağlam çocuk muayenesi → 6 aylık vizit döner". [R] KAYIT: "tek adlı muayene (son muayenesini özetle) eski yolunda kalır". [U] `sesDosya.test.ts`: "liste, seri, geçmiş ve tablo istekleri tam dosyayla gider (denetimdeki dört cümle dahil)" | Text unchanged. Voice no longer needs the word "özet" (GERI-06). |
| 19 | Exam summaries: several selected, or all exams | DEGRADED on text (whole-chart summary template), LOST on voice (visits not in the short chart) | WORKS | [R] KAYIT: "son üç muayene: üç tarihli blok (şikayet, tanı, plan), yazı ve ses aynı ekran", "tüm muayeneler: 14 blok eskiden yeniye; ses yalnız yönlendirir" | NOTYA-AYSE-GERI-05. Voice reads up to three in full, then points to the screen. |
| 20 | Measurement: latest value | WORKS (quick card) | WORKS | [R] ROTA: "[acik] Kilosu kaç?". [R] KAYIT: "baş çevresi sorusu kilo ile cevaplanmaz: kayıt yoksa öyle denir" (also asserts "Boyu kaç?") | Height and head circumference now answer too (GERI-05). |
| 21 | Anthropometrics for one exam, as a series, across all exams, as a table | LOST: one-line latest measurement; head circumference and height are not in the card at all | WORKS | [R] KAYIT: "seri: 14 muayenenin kilosu zaman sırasıyla", "kilo + boy + baş çevresi: kaydı olmayan ölçüm kayıt yok", "tek muayene: son muayenedeki boy ve kilo" | NOTYA-AYSE-GERI-05. BMI and percentiles are not shown because they are not stored (GERI-05a, waiting on Dr. Gökhan). |
| 22 | Growth / percentiles asked with the words büyüme, persentil, eğri | WORKS (evidence path) | WORKS | [R] ROTA: "[acik] Büyümesi nasıl gidiyor?". [R] TEK: "Q3 büyüme: sayfa geçişinden sonra kanıt bloğu yeni çocuğun ölçüm serisini Neyzi ile taşır" | Unchanged. |
| 23 | Lab values and lab summary | WORKS (QA set rows 25-28) | WORKS | [U] `dosyaSorgu/denetim.test.ts`: "altın beklentiler" (lab blocks), "Tahlillerine baktın mı? → lab". [U] `hastaDosyaKart.test.ts`: "Son tahlili?" | Unchanged. No route-level row for a lab question (gap 7). |
| 24 | Medication questions with a chart open | WORKS (quick card and evidence path) | WORKS | [L] row 33 "Ventolini ne zaman kestik": answered from the chart, no tool, both channels. [U] `dosyaSorgu/denetim.test.ts`: "(a) amoksisilin AKTİF bölümünde değil". [U] `hastaDosyaKart.test.ts`: "birleşik alerji + reçete ikisini de söyler" | Unchanged. A question is still not treated as a command (KOMUT: "soru komut değildir"). |
| 25 | Drug interaction / dose question with no chart open | LOST: count template | WORKS | [R] ROTA: "[yok] İlaç etkileşimi var mı kontrol et", "[yok] Ateşli çocukta parasetamol dozu nedir" | NOTYA-AYSE-GERI-01. Routing only; Luna's answer to these was not audited. |
| 26 | Voice: spoken confirmation of a card | LOST for Ayşe | WORKS | [R] FISH: "kart sesle hazırlanır ve okunur; Evet model çağırmadan, dokunuşun omurgasından kaydeder", "Hayır: bekleyen kart geri çekilir", "ciddi ilaç uyarısı taşıyan kart sesle onaylanamaz" | NOTYA-AYSE-GERI-02. Text input to the route; never tried with a microphone. |
| 27 | Voice: updating a prepared card by voice | DEGRADED: old draft is not withdrawn, and 26 | WORKS | [R] FISH: "aynı hasta + aynı eylem: tek güncel taslak kalır, Evet onu kaydeder" | NOTYA-AYSE-GERI-02. |
| 28 | Voice: automatic continuation of a cut answer | LOST; partly masked by #510 for evidence answers | WORKS | [R] FISH: "yedi cümlelik cevap beşte sessizce kesilir, kalan saklanır; devam et kalan ikiyi model çağırmadan okur" | NOTYA-AYSE-GERI-02. Server side only. The browser side (remainder read when playback stops) is UNVERIFIED (GERI-02a). |
| 29 | Voice: "bana anlat / devamını oku" | WORKS (re-reads the whole screen answer) | WORKS | [R] KAYIT: "tüm muayeneler: ... bana anlat tamamını okur" (through `fish-tur`, route `oku`). [U] TEK: "okumaIstegiMi ve sınırsız okuma" | Unchanged. Now also proven on the Fish route. |
| 30 | Voice: detail beyond the short chart (older visits, full lab, prescriptions history) | DEGRADED | WORKS | [R] FISH: "liste / geçmiş isteği sesli turda TAM dosyayla gider", "kısa özette cevap yoksa model işaret yazar, sunucu aynı turu tam dosyayla yeniden sorar" | NOTYA-AYSE-GERI-06. The full chart is still truncated in the middle by its token budget (GERI-06a). |
| 31 | Message / WhatsApp / e-mail to a patient from chat | NEVER a chat action by design (tier 3: Ayşe points to the İletişim page, `docs/AYSE-EYLEM-MIMARISI.md:64-66`). İletişim page templates unchanged: WORKS | NEVER EXISTED | No send tool in `core/eylemler/temelEylemler.ts` (the one message tool, `mesaj_hasta_ile_konusuldu`, closes a thread and sends nothing). [U] `core/eylemler/tests/eylem.test.ts`: "reçete / silme / dışarı gönderme çağrıştıran hiçbir anahtar yok". İletişim page: `lib/iletisim/iletisim.test.ts`, `iletisim-rotalar.test.ts` pass | Unchanged, by design. |
| 32 | Free-text message draft in chat | WORKS with a chart open (model path; wording quality UNVERIFIED); count template without one | WORKS | [R] ROTA: "[yok] Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz" (route `model`) | NOTYA-AYSE-GERI-01 removed the count template for the no-chart case. Wording quality on Luna is still not audited. |
| 33 | Document handling in chat | No document tool exists; status questions go to the model. Belge Kasası and Gelen Belgeler pages: section 7 | NEVER EXISTED | No document tool in `core/eylemler/temelEylemler.ts` (16 tools registered, none for documents) | Unchanged. Not in the restoration scope. |
| 34 | Patient summary (Soru 1), day opening | WORKS | WORKS | [R] TEK: "kanal:'ses' + İlk-10 sorusu ..." (asks "Bu hastayı bana kısaca özetler misin?" on both channels). [U] `dosyaSorgu/denetim.test.ts`: "altın beklentiler". [U] `acilis.test.ts`: "özgeçmiş açılışı tanınır, normal selam ve cevap karışmaz" | Unchanged. |
| 35 | SOAP note body | WORKS, slower (runs on Luna-Pro) | WORKS | [U] `soapUret.test.ts`: "A + B birleşir: gövde A'dan, öneri alanları yalnız B'den". [R] `brans-alan-sizmasi-rotalar.test.ts`: "3. SOAP üretimi (POST /api/sessions/[id]/end)" | Unchanged. Speed on the real model was not measured again. |
| 36 | SOAP advisory part (differential, prescription suggestion, red flags, patient summary) | DEGRADED | UNVERIFIED | Code: cap raised 2000 to 6000 (`lib/doktor/soapUret.ts:443`). [U] `soapUret.test.ts`: "gövde çağrısına uzunluk kuralı gider (NOT-HIZ-03); maxTokens A 8000, B 6000" asserts the cap only | NOTYA-AYSE-GERI-07. The defect was measured on the real model (advisory empty without the fallback); the fix was never measured on the real model (GERI-07c). A mocked test cannot show it. |
| 37 | "Ayşe'ye Danış" panel and the in-note consult box | WORKS: these call the model directly with the full chart and tools; no router in front | WORKS-UNTESTED | In-note box: [R] `brans-alan-sizmasi-rotalar.test.ts`: "4. Notuma göre yenile (POST /api/doktor/not-konsult)"; [U] `saglamlik.test.ts`: "kesik zarf: cevap kurtarılır, yarım SOAP alanı ve yarım eylem taslağa YAZILMAZ". Panel: `app/api/doktor/konsult/route.ts` is only read as source text by tests | GERI-07 added the JSON flag to the in-note box. No test drives the panel route, so the row as a whole is not WORKS under this method. Not a regression. |
| 38 | Cohort search and counts | WORKS with three known open defects (`NOTYA-ARAMA-PENCERE-VARSAYILAN-01`, `-KAYIT-PENCERE-01`, `-DOGUM-NEGASYON-01`) | WORKS | [U] `aramaAltinSorular.test.ts` (golden questions). [R] ROTA: "[yok] Kaç hastam var?", "[yok] Astım tanılı hastaları listele". [U] `hastaCozumleyici.test.ts`: "NOTYA-ARAMA-PENCERE-VARSAYILAN-01: 90 günden eski aşı kaydı olan hasta ... bulunur" | GERI-01 fixed the first defect (no implicit 90-day window). The other two are still open, and an unwindowed search is cut at 400 notes / 200 vaccine rows without saying so (GERI-01a). |
| 39 | Multi-specialty: branch locks, specialty tools | WORKS (no prompt file changed) | WORKS | [U] `core/eylemler/tests/eylem.test.ts`: "branşa özel eylem BAŞKA branşa sızmıyor", "baş çevresi yalnız pediatrik ölçüm kapsamı olan branşta". [R] `brans-alan-sizmasi-rotalar.test.ts` (6 route tests across specialties) | Unchanged. Every Ayşe route test above uses a paediatric doctor. |
| 40 | Multi-specialty: voice for the other personas | UNVERIFIED (still ElevenLabs; depends on agent configuration outside the repo) | UNVERIFIED | None possible from code: the agents are configured outside the repository | Unchanged. Not in the restoration scope. |
| 41 | Memory and learning | WORKS; preference extraction runs at effort `none` with parsed JSON: UNVERIFIED risk | WORKS | [U] `saglamlik.test.ts`: "çağrı effort none ile gitmez, JSON bayrağı taşır, tavan akıl yürütmeye yer bırakır", "liste ortasında kesilen cevap: tamamlanan kayıtlar kalır" | NOTYA-AYSE-GERI-07 removed the risk in code (effort `low`). Cost and latency on the real model not measured (GERI-07c). |
| 42 | Follow-up continuity ("peki yarın?", "dozu?") | WORKS (tests pass; file not in `npm test`) | WORKS | [U] `konusmaBaglami.test.ts`: "Peki yarın? inherits the calendar intent", "reçete: dozu? → kaç gün? and a named drug". [R] KOMUT: "araya giren soru komutu bitirir; takvim sorusu bitirmez" | GERI-00 added the file to `npm test`. No route-level row for a plain follow-up (gap 7). |
| 43 | Off-topic refusal | WORKS, with the false positives in rows 2 and 3 | WORKS | [R] ROTA: "[yok] Bitcoin almalı mıyım?" (route `kapsam`). [U] `kapsamKilidi.test.ts`: "NOTYA-KAPSAM-06 reddeder: ..." (30 sentences) | PR #517 removed the false positives. A topic not on the word list still rests on the model rule (KAPSAM-02). |

## (c) Remaining gaps, ranked by doctor impact

No row is LOST or DEGRADED. The list has two parts: rows that are not WORKS, and WORKS rows with an open item behind them.

### Rows that are not WORKS

| Rank | Row | Status | Priority | Why it matters | Smallest next step |
|---|---|---|---|---|---|
| 1 | 36 SOAP advisory | UNVERIFIED | P1 | Differential, prescription suggestion and red flags appear on every note. If the 6000 cap is still not enough, they exist only through the Sonnet fallback. | One measured SOAP run on the real model with the guard disabled; record it in `docs/denetim` (GERI-07c). |
| 2 | 37 "Ayşe'ye Danış" panel | WORKS-UNTESTED | P2 | The audit named this panel as Dr. Gökhan's workaround. Nothing suggests it is broken; nothing proves it works. | One route test that posts to `/api/doktor/konsult` with the fake model and asserts the full chart and the tools are in the request. |
| 3 | 40 Voice for other personas | UNVERIFIED | P2 | Other specialties' voice still runs on ElevenLabs agents configured outside the repo. Beta doctors today use Ayşe. | One live call per non-Ayşe persona, or export the agent configuration into the repo so it can be read. |
| 4 | 33 Documents in chat, 31 messages from chat | NEVER EXISTED | P2 | By design; listed so the count is complete. | Product decision only. No engineering step. |

### WORKS rows with an open item

| Rank | Rows | Priority | Open item | Smallest next step |
|---|---|---|---|---|
| 1 | 26, 27, 28, 30 | P0 | Every voice proof used text input to `fish-tur`. Spoken "Evet", "devam et", a sentence cut mid-way and the name-then-surname pause were never tried with a microphone (GERI-02a, GERI-06a). | One live Fish voice session by Kaan or Dr. Gökhan covering those four cases. |
| 2 | all | P0 | Whether production serves `1b7a06a0` was not checked in this session. | `vercel ls` / `vercel inspect` for the production alias; confirm READY at that SHA. |
| 3 | 11 to 15 | P1 | The live audit report is an untracked file in this worktree; it is not on `origin/main`, and the ledger still says the audit was "NOT RUN" (GERI-08a). This document cites it. | Commit `docs/denetim/2026-10-02-ayse-eylem.md` and close GERI-08a. |
| 4 | 12, 24 | P1 | Seen in the live audit, not one of the 43 rows: "Penisilin alerjisini kaldır" produced a card saying penicillin is not recorded (row 3), while "Alerjisi var mı" answered "Penisilin" from the same chart (row 32). `alerji_kaldir` reads only the chart notes (`core/eylemler/temelEylemler.ts:723-728`); the synthetic patient's allergy is in the intake form (`lib/asistan/tests/gercekciHasta.ts:86`). Whether real patients have form-only allergies is not known. | Check on one real chart whether an intake-form allergy can be removed by Ayşe; if not, make the tool read the same source as the quick card. |
| 5 | 7, 8, 9, 25, 32 | P1 | The tests prove the route, not Luna's answer. The 103-question Luna audit ran before S1 and S5 changed where many of those questions go. | Re-run the 100-question audit once on `1b7a06a0`. |
| 6 | 1 | P1 | The index coverage query was never run (GERI-07a); migration 111 is not applied and was written from code (GERI-07b). | Run the read-only count query from audit §9; compare migration 111 with the production table. |
| 7 | 8, 23, 42 | P2 | Proven by a unit test or through the old voice route, not through the route Ayşe uses. | Three rows in the existing harness: an İlk-10 question through `fish-tur`, a lab question and a "peki yarın?" follow-up in the routing table. |
| 8 | 15 | P2 | With two future appointments, "Randevusunu perşembeye al" asked "Hangisi?" in writing and prepared a card for the nearer one by voice (live rows 23). The forced tool is the same; the model's arguments differed. | Decide which behaviour is wanted; add a mocked test for it. |
| 9 | 14, 15 | P2 | Clock times are Turkish time for a doctor abroad (GERI-03a). | Kaan's decision. |
| 10 | 21 | P2 | BMI and percentiles are not shown (not stored) (GERI-05a). | Confirm with Dr. Gökhan that "if stored" covers it. |
| 11 | 38 | P2 | Two search defects still open (`NOTYA-ARAMA-KAYIT-PENCERE-01`, `-DOGUM-NEGASYON-01`); silent row limits (GERI-01a). | One scoped PR each, after Kaan's priority call. |

Ledger rows that are out of date (not edited here): NOTYA-AYSE-GERI-00 to -08 still read "CODE READY, not merged" although PR #518 is on `origin/main`; GERI-00a (second full `npm test` before merge) has no recorded result.

## (d) What this method cannot see

This re-score reads code, runs tests with a fake model, and reads one live report. It is blind to the following.

- **Real voice.** No test calls Fish ASR or TTS. Speech recognition accuracy on Turkish names and drug names, the voice itself, the 700 ms end-of-turn tail in a real room, barge-in, and latency from end of speech to first audio are all outside it. The "voice" channel in the tests and in the live audit is text posted to `/api/asistan/fish-tur`.
- **Real patient data.** Tests and the live audit use one synthetic paediatric patient ("Deniz Aksoy": 14 visits, 18 vaccine rows, 5 drugs) and a few name-only fixtures. Long charts that hit the token budget, charts with missing or contradictory fields, real name collisions in a 500-patient panel, and production index coverage are not exercised.
- **The 29 other specialties and Klinik.** Every Ayşe route test builds a paediatric doctor. The specialty leak suite covers form fields and prompts across specialties, not the assistant's actions. Specialty task tools (`jine_gorevi_ekle`, `derm_gorevi_ekle`, `dahiliye_gorevi_ekle`), adult patients, and the Klinik and secretary roles were not driven through the assistant routes by any test cited here.
- **Browser-side behaviour.** The microphone recorder, the hold-and-merge of a half sentence, playback of a stored remainder, the card on screen and its tap, the floating panel, and anything in `components/asistan/AsistanOturumContext.tsx` run only in a browser. No browser test exists for them.
- **Luna outside the 33 action sentences.** The live report covers actions only. Clinical answer quality, refusals under scope rule 15, message wording and summaries on the current code were not measured. The live pass also ran with the guard disabled, which production does not.
- **The live report itself.** It was not re-run here (no credentials). It is taken as written, from an untracked file, and "production pass" in it means "production behaviour of the code" (the command forces its tool), not "ran against the production deployment".
- **Production.** Deployment state, environment variables, the applied database schema and real traffic were not looked at.
