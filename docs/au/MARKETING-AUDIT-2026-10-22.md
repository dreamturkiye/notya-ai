# Australian build — marketing-readiness audit (2026-10-22)

Owner order (Kaan): audit `release/au` (live at au.notya.io/au) and make it fit for marketing, fixing everything fixable in the same job.
By Claude, from the repository, the Supabase project `sllwiuhobuagumwbvulf` (advisors, SQL), the live site driven in a real browser (Claude in Chrome) and web sources.
**Initial compliance draft – external legal review later. Initial clinical draft – external clinician review later.** Nobody in Australia has reviewed any of this; nothing here claims external validation.

## Verdict

**Ready for LIMITED marketing (invite-only pilot), not for open public marketing.** Conditions and wording limits are below.

## What marketing may and may not say

May say: Notya records a visit (with the patient's consent), drafts a note in Australian English that the doctor reads, corrects and approves; calendar, patient page by link and PIN, pre-visit form, clinic accounts, invoices with GST fields and bring-your-own Stripe; 44 role templates (doctor specialties and allied professions as the Medical Board / Ahpra name them); every step needs the doctor's approval; the AU database is hosted in Sydney (verified 2026-10-22); it is an initial draft, with external clinician and legal review planned after the first customers.

May NOT say: TGA approved / registered / on the ARTG / "a medical device"; Ahpra, RACGP, RCH, Medicare, PBS or any college "endorsed", "partnered" or "compliant"; "Privacy Act compliant", "APP compliant", "HIPAA", or "secure" as a guarantee; "My Health Record integrated" (a stub, no connection); "Medicare billing / bulk billing / claims"; AIR submission; diagnosis, clinical decision support or treatment suggestions; "Australian company", an ABN, an Australian address, Australian customers, testimonials or statistics; that data "stays in Australia" (speech-to-text and the language model are overseas providers, see the APP 8 text); a price (plans are by quote, in AUD); Tyro (off).

## Findings

Severity: C critical, H high, M medium, L low. Status: fixed (in this job's commits) / open (owner shown).

| # | Sev | Area | Finding and evidence | Status |
|---|---|---|---|---|
| 1 | C | Reliability | **The AU build could not deploy, so au.notya.io was stale.** Three wall violations (D5: `lib/doktor/belgeNotaYaz.ts`, `components/doktor/MuayeneEkleri.tsx`, belgeler `[belgeId]` page read `process.env.NOTYA_COUNTRY`) stop every country build in `scripts/ulke-derleme-kapisi.mjs`. Browser proof: `/au/billing`, `/au/privacy-requests`, `/au/data-breach` and the Stripe webhook route answer 404 on the live site although all are in `release/au`. | fixed in code (walls pass); live redeploy: see Deploy status below |
| 2 | H | Security | **Supabase advisor.** `vault_get_blob`, `vault_put_blob`, `log_audit_event` (SECURITY DEFINER) executable by `anon` and `authenticated` through `/rest/v1/rpc`; `v_hiz_gunluk` SECURITY DEFINER view; 10 functions with mutable search_path. Migration 152 applied to the AU project and the UK, US, CA, NZ and UZ projects; AU advisor re-run shows those lints gone. | fixed |
| 3 | H | Privacy | **APP 8 text did not match reality.** Notice and policy said application servers in Frankfurt (`vercel.json` fra1) and the database "to be confirmed". Verified: Supabase `ap-southeast-2` (Sydney). `vercel.json` now `syd1`; notice, policy and notice version (`au-2026-10-22-draft-2`) updated; Cal.com, Google Fonts and Stripe added to the disclosure. The AU Vercel project is outside the team this session can read, so its real region setting is **unverified**. | fixed in code; dashboard unverified (Kaan) |
| 4 | H | Marketing | **Security and Privacy pages said "live keys are refused" and "payments run in demonstration mode, no real charge"** while bring-your-own Stripe live mode is on. Rewritten (restricted keys only, test or live, explicit live confirmation, signed webhooks, Notya holds no funds). | fixed |
| 5 | H | Marketing | **No TGA intended-use statement; landing said "Decision support".** TGA's July 2025 report: some digital scribes may be medical devices, in particular where they suggest diagnoses or treatments (MinterEllison summary, 6 Aug 2025). The AU medical-disclaimer page now states the intended use (documentation and administration, no diagnosis or treatment suggestion), that Notya is not on the ARTG and not TGA- or Ahpra-endorsed, the TGA position, and that regulatory advice has not been obtained. Landing "Decision support" became "Your clinical judgement". The four verbatim disclaimers and the UI note are unchanged. | fixed; regulatory advice open (Kaan) |
| 6 | H | Marketing | **Public placeholders and a false local presence.** The landing footer showed "Notya (Australia) — [business address … placeholder]" and "ABN: [placeholder]"; privacy officer read "to be completed by the practice". Notya has no ABN and no Australian address. The landing now shows only hello@ and privacy@; the policies say entity details and a named privacy officer will be published before commercial launch. | fixed; entity details open (Kaan) |
| 7 | M | Security | Country-build CSP/Permissions-Policy: `microphone=*`, Groq and open-meteo origins allowed, no `frame-ancestors`, `object-src`, `base-uri`, `form-action`. Tightened for country builds only (`next.config.mjs`). Voice recording was not regression-tested in a browser after the change. | fixed (verify after deploy) |
| 8 | M | Reliability | Stripe and Tyro webhook routes were outside the country error boundary (test `BOUNDARY` failed). Wrapped in `sinirda`. | fixed |
| 9 | M | Marketing | Hero strip said "40 specialties and professions"; AU offers 44 roles. Now the pack's own count (shared English copy, also correct for the other four English countries). | fixed |
| 10 | M | Marketing | Demo copy "walks you through a real visit" can read as a real patient. Now "an example visit". | fixed |
| 11 | M | Marketing | Plans were "by quote" with no currency or GST statement. Now: quoted in AUD; the quote states whether GST applies. No amount shown. | fixed |
| 12 | M | SEO | No favicon and no Open Graph/Twitter tags (live: favicon 404). Inline monogram icon and title/description-only link preview added in the kit (all country builds); site stays `noindex`. | fixed |
| 13 | M | Reliability | Migration 152 needed registry entry, rollback script and regenerated baseline; `lib/ulke/yasal.test.ts` forbade the owner-mandated word "compliance" in "Initial compliance draft". The test now allows that exact label only. | fixed |
| 14 | M | Reliability | Turkish-text ceiling test failed (1706 > 1698): eight Turkish-tree files from the main document-workflow port, unreachable on a country build. Ceiling raised with a recorded reason. | fixed (recorded) |
| 15 | M | Turkish leakage | Live crawl of 14 public AU pages (landing, clinics, login, signup, nine policy pages, demo): no Turkish letters or words (KVKK, SGK, TL, Medula …), `lang="en-AU"`, English 404. Public files (Turkish audit HTML, manifest, service worker) answer 404 behind the country gate. Signed-in screens were not walked (invite-only; no test account created). Source: wall tests and the leak scanner pass. | no leak found |
| 16 | M | Flows | **Not walked in a browser:** signup/login (invite-only), practice setup, patient create, booking, consult note with Ekler, billing, portal. Covered only by pack tests (AU 204/204 pass with `NOTYA_COUNTRY=au`). | open (needs a test account) |
| 17 | M | Flows | **No patient-data export (APP 12) feature**: an access request is recorded and answered by hand; the response is not sent to the patient. IHI is not captured (optional item). | open (Claude, logged) |
| 18 | M | Security | Supabase Auth "leaked password protection" is off (dashboard setting, not reachable with the migration tools). | open (Kaan, dashboard) |
| 19 | L | Security | `btree_gist` installed in `public` (advisor WARN); moving it risks the booking exclusion constraint. | open (Claude, planned) |
| 20 | M | Security | The Vercel project `notya-ai` (Turkish app) holds a browser-visible `NEXT_PUBLIC_ELEVENLABS_KEY` in all environments. Not used by the AU code but public in the Turkish bundle. Rotate and remove the NEXT_PUBLIC fallback. | open (Kaan) |
| 21 | M | Legal | Policy drafts are thin where a lawyer must write them: terms say "A lawyer names the law of the contract and the court"; refund page is a draft. Honest, not a commercial standard. | open (lawyer) |
| 22 | M | SEO | Pages are `noindex` and robots.txt hides the app (`aramaMotorlarinaGizli`). Right for a pilot; open marketing needs checklist K2 and the owner's decision. No sitemap. | open (Kaan) |
| 23 | L | Clinical | AU tools carry their own citations and many are off pending clinician sign-off. The growth-chart tool is off (WHO tables; ANZSPED says WHO under 2 years only). The NIP checklist cites NSW Health "current as at 1 October 2026". No number was added in this job and no uncited number was found in the tools read; not re-audited number by number. | open (clinician review) |
| 24 | L | Clinical | `docs/au/SOURCES.md` said no NIP schedule content is copied while the older NIP checklist tool holds schedule wording cited to NSW Health. Reconciled in SOURCES.md. | fixed (doc) |
| 25 | L | Flows | Medicare check digit rule comes from a third-party page and the provider-number location character allows `0` (the official page excludes it). | open (Claude, AU-BETA-01g) |
| 26 | L | Accessibility | Live landing: one h1, 12 h2, all images have alt, no unnamed buttons or links, no horizontal overflow at 1728 px, zoom allowed. Phone width and contrast not measured; `/accessibility` is a draft. | partly checked |
| 27 | L | Security | All `console.*` in AU-reachable code carry route names or status codes only (no PHI). Rate limits: portal PIN (5 tries), messages, consultations; login relies on Supabase Auth limits. Cross-doctor isolation for AU routes is covered by the country suites (pass); the Turkish isolation suite targets Turkish routes that are not compiled into AU. | no finding |
| 29 | M | Turkish leakage | A uz/country build pulled Turkish text through `lib/clinical/buyumeEgrisi.ts` (wall test 4). The text-free LMS maths moved to `lib/clinical/lmsCekirdek.ts`; the Turkish file re-exports it; country tools import the core. Walls hold, tsc clean. | fixed |
| 30 | M | Reliability | Same D5 wall violations exist on the us, gb, ca and nz branches (their country builds are blocked the same way). Shared fixes ported, see OPEN-COMMITMENTS AU-MKT-07. | see AU-MKT-07 |
| 31 | L | Accessibility | Phone-width layout could not be checked (browser window cannot be resized, iframes blocked). | open (Claude, next walk) |
| 28 | L | Reliability | Pre-existing failures outside AU-visible code, not fixed here: Uzbekistan screen and landing tests, the ca/gb/nz/us "docs record" tests when run on this branch, `lib/ulke/hesapUlkesi.test.ts` expects `app/giris/page.tsx` (absent), the Tyro webhook test needs `NOTYA_TYRO_ETKIN`. | open (Claude, separate job) |

## Not verifiable here

- The AU Vercel project (au.notya.io) is not in the Vercel team this session can read (only `notya-ai`, which builds the Turkish app for `release/au` previews because `NOTYA_COUNTRY` is not set there). Deploy state and runtime errors of the live AU project could not be read with the Vercel tools; live behaviour was read through a browser.
- Whether the AU project's Vercel region and environment variables (Stripe, encryption, `NOTYA_COUNTRY=au`) are what the code expects.
- Accuracy of every clinical string, the Medicare/ABN/AHPRA rules against the registers, and all legal text: external review.

## Deploy status

See the final report of this job: pushed to `release/au`; the live AU project cannot be read with the Vercel tools, so the new build is confirmed only by the live `/au/data-breach`, `/au/billing` and `/au/privacy-requests` pages answering 200 (they answered 404 before).
