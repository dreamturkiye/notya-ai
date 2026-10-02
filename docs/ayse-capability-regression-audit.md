# Ayşe capability regression audit

- **Date:** 2026-10-01 (US Eastern)
- **Owner:** Claude audit job, branch `audit/ayse-capability-regression`. Decisions: Kaan. Live checks: Dr. Gökhan.
- **Audited code:** `origin/main` at `7f902b41` (2026-10-01 17:25 -0400).
- **Type:** read-only. No product code was changed. This file and one ledger section in `docs/OPEN-COMMITMENTS.md` are the only changes.
- **Out of scope here (owned by other jobs):** appointments (`fix/ayse-randevu-capability`) and the vaccine table plus voice endpointing (`fix/ayse-voice-endpointing-vaccine-table`). Both branches had no commits when this audit ran. Where the shared cause touches them it is described, but no fix is proposed for them.

## 1. Summary

**There is not one shared cause, and it is not the Luna transport.** Tool schemas are sent to Luna and tool calls are parsed back correctly. The regression has three independent causes, in order of doctor impact:

1. **Deterministic routers answer before the model is called.** `ayseCevapla` now runs six model-free steps in front of Luna (scope gate, calendar reader, identity, patient/cohort search, quick card, deterministic chart-open). Each one returns its own sentence and ends the turn, so the model and its tools never see the request. This is where the patient-count template comes from, and it is why "add / change / list / show all" requests get a one-line lookup instead of an action or a full answer.
2. **The voice channel swap dropped the non-model voice handlers.** When Ayşe's voice moved from the ElevenLabs Custom LLM route to the Fish route on 2026-09-29, the new route kept only the brain call. Spoken confirmation ("Evet"), withdrawal of a superseded draft card and automatic continuation of a cut answer live in the old route and are not called from the new one. One day earlier the voice channel had also been switched to a shortened patient chart.
3. **The model swap itself (Sonnet to Luna) is unverified as a cause of lost actions.** No audit run on Luna has ever exercised a tool call that produces a card, on either channel. Everything measured on Luna so far is read-only questions on the text channel.

Two findings matter for how this is read:

- **The patient-count template is older than the Luna migration.** The same sentences come out of the baseline code of 2026-09-26 (section 4.3 shows the side-by-side run). It entered on 2026-09-20/21, under Sonnet. What changed afterwards is how often a turn reaches it.
- **Several of the capabilities Dr. Gökhan lists were lost under Sonnet**, when routers were placed in front of the model (2026-09-21) and when his voice was moved onto the single-brain path (2026-09-25). The Luna period added three more routers and the voice swap on top.

Answers to the four hypotheses in the brief:

| Hypothesis | Verdict | Evidence |
|---|---|---|
| Tool schemas not passed to Luna | No | `lib/ai/cagir.ts:211-216` puts `tools` and `tool_choice` on the request; `lib/ai/saglayici.ts:151-155` translates them (`any` becomes `required`) |
| Tool-call parsing mismatch | No | `lib/ai/saglayici.ts:207-224` (non-streaming) and `:313-319`, `:345` (streaming) rebuild `tool_use` blocks; `lib/ai/saglayici.test.ts` and `lib/ai/kapilar.test.ts` pass |
| Fast-path router intercepting before the LLM | **Yes, the dominant cause** | section 4.1 to 4.5 |
| Scope gate over-blocking | **Yes, but narrow and one day old** | section 4.2: patient names and clinical terms that collide with the off-topic word list are refused |

## 2. Method and limits

- Read the current code paths and diffed them against the baselines in section 3.
- Ran ad-hoc probes against the pure routing functions (`kapsamDisiMi`, `sorguyuAyikla`, `istatistikKur`, `takvimSorusuCoz`, `dosyaSoruCevap`, `soruTuruBul`, `sesTamDosyaGerekirMi`, `kayitNiyetiMi`, `aktifHastaKullanilsinMi`, `sohbetKademesi`). The probe files were temporary and are deleted. Their output is quoted in section 4.
- Ran the assistant-related test files once: 14 files targeted, 13 loaded, **377 tests passed, 0 failed** in those 13. `lib/asistan/tekBeyin.test.ts` could not load in this worktree (`Cannot find module '@supabase/supabase-js'`: the worktree has no `node_modules` and creating the symlink was not permitted). The full `npm test` was not run for the same reason.
- Two read-only sub-reviews covered the documentation inventory and the non-chat AI surfaces. Their items in section 7 are marked where I spot-checked them myself.

Not verifiable from code, stated as UNVERIFIED wherever it matters:

- Whether production is serving `7f902b41` (the deployment status call was not permitted in this session).
- Production data state, in particular whether every patient has rows in `patient_search_tokens`.
- How Luna actually behaves when offered the tools (no live model call was made).
- Which model the ElevenLabs-hosted agents used before the single-brain switch.

## 3. Baselines and timeline

| Label | SHA | Date (commit) | Meaning |
|---|---|---|---|
| **Pre-router** | `e2371dbe` | 2026-09-20 17:39 -0400 | Last commit before the first model-free router. Chat resolved the patient by name, attached the full chart and called Sonnet with the action tools. `lib/doktor/hastaAramaFiltre.ts` does not exist yet; the chat route contains no `cozumKonus`, `dosyaSoruCevap` or `sayiMetin`. |
| **Pre-Luna (primary baseline)** | `076720ae` (#463) | 2026-09-26 15:31 -0400 | Last commit before any OpenRouter/Luna code. Parent of `6f93a6c8` (#464). All diffs in this audit are against this SHA unless stated. |
| Last Sonnet clinical turn | `95566036` | 2026-09-27 06:36 -0400 | Parent of `72706af5` (#468). Between #464 and #468 only social turns ran on Luna; clinical chat turns were still Sonnet. |
| Audited head | `7f902b41` (#516) | 2026-10-01 17:25 -0400 | `origin/main`. |

Changes that matter, in order:

| Date | SHA / PR | Change | Class |
|---|---|---|---|
| 09-20 17:54 | `6cb5f11e`, then `f32af073`, `5f3449b5` | Clinical-trail patient search, filters, counts | router (search) |
| 09-21 00:55 | `d88ab121` | Per-patient questions answered from the quick card without the model | router (quick card) |
| 09-21 12:08 | `9ca2447b` | Search sentence returned without the model (`cozumKonus`) | router (search template) |
| 09-25 15:57 | `90270e1c` (#432) | Single brain: voice and text share `ayseCevapla`. Switched on for Dr. Gökhan and Kaan the same day via `NOTYA_TEK_BEYIN_DOKTORLAR` (`docs/OPEN-COMMITMENTS.md:2761`) | voice path |
| 09-26 10:43 | `c0facc9f` (#455) | İlk-10 evidence path | router (evidence template) |
| 09-26 17:09 | `6f93a6c8` (#464) | OpenRouter transport; Luna for social turns, Sonnet for clinical | model |
| 09-27 09:13 | `72706af5` (#468) | Luna-Pro primary for every task; Sonnet only as fallback | model |
| 09-27 09:37 | `3a1778d5` (#469) | Pre-call safety gate to Sonnet removed | model |
| 09-28 20:24 | `10225481` (#497) | Voice turns get a shortened chart | voice content |
| 09-29 09:38 | `a6642041`, then `2b093b85`, `40ca5c85`, `078308e9` | Calendar questions answered without the model | router (calendar) |
| 09-29 12:26 | `48f7b6b4` | Ayşe voice fully on Fish (`fish-tur`), no ElevenLabs socket | voice path |
| 09-29 12:54 | `109b23e1` | Direct Anthropic SDK clients removed from call sites | model |
| 09-29 17:38 | `2b28022e` | Primary model Luna instead of Luna-Pro | model |
| 09-29 23:01 / 23:21 | `2b25cb43`, `7a2f4298` | "No chart this turn" block; deterministic "X dosyası açık"; active-patient rule restored after `b4316b32` had removed it that morning | router |
| 09-30 02:50 | `a8f55ac2` | Cohort word list widened (`kimdi`, `vaka` ...) | router (search) |
| 09-30 12:21 | `7661d7fc` | Follow-up rewriter before all matchers | router |
| 09-30 13:22 | `f67ca145` | Tiering: reasoning effort `none` for social and short follow-up turns | model |
| 10-01 09:20 | `57ffd40e` (#503), fix `f076b915` (#508) | Patient-name lookup through a hash index table | lookup |
| 10-01 17:17 | `ee8cb9bf` (#515) | Scope gate | router (refusal) |

## 4. Root causes with evidence

### 4.1 The router stack in front of the model

Order of execution in `lib/asistan/ayseCevapla.ts` on `origin/main`. Every step marked "returns" ends the turn without a model call.

| # | Step | Lines | Since | Returns |
|---|---|---|---|---|
| 0 | Follow-up rewrite and ASR repair | 208-234 | `7661d7fc` 09-30 | no (rewrites the message all later steps see) |
| 1 | Scope gate | 306-317 | `ee8cb9bf` 10-01 | fixed refusal sentence |
| 2 | Calendar reader | 318-366 | `a6642041` 09-29 | day or week summary |
| 3 | Identity / contact question | 412-424 | #422 09-25 | value on screen |
| 4 | "Read it to me" (voice) | 425-436 | #460 09-26 | last screen answer |
| 5 | Patient resolver and cohort search | 443, 459-471 | `9ca2447b` 09-21 | count / list sentence, or "dosyası açık" |
| 6 | Quick card | 485-486 | `d88ab121` 09-21 | "Dosyada ...: ..." sentence |
| 7 | Return of 5 or 6 | 507-514 | | skipped only when `kayitNiyetiMi` matches |
| 8 | Luna with tools | 560-561, 609-611 | | tools exist only when a patient is resolved |

Steps 5 to 7 exist at the pre-Luna baseline. Steps 0, 1, 2 and the deterministic chart-open inside step 5 were added during the Luna period. At the pre-router baseline none of them existed.

### 4.2 Scope gate refuses real patients and real clinical questions (new, 10-01)

`lib/asistan/kapsamKilidi.ts:96-104` refuses when an off-topic pattern matches and no in-scope root is present. The off-topic patterns at `:51-89` are bare word stems, and several are Turkish names or the start of clinical words. Probe output (`true` = fixed refusal, no lookup, no model):

| Message | Refused | Colliding stem |
|---|---|---|
| Burcu Yılmaz en son ne zaman geldi? | true | `burc` (horoscope) |
| Mehmet Erdoğan en son ne zaman geldi? | true | `erdogan` (politics) |
| Ali Erdoğan kim? | true | `erdogan` |
| Faiz Demir bugün geldi mi | true | `faiz` (finance) |
| Kriptorşidizm ne zaman opere edilir? | true | `kripto` |
| Araba tutması için ne önerirsin? | true | `araba` |
| İlk seçim ne olmalı? | true | `secim` (election) |
| C-reactive protein yüksekliği nedenleri | true | `react` (coding) |
| Otel dönüşü döküntü yapan şey ne olabilir | true | `otel` |
| Umutcan Türkoğlu en son ne zaman geldi? | false | |

The gate runs before the patient resolver, so a patient whose name collides is refused whenever the sentence has no in-scope keyword. The existing test file passes because it contains none of these cases.

### 4.3 The patient-count template (pre-Luna, wider reach since)

Mechanism:

1. `lib/doktor/hastaAramaFiltre.ts:594` gives a default "son 90 gün" window to any message containing an aşı word or `sikayet|tani|iltihap|otit|alerji|ilac|randevu|epikriz|form`.
2. `:642` marks the message `klinik` when it has a vaccine word, a clinical vocabulary word, a recognised field, a count or a plural.
3. `lib/doktor/hastaCozumleyici.ts:371-393`: when no patient was resolved and the message is `klinik`, the cohort search runs; with zero hits it returns `{ tur: 'yok', sayiMetin }`.
4. `hastaAramaFiltre.ts:900-918` builds the sentence, ending in `Filtre: ...`.
5. `ayseCevapla.ts:460-462` takes it as the answer and `:507-514` returns it. The model is not called.

So every message that mentions a clinical keyword while no patient is resolved becomes a patient search. Probe, same input on the baseline copy of the file and on main:

| Message (no patient resolved) | `076720ae` | `7f902b41` |
|---|---|---|
| Ali Yılmaz için randevu oluştur | Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. | same |
| Randevu saatini değiştirmek istiyorum | Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. | same |
| Aşı karnesini tablo olarak göster | Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | same |
| İlaç etkileşimi var mı kontrol et | Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | same |
| Epikriz hazırla | Son 90 gün 0 hasta. Filtre: son 90 gün · Belge. | same |
| Otitte ilk seçenek tedavi nedir | Son 90 gün 0 hasta. Filtre: son 90 gün · Plan. | same |
| Ateşli çocukta parasetamol dozu nedir | Kayıtlarda 0 hasta. | same |
| Tanı koymama yardım eder misin | Son 90 gün 0 hasta. Filtre: son 90 gün · Tanı. | same |
| Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz | Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | same |

When the search does find charts, the answer is a patient list instead, which is equally not what was asked.

What widened its reach after the baseline:

- **Name lookup now depends on an index table** (`57ffd40e`). `lib/doktor/hastaAramaIndeksi.ts:72-89` returns the candidate ids; `hastaCozumleyici.ts:296-303` loads only those. An empty result means no patient is considered, and the turn falls into the search above. There is no fallback for a doctor or patient with no index rows (the fallback at `:298` covers only a query error). Index rows are written by five creation paths and a one-off backfill ("27/27" in the commit message). The table has no migration in the repository, and the smoke scripts and the test fixture `lib/asistan/tests/gercekciHasta.ts` insert patients without index rows. Whether any production patient lacks rows is UNVERIFIED; the query that answers it is in section 9.
- **Cohort word list** (`lib/asistan/aktifHasta.ts:15`, widened in `a8f55ac2`): with a patient open, a question containing `toplam`, `en çok`, `en sık`, `vaka`, `kimdi` is treated as a practice-wide search instead of a question about the open chart. Probe: "Toplam kaç aşısı var" gives "Kayıtlarda 0 hasta."; "En çok hangi şikayetle geldi" gives "Son 30 gün 0 hasta. Filtre: son 30 gün · Gelme nedeni."
- **A patient whose first name equals a persona name** ("Ayşe") is never matched by first name alone (`hastaCozumleyici.ts:321`, by design since 09-26). Dr. Gökhan's panel has an Ayşe Yeşil. "Ayşe'nin son aşı tarihi ne" with no chart open gives "Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı."
- **All of Ayşe's voice turns now take this path.** Before 09-25 Dr. Gökhan's voice was the ElevenLabs-hosted model, which chose its own tools; from 09-25 his voice, and from 09-29 every doctor's Ayşe voice, goes through `ayseCevapla`.

### 4.4 The quick card swallows commands and list requests (pre-Luna)

`lib/doktor/hastaDosyaKart.ts:115-162` answers from the card whenever the message contains one of its keywords, and `ayseCevapla.ts:507` returns that answer unless `kayitNiyetiMi` matches. `core/eylemler/oneri.ts:118-124` recognises only `kaydet`, `yazıver`, `dosyaya gir/yaz/ekle`, `kayda geç`, `sen yaz/gir/ekle`, `geçir`, `rica ediyorum`, `hazırla` at the end and a few more. Plain `ekle`, `işle`, `kes`, `değiştir`, `düzelt`, `not al`, `oluştur`, `ver`, `iptal` are not in it.

Probe, patient resolved:

| Message | Route taken | What the doctor gets |
|---|---|---|
| Penisilin alerjisini ekle | quick card, no model | "Dosyada alerji: kayıt yok." (`alerji_ekle` never offered) |
| Kilosunu 12,4 kilo olarak ekle | quick card, no model | "Dosyada son ölçüm: ..." (`olcum_ekle` never offered) |
| Astım tanısını kronik hastalıklara ekle | quick card, no model | "Dosyada kronik hastalık: kayıt yok." |
| Bütün muayenelerdeki kilo ölçümlerini sırayla göster | quick card, no model | one line with the latest measurement |
| Kilo, boy ve baş çevresi ölçümlerini tablo yap | quick card, no model | one line with the latest measurement |
| Tüm antropometrik ölçümlerini göster | quick card, no model | one line with the latest measurement |
| Baş çevresi ölçümleri neler | quick card, no model | the latest measurement, which is a weight |
| Aşılarını göster | quick card, no model | the card's short vaccine line |
| Randevusunu perşembeye al | quick card, no model | "Dosyada randevu: planlanmış randevu yok." |
| Yarın saat 14:00 için kontrol randevusu oluştur | calendar reader, no model | that day's schedule |
| Haftaya salı 10:30 kontrol randevusu ver | calendar reader, no model | that day's schedule |
| Ventolini kes / Ventolinin dozunu 2x2 yap / Dosyasına not al: ... | model, tool call left to the model | depends on Luna (UNVERIFIED) |
| Baş çevresi 47 santim, kaydet / Aşıyı dosyaya gir | model, tool call forced | card |

All fourteen base action tools are still registered (`core/eylemler/temelEylemler.ts`; the directory diff since baseline is 22 lines, none removing a tool). They are unreachable for the phrasings above because the router answers first.

### 4.5 Exam summaries and measurements depend on a narrow phrase list

`lib/asistan/dosyaSorgu/soruTuru.ts:17-28` maps a message to one of ten evidence types. Growth is reached only by `büyüme`, `persentil`, `kilo alıyor mu`, `eğrisi` and similar; a request for "ölçümler" is not growth and falls to the quick card (4.4). A summary request ("özetle", "özetini çıkar") gets the whole-chart summary block, which by its own comment does not narrate each visit (`kanit.ts:233`); a specific visit type or age is handled since #512, but "the last three exams" or "all exams one by one" are not.

### 4.6 Voice: the Fish route lost what lived in the old voice route

`app/api/asistan/fish-tur/route.ts:247-259` calls `ayseCevapla` and nothing else. The old route `lib/asistan/sesLlm.ts` does three more things around the same call:

| Handler | Old route | Fish route | Effect on Ayşe voice today |
|---|---|---|---|
| Spoken "Evet / Onaylıyorum / Hayır" on a pending card | `sesLlm.ts:221` calls `sesliKarariUygula` | not called anywhere else | "Evet" becomes a model turn; nothing is committed. Probe: `sesOnayMetniGecerliMi("Evet")` is true but the Fish path never asks. |
| Withdraw the superseded draft when a card is re-prepared | `sesLlm.ts:247` calls `eskiSesTaslaklariniCek` | not called | two drafts stay pending |
| Continuation of a cut answer | `sesLlm.ts:238-239` passes `sesSiniri` and `sesDurumu` | not passed | `ayseCevapla.ts:746-749` never stores the remainder; the capped answer ends with "Devamı ekranınızda Hocam." (#510 removed the cap for evidence answers only) |

The single-brain tests still pass because they drive the old route: `lib/asistan/tekBeyin.test.ts:151` posts to `/api/asistan/ses-llm/v1/chat/completions`, and the "Evet" test is at `:546`. No test drives `fish-tur` (the only mention is a string check in `yuzenPanel.test.ts:107-108`).

Voice content was reduced one day earlier (`10225481`, #497): `ayseCevapla.ts:491-494` sends the short summary from `lib/doktor/hastaDosyaKisa.ts` unless `sesTamDosyaGerekirMi` (`lib/asistan/sesDosya.ts:12-30`) matches. The summary drops visit narratives, the full lab table, the full vaccine ledger, imaging and document lists (`hastaDosyaKisa.ts:24-25`), and the rule at `sesDosya.ts:33` tells the model to say "Bu ayrıntı sesli özetimde yok Hocam". Probe: none of "Bütün muayenelerdeki kilo ölçümlerini sırayla göster", "6 aylık muayenesini anlat", "Reçete geçmişini göster", "Son üç muayenesini özetle" triggers the full chart.

The old voice prompt text still tells the model to call `hasta_bul`, `dosyaya_kayit_hazirla`, `eylem_onayla` and `randevu_takvim` (`lib/asistan/personaEngine.ts:280-291`); those client tools exist only for non-single-brain ElevenLabs agents (`components/asistan/AsistanOturumContext.tsx:1097`).

### 4.7 The model swap

Verified from code:

- Tools and `tool_choice` reach Luna (table in section 1). An unknown tool name or unparseable arguments fall back to Sonnet once (`cagir.ts:257-265`).
- Turns with tools run at Luna's default effort; effort `none` applies only to the social task and to short follow-ups without tools (`lib/ai/modeller.ts:214-226`; probe confirmed).
- No prompt rule was removed. Rules 2, 12 and 13 were reworded; rules 14 (continuity) and 15 (scope) were added (`personaEngine.ts:168-169`).

UNVERIFIED:

- Whether Luna calls a tool when it is not forced. The Luna audit says so itself: "no tool-first / tool-only turns in this set" (`docs/denetim/2026-09-29-ayse-100-luna.md:51`). Across all nine audit reports, no question set exercised a tool call that produced a card, appointment creation, spoken confirmation, a message draft, document handling, or a non-pediatric doctor; the 100-question and follow-up sets ran on the text channel only.
- Whether scope rule 15 makes Luna refuse in-scope administrative requests.

## 5. Diff inventory: removed, bypassed, renamed, skipped or unreachable

| Item | Kind | State on main | Where |
|---|---|---|---|
| 14 base action tools + 3 specialty task tools | tools | present, unchanged; **bypassed** for the phrasings in 4.4 | `core/eylemler/temelEylemler.ts`, `bransEylemleri.ts` |
| `kontrol_randevusu_olustur` | tool | present; **bypassed** by the calendar reader whenever the sentence has a date | `ayseCevapla.ts:321-323`, `lib/randevu/takvimSorusu.ts:96-119` |
| Change / cancel appointment | tool | **never existed** at any commit | registry |
| `sesliKarariUygula`, `eskiSesTaslaklariniCek` | handlers | present; **unreachable** from Ayşe voice | `lib/asistan/sesliOnay.ts`, callers only in `sesLlm.ts` |
| `sesDevam` continuation | handler | present; **unreachable** from Ayşe voice | `ayseCevapla.ts:746-749`, `sesLlm.ts:113-121` |
| `/api/asistan/ses-llm`, `/ses-eylem`, `/hasta-bul` | routes | present; used only by non-Ayşe personas | `signed-url/route.ts:110-131` |
| ElevenLabs client tools | tools | present for non-single-brain agents only | `AsistanOturumContext.tsx:1097-1215` |
| Legacy `{ action }` executor | handler | closed on purpose since 09-19 (`7b0b0d77`), unchanged | `lib/asistan/actionExecutor.ts` |
| Voice prompt sections naming client tools | prompt | present; stale for Fish | `personaEngine.ts:280-291` |
| Kimlik rule 12 wording | prompt | reworded (values now described as accessible), not removed | `personaEngine.ts` rule 12 |
| Patient-file cache | library | added 09-27, removed 10-01 (`e9af3b0d`); every turn compiles live | `lib/doktor/ogrenme/dosyaOnbellek.ts:111-125` |
| Test "voice and text send the same model request" | test | **weakened**: the chart block is now excluded from the comparison | `tekBeyin.test.ts`, diff around the `Aynı model isteği` comment |
| Tests of spoken confirmation, continuation, read-aloud | tests | pass, but exercise the route Ayşe no longer uses | `tekBeyin.test.ts:151`, `:546` |
| Route-level suites | tests | delete `OPENROUTER_API_KEY`, so they exercise the direct path, not the OpenRouter translation (spot-checked: `lib/doktor/soapUret.test.ts:10`) | several |
| Test files not in the `npm test` list | tests | `lib/asistan/konusmaBaglami.test.ts`, `lib/doktor/hastaAramaIndeksi.test.ts`, `lib/ai/kademe.test.ts`, `lib/asistan/dosyaSorgu/vizitTuru.test.ts`, `lib/randevu/tarihCozumle.test.ts`, `lib/asistan/zamanBlogu.test.ts`, `lib/asistan/balonSirasi.test.ts`, `lib/asistan/fishWsHavuz.test.ts`, `lib/asistan/fishIsinma.test.ts`, `lib/doktor/selam.test.ts` | `package.json:12` |
| Deleted or skipped tests | tests | none deleted since baseline; no `.skip` / `todo` / `only` | |

## 6. Capability table

Status is for `7f902b41`. "Last good" is the newest baseline at which the capability worked as described. Effort: S under a day, M one to three days, L more. Priority is doctor impact.

| # | Capability | Last good | Broken by | Status | Cause | Effort | Priority |
|---|---|---|---|---|---|---|---|
| 1 | Find a patient by name (suffixes, split names, ASR spelling) | `076720ae` | | WORKS (resolver tests pass; QA set rows 1-16) | Depends on index rows per patient: UNVERIFIED in production | S | P1 |
| 2 | Patient whose name collides with an off-topic word (Burcu, Erdoğan, Faiz ...) | `10846479` | `ee8cb9bf` #515 | LOST when the sentence has no in-scope keyword | 4.2 | S | P0 |
| 3 | Clinical question whose words collide with the off-topic list (kriptorşidizm, araba tutması ...) | `10846479` | `ee8cb9bf` #515 | LOST | 4.2 | S | P0 |
| 4 | Open a chart by name ("X dosyasını aç") | `076720ae` | | WORKS (deterministic since `7a2f4298`) | | | |
| 5 | Unnamed follow-up about the open patient | `076720ae` | `a8f55ac2` (word list) | DEGRADED: `toplam`, `en çok`, `vaka`, `kimdi` send it to the practice-wide search | 4.3 | S | P1 |
| 6 | Identity / contact questions | `076720ae` | | WORKS (code path unchanged) | | | |
| 7 | İlk-10 chart questions, text | `076720ae` | | WORKS (evidence path intact; 103/103 on Luna, text) | | | |
| 8 | İlk-10 chart questions, voice | `076720ae` | | WORKS (short chart plus evidence block; uncapped since #510) | | | |
| 9 | General clinical question with no patient open (dose, first-line treatment, differential) | `e2371dbe` | `9ca2447b` | LOST when the sentence contains a search keyword: count template | 4.3 | S-M | P0 |
| 10 | Any command or request with no patient resolved | `e2371dbe` | `9ca2447b` | LOST: count template instead of "which patient?" | 4.3 | S-M | P0 |
| 11 | Record card with explicit wording (kaydet, yazıver, dosyaya gir) | `076720ae` | | WORKS in code; Luna tool call never audited: UNVERIFIED end to end | 4.7 | M (audit) | P1 |
| 12 | Record card with natural wording (alerjisini ekle, kilosunu ekle, kronik hastalıklara ekle) | `e2371dbe` | `d88ab121` | LOST: quick card answers | 4.4 | M | P0 |
| 13 | Record card, other natural wording (kes, dozunu değiştir, not al, işle, düzelt) | route unchanged since `e2371dbe` | nothing in code; only the model changed (`72706af5`) | UNVERIFIED: reaches Luna with the tools, tool call not forced | 4.4, 4.7 | M | P0 |
| 14 | Appointments: create by natural sentence | `e2371dbe` | `a6642041` (with a date), `9ca2447b` (no patient), `d88ab121` ("randevusunu ... al") | LOST. Owner: `fix/ayse-randevu-capability` | 4.3, 4.4 | other job | P0 |
| 15 | Appointments: change, cancel | never | | NEVER EXISTED as a tool. Owner: same | | other job | P0 |
| 16 | Calendar read (today, tomorrow, week, slot) | `076720ae` | | WORKS (deterministic; tests pass) | | | |
| 17 | Vaccine record as a table | not a documented commitment | `d88ab121` for "aşılarını göster" | DEGRADED: short card line or model formatting. Owner: `fix/ayse-voice-endpointing-vaccine-table` | 4.4 | other job | P0 |
| 18 | Exam summary: latest, or one named visit type / age | `076720ae` | | WORKS on text (#512); voice needs the word "özet" | 4.5 | | |
| 19 | Exam summaries: several selected, or all exams | `e2371dbe` (text, free model answer over the full chart) | `c0facc9f` (text), `10225481` (voice) | DEGRADED on text (whole-chart summary template), LOST on voice (visits not in the short chart) | 4.5, 4.6 | M | P0 |
| 20 | Measurement: latest value | `076720ae` | | WORKS (quick card) | | | |
| 21 | Anthropometrics for one exam, as a series, across all exams, as a table | `e2371dbe` | `d88ab121` | LOST: one-line latest measurement; head circumference and height are not in the card at all | 4.4, 4.5 | M | P0 |
| 22 | Growth / percentiles asked with the words büyüme, persentil, eğri | `076720ae` | | WORKS (evidence path) | | | |
| 23 | Lab values and lab summary | `076720ae` | | WORKS (QA set rows 25-28) | | | |
| 24 | Medication questions with a chart open | `076720ae` | | WORKS (quick card and evidence path) | | | |
| 25 | Drug interaction / dose question with no chart open | `e2371dbe` | `9ca2447b` | LOST: count template | 4.3 | with 9 | P0 |
| 26 | Voice: spoken confirmation of a card | `076720ae` | `48f7b6b4` | LOST for Ayşe | 4.6 | S | P0 |
| 27 | Voice: updating a prepared card by voice | `076720ae` | `48f7b6b4` | DEGRADED: old draft is not withdrawn, and 26 | 4.6 | S | P1 |
| 28 | Voice: automatic continuation of a cut answer | `076720ae` | `48f7b6b4` | LOST; partly masked by #510 for evidence answers | 4.6 | S | P1 |
| 29 | Voice: "bana anlat / devamını oku" | `076720ae` | | WORKS (re-reads the whole screen answer) | | | |
| 30 | Voice: detail beyond the short chart (older visits, full lab, prescriptions history) | `076720ae` | `10225481` #497 | DEGRADED | 4.6 | S-M | P1 |
| 31 | Message / WhatsApp / e-mail to a patient from chat | never | | NEVER a chat action by design (tier 3: Ayşe points to the İletişim page, `docs/AYSE-EYLEM-MIMARISI.md:64-66`). İletişim page templates unchanged: WORKS | | | |
| 32 | Free-text message draft in chat | `e2371dbe` | `9ca2447b` when no chart is open | WORKS with a chart open (model path; wording quality UNVERIFIED); count template without one | 4.3 | with 9 | P2 |
| 33 | Document handling in chat | never | | No document tool exists; status questions go to the model. Belge Kasası and Gelen Belgeler pages: section 7 | | | P2 |
| 34 | Patient summary (Soru 1), day opening | `076720ae` | | WORKS | | | |
| 35 | SOAP note body | `076720ae` | | WORKS, slower (runs on Luna-Pro) | section 7 | | |
| 36 | SOAP advisory part (differential, prescription suggestion, red flags, patient summary) | `076720ae` | `1e55cd31` (2000-token cap), `f67ca145` (deep tier) | DEGRADED | section 7 | S | P1 |
| 37 | "Ayşe'ye Danış" panel and the in-note consult box | `076720ae` | | WORKS: these call the model directly with the full chart and tools; no router in front | | | |
| 38 | Cohort search and counts | `076720ae` | | WORKS with three known open defects (`NOTYA-ARAMA-PENCERE-VARSAYILAN-01`, `-KAYIT-PENCERE-01`, `-DOGUM-NEGASYON-01`) | | | P2 |
| 39 | Multi-specialty: branch locks, specialty tools | `076720ae` | | WORKS (no prompt file changed) | | | |
| 40 | Multi-specialty: voice for the other personas | `076720ae` | | UNVERIFIED (still ElevenLabs; depends on agent configuration outside the repo) | | | P2 |
| 41 | Memory and learning | `076720ae` | | WORKS; preference extraction runs at effort `none` with parsed JSON: UNVERIFIED risk | section 7 | S | P2 |
| 42 | Follow-up continuity ("peki yarın?", "dozu?") | new on 09-30 | | WORKS (tests pass; file not in `npm test`) | | | |
| 43 | Off-topic refusal | new on 10-01 | | WORKS, with the false positives in rows 2 and 3 | | | |

Row 37 is the practical workaround for Dr. Gökhan today: the patient-file panel answers the requests that the assistant page and voice route away.

## 7. Other AI surfaces (secondary review)

From a separate read-only pass over the non-chat surfaces. Items I re-read myself are marked "checked".

| Surface | Status | Note |
|---|---|---|
| Ayşe'ye Danış, in-note consult | WORKS | checked: only transport changed (`konsult/route.ts`, `not-konsult/route.ts`). The in-note box does not set `jsonBekleniyor`, so a truncated envelope would not trigger the fallback (UNVERIFIED risk). |
| SOAP advisory | DEGRADED | checked: `lib/doktor/soapUret.ts:433-437` runs on the deep tier with a 2000-token cap (set in `1e55cd31`, 09-26 22:06); the repo's own measurement shows it empty on both models with the fallback disabled (`docs/denetim/2026-09-30-kademe.md:68`). It therefore relies on the Sonnet fallback. |
| SOAP body | WORKS, slower | 50.4 s measured on Luna-Pro against a 60 s attempt timeout (same doc, line 66). |
| Vaccine-card photo, lab PDF extraction, consult reply summary | WORKS, fallback unreachable on timeout | two primary attempts of up to 60 s equal the route's `maxDuration`. Checked: `asilar/karne/route.ts:80` reads `stopReason` where the field is `stop_reason`, so the truncation branch never fires (older than the migration). |
| Image / document report (vision) | WORKS in code, quality UNVERIFIED | Sonnet vision replaced by Luna-Pro; no vision measurement in the repo. |
| Epikriz, SGK report, dose suggestion | WORKS, brittle | strict `JSON.parse` after a looser gate; epikriz runs on Luna although the policy comment says deep tier. |
| Messages, WhatsApp, e-mail, intake | WORKS | template-based, no model call, no diff since baseline. |
| Memory extraction | UNVERIFIED | checked: `lib/doktor/hafiza.ts:395` uses the `cikarim` task, which runs at effort `none`, and its JSON is parsed. |
| ICD-10 and drug-interaction tools | UNVERIFIED | call Groq / xAI directly with hard-coded model names, unchanged since baseline; whether the keys are set in production is not visible from code. |

## 8. Restoration plan

Rules for every PR: stay on Luna and Fish Audio; `tsc` and `npm test` green; one PR per item; nothing counts as shipped until its SHA is on `origin/main` and the Vercel deployment at that SHA is READY; then a live check with the listed phrases.

Ledger ids: PR n is `NOTYA-AYSE-GERI-0n` / `-1n` in `docs/OPEN-COMMITMENTS.md`.

Dependency order: 0 first. 1, 3 and 8 are independent of the rest. 2 before 4. 4 before 5 and 6. 9 after 0.

**PR 0 (S, P0): routing regression table and test wiring.**
Adds a table test "Turkish phrase, patient state, expected route and expected tool" built from the probes in section 4 and from `docs/qa/gokhan-yetenek-talepleri.md`, with today's wrong routes listed as known failures so later PRs flip them one by one. Adds the ten unlisted test files to `package.json`. Adds a route-level harness for `fish-tur` with a text body (the route already accepts `mesaj` without audio).
Test plan: the table runs in `npm test`; the harness proves one plain voice turn end to end.

**PR 1 (S, P0): scope gate false positives.**
Run the gate only when no patient name resolves in the sentence, and tighten the stems that are names or prefixes of clinical words (`erdogan`, `burc`, `faiz`, `secim`, `kripto`, `react`, `araba`, `otel`).
Test plan: the ten sentences in 4.2 pass through; K1 to K12 in `docs/qa/gokhan-gunluk-sorular.md` keep their expected result; a refusal test with a patient named Burcu and one named Erdoğan.

**PR 2 (S-M, P0): no bare count template for a non-cohort message.**
The search answer is returned only for an explicit cohort question (count, list, plural, "hangi hastalar"). Otherwise the turn goes to Luna with the existing "no chart this turn" block, which already tells it to answer a knowledge question normally and to ask for the patient's name otherwise (`ayseCevapla.ts:150-152`).
Test plan: the nine sentences in 4.3 reach the model (assert one model request and no `Filtre:` in the answer); the 150 golden cohort questions in `lib/doktor/aramaAltinSorular.test.ts` and QA rows 17-24 are unchanged.

**PR 3 (S, P0): spoken confirmation on the Fish route.**
Call `sesliKarariUygula` before the brain call and `eskiSesTaslaklariniCek` after it, exactly as `sesLlm.ts:221` and `:247` do.
Test plan: with the PR 0 harness, prepare a card, send "Evet": no model request, record committed, pending list empty; "Hayır" withdraws; a card with a serious drug warning is not committed by voice; re-preparing a card leaves one draft.

**PR 4 (M, P0): commands go to the tools, not to a lookup.**
One shared command-intent check (verbs ekle, işle, kes, sonlandır, değiştir, düzelt, not al, plus today's `kayitNiyetiMi`) that skips the quick card and the search template and forces a tool call when a patient is resolved; with no patient it asks which patient. Appointment verbs stay with `fix/ayse-randevu-capability`; the two jobs must agree on the one helper so there are not two lists.
Test plan: each sentence in the 4.4 table maps to its expected tool name with a mocked model; the card appears; nothing is written before the tap; `core/eylemler/tests/sessizYol.test.ts` stays green.

**PR 5 (M, P0): anthropometrics from the record.**
A measurements evidence type built from the per-visit weight, height and head-circumference events that the growth evidence already reads: one exam, a time-ordered series, all exams. Screen shows a table; voice says one short line; stored values only, missing values marked as missing. The quick card keeps single-fact questions only (no "tüm, bütün, sırayla, tablo, ölçümleri").
Test plan: fixture with five visits, one without height; the six measurement sentences in 4.4 each return the right rows; no value appears that is not in the fixture; the voice string stays under the sentence cap.

**PR 6 (M, P0): exam summaries for several or all exams.**
A visits evidence type: one named exam, the last N, or all, each with date, complaint, diagnosis and plan from approved notes; reuses the visit-type matcher from #512.
Test plan: fixture with six visits; "son üç muayenesini özetle" returns three dated blocks, "bütün muayenelerini özetle" six, a non-existent visit type says so; text and voice give the same screen text.

**PR 7 (S-M, P1): voice chart detail.**
Send the full chart on voice for list, series, history and table requests, and replace the instruction to say "this detail is not in my voice summary" with a server-side retry on the full chart.
Test plan: unit table for `sesTamDosyaGerekirMi` with the four sentences in 4.6; a voice turn about an older visit answers from the chart.

**PR 8 (S, P1): voice continuation on the Fish route.**
Pass the spoken-state callbacks from `fish-tur` and handle "devam et" from the stored remainder.
Test plan: a seven-sentence non-evidence answer is cut at five, "devam et" reads the remaining two with no model request.

**PR 9 (S, P1): open-patient questions stay on the open patient.**
`toplam`, `en çok`, `en sık`, `vaka` count as cohort words only together with a plural-patient word.
Test plan: the two sentences in 4.3 answer from the open chart; `lib/asistan/aktifHasta.test.ts` cohort cases unchanged.

**PR 10 (S, P1): name index safety.**
Fall back to the full scan when the doctor has patients without index rows; commit the table's migration; make the test fixture and smoke scripts write index rows; run the count query in section 9 once.
Test plan: a patient with no index row is still found by name; the isolation tests stay green.

**PR 11 (M, P1): Luna action audit.**
Extend the existing audit harness with about thirty action sentences on both channels (voice through `fish-tur` with text input), fallback disabled, and record the tool-call rate. Only after the number is known decide on prompt or tool-list changes (the ledger already notes that all fourteen tools are sent on every active-patient turn).
Test plan: the report itself; target rate agreed with Kaan before any change.

**PR 12 (S, P1): SOAP advisory cap and the two JSON flags.**
Raise the advisory cap so reasoning tokens do not consume it, set the JSON flag on the in-note consult box, and take memory extraction off effort `none`.
Test plan: unit test with a truncated advisory; one measured run recorded in `docs/denetim`.

**PR 13 (S, P2): timeouts and strict parsing on the tool pages; ledger truth-up.**
Test plan: route tests with a slow mocked primary reach the fallback inside the route budget.

## 9. Open questions and how to close them

| Question | How to verify |
|---|---|
| Does every active patient have index rows? | `select p.doctor_id, count(*) from patients p left join patient_search_tokens t on t.patient_id = p.id where p.is_active and t.patient_id is null group by 1;` (read-only, counts only) |
| Is production on `7f902b41`? | `vercel ls` / `vercel inspect` for the production alias |
| Does Luna call tools unforced? | PR 11 |
| Fallback share and truncation since 09-27 | `v_model_yedek_gunluk`, and `ai_token_kullanim` rows with `neden = 'low_conf'` or `kesildi` for the chat and consult tasks |
| Which requests hit which router in production | the existing log lines `[asistan/chat] kapsam disi`, `takip`, `asr onarım`; there is no log line for the search-template or quick-card return, PR 0 should add one |

## 10. Ledger inconsistencies noticed

- `docs/OPEN-COMMITMENTS.md:2872` says the scope gate PR is open and not merged; `ee8cb9bf` (#515) is on `origin/main`.
- Several 09-29 / 09-30 rows (around lines 2805-2825) say "not merged"; the merges are in the log (`88e4fe83`, `74f9b252`, `5bc02a7b`, `9753ac83`, `12175463`).
- `docs/qa/gokhan-gunluk-sorular.md:80` shows the visit-type item as deferred; the ledger marks it done (#512).
- The ledger still describes automatic continuation as an ElevenLabs hidden turn (line 2785); Ayşe no longer uses that route.
- `docs/qa/gokhan-yetenek-talepleri.md` was present in this worktree as an untracked file when the audit ran. It was used as input and is not part of this commit.
