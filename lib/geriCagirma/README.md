# lib/geriCagirma — recall engine: what this country build has (GERI-CAGIRMA-01, 2026-11-12)

Kaan, 2026-11-12: a recall engine with a counter (patients who are due → one-tap recall → "N patients booked after a
recall this month" on the home page). The feature is built in Türkiye (`main`). **This build (Canada) does NOT have it
yet** — see `docs/OPEN-COMMITMENTS.md`, GERI-CAGIRMA-01.

What is here, identical to `main`, so that the rule and the schema are the same in every build:

| File | What |
|------|------|
| `tipler.ts` | Types and the constants: attribution window 30 days, payment window 30 days, default cool-down 30 days. Pure. |
| `atif.ts` | The attribution rule (booked after the recall and inside the window; attended needs a real visit; money only from recorded payments; one patient once per month) and the monthly counters. Pure. |
| `atif.test.ts` | The rule's tests. |
| `lib/db/migrations/196_geri_cagirma.sql` | The three recall tables — one file for all seven databases. Nothing in this build reads or writes them yet. |

What is missing here: the country kit's own due source, the recall screen, the Today card, the routes and the pack
strings. The kit has no outbound channel, so a recall in this build will start as a call list with a "phoned" mark.
