# Australian build — sources (AU-BETA-01, 2026-10-22)

Every external fact used by the Australian build's new structure, with the page, what was taken from it and the date it was retrieved
(all 2026-10-22, by a machine; nobody in Australia has checked them). **Initial compliance draft – external legal review later. Initial clinical draft – external clinician review later.**
Sources earlier jobs cited in code comments (legislation.gov.au compilations for the Medicare, GST, AIR, My Health Records, PBS-prescription and Privacy Act checklists; Kidney Health Australia, PCFA, ACSQHC, RCPA, PathWest, ANZSPED for tool settings) are cited beside the code they support, in `countries/au/araclar/` and `countries/au/ayarlar.ts`; they were **not** re-fetched in this job.

## Fetched and used

| What | URL | Taken from it | Where used |
|---|---|---|---|
| ABN check | https://abr.business.gov.au/Help/AbnFormat | subtract 1 from the first digit; weights 10,1,3,5,7,9,11,13,15,17,19; sum mod 89 = 0; example 51 824 753 556 | `countries/au/kimlik.ts` `abnGecerli` + tests |
| AHPRA number format | https://hl7.org.au/fhir/4.1.0-ballot/StructureDefinition-au-ahpraregistrationnumber.html | "3 uppercase letters, followed by 10 digits", `^[A-Z]{3}[0-9]{10}$`, example MED0000932846 | `ahpraNoBicimi` (format only; the AHPRA register is not queried) |
| Medicare provider number format | https://developer.digitalhealth.gov.au/namespaces/id/medicare-provider-number/index.html | 8 characters: six digits, location character (not I, O, S, Z, 0), check character from Y X W T L K J H F B A. **The page does not give the check-character algorithm**, so the practice profile validates format only | `providerNoBicimi` |
| Postcode ranges | https://en.wikipedia.org/wiki/Postcodes_in_Australia | ranges per state/territory (a public reference, not Australia Post's table) | `postaKoduEyalette`, used only for a warning |
| APP 5 matters | https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information | the APP 5.2 list (identity/contact, circumstances, law, purposes, consequences, disclosure to others, access/correction and complaint information, overseas recipients and countries) | collection notice, `countries/au/uzanti/gizlilik.ts` |
| APP 12 timing | https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-12-app-12-access-to-personal-information | organisations: "a reasonable period … should not exceed 30 calendar days" (para 12.67). The APP 13 chapter was **not** read; the same 30-day target is applied to corrections as a product choice | `lib/ulke/gizlilik/hesap.ts` `YANIT_GUNU` |
| NDB scheme | https://www.oaic.gov.au/privacy/notifiable-data-breaches and /about-the-notifiable-data-breaches-scheme | trigger "likely to result in serious harm"; notify individuals and the OAIC; OAIC online form. **Neither page stated the assessment period, so none is restated** | `/data-breach`, `INCIDENT-RESPONSE.md` |
| PBS search pattern | https://www.pbs.gov.au/browse/medicine-listing | the page's own medicine links use `https://www.pbs.gov.au/search?term=<name>&analyse=false&search-type=medicines` | PBS lookup |
| PBS data | https://data.pbs.gov.au/ | states no licence; embargo data needs a login. **Not used.** | — |
| NIP schedule page | https://www.health.gov.au/topics/immunisation/when-to-get-vaccinated/national-immunisation-program-schedule | exists; its fetched text was garbled and carried only the date "1 July 2020". **No schedule content copied.** | link only |
| Australian Immunisation Handbook | https://immunisationhandbook.health.gov.au/ | ATAGI recommendations approved by NHMRC; publisher Department of Health and Aged Care; includes the National Immunisation Catch-up Calculator | link only |
| AIR | https://www.health.gov.au/topics/immunisation/immunisation-information-for-health-professionals/using-the-australian-immunisation-register | "a national database that tracks vaccinations" | link only (no submission) |
| RACGP Red Book | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/red-book | 10th edition, web document | link only |
| RCH CPG | https://www.rch.org.au/clinicalguide/ | publisher RCH Melbourne; guidelines under /clinicalguide/guideline_index/ | link only |
| My Health Record | https://www.digitalhealth.gov.au/initiatives-and-programs/my-health-record | what it is; the page says nothing on software conformance | stub card |
| ATO GST and health | https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/your-industry/gst-and-health | last updated 12 June 2024; conditions apply to GST-free medical services; **the conditions page was not read** | wording of the GST-free box (no advice) |

## Tried and NOT reachable (nothing taken from them)

- RACGP Red Book "view-all" URL (client error); the Red Book page above worked.
- https://www.pbs.gov.au/pbs/search?term=… (client error; the `/search?…` pattern above is the one the PBS site links to itself).
- Services Australia Medicare provider-number page (blocked by robots).
- **docs.stripe.com (Checkout Sessions, Refunds, Webhooks, Keys) and docs.tyro.com were NOT fetched: the permission request was not answered in time.** For that reason no Stripe or Tyro adapter, webhook verifier or Connect OAuth flow exists in this build (see `docs/OPEN-COMMITMENTS.md`, AU-BETA-01).

## What the code really does (checked in the repository, used for the notice and policy)

- Application-level encryption AES-256-GCM: `lib/security/encryption.ts` (key from the environment; not every column is encrypted).
- Application servers: `vercel.json` `regions: ["fra1"]` (Frankfurt). Database: the Australian Supabase project is recorded in OPEN-COMMITMENTS as Sydney — **not re-verified here**.
- Speech-to-text: `lib/ulke/uygulama/konusmaTanima.ts` → `https://api.elevenlabs.io/v1/speech-to-text`. Text-to-speech: `sesSentez.ts` → ElevenLabs.
- Language model: `lib/ai/cagir.ts` → `lib/ai/saglayici.ts` → OpenRouter (`openrouter.ai/api/v1`).

## Clinical content shown by the build

New in this job: **none** — no dose, threshold, growth flag or schedule number was added. The reference sections carry links and a "Source:" line. Existing tools carry their own sources in code (`kaynak`, `lisans`), many are switched off pending clinician sign-off (`countries/au/ayarlar.ts` `kapali`), and the growth-chart tool uses the WHO tables the kit already holds. Whether every number in every existing AU tool traces to a fetched source was **not re-audited** in this job; the earlier audits are `docs/araclar-denetim/AU.md` and `docs/COUNTRY-AUDIT-AUSTRALIA.md`.
