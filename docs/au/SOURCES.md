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
- Tyro: the OpenAPI file (`/_bundle/api-explorer/pay-online/0.9/index.yaml`) came back as binary and the per-endpoint `.md` pages answered a client error, so the exact Tyro request/response schemas for refunds and Pay Requests were NOT read (see "Payments (AU-BETA-02)" below).

## Payments (AU-BETA-02) — fetched with the WebFetch tool, 2026-10-22

| What | URL | Taken from it | Where used |
|---|---|---|---|
| Stripe restricted keys | https://docs.stripe.com/keys/restricted-api-keys | RAK starts `rk_live_`/`rk_test_`; permissions None/Read/Write per resource; Write implies Read; a call without permission returns an invalid-request error that explains what to add. The page's own examples: "PaymentIntent.create → Payment Intents: Write". It does NOT list every resource name, so the key instructions on the billing screen say "Write on Checkout Sessions, Payment Intents, Refunds; Read on Charges" and point to the request log — **unverified against a real key** | `stripe.ts`, `countries/au/uzanti/fatura.ts` (izinler) |
| Stripe Create a Checkout Session | https://docs.stripe.com/api/checkout/sessions/create | `mode=payment`, `line_items[].price_data`/`quantity`, `success_url`, `cancel_url`, `client_reference_id`, `metadata`, `payment_intent_data`; response `id`, `url`, `payment_status`; hosted page is the default `ui_mode` | `stripe.ts baslat` |
| Stripe Create a refund | https://docs.stripe.com/api/refunds/create | `payment_intent` or `charge`, `amount` (smallest unit, up to the unrefunded amount), `metadata`, `reason`; errors on over-refund | `stripe.ts iade` |
| Stripe webhooks | https://docs.stripe.com/webhooks | `Stripe-Signature` header, RAW body required, signing secret `whsec_…` per endpoint, official library `constructEvent`, 5-minute default tolerance (0 disables the check), track event ids to drop duplicates, return 2xx quickly, events may arrive out of order | `stripe.ts stripeOlayiDogrula`, `webhook.ts` |
| Stripe SDK | npm `stripe` 23.0.0 (`npm view stripe version`, 2026-10-22) | `Stripe.webhooks.constructEvent`, `generateTestHeaderString`, `createFetchHttpClient`, `paymentIntents.list` auto-pagination | `package.json` |
| Tyro Pay Online overview | https://docs.connect.tyro.com/app/apis/pay-online/ and https://docs.connect.tyro.com/api-explorer/pay-online/0.9 | endpoint list (`/pay/requests`, `/pay/refunds`, `/pay/methods`); production base `https://api.tyro.com/connect`; JWT via OpenID Connect, discovery `https://auth.connect.tyro.com/.well-known/openid-configuration`; refunds only for successful Pay Requests, partial allowed, total ≤ original, back to the original method; Tyro.js `https://pay.connect.tyro.com/v1/tyro.js` cannot be bundled | `tyro.ts` |
| Tyro Pay Request sample | https://docs.connect.tyro.com/docs/online-payments/pay-online/integration-guide/tyro-js | `POST /connect/pay/requests` with `locationId`, `provider{name:TYRO,method:CARD}`, `origin{orderId}`, `total{amount (cents),currency}`; `Authorization: Bearer <JWT>`; response `paySecret`; client sample tests status `SUCCESS`/`FAILED`. No test environment or test cards on the page | `tyro.ts baslat` |
| Tyro authentication | https://docs.connect.tyro.com/app/authentication/ | credentials = `client_id` + `client_secret`, obtained by requesting them from Tyro Connect; `/oauth/token` → `access_token`, `expires_in`, `token_type` Bearer; JWT lives 12 h; more than 12 tokens in 11 h are rejected (so cache) | `tyro.ts jetonAl` |
| Tyro webhooks | https://docs.connect.tyro.com/docs/getting-started/notification-events/webhooks | registration is a manual process via the Tyro Connect team (they hold your URL; signing keys per URL); header `Tyro-Connect-Signature`; HMAC-SHA256 of the raw body with the pre-shared key (the page also says "SHA-256 hash": inconsistent, encoding unstated); 200 ok, 500 = retried 3 times; ignore duplicate type+id | `tyro.ts tyroImzaDogru`, `webhook.ts` |
| Tyro notification events | https://docs.connect.tyro.com/api-explorer/pay-online/0.9/notification-events | types `PAY_REQUEST_SUCCESS`, `PAY_REQUEST_FAILED`, `PAY_REQUEST_VOIDED`, `PAY_REQUEST_PROCESSING`, `NEW_PAY_REQUEST`, `NEW_PAY_METHOD`, `NEW_PAY_REFUND`; payload `{type, data:{id, uri, resource}}` | `tyro.ts tyroOlayiOku` |
| Tyro refunds / list pages | https://docs.connect.tyro.com/api-explorer/pay-online/0.9/refunds | summaries only. **Refund request fields, Pay Request response fields beyond `paySecret`, status vocabulary and the token request's parameters were NOT readable** — each guess is marked `TYRO-UNVERIFIED` in `tyro.ts` | — |
| Stripe Connect OAuth | https://docs.stripe.com/connect/oauth-standard-accounts (fetched by the coordinator, not by this job) | OAuth for new platforms is not recommended; Notya has no Stripe platform account | the Connect path is **not built** (needs a platform `client_id`) |
| Tyro llms.txt | https://www.tyro.com/llms.txt | only a pointer to https://www.tyro.com/partners/developer-documentation/ | — |

## What the code really does (checked in the repository, used for the notice and policy)

- Application-level encryption AES-256-GCM: `lib/security/encryption.ts` (key from the environment; not every column is encrypted).
- Application servers: `vercel.json` `regions: ["fra1"]` (Frankfurt). Database: the Australian Supabase project is recorded in OPEN-COMMITMENTS as Sydney — **not re-verified here**.
- Speech-to-text: `lib/ulke/uygulama/konusmaTanima.ts` → `https://api.elevenlabs.io/v1/speech-to-text`. Text-to-speech: `sesSentez.ts` → ElevenLabs.
- Language model: `lib/ai/cagir.ts` → `lib/ai/saglayici.ts` → OpenRouter (`openrouter.ai/api/v1`).

## Clinical content shown by the build

New in this job: **none** — no dose, threshold, growth flag or schedule number was added. The reference sections carry links and a "Source:" line. Existing tools carry their own sources in code (`kaynak`, `lisans`), many are switched off pending clinician sign-off (`countries/au/ayarlar.ts` `kapali`), and the growth-chart tool uses the WHO tables the kit already holds. Whether every number in every existing AU tool traces to a fetched source was **not re-audited** in this job; the earlier audits are `docs/araclar-denetim/AU.md` and `docs/COUNTRY-AUDIT-AUSTRALIA.md`.
