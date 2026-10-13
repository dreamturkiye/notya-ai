# Split plan: moving the product behind the country walls

Written 2026-10-08. The ordered list of later jobs that move Notya from "one Turkish application" to "a core plus country packs" (`docs/COUNTRY-PACK-CHECKLIST.md`, order of work, step 2: "split the core from Türkiye, once"). Smallest safe steps first; each numbered job is meant to be **one** Claude Code job with one brief. Where things are today: `docs/COUNTRY-PACK-TR-INVENTORY.md`.

Nothing here starts without Kaan's go, one job at a time (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-01c).

## Where we are

Done by the foundation job (2026-10-08):

- A build serves one country (`NOTYA_COUNTRY`, default `tr`); the pack is chosen at build time; walls are checked before every build and the output after it.
- `countries/tr` and `countries/uz` exist with the same shape. Türkiye's pack opens the whole existing application (`bolunmemisUygulama`); Uzbekistan's opens only what has been built for it.
- A build for a country that is not Türkiye takes **only files named `*.ulke.tsx` / `*.ulke.ts` as routes** (`pageExtensions` in `next.config.mjs`), and its middleware (`middleware.ulke.ts`) serves only the paths its pack lists. One exception forced by the framework: the root not-found page of such a build is `app/not-found.mjs`, because Next 14.2 builds that page only from a file with a single extension; tests allow no second `.mjs` route file. The Turkish route files are not compiled into that build at all, and the `*.ulke.*` files are not routes in a Türkiye build. This is what keeps the 1,687 Turkish files away from another country while they are still unsplit — and what lets Türkiye's own root files (`app/layout.tsx`, `app/page.tsx`, `middleware.ts`, error pages) stay byte-for-byte as they were.
- Accounts carry a country; tools carry their countries; a translation mechanism, a leak harness and a ratchet exist.

Not done: the application itself. **1,687 of 2,067** shipped source files still carry Turkish text and nearly all Türkiye-specific logic is still in shared code. Each job below takes one surface, moves its Türkiye-specific half into `countries/tr`, and leaves a core half that another country can fill.

## Rules for every job in this plan

1. **Türkiye first, and unchanged.** The job's first commit captures what Türkiye shows today for the surface (rendered pages, API answers, generated text) as a test; the last commit shows it is identical. No brief may ask for a Turkish behaviour change in the same job.
2. **Lower the ratchet.** The job ends with `npm run ulke:turkce-tavan -- --yaz`; the ceiling in `countries/turkce-tavan.json` must go down by about the job's file count. If it does not, the text was moved sideways, not behind the wall.
3. **No country codes in core.** Core asks the pack (`ozellikAcik`, `ulkePaketi`, `yuzeyMetinleri`). The wall check fails the build otherwise.
4. **Turkish stays the source.** Keys are declared in `lib/ulke/tipler.ts`; the Turkish text goes to `countries/tr`; another language is written against the same keys by a person who reads it, never by copying.
5. **A surface opens in another country only when** its text exists in every switched-on language of that country, a native clinician has read it, the leak test covers it, and — in the same pull request — its route gets a `*.ulke.*` file (usually one line re-exporting the split screen) and its path is added to that country's list. Two deliberate steps; `find app -name '*.ulke.*'` always answers "what exists outside Türkiye?".
6. **Every API route opened to another country** authenticates through `doktorOturum` / `pratikOturum` (they check the account's country) and answers with codes, not Turkish sentences.
7. **One job, one surface, one pull request.** A job that finds it must touch a second surface stops and records it in `docs/OPEN-COMMITMENTS.md`.

## Phase 1 — small, unblocks everything else

| # | Job | Files | What moves | Türkiye proven unchanged by | Unlocks |
|---|---|---:|---|---|---|
| 1 | **Database address out of the code** | 8 | The Turkish Supabase URL and public key are literals in the five `app/giris/*` pages, `app/kayit`, `app/davet/personel/[token]` and `lib/doktor/clientAuth.ts`. Read them from the deployment's settings only; fail closed when missing. | Login, sign-up and invite acceptance tested against the same project through the settings. Needs the two settings present in the Turkish deployment **before** merge (they are, per `.env.example`; verify in Vercel). | A second deployment can never talk to the Turkish database by accident. |
| 2 | **Countries on the clinic tool registry** | 3 + 33 guards | `lib/klinik/klinikAraclari.ts` gets the same required `ulkeler` field and pack list as the doctor registry. | Snapshot of the clinic tool list per clinic type, as done for doctor tools. | Clinic tools follow rule 3 of the checklist. |
| 3 | **One root shell, one login form** | 12 | Today there are two of each: the pre-split ones (`app/layout.tsx`, `not-found`, `error`, `global-error`, the five `app/giris/*` pages) and the core ones other countries use (`app/*.ulke.tsx`, `components/ulke/`). Move the Turkish text to `countries/tr` and put Türkiye on the core ones. `public/manifest.json` and `sw.js` per country. | Rendered HTML of each page before and after. | No second implementation of the shell or of login. |
| 4 | **One date, number and time formatter** | 309 + 86 | A helper in `lib/ulke/` that formats with the pack's locale and time zone; a codemod replaces `toLocale*('tr-TR')` and `timeZone: 'Europe/Istanbul'` at the call sites. No text moves. | Property test: for a wide sample of dates and numbers the helper equals the old call, in the Turkish build. Largest file count in the plan but purely mechanical; may be split in two by folder. | Screens stop printing Turkish dates in another country. |
| 5 | **Server messages as codes** | 6 helpers, then by tree | `OTURUM_YOK` and the other shared sentences in `lib/doktor/serverAuth.ts`, `pratikOturum.ts`, `hastaSahipligi.ts` become codes with text from the pack. Route trees follow inside the job that splits their surface (jobs 9–15), not here. | Same status and same sentence for every existing route test. | The first shared API a new country calls does not answer in Turkish. |

## Phase 2 — the front door

| # | Job | Files | What moves | Unlocks |
|---|---|---:|---|---|
| 6 | **Sign-up, onboarding, consent** | 9 | `app/kayit`, `app/onboarding`, `app/davet`: text and the KVKK consent to `countries/tr`; onboarding asks the language question (checklist E6, J5); licence field and specialty list come from the pack. | Uzbek invitation sign-up can continue into a real onboarding instead of the holding page. Needs checklist I1 (consent text) for Uzbekistan. |
| 7 | **Landing pages and prices** | 19 | `components/doktor-landing`, `components/klinik-landing`, `app/doktor`, `app/klinik`, `app/home`, `app/kvkk`: content to `countries/tr`; the root page asks the pack (as the Uzbek landing already does). | Türkiye's landing is pack content like Uzbekistan's. |
| 8 | **Specialty and clinic-type list per country** | ~50 | `SpecialtyKey` leaves the Turkish-references file; names and aliases (`lib/doktor/specialties.ts`, `bransAdlari.ts`, `BRANS_ETIKETLERI`) move to `countries/tr`; each pack maps its official specialty names to the keys and says which are switched on (checklist C1, J2). | Sign-up in another country can offer that country's specialties; "all 30 structured, each switched on after sign-off". |

## Phase 3 — the visit (the reason the product exists)

| # | Job | Files | What moves | Notes |
|---|---|---:|---|---|
| 9 | **Recording and the note engine** | ~40 | `lib/transcription`, `lib/doktor/soap*.ts`, `lib/ai/noteGenerator.ts`, `app/api/sessions`, `app/api/notes`: recognition language per visit, note language chosen by the doctor, note templates per language (checklist C12, E5, E6). | Cannot open in Uzbekistan before the speech gate (A5). Second pass only on low confidence. |
| 10 | **Ayşe: persona, sources, rules** | 65 + 15 | `lib/asistan` persona and references to `countries/tr`; she answers only from the active pack's sources and says so when there is none (checklist rule 5, D1–D4). | Needs the local name and background (D1) and the clinical lead. |
| 11 | **Voice** | ~25 | `lib/ses`, voice agents, wake words and confirmations per language; one agent copy per language, one brain (D5–D7). | After job 10. Confirm price and live-agent support of the chosen voice first. |
| 12 | **Doctor screens** | 30 + 70 + 89 | `app/dashboard/doktor`, `components/doktor`, `lib/doktor`: text through the mechanism. Three jobs by folder. | Largest translation volume for a doctor; glossary (E4) must exist first. |
| 13 | **Doctor API tree** | 175 | `app/api/doktor`: answers as codes (continues job 5), state-system routes marked Türkiye-only. Two or three jobs by sub-tree. | Route list of the country grows route by route (rule 6). |

## Phase 4 — the practice around the visit

| # | Job | Files | What moves |
|---|---|---:|---|
| 14 | **Appointments and messages** | 37 + crons | `lib/randevu`, `lib/iletisim`: templates per language, holidays, channels that patients really use (H4), cron jobs per country (`vercel.json` is one list today). |
| 15 | **Patient portal and intake** | 99 + 10 | `app/portal`, `lib/portal`, `app/intake`, `lib/intake`: patient language per patient (E7), every sentence a patient reads, native review (E11). |
| 16 | **Documents and PDFs** | ~20 | Reports, epikriz, vaccination card, prescriptions: headings, mandatory fields, identity number, fonts for each script (G1–G8, E9). |
| 17 | **Consultation tool** | ~15 | `lib/doktor/konsultasyon*.ts`, `app/konsultan`: e-mail templates and the consultant page per language. |

## Phase 5 — clinical content, one specialty at a time

| # | Job | Files | What moves |
|---|---|---:|---|
| 18 | **State systems behind the Turkish wall** | 13 + tools | `lib/enabiz`, `lib/sgk`, `lib/medula`, `lib/nvi`, `lib/seansPaketi`, `extensions/mbys-yardimci`, `data/sgk-ilaclar.json` move into `countries/tr` whole (checklist H1). |
| 19 | **Tools, by verdict** | 145 | Per `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md` once confirmed: **Keep** tools get their text through the mechanism (about 96, in batches by specialty); **Adapt** tools get a pack-supplied content slot (34); **Remove** tools move into `countries/tr` (14). |
| 20 | **Vaccination, growth, screening, medicines, coding** | 22 + ~15 | `lib/asi`, `lib/clinical`, drug search, ICD titles: Turkish content to `countries/tr`, a slot per country (C6, C7, C9). |
| 21 | **Specialty chapters** | 600 in 40 folders | `specialties/<slug>/`: prompts, engines and chapter UI. **One job per specialty**, in the order the clinical lead signs specialties off (C14). Largest: kadın-doğum 66, dermatoloji 60, dahiliye 50, göz 31. |
| 22 | **Clinic types** | ~60 | `lib/klinik`, `app/klinik-tools`, `app/dashboard/klinik`, the 10 clinic folders in `specialties/`: law notes and references per country. |

## Phase 6 — closing the split

| # | Job | Files | What moves |
|---|---|---:|---|
| 23 | **Mali and Avukat verticals** | 53 | Türkiye-only by nature (Turkish tax and court practice). Move behind a Türkiye feature as they are; no translation. |
| 24 | **Payment and plans** | ~10 | Payment provider, plans, tax display and invoices per country (J6, H5). |
| 25 | **Static files and settings per country** | `public/`, config | The 87 static pages and other files in `public/` served to every country today; `.env.example`; CORS list; security policy list of outside providers (I6). |
| 26 | **Retire the "whole application" switch** | few | When no surface depends on `bolunmemisUygulama`, Türkiye gets a route list like every other country, the `*.ulke.*` files and `app/not-found.mjs` take the plain names back, `pageExtensions` goes, and the switch is deleted. Checklist rule 1 is then true. |

## Order and dependencies

- Jobs 1–5 are independent of any country research and can start now.
- Jobs 6–8 need nothing from Uzbekistan to do the Turkish half; the Uzbek half waits for checklist sections A and B.
- Phase 3 for Uzbekistan waits for the speech gate (A5), the clinical lead (A6) and Ayşe's local identity (D1). The Turkish half does not wait.
- Phase 5 follows the clinical lead's sign-off order, specialty by specialty.

## What "done" looks like

`npm run ulke:turkce-tavan` reports a small number that is all comments-turned-strings and test fixtures; `bolunmemisUygulama` no longer exists; a build with `NOTYA_COUNTRY=uz` contains no file from `countries/tr` and no Turkish sentence, and serves a complete product; the Turkish build is byte-for-byte what a Turkish doctor uses today.
