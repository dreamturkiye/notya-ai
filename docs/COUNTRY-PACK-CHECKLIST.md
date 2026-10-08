# Country pack checklist

Standard for taking Notya into any new country, adopted 2026-10-08. Each country records its answers in `docs/COUNTRY-PACK-<COUNTRY>.md`.

Structure agreed with Kaan on 2026-10-08: **one repository, walled areas, and a separate live deployment and database per country.** There is one core, so nothing needs syncing. Each country's build contains the core plus that country's pack only.

## How Notya is divided

- **Core** (visit recording, note engine, appointments, patient portal, consultation tool, clinic roles, security, billing engine) never changes per country.
- **A country pack** holds laws, authorities, state systems, clinical references, medicines, record forms, identity numbers, tools, prices and consent texts.
- **A language pack** holds every piece of text and speech; a country can have several languages and a language can serve several countries.
- **Specialties and clinic types** are mapped to each country's own list.

Where this lives in the code: `countries/<code>/` (one walled folder per country), `countries/active/` (the only door core code may use), `lib/ulke/` (the questions core code may ask). See `docs/COUNTRY-PACK-SPLIT-PLAN.md` for what has and has not moved behind the walls yet.

## Rules that stop one country leaking into another

- [ ] 1. Türkiye is a country pack like any other; nothing Türkiye-specific stays in the core.
- [ ] 2. No fallback between countries: a missing item hides the feature.
- [ ] 3. Every tool, form, reference and feature declares the countries it is valid in; new ones start off everywhere except where they were built.
- [ ] 4. The account carries its country and language, set at sign-up from that country's landing page.
- [ ] 5. Ayşe answers only from the account's country pack and says so when no national source exists.
- [ ] 6. Each country has its own deployment and database; a build contains only its own pack.
- [ ] 7. An automated leak test scans every screen, note, answer, message and PDF for another country's terms.
- [ ] 8. Türkiye is compared before and after every structural change and must match.
- [ ] 9. Sign-ups for a country stay closed until section A passes and the clinical lead signs off.

How each rule is enforced today:

| Rule | Mechanism | Where |
|---|---|---|
| 1 | Ratchet: the number of shared files with Turkish text may only go down | `npm run ulke:turkce-tavan`, `countries/turkce-tavan.json` |
| 2 | `ozellikAcik` is false for anything a pack does not list; missing text throws | `lib/ulke/ulke.ts`, `lib/ulke/metin.ts` |
| 3 | Required `ulkeler` on every tool + the pack's own route list (two locks) | `lib/doktor/doktorAraclari.ts`, `countries/<code>/araclar.ts` |
| 4 | `users.country`, `users.ui_language` (migration 128) + `app_metadata.country`; login refuses another country's account | `lib/ulke/hesapUlkesi.ts` |
| 5 | Not built yet (Ayşe is not split) | split plan, step 9 |
| 6 | Pack chosen at build time; walls checked before every build; build output checked after. A build for a country that is not the pre-split application compiles only the route files named `*.ulke.*` | `countries/active/`, `next.config.mjs` (`pageExtensions`), `scripts/ulke-duvarlari.mjs`, `scripts/ulke-derleme-kaniti.mjs` |
| 7 | Leak harness; each country declares its own terms | `lib/ulke/testing/sizintiTarayici.ts`, `countries/<code>/sizintiTerimleri.ts` |
| 8 | Tool lists snapshot; the existing test suite | `lib/doktor/doktorAraclariUlke.test.ts`, `npm test` |
| 9 | A route exists in another country only as a `*.ulke.*` file that the country's pack also lists; sign-up by invitation code | `middleware.ulke.ts`, `lib/ulke/rotaKapisi.ts` |

## A. Gates before money is spent

- [ ] A1 Data law: where data may be stored and processed, sending abroad, consent form, registration, breach deadlines.
- [ ] A2 Special data: health, children, biometric; does a voiceprint count.
- [ ] A3 Consent for recording a visit.
- [ ] A4 Whether note-writing, clinical advice or image evaluation is regulated as a medical device, and by whom.
- [ ] A5 Speech gate: listening and speaking quality per language on real clinic audio, judged by native clinicians on the finished note.
- [ ] A6 Named local clinical lead and a reviewer per specialty.
- [ ] A7 State systems a private doctor must use and whether outside software may connect.
- [ ] A8 Selling without a local company, tax, how doctors pay, price level.
- [ ] A9 Competitors, including any state-provided tool.

## B. Authorities and law register

For each entry: official local name, what it governs, source link, date checked, lawyer-confirmed or not.

- [ ] B1 Health ministry and subordinate bodies.
- [ ] B2 Doctor licensing, clinic licensing, how to check a licence.
- [ ] B3 Medicines regulator and register.
- [ ] B4 Device regulator.
- [ ] B5 Data protection regulator.
- [ ] B6 Public and private payers.
- [ ] B7 Operator of national e-health and e-prescription.
- [ ] B8 Chambers and specialty associations.
- [ ] B9 Laws on health care, patient rights, medical secrecy, personal data, biometric data, electronic signature, telemedicine, AI, consumer and subscription sales.
- [ ] B10 Medical record law: mandatory forms and fields, language and script, retention, patient's right to a copy.
- [ ] B11 Prescription law: format, language, controlled drugs, who may prescribe.
- [ ] B12 Minors and consent.
- [ ] B13 Notifiable diseases and mandatory reports.
- [ ] B14 Advertising law for medical services and health software.
- [ ] B15 Official-language requirements for businesses.

## C. Clinical knowledge pack, once per specialty and per clinic type

- [ ] C1 The country's official specialty name and its mapping to Notya's; note specialties present in one and not the other.
- [ ] C2 National protocols and standards: issuer, title, version date, language, where published, binding or not.
- [ ] C3 Reference books and handbooks in real use, confirmed by the reviewer.
- [ ] C4 Foreign guidelines accepted in practice.
- [ ] C5 National centre and association.
- [ ] C6 Medicines: registered products, local brand names, forms and strengths, dosing references, reimbursed list.
- [ ] C7 Diagnosis coding edition and language; procedure coding.
- [ ] C8 Laboratory units and reference ranges.
- [ ] C9 Growth charts, vaccination calendar, screening programmes.
- [ ] C10 Standard documents: reports, certificates, referrals, sick notes.
- [ ] C11 Local disease pattern that changes what Ayşe should think of first.
- [ ] C12 Note template per language.
- [ ] C13 Intake form per language.
- [ ] C14 Reviewer name, date, sign-off; a specialty is switched on only after this.
- [ ] C15 Owner and next review date for every source.

## D. Ayşe for the country

- [ ] D1 Locally natural name, title and background of a senior professor with 20+ years of practice in that country, decided with the clinical lead.
- [ ] D2 Manner of address, formality, patronymics or honorifics.
- [ ] D3 Sources: only section C.
- [ ] D4 The clinical answer audit rewritten by local clinicians for every specialty and clinic type, with a pass mark set before launch.
- [ ] D5 Voice: model, voice chosen by native listeners, pronunciation list for drug names and terms, reading of numbers, dates and units.
- [ ] D6 One voice agent copy per language, one brain.
- [ ] D7 Spoken-versus-screen rule kept.
- [ ] D8 Colleague features (suggestions, whisper cards, learning from revisions) checked for local content.

## E. Language pack, once per language

- [ ] E1 All screen text, none written directly in code.
- [ ] E2 Script variants.
- [ ] E3 Dates, numbers, currency, names and patronymics, addresses, phones, week start, holidays, time zone.
- [ ] E4 Clinician-approved glossary and abbreviations.
- [ ] E5 Speech recognition engine per language; mixed-language visits; second pass only on low confidence.
- [ ] E6 Doctor's choices: screen language, note language, one-click rewrite of a note in another language, Ayşe's spoken language, prescription language; one question at setup, defaults for the rest.
- [ ] E7 Patient language set per patient.
- [ ] E8 Message and email templates, with delivery tested so mail does not land in junk.
- [ ] E9 PDFs and print render the script correctly.
- [ ] E10 Sorting, search and name matching across scripts.
- [ ] E11 Native review of all patient-facing and marketing text.

## F. Tools

- [ ] F1 Every core tool and every specialty tool gets a verdict per country: Remove, Adapt, Keep, or Add.
- [ ] F2 Remove: tools tied to another country's state or payer systems.
- [ ] F3 Adapt: same purpose, local content (vaccination, coding, drug names, document formats, consent forms, risk scores calibrated by region).
- [ ] F4 Keep: universal scales and calculators after translation and a unit check.
- [ ] F5 Add: tools the country needs that others do not, confirmed by the clinical lead.
- [ ] F6 The registry records the countries each tool is valid in; the gate before adding any tool asks "core or which specialty?" and "which countries?".
- [ ] F7 A specialty's tools are switched on with that specialty's sign-off.

## G. Records, documents and identity

- [ ] G1 Mandatory record forms and fields.
- [ ] G2 Note structure doctors expect.
- [ ] G3 Prescription output; controlled drugs per law.
- [ ] G4 Certificates, referrals, sick notes.
- [ ] G5 National identity and insurance numbers: format and validation.
- [ ] G6 Signature and stamp conventions.
- [ ] G7 Retention and deletion.
- [ ] G8 Export and patient copy.

## H. State systems and outside services

- [ ] H1 Other countries' state systems switched off.
- [ ] H2 The country's own: where entry is mandatory, Notya prepares paste-ready content and the doctor enters it; nothing automated without registration.
- [ ] H3 No integration claims until one exists.
- [ ] H4 Messaging channels patients really use.
- [ ] H5 Calendar, maps, SMS, email and payment providers that work there.

## I. Privacy, consent and security

- [ ] I1 Consent text per feature and language, lawyer-reviewed: recording, AI processing, transfer abroad, portal, messaging, voice profile.
- [ ] I2 Patient notice and guardian consent.
- [ ] I3 Agreement with the clinic on data handling.
- [ ] I4 Regulator registration.
- [ ] I5 Breach procedure with local deadlines.
- [ ] I6 Where data lives and which outside providers receive it.
- [ ] I7 Features gated by law.

## J. Product settings

- [ ] J1 Feature table.
- [ ] J2 Specialties and clinic types enabled.
- [ ] J3 Staff roles and local names.
- [ ] J4 Appointment norms.
- [ ] J5 Onboarding: language question, licence field, local specialty list.
- [ ] J6 Plans, prices, tax display, invoices.
- [ ] J7 Trial and discount rules.

## K. Going to market

- [ ] K1 Landing page per language with sign-up and login.
- [ ] K2 Hidden from search until the pilot approves it.
- [ ] K3 No public demos, no integration claims.
- [ ] K4 Legal pages.
- [ ] K5 Address.
- [ ] K6 Pilot of 5 to 10 doctors across city and region.
- [ ] K7 Deck and training material.
- [ ] K8 Support: who, which language, which hours.

## L. Running it

- [ ] L1 Cost per visit, second-pass rate, speech confidence.
- [ ] L2 Feedback channel in the local language.
- [ ] L3 Content update calendar.
- [ ] L4 Company, contracts, tax registration, payment account.

## Order of work

1. Gates.
2. Split the core from Türkiye, once.
3. Research the country (B, C, G, H).
4. Tools audit.
5. Language pack and Ayşe.
6. Clinician sign-off and Ayşe's audit.
7. Pilot.
8. Launch.
