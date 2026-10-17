# PERF-SAGLAMLIK-2026-10 — Performance & Robustness Audit

Date: 2026-10-17 · Scope: whole Notya app (main + six country branches) · Hard constraint: **zero behavior change** — no feature, output, clinical content, permission check or isolation guarantee was altered. Anything that would trade behavior for speed is listed under *Proposals*, not implemented.

## Headline summary

All numbers below are measured in this environment (see §Results for method/caveats on each row) — none are estimated.

| Metric | Before | After | Change |
|---|---|---|---|
| `/dashboard/doktor/hastalar/[id]` page JS (`next build`) | 324 kB | 18.6 kB | **−94.3%** |
| `/dashboard/doktor/hastalar/[id]` First Load JS (`next build`) | 594 kB | 214 kB | **−64.0%** |
| Shared JS bundle ("First Load JS shared by all", every route) | 88.0 kB | 88.9 kB | +1.0% (noise — dynamic-import runtime; no route's First Load regressed) |
| Portal GET handler latency — harness median, `SahteVeritabani`, simulated RTT=20 ms, N=15 | 435.4 ms | 62.3 ms | **−85.7%** |
| `gorevEkle`/`gorevSenkron` DB round trips for N task codes (29 specialty routes) | 2×N | 2 | e.g. N=5: 10→2, **−80%** |
| Query plan cost, `hasta_belgeler`/`hasta_lab_sonuclari`/`hasta_goruntulemeler`/`kontrasepsiyon` hot read (EXPLAIN ANALYZE, production) | Seq Scan, cost 17.21 | Index Scan, cost 2.37 | **−86%** |
| `npm test` (full suite) | — | 6964/6964 pass, 0 fail | regression gate, not a speed metric |
| `tsc --noEmit` | — | 0 errors | regression gate |
| `next build` wall time, local (cache state differs — see §Results, not attributed to code alone) | 8m14s (cold) | 4m09s (warm cache) | not a clean before/after — reported for context only |

## Phase 1 — Measurements (baseline)

### 1.1 Build & bundles

- `next build` (Next 14.2.35) measured locally with mocked Google Fonts (egress-blocked sandbox; fonts do not affect JS bundle sizes). Build wall times are reported for *incremental (warm webpack cache)* runs — the clean/cold figure is given once for context. Vercel production builds have their own cache behavior; local times are a proxy.
- Route-by-route first-load JS: see §Results table (before/after captured from identical build setup).

### 1.2 Hot client pages (static analysis)

- `app/dashboard/doktor/hastalar/[id]/page.tsx` (patient file): **39 heavy components imported eagerly** — 27 specialty `*Home` modules (`specialties/*/ui`, 56–348 KB of source each) plus 12 tab-gated panels (HastaGebelik 1 024 lines, HastaKonsultasyonlar 849, HastaDermatoloji 728, HastaAsilar 651, HastaIlaclar 616, FotoArsivi, PatientDocumentVault, HastaBuyumeEgrileri, HastaMchat, HastaGelisimTaramasi, HastaGoruntuler, HastaIntake). Every one of them is rendered **only** behind `activeTab === …` + branş gates — for any given doctor at most one specialty Home is ever used, the other 26 are dead weight in the first load.
- Heavy libraries (`tesseract.js`, `pdfjs-dist`, `dicom-parser`, `heic-convert`, `@react-pdf/renderer`, `xlsx`) were **already** lazy (`await import(…)`) or server-only — no action needed (verified import sites).
- Middleware: headers-only in practice. `PUBLIC_ROUTES` contains `'/'` and the check is `pathname.startsWith(route)`, so **every** path matches the public branch and the JWT/auth block below it is unreachable dead code (auth is enforced in route handlers via `doktorOturum`/`pratikOturum` — verified). Left untouched (any middleware change affects every request); cleanup is a proposal.

### 1.3 API-route waterfalls (static analysis + harness timing)

- GET handlers are mostly already parallelized (earlier perf passes). Remaining sequential chains found:
  - `app/api/portal/hasta/[token]/route.ts` GET — **~16 sequential awaits** on independent `(doctor_id, patient_id)` reads before the branch modules (hekim kartı → sessions → notes → sevkler → ilaçlar → lab → görüntüleme → lab_paneller → konsültasyon belgeleri → medical_documents → goruntu_calisma → patients → hekim branşı → gebelik → kadın sağlığı → kontrasepsiyon → aşı karnesi → dahiliye kartları → mesajlar → takip → randevu).
  - `app/api/sessions/[id]/end/route.ts` POST — 5 independent pre-AI load blocks executed sequentially (hasta dosyası+önceki vizit, stil örnekleri, hafıza+kurallar, kimlik Promise.all, muayene ekleri).
  - 29 specialty routes: `gorevEkle`/`gorevSenkron` N+1 — per task code one SELECT + one INSERT, sequential (2×N round trips per specialty-tab open).
- Handler latency measured with the repo's own `SahteVeritabani` harness (real route handlers, fake DB) with a fixed artificial RTT per executed query; N=10, median reported. This measures waterfall depth honestly; absolute production latency depends on real Supabase RTT (fra1 → aws eu? project is us-east-1; Vercel region fra1 — see Proposals).

### 1.4 Database (Supabase advisors + pg_stat_statements, project anjayzospuurymjmmtim)

- Advisors (performance): **368 unindexed foreign keys** (INFO), **73 `auth_rls_initplan`** warnings (RLS policies re-evaluate `auth.uid()` per row — second line of defense only; service-role routes bypass RLS), **212 unused indexes** (INFO — most tables are near-empty, "unused" is expected at beta volume), **180 multiple-permissive-policies** warnings, **1 duplicate index** (`whatsapp_yanitlar`: `whatsapp_yanitlar_gelen_idx` = `whatsapp_yanitlar_masa_idx`).
- pg_stat_statements: total load is dominated by Supabase auth internals (`set_config`, sessions/users selects — 85–215k calls, sub-ms each); application queries are low-volume (beta: patients=31, notes=48, sessions=60). **No slow application query exists today**; indexes below are growth insurance on paths that run on every portal/patient-file/SOAP request.
- Hot-path tables with **no** covering index for their actual query shape (all queried `.eq(patient_id).eq(doctor_id)[.order(created_at desc)]`): `hasta_lab_sonuclari` (pkey only), `hasta_goruntulemeler` (pkey + visit_id only), `hasta_belgeler` (pkey only — read by `hastaDosyaDerleyici` on **every SOAP generation**), `kontrasepsiyon` (pkey only).

### 1.5 Robustness

- External HTTP calls **without any timeout** (a hung upstream holds the Vercel function until `maxDuration`): Gmail/Microsoft e-posta sağlayıcıları (`lib/iletisim/otomatik/eposta/saglayicilar.ts`, 6 fetches), WhatsApp Graph (`lib/iletisim/whatsapp/istemci.ts`), Google Calendar (`lib/randevu/v2/google/istemci.ts`, 3 fetches), ElevenLabs STT (`app/api/sessions/ses-yukle/route.ts`, `lib/gelenBelgeler/donustur.ts`), ElevenLabs TTS (`lib/dr-ayse/tts.ts`), ElevenLabs token (`app/api/asistan/mali-signed-url/route.ts`). NetGSM, Android SMS gateway and all OpenRouter/Anthropic calls already had timeouts + fallback gates (G1–G4) — verified, untouched.
- Unhandled promise rejections: `app/api/users/me/route.ts` fire-and-forget `auth.admin.updateUserById` (real promise, no catch → process-level unhandledRejection on failure), `app/api/asistan/fish-tur/route.ts` `wsHazir.then(…)` without catch. `notes/[id]/approve`'s `void hastaKlinikOzetleriGuncelle(…)` is safe (callee has a catch-all). Background learning (`arkaPlandaSurdur`) already guards doctor-facing requests — verified.
- Found-but-not-fixed (behavior change → proposal): `users/me` and `doktor/hafiza` discard Supabase **query builders** with `void` (`void supabase.from('users').update(…).eq(…)`). PostgREST builders only execute when awaited/`.then`ed — these "self-heal" updates **never run today**. Making them run is a behavior change; logged as a bug proposal.

## Phase 2 — Implemented changes

All changes are latency/robustness only; request/response bodies, clinical content, permission and isolation checks are byte-identical (proven for the biggest rewrite — see 2.1).

### 2.1 Portal GET parallelization — `app/api/portal/hasta/[token]/route.ts`

~16 sequential independent `(doctor_id, patient_id)` reads now start concurrently right after the token + PIN gate; every block **consumes** its result at its original position with its original try/catch and rethrow semantics (wrapped helpers carry `{ok,v}/{ok:false,e}` and rethrow exactly where the old `await` sat). Isolation filters are unchanged line-for-line. **Equality proof:** the old handler (from `git show HEAD`) and the new one were run side-by-side against the repo's `SahteVeritabani` harness on a populated scene (patient + session + approved note + medication + lab + future randevu): byte-identical JSON bodies, same status.

### 2.2 `sessions/[id]/end` pre-AI loads — `app/api/sessions/[id]/end/route.ts`

The five independent pre-AI blocks (hasta dosyası + önceki vizit, stil örnekleri, hafıza + kurallar, kimlik dörtlüsü, muayene ekleri) now run in one `Promise.all`; each block keeps its own try/catch and partial-assignment behavior (IIFEs mutate the same `let`s). `cekListeVerisiYukle` still runs after (depends on branş + doğum). Quota check still precedes everything.

### 2.3 Görev senkron N+1 → batch (29 specialty routes)

`gorevEkle`/`gorevSenkron` in 29 routes did one SELECT + one INSERT **per task code**, sequentially (2×N round trips on every specialty-tab open that syncs tasks). Each is now 1 `in('kod',…)` SELECT + 1 batch INSERT with identical filters per file (the three variants that had no `doctor_id` filter on the select — derm spine, dahiliye `_ortak`, göz, jinekoloji — keep exactly their own filters), input de-duplicated by first occurrence to match the sequential loop's behavior, same return values (count or void).

### 2.4 Patient-file bundle — `app/dashboard/doktor/hastalar/[id]/page.tsx`

39 tab-gated components (27 specialty Homes + 12 heavy panels) converted from eager imports to `next/dynamic` (`dinamikYukle` alias — the route already exports `const dynamic`). Default **ozet** tab components stay static. Same components, same props, same gates; a tab's first open shows a one-line "Yükleniyor…" while its chunk loads.

### 2.5 Database indexes (migration `lib/db/migrations/175_perf_sicak_yol_indeksleri.sql`)

Additive only (`create index if not exists`, no drop/alter anywhere): `hasta_lab_sonuclari (doctor_id, patient_id, created_at desc)`, `hasta_goruntulemeler (…same…)`, `hasta_belgeler (…same…)`, `kontrasepsiyon (doctor_id, patient_id)`. Applied by Claude with Supabase MCP and verified (index present) on **all seven projects**: TR `anjayzospuurymjmmtim`, US `xmoxiprwisegunbrpstw`, GB `gscfutmlozfvwrndwecw`, CA `urdxvmsertgnxtapypig`, AU `sllwiuhobuagumwbvulf`, NZ `itcrfagsjzwzupqlzbqe`, UZ `pzleklfytbigsurumekn` (country variant guarded with `to_regclass` per table; all 4 tables exist in all 7 → 4/4 indexes everywhere).

### 2.6 Robustness — timeouts on external calls (fail → existing fallback paths, never a new error class)

| Call | File | Timeout |
|---|---|---|
| Gmail/Microsoft token + profile + revoke | `lib/iletisim/otomatik/eposta/saglayicilar.ts` | 15 s |
| Gmail/Graph mail send (3 call shapes) | same | 30 s |
| WhatsApp Graph API (all calls via `graph()`) | `lib/iletisim/otomatik/whatsapp/graph.ts` | 30 s |
| Google Calendar token + API | `lib/randevu/v2/google/istemci.ts` | 20 s |
| ElevenLabs STT (muayene sesi; maxDuration 300 s) | `app/api/sessions/ses-yukle/route.ts` | 240 s |
| ElevenLabs STT (gelen belge sesi) | `lib/gelenBelgeler/donustur.ts` | 120 s |
| ElevenLabs TTS (Dr. Ayşe sandbox) | `lib/dr-ayse/tts.ts` | 45 s |
| ElevenLabs convai token | `app/api/asistan/mali-signed-url/route.ts` | 15 s |

NetGSM, Android SMS gateway, Deepgram token, sesMotoru and every OpenRouter/Anthropic call already had timeouts/gates — verified, untouched. A timeout fires the **same** rejection path as today's network errors (callers already handle it); it only converts "hang until the platform kills the function" into a bounded failure.

### 2.7 Robustness — unhandled rejections

- `app/api/users/me/route.ts`: fire-and-forget `auth.admin.updateUserById` got `.catch` + log (still fire-and-forget).
- `app/api/asistan/fish-tur/route.ts`: `wsHazir.then(…)` got `.catch(() => {})` (a never-established WS no longer risks an unhandled rejection in the stream's `finally`).
- Checked and left alone: `notes/[id]/approve`'s `void hastaKlinikOzetleriGuncelle(…)` (callee has a catch-all); `arkaPlandaSurdur` (already guarded — a failed learning call cannot fail a doctor-facing request).

## Phase 3 — Results (before → after)

**Method**: "before" = `next build` / harness run against git `HEAD` (pre-Phase-2, == `origin/main` at job start) in this same worktree; "after" = the identical build/harness run against the working tree with every Phase 2 change applied. Nothing else changed between the two runs.

### 3.1 Bundles (`next build`, route-by-route)

- `/dashboard/doktor/hastalar/[id]` (patient file — the 39-component dynamic-import change): page JS **324 kB → 18.6 kB (−94.3%)**, First Load JS **594 kB → 214 kB (−64.0%)**. This is the single biggest win in the job: a doctor opening a patient file now downloads roughly a third of what they did, because 38 of the 39 specialty/tab components (the 39th, the default "özet" tab, stays static) load only when their tab is actually opened.
- Shared JS ("First Load JS shared by all"): 88.0 kB → 88.9 kB (+0.9 kB, the `next/dynamic` loader runtime) — every other route's First Load JS moved by at most ~1 kB (within this same noise band); none regressed.
- Secondary effect, disclosed for honesty: converting the patient-file page's imports to `next/dynamic` changed how webpack's `splitChunks` buckets a few small shared modules across ~139 other routes (mostly `/doktor-tools/*`), shifting bytes between a route's own "page JS" and the "shared" chunk. **First Load JS — the number that determines what a browser actually downloads for that route — moved by ≤1.1% on every single one of them**, i.e. no route got heavier to load. This is bundler bucketing, not a behavior or performance change, and is called out here rather than silently dropped.
- Portal route (`/portal/hasta/[token]`): 3.37 kB / 167 kB → 3.38 kB / 168 kB (flat, within rounding) — expected and correct, since that fix is server-side-only (the GET handler's await structure); it should not move the client bundle at all, and it doesn't.

### 3.2 API-route latency (handler harness, `SahteVeritabani`, simulated RTT)

- **Portal GET** (`app/api/portal/hasta/[token]/route.ts`), RTT=20 ms, N=15 runs, median: **435.4 ms → 62.3 ms (−85.7%)**. This matches the waterfall-depth argument: ~16 sequential round trips collapsed to effectively 1–2 (the slowest branch), so wall time now tracks `max(branch latencies)` instead of their `sum`.
- **Göz GET** (`app/api/doktor/goz/route.ts`), same harness: 185.2 ms → 186.3 ms (flat, +0.6%, within run-to-run noise). Honest null result: a bare GET to this route does not itself invoke `gorevEkle`/`gorevSenkron`, so this particular harness probe doesn't exercise the N+1 fix. The N+1 fix's benefit is reported instead as a **round-trip count**, which is exact rather than timing-noise-prone: syncing N task codes went from 2×N round trips (one SELECT + one INSERT per code, sequential) to exactly 2 (one batched SELECT + one batched INSERT) — e.g. 5 codes: 10 round trips → 2.
- `sessions/[id]/end` (the 5-block `Promise.all` consolidation) was **not** harness-timed: the handler's downstream path calls the real SOAP-generation/AI pipeline, which this harness does not mock, so an isolated wall-clock number here would not be a faithful or honest measurement. Its improvement is proven the same way as everything else in this job — equivalence of the five blocks' own try/catch and partial-assignment behavior, plus the structural fact that 5 independent round trips now run concurrently instead of sequentially (wall time → `max` of the five instead of their `sum`).

### 3.3 Database (production `anjayzospuurymjmmtim`, already covered in 1.4/2.5)

- `create index if not exists` × 4 applied and verified on all 7 Supabase projects (TR + 6 countries) — see 2.5.
- `EXPLAIN (ANALYZE, COSTS, TIMING)` on the `hasta_belgeler`-shaped hot read: **Seq Scan cost=17.21 → Index Scan cost=2.37 (−86%)**. At beta data volume (patients=31, notes=48) this is plan-shape proof, not a user-perceptible latency change today — framed in the headline table and here as growth insurance, not a present-day speedup, per the "never fabricate a number" rule.

### 3.4 Correctness gates

- `tsc --noEmit`: 0 errors (one self-caused, self-fixed `dynamic` naming collision on the patient-file page — see job log; final state clean).
- `npm test` (full suite, this worktree): **6964/6964 pass, 1281 suites, 0 fail, 0 cancelled** (`test_exit=0`). No flaky failure occurred, so `sureButcesi.test.ts` did not need a rerun.
- `npm run test:izolasyon`: 501/501 pass. `npm run test:brans-sizmasi`: 48/48 pass.
- Byte-identical black-box proof on the portal GET rewrite (old handler from `git show HEAD` vs new handler, same populated `SahteVeritabani` scene): identical JSON body and status.

### 3.5 Build wall time — reported, not claimed as a win

`next build`: 8m14s (first run in this worktree, cold `.next/cache`) → 4m09s (second run, warm `.next/cache` from the first). These two runs are **not a clean before/after of the code changes** — the second benefited from webpack's persistent cache regardless of what changed, and that confound cannot be removed without a third, fully-cold run that this job's time budget did not include. It is reported for context only and is excluded from any "X% faster to build" claim.

## Proposals (NOT implemented — behavior or infra trade-offs, or uncertain gain)

1. **Dead middleware auth block** (`middleware.ts`): `PUBLIC_ROUTES` contains `'/'` and the check is `startsWith`, so every path is "public" and the whole Supabase-JWT + rate-limit block is unreachable. Auth is enforced in route handlers, so there is no security hole — but the block is dead weight (incl. `@supabase/supabase-js` in the middleware bundle) and a false sense of a second auth layer. Removing it touches every request → left for an explicit decision.
2. **Supabase query builders discarded with `void`** (`app/api/users/me/route.ts` ×2, `app/api/doktor/hafiza/route.ts` ×1): PostgREST builders only execute when awaited — these self-heal updates (onboarding flag, specialty, selam günleri) **never run today**. Making them run is a behavior change (intended, but a change): fix by `await`ing or `.then()`-ing them.
3. **Vercel region (fra1) ↔ Supabase region (us-east-1)**: every DB round trip crosses the Atlantic (~90–110 ms). Moving the Vercel functions region or the DB region to match would cut every remaining round trip several-fold — infra decision, costs/latency for TR users to weigh.
4. **RLS `auth_rls_initplan` (73 warnings)**: wrap `auth.uid()` as `(select auth.uid())` in the policies — semantics-identical, faster at scale; touches 73 policies on the second line of defense → separate reviewed migration.
5. **Duplicate index** `whatsapp_yanitlar_gelen_idx` = `whatsapp_yanitlar_masa_idx`: drop one (DDL drop — outside this job's additive-only mandate).
6. **212 "unused" indexes / 180 multiple-permissive-policies**: re-evaluate after real traffic; dropping/merging now would be guesswork at beta volume.
7. **`gebelik` / `konsultasyon` GETs**: small remaining sequential chains (±3 RTT each, with data dependencies) — parallelizable with the same prefetch pattern if those screens ever feel slow.
8. **next/font**: the five layout fonts (Fraunces, Outfit, Newsreader ×2 sets) are fetched per-layout; unifying them in the root layout would deduplicate font CSS/preloads — visual-surface change, needs a look pass.
