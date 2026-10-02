# Ayşe restoration report (2026-10-01)

Branch `restore/ayse-all`, cut from `origin/main` (contains PR 517). Nine slices plus one fix commit, each pushed.
**Not merged, not deployed.** Nothing here is shipped until the SHA is on `origin/main` and the Vercel production
deployment at that SHA is READY.

Scope: restore what Ayşe could do until Friday 2026-09-25 and add what Dr. Gökhan asked for
(`docs/qa/gokhan-yetenek-talepleri.md`), on Luna + Fish Audio only. Inputs: `docs/ayse-capability-regression-audit.md`,
`docs/ayse-randevu-forensics.md`. The two unmerged branches (`fix/ayse-randevu-capability` db856260,
`fix/ayse-voice-endpointing-vaccine-table` 93829e27) were read and ported selectively, not merged.

| Slice | Commit | Id |
|---|---|---|
| S0 test hang + routing table | `3c39b917` | NOTYA-AYSE-GERI-00 |
| S1 count template | `bf2e327a` | NOTYA-AYSE-GERI-01 |
| S2 Fish voice confirmation / withdrawal / continuation | `3121fa77` | NOTYA-AYSE-GERI-02 |
| S3 commands go to tools; appointments | `6b4b0626` | NOTYA-AYSE-GERI-03 |
| S4 dates server-side | `ff3d6ee6` | NOTYA-AYSE-GERI-04 |
| S5 records on screen | `5573be8a` | NOTYA-AYSE-GERI-05 |
| S6 voice detail and end of turn | `90d8f2ea` | NOTYA-AYSE-GERI-06 |
| S7 robustness | `14ac06cb` | NOTYA-AYSE-GERI-07 |
| S8 Luna action audit harness | `8a5a5caf` | NOTYA-AYSE-GERI-08 |
| fixes found by the full test run | `96d55c88` | -07, -08 |

## Verification summary

- `npx tsc --noEmit`: clean after every slice and at the end.
- Targeted suites after every slice; `npm run test:izolasyon` after every slice that touched a route or a patient
  lookup (S1–S8): 372 / 372 at the end.
- `npm run test:ayse` (the Ayşe suites added by this work): 232 / 232 at the end.
- **Full `npm test`, run once** at `8a5a5caf`, fishMikrofon fix in place, finished well inside the 25-minute limit:
  **4055 tests, 4053 pass, 2 fail.** Both failures came from this branch and were fixed in `96d55c88`:
  1. `lib/ai/model-sizmasi.test.ts` — the S8 harness named the model endpoint host in a comment; the guard allows
     that host in one file only. The harness now asks `lib/ai/saglayici.ts` for the endpoint.
  2. `lib/doktor/kapsamBugunSayim.test.ts` — with S7 a patient without index rows became a name candidate; the
     fixture's patient is called "Deneme Hasta", and "bugün kaç hastam var?" matched the name part "hasta". The same
     happens on main for an indexed chart of that name. Fixed: the word "hasta" as a name part selects a patient only
     inside the full name.
  The full run was **not repeated** after these fixes (it was to be run once). Re-run afterwards: the two failing
  files, the resolver suites, `test:ayse`, `test:izolasyon`, `tekBeyin`, `kapsamKilidi`, `hastaDosyaAra` — all pass.
  A second full run before merge is listed in the commitments.
- No live check of any kind was possible: no OpenRouter key, no Fish key, no Supabase credentials in this worktree,
  production domain unreachable from the sandbox. Every claim below is from code and from tests with a mocked model
  unless it says otherwise.

What the mocked-model tests prove and do not prove: they prove routing (which path a sentence takes), what is sent
to the model (tools, forced tool, chart), what the server does with a tool call, and that nothing is written before
confirmation. They do **not** prove what Luna answers. That is S8, and S8 was not run.

---

## S0 — test hang and routing regression table (`3c39b917`)

**Changed.** `lib/asistan/fishMikrofon.test.ts` hung the whole `npm test`. Cause: #505 raised the VAD silence tail
from 300 to 500 ms; the test still fed four silent frames (384 ms), the turn never closed, and the recorder's 200 ms
cancel-poll timer kept the process alive. The test now derives the silent frames from the tail constant, fails
instead of hanging, and stops the timer. New shared harness `lib/asistan/tests/ayseSahne.ts` (real route handlers,
in-memory Supabase, recording fake model). New `lib/asistan/ayseRota.test.ts`: a table of Turkish sentences with the
route each must take. New `lib/asistan/fishTur.test.ts`: the first route-level tests of `/api/asistan/fish-tur`.
`ayseCevapla` reports the route of every turn (`veri.rota`, one log line). 14 test files that `npm test` never ran
were added to it; `npm run test:liste` fails when a `*.test.ts` file is not listed.

**Evidence.** The table started with 40 rows pinned to the wrong route they took on main (the audit's findings as
executable facts). Every later slice removed rows from that list.

**Tests.** fishMikrofon suite finishes; routing table 65 rows today, known-failure list empty.

**Remains.** Nothing.

## S1 — count template (`bf2e327a`)

**Changed.** "Son 90 gün 0 hasta. Filtre: …" answered any sentence containing a chart word. Now the all-patients
search answers only an explicit count or list question, or looks for one described unnamed patient; everything else
goes to the model. The implicit "son 90 gün" window is gone (a window exists only when the doctor names one). With a
chart open, `toplam / en çok / en sık / vaka` stay on the open chart unless a word of the practice is next to them.
A patient whose first name equals a persona name ("Ayşe Yeşil") resolves from "Ayşe'nin", "Ayşe için"; the bare
vocative still selects nobody.

**Evidence.** The audit's probe sentences ("Toplam kaç aşısı var", "En çok hangi şikayetle geldi", "Ayşe'nin son aşı
tarihi ne") are rows of the routing table and now reach the chart / the model. 13 pinned failures removed.

**Tests.** `ayseRota`, `hastaCozumleyici`, `aktifHasta`, `fishTur` (voice path), isolation suite.

**Remains.** An unwindowed search is bounded by row limits (400 notes, 200 vaccine rows per query) — a very large
practice gets a partial count without being told. The implicit 30-day window of practice breakdowns
("en sık tanı") is unchanged. A bare first name equal to *another* persona's name resolves only when the caller
passes the addressed persona (`hitapAdi`); `ayseCevapla` does.

## S2 — Fish voice: Evet / Hayır, draft withdrawal, continuation (`3121fa77`)

**Changed.** When Ayşe's voice moved to `fish-tur`, only the brain call came along. Restored on that route: a spoken
"Evet / Onaylıyorum / Hayır" on a pending card is applied before the brain with no model call
(`sesliKarariUygula`, the same spine as the tap); a card prepared again for the same patient and action withdraws
the superseded draft; a turn cut at the spoken-sentence cap stores its remainder and "devam et" reads it with no
model call. A serious drug warning or an empty required field still cannot be confirmed by voice.

**Evidence.** Route-level tests through `fish-tur`: card → spoken read-back → "Evet" → row written; "Hayır" → draft
withdrawn, nothing written; second card withdraws the first; cut turn → "devam et" → remainder, `devamOkundu` marks
it read; another doctor's token cannot confirm (isolation).

**Tests.** `fishTur.test.ts` (14 new route tests replaced three pinned failures), isolation suite.

**UNVERIFIED.** The browser side (`components/asistan/AsistanOturumContext.tsx`): the remainder is kept while Ayşe
is still speaking and read when playback stops. Written from reading the code; never exercised with a microphone.

## S3 — commands go to tools; appointments (`6b4b0626`)

**Changed.** A command ("alerjisini ekle", "randevusunu perşembeye al", "Ventolini kes") used to be answered by a
model-free router (quick card, calendar reader, count template) before Luna saw it. `lib/asistan/komutNiyeti.ts` is
the one check that says "this is a command, and it names this tool". A command skips those routers and the tool
call is **forced** (the named tool, sent alone; or any tool when the wording names none). With no patient resolved
the tools are still offered, with a `hasta_adi` field that the server resolves inside the doctor's own patients.
New actions `randevu_tasi` and `randevu_iptal`; the appointment row is resolved by the server (not in the tool
schema, ignored in model output, read-only on the card). A request spread over several sentences (patient, day,
time) keeps what was said and forces the tool once complete. Free slots of a day are computed without the model.
Fish ASR no longer drops a digits-only answer ("14:30").

**Evidence.** Per tool: the sentence forces the tool, the card is prepared, and the table is unchanged until the
confirmation (asserted for every tool). Appointments: create → read-back → "Evet" → row; change keeps the day when
only a time is said; cancel sets status, does not delete; several appointments → a question, no card; another
doctor's appointment is never found even when the model invents its id. Wrong-patient guard: when the sentence
names a person who is not found, the open chart is not used instead. 20 pinned failures removed.

**Tests.** `ayseKomut`, `komutNiyeti`, `randevuSozu`, `ayseRota`, `core/eylemler/tests/*`, isolation suite.

**Design decisions to confirm.**
- The unmerged branch's model-free appointment dialogue (`randevuAkisi.ts`) was **not** ported. Commands go to
  Luna's tools; the pending-command state and the server-resolved values make completion deterministic. If S8 shows
  Luna unreliable even with a forced tool, that state machine is the alternative.
- Appointment **clock times stay Turkish time** (decision #480). A doctor abroad says "14:30" and gets 14:30 TRT.
- `olcum_ekle` and `dosya_notu_ekle` need today's exam to exist when the card is committed; without one the commit
  is refused with a sentence. Unchanged behaviour, now reachable by voice.

**UNVERIFIED.** Luna's behaviour on a forced tool (argument quality) and on the unforced no-patient turn — S8.
Working hours for free slots are read as wall-clock in the doctor's timezone; not checked for a doctor abroad.

## S4 — dates resolved by the server (`ff3d6ee6`)

**Changed.** Live defect: a vaccine given "bugün" produced a card dated 28.02.2024 (the model's guess). "bugün /
dün / az önce / yarın / cuma" and a spoken clock time are now read by the server from the doctor's own sentence, in
the doctor's timezone, and replace the model's value on the card. `bugunTRT` is gone from the action context;
`bugun + saatDilimi` reach every context (chat, fish-tur, ses-llm, card commit, undo, konsult, not-konsult,
ses-eylem). The date is spoken in words before "Onaylıyor musunuz?". `dogumdaTarihDoldur` fills the birth date only
for an explicit "doğumda / doğar doğmaz / doğumhanede" (it used to fire on "yenidoğan" and on "natal" inside
"postnatal").

**Evidence.** Tests where the fake model answers 2024-02-28 for "bugün" and the card carries the doctor's today;
"dün" with an empty model date; New York evening vs TRT day; two days in one sentence leave the model's value alone.

**Tests.** `sunucuTarihi`, `sesKapilari`, `ayseKomut`, `core/eylemler/tests/*`, isolation suite.

**Remains.** Narrow on purpose: a sentence with two days, or a "sonraki doz" next to the date, is not overridden.
The specialty cohort runners still build some dates without the doctor's timezone (NOTYA-KAPSAM-05d, untouched).

## S5 — records on screen (`5573be8a`)

**Changed.** Built from stored values only, no model call, new route `kayit`: the vaccine record as a table (same
rows as the Aşı Karnesi screen) with one spoken line; weight, height and head circumference for one exam, as a
time-ordered series, or across all exams; exam summaries for the last N, the first N, a year, or all exams (voice
reads up to three in full, then points to the screen). A measurement an exam lacks is written "kayıt yok".

**Evidence.** Text and voice produce the same screen text (asserted). Table content is asserted against the fixture
rows. The last 11 pinned failures removed — the known-failure list is empty.

**Tests.** `kayitTablosu` (includes the vaccine table), `ayseKayit`, `ayseRota`, isolation suite.

**Remains / not done.**
- **BMI and percentiles are not shown**: they are not stored, and Ayşe does not compute clinical numbers. Dr.
  Gökhan's item 4 says "if stored".
- No growth chart is drawn by Ayşe (none existed in the assistant before).
- The "Yaş" column of the vaccine table is derived from the birth date and the dose date, not stored.

## S6 — voice detail and end of turn (`90d8f2ea`)

**Changed.** A list, series, history or table request by voice gets the full chart instead of the short one. When
the short chart does not hold the answer the model writes a marker instead of "Bu ayrıntı sesli özetimde yok", and
the server runs the same turn once more with the full chart; the marker is never spoken or shown. VAD silence tail
500 → 700 ms. An utterance that ends mid-sentence ("Ayşe lütfen bana.") gets no reply: `fish-tur` sends `bekle`, no
brain call, nothing stored; the browser holds the clip and merges the next one. A first name that matches several
patients asks which one.

**Evidence.** `sesDosya.test.ts` (the audit's four sentences), `fishTur.test.ts` (marker → retry on the full chart;
`bekle`; no model call), `yarimSoz.test.ts`, `fishVad` / `fishSilero` tests at the new tail.

**UNVERIFIED.** Everything that needs a microphone: whether 700 ms is the right tail in a real room, the browser's
hold-and-merge, the 8-second window after which a held fragment is dropped without a word. The full chart is
truncated in the middle by its token budget — the oldest visits of a very long chart are still not in it.

## S7 — robustness (`14ac06cb`, `96d55c88`)

**Changed.**
- *Name index (PR 10).* A patient with no `patient_search_tokens` row was invisible to the name lookup; worse, a
  partly indexed doctor could have "Umutcan" resolved to the one indexed Umutcan. Now the doctor's unindexed active
  patients are candidates next to the index hits (`indekssizHastalar`: ids only, doctor-scoped, nothing decrypted).
  A complete index is remembered for one minute, so the normal case costs no extra query; more than 100 unindexed
  patients, or an unreadable index, means a full scan as before the index existed. `adParcasiMi` answers "no" only
  when the index covers every patient. Migration `lib/db/migrations/111_patient_search_tokens.sql` records the
  table. The test fixture and the two seed scripts write index rows.
- *SOAP advisory (PR 12).* `max_tokens` 2000 → 6000. The cap counts reasoning tokens; at 2000 the primary stopped
  with `length` before the JSON (`docs/denetim/2026-09-30-kademe.md`), so the advisory existed only through the guard.
- *In-note consult box (PR 12).* Sets `jsonBekleniyor` (except on a forced tool turn). A cut envelope keeps its
  answer text only — half a SOAP field is never written over the draft. Broken JSON with no answer no longer says
  "Düzenlemeyi ekrana işledim" when nothing was edited.
- *Memory extraction (PR 12).* Runs at effort `low` instead of `none`, with the JSON flag, cap 500 → 1200. A list
  cut in the middle keeps the whole records and drops the half one.
- *Tool pages (PR 13).* `aiCagir` takes a route time budget (`butceMs`, from `maxDuration`): primary attempts share
  the first 55 %, a retry that cannot fit is skipped, the guard call is bounded by what is left, and a call that
  cannot finish fails as an ordinary error the route reports. Applied to vaccine card, lab extraction, consult,
  e-reçete, SGK report, epikriz, dose suggestion. The vaccine-card truncation branch read `stopReason`; the field is
  `stop_reason`. Dose / SGK report / epikriz read JSON wrapped in prose; a **cut** answer is never completed —
  closing an open string would turn "560 mg" into "56".

**Evidence.** `hastaAramaIndeksi.test.ts`: unindexed patient found by name; indexed and unindexed namesake → a
question, not a silent pick; another doctor's unindexed patient is not a candidate. `sureButcesi.test.ts`: a primary
that never answers leaves time for the guard, 2 requests instead of 3, inside the budget; without a budget nothing
changes. `saglamlik.test.ts`: envelope, memory records, wrapped and cut JSON, the route sources. `soapUret.test.ts`:
cap, truncated advisory.

**Tests.** The above plus `kapilar`, `kademe`, `modeller`, `model-sizmasi`, isolation suite (372 / 372).

**NOT DONE / UNVERIFIED.**
- **The index coverage query was not run.** Supabase access was not granted to this session (the tool call was
  refused) and the worktree has no database credentials. Whether any production patient lacks index rows is still
  unknown. The fallback makes the answer matter less (such a patient is now found), but the query in audit §9 should
  still be run once, and the backfill (`scripts/_backfill_arama_indeksi.mts`, idempotent) if it returns rows.
- **Migration 111 was not applied**, and the production table definition was **not inspected**: the column list is
  taken from the code that reads and writes the table. Compare before applying anywhere.
- The thirteen throw-away smoke scripts still create patients without index rows; the fallback covers them.
- The advisory at 6000 was **not measured** on the real model (PR 12 asked for one measured run in `docs/denetim`).
- The JSON flag on the consult box sends a prose answer through the quality gate. If Luna often answers that box
  in prose, the guard share of `klinik-analiz` rises — watch `v_model_yedek_gunluk` after deploy.
- `vercel.json` gives every API route 60 s while two routes export `maxDuration = 120`; which one the platform
  applies was not checked. The budget uses the route's exported value.
- The budget is on `aiCagir` only; the streaming path (`aiAkis`, the voice turn) is unchanged.
- Cost and latency of memory extraction at effort `low` were not measured.

## S8 — Luna action audit (`8a5a5caf`, `96d55c88`)

**Built.** `npm run denetim:eylem` (`lib/asistan/tests/eylemDenetimi.kos.ts`): 33 sentences — every action family,
three that name the patient with no chart open, one with no patient at all, two multi-turn appointment requests, two
questions that must not call a tool — through the real `/api/asistan/chat` and `/api/asistan/fish-tur` (text input)
handlers on the in-memory scene with the synthetic patient. The model is the real primary through OpenRouter, guard
disabled (`NOTYA_KORUYUCU_KAPALI=1`). Two passes: production behaviour (a command forces its tool) and
`NOTYA_ARAC_ZORLAMA_KAPALI=1` (whole tool list, nothing forced — the audit's open question). Recorded per sentence
from the wire: forced tool, tools offered, tools called, cards made, answer, latency, cost. It needs only the
OpenRouter key: no production row is read, so the report it writes (`docs/denetim/<date>-ayse-eylem.md`) may be
committed. About 150 model calls for the full set.

**NOT RUN.** There is no `OPENROUTER_API_KEY` in this environment (checked: not in the process environment, no
`.env.local` in the worktree, the main checkout is outside this session's allowed directories).
**The tool-call rate of Luna is therefore still unknown.**

**What was run instead.** The harness with a stand-in for the model (`npm run denetim:eylem:kuru`, and
`lib/asistan/eylemDenetimi.test.ts` inside `npm test`). This proves the plumbing and the routing, not Luna: in the
production pass all 30 action sentences reach the model on both channels with the expected tool forced, the three
non-commands call nothing, and the unforced pass really sends no `tool_choice` and the whole tool list.

**Found by the dry run and fixed.** A tool call that arrives without a drug name was answered with
`"undefined" hastanın aktif ilaç listesinde bulunamadı`. Now only the missing field is asked.

**Remains.** Run it once with a key. Agree the target rate with Kaan before changing the prompt or the tool list.

---

## Dr. Gökhan's list — where each item stands

| # | Asked | State on this branch |
|---|---|---|
| 1 | Appointments: create, change time, cancel, list by day / patient, free slots | Built and tested with a mocked model (S3, S4). Live behaviour of Luna UNVERIFIED (S8 not run). |
| 2 | Vaccine record as a table, one spoken line | Built, model-free (S5). |
| 3 | Exam summaries: one, several, all | Built, model-free (S5); voice reads three, then the screen. |
| 4 | Anthropometrics: one exam, series, all exams | Weight, height, head circumference built (S5). BMI / percentiles not shown — not stored. No chart. |
| 5 | Any chart question reaches a real tool, never the count template | S1 + S3; routing table has no known failure left. |

## Rules check

- Luna + Fish Audio only: no change proposes Sonnet or ElevenLabs as a fix. The existing guard is untouched in
  role; S7 only bounds its call in time and keeps cut answers from being trusted.
- No patient data invented: tables and summaries come from stored rows; missing values are written as missing;
  dose and prescription JSON is never repaired.
- Cross-doctor isolation: `npm run test:izolasyon` 372 / 372; each new lookup has its own cross-doctor test.
- Nothing is written before the doctor's confirmation: asserted per tool (S3) and on the voice route (S2).
- PR #499 and `scripts/hasta-kalici-sil.mjs` were not touched.
- Product text Turkish; code comments, tests' prose, commits and this report English.

## Before merge

1. Run `npm test` once more on the branch head (`96d55c88` or later).
2. Run `npm run denetim:eylem` with an OpenRouter key; read the unforced pass.
3. One live voice session on Fish: spoken "Evet", "devam et", a sentence cut mid-way, a name → surname pause.
4. Run the index coverage query (audit §9); backfill if it returns rows.
5. Decide: appointment clock time for a doctor abroad (#480).
