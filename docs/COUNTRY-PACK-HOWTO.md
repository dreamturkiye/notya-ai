# How to start a new country

Written 2026-10-09 (NOTYA-ULKE-SABLON-01). The standard a country must meet is `docs/COUNTRY-PACK-CHECKLIST.md`; this page is the practical side: what a country is made of, the one command that starts it, what has to be supplied and in which order, and what a successful build does **not** prove.

Uzbekistan (`countries/uz/`, `docs/COUNTRY-PACK-UZBEKISTAN.md`) is the worked example: three language forms, forty roles, a landing page. A country whose language another country already has is built differently and much smaller: see "Adding a country that shares a language".

## The short version

1. `node scripts/ulke-yeni.mjs <code> --dil <language> --yol </path>` creates the country: a folder, its registration, and its own record with every gate unticked.
2. The country cannot be built yet. `node scripts/ulke-paket-denetimi.mjs --ulke <code>` prints every item still to supply: **1066 for a one-language country (1026 texts, 40 settings)**.
2. The country cannot be built yet. `node scripts/ulke-paket-denetimi.mjs --ulke <code>` prints every item still to supply: **1260 for a one-language country (1215 texts, 45 settings)**, as the scaffold itself printed on 2026-10-10 (the line above and the 1082 further down were written before messages and clinic accounts stood in one branch; the command's own figure is the one to trust).
3. Supply them (sections below). Nothing falls back to another country's text or to a default.
4. `NOTYA_COUNTRY=<code> npm run build:ulke` builds it; the walk-through walks it.
5. **The country gets a database of its own.** The owner creates a new, empty one; one file, the baseline (`lib/db/ulke/000_yeni_ulke_veritabani.sql`), is run on it once. Section "The country's own database" below.
6. It is still **hidden from search and invitation-only**, and stays so until the gates of the checklist pass and the owner opens it. Building proves the pack is complete, not that it is right.

Steps 1 to 4 touch no database, no deployment and no setting, and nothing of Türkiye or of any other country. Step 5 touches the new country's own database and no other: **no country script is ever run on the Turkish database or on another country's.**

## What a country is made of

| Part | Where | Whose |
|---|---|---|
| Screens of the signed-in application, their shell, the layout of the landing page, login and sign-up | `components/ulke/` | the kit: shared by every country |
| Rules: who may read which row, how a note template is applied, how dates and times are written, appointment logic, the model gateway, speech recognition | `lib/ulke/` | the kit |
| Routes | `app/**/*.ulke.*`, `middleware.ulke.ts` | the kit; a country lists which exist for it |
| **The country pack**: settings, every text in its languages, role names, assistant names, note templates, instructions to the model, landing-page copy, leak list, optional language tools | `countries/<code>/` | the country |
| The country's record: answers to the checklist, decisions, who signed what | `docs/COUNTRY-PACK-<CODE>.md` | the country |

Kit code holds no country's text and no country's assumption. A screen asks the pack (through `countries/active/` and `lib/ulke/arayuz`); it never names a country. One build contains the kit plus **one** pack, chosen by `NOTYA_COUNTRY`.

## The scaffold command

```
node scripts/ulke-yeni.mjs <code> --dil <language> --yol </path>
node scripts/ulke-yeni.mjs gb --dil en --yol /uk
```

- `<code>`: ISO 3166-1 alpha-2, lower case.
- `--dil`: the country's language as a BCP-47 code (`en`, `kk`, `en-GB`). One language in one script.
- `--yol`: the path of the main site the country is served under. `/` means an address of its own.

It writes:

- `countries/<code>/`, 21 files, complete in shape, with every text as `eksik('hint')` and every undecided setting as `eksikAyar('hint')`;
- `countries/<code>/`, 19 files, complete in shape, with every text as `eksik('hint')` and every undecided setting as `eksikAyar('hint')`;
- the registration: `lib/ulke/tipler.ts` (the code list, and the language if it is new), the three doors `countries/active/{index,klinik,arayuz}.ts`, and `countries/tumu.ts`;
- `docs/COUNTRY-PACK-<CODE>.md`: the checklist's 121 gates, all unticked, the six about the country's own database among them (section M).

It refuses to run twice for the same code and changes nothing when it refuses.

Two of the files it edits are read by Türkiye's build (`lib/ulke/tipler.ts`: one more entry in a list and in a type; `countries/active/*.ts`: one more branch that a Turkish build never takes). The scaffold's test checks that every existing branch is byte-for-byte what it was.

## What to supply, in the order to work through it

Counts are for one language form. A second language or script repeats every text row.

| # | What | File | Items | Who |
|---|---|---|---|---|
| 1 | **Settings**: currency, default time zone and every zone of the country, locale, date pattern, separators, first day of the week, 12 or 24 hour clock, units, phone prefix and rule, identity number or none, second name field or not, patient languages, appointment norms, guardian age; for the patient portal: **how many days a patient's link stays valid** and **the ambulance number, or none**; for clinic accounts: **which capabilities exist**, which allied roles may be given a share, how long an invitation and cover last, who read the answers | `index.ts`, `ayarlar.ts`, `derleme.mjs` | 25 settings, 11 short texts | product, with the local lead; guardian age and identity rule with a lawyer; **the clinic settings with a lawyer** (who may read a record) |
| 2 | **Roles**: which exist, of which kind, and their official local names | `klinik/roller.ts` | 1 list (Uzbekistan: 40 roles) | local clinical lead |
| 3 | **Note templates**: each role's own fields, the guardian field, section headings | `klinik/notSablonlari.ts` | 5 lists (Uzbekistan: about 170 fields) | a reviewer per specialty |
| 4 | **Assistant names**: one per role | `klinik/asistanlar.ts` | 1 function (Uzbekistan: 40 names) | the owner |
| 5 | **Speech**: model, language codes, three thresholds, daily limit, consent version | `klinik/index.ts` | 6 settings, 2 texts | engineering; thresholds from real clinic audio |
| 6 | **Instructions to the model** for a visit note, written fresh in the note's language; and for the **summary for the patient** (what the model writes with it reaches a patient once the doctor shares it) | `klinik/talimatlar.ts` | 16 texts (two of them several paragraphs) | a clinician who practises in that language |
| 7 | **Core surfaces**: login, sign-up, holding page, error pages | `metinler.ts` | 48 texts | native writer |
| 8 | **Application**: first login, settings, home, patients, visit, note; and the words of the kit's own date, time and number fields (`girdi`, read by patients too) | `uygulama/metinler.ts` | 153 texts | native writer; the consent sentence with a lawyer |
| 9 | **Appointments**: working pattern, calendar, booking, reminder | `uygulama/randevuMetinleri.ts` | 113 texts | native writer |
| 9b | **Patient portal**: the doctor's controls (access, summary, requests) and what the **patient** reads (the PIN page, their own page) | `uygulama/portalMetinleri.ts` | 100 texts, 38 of them patient-facing | native writer; the patient-facing ones first |
| 9c | **Intake form, the screens**: the doctor's card, the invitation the doctor copies, the form as the **patient** reads it, and the name of each unit of measure the pack uses | `uygulama/formMetinleri.ts` | 63 texts and 1 setting (the unit names); 33 of the texts are patient-facing | native writer; the patient-facing ones first |
| 9d | **Intake form, the questions**: the core set every patient gets, one set per role, the consent sentence for a patient and for a guardian, and two version stamps | `klinik/hastaFormu.ts` | 4 texts, 2 settings (the core set; the role sets: Uzbekistan 23 and 228 questions) | **a local clinician per role**; the consent sentence with a lawyer |
| 9e | **Tools area**: the area's own words, and one tile's three texts for each of the three base tiles a new country starts with (the patient's page, "my templates", consultations) | `uygulama/araclar.ts` | 63 texts, 1 setting (who wrote and who read the tool texts) | native writer; every further tool with a local clinician |
| 9f | **Messages between a doctor and a patient**: the doctor's card and home list, and what the **patient** reads on their own page | `uygulama/mesajMetinleri.ts` | 49 texts, 21 of them patient-facing | native writer, the patient-facing ones first; whether a doctor may write to a patient this way: **a lawyer** |
| 9g | **"My templates"**: the screen's own words. The pack brings no template | `uygulama/sablonMetinleri.ts` | 29 texts | native writer |
| 9h | **Consultation between doctors**: the account's code, asking, what was asked, what this doctor was asked; the two periods; the stamp of the consent sentence | `uygulama/konsultasyonMetinleri.ts`, `index.ts`, `klinik/index.ts` | 82 texts, 2 settings, 1 stamp | native writer; **the consent sentence and both periods with a lawyer** |
| 9e | **Clinic accounts**: the clinic's screen, the five position names, each capability's name and **the sentence a doctor reads before giving it**, the record, the shared and cover views, the front-desk workspace | `uygulama/klinikMetinleri.ts` | 180 texts | native writer; the position names with the local clinical lead |
| 10 | **Landing page**: copy, 12 section anchors, language names, fonts, word mark; and the **price list** of its price section (what each plan costs a month, or "on request": data, never a number in the copy) | `acilis/icerik.ts` | 298 texts, 1 setting | marketing, native review; prices: the owner |
| 11 | **Leak list**: what marks content as this country's | `sizintiTerimleri.ts` | 2 entries to start, growing | engineering |
| 12 | Brand word mark | `arayuz.ts` | 1 text | the owner |

Rows 2 to 4 and the two question sets of row 9d count as one item each for the build and are the largest pieces of real work: a list of roles is one marker and forty decisions; the role sets of the intake form are one marker and, for Uzbekistan, 228 questions in three forms.

Some keys are required only under a condition and are written as comments in the template: the time-zone label and the portal's "times are in … time" sentence (if the country has several zones), the second-name label, the identity-number label. The pack check asks for each exactly when the setting that needs it is on.

**Hints are key paths, not reference wording.** Today a hint reads `application: kabuk.bugun`. The meaning of each key is in the type files (`lib/ulke/arayuz/metinTipleri.ts`, `acilisTipleri.ts`) and in the Uzbek pack. An English reference wording per key does not exist yet (see "English-speaking countries").

## What is shared and never supplied

Screens, layout and look; the route list; patient isolation; the rule that an approved note is never overwritten; the note contract with the model (`s`, `o`, `a`, `p` and `fields`); the speech engine and the model gateway; appointment logic and the no-double-booking rule; sign-up by invitation code; the walls between countries; the baseline of a country database and its migrations; the tests.

Off for every new country until built and reviewed for it: the assistant in text and voice, consultation and messaging, the voice profile, image evaluation. The patient portal, the intake form, the tools area and clinic accounts are part of the kit since 2026-10-09 (the sections below).

## Numbers, days and times a person types

Built once in the kit (NOTYA-ULKE-DENETIM-01, 2026-10-10); a country states its rules and writes nine short texts. Two faults found by the six country audits are closed here, and tests keep them closed.

**A typed number is read by the country's own rules, or refused. It is never guessed.** One parser reads every number a person types (`lib/ulke/arayuz/sayiOkuma.ts`): a tool's fields on the screen and again on the server, and the patient's intake form.

- The decimal mark is the pack's `bicim.ondalikAyraci`; thousands may be grouped with the pack's `bicim.binlikAyraci` or with a space, and only as correct grouping (groups of exactly three, a first group that does not begin with 0, never after the decimal mark).
- Where the point is the decimal mark (the English-speaking packs): "1,500" is one thousand five hundred, "12,345.6" is read, and **"1,5" is refused**.
- Where the comma is the decimal mark and the point is not the thousands mark (Uzbekistan): "1,5" and "1 500" are read; a point is read as a decimal mark ("1.5", "36.6", "0.125"), because many phone keypads offer no comma, **except where the same text could be thousands written with points ("1.500", "12.345.678"): refused**.
- What is refused is said under the field in the pack's own sentence, with two examples written the pack's way. While any field of a tool holds something that could not be read, the tool shows no result and the server keeps none, also where the field is optional: a limit that was typed and not read is never worked with as "no limit". The intake form is not sent while one of its fields holds something that could not be read.

**A day and a time of day are typed in the kit's own fields, never in a browser's.** A browser's own date and time fields are drawn in the order and clock of the browser's language, whatever the country. The kit draws its own (`components/ulke/girdi/`):

- a day as three small labelled fields in the order of the pack's `bicim.tarihDeseni`, with the pack's own mark between them; only a real day of the calendar with a four-digit year is a day;
- a time of day on the pack's `uygulama.saatBicimi`: hour and minute on a 24-hour clock; hour, minute and an explicit choice of the half of the day on a 12-hour clock (12 before noon is midnight, 12 after noon is noon). The words for the two halves are the ones the screens write beside every time (the platform's data for the pack's own locale);
- what is stored and sent did not change: a day is `YYYY-MM-DD`, a time of day is 24-hour `HH:MM`.

What a **country** supplies: its two number marks, its date pattern and its clock (settings it already states, row 1 of the table above), and the group `girdi` of the application catalogue (`uygulama/metinler.ts`): the labels of day, month, year, hour and minute, and four sentences. **Patients read these too** (the intake form), so a native reader reads them with the patient-facing texts.

What **kit code** must not do, and a test refuses (`lib/ulke/arayuz/sayiOkuma.test.ts`): draw `type="date"`, `type="time"` or `type="datetime-local"`; turn a comma into a point; call `parseFloat`; draw a field with the decimal keypad other than the kit's one number field.

Not built: height in feet and inches; a calendar to pick a day from; a read-back of the number as it was understood. A phone whose keypad offers only the other country's decimal mark cannot type a decimal in an English-speaking pack; the person switches the keyboard.

## The patient portal

Part of the kit since NOTYA-ULKE-PORTAL-01 (2026-10-09), and switched on in a new country's pack by the scaffold (`hastaPortali`). The doctor gives a patient a link and a PIN; the patient sees their own name, their doctor, their coming appointments and what the doctor chose to share, and may ask for an appointment. What it does, step by step, is in `docs/COUNTRY-PACK-UZBEKISTAN.md` ("The patient portal").

What is the **kit's**, the same in every country: the screens; the security limits (a 6-digit PIN, 5 wrong tries lock the link, 2 seconds between tries, a 30-minute session, `lib/ulke/portal/sabitler.ts`); the rules (the token alone shows nothing; nothing is shared by itself; an unapproved note is never shared; a request books nothing; isolation by country, doctor and patient; never indexed or cached); the tables (in the baseline).

What a **country** supplies:

| What | Where | Note |
|---|---|---|
| The catalogue, once per language form | `uygulama/portalMetinleri.ts` | 100 texts. 38 are read by patients, alone, on their own phone: a native reader reads those first. |
| The instruction for the summary for the patient | `klinik/talimatlar.ts` | Written fresh, read by a clinician. One per language form a patient may read. |
| **How long a link stays valid** | `index.ts`, `uygulama.portal.baglantiGecerlilikGun` | A whole number of days, 1 to 365. No default: **the owner confirms it**; how long a patient's access may stand is a question for a lawyer. |
| **The ambulance number** | `index.ts`, `uygulama.portal.acilNumara` | **Local content with no default.** A string, confirmed by a local source before any patient sees the portal; or `null`, and the patient's page says only that it is not for emergencies and names no number. The number is never written into a sentence: a catalogue sentence with a digit in it fails the pack check. |

**Not in the portal, and not half-built:** messaging, documents and uploads, payments, automatic reminders. (Intake forms were added by NOTYA-ULKE-INTAKE-01: next section.)

## The intake form: how a country supplies its questions

Part of the kit since NOTYA-ULKE-INTAKE-01 (2026-10-09), and switched on in a new country's pack by the scaffold (`hastaFormu`; it needs `hastaPortali`). The doctor asks a patient to fill in a form before a visit; the patient fills it in on their own page; the doctor reads the answers, marked as the patient's own words and not verified. What it does, step by step, is in `docs/COUNTRY-PACK-UZBEKISTAN.md` ("The intake form").

What is the **kit's**, the same in every country: the screens; the **seven question types** (one choice, several choices, short text, long text, yes or no with a line of detail, a date, a number with its unit; `lib/ulke/intake/tipler.ts`); the rules (consent before the first question; saved as the patient goes; submitted once and read-only afterwards; the doctor can reopen; a form holds the core questions and the questions of **its doctor's role and of no other**; for a patient below the pack's guardian age the form is addressed to a parent or guardian; the answers are encrypted, bound to country, doctor and patient, and **not given to the model that writes the note**); the table (in the baseline).

What a **country** supplies:

| What | Where | Note |
|---|---|---|
| The screens' text, once per language form | `uygulama/formMetinleri.ts` | 63 texts in four groups: `hekim` (the doctor's card), `davet` (the invitation the doctor copies and sends: the link's place is last, and there is no place for the PIN), `hasta` (the form on the patient's page), and `birim`: the name of each unit code the pack chose in `uygulama.birimler`, as a patient reads it. |
| **The core questions** | `klinik/hastaFormu.ts`, `cekirdek` | Sections, each with its questions. What every patient is asked, whatever the doctor's role. |
| **One set of questions per role** | `klinik/hastaFormu.ts`, `roller` | Keyed by the role keys of `klinik/roller.ts`. **Every role needs a set**, and a question belongs to one role: every question key is unique in the pack. A country without roles states `{}`. |
| The consent sentence, for the patient and for a guardian, and two version stamps | `klinik/hastaFormu.ts`, `riza`, `surum` | The stamps are stored with every form. Change the question set's stamp whenever a question changes, and the consent stamp whenever the sentence changes. `hukukcuInceledi` stays `false` until a lawyer has read the sentence. |

How a question is written (the shape is the kit's type, so a mistake is a type error or a line of the pack check):

| Field | Meaning |
|---|---|
| `anahtar` | the key the answer is stored under: lower-case letters, digits, underscores; unique in the whole pack. Never shown. Do not reuse the key of a removed question for a different question. |
| `tur` | one of the seven types. A choice lists `secenekler` (each with its own key and its name; `tek: true` for "none of these"). Yes or no may carry `ayrinti`, the label of the line asked after "yes". |
| `metin`, `veliMetni` | the question as it is put to the patient, and, where the wording differs, to a parent about their child. One entry per language form of the pack. |
| `kime` | `'yetiskin'` or `'cocuk'`: asked only of an adult, or only on the guardian form. A whole section can carry it. |
| `cinsiyet` | asked only where the patient's recorded sex is this one, and where none is recorded. |
| `zorunlu` | the form cannot be submitted without an answer. |
| a number | either `olcu: 'boy' \| 'agirlik' \| 'sicaklik'` — the unit is then **the pack's** (`uygulama.birimler`) and must not be written into the question — or a unit of the question's own (`birim`, with `enAz` and `enCok`). |
| `inceleme` | on the core set and on each role's set: `{ makineYazimi, klinisyen }`. A set is reviewed when `klinisyen` names the local clinician who read and signed it. |

**Rules a pack must keep, because no machine can check them.**

- **Questions, never reference content.** A form may ask "which medicines do you take?" as free text. It must not hold a drug list, a vaccination calendar, a screening schedule, a validated questionnaire, a score, a triage rule or an instruction to a patient unless a local clinician supplied and signed it. Where such content is wanted, keep a marked, empty slot and list it in the country's record (Uzbekistan: `countries/uz/klinik/hastaFormu/yerelIcerik.ts`, 18 slots).
- **Nothing of another country.** Another country's form may serve as a list of topics; none of its text is copied or translated, and what exists only there (its identity number, its payer and insurance section, its consent wording) is not carried over.
- **Local clinicians review per role**, and the record says for each role whether its set has been read. Until then every file says "machine-written" at its top.
- The guardian form should begin with who is filling it in. Questions about the parents (for example their marital status) belong to the guardian form only.

The pack check (`node scripts/ulke-paket-denetimi.mjs --ulke <code>`) refuses: a role without a set; a repeated key; a choice with fewer than two options; a text missing in one of the pack's forms; a unit code without a name; an invitation whose link is not the last thing in it; a sentence without the place for its value; a question for a role the pack does not have; the form switched on without the portal. A country's own content test should scan every question for another country's words and for the wrong script (Uzbekistan's: `countries/uz/klinik/hastaFormu/hastaFormu.test.ts`).

**Not in the intake form, and not half-built:** the answers as input to the model, file uploads, automatic sending, reminders, scoring.

## The tools area: how a country gets its doctor tools

Built once in the kit (NOTYA-ULKE-ARACLAR-01, 2026-10-09); a country fills it in. One address, `/tools`: the grid of the account's role, and `/tools?arac=<key>` for one tool.

- **A tool is two halves that meet by key.** The kit holds the mechanism (`lib/ulke/araclar/katalog.ts`): the fields, pure arithmetic that returns numbers and keys only, and the citation of the published source. The pack holds everything a doctor reads, and **who sees the tool** (`countries/<code>/uygulama/araclar.ts`, or a folder as Uzbekistan has).
- **Classify before adding.** Every entry says `roller: null` (a base tool: every role) or names the roles that see it; a tool of every doctor role says `sinif: 'hekimler'` ("Country-only tools and roles", below). The pack check refuses a tool that is not classified, a key the kit does not have, and a missing word in any language form. The grid and the address ask the same gate, so a tool that is not on an account's grid does not open from its address, and the server does not keep its result.
- **No tool of another country's state or payer system exists in the kit.** `countries/yasak-araclar.json` lists them per country, with every tool only one country has, and wall rule D7 (`scripts/ulke-duvarlari.mjs`) stops the kit, any other pack, any language set and any country route from naming one.
- **No national reference content is written by a machine.** A tool that needs a vaccination calendar, a drug register, a dosing table, a protocol, a reference range or a legal form is a **slot** in the pack (`yuvalar`): empty, switched off, saying what is missing and who supplies it. A published questionnaire is a slot too: its wording belongs to its authors.
- **Numbers the country decides.** Some mechanisms leave a threshold or an interval to the country (`parametreler`). The kit holds none of these numbers; a pack that switches such a tool on must state each one, and until a local clinician does, the tool stays a slot with `mekanizmaHazir: true`.
- **The kit proposes no follow-up day of its own.** Wherever the pre-split application adds days or months to a date, the kit has an empty date field the doctor fills in. An interval is clinical guidance of a country.
- **Units.** Length and weight follow the pack's units; a laboratory value follows `labBirimleri`, which the pack must state for every tool that reads one. The kit converts with the exact defined factors.
- **Keeping a result (migration 139).** A tool stores nothing by itself. Opened from a patient's file, it offers "keep in this patient's file" with an optional follow-up day. The browser sends the form as typed; the server works the result out again and keeps its own, as one encrypted value. The patient's file lists what was kept. The follow-up list (`takip-paneli`) is a role tool: give it to every role that has a tool whose result can be kept, and to no other.
- **A new country starts with three base tiles** that hold no clinical content (the patient's page, "my templates", consultations) and the area's own words: 54 texts, 3 texts for each tile and one setting (who wrote and who read the tool texts).
- **Two scripts.** Where a language has two scripts and one is derived from the other, store the derived text static and mark it. Uzbekistan's rule is `scripts/uz-kiril.mjs` (country tooling only; no build runs it), and its test holds every stored text to the rule.

## Country-only tools and roles

Built once in the kit (NOTYA-ULKE-OZEL-01, 2026-10-10), after six country audits reported the same limit: a country could only switch a shared tool off, reword it or rename a unit. The rule this section serves (Kaan): **a change to the core reaches every country; a country's own change affects that country only; a fault in one country never affects another.**

Every point below is used by ONE country, in its own folder. Nothing here is a default, and **no real country uses any of it yet**: on the day it was built, every country showed exactly the roles, tools, names, numbers and results it showed the day before. The worked example is the kit's test country `xx` (`lib/ulke/testing/ornekUlke/`): a complete pack that uses every point, exists in no build, and holds invented test data only. Read its `ayarlar.ts` to see how a country writes each of these.

**1. Roles of its own.** A pack's role list is its own: it may add, rename, remove, split or merge doctor roles and clinic roles.

- A role only this country has says which role it **behaves like** (`gibi` on the role). It then writes its notes with that role's template and asks that role's intake questions, under its own name and its own key. Where the country supplies a template or a question set under the role's own key, its own is used instead. A split is two new roles that behave like the one removed; a merge is one new role that behaves like one of the two. Tools are never inherited: each tool names its roles.
- A country of a shared language states only the difference from the set: `roller: { cikar: [...], ekle: [...] }` in its `ayarlar.ts`, and `roller: enRolAnahtarlari(<that object>)` in its `index.ts` (`countries/_dil/en/klinik/roller.ts`). Uzbekistan's lists are its own files; they are no longer typed by Türkiye's specialty keys, so a specialty added in Türkiye can no longer stop another country's build.
- `countries/rol-eslemesi.json` keeps the forty shared roles and gains `ulkeyeOzel`: per country, the shared roles it dropped and the roles it added, each with the role it behaves like. Tests hold every pack to the table, so a core fix can still be traced to every country.
- **No database change is needed.** A role is stored as text; the database checks only its form (lower-case words joined by hyphens, at most 60 characters), and the pack check now refuses a key the database would refuse.

**2. A tool catalogue of its own.** A pack can:

- **bring a tool only it has**: the arithmetic in its own folder (`kendiAraclari`), or an empty placeholder. The key begins with the country's code (`ca-...`);
- **change who sees a shared tool** (a country of a shared language: `araclar.gorenler`; any other pack writes its own role list);
- **give a tool to every doctor role**: `sinif: 'hekimler'`. "Base" (`roller: null`) still means every role, the allied professions included;
- **rename a tool and relabel anything on its screen** (a country of a shared language: `araclar.degisen`), and **change how many bands or steps it has** (`uyarlama`): its own table of bands over one number of the result, and its own list of choices for a field. The kit allows this only where nothing else in the result depends on it: it marks such a tool `bantSerbest` and such a field `secenekSerbest`. **No tool of the kit is marked yet**: marking one means reading its arithmetic, which belongs to the job that corrects the tools. Until then a country that needs another number of bands closes the shared tool and brings its own;
- **switch on a kit tool the shared language set has not written**, by bringing its words and its numbers (`araclar.ek`).

**3. Numbers with their units.** The kit works in one unit per quantity; a country states its numbers in its own.

- A threshold that is a laboratory value is stated **with its unit** (`{ deger: 110, birim: 'g/L' }`) and converted with the exact factor before anything is compared. Where the kit says a number is a laboratory value (`parametreOlculeri`), a bare number is refused. **No tool of the kit says so yet**, for the same reason as above.
- **A quantity may have more than one accepted unit** (`labBirimleri: { hemoglobin: ['g/L', 'g/dL'] }`). The doctor then chooses the unit beside the field; nothing is chosen for them. **A number without its unit gives no result**, also in an optional field: a missing input is never read as a reassuring one. This works for the kit's shared tools today (haemoglobin, the albumin-to-creatinine ratio, creatinine, glucose, cholesterol).
- A conversion may be a factor, or a factor and a shift (two scales of one measurement). A country's own tool may read a quantity of its own (`olculer`).
- **A table**, not only single numbers (`tablolar`): a tool says which columns it needs; the pack supplies the rows, with the unit of each laboratory column. A country's table of bands must cover every value: its last row has no upper limit.

**4. Tools by the patient's age and sex**, beside the role (`hasta: { enAzYas, enCokYas, cinsiyet }`, with the sentence that says who the tool is for). Opened from a patient's file, a tool that is not for that patient is not on the grid, shows only that sentence, and keeps nothing. **An unknown birth date or sex never opens such a tool for that patient.** Opened without a patient, the tool shows the sentence above its fields.

**5. Licence state on every tool and placeholder** (`lisans`): free, permission needed, paid, unclear, or permission granted, with the rights holder and where the terms were read.

- **A tool whose licence is not "free" or "permission granted" cannot be switched on**: the pack check refuses the build, and the screen and the server refuse it a second time. It stays a placeholder that says what is missing.
- A rights holder's notice (`bildirim`) stands under every result of the tool and in the summary that is copied.
- **A link-out tile** (`baglanti`) only opens an official calculator elsewhere: an `https` address fixed in the pack, nothing of the patient in it, nothing kept.
- A new country (`lisansTam: true`, written by the scaffold) must state the licence of every tool and placeholder. **The six existing countries do not state it yet for the shared tools**, and are listed in `countries/lisans-borcu.json`, a list that can only shrink: stating a licence means somebody has read the instrument's terms, and no machine may write "free" on a guess.

**6. One country's tools stay in that country.** `countries/yasak-araclar.json` lists, per country, the tools that are that country's alone: its state and payer tools, and any tool, link-out tile or placeholder only it has. Three locks: wall rule D7 stops every other country, every language set and the kit from naming a listed key, before every country build; the pack check refuses a key that carries another country's code; a test holds every pack's own keys to the list. The test country's keys are on the list, which is what proves that no real pack names one.

What each field is: the top of `lib/ulke/araclar/tipler.ts`. What a new country gets from the scaffold: the three base tiles with their licence stated, `lisansTam: true`, and these points listed at the top of its `uygulama/araclar.ts`.

**Not built** (each waits on the owner): a province or state setting below the country; a French language set; ethnicity or deprivation on the patient file; height in feet and inches; one tool's result as another tool's input. **Left for the job that corrects the tools** (clinical content): marking which kit tools allow a country's own bands and options, which kit thresholds are laboratory values, and the conversion for HbA1c and C-reactive protein (neither is a quantity of the kit yet).

## Messages, "my templates" and consultation between doctors

Built once in the kit (NOTYA-ULKE-MESAJ-01, 2026-10-09); a country fills them in. Three features, each switched on by the pack (`hastaMesajlari`, `hekimSablonlari`, `konsultasyon`), each with a catalogue of its own and rules in the pack check. **None of them calls a model, and none sends anything to anybody.**

**Messages between a doctor and a patient** (`lib/ulke/mesaj/`, migration 140) live inside the patient portal and nowhere else.

- **Only the doctor opens a conversation**, from the card on the patient's file. The patient reads and answers on their own page while that conversation is open. The patient's page says so plainly where no answer is possible (`hasta.yok`, `hasta.baslatamaz`).
- **The notice that messages are not for emergencies is always on the patient's page**, also when nobody has written. The sentence is the pack's (`hasta.acil`, `hasta.acilNumara`); the ambulance number is the pack's setting (`uygulama.portal.acilNumara`), and a sentence with a digit in it fails the pack check.
- **Unread marks on both sides.** Opening the card or the page marks what was shown as read, up to the newest message shown and no further. The doctor's home lists the patients who wrote.
- **The doctor closes a conversation**, once. A closed conversation takes no message from either side; both still read it. A new message from the doctor opens a new one.
- **No outbound channel exists.** Nothing tells a patient outside the portal that a message is waiting: no SMS, no e-mail, no messenger. The pack states this as a slot, `uygulama.mesaj.disBildirim: { acik: false, saglayici: null, eksik, kimden }`; the type and the pack check allow nothing else. The doctor's card says it in the pack's words (`hekim.bildirimYok`).
- **No attachment.** A message is text, one encrypted value bound to its country, doctor, patient, conversation and sender. The table has no column for a file.
- **Whether a doctor may write to a patient this way is a question of the country's law.** A lawyer answers it before a patient is written to (checklist I8).

**"My templates"** (`lib/ulke/sablon/`, migration 141) are a doctor's own reusable text blocks.

- A table of its own with **no patient in a row**; the name and the text are one encrypted value. Created, edited and deleted softly (the row stays, marked) on the tile `sablonlarim` of the tools area.
- Inserted by the doctor's own click: under each section of a draft note and under a message, the text goes **at the end** of what is written and replaces nothing.
- **A pack brings no template.** Ready-made wording for a note is clinical content, and a machine writes none.
- The feature and its tile go together: the pack check refuses one without the other, and a tile that is not a base tool.

**Consultation between doctors** (`lib/ulke/konsultasyon/`, migration 142) is a written question to a colleague of the same country's database.

- **A colleague is found by their consultation code and by nothing else.** An account makes its code on its own click and can replace it; there is no directory, no search by name, and no lookup by e-mail.
- The asking doctor writes the question on a patient's file and shares **nothing, one approved note, or that note's summary for the patient**. What is shared is **copied** at that moment and stored encrypted; the colleague reads the copy and never the patient's file. The colleague is shown no name and no id of the patient.
- **The consent tick is required.** The sentence is the pack's (`iste.riza`); its stamp (`klinik.konsultasyonRizasi.surum`) and the moment are stored with every consultation. **A lawyer reads the sentence** and says whether a consent recorded by the doctor is enough (checklist I9).
- **One answer.** The colleague answers once while the consultation is open; the asking doctor closes it, once.
- **Two periods, both the pack's** (`uygulama.konsultasyon`): `acikGun`, how long a consultation may stay open, and `kapanisSonrasiGun`, how long the colleague may still read it after the closing (0 = not at all). The kit has no default. A consultation whose open period has run out is not readable by the colleague, and closing it afterwards does not reopen it.
- Everything is on the row: who asked whom about whom, when it was opened, answered and closed.

A new country starts with all three switched on, their texts to supply, the two periods and the consent stamp to decide, and the outbound channel as a switched-off slot.

## Clinic accounts: a clinic, its staff, and who may help with whose patients

Built once in the kit (NOTYA-ULKE-KLINIK-01, 2026-10-09); a country fills it in. Two addresses: `/clinic` (the clinic, its members, "who can help with my patients", the record, what was shared with me) and `/desk` (the front-desk workspace). Switched on in a new country's pack by the scaffold (`klinikHesaplari`); a country that wants no clinics switches it off and supplies nothing.

**The rule everything else follows: a patient belongs to one doctor, and a position opens no patient.** A clinic is a list of accounts with one position each: owner, administrator, doctor, allied professional, front desk. Being a member, whatever the position, shows nobody a patient. Access is **added** as a permission that the patient's own doctor gives to one member, for one capability; the server checks it on every request, writes the request to the doctor's record before anything is read or written, and the permission can be withdrawn at once.

What is the **kit's**, the same in every country:

- **The five positions and the five capabilities.** Front desk, three separate ones: the doctor's appointments and the patient's card to book one (name, birth date, phone and nothing else); registering a new patient for the doctor; handing a patient the link and PIN of their page and asking for the intake form. Allied professional: the approved notes of **one named patient**. Another doctor: cover for a stated period, at most 31 days, **read-only**.
- **The check and the record** (`lib/ulke/klinikHesabi/yetki.ts`). On every request: the pack has the capability; the requester is a member now, in a position that may hold it; the doctor is a member of the same clinic now; the permission exists, is not withdrawn, is inside its period and, for a share, names this patient; the member's role may hold it. Then the record row is written, and only then anything is read. A request that fails any step is answered "does not exist" and writes nothing.
- **What the front desk is answered.** Every answer is built field by field (`lib/ulke/klinikHesabi/onBuro.ts`): no note, no visit, no transcript, no intake answer, no tool record, no summary, no reason of an appointment, no sex, no language, no identity number. A test holds the exact keys, and the walk-through reads them from a running server.
- **What the database holds by itself** (migration 145): both sides of a permission are members of the same clinic, by key; a removed member's permissions go in the same statement; a member whose position changes loses every permission; an invitation is used once and is stored only as a hash; a permission never changes, it is only withdrawn; a record row is never changed or deleted.
- **What a position does give.** The owner and an administrator manage members and invitations, and see the clinic's schedule: which member is busy when, with nothing of any patient. They read no doctor's record and no patient.
- **The front desk needs no role.** An account that joins a clinic at the front desk is never asked for one; its application is the workspace, the clinic and the settings.

What a **country** supplies:

| What | Where | Note |
|---|---|---|
| The catalogue, once per language form | `uygulama/klinikMetinleri.ts` | 180 texts. The five position names are agreed with the local clinical lead. `yetkiAciklama` is **the sentence a doctor reads before giving a capability**: it says plainly what the other person will see. |
| **Which capabilities exist** | `index.ts`, `uygulama.klinikHesaplari.yetkiTurleri` | From the kit's five. **Who may lawfully read a medical record is a question for a lawyer of the country**; list only what the lawyer accepts. |
| **Which allied roles may be given a share** | `…paylasimRolleri` | Keys of the pack's allied roles. The scope of practice of each profession is the country's law. `[]` until it is decided. |
| How long an invitation code lives; the longest cover | `…davetGecerlilikGun`, `…vekaletAzamiGun` | Whole days, 1 to 31. |
| Whether the clinic's owner may enter a permission for a doctor | `…sahipHekimAdinaVerebilir` | **`false`, written by the scaffold.** The pack check refuses `true` until `inceleme.hukukcu` names the lawyer who read the answers. The server supports it; no screen offers it yet. |
| Record retention | `…kayitSaklama` | **A slot, switched off: `null`, and the pack check refuses anything else.** The kit deletes no record row and has no purge. The period a country must or may keep the record is stated by a lawyer, and the purge is built then. |
| Who wrote these answers, and which lawyer read them | `…inceleme` | `{ makineYazimi, hukukcu }`. |

**The portal capability shows the link and the PIN to whoever hands them over.** That is what the capability is: a person at the front desk cannot give a patient a link and a PIN without seeing both, and with both the patient's page can be opened. The kit does not hide this; it makes the doctor decide knowingly: it is a capability of its own (not part of "appointments"), the sentence the doctor reads before giving it must say so in the form's own word for the PIN (the pack check looks for that word and refuses a catalogue without it), every link made is in the doctor's record with who made it, and every sign-in to the patient's page is in the portal's own record on the patient's file. A country whose lawyer does not accept this leaves `on-buro-portal` out of `yetkiTurleri`.

**Not in clinic accounts, and not half-built:** billing, plans, seats and payment; more than one clinic per account; writing a visit under cover; a screen for the owner to give a permission on a doctor's behalf; an invitation that also creates the account (in a closed country the invitee needs an account first); closing a clinic or handing it to another owner; a reason typed at the front desk when booking; a purge of the record. Each is in `docs/OPEN-COMMITMENTS.md` (NOTYA-ULKE-KLINIK-01) with who it waits on.

## The country's own database

**One database per country** (Kaan, 2026-10-09: "We had issues with common databases before. Keep seperation between the two and any other future country versions"). A country never shares a database with Türkiye or with another country, and no script of one is ever run on another's. Full text: `docs/COUNTRY-PACK-DB-ROLLOUT.md`.

What to do for a new country, in order:

1. **The owner creates the database**: a new, empty project of its own, in a region the country's data law allows (checklist A1). It has a monthly cost, so it is his decision each time. The organisation's free plan holds two projects, and Türkiye and Uzbekistan use them: every further country needs a paid plan.
2. **Run the baseline on it, once**: the whole of `lib/db/ulke/000_yeni_ulke_veritabani.sql`. It is generated from the country migrations (`node scripts/ulke-temel-uret.mjs`), holds no `drop` statement, is one transaction, and **refuses to run on a database that is not empty**, so it cannot land on a database that is in use.
3. **Check the result** with the two queries in the rollout document (tables, columns, row-level rules, functions, the ledger).
4. **Settings**, on the owner's word: public sign-up switched off in the new project; the country's deployment given its country code, its database's address and keys, and an encryption key of its own; build command `npm run build:ulke`.
5. Tick section M of the country's record, with the date.

What keeps countries apart:

- **First wall: the database.** A country's deployment holds the address and keys of its own database only.
- **Second wall: the country on every row**, exactly as before the databases were separated. Every country table has a `ulke` column, not null, with no default. Every read and write goes through one door (`lib/ulke/uygulama/tablolar.ts`), which stamps and filters by the build's country; code that reaches a country table any other way fails a test. The database repeats the rule on its own: row-level security requires the row's country to equal the country in the signed-in session, and foreign keys carry the country, so a row cannot point across countries. An account belongs to one country, set once at sign-up and locked by a trigger. Recordings live under `<country>/<account>/` in storage.
- Patient isolation between doctors is unchanged and sits underneath all of this.

`lib/ulke/ulkeVeritabani.paket.test.ts` runs the second wall's rules once per country folder, so a new country is held to them the day it exists. `lib/ulke/ulkeTemel.test.ts` keeps the baseline in step with the migrations, and `scripts/ulke-temel-kaniti.mjs` proves on a real local PostgreSQL that the baseline gives exactly the schema the migrations give.

**Logins are separate too.** Each database has its own sign-in service, so an account of one country does not exist at another, and the earlier hold on invitation codes (it came from a login pool shared with Türkiye) is gone.

## "Hidden, invitation only"

Every new country starts with two settings that the scaffold writes and does not mark for anybody to fill in:

- `aramaMotorlarinaGizli: true`: every response says noindex, `robots.txt` disallows everything, there is no sitemap.
- `uygulama.kayitAcik: false`: sign-up needs an invitation code, checked on the server, usable in that country only.

Only the owner changes either. Opening sign-up waits on section A of the checklist and the clinical lead's sign-off (rule 9); showing the site to search engines waits on the pilot (K2).

Serving a country under a path of the main site (`/uk`) also needs a routing rule on the live site. That is a setting of the live site and is the owner's decision each time; nothing in this repository makes it.

## Building, testing, walking through

```
node scripts/ulke-paket-denetimi.mjs --ulke <code>      # what is still to supply
npx tsc --noEmit                                         # a missing or misspelled key is a type error
npm run test:ulke                                        # every pack: walls, leak scan, database rules, completeness; the baseline is up to date
NOTYA_COUNTRY=<code> npm run build:ulke                  # pack scan + walls, the build, then the build proof
```

- `build:ulke` is the build command of a country deployment. A bare `next build` for a country is refused, so the build proof cannot be skipped.
- A build with no country set is Türkiye's and runs exactly what it runs on `main`.
- The pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`, run instructions at its top) walks any country in a real browser against the stand-ins: landing, login, first-login questions as far as the pack has any, home, settings, new patient, visit to approved note, appointment, a second account. It reads what to expect from the pack itself.
- Where the pack has them it also walks the patient portal, the intake form, the tools area, "my templates", messages between the doctor and the patient, and consultation between the two accounts, and checks in each that nothing was asked of the model unasked and nothing left the machine.
- The pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`, run instructions at its top) walks any country in a real browser against the stand-ins: landing, login, first-login questions as far as the pack has any, home, settings, new patient, visit to approved note, appointment, a second account; and, where the pack has them, the patient portal, the intake form, the tools area and clinic accounts (two clinics, five more accounts, each in a browser of its own). It reads what to expect from the pack itself.
- `node scripts/ulke-klinik-mutasyon.mjs` breaks the clinic rules one at a time (40 ways: a check skipped, a filter dropped, a field added to an answer) and expects the tests to notice each. Run it after any change under `lib/ulke/klinikHesabi/`.
- A country may add a deeper walk-through of its own wording. Uzbekistan's is `scripts/ulke-yuruyus/yuruyus.mjs`.

## What building does NOT prove

A pack that builds has every text and setting filled in. Whether they are right is decided by people and recorded, with a name and a date, in `docs/COUNTRY-PACK-<CODE>.md`:

| Gate | Checklist | Who |
|---|---|---|
| Data law, special data, consent for recording, medical-device status | A1 to A4, B, I | a lawyer in that country |
| Speech quality on real clinic audio; the thresholds | A5, L1 | native clinicians |
| A named clinical lead and a reviewer per specialty | A6, C14 | the owner |
| Clinical sources, roles, templates, instructions to the model | C, D | the reviewers |
| Every text read by a native speaker | E11 | native reviewer |
| Guardian age, identity-number rule, record law | B10, B12, G5 | a lawyer |
| Opening sign-up; showing the site to search engines | rule 9, K2 | the owner |

## More than one language or script

The scaffold writes one language in one script. To add another:

1. add its code to `DilKodu` in `lib/ulke/tipler.ts` if it is new, and to the pack's `diller`, `uygulama.diller` and `uygulama.dilGruplari` (the kit supports any number of languages and at most one language with several scripts);
2. add a full catalogue for it in each of `uygulama/metinler.ts`, `uygulama/randevuMetinleri.ts`, `acilis/icerik.ts` and, if it is a public language, `metinler.ts`;
3. add its instructions in `klinik/talimatlar.ts` and the three "rewrite in the other language" entries in `klinik/index.ts`;
4. add its speech codes.

The pack check lists whatever is left. Uzbekistan does all of this.

## Adding a country that shares a language

Written 2026-10-09 (NOTYA-ULKE-EN-01). Five English-speaking countries exist this way: the United Kingdom (`gb`, served at `/uk`), the United States (`us`), Canada (`ca`, English only), Australia (`au`) and New Zealand (`nz`). Their records are `docs/COUNTRY-PACK-UNITED-KINGDOM.md`, `-UNITED-STATES.md`, `-CANADA.md`, `-AUSTRALIA.md` and `-NEW-ZEALAND.md`.

**Each country is still a pack of its own**, with its own build, its own walls, its own leak list and its own database. What is written once is the language.

### The two parts

| Part | Where | What it holds |
|---|---|---|
| **The language set** | `countries/_dil/<language>/` (English: `countries/_dil/en/`) | Every text the countries of that language have in common, written once: the screens, the 40 role names, the note templates, the instructions to the model, the intake questions, the tools' words and slots, the landing copy. It names no country. |
| **The country's folder** | `countries/<code>/`, six small files | Only what is that country's: `ayarlar.ts` (everything it states: its form of the language, consent sentence, identifier label, time-zone sentence, role names where they differ, units, laboratory units, which tools it keeps as slots and why, speech settings, empty prices), `index.ts` (the pack's settings), `arayuz.ts` and `klinik/index.ts` (one line each: the set assembles the two halves from `ayarlar.ts`), `derleme.mjs`, `sizintiTerimleri.ts`, and its own test. |

The country hands the set one object (`EnUlkeGirdisi`, `countries/_dil/en/girdi.ts`); the set returns the pack's two halves (`enArayuz`, `enKlinik`) and the core catalogue (`enCekirdek`). **Nothing in the set is a default**: a country states every field, and marks in its own file what nobody of the country has verified.

### The walls (rule D8 of `scripts/ulke-duvarlari.mjs`)

- A country pack **may** import its language set.
- A language set imports **no** country pack, not `countries/active`, not `countries/tumu`, and no other language set. It reads no country code and carries no pack marker.
- Code outside `countries/` never imports a language set: it reaches a language's text only through the active pack. (Tests, scripts and `lib/ulke/testing/` may.)
- So a build still holds **exactly one country's pack**, plus the set that pack took. The build proof looks for the one marker.
- The leak hunt works between the countries of one language too: `sizintiTerimleri.ts` lists only what is that country's **alone** (its systems, its name, its identifier), never a word the countries share (a currency sign, an emergency number, a specialty name several of them use).

### Spelling: one text, several forms

The English set is written once in British spelling (`en-GB`) and converted **when the pack loads**; no converted text is stored. `countries/_dil/en/sozluk.ts` is the table, `countries/_dil/en/varyant.ts` the mechanism (`enYaz`, `enCevir`):

- whole words with their endings, each row stating the American form, which form Canada takes (**Canadian spelling is a mix stated word by word**: colour and centre as in Britain, pediatric and organize as in the United States) and, where it differs, the Australian form (`program`);
- medical stems, where the difference sits inside the word (`paediatr`, `anaesth`, `haem` …);
- **protected names** that are never rewritten: a unit symbol, a proper noun, the name of a medicine or an organism, a published instrument;
- **words where blind conversion is wrong in a clinical product**, handled one by one and guarded by test: practise / practice, licence / license, metre / meter (the unit against a measuring device such as a peak-flow meter), programme / program. Every use of such a word in the set is registered in `countries/_dil/en/ingilizce.test.ts` with the sense it is used in; an unregistered use fails the test.

Each pack's own test proves that no text it shows, and no instruction it hands the model, carries another form's spelling. **No native editor has read any of the five forms.**

### Role keys

All five countries share **one** set of 40 role keys, defined once (`countries/_dil/en/klinik/roller.ts`). `docs/COUNTRY-PACK-ROLE-KEYS.md` and `countries/rol-eslemesi.json` map each key to the Turkish product's key and to the Uzbek pack's key; `lib/ulke/rolEslemesi.test.ts` proves forty, none missing, none extra. The file is read by tests and scripts only. Since 2026-10-10 a country may differ from the forty and says so in its own folder and in that table ("Country-only tools and roles", above); today none does.

### Units are a clinical-safety matter

A country states its units (`kg`/`lb`, `cm`/`in`, `C`/`F`) and the unit its laboratories report each value in. The kit converts with the exact defined factors, and a measured field is never shown without its unit. Each English-speaking pack's test (`countries/_dil/en/testing/paketSinamasi.ts`, called from `countries/<code>/<code>.test.ts`) **runs every switched-on tool with values typed in that country's units against the kit's reference result**. Where a unit or a scale makes a tool unsafe or out of place, the country keeps the tool as a slot and says why (`araclar.kapali` in its `ayarlar.ts`); each such decision is recorded in the country's record as "for a local clinical lead".

### Steps for the next country of an existing language

1. Write `countries/<code>/` with the six files, following an existing folder of that language as the pattern (for example `countries/nz/`). **Every value is the new country's own statement**; none is taken over because another country has it. Mark the consent sentence `NOT READ BY A LAWYER`, the file `MACHINE-WRITTEN AND UNVERIFIED`, and the prices `EMPTY, SWITCHED OFF`.
2. Register the code in the five places a country is named: `ULKE_KODLARI` in `lib/ulke/tipler.ts`, one branch in each of `countries/active/index.ts`, `klinik.ts` and `arayuz.ts`, and `countries/tumu.ts`. (If the form of the language is new, add it to `DilKodu` and to the set's spelling table first.)
3. Write `countries/<code>/<code>.test.ts`: call the set's shared pack test with the country's own expectations (its units, its closed tools, the other countries' words that must not show), and add what is the country's alone.
4. Add the country to `scripts/ulke-en-kayit.mts` (its name, its open regulatory questions, each "for a lawyer") and run `npx --yes tsx scripts/ulke-en-kayit.mts --ulke <code>`: it writes `docs/COUNTRY-PACK-<NAME>.md` from the pack. The pack's test fails when that record is no longer what the pack says.
5. `node scripts/ulke-paket-denetimi.mjs --ulke <code>`, `npx tsc --noEmit`, `npm run test:ulke`, `NOTYA_COUNTRY=<code> npm run build:ulke`, the walk-through.
6. The country's own database, as for any country (below). Hidden, invitation only.

**The scaffold command does not write such a folder yet** (`scripts/ulke-yeni.mjs` writes a full one-language country with every item to supply). Recorded in `docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-EN-01.

### Four things to know before reading a pack's output

- **The sentences of the slots stay in British spelling in every pack** (accepted 2026-10-09). A slot's "what is missing" and "who supplies it" are written for documents and reviewers and are never shown on a screen, so the spelling table does not convert them and the spelling check does not read them. Every other rule holds for them: each pack's test proves they name nothing of another country and carry no claim, no amount of money and no identity number.
- **An allied profession's instruction does not open with the senior-doctor line.** For the five allied roles (physiotherapist, clinical psychologist, dietitian, occupational therapist, audiologist) the first sentence of the instruction to the model states the profession, in the country's own name for it, and that the colleague is not a doctor; every doctor role opens with "You are an experienced" and the country's word for a senior doctor. Each pack's test checks all forty roles. The instruction for the summary for the patient is one per pack and takes no role: it still opens with the senior-doctor line for every account (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-EN-01ac).
- **The example phone number can be nobody's.** Where this job is certain of a range the country reserves for fiction, the example is a number of that range (the United Kingdom's drama range, the 555-01xx numbers of the North American plan for the United States and Canada, Australia's numbers for creative works); otherwise it is a shape with X in place of digits (New Zealand). Each is marked unverified in the country's `ayarlar.ts`, and each pack's test checks the shape.
- **The landing component's internal keys are kit keys in another language, never shown.** The landing page is the kit's component (`components/ulke/acilis/`, `lib/ulke/arayuz/acilisTipleri.ts`), first built for Uzbekistan: its section and field keys (`suhbat`, `qabul`, `narx`, `xavfsizlik` …) and the three values that tell the component how to draw a turn of an example visit (`shifokor`, `yordamchi`, `ogohlantirish`) are Uzbek words, as most other kit keys are Turkish words. They are the contract between a pack and the component, not text: no screen shows them, the leak scan reads the screens and does not find them, and the pack tests leave keys out of the wall check. An English pack therefore holds these keys in its landing content. Renaming them to neutral names is a clean-up of the kit, recorded in `docs/OPEN-COMMITMENTS.md` (NOTYA-ULKE-EN-01aa).

### A new language set

A second language shared by several countries (French for Canada and others, Spanish, Arabic) is a new folder `countries/_dil/<language>/` built the same way: the texts once, an input type that names everything a country states, and — only if the language has national spellings — a table like the English one. A country with two languages takes two sets. **French for Canada is absent and waits on the owner.**

### What this does not change

No claim of compliance, approval, certification or integration is made anywhere, no price is shown, no clinical reference content of a country (vaccination schedule, medicine register, dosing, protocol, screening programme, an authority's threshold) is written by a machine, and no item of a published questionnaire is reproduced: each is an empty, switched-off slot that names what is missing and who supplies it. A test in every pack enforces the first two.

## The scaffold was proven once, end to end (2026-10-09)

A throwaway English-language country, `zz`, was created in a temporary copy of the repository, filled, built, walked through and deleted. Nothing of it is in the repository. Stand-ins only: no provider, no remote database.

| Step | Result |
|---|---|
| `node scripts/ulke-yeni.mjs zz --dil en --yol /zz` | 14 files, registered in 5 files, record with 113 unticked gates; 628 items to supply |
| Build before filling | stopped at once, listing the 628 items |
| Decided by hand | 65: the 31 settings, 32 short texts that are facts with a format (currency, zones, locale, date pattern, phone, anchors, fonts, model id, consent stamp, leak terms), 2 conditional labels (it was given two time zones) |
| Filled mechanically | 565 texts, each with its own key path as placeholder wording. **Not real English.** |
| Settings chosen to differ from Uzbekistan | 12-hour clock, month-first dates, week starting Sunday, two time zones, pounds / inches / Fahrenheit, no second name, no identity number, guardian age 16, two roles |
| Type check, walls, pack scan | clean |
| Country test suite with three packs | 672 of 672, and 22 of 22 for each of `tr`, `uz`, `zz` |
| `NOTYA_COUNTRY=zz npm run build:ulke` | built; build proof: the `zz` pack and no other |
| Pack-neutral walk-through | 120 of 120 |
| Found by the proof and fixed in the kit | the settings page of a one-language country had no heading |

Counts in this table are those of that run. Since NOTYA-UZ-FIYAT-UNVAN-01 (2026-10-09) the landing page has a price section with a price list: 36 more texts and one more setting, so the scaffold then answered 665 items (633 texts, 32 settings). Since NOTYA-ULKE-PORTAL-01 (2026-10-09) it writes the patient portal too: 15 files, 119 gates, **769 items (735 texts, 34 settings)**: 100 portal texts, 2 texts for the summary's instruction, and 2 settings (link validity, ambulance number). **For the portal the proof was repeated only in part:** a throwaway `zz` was scaffolded in a temporary copy and type-checked clean; it was not filled, built and walked again (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-PORTAL-01h). The portal's rules and screens run in the test suite for every pack, and both walk-throughs walk it for Uzbekistan.

**Repeated in full with the patient portal and the intake form (2026-10-09, NOTYA-ULKE-INTAKE-01).** The scaffold now writes 17 files and 119 gates and answers **839 items (802 texts, 37 settings)**: 64 more for the intake form's screens (63 texts and the unit names) and 6 more for its questions (two version stamps, two consent sentences, the core set, the role sets). A throwaway `zz` was again created in a temporary copy, filled, type-checked, built, tested, walked through and deleted; nothing of it is in the repository.

| Step | Result |
|---|---|
| `node scripts/ulke-yeni.mjs zz --dil en --yol /zz` | 17 files; 839 items to supply |
| Decided by hand | the 37 settings (with a core set of 7 questions and two role sets of 2 questions each), 34 short texts that are facts with a format, 3 conditional labels |
| Filled mechanically | 768 texts, each with its own key path as placeholder wording. **Not real English.** |
| Settings chosen to differ from Uzbekistan | as before: 12-hour clock, month-first dates, two time zones, pounds / inches / Fahrenheit, guardian age 16, two roles; and **no ambulance number** |
| Type check, pack check | clean |
| Pack-parameterised tests with three packs | 121 of 121 for each of `tr`, `uz`, `zz` |
| `NOTYA_COUNTRY=zz npm run build:ulke` | built; build proof: the `zz` pack and no other |
| Pack-neutral walk-through | 276 of 276: the portal (58 checks) and the intake form (56) among them, with the guardian form at the pack's age of 16, height and weight asked in inches and pounds, the pack's own questions and no other role's |
| Found by the proof | the build stopped on one mechanically filled sentence that lacked the place for its value (the portal's time-zone sentence): the pack check doing its work, not a fault of the kit |

This closes what was left open for the portal (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-PORTAL-01h): a 12-hour clock, several time zones and a pack with no ambulance number have now been walked in a browser.

From scaffold to a passing walk-through took about 16 minutes of machine time, two production builds included. That measures the mechanism only: supplying real, reviewed content is the work, and it is counted in the table of items above.

**With the tools area (2026-10-09, NOTYA-ULKE-ARACLAR-01) the proof was repeated only in part.** The scaffold now writes 18 files and answers **897 items (859 texts, 38 settings)**: 58 more (54 texts for the tools area's own words, 3 for the patient page's tile, 1 setting). A throwaway `qq` was scaffolded in the repository, type-checked clean, and its build was refused with the list of all 897 items, as it must be; then it was deleted. It was **not** filled, built and walked again (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-ARACLAR-01).

**With messages, "my templates" and consultation (2026-10-09, NOTYA-ULKE-MESAJ-01) the proof was again repeated only in part.** The scaffold now writes 21 files and answers **1066 items (1026 texts, 40 settings)**: 169 more (49 texts for messages, 29 for "my templates", 82 for consultation, 6 for the two new base tiles, 1 for the stamp of the consent sentence, and 2 settings: the two consultation periods). A throwaway `qq` was scaffolded in a copy of the repository, type-checked clean, and its build was refused with the list of all 1066 items, as it must be; then the copy was deleted. It was **not** filled, built and walked. The type check found one hint with an unescaped apostrophe that the scaffold's test had passed; the test now parses every file the scaffold writes (`lib/ulke/ulkeYeni.test.ts`).

**With clinic accounts (2026-10-09, NOTYA-ULKE-KLINIK-01) the proof was again repeated only in part.** The scaffold now writes 19 files and answers **1082 items (1039 texts, 43 settings)**: 185 more (180 texts of the clinic catalogue and 5 settings: which capabilities, which allied roles, the two periods, who read the answers). Two clinic settings are written by the scaffold and are not open: a clinic's owner may not enter a permission for a doctor (`false`), and record retention is a slot (`null`). A throwaway `zz` was scaffolded in the repository, type-checked clean, and its build was refused with the list of all 1082 items (185 of them for clinic accounts), as it must be; then it was deleted and the five registration files restored. It was **not** filled, built and walked (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-KLINIK-01).

**With the kit's own date, time and number fields (2026-10-10, NOTYA-ULKE-DENETIM-01) the proof was not repeated.** The scaffold writes 9 more texts (the group `girdi` of the application catalogue: the labels of day, month, year, hour and minute, and four sentences) and answers **1260 items (1215 texts, 45 settings)** in 22 files, read from a run in a throwaway folder that was then deleted. No throwaway country was filled, built and walked for it; the scaffold's own test passed.

## Known gaps

- **Units**: the intake form is the first screen that reads them (height, weight and temperature are asked in the pack's units, each named by the pack). The visit note still shows no measurement in a unit.
- **Instructions to the model** are assembled inside each pack (`klinik/talimatlar.ts`); the kit has no shared builder. The template's own small builder covers one language.
- **Scaffold hints** are key paths, not reference wording.
- **Prices** are a list the pack states (plan → amount a month, or on request) and the landing layout writes with the pack's number rules. Nothing else in the kit shows money yet.
- **Two product pieces** are not in the kit and exist for no country but Türkiye: the assistant in text and voice, and clinic accounts. (The patient portal, the intake form, the tools area, messages, "my templates" and consultation are in the kit since 2026-10-09, without documents, attachments, payments, automatic reminders or any outbound notification; the form's answers are not given to the model.)
- **Messages and consultation have no outbound channel and no attachment.** A patient learns of a message from the doctor, a colleague learns of a question on their own home screen. Both wait on the owner (provider and cost) and on a lawyer (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-MESAJ-01).
- **A colleague is found by code only.** Lookup by exact e-mail address is not built.
- **Two product pieces** are not in the kit and exist for no country but Türkiye: consultation and messaging, and the assistant in text and voice. (The patient portal, the intake form, the tools area and clinic accounts are in the kit since 2026-10-09: the portal without messaging, documents, payments or automatic reminders; the form's answers not given to the model; clinic accounts without billing, seats or payment.)
- **Clinic accounts: cover is read-only.** A visit belongs to the patient's own doctor by a key of the visit table, which no clinic job may alter; a covering doctor reads approved notes and the appointments and writes nothing. Whether and how a visit is written under cover is an open decision (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-KLINIK-01).
- **Clinic accounts: the settings are law, not product.** Which capabilities exist, which allied roles may read a share and how long the record is kept cannot be verified by a machine and are unverified for every country until a lawyer of that country is named in the pack.
- **Intake answers stay beside the note.** They are shown to the doctor and never given to the model that writes the note; whether and how they should be is an open decision (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-INTAKE-01b).
- **The portal's link validity and ambulance number** are settings a pack must state and that nothing can verify by machine: the first is the owner's, the second needs a local source.
- The **Uzbek** walk-through of its own wording is not parameterised; the pack-neutral one is.

## One release branch per country (Kaan, 2026-10-09)

Kaan, 2026-10-09: "Each country should indepedently merge and deploy. […] if there is something that goes bad with one country it should never affect the others."

How that is kept:

- **A country is deployed only from its own branch**: `release/uz`, `release/gb`, `release/us`, `release/ca`, `release/au`, `release/nz`. Nothing is ever deployed for a country from a shared branch. Türkiye is deployed from `main` and from nothing else.
- **Work is developed on a shared branch and reaches a country by that country's own merge**: one pull request per country, from the development branch into `release/<code>`. Merging it changes that one country and no other. A change to the shared kit therefore reaches Uzbekistan only when Uzbekistan's pull request is merged, and can be held back or reverted for one country without touching the rest.
- **Before a country's pull request is merged**, for THAT country: pack check, its pack tests, `NOTYA_COUNTRY=<code> npm run build:ulke` with the build proof, and its walk-through. Another country's failure does not block it.
- **Each country has its own**: Vercel project, database, server key, encryption key, invitation codes. A build holds one country's pack and no other (the build proof fails otherwise).
- **Rolling one country back**: redeploy that country's previous deployment in its own Vercel project, or revert the merge on its `release/<code>` branch. No other country is rebuilt.
- **A new country** gets its `release/<code>` branch when it is first deployed.
