# Country pack: Uzbekistan

Answers to `docs/COUNTRY-PACK-CHECKLIST.md` for Uzbekistan. Code: `countries/uz/`.

## Status (2026-10-08, end of slice 1)

**Nothing is live.** No Uzbek deployment or database exists. No migration has been applied anywhere. Sign-up is closed (invitation only, and no invitation code has been issued). Nothing here has been merged into `main`; the Turkish product is untouched.

Three stacked branches, none merged: `feat/ulke-temeli` (PR #565, country foundation) ← `feat/uz-acilis` (PR #566, landing page, login, invitation sign-up) ← `feat/uz-muayene` (PR #567, slice 1, this section).

What slice 1 built, all of it under `/uzbek`:

| Step | Address | What it does |
|---|---|---|
| First-login question | `/uzbek/start` | Uzbek or Russian; for Uzbek, Latin or Cyrillic. Sets the interface language and the note language. Asked once. |
| Settings | `/uzbek/settings` | Interface language, note language, script. |
| Home | `/uzbek/today` | Today's visits, patient search, new patient, start a visit. |
| Patients | `/uzbek/patients`, `/patients/new`, `/patient?id=` | Create, find in either script, patient file with approved notes and drafts. |
| Visit | `/uzbek/visit` | Choose the patient → consent tick-box → record → transcript → note → rewrite in the other language → approve. |

How the visit works:

1. **Consent.** A tick-box blocks recording; the server refuses a visit without it. The sentence is in the catalogue, marked "NOT REVIEWED BY A LAWYER"; every visit is stamped with the wording's version (`uz-taslak-2026-10-08`).
2. **Recording.** In the browser. Uploaded once to the doctor's own folder of a private bucket (`muayene-sesleri`), read once by the server, then removed.
3. **Transcription.** ElevenLabs Scribe, model `scribe_v2`. First pass with no language, so it is predicted; the predicted language and its probability are stored with the visit. If the language probability is below 0.80 or the average word log-probability is below −0.36 (both are named settings in `countries/uz/klinik/index.ts`), one second pass runs with the language forced to the doctor's note language, and the transcript with the higher average word log-probability is kept. Never more than two passes. The visit records that a second pass ran (for counting cost) and whether confidence stayed low.
4. **Note.** Written by the model in the doctor's note language (Uzbek in the chosen script, or Russian), from instructions that belong to the Uzbek pack (`countries/uz/klinik/talimatlar.ts`): a senior clinician's voice, written fresh, no Turkish source, no protocol claimed, no source cited. Two templates: pediatrics and one general template for every other specialty. The call goes through the shared model gateway by task name, as the model policy requires; no model name is written on the Uzbek side.
5. **Low confidence.** If confidence stayed low, the note screen shows a plain sentence asking the doctor to check the note carefully. The note is still written.
6. **Second draft.** One click rewrites the note in the other language (Uzbek ↔ Russian) as a second draft beside the first. A second click does nothing new.
7. **Approval.** The doctor edits and approves one of the drafts; only then is it in the patient's file. An approved note cannot be changed: the saving statement itself carries "not approved yet", and a late save, a second approval and a rewrite are all refused.

**Landing page (2026-10-08, branch `feat/uz-acilis-tr-eslesme`, PR #568, base `feat/uz-muayene`, unmerged).** The landing page at `/uzbek` was rebuilt to match the Turkish doctor landing page section for section: same layout, colours, type, photographs and section order, with Uzbek text in three forms (Uzbek Latin, Uzbek Cyrillic, Russian) from `countries/uz/acilis/icerik.ts`. It reuses the Turkish page's presentational components and photographs as they are and edits no Turkish file. Section-by-section decisions and every line with English beside it: `docs/uz-landing/COPY.md`. The page describes features that are not switched on here; it must not go public until they are built or the text is cut back (`docs/OPEN-COMMITMENTS.md`, NOTYA-UZ-ACILIS-02a).

Everything else is off: tools, the voice assistant, appointments, the patient portal, colleague consultation, messaging, voice profile, image evaluation, and anything tied to Turkish state systems. None of their pages or APIs exists in an Uzbek build.

### What was tested, and how

| Check | Result | Against |
|---|---|---|
| Country, leak, route and isolation tests (`npm run test:ulke`) | pass | stand-in database, auth, storage, speech provider and model provider, all inside the test process |
| Wall check, type check | clean | the repository |
| Uzbek production build (`NOTYA_COUNTRY=uz npm run build`) | passes; the build holds the Uzbek pack and no other | this machine |
| Browser walk-through (`scripts/ulke-yuruyus/`) | passes | the Uzbek production build, a real headless browser recording a test tone, stand-in Supabase, stand-in providers loaded into the server |

**Tested only with stand-ins (mocks): the database, sign-in, storage, speech recognition and the note model.** No real provider was called at any point: no audio, transcript or note text left the machine, and no provider key was present. So these are unproven until someone runs them for real, first with synthetic audio: the request and answer format of Scribe v2 (taken from its documentation), how well Uzbek and Russian are recognised, what Scribe does with a visit that mixes the two, which script it returns Uzbek in, whether the thresholds are sensible, and the quality of the notes the instructions produce.

### Files, for whoever continues

| What | Where |
|---|---|
| Pack: data, text, screens | `countries/uz/index.ts`, `countries/uz/uygulama/` (screens, catalogue `metinler.ts`), `countries/uz/acilis/` (landing page: catalogue `icerik.ts`, compiled stylesheet `utilities.css` — recompile command in `tailwind.config.cjs`) |
| Pack: clinical half | `countries/uz/klinik/index.ts` (speech settings, consent version, templates), `branslar.ts` (specialty list), `talimatlar.ts` (instructions to the model) |
| Doors core code may use | `countries/active/index.ts` (data), `sayfalar.tsx` (screens), `klinik.ts` (clinical half, server only) |
| Core, country-neutral | `lib/ulke/` — `yol.ts` (path prefix), `uygulama/konusmaTanima.ts` (speech rule), `muayeneKaydi.ts` (visit), `notlar.ts` (note), `notModeli.ts` (the one call to the model gateway), `sinir.ts` (API boundary) |
| Routes | `app/**/*.ulke.tsx`, `app/api/ulke/**/route.ulke.ts`, `middleware.ulke.ts`, `app/not-found.mjs` |
| Migrations (none applied) | `lib/db/migrations/128`–`133` |
| Tests | `lib/ulke/*.test.ts`, `countries/uz/**/**.test.ts`; run with `npm run test:ulke` |
| Walk-through | `scripts/ulke-yuruyus/yuruyus.mjs` (its header says how to run it), `sahte-supabase.mjs`, `sahte-saglayicilar.cjs`; landing screenshots: `acilis-goruntuleri.mjs` |
| What remains | `docs/OPEN-COMMITMENTS.md`, section NOTYA-UZ-MUAYENE-01 |

## Decisions by Kaan (2026-10-08)

- Uzbekistan is the first country after Türkiye; Azerbaijan and the UAE follow.
- Uzbek is the main language and Russian the alternative; his figure is about 80% of visits in Uzbek and 20% in Russian.
- The system records the visit and recognises its language; the doctor chooses the language of the visit report; language choices, including prescription language, are offered at setup.
- Ayşe's Uzbek voice uses ElevenLabs Eleven v4 Turbo.
- A full Uzbek landing page, with login to the Uzbek version through it.
- Scope is all 30 specialties and all clinic types, with every core and specialty tool audited for the Uzbek system, Türkiye-only tools removed and Uzbek-specific tools added.
- Ayşe must be a senior professor with 20+ years of Uzbek practice.
- Nothing Turkish may appear in Uzbek Notya.
- Structure: one repository with walled areas, separate deployment and database per country, core shared.
- No separate Uzbek address: each country is a folder in the repository and a path on the main site; the Uzbek product is reached at `notya.io/uzbek`.
- Visit transcription for Uzbekistan: ElevenLabs Scribe `scribe_v2`; language predicted on the first pass and stored with its probability; one second pass with the language forced to the doctor's note language when confidence is low; never more than two passes; the second pass is recorded so cost can be counted.
- The note is written in the doctor's chosen note language; one click rewrites it in the other language as a second draft; an approved note is never silently overwritten.
- First slice of specialties: pediatrics and one general template for every other specialty; the full list stays structured but off.

## Proposals from Claude, not yet confirmed by Kaan

- Second speech pass only on low confidence.
- One question at setup, finer choices in settings.
- Patient language per patient.
- Voice profile and image evaluation off in Uzbekistan until the law is confirmed.
- All 30 specialties structured from day one but each switched on only after its local reviewer signs off.
- Sign-up by invitation until the gates pass.

Defaults chosen while building slice 1. Each is a setting or a small change; each needs Kaan, and where marked a lawyer or the clinical lead, to confirm:

| Default | Where | Who must confirm |
|---|---|---|
| **The recording is deleted as soon as it has been transcribed, in every case** (success, refusal or failure). Only the transcript and the note are kept. | `lib/ulke/uygulama/muayeneKaydi.ts` | **Kaan and a lawyer**: whether Uzbek law requires, allows or forbids keeping the audio of a visit, and for how long (checklist A3, G7). Until then nothing is kept. |
| Consent sentence beside the tick-box ("The patient or their legal representative has agreed to the conversation being recorded"), in three forms. Draft. | `countries/uz/uygulama/metinler.ts` → `muayene.riza` | A lawyer (checklist A3, I1). It covers recording only: nothing yet tells the patient that the text is processed by AI or sent abroad. |
| Low-confidence thresholds: language probability below 0.80, or average word log-probability below −0.36. Starting values, not measured. | `countries/uz/klinik/index.ts` | Kaan, after the speech test on real clinic audio (checklist A5, L1). |
| "Confidence stayed low" means: the kept transcript's words are below the threshold, or the kept transcript is the first pass and its language was below the threshold. | `lib/ulke/uygulama/konusmaTanima.ts` | Kaan |
| The patient must be chosen before a visit is recorded. | visit screen | Kaan |
| Pediatrics is preselected for a patient under 18. | visit screen | the clinical lead |
| The pediatric template is switched on without a local reviewer's sign-off (the brief asked for it in this slice). | `countries/uz/klinik/branslar.ts` | the clinical lead (checklist C14) |
| What is sent to the model: the transcript, the patient's age and sex. Never the name, phone, identity number or any id. | `lib/ulke/uygulama/notlar.ts` | A lawyer: the transcript itself is health data and goes to providers outside Uzbekistan (checklist A1, I6). |
| A second click on "rewrite" returns the existing second draft instead of making a new one. | `lib/ulke/uygulama/notlar.ts` | Kaan |
| Approving the second draft keeps the first draft beside the note (not shown after approval). | `lib/ulke/uygulama/notlar.ts`, migration 133 | Kaan: keep or delete unapproved drafts (checklist G7). |
| Daily ceiling of 200 visits per account, counted on Tashkent's day. | `countries/uz/klinik/index.ts` | Kaan |
| The browser session is stored under a key that names the country (`sb-notya-uz-auth-token`); no cookie is used. | `lib/ulke/istemciSupabase.ts` | — |

## Research notes (secondary sources, not confirmed by a lawyer)

- Personal data law ZRU-547 (2019).
- Law ZRU-1125 (26 March 2026) reportedly relaxed localisation: only biometric, genetic and telecom-subscriber data must stay in Uzbekistan; other personal data may go abroad to listed countries or under approved contract terms.
- Cabinet Resolution 415 (29 July 2026) reportedly lists 49 countries; whether Türkiye is listed is to verify.
- Leak during a transfer abroad: notify within 24 hours, details within 72 (to verify).
- Health data needs written consent, which may be electronic.
- AI amendments ZRU-1115 in force January 2026.
- Ministry of Health Order 3758 (January 2026) requires real-time entry in the state electronic record and prescription modules; coverage of private clinics is to verify.
- The state plans its own speech-to-note assistant inside its system DMED by end of 2026.
- Device rules: Cabinet Resolution 738 (24 November 2025), silent on software.
- About 107,500 doctors (January 2025) and more than 9,000 private medical organisations.
- Vaccination calendar: https://gov.uz/ru/sanepid/news/view/223776
- Ministry protocol section: https://gov.uz/uz/ssv/pages/klinik-qo-llanmalar
- ElevenLabs lists Uzbek for Eleven v4 and v4 Turbo voices; published Uzbek recognition figures are vendor claims on read speech.

## Open questions

- Language and script doctors write notes and prescriptions in.
- Clinical references for each specialty and clinic type.
- Whether private clinics must use the state record and prescription system.
- Whether a voiceprint is biometric data and whether software is a medical device.
- Price and live-agent support of Eleven v4 Turbo.
- Local name and background for Ayşe.

## What the pack holds today (`countries/uz/index.ts`)

Set by the foundation job on 2026-10-08. Items marked *to verify* come from general knowledge, not from a local source, and wait for the clinical lead or a lawyer.

| Item | Value | Note |
|---|---|---|
| Languages declared | Uzbek in Latin script (`uz-Latn`, default), Uzbek in Cyrillic script (`uz-Cyrl`), Russian (`ru`) | Kaan's decision |
| Languages switched on (public pages) | `uz-Latn`, `ru` | Login and sign-up exist in these two. The landing page is also written in `uz-Cyrl`, served only when the address asks for it (`/uzbek?dil=uz-Cyrl`, linked from its footer). |
| Languages inside the application | `uz-Latn`, `uz-Cyrl`, `ru` | The signed-in screens and the model instructions are written in all three forms, by hand. An account chooses its form at first login. |
| Time zone | `Asia/Tashkent` | |
| Currency | UZS, shown as "soʻm", no decimals | decimals *to verify* |
| Dates and numbers | `DD.MM.YYYY`, decimal comma, space as thousands separator, week starts Monday | *to verify* with the clinical lead |
| Phone | `+998` and nine digits | operator prefixes not checked, *to verify* |
| National identity number | JSHSHIR (PINFL), 14 digits, format only | check-digit rule *to verify* (checklist G5) |
| Features on | landing page, login, sign-up by invitation code, the first product slice (`cekirdekMuayene`: language question, settings, home, patients, visit to approved note) | everything else is off. The holding page still exists and redirects to the home. |
| Voice profile, image evaluation | off | until the law is confirmed (checklist A2, A4, I7) |
| Served under | `/uzbek` (the pack's `yolOnEki`, the build's `basePath`) | Kaan, 2026-10-08: no separate Uzbek address; the product is reached at `notya.io/uzbek`. Every route below is relative to it. Outside `/uzbek` the Uzbek build answers 404. |
| Paths that exist | `/`, `/login`, `/signup`, `/welcome`, `/start`, `/today`, `/settings`, `/patients`, `/patients/new`, `/patient`, `/visit`, `/api/ulke/*` | every other path of the application answers 404 |
| Tools | none | `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md` is a proposal |
| Speech recognition | ElevenLabs Scribe `scribe_v2`, thresholds 0.80 and −0.36, at most two passes | `countries/uz/klinik/index.ts`; values *to verify* on real audio |
| Note templates | `genel` (default), `pediatri` | 30 specialties are listed in `countries/uz/klinik/branslar.ts`; 29 use the general template |
| Recording consent | version `uz-taslak-2026-10-08`, not reviewed by a lawyer | stamped on every visit |
| Search engines | hidden (noindex header on every response, robots.txt disallows all, no sitemap) | until the pilot approves the page (checklist K2) |
| Spelling | Uzbek Latin text uses U+02BB (ʻ) in oʻ and gʻ and U+02BC (ʼ) for the tutuq belgisi | native reviewer to confirm what doctors expect on screen |

All Uzbek and Russian text in the pack is **machine-written** and must be read by a native speaker before anything goes public (checklist E11). That includes the application's catalogue in three forms (`countries/uz/uygulama/metinler.ts`) and the instructions to the model (`countries/uz/klinik/talimatlar.ts`), which a native-speaking clinician must review. The landing copy, with English beside every line and the Keep / Adapt / Drop decision for each section of the Turkish page, is in `docs/uz-landing/COPY.md`; screenshots are in the same folder.

## Serving under `notya.io/uzbek`: open questions before any forwarding rule is added

Kaan decided on 2026-10-08 that Uzbekistan has no address of its own: the Uzbek build is served under `/uzbek` (`yolOnEki` in the pack, `basePath` in the build). The Uzbek build is ready for that. **The Turkish site does not forward `/uzbek` to it, and no rule for that has been added to any file.** Adding the rule changes how the Turkish site answers one path, so it is a change to the Turkish product and needs Kaan's go on its own.

The rule that would be needed, as text only (written for `next.config.mjs`, returned for the Türkiye build only; **not tested**, because no Türkiye build was made with it):

```js
async rewrites() {
  return { beforeFiles: [
    { source: '/uzbek', destination: 'https://<uzbek-deployment-host>/uzbek' },
    { source: '/uzbek/:path*', destination: 'https://<uzbek-deployment-host>/uzbek/:path*' },
  ] }
}
```

It must not go into `vercel.json`: that file is shared by every deployment, so the Uzbek deployment would forward to itself.

To settle before the rule is ever added:

| # | Question | Why it matters |
|---|---|---|
| 1 | **Turkish middleware headers.** `middleware.ts` of the Turkish site runs on every path, `/uzbek/*` included, before the request is forwarded, and sets its own headers on the answer (content security policy, permissions policy, CORS). Do they sit correctly on top of the Uzbek build's own headers? | The Uzbek screens need the microphone, the Uzbek Supabase project (`*.supabase.co`) and Google Fonts. The Turkish policy allows all three today; a later tightening of the Turkish policy would silently break the Uzbek product. Check on a preview, in a browser, with the console open. |
| 2 | **Turkish service worker.** `public/sw.js` of the Turkish site is registered with scope `/`. In a browser that has visited the Turkish site it also intercepts `/uzbek/*` page requests and stores copies of them in the Turkish cache (`/uzbek/api/*` is skipped). | A Turkish doctor's browser would keep copies of Uzbek pages; an Uzbek doctor who never opens the Turkish site is not affected. Decide: narrow the worker's scope, or make it ignore `/uzbek`. That is an edit to a Turkish file. |
| 3 | **Shared browser storage.** Under one address the two products share `localStorage`. The Uzbek session is stored under its own key (`sb-notya-uz-auth-token`) and no cookie is used, so the sessions do not collide — but script on either site can read the other's session. | Acceptable only while both are ours and neither loads third-party script that should not see a session. The Turkish site loads the Facebook SDK on one screen (WhatsApp connection). Decide whether that is acceptable. |
| 4 | **Robots file.** A robots file only counts at the root of an address, so `notya.io/robots.txt` (the Turkish site's) governs `/uzbek` too. The Uzbek build's own file at `/uzbek/robots.txt` is ignored by search engines. | The Uzbek pages still say "do not index" in a header and in the page itself, which search engines honour. If the Turkish robots file ever disallows `/uzbek`, engines would stop reading those "do not index" marks; leave `/uzbek` out of it. |
| 5 | **The path must stay free on the Turkish site.** No Turkish page or API may ever be created under `/uzbek`. | It would be shadowed by the forwarding rule. |
| 6 | **Uzbek deployment's own address.** The Uzbek build answers 404 outside `/uzbek`, and under `/uzbek` on its own address it is the same product. | Decide whether the deployment's own address should be closed to the public (so that only `notya.io/uzbek` is used). A deployment setting. |

## Before the Uzbek deployment is created

These are settings and decisions, not code, and none was touched by the foundation job:

1. A separate Vercel project and a separate Supabase project for Uzbekistan (region to follow checklist A1).
2. Build setting `NOTYA_COUNTRY=uz`. The build refuses any value that has no folder under `countries/`.
3. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` of the Uzbek project. The Uzbek login refuses to work without them; it never falls back to another project.
4. Public sign-up **disabled** in that Supabase project's Auth settings. Invitation sign-up creates accounts on the server; with public sign-up left on, the invitation step could be bypassed by calling Supabase directly.
5. All migrations applied to the Uzbek database, including `128_hesap_ulke_dil.sql`, `129_davet_kodlari.sql`, `130_hekim_dil_tercihleri.sql`, `131_hasta_ulke_bilgisi.sql`, `132_muayene_dil_kaydi.sql` (also creates the private bucket `muayene-sesleri` and its upload policy) and `133_not_dil_kaydi.sql`. 130–133 add new tables only.
6. `NOTYA_ILETISIM_EPOSTA`: the address that receives "request a price" messages. Without it the request form is not shown. Nothing is stored: the form opens the visitor's own mail app.
7. A consent and privacy text on the sign-up form (checklist I1) **before** the first invitation code is issued (`node scripts/ulke-davet-kodu.mjs --ulke uz`).
8. Server settings for the visit: `ENCRYPTION_MASTER_KEY` (patient data cipher; its own key, never Türkiye's), `ELEVENLABS_API_KEY` (speech; without it the visit screen says speech recognition is not configured), `OPENROUTER_API_KEY` (the note model; without it no note is written). Before any of them is set with a real key: the lawyer's answer on sending health data abroad (checklist A1).
9. The first real provider call must use synthetic audio, never a patient's.
10. The cron jobs in `vercel.json` are shared by every deployment; in Uzbekistan they answer 404 (their routes are not on the country's list) until each is split.


## Assistant names (owner's list, 2026-10-08)

Kaan supplied one assistant name per specialty and clinic role: 30 doctor specialties, 5 clinic doctors, 5 clinic allied roles. They are stored exactly as given in `countries/uz/klinik/asistanAdlari.ts` and are **not yet used** by any screen or model instruction.

Open before they are used:
- A native reader's check of the spellings. To look at: `Holmatov`/`Holmatova` (Uzbek Latin usually writes `Xolmatov`), `Shohruh` (`Shohrux`), `Ulugbek` (`Ulugʻbek`), `Ismailov`/`Ismailova` (`Ismoilov`), and the title `Fizyoterapevt` (`Fizioterapevt`). These are Claude's observations, not corrections; nothing was changed.
- Cyrillic and Russian forms of every name.
- Each assistant's background (the owner asked for a senior clinician with 20+ years of practice in Uzbekistan) and which name the landing page shows.
- Key check (script, 2026-10-08): all 30 doctor keys match the product's specialty list after one correction. The owner's table wrote `kadin-dogum`; the product's key is `kadin-hastaliklari-dogum`, and that is what is stored. The 10 clinic keys are not in the doctor specialist catalogue and were not cross-checked against the clinic lists.
