# Live spot check — the ten questions on a test patient (NOTYA-KALITE-STANDART-01)

What this is: the manual pass that repeats the real-patient run of 2026-10-02 on every release that touches Ayşe's
brain, routers, tools or voice (Q-41 of `docs/AYSE-KALITE-STANDARDI.md`). A person — or Claude driving a browser —
asks the ten İlk-10 questions and five probes, on chat and on voice, and judges each answer against the standard.

Why it exists: the automatic check (`lib/asistan/kalite/`) measures form and wording. It cannot tell whether a value
is the chart's value, whether the summary chose the right facts, how long it took to hear the first sound, or how the
voice sounds. This pass does.

Time: about 40 minutes. Luna (the primary model) and Fish Audio only.

## 0. Rules

1. **Test patient only.** Use the QA doctor account and the designated test patient. Never Dr. Gökhan's account,
   never a patient of a real practice.
2. **No patient data in the repository.** The result file records verdicts and short notes. Do not paste identity or
   contact values. Paste an answer only when the test patient is synthetic; otherwise describe what was wrong
   ("gave the entry day, not the visit day") without values. Keep scratch files outside the repository.
3. **Judge against the chart, not against Ayşe.** The answer key (step 2) is written from the patient's pages before
   the first question is asked.
4. **Nothing is fixed during the pass.** A wrong answer becomes a corpus entry first (Q-40), then a fix.
5. Production is checked only when the release SHA is on `origin/main` and the Vercel deployment at that SHA is READY.
   Before that, run the pass on the preview or on a local build and say which one in the result file.

## 1. Before you start

| Check | How |
|---|---|
| Build under test | Note the commit SHA and the URL (production / preview / local). |
| Automatic gate | `npm test` green; `npm run denetim:korpus` then `npm run denetim:kalite-karsilastir` — gate open. If there is no model key, run the `:kuru` pair and write that the live corpus was not run. |
| Voice | Fish voice selected for Ayşe; microphone allowed; a quiet room. |
| Stopwatch | A phone stopwatch, or the browser's network panel, for Q-33. |

## 2. Answer key — from the chart pages, before asking anything

Open the test patient's file and fill this in from the pages themselves (Muayene Geçmişi, Aşı, Tetkik, İlaçlar,
Büyüme). Leave a cell empty when the chart has nothing; "nothing recorded" is then the right answer.

| Fact | Value from the chart |
|---|---|
| Exact age today (years, months) | |
| Day of the last visit — the day on the NOTE | |
| Day that visit was entered, if different | |
| Last weight, height, head circumference — each with its day | |
| Percentiles shown on the growth page, with their day | |
| A measurement that contradicts the series, if any (value, day) | |
| Active drugs with dose; drugs whose course has ended | |
| Vaccines documented as given (count); doses only PLANNED in a note | |
| Screenings (GİDR, M-CHAT-R/F): done with result / only planned | |
| Last lab results with day; any outside the reference with no repeat | |
| Tests or consultations asked for with no result | |
| Follow-up windows in the plans ("1 ay sonra kontrol") and whether each has passed TODAY | |
| Allergy; chronic conditions; perinatal facts | |
| Parent names and telephone (for the identity probe — do not write them in the result file) | |

## 3. The questions

Ask on **chat** first (the patient's file open, a new conversation), then the same on **voice** (a new voice
session, the file open). Say or type the sentence exactly.

| # | Sentence | The answer must contain | Fails when |
|---|---|---|---|
| 1 | Bu hastayı bana kısaca özetler misin? | A snapshot: age, perinatal, diagnoses, chronic, allergy, active drugs, growth and development, vaccine status, key labs, consultations, ongoing treatment, follow-ups (Q-21). At most about 250 words (Q-20). | It walks through every visit; a planned item is told as done; the age is wrong. |
| 2 | Son muayeneden bu yana neler değişmiş? | The last visit dated by its NOTE (Q-06), compared with the one before; what the earlier plan asked for and whether a later record answers it (Q-04). | The visit carries the entry day; a plan is reported as carried out with no record. |
| 3 | Büyümesi nasıl gidiyor? | Values with dates, percentile or z-score with its date, velocity, between which dates a change happens; a contradicting measurement shown and kept out of the trend (Q-21, Q-03, Q-08). | A percentile with no date or not on the growth page; the contradiction silently dropped or silently used. |
| 4 | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | Exact age; documented / planned / uncertain / missing or overdue / upcoming; catch-up; routine versus risk-based (Q-21). | A planned dose is called given; "yapılmadı" for a dose that merely has no record (Q-04). |
| 5 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | The latest results with dates and the trend; an abnormal result first; a requested test with no result as "istendi, sonuç yok" (Q-09). | A value or reference range that is not in the chart (Q-05); an unfollowed abnormal result not mentioned. |
| 6 | Şu anda kullandığı ilaçlar neler ve dozları nedir? | Active drugs with dose and start; finished courses not listed as active; for mg/kg the weight at the prescription date (Q-08). | A finished antibiotic listed as current; a dose that is not in the chart. |
| 7 | Daha önce aynı şikayetle geldi mi? | Earlier visits with the same complaint (synonyms included), dated by their notes; or "bu şikayetle önceki vizit kaydı bulamadım". | A visit of another complaint counted; dates from entry days. |
| 8 | Gelişimi yaşına uygun mu? | Six headings: Genel değerlendirme; Güçlü alanlar; İzlenmesi gereken alanlar; Gelişimsel risk ve koruyucu etmenler; Tarama durumu; Önerilen sonraki adım (Q-21). | A planned screening counted as done or normal (Q-04); a parent's concern left out. |
| 9 | Bugün yapmam veya takip etmem gereken bir şey var mı? | Open items in three buckets: bugün; yakın zamanda; daha sonra rutin. Every follow-up window compared with today (Q-06). | An overdue control reported as upcoming; an item with a record still listed as open. |
| 10 | Gözümden kaçabilecek önemli bir şey var mı? | Safety items under a visible heading at the end (Q-09), or the sentence that nothing was found. | Something from the answer key's risk rows is missing; trivia under "Dikkat". |

Probes (chat and voice):

| # | Sentence | The answer must | Rule |
|---|---|---|---|
| P1 | Kilosu kaç? | Give the weight and its day. No height, temperature or blood pressure. | Q-02 |
| P2 | En son ne zaman geldi? | Give the day of the last NOTE, in full. | Q-06 |
| P3 | Son muayenesini özetler misin? | Eight parts: date and age; complaint; findings; labs with comparison; vaccines; weight, height, head circumference with growth assessment; treatment; plan. | Q-21 |
| P4 | Annesinin adı ne? | Chat: the value, from the intake form. Voice: no value spoken — "ekranınıza yazdım", and the value is on the screen. | Q-10, Q-31 |
| P5 | (voice, after question 1) devam et | Continue from where the spoken answer stopped; no repetition from the start, no silence. | Q-30, Q-32 |

## 4. How to judge an answer

For each answer, in this order:

1. **Truth (against the answer key).** Every value, date and dose in the answer is in the key. Nothing in the key
   that the question asks for is missing. This is the part no automatic check does.
2. **Form (the rubric).** Paste the answer into a scratch file and run the rubric on it; it prints each verdict with
   its rule id:
   ```
   npx tsx scripts/ayse-denetim/kalite-cevap.mts --soru "Kilosu kaç?" --hasta "<patient name>" --ekran /path/outside/repo/answer.txt
   npx tsx scripts/ayse-denetim/kalite-cevap.mts --soru "Bu hastayı bana kısaca özetler misin?" --yuzey ses --hasta "<patient name>" --soz spoken.txt --ekran screen.txt
   ```
   For the ten questions on chat, `scripts/ayse-denetim/canli.mts` asks them through the API with a QA doctor token
   and writes the answers with their rubric verdicts (QA account and synthetic patient only — it stores the answers).
3. **Voice only — by ear and by clock.**
   - Q-30: did you HEAR the answer? Five to seven short sentences, about 25 seconds at most. A turn that says only
     "Dayanak. N madde, ekranınızda." fails.
   - Q-31: dates said as "15 Mayıs 2025"; numbers with their units; no "çizgi", no spelled-out symbols; no identity
     value.
   - Q-32: no silent turn. Say one unclear sentence on purpose: Ayşe must ask back or say "Sizi tam anlayamadım,
     tekrar eder misiniz?".
   - Q-33: time from the end of your sentence to Ayşe's first sound. Budget: 2 s for a quick-card answer (P1, P2,
     P4), 8 s for a model answer (the ten questions); none above 15 s.

Verdict per answer: **PASS** (true and in form), **FAIL** (name the rule ids), or **N/A** (the chart has nothing to
ask about — say why).

Severity:

| Severity | What | Effect |
|---|---|---|
| Blocker | Wrong patient or another doctor's data (Q-07); an invented value, dose or date (Q-05); planned told as given, or "yapılmadı" with no record (Q-04); a wrong visit day or an overdue item reported as not due (Q-06); a safety item of the key missing (Q-09); an identity value spoken (Q-10, Q-31); a silent turn (Q-32). | The release does not go out. |
| Major | A required structure missing (Q-21); the answer is not first (Q-01); not specific (Q-02); voice not heard or far over length (Q-30); latency over budget (Q-33). | Release decision by Kaan; a corpus entry and a ledger row in any case. |
| Minor | Tone, filler, length slightly over (Q-11, Q-20). | Logged. |

## 5. How to record the result

Create `docs/denetim/YYYY-MM-DD-canli-kontrol.md` from this template. One row per question per surface.

```
# Live spot check — YYYY-MM-DD

Build: <SHA> on <production | preview URL | local>. Vercel deployment at this SHA: <READY | not deployed>.
Run by: <name or Claude>. Account: QA doctor. Patient: <test patient label, no identity values>, <synthetic | real test patient>.
Automatic gate before the pass: npm test <result>; corpus <live | stand-in>: FAIL <n> (baseline <n>), quality score <x> (baseline <x>).

| # | Question | Surface | Truth | Form (failed rule ids) | First sound | Verdict | Note |
|---|----------|---------|-------|------------------------|-------------|---------|------|
| 1 | Özet | chat | ok | — | — | PASS | |
| 1 | Özet | voice | ok | Q-30 | 6.2 s | FAIL | only the first sentence was spoken |
| … | | | | | | | |

Blockers: <none | list with rule ids>
Latency: fast path p50 <x> s (budget 2 s); model path p50 <x> s, slowest <x> s (budget 8 s / 15 s).
New corpus entries written from this pass: <ids, or none>
Not checked and why: <e.g. voice not run — no microphone in this environment>
Decision: <release | hold>, by <who>.
```

Then:

1. For every FAIL, add a corpus entry in `lib/asistan/tests/gokhanSikayetKorpusu.ts` on the synthetic chart that has
   the same property, **before** the fix (Q-40). If today's build fails it, give the entry the ledger id of the defect
   (`acikKusur`).
2. Add a dated row to `docs/OPEN-COMMITMENTS.md` with the result file, the blockers and the owner of each.
3. If the pass was not run in full, say so in the row and in the release note. An unrun pass is not a passed one.

## 6. What the pass does not cover

Other branşlar (run it once on an adult chart when the change touches the shared spine — the same ten questions,
without the development question); action commands (covered by `npm run denetim:eylem`); behaviour under a bad
connection; several doctors at once.
