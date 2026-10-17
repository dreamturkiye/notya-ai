---
name: performans-butcesi-koruma
description: >-
  Standing performance budget derived from PERF-SAGLAMLIK-2026-10's measured
  numbers (patient-file bundle size, portal/API hot-path latency, per-item
  sync round trips, hot-table query plans, external-call timeout coverage).
  Use before closing ANY change that touches the patient file, a
  synchronous API hot path, a per-item sync loop, a hot patient table query,
  or a new external call. Answers "did this change make Notya slower, and by
  how much, right now — not whenever the next audit happens?"
---

# Performans bütçesi (ölçülen rakamı ayda bir değil, her değişiklikte koru)

Boss rule (Kaan, 2026-10-17): the PERF-SAGLAMLIK-2026-10 numbers are the standard now,
not a one-time result. Nobody should have to commission a fresh full audit to find out
whether something ate the gains back. Check it at the moment of the change instead.

## Trigger

Any change to:
- `app/dashboard/doktor/hastalar/[id]/**` or anything it eagerly imports.
- Any `app/api/**` route a doctor or patient waits on synchronously — portal
  (`app/api/portal/hasta/[token]/route.ts` and siblings), session end, note save,
  task sync.
- `gorevEkle` / `gorevSenkron` or any other loop that does one DB round trip per item.
- A query against `hasta_lab_sonuclari`, `hasta_goruntulemeler`, `hasta_belgeler`,
  `kontrasepsiyon`, or any new table that becomes a hot read on the patient file or
  every-request path.
- Any new or modified call to an external service (email providers, WhatsApp Graph,
  Google Calendar, ElevenLabs, a new SMS/communications provider, any future
  integration).

Not triggered by: specialty content changes, UI copy, non-hot-path admin/reporting
screens, anything behind a tab that isn't the patient-file default view.

## The five checks

### 1. Bundle size (patient-file page)
Run `next build` (or read its last output if the change didn't touch client code —
state that explicitly rather than skipping silently). Compare the two numbers for
`/dashboard/doktor/hastalar/[id]`:

| | 2026-10-17 baseline | Warn | Fail |
|---|---|---|---|
| Page JS | 18.6 kB | > 30 kB | > 60 kB |
| First Load JS | 214 kB | > 260 kB | > 350 kB |

The 324 kB / 594 kB pre-fix numbers are what this guards against reverting toward —
seeing it creep back up even partway is the early-warning signal, not just hitting the
old number again. If a new specialty panel or tab is added, confirm it is still
dynamically imported behind its tab/branş gate (the pattern that got the 94% cut) —
adding a 40th eagerly-imported component undoes the fix one component at a time.

### 2. Hot-path latency
Use the existing `SahteVeritabani` harness (simulated RTT=20 ms) against the touched
route, N=15 runs, compare the median:

| | 2026-10-17 baseline | Warn | Fail |
|---|---|---|---|
| Portal/API GET median | 62.3 ms | > 100 ms | > 200 ms |

Look for the specific failure mode the original fix solved: sequential round trips
re-introduced (await-ing calls one after another that could run in `Promise.all`).
That's almost always *why* latency regresses here, not raw query cost.

### 3. Per-item sync round trips
If the change touches `gorevEkle`/`gorevSenkron` or copies its pattern elsewhere:
count DB round trips for N=1 and N=5 task codes. Must stay at 2 (one batched SELECT +
one batched INSERT), not scale to 2×N. If a new specialty route adds its own task-sync
call, it must use the shared batched helper, not a hand-rolled per-item loop — that's
how this regresses silently (copy-paste from an old example instead of the fixed one).

### 4. Hot-table query plan
If the change touches a query against one of the four hot tables (or adds a new
hot-read path on the patient file or every-request flow): run
`EXPLAIN (ANALYZE, COSTS, TIMING)` against production for the actual query shape.
Must show Index Scan (cost ≈2.37 baseline), not Seq Scan (cost ≈17.21). A regression
here usually means: the migration-175 index was dropped/renamed, or the query's filter
columns no longer match the index's column order (`doctor_id, patient_id,
created_at desc`) — e.g. a new `.order()` or an added `.eq()` that changes the shape.

### 5. External call timeout coverage
Any external fetch (new provider, new endpoint on an existing provider) must set an
explicit timeout and route failure into an existing fallback path — the same posture
as the Gmail/Microsoft (15s/30s), WhatsApp Graph (30s), Google Calendar (20s),
ElevenLabs STT (240s/120s) / TTS (45s) / token (15s) calls this job fixed. No new call
ships without one; "we'll add a timeout later" is not an acceptable state for this
category — a hung upstream holds the Vercel function until `maxDuration` kills it,
exactly the failure mode this job closed.

## Logging instead of re-auditing

Append one line per change in scope to `docs/audits/PERF-BUTCE-LOG.md`:

```
2026-11-03 | gorevSenkron: added 30th specialty route | round trips N=5: 2 (pass) | timeout: n/a
```

- **Pass**: nothing more needed.
- **Warn**: close with a one-line reason in the same log line (e.g. "First Load 268 kB
  — new tab, still dynamically imported, acceptable per Kaan 2026-11-03").
- **Fail**: do not close. Either fix it, or get Kaan's explicit written acceptance of
  the specific regression and his reason, recorded in the same log line. A fail with no
  fix and no recorded acceptance is an open commitment, not a closed change — log it
  in `docs/OPEN-COMMITMENTS.md` too.

This log is what replaces "schedule another full audit in a month." Reading the last
dozen lines of it tells you more about current drift than a fresh audit would, because
it's tied to the actual change that might have caused a regression.

## Country parity

Per `.cursor/skills/ulke-paritesi-duzeltme/SKILL.md`: if the touched code is shared
with the six country branches, the same five checks run there too (or the gap is
logged with a per-country status line, same as any other fix). A budget only matters
if it holds everywhere a doctor actually uses the product.

## Related

- `docs/audits/PERF-SAGLAMLIK-2026-10.md` — where every baseline number above came
  from; read it once for the full method, not every time.
- `docs/audits/PERF-BUTCE-LOG.md` — the running log.
- `.cursor/rules/performans-butcesi-koruma.mdc` — the always-on rule this skill backs.
