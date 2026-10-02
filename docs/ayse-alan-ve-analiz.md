# Ayşe — identity fields as placeholders, and analysis across visits

Ledger ids: NOTYA-AYSE-ALAN-01, NOTYA-AYSE-ANALIZ-01 (owner Claude). Branch `feat/ayse-alan-ve-analiz`, created from
`origin/fix/ayse-arac-pariteti` (NOTYA-AYSE-ARAC-PARITE, `docs/ayse-arac-pariteti.md`). Written 2026-10-02.
Source: Dr. Gökhan's live feedback; both goals approved by Kaan on 2026-10-02.

Not merged, not deployed. Nothing here is shipped until the SHA is on `origin/main` and the Vercel deployment at that
SHA is READY.

## A. Identity and contact fields that never reach the model (NOTYA-AYSE-ALAN-01)

### The gap

`lib/doktor/kimlikSorusu.ts` answers parent names, guardian, phone, e-mail, address, birth place and birth date
without the model, and the chart deliberately never carries those values to the model (KVKK, VELI-YASAL-ONAM). When the
doctor's phrasing is one the classifier does not list ("annesine nasıl hitap edeyim", "nerede oturuyorlar", "aileye
hangi numaradan ulaşırım"), the turn reached the model, which had no way to the value and said so.

### How a turn runs now

1. The identity router is unchanged and still runs first (fast path, no model).
2. When it does not answer, the model is offered `hasta_alan(alan, hasta_adi?)` next to the other read tools. The
   model decides which field is asked.
3. The tool reads the same record the router reads (`kimlikKaydiOku`: patient card, latest Hasta Bilgi Formu,
   document summaries through `dosyaAlanTara.kimlikAlanlariniTara`) and returns **only**: the patient's name, whether
   the field is recorded, and a placeholder to write — `{{ALAN:anne_adi}}`. The value is not part of the result.
4. The model writes the placeholder into its answer. Just before the answer leaves the server, `alanlariYerineKoy`
   reads the record again with the authenticated doctor's id and puts the value in. A field with no value becomes
   the existing sentence that says where to add it ("E-posta kayıtlı değil — hasta dosyasında Özet › Demografik
   bilgiler › Düzenle’den ekleyebilirsiniz.").
5. A placeholder that was not issued in this turn (copied from history, invented) is removed.

### Two forms of one answer

| | Placeholder form | Doctor's form |
|---|---|---|
| Text | `Annesinin adı {{ALAN:anne_adi}}.` | `Annesinin adı <value>.` |
| Goes to | the stored session history, the next turns' model requests, the learning calls, `asistan_actions`, the unspoken remainder of a cut voice turn | the client only (chat response; `ses-ekran` for a voice turn) |
| Built | by the model | by the server at delivery, never stored |

The session stores the placeholder text plus references — `alanlar: [{ anahtar, alan, hastaId }]` — on the assistant
message. No value is stored. `app/api/asistan/ses-ekran` rebuilds the doctor's form on read with the same function,
scoped to the authenticated doctor: a reference to a patient who is not this doctor's reads nothing and its
placeholder is removed.

Two patients in one turn get different placeholders (`{{ALAN:anne_adi}}`, `{{ALAN:anne_adi#2}}`), so one patient's
field can never be filled with the other's value.

### Speech

On the voice channel a sentence that would carry a value is not read. Once per turn the doctor hears the sentence
the identity router already says — "<hasta> için istediğiniz bilgiyi ekranınıza yazdım Hocam." — and the value is on
the screen. A field with no value is spoken as its "where to add it" sentence (it carries no value).

So the spoken text goes to the speech provider (Fish Audio) exactly as it does on the identity router's path today:
without identity values. That was not changed. If the names should be read aloud one day, that is a decision about
sending them to the speech provider; it is one function (`alanSozcusu`) and it was deliberately left as it is.

### Audit

- `[asistan/okuma-araci] alan` — per tool call: field key, patient id, recorded / missing.
- `[asistan/chat] alan` — per delivered answer: field and patient references, number of placeholders removed.
- `audit_logs` — one row per patient per delivered answer: `resource_type = hasta_kimlik_alani`, `resource_id` the
  patient, `new_values = { alanlar, kanal, kaynak: 'ayse' }` (`logKimlikAlani`).

None of the three carries a value.

### Two leaks found by the leak test and closed here

Both exist on `origin/main` and are independent of the new tool. The test would not pass without the fixes.

1. **Document summaries.** `hastaDosyaDerleyici` put the first 400 characters of each document summary
   (`hasta_belgeler.ai_ozet`) into the chart text as is. A summary that quotes "Baba Adı: …" — the very line the
   identity answer reads — carried the father's name to the model. `belgeOzetindenKimlikCikar` now takes the identity
   lines (anne adı, baba adı, doğum yeri) out of the summary before it enters the chart.
2. **City.** The form field `il` (Şehir) was not in the list of fields kept from the model, although the card's
   `sehir` was, and although the address the identity answer gives is "adres, il". It is now kept back in the chart
   (`hastaDosyaDerleyici`) and in the label scan (`dosyaAlanTara` `GIZLI`). **This changes what the model knows: it
   no longer sees the patient's city.** Kaan: say so if the city should stay visible; then the address placeholder
   would have to give the street only.

### What the leak test does (`lib/asistan/alanSizinti.test.ts`)

Real routes over the in-memory scene. A synthetic patient has identity values in all three sources (card: mother,
phone; form: address, city, birth place, guardian; document: father). Eight turns per conversation, on chat and on
voice, with the patient named in the first sentence and with the chart already open: six turns the identity router
does not recognise (asserted), the router's own sentence in the middle, a clinical question, and a model that copies
an old placeholder without calling the tool. After every turn, every request sent to the model so far — system
prompt with its cached prefix, history, tool definitions, tool results, and the background learning calls — is
searched for every identity value. So are the stored session, `asistan_actions`, the audit rows and (voice) the
spoken text. The delivered answer must contain the value.

Cross-doctor: the other doctor's patient asked by name on both channels, chart open and closed (nothing returned,
the open chart's values are not given instead, no placeholder issued, no audit row); the tool called directly (a
foreign patient's name gives the same result as a name nobody has; a foreign id passed as "open chart" reads
nothing); a forged reference in a session read through `ses-ekran` (nothing read); another doctor reading the
session (404).

Mutation checks run by hand on 2026-10-02 (each makes the test fail, then reverted): summary redaction removed
(father's name in the first model request); `il` not kept back (city in the first model request); the doctor's form
stored instead of the placeholder form (mother's name in the second turn's model request).

### Limits

- **Whether Luna writes the placeholder as instructed is not known.** Every test uses a scripted model. A model that
  ignores the rule cannot leak a value (it never has one); the failure would be an answer without the value.
- Free text written by the doctor (visit notes, `belge_analizleri.hekim_ozet`) is sent to the model as before. If a
  doctor typed the mother's name into a note, it is in the chart. Only the structured sources and the document
  summaries are covered.
- In a document summary only the lines the identity reader itself reads are removed (anne adı, baba adı, doğum
  yeri). A phone number or an address quoted in a summary is not recognised and still enters the chart.
- `hasta_bul` keeps its own identity branch (the router's sentence sent through the tool): there the turn still ends
  with the values on screen and a second look-up asked in the same answer is dropped (NOTYA-AYSE-ARAC-PARITE-06 f).
  With `hasta_alan` the placeholder goes back to the model, so identity and another look-up can share one answer.
- The `patients` row is still serialized into the prompt as stored (encrypted columns as ciphertext). Not changed
  here.
- A placeholder that a model copied into a write tool's arguments (a card field) is not filled and would show as
  written. Cards are built from what the doctor said, and a command turn is not offered the read tools.

## B. Analysis across a patient's visits (NOTYA-AYSE-ANALIZ-01)

Dr. Gökhan asks "bu hastanın hangi muayenesinde X yapıldı" and "4 muayeneden sonra eksikler var mı, nelerdir". The
pieces existed; they are wired as three read tools. No reader and no clinical rule was written.

| Tool | Parameters | What it returns | Existing code it calls |
|---|---|---|---|
| `muayene_ara` | `terim`, `hasta_adi?` | The visits (date, ordinal, type) a drug, test, vaccine, diagnosis or procedure appears in, each line with its state; records outside a visit day (vaccine rows, lab rows) listed apart; says so when the term is nowhere | event index (`dosyaOlaylari`), `esanlamGenislet` / `terimlerdenBiriGeciyor` (complaint synonyms), `kayitSerisi` (vaccine series), `labAnahtarlariBul` (lab keys), `vizitTuruGruplariBul` (visit type), `durumAdi` |
| `muayeneleri_oku` | `adet` \| `tarihler` \| `tur`, `hasta_adi?` | Per visit: şikayet / bulgu / değerlendirme / tanı / plan, the measurements bound to the visit ("kayıt yok" for a missing one), prescriptions, what was planned and whether a later record answers it, same-day vaccine and lab rows; a closing line names the visits with no record of each measurement | event index, `vizitBolumleri` (`kayitTablosu`), `vizitOlcumKaniti` / `vizitleriSec` (`dosyaSorgu/vizitOlcum` — the reader of "12 aylık muayenesinde kaç kiloydu"), `planOlaylari` / `planKarsiligi` (`planTakibi`), `parametreSec` |
| `eksikler` | `hasta_adi?` | Section A: Fısıltı's lines for this patient. Section B: what a note planned or asked for whose answer is not in the record | `hastaFisiltisi` (below), `acikIsleriBul` (`acikIsler`), `fisiltiAyir`, `fisiltiGizlemeleri` |

All three take text and never an id. The patient is the name the model wrote, resolved among the authenticated
doctor's patients, or the session's open patient after `hastaSahibiMi`. A name that was given and not found is not
replaced by the open chart; another doctor's patient gets the same sentence as a name nobody has.

### Size cap of the digest

`muayeneleri_oku` reads at most 8 visits per call and at most 7 000 characters (Turkish runs near 3 characters per
token: about 2 300 tokens). When something has to go, the oldest visits go and the newest stay, and the first lines
say so: how many were shown, why, and the dates that were not shown, to be asked again by date. The event index
itself keeps a fixed number of characters of each note section (300 / 260 / 220 / 200 / 320); a section that reached
its cap is marked "burada kısaltıldı". `muayene_ara` shows at most 30 lines and says when it cut.

### Fısıltı and the assistant: one source, and where they still differ

**What Fısıltı is.** `lib/doktor/fisiltiTopla.ts` builds the card by fetching the doctor's own branch kohort route
over HTTP (`/api/doktor/<rota>/kohort`). Each of the 30 routes is a thin handler over one function,
`<branş>KohortVerisi(sb, doktorId, bugun, sadece?)`. That function is the Fısıltı engine for the branch. For
pediatri it flags: late vaccine in a series the record tracks, inconsistent vaccine record, missed well-child visit
window, percentile shift, D vitamin / iron prophylaxis, hearing / vision / autism screening.

**What the assistant had.** `lib/doktor/acikIsler.ts` (clinical file query standard, questions 9 and 10): plan
versus record. A lab asked with no result, a vaccine a note planned with no record, a control with no appointment, a
consultation with no answer, an allergy conflict, a repeating pattern — plus, from the branch parameters, schedule
items (vaccine calendar, growth, screening windows).

**So Fısıltı does use its own data path, and its own rules.** Two rule sets, overlapping on the schedule topics.

**What was unified.**

- `eksikler` calls the same kohort function in process (`lib/doktor/fisiltiHasta.ts`), for the one resolved patient,
  with the date the route passes, and normalises the row with Fısıltı's own `normalizeKohortSatiri`. Section A is the
  card's `detay` lines, verbatim. The acceptance test compares section A with what the real
  `GET /api/doktor/fisilti` returns.
- **For five branches: pediatri, dermatoloji, dahiliye, göz, kadın hastalıkları ve doğum.** A model turn may not be
  able to reach code that writes (NOTYA-EYLEM-24; `core/eylemler/tests/sessizYol.test.ts` walks the import graph of
  the turn). In the other 25 branches the kohort function shares its file with the reminder sender, which writes
  patient messages — the first version of this branch registered all 30 and the full `npm test` caught it. Only the
  five read-only engine files are imported. For a doctor of the other 25 branches section A says the branch's
  Fısıltı rules cannot be read from here and that the section is UNKNOWN (never "no gaps"), and section B shows the
  standard's items in full. `lib/doktor/fisiltiHasta.test.ts` reads all 30 engine files: the registry must be
  exactly the branches whose engine file does not write, each registered route must call the registered function,
  and the date must be the one the route passes.
- On the topics both rule sets cover (vaccine calendar, growth curve, screening window), a branch whose Fısıltı
  engine is connected shows Fısıltı's lines only: the standard's own schedule items (`asi-eksik`, `buyume`,
  `tarama-zamani`) are left out of section B. The assistant's gap list and the whisper cannot say different things
  about the same schedule.

**What was not unified, and why.**

1. *Fısıltı has no rule for three of the four gaps Dr. Gökhan's question is about.* On the synthetic patient Fısıltı
   reports the late Hepatit B dose and the missed 12-month visit window. It does not report the lab that was asked
   and never resulted, the control that was planned and never scheduled, or the visit with no weight. `eksikler`
   lists the first two in section B from the standard, labelled as such; the third is in the visit digest
   ("Ölçüm kaydı olmayan muayeneler: kilo — …"). **So "the listed gaps equal what Fısıltı reports" holds for
   section A, not for the whole list.** Making it hold for the whole list means teaching Fısıltı the plan-versus-
   record rules, which needs the event index of every patient in the cohort on every card load and adds new whisper
   classes for every doctor. That is a product decision and not a small change; it was not made here. The
   acceptance test pins the divergence: if Fısıltı gains one of these rules, the test fails and section B must stop
   repeating it.
2. *The assistant's other answers still use the standard's schedule.* The evidence path of questions 4, 9 and 10
   ("aşıları tam mı", "bugün yapmam gereken", "gözümden kaçan") still lists every calendar dose with no record, where
   Fısıltı flags only series the record tracks. `eksikler` and the whisper agree; those older answers can still say
   more than the whisper. Aligning them means changing the audited standard (`docs/AYSE-STANDART.md`,
   `dosyaSorgu/denetim`).
3. *Fısıltı's transport is unchanged.* The card still fetches over HTTP. Replacing the fetch with the in-process
   call would be a few lines, but it changes the production whisper path of 30 branches for no change in result.
4. *Other branches.* Section A is connected for five branches (above). Connecting one of the other 25 means moving
   its reminder sender out of `_kohort.ts` into its own file, as pediatri has it — mechanical, one file per branch,
   but 25 specialty files; the test then requires the branch to be registered. Which of the standard's items
   overlap a branch's kohort flags is known only for pediatri; for dermatoloji, dahiliye, göz and kadın
   hastalıkları ve doğum both sections are shown, labelled.
5. *Not in section A:* the two non-clinical whisper sources (unanswered portal messages, pending WhatsApp drafts).
6. *Hidden or muted whispers.* A doctor who hid the card or muted the patient still gets the gap from `eksikler`
   (they asked), with a note that the card does not show it.
7. *Dates.* 28 kohort routes pass the UTC date and two (pediatri, gebelik) the Turkey date. `eksikler` passes what
   the branch's route passes. Between 00:00 and 03:00 Turkey time the 28 are a day behind; not changed here.
8. *Import direction.* `lib/doktor/fisiltiHasta.ts` imports five files under `app/api/doktor/<rota>/_kohort.ts`.
   Nothing else in `lib/` imports from `app/api/`. The engines live there today; moving them under `lib/` would be
   the cleaner home and is the same refactor as (4).

### Prompt

`ANALIZ_KURALI` (in the read-tool block of the prompt tail): which tool for which question, "state as written"
(planned / asked / prescribed is not applied / resulted; "kayıt yok" is not "yapılmadı"), the gap list verbatim, say
when a tool cut. The parity test (`aracPariteti.test.ts`) stays green: every tool a prompt names is offered.

**Cost.** A non-command turn that reaches the model now carries six read-tool definitions (4 686 characters; 1 419
before this branch) and a rule block of 4 218 characters (1 827 before): about 5 650 characters more, in the
uncached tail. With a patient resolved that is 22 tools in one request (16 write, 6 read), above the 18 the action
layer caps itself at. Whether Luna picks the right tool among 22 is not measured.

### Acceptance (`lib/asistan/analizKabul.test.ts`)

Synthetic patient, four approved visits, four deliberate gaps (`tests/dortMuayeneHastasi.ts`). Real routes, chat and
voice, chart open and closed, read routers stubbed (`NOTYA_HIZLI_YOL_KAPALI=1`), a scripted model that calls the
tool and repeats the result:

- "hangi muayenesinde Augmentin yazıldı" → the one visit, its date, "reçete edildi"; no other visit.
- "hangi muayenesinde hemogram istemiştim" → the visit, "istendi"; never "sonuçlandı".
- "son 4 muayeneden sonra eksikler var mı, nelerdir" → `eksikler` and `muayeneleri_oku` in one round trip; all four
  gaps in the answer; section A deep-equal to the Fısıltı card of the real route.
- Cross-doctor: the three tools with another doctor's patient name → three "not found", no chart read, the open
  chart not used instead; tool called directly; a foreign id as "open chart" reads nothing.

With the routers on, the same sentences reach the model with the tools offered (asserted by the corpus test,
section C). One phrasing is still answered by the quick card (seen by hand, 2026-10-02): "hangi muayenesinde aşı
yapıldı" gets the vaccine list with dates, not the visits.

### Limits

- **Whether Luna calls these tools when it should, with the right term, is not known.** Every test uses a scripted
  model.
- The visit type is what the note says (`vizitTuruEsanlam`: sağlam çocuk, aşı vizidi, akut); a note that names none
  is "muayene". `sessions.session_type` is not in the event index.
- `muayene_ara` matches the term in the text, by complaint synonym, by vaccine series and by lab key. A drug's
  active ingredient or a brand's other names are not expanded.
- A visit with no weight is reported by the digest as a fact of the record. No engine treats it as a gap.

## C. Corpus

The Dr. Gökhan complaint corpus (NOTYA-GOKHAN-KORPUS-01, `audit/gokhan-korpus`) is not in this branch and does not
merge cleanly into it (`git merge-tree`: conflict in `package.json`; the corpus branch also changes
`lib/asistan/tests/ayseSahne.ts`). As agreed for that case, the entries were added as plain tests.

- `lib/asistan/tests/alanAnalizKorpusu.ts` — 12 entries in the corpus's own entry shape (sentence, source, chart
  state, surfaces, intended outcome): 5 for A (the 2026-09-25 live sentence, which the identity router must keep
  answering, and four phrasings it misses), 7 for B (the two live sentences, with the chart open and with the
  patient named, and three derived ones). Derived entries say how they were derived.
- `lib/asistan/alanAnalizKorpus.test.ts` — runs every entry on chat and voice through the real routes with the read
  routers ON (the acceptance tests stub them), and grades like the corpus: route, tools called, what the answer
  contains and may not contain (no refusal, no raw placeholder), what was spoken. 24 runs, 0 FAIL.

The model in this run is a stand-in that makes each entry's scripted calls, so a FAIL is a server defect. With the
read tools switched off (`AYSE_OKUMA_ARACI_KAPALI=1`) 22 of the 24 runs fail; the two that pass are the router-path
entry.

**Baseline.** The corpus's live number (FAIL 39 of 850 turns with real Luna, recorded for NOTYA-AYSE-ARAC-PARITE)
could not be re-run: the runner is not in this branch and there is no model key in this environment. What was
measured here: the suites that were green before are green after, and the new entries add 0 FAIL. When both
branches are on main the 12 entries move into `gokhanSikayetKorpusu.ts` as they are (drop `vekil`), and the live
run then measures what is not known today — whether Luna makes these calls.
