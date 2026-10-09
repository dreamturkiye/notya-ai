# How to start a new country

Written 2026-10-09 (NOTYA-ULKE-SABLON-01). The standard a country must meet is `docs/COUNTRY-PACK-CHECKLIST.md`; this page is the practical side: what a country is made of, the one command that starts it, what has to be supplied and in which order, and what a successful build does **not** prove.

Uzbekistan (`countries/uz/`, `docs/COUNTRY-PACK-UZBEKISTAN.md`) is the worked example: three language forms, forty roles, a landing page.

## The short version

1. `node scripts/ulke-yeni.mjs <code> --dil <language> --yol </path>` creates the country: a folder, its registration, and its own record with every gate unticked.
2. The country cannot be built yet. `node scripts/ulke-paket-denetimi.mjs --ulke <code>` prints every item still to supply: **1082 for a one-language country (1039 texts, 43 settings)**.
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

- `countries/<code>/`, 19 files, complete in shape, with every text as `eksik('hint')` and every undecided setting as `eksikAyar('hint')`;
- the registration: `lib/ulke/tipler.ts` (the code list, and the language if it is new), the three doors `countries/active/{index,klinik,arayuz}.ts`, and `countries/tumu.ts`;
- `docs/COUNTRY-PACK-<CODE>.md`: the checklist's 119 gates, all unticked, the six about the country's own database among them (section M).

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
| 8 | **Application**: first login, settings, home, patients, visit, note | `uygulama/metinler.ts` | 144 texts | native writer; the consent sentence with a lawyer |
| 9 | **Appointments**: working pattern, calendar, booking, reminder | `uygulama/randevuMetinleri.ts` | 113 texts | native writer |
| 9b | **Patient portal**: the doctor's controls (access, summary, requests) and what the **patient** reads (the PIN page, their own page) | `uygulama/portalMetinleri.ts` | 100 texts, 38 of them patient-facing | native writer; the patient-facing ones first |
| 9c | **Intake form, the screens**: the doctor's card, the invitation the doctor copies, the form as the **patient** reads it, and the name of each unit of measure the pack uses | `uygulama/formMetinleri.ts` | 63 texts and 1 setting (the unit names); 33 of the texts are patient-facing | native writer; the patient-facing ones first |
| 9d | **Intake form, the questions**: the core set every patient gets, one set per role, the consent sentence for a patient and for a guardian, and two version stamps | `klinik/hastaFormu.ts` | 4 texts, 2 settings (the core set; the role sets: Uzbekistan 23 and 228 questions) | **a local clinician per role**; the consent sentence with a lawyer |
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
- **Classify before adding.** Every entry says `roller: null` (a base tool: every role) or names the roles that see it. The pack check refuses a tool that is not classified, a key the kit does not have, and a missing word in any language form. The grid and the address ask the same gate, so a tool that is not on an account's grid does not open from its address, and the server does not keep its result.
- **No tool of another country's state or payer system exists in the kit.** `countries/yasak-araclar.json` lists them, and wall rule D7 (`scripts/ulke-duvarlari.mjs`) stops the kit, any pack and any country route from naming one.
- **No national reference content is written by a machine.** A tool that needs a vaccination calendar, a drug register, a dosing table, a protocol, a reference range or a legal form is a **slot** in the pack (`yuvalar`): empty, switched off, saying what is missing and who supplies it. A published questionnaire is a slot too: its wording belongs to its authors.
- **Numbers the country decides.** Some mechanisms leave a threshold or an interval to the country (`parametreler`). The kit holds none of these numbers; a pack that switches such a tool on must state each one, and until a local clinician does, the tool stays a slot with `mekanizmaHazir: true`.
- **The kit proposes no follow-up day of its own.** Wherever the pre-split application adds days or months to a date, the kit has an empty date field the doctor fills in. An interval is clinical guidance of a country.
- **Units.** Length and weight follow the pack's units; a laboratory value follows `labBirimleri`, which the pack must state for every tool that reads one. The kit converts with the exact defined factors.
- **Keeping a result (migration 139).** A tool stores nothing by itself. Opened from a patient's file, it offers "keep in this patient's file" with an optional follow-up day. The browser sends the form as typed; the server works the result out again and keeps its own, as one encrypted value. The patient's file lists what was kept. The follow-up list (`takip-paneli`) is a role tool: give it to every role that has a tool whose result can be kept, and to no other.
- **A new country starts with one tile** (the patient's page) and the area's own words: 54 texts, 3 texts for the tile and one setting (who wrote and who read the tool texts).
- **Two scripts.** Where a language has two scripts and one is derived from the other, store the derived text static and mark it. Uzbekistan's rule is `scripts/uz-kiril.mjs` (country tooling only; no build runs it), and its test holds every stored text to the rule.

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

## English-speaking countries (United States, United Kingdom, Canada, Australia, New Zealand)

**Each country still needs its own pack.** Law, consent wording, units, time zones, date and clock format, identity rules, phone rules, role names, assistant names and prices differ between them, and the walls and the leak scan work per country; each also has a database of its own.

**What should be written once is the English text.** Of a pack's 802 texts, about 770 are language rather than country: the core surfaces, the application, appointments, the patient portal, the intake form's screens, the instructions to the model and most of the landing copy. (The intake **questions** are clinical content and are counted apart: two markers, however many questions.) The intended arrangement is one shared English catalogue that each country's pack takes and overrides where it differs (spelling, the consent sentence, legal wording, prices).

**That shared catalogue does not exist yet.** Today the scaffold gives each country its own full set of items to supply. Building the shared catalogue is its own job: the English text, a place for it in the kit, and a scaffold that points an English-speaking pack at it. It is recorded in `docs/OPEN-COMMITMENTS.md`.

Canada also needs French, added as a second language as above.

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

**With clinic accounts (2026-10-09, NOTYA-ULKE-KLINIK-01) the proof was again repeated only in part.** The scaffold now writes 19 files and answers **1082 items (1039 texts, 43 settings)**: 185 more (180 texts of the clinic catalogue and 5 settings: which capabilities, which allied roles, the two periods, who read the answers). Two clinic settings are written by the scaffold and are not open: a clinic's owner may not enter a permission for a doctor (`false`), and record retention is a slot (`null`). A throwaway `zz` was scaffolded in the repository, type-checked clean, and its build was refused with the list of all 1082 items (185 of them for clinic accounts), as it must be; then it was deleted and the five registration files restored. It was **not** filled, built and walked (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-KLINIK-01).

## Known gaps

- **Units**: the intake form is the first screen that reads them (height, weight and temperature are asked in the pack's units, each named by the pack). The visit note still shows no measurement in a unit.
- **Instructions to the model** are assembled inside each pack (`klinik/talimatlar.ts`); the kit has no shared builder. The template's own small builder covers one language.
- **Scaffold hints** are key paths, not reference wording.
- **Prices** are a list the pack states (plan → amount a month, or on request) and the landing layout writes with the pack's number rules. Nothing else in the kit shows money yet.
- **Two product pieces** are not in the kit and exist for no country but Türkiye: consultation and messaging, and the assistant in text and voice. (The patient portal, the intake form, the tools area and clinic accounts are in the kit since 2026-10-09: the portal without messaging, documents, payments or automatic reminders; the form's answers not given to the model; clinic accounts without billing, seats or payment.)
- **Clinic accounts: cover is read-only.** A visit belongs to the patient's own doctor by a key of the visit table, which no clinic job may alter; a covering doctor reads approved notes and the appointments and writes nothing. Whether and how a visit is written under cover is an open decision (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-KLINIK-01).
- **Clinic accounts: the settings are law, not product.** Which capabilities exist, which allied roles may read a share and how long the record is kept cannot be verified by a machine and are unverified for every country until a lawyer of that country is named in the pack.
- **Intake answers stay beside the note.** They are shown to the doctor and never given to the model that writes the note; whether and how they should be is an open decision (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-INTAKE-01b).
- **The portal's link validity and ambulance number** are settings a pack must state and that nothing can verify by machine: the first is the owner's, the second needs a local source.
- The **Uzbek** walk-through of its own wording is not parameterised; the pack-neutral one is.
