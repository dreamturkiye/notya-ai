# OPEN COMMITMENTS — Notya AI

**Why this file exists.** Work agreed in a session and deferred to "next time" was getting lost and
resurfacing weeks later as "why was this never done?". Chat history is not a tracking system.
Anything deferred goes here with a date and who it waits on, or it does not count as agreed.

Last reviewed: 2026-08-27

---

## Waiting on the founder

| Since | Item | Why it matters |
|---|---|---|
| 2026-08-25 | **Configure custom SMTP in Supabase (Resend / Postmark / SendGrid)** — dashboard setting + DNS records | **LAUNCH BLOCKER for the doctor section.** Signup currently uses Supabase's built-in mail sender, which is development-grade and rate-limited; QA hit `email rate limit exceeded` after a handful of attempts. On launch day the first few doctors register, then every later signup silently fails to receive its confirmation link — no confirmation, no login, no trial. No custom SMTP is configured anywhere (`SMTP_*`, `RESEND_*`, `SENDGRID_*` all absent) and the app does not send its own mail. Needs account credentials and domain DNS, so it is a founder action |
| 2026-08-25 | **Complete the signup end-to-end test** once SMTP is live | The flow genuinely stops at the confirmation e-mail, so register → confirm → login → 15-day trial → dashboard cannot be verified until the mail path works |
| 2026-08-26 | **Decide the sender domain** (notya.ai vs alternative) | Undecided as of 2026-08-26. Does NOT need to block SMTP: Resend verifies any owned domain, and the Supabase sender is one config field — a subdomain of an already-owned domain unblocks the E2E today and the brand domain can be swapped in later |
| 2026-08-26 | **Merge PR #17 (NOTYA-ILAC-07) and PR #18 (NOTYA-PSEUDO-05)** | Both verified locally; merging deploys to production, so it is a founder call |
| 2026-08-27 | **Submit the two Pabau partner applications** (Claude drafts, founder submits under the Notya brand) | (1) Referral Partner Program — up to 20% recurring revenue up to 3 years per referred clinic; (2) App Marketplace listing — distribution into Pabau's 3,000+ practices and the right to show an official badge. Until approval the /klinik page says only "Pabau ile çalışır" with a trademark note — no partner claims |
| 2026-08-27 | **Merge PR #19 (NOTYA-AUTH-01) and the /klinik landing PR** | Auth convention + the klinik front door; both deploy to production on merge |

## Operator work

| Since | Item | Note |
|---|---|---|
| 2026-08-25 | **Workflow verification (QA item 5)** | Not started: doctor workflows end-to-end — hasta ekle, belge yükleme, reçete, rapor, SGK |
| 2026-08-25 | **True 390px visual verification** | Chrome's resize_window moves the window but not the viewport, so mobile layout was proved from the code rather than seen. NOTYA-MOBILE-01 fixed the grids; a real device pass is still worth doing |
| 2026-08-25 | **Tailwind conversion for /doktor** | The page is built from ~102 inline style objects, which is why it could not hold a media query. The CSS-block fix is correct but the section is worth converting properly when the launch is not imminent |
| 2026-08-25 | **Only 8 media queries in the whole app** | /doktor is fixed. Other surfaces (mali, avukat, dashboard sub-pages) have not been audited for mobile |
| 2026-08-25 | **Auth guard convention fix** | The NOTYA-ILAC-04 session-key bug came from a route ignoring a pattern the app already had. One convention, applied to every doktor route, folded into whichever PR next touches them |
| 2026-08-26 | **`ruhsatAskida` not surfaced in the UI** | 62 SGK-reimbursed products have a suspended TİTCK licence (codes 1/3). The data carries the flag since NOTYA-ILAC-07; the search result should show it so the doctor is not prescribing a suspended product unaware |
| 2026-08-26 | **214 SGK barcodes with no TİTCK match** | 2.5% of records have no etken madde (no barcode match, no unambiguous eşdeğer grubu). Mostly allergen extracts and serums. Searchable by name; left blank rather than guessed. Re-check after the next TİTCK weekly list |
| 2026-08-26 | **TİTCK / SGK refresh cadence** | Both lists change weekly. `scripts/import-sgk-ilac.mjs` then `scripts/import-titck-etken.mjs` — no schedule exists yet. A stale list means a withdrawn drug still shows as reimbursed |
| 2026-08-26 | **tsconfig `baseUrl` deprecation (TS5101)** | `npm run typecheck` reports it on every run and will break on TypeScript 7. Migrate to `paths` without `baseUrl` |
