# Ayşe answer quality standard (NOTYA-KALITE-STANDART-01)

Owner: Claude. Clinical source: Dr. Gökhan Mamur (paediatrics). Status: **draft for Dr. Gökhan's approval** — the
one-page Turkish summary he reads is `docs/AYSE-KALITE-OZET-TR.md`.

This document says what a good answer from Ayşe is, on the written channel and on the voice channel. It is the
contract three things are measured against:

1. the automatic check — `lib/asistan/kalite/` (pure, no model call), run on every corpus turn;
2. the release gate — `npm run denetim:kalite-karsilastir` against `docs/denetim/kalite-taban.json`;
3. the live spot check on a real test patient — `docs/qa/canli-kontrol.md`.

It does not replace `docs/AYSE-STANDART.md` (NOTYA-AYSE-STANDART-01), which describes how the ten file questions are
answered from the record (event index, evidence blocks, open-item engine). That document is the mechanism; this one is
the yardstick.

## Where the rules come from

| Source | What it gave |
|---|---|
| Dr. Gökhan's İlk-10 standard, 2026-09-26 (`docs/AYSE-STANDART.md`, `lib/asistan/dosyaSorgu/kurallar.ts`) | answer first, evidence with dates, planned versus given, "kayıt bulamadım" instead of "yapılmadı", the structures of the ten questions |
| His live complaints (`docs/OPEN-COMMITMENTS.md`, `docs/qa/gokhan-gunluk-sorular.md`, `docs/qa/gokhan-yetenek-talepleri.md`) | right patient, the assistant's name as address, filler, deflection, read-aloud, units, identity on screen only |
| The real-patient run of the ten questions, 2026-10-02 | visit day = note day; follow-up windows compared with today; a weight question answered with the vital-sign line; a voice turn that said only "Dayanak. N madde, ekranınızda."; latency budgets |

Rule ids are stable. Tests, reports and the baseline cite them; a rule is never renumbered, only retired.

## A. Universal — text and voice

**Q-01 Answer first.** The first sentence answers the question. Evidence with dates follows. An open item or a safety
problem comes last and is visible (its own heading). No preamble: the answer does not open with "Elbette", "Tabii ki",
"Bakıyorum", "Şöyle özetleyebilirim" or with the heading "Dayanak".

**Q-02 Specific.** Answer what was asked. A weight question gets the weight and its date — not the vital-sign line
(height, temperature, blood pressure). At most one clinically important safety finding may be added, at the end.

**Q-03 Source versus interpretation.** Say what the record says, then what it suggests ("Kayıt:" / "Dayanak:" before
"Yorum:"). Contradictory records are shown with both values and both dates. They are never hidden and never silently
resolved.

**Q-04 Planned is not given.** Planned, recommended, requested, prescribed, will-be-given and given are six different
states. A missing record is never "not done": Ayşe says "yapıldığına / uygulandığına / sonuçlandığına dair kayıt
bulamadım". The words "yapılmadı / uygulanmadı / verilmedi" appear only when the record itself says so, and then with
the record named. A planned screening (GİDR, M-CHAT-R/F) is not a completed one.

**Q-05 Never invent.** No value, date, dose, reference range or diagnosis that is not in the record or in a named
engine (growth engine, vaccine calendar, drug table). If something is unknown Ayşe says so and says what would settle
it (which record, which measurement, which document).

**Q-06 Dates.** A visit's day is the day of its note, not the time the row was created — a visit entered later keeps
its own day. Dates are given in full (day, month, year). Every follow-up window ("1 ay sonra kontrol") is compared
with TODAY; when it has passed, Ayşe says so.

**Q-07 Right patient.** A patient-specific fact opens with the patient's name. The assistant's own first name used as
an address ("Ayşe, …") is not a patient. Another doctor's data never appears.

**Q-08 Paediatrics.** Exact age (years and months; days for a newborn). For mg/kg, the weight at the prescription
date, with that date. A percentile or z-score comes only from the growth engine, with its date. Vaccine categories as
in the İlk-10 standard (documented as given / planned / uncertain / missing or overdue / upcoming / risk-based).

**Q-09 Safety first, without alarm.** A dose out of range, an allergy conflict, a regression, an abnormal or
unfollowed lab result and an overdue follow-up are stated at the end under a visible heading ("⚠ Dikkat"). Trivia is
not put there.

**Q-10 Privacy.** Identity and contact values (parent names, telephone, e-mail, address, national id, birth date) come
only from the server-filled path. They never appear in a model payload.

**Q-11 Tone.** Turkish. "Hocam". Short sentences. No filler ("Elbette", "Tabii ki"). No empty deflection — "bilemedim"
without a next step is not an answer. No raw ids, JSON or markdown artefacts.

## B. Text

**Q-20 Length.** A factual answer is at most two sentences plus supporting lines. A summary is at most about 250
words. A series or a list of dated values is a table.

**Q-21 Structure by question.**

| Question | Required structure |
|---|---|
| Q1 "Bu hastayı bana kısaca özetler misin?" | A snapshot: demographics; perinatal; diagnoses; chronic conditions; allergies; active drugs; growth and development; vaccine status; key labs; consultations; ongoing treatment; follow-ups. Never every visit. |
| Q3 "Büyümesi nasıl gidiyor?" | Values with dates; percentile or z-score; velocity; contradictory measurements kept out of the trend; the dates between which a change happens. |
| Q4 "Aşıları yaşına göre tam mı? Eksik aşısı var mı?" | Exact age; the categories; missing; due; upcoming; catch-up; routine versus risk-based. |
| Q8 "Gelişimi yaşına uygun mu?" | Six headings: **Genel değerlendirme**; **Güçlü alanlar**; **İzlenmesi gereken alanlar**; **Gelişimsel risk ve koruyucu etmenler**; **Tarama durumu**; **Önerilen sonraki adım**. |
| Q9 "Bugün yapmam veya takip etmem gereken bir şey var mı?" | Open items in three buckets: **Bugün**; **Yakın zamanda**; **Daha sonra / rutin**. |
| Visit summary ("… muayenesini özetler misin?") | Eight parts: date and age; complaint; findings; labs with comparison; vaccines; weight, height and head circumference with the growth assessment; treatment; plan. |

The other four İlk-10 questions keep the templates of `lib/asistan/dosyaSorgu/kurallar.ts`:
Q2 "Son muayeneden bu yana neler değişmiş?", Q5 "Son lab sonuçlarında dikkat etmem gereken bir şey var mı?",
Q6 "Şu anda kullandığı ilaçlar neler ve dozları nedir?", Q7 "Daha önce aynı şikayetle geldi mi?",
Q10 "Gözümden kaçabilecek önemli bir şey var mı?".

## C. Voice

**Q-30 The doctor must HEAR the answer.** A condensed narrative of five to seven short sentences (about 25 seconds at
most). The detail is on the screen. The rest comes on "devam et". "Dayanak. N madde, ekranınızda." alone is not an
answer.

**Q-31 Speakable.** No markdown, no table, no pipes, no ids. Numbers with their units, said as words. Dates as
"15 Mayıs 2025", never "15.05.2025". Identity values are never spoken — they are written on the screen.

**Q-32 Never silent.** Every turn ends in an answer, a short clarifying question, or "Sizi tam anlayamadım, tekrar
eder misiniz?".

**Q-33 Latency budgets.** Fast path (no model): p50 at most 2 s to first sound. Model path: p50 at most 8 s and p95 at
most 15 s to first sound.

**Q-34 Medical speech.** (NOTYA-SES-NORMAL-01, extension of Q-31; Dr. Gökhan's specification.) By voice Ayşe does
not read the written medical text as it is: she speaks as a doctor speaks to another health professional. An
abbreviation is never spelled letter by letter and never read as a meaningless Turkish word — it gets its natural
clinical reading or, when needed, its full name ("KPA" → "konjuge pnömokok aşısı", "DaBT-İPA-Hib" → "beşli karma
aşı", and in detail "difteri aselüler boğmaca tetanos inaktif polio ve Hib aşısı"). Units, numbers, percentiles,
Z-scores, ranges and dates are said in words ("13,3 kg" → "on üç virgül üç kilogram", "50 mg/kg/gün" → "günde
kilogram başına elli miligram"). The short natural form is the default; the full form is used in the second stage of
a tiered answer or when the doctor asks for detail. The screen keeps the written form. This is done by a
deterministic layer in front of the speech engine (`lib/ses/tibbiSeslendirme.ts`, dictionary
`lib/ses/tibbiSeslendirmeSozluk.ts`), never by the model remembering it in each answer.

## D. Process

**Q-40 The corpus only grows.** Every live complaint from Dr. Gökhan becomes a corpus entry BEFORE its fix
(`lib/asistan/tests/gokhanSikayetKorpusu.ts`). An entry is never deleted to make a run green.

**Q-41 Release gate.** Any change that touches Ayşe's brain, routers, tools or voice is released only when: tests are
green; the corpus FAIL count is not above the baseline; the quality score is not below the baseline.

## What is checked mechanically, and what is not

The check is a rubric of pattern checks on the answer text. It measures form and wording. It cannot read a chart, so
it cannot tell whether a value is TRUE — that is what the corpus assertions on fixture values, the live pass and a
human reader are for. The table is the contract of `lib/asistan/kalite/kurallar.ts` (a unit test keeps the two in
step).

| Rule | Mechanical check (`denetim` key) | Not mechanical — live pass or a human |
|---|---|---|
| Q-01 | `cevap-once`: the first sentence is not a preamble, an announcement or a bare heading. | Whether the first sentence is the RIGHT answer. |
| Q-02 | `tek-olcum`: a single-measurement question is answered with that measurement and a date, and with no other vital sign outside the closing safety block. | Specificity of any other question; whether the added safety finding is clinically important. |
| Q-03 | `dayanak-yorum`: an interpretation heading is preceded by a record heading. Contradictions: only through corpus entries that require both values. | Whether interpretation leaked into the record lines; whether a contradiction exists that the answer missed. |
| Q-04 | `yapilmadi`: "yapılmadı / uygulanmadı / verilmedi …" only with the record named. `plan-uygulandi`: an item the entry's evidence marks as planned is not called given, and one marked given is not called missing. | States the entry's evidence does not list. |
| Q-05 | None in the rubric. Corpus entries assert fixture values (`icerir` / `icermez`). | Any invented value outside those assertions; "what would settle it". |
| Q-06 | `tam-tarih`: a day-and-month date carries its year. `takip-bugun`: a quoted follow-up window is placed against today. `takip-gecti`: a window the entry's evidence marks as passed is said to have passed. Visit day = note day: corpus entries on the late-entry fixture. | Whether the stated day is the right one on a real chart. |
| Q-07 | `hasta-adi`: a patient-bound answer names the patient in its first sentence. `yabanci-hasta`: no name of another doctor's patient. Address versus patient: corpus entries (bound-patient assertion). | — |
| Q-08 | `persentil-tarih`: a percentile or z-score comes with a date. `mgkg-kilo`: an mg/kg statement carries a weight and its date. Exact age: part of `bolumler`. | Whether the percentile is the engine's; whether the weight is the one at the prescription date. |
| Q-09 | `dikkat-sonda`: the safety heading is the last block. | Whether something that should be flagged is flagged; whether trivia is flagged. |
| Q-10 | `ses-kimlik` (voice side). Payload side: `lib/asistan/alanSizinti.test.ts`, in `npm test`. | — |
| Q-11 | `yasak-ifade` (filler), `bos-savusturma` (deflection without a next step), `ham-artik` (ids, JSON, template leaks, broken markdown), `turkce` (English leakage). | Tone; whether sentences are short enough to read well. |
| Q-20 | `uzunluk`: factual answer ≤ 2 sentences before the supporting lines; summary ≤ 275 words (250 + 10 %). `seri-tablo`: four or more dated values are a table. | Whether the supporting lines are the important ones. |
| Q-21 | `bolumler`: the required parts of Q1, Q3, Q4, Q8, Q9 and the visit summary are present (by heading or keyword). Q1 also: not a visit-by-visit list. | Whether each part says the right thing. Q1's record-dependent parts (perinatal, chronic, labs, consultations) are required only when the record has them — a human checks. |
| Q-30 | `ses-uzunluk`: at most 7 sentences and 65 words (≈ 25 s) unless the doctor asked to have it read. `ses-anlati`: the spoken text carries content — not only pointers to the screen; a narrative answer has 5 sentences, or as many as the screen answer has. | Real duration; whether the condensed narrative chose the right facts; "devam et" behaviour with real audio. |
| Q-31 | `ses-tarih` (no dd.mm.yyyy in the text handed to the speech engine; in the spoken text when the turn has no engine text), `ses-bicim` (no markdown, pipes, ids), `ses-birim` (no unit symbol left in the text handed to the speech engine), `ses-kimlik` (no identity value). | Pronunciation — judged by ear. |
| Q-32 | `sessiz-degil`: the turn produced an answer (text: non-empty; voice: spoken text non-empty, except recogniser noise that is dropped by design). | Silence caused by audio, ASR, TTS or the browser. |
| Q-33 | None as a gate. A live run reports p50 / p95 of the harness turn time per path against the budgets, as an indication. | Time to FIRST SOUND: measured in the live spot check, with a stopwatch or the page's timing log. |
| Q-34 | `ses-kisaltma`: the text handed to the speech engine carries no abbreviation of the pronunciation dictionary and no unit symbol or unit abbreviation (an abbreviation the dictionary reads as written — "BCG", "Hib" — is not a finding). The layer itself: golden unit tests (`lib/ses/tibbiSeslendirme.test.ts`). | Whether a reading is the one a clinician would use: by ear, Dr. Gökhan. Abbreviations that are NOT in the dictionary are not seen by the check — `npm run denetim:ses-kisaltma` lists the ones corpus answers still carry. Draft entries of the dictionary wait for his confirmation. |
| Q-40 | `kalite-karsilastir` fails when the run has fewer graded turns than the baseline. | That a complaint was entered before its fix: review. |
| Q-41 | `kalite-karsilastir`: non-zero exit when a rule's pass rate, the score, or the FAIL count is worse than the baseline. | Deciding that a lower baseline is acceptable: Kaan. |

## Score

Every check that applies to a turn gives one verdict (pass or fail) with the rule id and a short reason. The pass rate
of a rule is passed verdicts ÷ all verdicts of that rule. The quality score is passed verdicts ÷ all verdicts × 100.
A verdict exists only for an answer the product wrote: in a stand-in run (no model key) an answer written by the
stand-in is not judged, so only the model-free handlers are comparable there, and the baseline keeps the two modes
apart.

## Golden cases

The corpus (`lib/asistan/tests/gokhanSikayetKorpusu.ts`, ids `K-…`) holds one golden case per question below, on chat
and on voice. Each states the facts of the synthetic chart the answer must carry and what the rubric needs to know
(structure, which items are only planned, which follow-up has passed). The İlk-10 entries on the 15-visit chart
(`I-01` to `I-10`, three surfaces) carry that chart's planned-versus-given evidence.

The late-entry chart (`korpusGecGiris`, lib/asistan/dosyaSorgu/denetim/fikstur.ts) is a synthetic 19-month-old whose
three visits were typed in on one evening three days ago: the session rows carry that evening, each note carries the
day the child was seen. It also has a screening and a vaccine that are only planned (M-CHAT-R/F, Hepatit A 1. doz), a
consultation asked for with no answer, a follow-up window that has passed ("2 hafta sonra kontrol"), an abnormal lab
result with no repeat, and one weight in a note text that contradicts the series.

| Case | Sentence | Chart | The answer must |
|---|---|---|---|
| K-G01 | Bu hastayı bana kısaca özetler misin? | late-entry | give the exact age, name the planned M-CHAT-R/F and Hepatit A as planned, mention the low haemoglobin |
| K-G02 | Son muayeneden bu yana neler değişmiş? | late-entry | date the last visit by its note (the 18-month visit), with its weight |
| K-G03 | Büyümesi nasıl gidiyor? | late-entry | give the last values with the note's date and show the contradicting 14,1 kg as a contradiction |
| K-G04 | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | late-entry | give the exact age and say Hepatit A is planned with no record of being given |
| K-G05 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | late-entry | give Hb 10,2 with its date |
| K-G06 | Şu anda kullandığı ilaçlar neler ve dozları nedir? | late-entry | give D vitamini with its dose |
| K-G07 | Daha önce aynı şikayetle geldi mi? | late-entry | read by a person (the intended outcome is ambiguous); the rubric still judges the form |
| K-G08 | Gelişimi yaşına uygun mu? | late-entry | say M-CHAT-R/F is planned and not done, and report the mother's language concern |
| K-G09 | Bugün yapmam veya takip etmem gereken bir şey var mı? | late-entry | list the planned screening, the planned vaccine and the unanswered consultation, and say the control window has passed |
| K-G10 | Gözümden kaçabilecek önemli bir şey var mı? | late-entry | flag the unfollowed low haemoglobin and an open developmental item |
| K-VIZIT-B12 | 12 aylık muayenesini özetler misin? | 15-visit | carry that visit's measurements and milestones in the eight-part structure, and nothing of the otitis visits |
| K-VIZIT-G18 | 18 aylık muayenesini özetler misin? | late-entry | date the visit by its note and carry its weight, the planned items and the consultation |
| K-OLCUM-KILO, K-OLCUM-G-KILO | Kilosu kaç? | 15-visit, late-entry | give the weight and its date, no other vital sign |
| K-OLCUM-G-BOY | Boyu kaç? | late-entry | give the height and its date |
| K-OLCUM-G-BAS | Baş çevresi kaç? | late-entry | give the head circumference and its date |
| K-OLCUM-ATES | Son muayenede ateşi kaçtı? | one-visit chart | give the temperature and its date, no weight |
| K-TARIH-SON | En son ne zaman geldi? | late-entry | give the day of the last NOTE, never the day the visits were entered |
| K-TARIH-G18 | 18 aylık muayenesinde kaç kiloydu? | late-entry | give the weight with the day of that note |

Entries that today's build is known to fail name the ledger row of the defect (Q-40: the entry comes before the fix):
NOTYA-VIZIT-TARIH-01 (a visit is dated by its session row) and NOTYA-KALITE-STANDART-01e (the quick card answers a
measurement question without its date).

## Known conflicts with shipped behaviour (not changed by this work)

| Rule | Today | Decision needed |
|---|---|---|
| Q-30 | NOTYA-SES-OZET-TAM-01 (2026-10-01) reads a chart-evidence answer in full on voice. Q-30 asks for five to seven sentences and the rest on "devam et". An explicit read-aloud request ("oku", "bana anlat") is exempt in the rubric. | Kaan / Dr. Gökhan: which of the two stands for a summary asked by voice. |
| Q-30 | `lib/asistan/konusma.ts` turns a list of three or more items into "N madde, ekranınızda." | Product change to a condensed narrative — separate task. |
| Q-31 | Model-free handlers speak dates as "30.09.2026". | **Resolved for what is heard (2026-10-02, NOTYA-SES-NORMAL-01):** the medical speech layer says the date in words before the speech engine; the `soz` text (the transcript on screen) still carries the digits. |
| Q-34 | The specification text was cut off after the BCG example (NOTYA-SES-NORMAL-02); every dictionary entry beyond the received examples and the instruction is a draft. | Kaan: paste the remainder; Dr. Gökhan: confirm the drafts. |
| Q-06 | `lib/doktor/dosyaOlaylari.ts` dates a visit by `sessions.created_at`; the patient page already uses the note's date (NOTYA-MUAYENE-TARIH-DUZELT). | Product change — separate task; the corpus entry exists first (Q-40). |
