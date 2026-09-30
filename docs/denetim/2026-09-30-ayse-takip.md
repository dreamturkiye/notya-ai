# Ayşe — conversation continuity ("konuşma bağlamı") on GPT-6 Luna (2026-09-30, `feat/ayse-100`)

Follow-up to `docs/denetim/2026-09-29-ayse-100-luna.md`. Kaan's diagnosis (witnessed with Dr. Gökhan): since the
Sonnet → Luna switch Ayşe lost conversational continuity — "Bugün randevum var mı?" is right, "Peki yarın var mı?" is no
longer understood as the same question about tomorrow; the same with patient context, reçete, tahlil, aşı. Sonnet had
been tracking the running topic implicitly; the product had relied on the model for topic tracking, search scoping and
session memory. This turn makes that model-independent.

## What was built (NOTYA-KONUSMA-BAGLAMI-01)

One deterministic layer in the tek-beyin path — `lib/asistan/ayseCevapla.ts` is shared by the text chat
(`/api/asistan/chat`) and the voice loop (`/api/asistan/fish-tur`), so both channels get it.

| Piece | Where | What |
|---|---|---|
| Session state | `asistan_sessions.active_context.konusma` (written on EVERY turn by `oturumuYaz`) | `sonNiyet` (takvim · hasta-dosya · reçete · tahlil · aşı · büyüme · muayene · not · mesaj-belge · hasta-sayım · genel), `sonVarliklar` (patient id + name, date phrase + ISO day / week range, clock time, calendar question type, drug, lab test, vaccine), `sonCevapOzeti` (first line, ≤ 160 chars), `sonSoru` (the effective question), `zaman`. `baglamKur` / `baglamOku` in `lib/asistan/konusmaBaglami.ts`. |
| Follow-up resolver | `takipCoz` (`lib/asistan/konusmaBaglami.ts`), called in `ayseCevapla` right after the session is loaded, BEFORE the calendar matcher, kimlik path, `hastaninSozunuCoz`, `dosyaSoruCevap`, `soruTuruBul` and the model | An elliptical utterance — a follow-up marker (peki / ya / e / o zaman / aynı / onun / bunun / o / kendisi / öbür / bir de / bir daha), only a date, only an attribute ("dozu?", "kaç kilo?", "sonuçları?"), a bare question ("var mı", "kimler", "kaç") or a bare patient ("peki Rıdvan'ın?") — is rewritten into a full question by inheriting the missing slots from the record. The rewritten question is what every matcher sees (`message`); the doctor's words stay in the stored history (`hamMesaj`) and go to the model together with `[DOKTORUN KASTI — konuşma bağlamından tamamlandı: …]`. Templates per intent (calendar: date + question type + clock time; chart: genitive patient name + topic phrase + attribute / entity; hasta-sayım: date-phrase frame substitution; patient switch: previous question with the name swapped). A patient named in the utterance always wins; an intent word in the utterance always wins; a full question is never rewritten; free text with a marker ("peki öksürüğü için ne önerirsin?") is never rewritten — every remaining word must be a slot word, an intent word, an entity, a date or the name. Expiry 10 min. A page switch (NOTYA-SAYFA-HASTA-01) overrides the recorded patient. |
| Model block | `baglamBlogu` → per-turn prompt tail (`kuyruk`, never cached) | `[KONUŞMA BAĞLAMI — önceki tur] Konu · Hasta · Tarih · Saat · İlaç · Tahlil · Aşı / Son soru / Son cevap` + the rule "complete the missing slot from here, do not ask for clarification when it can be inherited". ≈ 150–250 tokens. |
| Persona | `lib/asistan/personaEngine.ts` global rule 14 | Clarification ("hangi hastayı / hangi tarihi kastettiniz") only when nothing can be inherited. The existing rule that asks for the name (rule 13 / `DOSYA_YOK_BLOGU`) already fires only when no patient resolved at all — unchanged. |
| Side fixes found by the harness | `lib/randevu/takvimSorusu.ts`, `lib/doktor/hastaDosyaKart.ts` | Spoken "saat 3" is 15:00 in clinic hours unless *sabah / gece* (was 03:00). A question about ONE named vaccine ("Hepatit B kaç doz", "KKK ne zaman") skips the five-line aşı card and goes to the model with the chart (the card could not answer it). |

Tests: `lib/asistan/konusmaBaglami.test.ts` — 28 tests / ~70 assertions, Turkish with and without diacritics, ASR style
(`peki yarin`, `ya persembe`, `kac gun verdik`, `bas cevresi`, `ridvanin`). `tekBeyin.test.ts` unchanged
expectations: 41 pass, the 2 NOTYA-SES-BAGLAM-KUCULT-01 subtests fail exactly as on the base commit.

## Harness

`scripts/ayse-denetim/sorular-takip.json` — 34 multi-turn sequences, 101 questions: calendar (date-only, bare "var mı",
"kimler", count → who, week, part of day, clock time), chart (aşı, tahlil, reçete, büyüme, muayene, not, belge), aşı and
tahlil entities, hasta-sayım frame substitution, patient switch (3×), page patient + named switch, expiry (11 min via
`geriAlDk`), no-context "dozu?", full-question reset. Patient names are `{{A}} / {{R1in}} / {{A_ID}}` placeholders filled
from the gitignored `scripts/ayse-denetim/adlar.local.json` (`yuz.mts`), so this file carries no real names — the same
mechanism is available for `sorular-100.json` (open item from 09-29).

Run on Dr. Gökhan's read-only account, `openai/gpt-6-luna` on every call (`sayac.modeller`), Sonnet disabled
(`NOTYA_KORUYUCU_KAPALI=1`), timezone America/New_York, "today" 2026-09-30 Çarşamba. Raw runs
`.denetim-out/ayse-takip-p1.jsonl`, `-p2.jsonl` (gitignored).

### Result

| | before (main behaviour, from the 09-29 audit + Kaan's live report) | first pass with the layer | after fixes (14 re-run) |
|---|---|---|---|
| calendar follow-ups without the noun ("Peki yarın?", "kimler?", "Peki var mı?") | model path → "menüden bakın" / wrong day (only `takvimTakipCoz` date-only case worked) | 26 / 30 deterministic, 0 model calls | **30 / 30** |
| chart follow-ups ("dozu?", "CRP kaç?", "bir önceki?", "eksik olan var mı?") | model with the chart; the question itself unspecified — Luna asked or answered the wrong slot | 66 / 68 | **68 / 68** |
| patient switch ("peki Rıdvan'ın?") keeping the intent | not possible | 2 / 3 | **3 / 3** |
| automatic rubric, all 101 | — | 94 / 101 | **101 / 101** |
| `luna_fail` / OpenRouter errors | — | 0 | 0 |

The 7 first-pass failures and their causes:

| # | Sequence | Cause | Fix |
|---|---|---|---|
| 19, 20 | "Bugün saat 3'te yer var mı?" → "peki yarın?" | `sozSaati` read a spoken "3'te" as 03:00 (only *öğleden sonra / akşam* moved it); the follow-up correctly inherited the time — 03:00 | clinic hours: 1–7 without *sabah / gece* → afternoon (`takvimSorusu.ts`, and the same in `varliklariCikar`) |
| 25 | "Bugün randevum var mı?" → "peki R.D. randevusu ne zaman?" | the resolver's strictness was skipped for short utterances with an intent word: *peki* + *randevu* + a name without apostrophe → rewritten to "bugün randevum var mı?" and the patient lost | every remaining word must be a slot / intent / entity / date / name word — always, no short-utterance exemption |
| 26 | → "peki U.T.'nin?" | with a calendar `sonNiyet` the bare-patient case fell into the calendar template | bare patient is handled first, for every intent: frame substitution on `sonSoru`, else "<ad> randevusu ne zaman?" after a calendar turn |
| 65, 66 | "KKK aşısını ne zaman yaptık?" → "peki Hepatit B?" → "kaç doz?" | the rewrite ("… hepatit b aşısı ne zaman yapılmış?") hit the deterministic aşı card, which prints the five-line list without Hepatit B; on main the same question reached the model only because it lacked the word *aşı* | named vaccine skips the card → model with chart: "Hepatit B'nin 1. ve 2. dozları 15 Haziran 2024", "2 doz kayıtlı" |
| 98 | "A.Y. kaç yaşında?" → "peki R.D.'nin?" → "ya U.T.'nin?" | frame substitution matched only the full stored name ("Rıdvan Dilmen") while the previous question said "Rıdvan'ın" → fell back to prefixing → two names → a 2-patient search | frame substitution tries the full name, then the first name with suffix tolerance |
| 100 | rubric | the model wrote "telafi planını netleştirelim" — the forbidden-phrase list had *netleştir* (meant for "netleştirir misiniz") | rubric narrowed; the answer was correct |

Verified in the same run without change: the open-patient rule (NOTYA-AKTIF-HASTA-01) still answers unnamed dossier
questions after "X dosyasını aç"; a full question resets ("Bugün randevum var mı?" → "A.Y. aşıları tam mı?" →
"peki yarın randevu var mı?" → 1 Ekim); expiry (11 min → "kimler?" is not a calendar continuation); the no-context "dozu?"
gets a model answer that invents no dose; page patient A + "peki U.T.'nin?" switches the session patient so "kilosu?" is
U.T.'s; free text with a marker still reaches the model with the chart (tekBeyin test 8).

### Latency and cost

| path | n | p50 | p95 |
|---|---|---|---|
| deterministic (rewrite + calendar / card / search, no LLM) | 101 | **0.30 s** | 1.08 s |
| model (end-to-end, chart attached) | 68 | 4.9 s | 11.4 s |

72 Luna calls in all (the first pass was accidentally launched twice by the Mac runner and both processes completed —
36 graded + 32 duplicate rows; second pass 4). Tokens 920 619 prompt (532 824 cached, 58 %), 14 463 completion.
**OpenRouter cost $0.125** (budget ≤ 120 calls). The `KONUŞMA BAĞLAMI` block adds ≈ 200 uncached tokens per model
turn.

## Left open (docs/OPEN-COMMITMENTS.md, 2026-09-30)

- Live check by Kaan / Dr. Gökhan on both channels (chat and fish-tur voice) — the harness runs the text channel; the
  voice channel shares `ayseCevapla` but the ASR variants in production may add filler shapes not in the marker list.
- "geçen hafta / bu ay" follow-ups in the calendar ("peki geçen hafta?") — the search windows know them, the calendar
  day/week reader does not; the resolver passes them through and they fall to the model.
- `sorular-100.json` still carries real names; the `{{…}}` placeholder mechanism in `yuz.mts` now exists — one pass to
  convert it (Claude, small).
- The Mac runner launched the first pass twice (osascript reported failure on the first `nohup … &` form while the
  process had started). Launch with the `/bin/bash -c '…' > /dev/null 2>&1 &` form only.
