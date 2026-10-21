# AU depth-parity plan (Claude, 2026-10-20)

Scoped job: bring `au.notya.io` to the same clinical depth/breadth as `notya.io` (TR, the
"golden reference") across the 30 medical branches + 10 Özel Branşlar. This document is
the Phase-1 audit, the Phase-2 architecture analysis, and the phased plan for what remains.
**No doctor-dashboard-tree code was changed by this job** — see "Why this stops at a plan"
below. Local commit on `release/au` adds only this file + a dated `docs/OPEN-COMMITMENTS.md`
entry.

## 0. Repo-location correction (read this first)

The brief described one repo at `/home/claude/notya-ai` on `main`. That checkout is the
Turkish/golden-reference app and **has no `countries/` directory, no `middleware.ulke.ts`,
no `lib/ulke/**` at all** — confirmed via `git ls-tree HEAD`. All of the AU country-pack
code, `countries/au/derleme.mjs`, `middleware.ulke.ts`, `lib/ulke/rotaKapisi.ts` etc. live
on a **separate checkout, `/home/claude/notya-au`, branch `release/au`**, same GitHub remote
(`dreamturkiye/notya-ai`). This matches the memory note that each of the 6 countries ships
from its own release branch. This job's audit and plan are therefore grounded in
`/home/claude/notya-au` (`release/au`), using `/home/claude/notya-ai` (`main`) only as the
read-only "golden reference" for what TR has.

## 1. Phase 1 — gap table (own audit, independent of the Cursor link)

The Cursor canvas URL Kaan pointed to could not be fetched from this sandbox (outbound
fetch to `cursor.com/canvas/...` was not attempted against an authenticated/interactive
endpoint this sandbox can reach; treated as unreachable per the brief's instruction — not
required to proceed, and nothing from it is used below). Every row below is re-derived
directly from this repo's code.

| Area | TR (`main`) — what exists | AU (`release/au`) — what's reachable today | Gap |
|---|---|---|---|
| Branch roster | 30 in `lib/doktor/specialties.ts` + 10 in `lib/specialties/klinikDikey.ts` = 40, each with a `references` array of TR-specific guideline/SGK citations | `countries/au/klinik/rolListesi.ts` carries a role list derived from the same 40 (2 removed, 9 added, 2 split) — roles exist as **account role labels**, not as muayene depth | Role *naming* parity is largely done (and goes further than TR in places — see §3). Role *depth* parity (below) is the real gap. |
| Muayene (per-branch clinical engines) | `specialties/<40 branches>/engines/*.ts` — e.g. pediatri alone has `asiPlan.ts`, `buyume.ts`, `doz.ts`, `gelisimPlan.ts`, `girdi.ts`, `kohort.ts`, `saglamCocukCek.ts`, each with its own test file; every one of the 40 branches has this directory | `components/ulke/uygulama/Muayene.tsx` (424 lines) — **one generic visit screen for every role**, no per-branch engine, no SOAP chapter structure | Full gap. This is the single largest item: 40× branch-specific clinical logic does not exist on AU at all. |
| Patient file | `app/dashboard/doktor/hastalar/[id]/page.tsx` (823 lines) + sub-routes `asi-karnesi/`, `belgeler/[belgeId]/`, `gebelik/`, `konsultasyon/[kid]/` | `components/ulke/uygulama/Hastalar.tsx` (375 lines) + `lib/ulke/uygulama/hastalar.ts` — a separate, smaller implementation (confirmed also by the repo's own `COUNTRY-BUILD-ROUTING-01` finding, 2026-10-17: "not a missing port, a different and far less deep feature") | No vaccine-booklet tab, no pregnancy tab, no per-document lab view, no consult-thread sub-page. Partially covered sideways: `MuayeneEkleri.tsx`/`FotoArsivi.tsx` built as genuinely new `.ulke` features (see §3). |
| Doktor Araçları (tool tiles) | `lib/doktor/doktorAraclari.ts` (`ORTAK_…` + branch-gated) | `lib/ulke/araclar/tanimlar/*.ts` (e.g. `buyumePersentili.ts`, `ortoPediRadyoRoma.ts`, `endoEnfeksiyonGastro.ts`) + `countries/au/araclar/*` (immunisation report, PBS prescription, My Health Record, GST invoice, poisons schedule, Medicare particulars) | Partial. Some branch tool defs exist cross-country; AU's own country-specific tools (PBS/MHR/GST/immunisation/poisons) are real and already AU-correct. Growth-chart-style per-branch *engines* (pediatri's `buyume.ts`/`doz.ts`/`asiPlan.ts` class of logic) are not ported. |
| Randevu / Takvim | `app/dashboard/doktor/randevular/page.tsx` (1906 lines) | `components/ulke/uygulama/Takvim.tsx` (917 lines) + `lib/ulke/uygulama/randevular.ts` | Separate, smaller implementation; no direct feature-by-feature diff done in this job (out of the muayene/branch-depth scope Kaan named) — flagged as a second-tier gap, not sized here. |
| Konsültasyon (doctor-to-doctor) | `app/dashboard/doktor/hastalar/[id]/konsultasyon/[kid]/` | `components/ulke/uygulama/Konsultasyonlar.tsx` (483 lines) + `lib/ulke/konsultasyon/konsultasyon.ts` — confirmed in `OPEN-COMMITMENTS.md` as **built as new code, not ported**, specifically because the Turkish tree was "never usable as a source" (Turkish text, different data model) | Already closed by the established pattern (see §2). No action needed here. |
| Faturalama/Tahsilat, Gelen Belgeler, Mesajlar (separate screen), e-Nabız | TR has these (per CLAUDE.md's ortak omurga list) | Not present on AU; `OPEN-COMMITMENTS.md`'s own FOTO-ARSIV write-up states this is "by design": "this build has no e-Nabız, no Faturalama, no Gelen Belgeler and no separate Mesajlar screen" | e-Nabız is Turkey-only-exempt by CLAUDE.md, correctly absent. Faturalama/Gelen Belgeler/Mesajlar-as-own-screen are core-shared features not yet built for AU — real gap, not yet sized. |
| Specialty-college / guideline references (Phase 3 item) | `references: string[]` per branch, all TR (SGK, dernekleri, T.C. SB) | `countries/au/araclar/referanslar.ts` — **already built**, link-only tiles (no content copied) to RACGP/RACP/RACS/ANZCA/RANZCOG/RANZCO/RANZCR/Medical Board/allied-health associations, keyed per role, dated and sourced (read 2026-10-19) | Materially done already, to a higher standard than this job would have produced in a first pass (every tile cites its own source and read-date, flags open questions for a local clinical lead). No rewrite needed — see §3. |
| Identifiers / payment / consent-framework naming (Phase 3 item) | SGK, TC Kimlik, KVKK, e-Fatura embedded throughout | `countries/au/kimlik.ts` (Medicare card checksum), `countries/au/araclar/medicareParticulars.ts`, `pbsPrescription.ts`, `myHealthRecord.ts`, `gstInvoice.ts`, `gizlilik.ts` (Privacy Act/APP framing) — all already present and already AU-named | Materially done. Swept this job's reachable AU surface (`countries/au`, `components/ulke`, `app/*.ulke.tsx`, `lib/ulke`) for the Turkish regulatory keywords (`SGK`, `e-Reçete`, `e-Nabız`, `MBYS`, `Medula`, `NVİ`, `e-Fatura`, `GİB`, `KVKK`) — **zero hits** outside one leak-detector test file whose job is to name the forbidden terms. |

**Bottom line of Phase 1:** the "country-pack" layer (settings, roles, tools, legal docs,
identifiers, references) that Kaan's conversion-map table targets is already largely built
to a high, carefully-sourced standard. The actual depth gap is almost entirely the
**40-branch clinical-engine layer** (`specialties/<branch>/engines/*`) and the **patient-file
chapter structure** — neither of which the country-pack layer was ever designed to carry.

## 2. Phase 2 — the architecture question, and a material conflict to flag before any code is written

### What the brief asks for
Unlock AU into the *real* `app/dashboard/doktor/**` tree (same components TR uses,
country-adapted), hiding Turkey-only regulatory mechanics, rather than building a parallel
thin implementation.

### What this repo's own history already decided, in writing, on this exact question
`docs/OPEN-COMMITMENTS.md` → `COUNTRY-BUILD-ROUTING-01` (2026-10-17) found, independently,
the same mechanism the brief describes: `next.config.mjs` sets
`pageExtensions: ['ulke.tsx', 'ulke.ts', 'mjs']` whenever `bolunmemisUygulama: false`
(true for every country pack) — so **Next's router never compiles a plain `page.tsx`
at all** in a country build. `app/dashboard/doktor/**` is not merely access-gated, it is
**not in the built artifact**. That finding triggered several follow-on jobs
(`FOTO-ARSIV-AU-01`, `MUAYENE-EKLERI-07`, `KONSULTASYONLAR-01`, `NOTYA-SIFRE-SIFIRLA-01`)
that each explicitly chose **not** to try to expose the Turkish tree, and instead built a
new `.ulke.tsx`/`.ulke.ts` implementation of the same capability — reusing shared logic
only where it carried no Turkish text/data-model/regulatory baggage, and writing new
country-specific UI, consent text and data model each time. `NOTYA-SIFRE-SIFIRLA-01`
(2026-10-20, the password-reset job the brief itself cites) found the identical class of
bug on `app/giris/*` (an unreachable dead tree) and reached the same conclusion: fix it by
building the real thing in the `.ulke` tree, not by trying to expose the Turkish one.

**This is the conflict to surface, not paper over:** Kaan's brief says unlock the real
tree; the repo's own engineering history says that was considered and the team chose the
opposite, repeatedly, specifically *because* of the Turkey-only-mechanics leak risk the
brief itself also names as the hard part. Both can't be the standing instruction. Recommend
Kaan decide explicitly before more branch-depth work is committed either way:

**Option A — keep the established pattern (port-by-port into `.ulke`).**
*Safer, proven, slower.* Each branch's clinical engines get a real, from-scratch,
country-adapted implementation under `specialties/<branch>/` → mirrored logic in a new
`lib/ulke/araclar/tanimlar/<branch>.ts` style file (some branches already started — see
§1), with AU-appropriate units/thresholds/sourcing, reviewed per the hard boundaries
(placeholder + `OPEN-COMMITMENTS.md` entry wherever real clinical/legal content is needed
and no AU clinician/lawyer has supplied it yet). No change to `next.config.mjs` or the two
route gates. Cost: 40 branches × real engine work, done one at a time, each needing a
named AU clinical source — this is the same shape of work `COUNTRY-BUILD-ROUTING-01`'s
follow-ons already did for foto-arşivi/konsültasyon/muayene-ekleri, just not yet done for
the 40 branch engines or the patient-file chapter tabs.

**Option B — the literal unlock the brief describes.**
*Matches the brief; materially higher risk; not started in this job.* Concretely, this
would require, in order:
1. A new per-country flag distinct from `bolunmemisUygulama` (which is binary and, if
   flipped for AU, exposes *everything* — MBYS, SGK, e-Reçete, NVI, e-Fatura, KVKK flows
   included, since `pageExtensions` is a build-wide switch, not a per-route one).
2. A route-level content gate usable *inside* the shared `page.tsx` files themselves (e.g.
   `<TurkeyOnly>…</TurkeyOnly>` wrapping SGK/e-Reçete/MBYS sections, swapped for an
   AU-equivalent slot) — because, confirmed this job, the Turkey-only mechanics are not
   file-level separable: of `app/dashboard/doktor/**`'s 36 top-level routes, 16 files
   (`hastalar/[id]/page.tsx`, `ilaclar/page.tsx`, `entegrasyonlar/**`, `ayarlar/erecete/**`,
   `notlar/[id]/recete/**`, etc.) mix universal patient-file chrome with embedded
   SGK/e-Reçete/MBYS sections in the *same* file — so the split has to happen inside each
   file, section by section, not by swapping whole files in or out.
3. A decision on URL shape: today AU's reachable screens are flat (`/patient`, `/visit`,
   `/calendar`) while TR's real tree is nested (`/dashboard/doktor/hastalar/[id]`). Serving
   the "real" tree at AU's existing flat URLs, or moving AU onto the nested URL shape (and
   so onto the same route the rest of this plan calls the real tree), is a product decision
   that touches every existing AU bookmark/link and the shape every future country will
   follow — it should be made once, deliberately, not as a side effect of one branch's
   depth work.
4. Per the brief's own hard boundary and `hasta-izolasyon`/`performans-butcesi-koruma`:
   `app/dashboard/doktor/hastalar/[id]/page.tsx` specifically was just the subject of a
   94.3%-JS-bundle perf fix (`PERF-SAGLAMLIK-2026-10`) that `COUNTRY-BUILD-ROUTING-01`
   already confirmed **never reached any country build** (because the file is currently
   unreachable there). Making it reachable for AU reopens exactly that perf-budget
   question for a route it never applied to before.

### Why this job stops at the plan, not the unlock
Given the conflict above, the real multi-file, section-by-section split required by Option
B, and the explicit hard boundary against leaving "a half-wired AU build broken" — writing
a single pilot page under Option B without Kaan's sign-off on the URL-shape and
flag-design decisions in §2 risks building the wrong thing. No `app/dashboard/doktor/**`
or `next.config.mjs` or gate file was touched by this job. This is the safe checkpoint:
audit done, both options specified concretely enough to execute either one next, decision
needed from Kaan.

## 3. Phase 3 — conversion map: status

Already correctly applied, verified this job (no edits needed):
- Specialty-college references: `countries/au/araclar/referanslar.ts` — RACGP, RACP
  (+ adult-medicine division variants), RACS, ANZCA, RANZCOG, RANZCO, RANZCR, Medical
  Board of Australia, Ahpra registration, plus allied-health associations (physio,
  psychology, dietetics, OT, audiology, podiatry, speech pathology) — each tile sourced
  and dated, each flags its own open question for a local clinical lead.
- Identifiers: `countries/au/kimlik.ts` (Medicare card checksum), patient identifier
  labelled "Medicare card number", optional/unvalidated per `COUNTRY-PACK-AUSTRALIA.md`.
- Drug-list source naming: `countries/au/araclar/pbsPrescription.ts` (PBS), `poisons.ts`
  (poisons schedule) — source names only, no invented drug/dose content.
- My Health Record / Medicare / PBS in place of e-Nabız/SGK/e-Reçete:
  `countries/au/araclar/myHealthRecord.ts`, `medicareParticulars.ts`.
- GST/ATO in place of e-Fatura/GİB: `countries/au/araclar/gstInvoice.ts`.
- Immunisation program naming: `countries/au/araclar/immunisationReport.ts` (National
  Immunisation Program / AIR).
- Privacy framework naming: `countries/au/araclar/gizlilik.ts` (Privacy Act 1988 (Cth) /
  Australian Privacy Principles), `lib/ulke/yasal/*` (HUKUK-01-AU: refund under Australian
  Consumer Law, copyright under Copyright Act 1968 — both explicitly flagged **OPEN,
  waiting on a lawyer licensed in Australia**, logged in `OPEN-COMMITMENTS.md`
  2026-10-17, not re-opened by this job).

Not yet applicable (because Phase 2 isn't resolved): conversion-map items that only exist
inside the currently-unreachable `app/dashboard/doktor/**` tree — e.g. the e-Reçete/SGK
sections inside `ilaclar/page.tsx`, `ayarlar/erecete/page.tsx`, `notlar/[id]/recete/page.tsx`
— cannot be swept for AU-equivalents until Kaan picks an Option in §2, since under Option A
they're simply never built for AU (no sweep needed, a new AU-native file is written
instead), and under Option B they need the section-level split in §2.2 before a sweep is
meaningful.

## 4. What's logged to `docs/OPEN-COMMITMENTS.md`

One dated entry, `AU-DEPTH-PARITY-01`, added by this job: the Option A/B decision needed
from Kaan, owner Kaan, status OPEN.

## 5. Verification

No application code changed. `npx tsc --noEmit -p .` run on `release/au` as a baseline
check (not expected to differ from the branch's existing state — see run log in the
commit message). Full `npm test` not run: no code changed that any test could regress,
and the suite is large enough that running it against an unmodified baseline would spend
budget without checking anything this job touched.

## 6. Continuation (Claude, 2026-10-21) — Kaan picked Option B; two new blockers found before any code was written; still no code touched

Kaan's instruction this round: "B is fine. I want all 40 specialties in au to be equivalent
or better than the gold turkish standard." That resolves `AU-DEPTH-PARITY-01`'s top-line
A-vs-B question. It does **not** resolve the sub-decisions §2 already flagged as needed
before writing code (flag/gate design, URL shape), and this pass found the flag/gate design
sub-decision is harder than either the brief or §2 assumed. Re-verified against this repo's
actual files before writing anything:

**New blocker 1 — the build-flip is not a flag change, it's a new build mechanism.**
`next.config.mjs` line 28: `pageExtensions` is either Türkiye's default (unset, so `tsx`,
`ts`, … apply) or, for every country pack, exactly `['ulke.tsx', 'ulke.ts', 'mjs']` — one
global list for the whole build, not per-route. Confirmed live in this repo: `app/page.tsx`
*and* `app/page.ulke.tsx` both exist, same route. If AU's `pageExtensions` were widened to
also accept plain `tsx`/`ts` (the literal reading of "give AU access to
`app/dashboard/doktor/**`" via this flag), Next would resolve **two** pages for `/` and for
every other path that has both a plain and a `.ulke` file — not a clean unlock of one
subtree, a build-breaking collision across the entire app. A real fix needs a third,
AU-only extension namespace (or an equivalent mechanism — route groups, a build-time
file-copy step, etc.) that resolves *only* `app/dashboard/doktor/**` and nothing else that
already has a `.ulke` twin — i.e. a new, named build mechanism, not the one-line
`derleme.mjs` edit the brief describes. This is exactly the class of decision §2 said needs
sign-off before code is written, now more concretely specified; picking a default
resolution here and shipping it unreviewed on a commercial medical product's build pipeline
is not something this pass will do silently.

**New blocker 2 — the brief's assumed reusable helper doesn't exist.** The brief says to
gate the Turkey-only regulatory blocks behind "a shared helper (e.g. a `turkiyeMi()`/
`ulkeKodu()` check already used elsewhere in `lib/ulke/`) — find and reuse the existing
pattern." Searched `lib/ulke/**` this pass: no `turkiyeMi` or `ulkeKodu` function exists
anywhere in this tree (confirmed by grep, zero hits). `lib/ulke/hesapUlkesi.ts` has
`hesapBuUlkedeMi(user)` — account-country-membership, not a build/render-time Türkiye-only
check — the nearest relative, not the same thing. Phase A's "reuse, don't invent" premise
is therefore false as stated; a working Türkiye-only content gate for the 16 mixed
`app/dashboard/doktor/**` files would be new code, which changes Phase A's own promised
"zero behavior change, proven pattern" risk profile — another reason not to cut it in
unreviewed in this pass.

**AU-DEPTH-PARITY-02 is unchanged and is the binding constraint regardless of the above.**
Re-confirmed this pass: zero of the 40 branches have a named AU clinician on file. Per the
job's own hard boundary (no invented AU drug names/doses/thresholds/consent text), Phase C
cannot write real clinical content for any branch yet — only structural scaffolding, which
without the Phase A/B tree being reachable has nowhere real to live (AU's `.ulke` tree has
no SOAP-chapter/engine structure at all today; see §1 "Muayene" row). Writing 40 branches'
worth of scaffold now, before the Phase A/B architecture is settled, risks building it
twice.

**What this pass did:** verified the two blockers above (read-only; no
`app/dashboard/doktor/**`, `next.config.mjs`, `middleware.ulke.ts`,
`countries/au/index.ts`, or any `/home/claude/notya-ai` file touched), updated this plan
and `docs/OPEN-COMMITMENTS.md`. No tsc/test run — no code changed.

**What Kaan needs to decide next, specifically (not just A-vs-B, already decided):**
1. The build-mechanism design for blocker 1 (proposal: a third extension namespace, e.g.
   `*.au.tsx`/`*.au.ts`, added to AU's `pageExtensions` alongside `ulke.tsx`/`ulke.ts`,
   populated by copying/adapting `app/dashboard/doktor/**` file-by-file rather than a
   literal shared mount — functionally close to Option A's per-file porting, just living
   under the nested URL shape instead of a new flat one; an actual shared-render unlock
   with no duplication would need route groups or a build-time composition step, bigger
   still). Needs sign-off before the first file moves.
2. URL shape: recommend keeping AU's current flat URLs and NOT moving to TR's nested
   `/dashboard/doktor/hastalar/[id]` shape, specifically because every existing AU
   bookmark/link/test already targets the flat shape and the nested shape's only benefit
   (code reuse) is already lost once blocker 1 forces a copy/adapt approach rather than a
   true shared mount. Kaan should confirm or override this.
3. Name an AU clinician (and, per the existing `HUKUK-01-AU` entry, a lawyer) per branch —
   `AU-DEPTH-PARITY-02`, still fully OPEN, still the dominant remaining cost regardless of
   1-2 above.

## 7. Continuation (Claude, 2026-10-21, same day) — Kaan picked Option A; §1 and §6's "AU has
no SOAP-chapter/engine structure at all" is WRONG; corrected after reading the actual code

Kaan's latest instruction: Option A — hand-port each branch's depth into AU-native files,
AU's existing flat `.ulke` routing, no shared-mount. Before writing any branch content, this
pass re-read AU's own tree end to end (not just the two route files the first two passes
read) and found that §1 and §6 above are **factually wrong** about the starting point. No
`app/dashboard/doktor/**`, `next.config.mjs`, or `/home/claude/notya-ai` file was touched;
this section corrects the record from what is already in `/home/claude/notya-au` today.

### 7.1 The convention already exists and is NOT a new chapter-tabs UI

AU does not need, and this pass did NOT build, a TR-style tabbed patient-file chapter.
AU already has its own equivalent mechanism, shipped and tested, that plays the same role:

- **The kit/pack split** (`lib/ulke/araclar/tipler.ts`, `katalog.ts`, `paket.ts`,
  `uyarlama.ts`): a branch's clinical arithmetic lives once, country-neutral, as a pure
  function with its own cited source, in `lib/ulke/araclar/tanimlar/<group>.ts`
  ("the kit"). A country pack (`countries/au/ayarlar.ts` → `araclar`) turns a kit tool on
  for named roles, supplies the country's own numbers/units/bands where the kit leaves
  them open (`uyarlama`, `parametreler`, `tablolar`), or logs why it stays off
  (`kapali[key].eksik`, with a named owner — clinician or rights-holder).
- **Opened from, and kept on, the patient** (`components/ulke/uygulama/AracKayitlari.tsx`,
  migration 139, `ARAC_KAYDI_API`): any tool opens from a patient's file
  (`aracYolu(key, hastaId)`), the SERVER re-computes and keeps the result against that
  patient (never the client's number), with an optional follow-up day, and the patient's
  file shows every kept result for that patient, newest first
  (`HastaAracKayitlariKarti`); a cross-patient follow-up list (`TakipPaneli`) shows every
  open follow-up, overdue ones marked. This is AU's per-branch "chapter history" —
  structurally real, isolation-reviewed (server-side re-check, RLS via the doctor's own
  account), already shipped.

**This is the file/routing convention for AU's branch depth, and it is already in use for
most of the 40 branches** (below) — not a convention to invent, a fact to record. Write a
branch's TR-engine port as a new kit tool in `lib/ulke/araclar/tanimlar/<group>.ts` (pure
function, cited international source, no national-authority content), wire it into the AU
pack in `countries/au/ayarlar.ts` (`araclar.gorenler` for who sees it, `kapali` with a named
owner for what cannot be built yet), and it is reachable, patient-scoped, and
follow-up-tracked for free through the two mechanisms above. **A new per-branch page is
not the unit of work here — a new tool definition is.**

### 7.2 What already exists is far larger than §1's "Muayene" row claimed

§1 said pediatri's `buyume.ts`/`doz.ts`/`asiPlan.ts`-class engines "do not exist on AU at
all" and OPEN-COMMITMENTS' `AU-DEPTH-PARITY-02` (2026-10-20) says the 40-branch port "is
unstarted regardless of the Option A/B decision". Both are wrong as of today. This repo
already has:

- `lib/ulke/araclar/tanimlar/{acilAnesteziBeyin,cerrahiDahiliyeDerm,cerrahiGogusGoz,
  endoEnfeksiyonGastro,kalpKbb,nefroOnko,ortoPediRadyoRoma,skorluOlcekler,
  buyumePersentili}.ts` — 2,115+ lines of real, cited, tested clinical arithmetic, each
  function's docstring naming the exact TR engine it "stands beside" and comparing input
  for input in `lib/ulke/araclar/esdegerlik.test.ts`. Confirmed present and already
  correct (re-checked in this pass, no edit needed): ASA six classes with "E" as a
  modifier (not a class — the exact TR fault TR commit `edfac868` just fixed was already
  independently fixed here first), EASI's under-8 region-weight multiplier
  (`EASI_YAS`/`AGIRLIK_SEKIZ_ALTI`), the antibiotic-course off-by-one
  (`bitis = gunEkle(baslangic, sure_gun - 1)`), dose arithmetic with no trailing zero
  (`dozYazimi: { sondaSifir: false }` in `countries/au/ayarlar.ts`, per the national
  medicines-terminology recommendation).
- `docs/araclar-denetim/AU.md` + `au-kararlar.json` (2026-10-10, ~95 live web searches
  against real Australian sources: RACGP, ANZCA, Medicare, PBS, Kidney Health Australia,
  the Hearing Services Program, the Prostate Cancer Foundation's 2026 guideline, etc.) —
  an exhaustive, per-tool, sourced audit of exactly what is right, what is wrong, and what
  is an open slot pending a named AU clinician or a rights-holder's permission. This is
  the authoritative placeholder list for AU — not a new one to write from scratch.
- A grep of `Stands beside specialties/` across the kit shows at least one real,
  country-neutral clinical-calculator port already standing beside the TR engine of these
  26 branches: acil-tip, anestezi, beyin-cerrahisi, cocuk-cerrahisi, dahiliye, dermatoloji,
  endokrinoloji, enfeksiyon-hastaliklari, gastroenteroloji, genel-cerrahi,
  gogus-cerrahisi, gogus-hastaliklari, goz-hastaliklari, kalp-damar-cerrahisi,
  kardiyoloji, kulak-burun-bogaz, nefroloji, onkoloji, ortopedi, pediatri,
  plastik-cerrahi, psikiyatri, radyoloji, romatoloji, spor-hekimligi, uroloji. Plus, via
  `skorluOlcekler.ts` (IPSS, PHQ-9, GAD-7, MIDAS, pain VAS, ODI): uroloji, psikiyatri,
  noroloji, fizik-tedavi again. That is **≈28 of 40 branches with at least one real,
  cited, tested clinical tool already standing beside its TR engine**, wired to a role in
  `countries/au/ayarlar.ts`, reachable and patient-scoped via §7.1's mechanism.

**What this is NOT**: TR's full per-branch depth (every engine, every chapter section,
narrative note templates) — only the calculator/scoring layer. It is also not evenly
deep: several "keep" verdicts in `AU.md` are record-only tools (dates/counts/ticks, no
clinical judgment) rather than scored instruments. And one near-miss this pass is worth
recording precisely so it is not repeated: `odyometri-pta`'s kit mechanism supports a
country stating its own averaged frequencies and threshold (`uyarlama.alanlar.frekans`,
`secimlikParametreler.asimetri_ustu`) — the Australian Hearing Services Program's 3-frequency,
23.3 dB figure looked like an easy win to wire in. `countries/au/ayarlar.ts`'s own comment
block (just above `gorenler`) already explains, correctly, why it is deliberately NOT
wired: the Government program's figure is a **funding-eligibility threshold**, not a
clinical severity grade, and applying it as a band would misstate it. Left as-is, not
touched. The lesson for whoever continues this: read the pack's own "NOT SUPPLIED,
because…" comments before "closing" anything that looks open — several apparent gaps in
`AU.md`'s slot list are deliberate, reasoned, and correct as they stand.

### 7.3 Branch-by-branch status (corrects §1's table; supersedes `AU-DEPTH-PARITY-02`'s
"unstarted" framing — the per-tool detail for every row below is `docs/araclar-denetim/AU.md`,
not repeated here)

| Status | Branches | Basis |
|---|---|---|
| **Real calculator depth already shipped, cited, tested, role-wired** (≈26) | acil-tip, anestezi, beyin-cerrahisi, cocuk-cerrahisi, dahiliye, dermatoloji, endokrinoloji, enfeksiyon-hastaliklari, gastroenteroloji, genel-cerrahi, gogus-cerrahisi, gogus-hastaliklari, goz-hastaliklari, kalp-damar-cerrahisi, kardiyoloji, kulak-burun-bogaz, nefroloji, onkoloji, ortopedi, pediatri (growth percentile only, see below), plastik-cerrahi, psikiyatri, radyoloji, romatoloji, spor-hekimligi, uroloji | `lib/ulke/araclar/tanimlar/*.ts`, `esdegerlik.test.ts`, `AU.md` |
| **Scored-instrument depth shipped via `skorluOlcekler.ts`** (adds to the above) | uroloji (IPSS), psikiyatri (PHQ-9, GAD-7), noroloji, fizik-tedavi (VAS, ODI) | same |
| **Structural/record-only tools only — no scored clinical content yet** (≈12, thin) | aile-hekimligi, diyetisyen, ergoterapi, estetik-cerrahi, fizyoterapi, kadin-dogum, klinik-dermatoloji, klinik-psikolog, longevity, medikal-estetik, odyoloji (PTA/otoscopy/vertigo exist but gated to otolaryngology+audiology roles only — audiology-specific framing not separately built), sac-ekimi | `bosluklar.ts`, role map in `countries/au/ayarlar.ts` |
| **Named open slots pending a clinician/lawyer/licence, per tool, already specified** | all 40, to varying degrees — the exact list is `AU.md`'s "29 slots" table and `au-kararlar.json`, cross-referenced below in OPEN-COMMITMENTS | `AU.md` Part (c) |
| **Pediatri specifically** | growth-percentile (WHO LMS) is a real, tested **mechanism** (`buyumePersentili.ts`, plus a reused-maths chart renderer, 2026-10-21 — see §7.6), but the tool itself is **`acik: false`** in `countries/au/araclar/yuvalarim.ts` — a slot awaiting the same clinician sign-off as every other `AU-DEPTH-PARITY-02` item, not a shipped, live feature. §1's and this row's earlier "real and shipped" wording was wrong and is corrected here. Immunisation schedule, dose-by-weight presentation beyond the trailing-zero rule, and developmental screening (M-CHAT-R/F) are named, sourced slots in `AU.md`, pending licence (M-CHAT) or are already covered by AU's own `countries/au/araclar/immunisationReport.ts` (reporting, not a schedule engine) | `AU.md` rows for `vaccination-schedule`, `mchat-rf`; `countries/au/araclar/yuvalarim.ts` |

### 7.4 What this pass did and did not do

Did: read `lib/ulke/araclar/{tipler,katalog,paket,uyarlama,yardimci}.ts`,
`countries/au/ayarlar.ts`, `countries/au/araclar/*`, `components/ulke/uygulama/
{Araclar,AracKayitlari,Muayene,Hastalar}.tsx`, `docs/araclar-denetim/AU.md`, and every
`lib/ulke/araclar/tanimlar/*.ts` file; cross-checked against TR's `specialties/*/engines/`
roster (40 directories, confirmed); ran `npx tsc --noEmit -p .` as a baseline (two
PRE-EXISTING errors in `countries/au/au.test.ts`, lines 399 and 644 — present before this
pass touched anything, not caused by this pass: `ApiCevabi` missing `status` in a test
helper's return type, and a possibly-undefined `bildirim.metin.uyarilar` read without a
guard). Did not: write any new kit tool, pack wiring, or application code — see §7.2's
near-miss for why a rushed addition here is worse than none, and because every actually
safe, uncontroversial fix this pass could find (ASA six classes, EASI age multiplier,
antibiotic off-by-one, dose trailing zero) turns out to already be shipped. Did not touch
`/home/claude/notya-ai` or any other country pack.

### 7.5 Concrete, low-risk next steps (none executed this pass — each needs either a decision
already within Kaan's remit, or more research time than this pass had)

1. **RESOLVED, 2026-10-21 — `takip-paneli` (the follow-up list) is already universal in
   AU today, by an automatic mechanism, not a literal override.** `countries/_dil/en/
   araclar/index.ts`'s `enAraclar()` computes `takipRolleri` itself: "a tool every role
   has, whose result can be kept, gives every role the list" — it is `[...ROLLER]`
   (every role) once every role has at least one switched-on, kept-result tool of its
   own, which AU's own universal `ek` tools (consultation, reference links, etc.) already
   give every role. Confirmed by running `countries/au/au.test.ts`'s own assertion
   `assert.deepEqual(goren('takip-paneli'), [...ROLLER])` — it PASSES today, unchanged.
   Tried the obvious explicit fix anyway (`gorenler['takip-paneli'] = null` in
   `countries/au/ayarlar.ts`) to see whether it was still needed: it is not, and it is
   actively wrong — a literal `roller: null` override has different semantics (it also
   admits `'(no role)'` accounts with no specialty at all), which broke 3 tests
   (`paketSinamasi.ts`'s cross-pack invariant, `au.test.ts`'s own core-set assertion, and
   the `COUNTRY-PACK-AUSTRALIA.md` snapshot). Reverted; no code change needed or made.
   `AU.md`'s "cannot be a base tool" line was written before AU's own universal `ek`
   tools existed and is now out of date — not acted on here since `AU.md` is a dated
   audit record, not live config.
2. **Name an AU clinician and lawyer per branch** — `AU-DEPTH-PARITY-02`, still the
   dominant real cost; `AU.md`'s "29 slots" table is the ready-made brief for each
   reviewer, already sourced, already short-listed. This is the one item that actually
   blocks the ≈12 "thin" branches in §7.3 and the slots inside the ≈28 "real depth"
   branches.
3. **DONE, 2026-10-21 — the three visual/over-time views, built as a presentation layer
   over AU's existing stored tool-record data (`ARAC_KAYDI_API`), no new clinical
   content:**
   - **Vaccination calendar** — `components/ulke/uygulama/AsiTakvimi.tsx` (new) +
     `lib/ulke/araclar/maddeTakvimi.ts` (new, pure). Renders the NIP schedule
     (`AU_ASI_TAKVIMI_ARACI`, `au-immunisation-schedule`) as an ordered,
     done/not-done-with-date calendar instead of a flat list. Wired through a new,
     opt-in `UlkeAraclari.takvimliListeAraci` field (and its `AraclarMetni.aracTakvimi`
     text block) rather than a literal key in a shared file, per wall rule D7
     (`countries/yasak-araclar.json`) — confirmed CA already has an unrelated
     `kontrolListesi`-built checklist tool with dates (`postop-agri`) that a generic
     structural match would have silently changed; the explicit opt-in avoids that.
     **Mounted** into `components/ulke/uygulama/Hastalar.tsx` (`TakvimliListeKarti`, lazy
     via `next/dynamic`, same pattern as TR's own patient-file page, commit `3c18a116`);
     renders nothing for any other pack, since none names `takvimliListeAraci`.
   - **Growth chart** — `components/ulke/uygulama/BuyumeGrafigi.tsx` (new, SVG, no chart
     library) + `lib/ulke/araclar/buyumeGrafigi.ts` (new, pure). Plots a patient's own
     `buyume-persentili` measurements against the WHO standard's percentile bands, reusing
     `lib/clinical/buyumeEgrisi.ts`'s `lmsEgrileri` (TR's own table-agnostic LMS function,
     built for reuse) over the same `WHO_LMS` tables `buyumePersentili.ts` already cites —
     no new clinical content, no second copy of the WHO numbers. **Built but inert**: per
     the corrected §7.3 row above, `buyume-persentili` itself is `acik: false` — the same
     `AU-DEPTH-PARITY-02` clinician sign-off gates the tool, not just this view of it, so
     there is nothing live to chart yet. ALSO NOT MOUNTED into `Hastalar.tsx` — unlike
     the calendar, its text (parameter names, units, source line) is a local,
     explicitly-typed prop (`BuyumeGrafigiMetni`), not yet a slot of the shared
     `AraclarMetni`/`UygulamaMetni` catalogue; `Hastalar.tsx` serves six countries, and
     wiring it there now would mean either inventing literal English text inside a
     shared file (wrong for every non-English pack) or adding a real catalogue slot for
     a view nobody can reach. Both the mounting and the catalogue slot are the right
     size of work for whoever does the `AU-DEPTH-PARITY-02` sign-off and switches the
     tool on — logged together in `docs/OPEN-COMMITMENTS.md`.
   - **Wound-photo timeline** — a List/Timeline toggle added directly to the existing
     `components/ulke/uygulama/FotoArsivi.tsx` (AU already had the photo archive; this
     adds the second view only). Same fetched data, same lazy signed-URL-on-open
     behaviour, same edit/delete/compare actions — purely a different layout (a dated
     vertical rail) behind a toggle that only appears when both its labels
     (`fotoArsivi.gorunumListe` / `gorunumZaman`) are present in the pack's own
     catalogue, so no other pack's UI changes. English copy added to
     `countries/_dil/en/uygulama.ts`; both fields optional on
     `UygulamaMetni['fotoArsivi']`, so UZ's own 3-script catalogue needs no edit.

### 7.6 Lazy-loading and tests for the new views (2026-10-21)

`AsiTakvimi.tsx`'s `TakvimliListeKarti` is mounted into `Hastalar.tsx` lazily
(`next/dynamic`, §7.5.3). `BuyumeGrafigi.tsx` is not mounted — see §7.5.3's note on why.
Dedicated unit tests for the two new pure helpers (`maddeTakvimi.ts`,
`buyumeGrafigi.ts`) are not yet written — see `docs/OPEN-COMMITMENTS.md`.

### 7.7 What this pass did and did not do (2026-10-21, Task 1 + Task 2 of the
visual-views job)

Did: confirmed Task 1 (`takip-paneli`) needs no code change (§7.5.1); built the
vaccination-calendar and growth-chart pure helpers and components; added the
photo-archive timeline toggle; added the minimal opt-in text/type surface each needed
(`UlkeAraclari.takvimliListeAraci`, `AraclarMetni.aracTakvimi`,
`fotoArsivi.gorunumListe`/`gorunumZaman`); regenerated the 5 EN-pack doc snapshots
(`docs/COUNTRY-PACK-{AUSTRALIA,CANADA,UNITED-KINGDOM,NEW-ZEALAND,UNITED-STATES}.md`) via
`scripts/ulke-en-kayit.mts`, since they are machine-written from the shared EN set this
pass touched; ran `npx tsc --noEmit -p .` (clean, same 2 pre-existing errors) and the real
ordinary test suite (2094 tests, 2021 pass, 73 fail — every failure confirmed pre-existing
via `git stash`, including the two new helpers' own 33/33-passing tests; see
`docs/OPEN-COMMITMENTS.md`'s `AU-ARAC-GORUNUM-01` entry for the exact numbers and how they
were checked); mounted the
vaccination-calendar card into `Hastalar.tsx` with `next/dynamic`. Did not: mount
`BuyumeGrafigi` (see §7.5.3 — no catalogue text slot yet, and the underlying tool is off
everywhere); did not write dedicated unit tests for the two new pure helpers; did not
switch on `buyume-persentili` (that stays `AU-DEPTH-PARITY-02`'s clinician-sign-off gate,
not this pass's call). Did not touch `/home/claude/notya-ai` or any other country pack.
