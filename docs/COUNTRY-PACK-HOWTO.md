# How to start a new country

Written 2026-10-09 (NOTYA-ULKE-SABLON-01). The standard a country must meet is `docs/COUNTRY-PACK-CHECKLIST.md`; this page is the practical side: what a country is made of, the one command that starts it, what has to be supplied and in which order, and what a successful build does **not** prove.

Uzbekistan (`countries/uz/`, `docs/COUNTRY-PACK-UZBEKISTAN.md`) is the worked example: three language forms, forty roles, a landing page.

## The short version

1. `node scripts/ulke-yeni.mjs <code> --dil <language> --yol </path>` creates the country: a folder, its registration, and its own record with every gate unticked.
2. The country cannot be built yet. `node scripts/ulke-paket-denetimi.mjs --ulke <code>` prints every item still to supply: **665 for a one-language country (633 texts, 32 settings)**.
3. Supply them (sections below). Nothing falls back to another country's text or to a default.
4. `NOTYA_COUNTRY=<code> npm run build:ulke` builds it; the walk-through walks it.
5. It is still **hidden from search and invitation-only**, and stays so until the gates of the checklist pass and the owner opens it. Building proves the pack is complete, not that it is right.

No step touches Türkiye, any other country, a database, a deployment or a setting.

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

- `countries/<code>/`, 14 files, complete in shape, with every text as `eksik('hint')` and every undecided setting as `eksikAyar('hint')`;
- the registration: `lib/ulke/tipler.ts` (the code list, and the language if it is new), the three doors `countries/active/{index,klinik,arayuz}.ts`, and `countries/tumu.ts`;
- `docs/COUNTRY-PACK-<CODE>.md`: the checklist's 113 gates, all unticked.

It refuses to run twice for the same code and changes nothing when it refuses.

Two of the files it edits are read by Türkiye's build (`lib/ulke/tipler.ts`: one more entry in a list and in a type; `countries/active/*.ts`: one more branch that a Turkish build never takes). The scaffold's test checks that every existing branch is byte-for-byte what it was.

## What to supply, in the order to work through it

Counts are for one language form. A second language or script repeats every text row.

| # | What | File | Items | Who |
|---|---|---|---|---|
| 1 | **Settings**: currency, default time zone and every zone of the country, locale, date pattern, separators, first day of the week, 12 or 24 hour clock, units, phone prefix and rule, identity number or none, second name field or not, patient languages, appointment norms, guardian age | `index.ts`, `ayarlar.ts`, `derleme.mjs` | 18 settings, 11 short texts | product, with the local lead; guardian age and identity rule with a lawyer |
| 2 | **Roles**: which exist, of which kind, and their official local names | `klinik/roller.ts` | 1 list (Uzbekistan: 40 roles) | local clinical lead |
| 3 | **Note templates**: each role's own fields, the guardian field, section headings | `klinik/notSablonlari.ts` | 5 lists (Uzbekistan: about 170 fields) | a reviewer per specialty |
| 4 | **Assistant names**: one per role | `klinik/asistanlar.ts` | 1 function (Uzbekistan: 40 names) | the owner |
| 5 | **Speech**: model, language codes, three thresholds, daily limit, consent version | `klinik/index.ts` | 6 settings, 2 texts | engineering; thresholds from real clinic audio |
| 6 | **Instructions to the model** for a visit note, written fresh in the note's language | `klinik/talimatlar.ts` | 14 texts (one of them several paragraphs) | a clinician who practises in that language |
| 7 | **Core surfaces**: login, sign-up, holding page, error pages | `metinler.ts` | 48 texts | native writer |
| 8 | **Application**: first login, settings, home, patients, visit, note | `uygulama/metinler.ts` | 144 texts | native writer; the consent sentence with a lawyer |
| 9 | **Appointments**: working pattern, calendar, booking, reminder | `uygulama/randevuMetinleri.ts` | 113 texts | native writer |
| 10 | **Landing page**: copy, 12 section anchors, language names, fonts, word mark; and the **price list** of its price section (what each plan costs a month, or "on request": data, never a number in the copy) | `acilis/icerik.ts` | 298 texts, 1 setting | marketing, native review; prices: the owner |
| 11 | **Leak list**: what marks content as this country's | `sizintiTerimleri.ts` | 2 entries to start, growing | engineering |
| 12 | Brand word mark | `arayuz.ts` | 1 text | the owner |

Rows 2 to 4 count as one item each for the build and are the largest pieces of real work: a list of roles is one marker and forty decisions.

Some keys are required only under a condition and are written as comments in the template: the time-zone label (if the country has several zones), the second-name label, the identity-number label. The pack check asks for each exactly when the setting that needs it is on.

**Hints are key paths, not reference wording.** Today a hint reads `application: kabuk.bugun`. The meaning of each key is in the type files (`lib/ulke/arayuz/metinTipleri.ts`, `acilisTipleri.ts`) and in the Uzbek pack. An English reference wording per key does not exist yet (see "English-speaking countries").

## What is shared and never supplied

Screens, layout and look; the route list; patient isolation; the rule that an approved note is never overwritten; the note contract with the model (`s`, `o`, `a`, `p` and `fields`); the speech engine and the model gateway; appointment logic and the no-double-booking rule; sign-up by invitation code; the walls between countries; the tests.

Off for every new country until built and reviewed for it: tools, the assistant in text and voice, the patient portal, intake forms, consultation and messaging, clinic accounts, the voice profile, image evaluation.

## How one database keeps countries apart

Every country shares the database Türkiye uses. A new country needs **no migration**: the country tables exist once (after `docs/COUNTRY-PACK-DB-ROLLOUT.md` has been carried out, which waits on the owner) and a country is a value in a column.

- Every country table has a `ulke` column, not null, with no default.
- Every read and write goes through one door (`lib/ulke/uygulama/tablolar.ts`), which stamps and filters by the build's country. Code that reaches a country table any other way fails a test.
- The database repeats the rule on its own: row-level security requires the row's country to equal the country in the signed-in session, and foreign keys carry the country, so a row cannot point across countries.
- An account belongs to one country, set once at sign-up and locked by a trigger.
- Recordings live under `<country>/<account>/` in storage.
- Patient isolation between doctors is unchanged and sits underneath all of this.

`lib/ulke/ulkeVeritabani.paket.test.ts` runs these rules once per country folder, so a new country is held to them the day it exists.

**One open point that affects every country**: the login pool is shared with Türkiye, and the live Turkish site does not yet check an account's country. Until that check is live there, no invitation code is issued for any country (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-SABLON-01b).

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
npm run test:ulke                                        # every pack: walls, leak scan, shared-database rules, completeness
NOTYA_COUNTRY=<code> npm run build:ulke                  # pack scan + walls, the build, then the build proof
```

- `build:ulke` is the build command of a country deployment. A bare `next build` for a country is refused, so the build proof cannot be skipped.
- A build with no country set is Türkiye's and runs exactly what it runs on `main`.
- The pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`, run instructions at its top) walks any country in a real browser against the stand-ins: landing, login, first-login questions as far as the pack has any, home, settings, new patient, visit to approved note, appointment, a second account. It reads what to expect from the pack itself.
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

**Each country still needs its own pack.** Law, consent wording, units, time zones, date and clock format, identity rules, phone rules, role names, assistant names and prices differ between them, and the walls, the leak scan and the shared database all work per country.

**What should be written once is the English text.** Of a pack's 633 texts, about 601 are language rather than country: the core surfaces, the application, appointments, the instructions to the model and most of the landing copy. The intended arrangement is one shared English catalogue that each country's pack takes and overrides where it differs (spelling, the consent sentence, legal wording, prices).

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

Counts in this table are those of that run. Since NOTYA-UZ-FIYAT-UNVAN-01 (2026-10-09) the landing page has a price section with a price list: 36 more texts and one more setting, so the scaffold now answers 665 items (633 texts, 32 settings).

From scaffold to a passing walk-through took about 16 minutes of machine time, two production builds included. That measures the mechanism only: supplying real, reviewed content is the work, and it is counted in the table of items above.

## Known gaps

- **Units** are a setting every pack states and the pack check validates, but no shared screen shows a measurement yet, so nothing reads them.
- **Instructions to the model** are assembled inside each pack (`klinik/talimatlar.ts`); the kit has no shared builder. The template's own small builder covers one language.
- **Scaffold hints** are key paths, not reference wording.
- **Prices** are a list the pack states (plan → amount a month, or on request) and the landing layout writes with the pack's number rules. Nothing else in the kit shows money yet.
- **Six product pieces** are not in the kit and exist for no country but Türkiye: patient portal, intake forms, tools, consultation and messaging, the assistant in text and voice, clinic accounts.
- The **Uzbek** walk-through of its own wording is not parameterised; the pack-neutral one is.
