---
name: specialty-hasta-portali
description: >-
  Architects and builds specialty-specific Sağlığım (hasta portal) modules on a
  shared core shell. Use when adding or refactoring a patient portal for any
  specialty (pediatri, dermatoloji, KD/jinekoloji, dahiliye, göz, or next
  chapters), when portal nav/views leak across practices, or when a specialty
  build includes "hasta portalı". Core values stay universal; section UI and
  data must be specialty-specific via the registry — never one generic portal
  for every branş.
---

# Specialty-specific Hasta Portalı (Sağlığım)

Boss rule (verbatim intent): pediatrik hasta portalı ve göz doktorunun hasta portalı aynı olamaz. Core value’lar aynı olur; the rest should be section specific. Bundan sonraki specialty’lerde de hasta portalları specialty’ye göre olsun.

Boss rule (2026-09-17): **Each hasta portalı must be unique** — show information that pertains to the specialty in hand and that is useful for that practice’s patients. Universal chrome changes apply to **all ~29 specialties**; Göz-only (or KD/derm/…) clinical content stays in that chapter. See `specialty-universal-vs-chapter`.

## Verdict in one line

**One shell. Many chapters.** Shared trust + messaging + visits + results + meds + history. Everything clinical-facing beyond that is declared per `SpecialtyProfile` and mounted only when that practice (or that patient’s active chapter data) qualifies. **Pediatri portal ≠ göz portal ≠ KD portal ≠ dahiliye portal ≠ derm portal.**

## Core (universal — never fork)

Keep identical across all specialties:

| Surface | Why universal |
|---------|----------------|
| PIN gate + token expiry | Security / KVKK |
| Brand: the DOCTOR's (logo → photo → monogram, name, “Sağlığım” quieter; Notya only “Notya altyapısıyla” in the footer) — see § Hekim önce marka | Trust |
| Mesajlar (compose + practice reply + e-mail notify, no body in mail) | Care continuity |
| Ziyaretler / Sonuçlar / İlaçlar / Öykü | Shared medical record spine |
| Footer: 112, KVKK, “acil değil” | Legal |
| No PHI on public demos / audit HTML | Safety |

Do **not** duplicate these per specialty. Do **not** invent a second portal product.

## Taban önce — Kaan 2026-11-25 (standing rule)

Kaan, verbatim: "We had the patient able to create a new appointment based on the doctor's calendar right in the hasta
portalı app. Also patients are able to send quick messages to the doktor on the portal. So in short I want all the
functionality of the old hasta portalı … and build the new stuff over and above the base functionality we already had built in."

- **The pre-Sağlığım portal (baseline `9163a02a`) is the BASE.** Its capabilities are never removed, re-pointed or demoted
  by a new feature: Randevu (booking from the doctor's calendar, when the doctor turned it on), Mesajlar (quick message to
  the doctor), Ziyaretler, Sonuçlar, İlaçlar, Öykü, Takip, chapter modules, the doctor card, the 48 h alert, the unread
  "Yeni mesajınız var!" emphasis.
- **New features are additive** — added after / below base items, never in their place or ahead of them.
- **Nav order lives in one place:** `lib/portal/navSirasi.ts` (Bugün · Randevu when open · base tabs · chapter modules ·
  daily-health-home pages). Do not hand-edit an order in a shell.
- **Bugün keeps the base actions first:** "Randevu al" (booking ON only) and "Doktoruma yaz" directly under the greeting,
  above the rings, also while the daily state loads or fails; booking state comes from HastaShell's context (no second
  request on the home).
- **Any demotion needs Kaan's explicit OK** for that change. Pinned by `lib/portal/tabanOnce.test.ts` (nav order, home
  actions on all 40 branşlar) and `lib/portal/tabanOnce-rota.test.ts` (booking → doctor's request list → approval;
  portal message → doctor's unread badge + inbox; cross-doctor isolation).

## Hekim önce marka — HASTA-ALANI-MARKA (Kaan, 2026-11-25, standing)

Kaan: "Hasta portalını doktorun bir ek servisi olarak lanse etmemiz iyi olur … it should be brought to you by the doctor,
not brought to you by the Notya company."

- **One resolved brand** (`lib/portal/marka.ts › markaCoz`) drives every patient surface: header (`HekimMarkasi ›
  MarkaBasligi` through `PortalKabukGorunumu.markaBasligi`), PIN / loading / old-link screens (`MarkaKarsilama`), tab
  title, PWA manifest + per-link icon (`/marka/ikon`), link preview (`opengraph-image.tsx`), patient push title + icon,
  the "Dr. X sizi … davet ediyor" invite. Mark order: the doctor's logo (Notya Klinik: the clinic's logo first, clinic
  name leads, treating doctor underneath) → his profile photo (unless switched off) → monogram in an accent from the
  fixed accessible list. Never a Notya mark in a header, a title, an icon or a push.
- **Notya appears only** as `NOTYA_ALTYAPI` ("Notya altyapısıyla") at the end of the footer / PIN screen, and in legal
  text where it is correct: the doctor (or clinic) is the KVKK data controller, Notya the processor — never weaken it.
- **Brand is read on the server** (`lib/portal/markaSunucu.ts`, token layout; React cache + 5-min data cache): no request
  from the phone, no PHI, only the token's own doctor's rows. Do not move it into a client fetch.
- **Images**: logos only through the upload gate (`lib/portal/markaGorsel.ts`: PNG / JPEG / WebP by magic bytes, NO SVG,
  ≤ 2 MB, ≤ 1024 px, metadata stripped) into bucket `hasta-alani-marka` (<doctor_id>/ or klinik/<clinic_id>/,
  content-hashed); an outside image URL is never drawn on a patient's device (`guvenliGorselUrl`, `klinikLogoGuvenli`).
- Settings: Ayarlar › Hasta Alanı Görünümü (`components/doktor/HastaAlaniGorunumuAyarlari.tsx`, the SAME lockup in its
  preview); Notya Klinik › Ayarlar uses it with `klinikModu`. Demo: `/portal/demo?marka=logo|foto|monogram|klinik`,
  `&ekran=pin` (fictional brands, `lib/portal/demoMarka.ts`).
- Pinned by `lib/portal/marka.test.ts` (order, names, contrast, no "Notya" in the header / PIN on all 40 branşlar, KVKK
  footer intact), `lib/portal/markaGorsel.test.ts` (gate), `lib/portal/markaIzolasyon.test.ts` (cross-doctor rows + files).

## Background photos — one map, child rule (SAGLIGIM-ZEMIN, Kaan 2026-11-25, standing)

- Every portal page has a soft, faded full-page photo behind it (`PortalKabukGorunumu` layer). Which photo is decided in
  ONE place, `lib/portal/zemin.ts`, by the PAGE (nav key) — never by branş, never in a page component. Calm, people-free
  scenes behind dense pages; no face ever behind a page title (crop or blur the photo in `scripts/portal-zemin-uret.cjs`).
- **Child rule:** a photo with a baby or child is never shown to an adult patient or on an adult branş page — only on the
  pediatric pages (pediatri / çocuk cerrahisi modules) AND only when `hasta.onSekizAlti === true`; unknown age = adult.
  Pinned by `lib/portal/zemin.test.ts` (all 40 branşlar).
- Budget: desktop AVIF ≤ ~120 kB, phone ≤ ~50 kB; the layer is never in the server markup (after hydration, Save-Data /
  reduced-data aware).

## Daily health home — "Bugün" (core, HASTA-PORTALI-GUNLUK, Kaan 2026-11-24)

The portal home is the daily health home: doses (Aldım / Atladım / Ertele), one-tap readings, the day rings (BUGUN-V2:
İlaç / Ölçüm / Hedef + ONE next step above the fold; display helpers in `lib/saglikEvi/bugunGorunum.ts`), trends,
Sağlık Karnesi + badges, Kontrol Öncesi Özet, the doctor's Ev verisi card + Fısıltı. It is CORE for all 40 branşlar —
what differs per branş is DATA in `lib/saglikEvi/bransAyari.ts` (which measurements / badges / cards, measurement-led
vs adherence-led). A new chapter adds or adjusts its row there; it never forks the screens. Branş-only pieces stay gated
there (fever-medicine card: pediatri / çocuk cerrahisi; pregnancy thresholds: KD + active pregnancy; LDL card:
cardiometabolic). Shared views: `components/doktor/portal/saglikEvi/*` (words from `lib/saglikEvi/sozler.ts`, one look
in every country). Rules: no diagnosis, no dose advice, 112 on every acil level, KVKK consent gates everything the doctor
sees. Phase 2 modules: `docs/OPEN-COMMITMENTS.md` § HASTA-PORTALI-GUNLUK.

**Per-patient modules (HASTA-MODULLERI, Kaan 2026-11-24):** which measurements / cards are ON is resolved PER PATIENT by
`lib/saglikEvi/moduller.ts` — doctor's switches (Ev verisi › Modüller) > chronic list / ICD-10 of approved notes / active
approved drugs (conservative; only measurements the branş row lists) > the patient's own optional additions / removal of
branş-only modules (Tercihler › Takip ettiklerim) > the branş row as fallback. Never add a "show glucose" branch in a view:
every downstream piece (tiles, ring goal, trends, rules, badges, karne, Özet, doctor tiles) reads the resolver's result.

**Alert colours + acil glucose (UYARI-RENKLERI / EV-ACIL-SEKER / HEKIM-PUSH, Kaan 2026-11-25, standing):** one semantic
palette for every warning, patient AND doctor side — clinical readings acil red / hekime bildir coral / dikkat amber (solid
mark), adherence lapses (missed dose / aşı / measurement, kritik medicine unmarked, karne low grades) calm slate with a dashed
mark, never red; never colour alone (word + icon). Tokens `UYARI_RENK` (lib/doktor/chromeRenk.ts, mirrored in
saglik-evi.css), semantics lib/saglikEvi/uyariRenkleri.ts, mark components/doktor/saglikEvi/UyariIsareti.tsx — a view never
picks its own red. Glucose ≥ 400 mg/dL or a meter "HI" is acil (symptom check + 112; ketone line with an active insulin; no
dose words); HI / LO are flags (`ev_olcumleri.isaret`, deger null), never averaged. acil / hekime_bildir alerts also push to
the doctor's phone (lib/saglikEvi/hekimBildirim*.ts — no PHI on the lock screen). Pinned by lib/saglikEvi/evAcil.test.ts,
hekimPush.test.ts, uyariRenkleri.test.ts.

## Branş signature modules — BRANS-PAKETI (Kaan, 2026-11-27, standing)

Kaan: "Diyetisyen için yapacağın hasta portalını bütün branşlar için gerektiği şekilde yap. Özel branşlar için de bunu
yapman şart." A branş page must be something the patient opens daily or at each step of care — not a list of dates.

- **One registry** `lib/portal/bransPaketi.ts` (+ data `lib/portal/paket/*.ts`), shared module KINDS (zaman, liste,
  gunluk, foto, program, hatirlatma, biyobelirtec, tabak, plan, tarama, ilac-saati), ONE view
  `components/doktor/portal/bransPaketi/BransPaketiView.tsx` (words in `PAKET_SOZLER`) rendered UNDER the existing branş
  page (Taban önce). Phase 1 = the 10 Özel Branşlar; Phase 2 (2026-11-27) = the 30 medical branşlar (`lib/portal/paket/tibbi*.ts`,
  `PAKET_YOLU` = the branş's existing chapter page; pediatri / KD on Takip). Every package also feeds the Bugün "today"
  card (`BransPaketiBugunKarti`, lean `?bugun=1`, after the base actions and alerts) and the doctor's patient-file tile
  (`components/doktor/bransPaketi/PaketKarti.tsx`, `?ozet=1`). Templates: Ayarlar › Hasta alanı paketi (medical) /
  Özel Branşlar › Hasta alanı paketi — same component. Don't repeat a Bugün measurement (BP, glucose, weight, fever) in a
  package diary — point to Bugün. Danger-sign diary fields are grouped by the payload's `isaret` (level only).
  Procedure-bound modules (`baslangicGerekli`, `baslangicModulu`, `sonGun`) open on the doctor-entered date and close after
  recovery; pre-procedure timelines use negative days; fasting hours are the doctor's settings, never template text.
- **Nothing reaches a patient before the treating professional accepts the template** (Özel Branşlar › Hasta alanı
  paketi; `brans_paket_sablon.kabul_at` + history). Edits: timeline / list / photo angles / note only — never a dose;
  diary fields and red flags stay the registry's.
- Per patient: professional switch (on / off / default) > condition rule (diagnosis / ICD-10 / medicine on file) >
  default; age gate (child modules only under 18, veli wording). Leak gate `modulBransaAitMi` on every route.
- Red flags → `ev_uyarilar` (+ doctor push); every acil line says 112. Screening (SCOFF) score never to the patient
  (`paket-tarama:*` alerts are hidden from Bugün). Photos: private bucket `brans-paket-foto`, metadata stripped,
  per-module consent text, deletable by the patient.
- Data layer `lib/portal/bransPaketiSunucu.ts` (both scopes on every query), pure payload `lib/portal/bransPaketiYuk.ts`,
  demos `/portal/demo-diyetisyen`, `/portal/demo-sac-ekimi`, `/portal/demo-estetik-cerrahi` (`lib/portal/bransPaketiDemo.ts`).
- Pinned by `lib/portal/bransPaketi.test.ts`, `lib/portal/tibbiPaket.test.ts`, `lib/portal/bransPaketiIzolasyon.test.ts`,
  `lib/portal/bransPaketiPerf.test.ts`, `specialties/diyetisyen/tests/paket.test.ts`. Demos: `/portal/demo-paket/<branş>`.

## Specialty module (required for every chapter build)

Each specialty that is more than `baseline` **must** declare a portal module. Prefer extending `SpecialtyProfile` (see `lib/specialties/profile.ts`) rather than hardcoding `if (brans === …)` in `PortalShell` / `TrackingView` / the portal API.

### Contract shape (implemented 2026-09-17 — SAGLIGIM-PORTAL-REGISTRY #291)

Live code: `PortalModulu` in `lib/specialties/profile.ts` (`SpecialtyProfile.portal?: PortalModulu[]` — one chapter may own
several modules, e.g. KD `gebelik` + `jinekoloji`), resolver `lib/portal/moduller.ts` (`portalModulleri`, `portalModulAktif`),
bundle state `PortalBundle.portal = { moduller, nav }`. Resolver rules that go beyond the table below:

- A doctor whose chapter declares its **own** portal module never receives another chapter's *chart-data* modules
  (büyüme age rule, jine reminders, dahiliye ön anket). Baseline-branch doctors (aile hekimi, endokrin…) receive them only
  when that data exists.
- Gebeliğim follows an **active pregnancy record** for any practice (mixed care).
- Unknown `users.specialty` = baseline branch (not pediatri).
- `derinlik: 'Missing'` modules are declared for audits but mount nothing (none today — derm is Partial via Derim).

Tests to copy for a new chapter: `lib/portal/moduller.test.ts` (eligibility matrix), `lib/portal/gozlerim.test.ts`
(no diagnosis words, route gated by `modulAktif`), and a smoke that opens the portal bundle through the PIN gate.

Original target sketch:

```ts
portal: {
  /** Extra nav keys beyond core — only these appear for this practice */
  nav: Array<{ key: string; label: string; path: string }>
  /** Bundle extensions (typed); null when ineligible */
  bundleKeys: string[]
  /** When to attach module data */
  eligibility: 'doctor_specialty' | 'patient_active_record' | 'age_rule' | 'combined'
  /** Patient-facing copy overrides (labels, empty states) — no clinical diagnosis language */
  copyHints: string[]
  /** Component ids mounted under Takip / dedicated routes */
  views: string[]
}
```

### Eligibility rules (non-negotiable)

| Specialty | Show when | Never show |
|-----------|-----------|------------|
| **Pediatri** | Doctor specialty is pediatri **or** patient age qualifies + büyüme data | Adult-only göz / jine / dahiliye chronic cards as primary home |
| **KD / Jinekoloji** | Active gebelik → Gebeliğim; jine reminders when KD chart data exists | Büyüme eğrileri as default; göz VA/GİB trends |
| **Dahiliye** | Doctor specialty dahiliye → ön anket, ev KB/glukoz, hedef kart özeti | Pediatri büyüme; Gebeliğim unless truly active pregnancy on chart |
| **Dermatoloji** | Doctor specialty dermatoloji → **Derim** (foto eklendi notices, MD-set kontrol/tedavi/lab hatırlatma, fototerapi seans tarihi — **no tanı**, no morfoloji/skor/doz) | Fundus/OCT; Neyzi curves; Gözlerim |
| **Göz** | Doctor specialty `goz-hastaliklari` → Gözlerim (VA/GİB trends, damla uyumu, enjeksiyon/kontrol hatırlatma, hasta-safe OCT/fundus “görüntü hazır” — **no tanı**) | Pediatri büyüme; Pap/HPV; HbA1c DM loop as home |
| **Next of ~29** | When chapter ships: unique module with that branş’s patient-useful surfaces | Other branş widgets |

Mixed-care edge (e.g. dahiliye patient with active pregnancy): attach **only** the modules whose eligibility fires; never dump every specialty’s widgets.

### What “unique + useful” means (content bar)

Ask: *What should this specialty’s patient see between visits?* Examples:

- Pediatri → büyüme / aşı / kontrol yaşı
- KD → Gebeliğim takvim / Pap·RİA hatırlatma
- Dahiliye → ön anket, ev KB/glukoz, hedef özeti
- Göz → Gözlerim (kontrol, damla, enjeksiyon, VA/GİB sayıları)
- Derm → Derim (foto yüklendi, kontrol/tedavi hatırlatma)

If the answer is “the same Takip page as everyone else,” the portal module is not done.

## Anti-patterns (current debt — do not extend)

Today Sağlığım is mostly one shell with **bolt-ons**:

- `PortalBundle.buyume` / `hedefBoy` → pediatri
- `PortalBundle.gebelik` / `jinekoloji` → KD
- `…/dahiliye-anket` → dahiliye
- Fixed `PortalShell` NAV for everyone

**Forbidden going forward:**

1. Adding another specialty’s fields as always-null noise on every bundle without a module registry.
2. Showing pediatri growth UI to a göz or derm patient by default.
3. One “Takip” page that stacks every specialty widget “just in case”.
4. Patient-facing diagnosis language (“glokomunuz kötüleşti”) — portal is reminders, trends, instructions, appointments; clinical judgment stays with the MD.
5. Copyrighted guideline text in the portal.

## Architecture wiring (where code lives)

| Layer | Path | Job |
|-------|------|-----|
| Profile | `lib/specialties/<key>.ts` + `registry.ts` | Declares `portal` module |
| Types | `lib/portal/types.ts` | Core bundle + optional specialty slices |
| API | `app/api/portal/hasta/[token]/route.ts` | Load core always; load specialty slices via registry eligibility |
| Shell | `app/portal/_components/PortalShell.tsx` | Core nav + **registry-driven** extra nav |
| Views | `app/portal/_components/<Specialty>Portal*.tsx` **or** `specialties/<slug>/ui/portal/*` | Section UI (Göz reference: `GozlerimView.tsx` + `/portal/hasta/[token]/gozlerim`) |
| Demo | `lib/portal/demoData.ts` + `/portal/demo` | Per-specialty demo fixtures when chapter ships (Göz: `SAGLIGIM_DEMO_GOZ` + `/portal/demo-goz`) |

Doctor tools mint link stays `/doktor-tools/hasta-portali` — one mint flow; content follows doctor specialty + patient records.

## Relationship to chapter builds (KD / derm / dahiliye / göz)

When building or deepening a specialty (same method as KD/Jine and dahiliye):

1. **Pre-sprint audit** via `specialty-audit-report` skill — include a **Hasta portalı** row (Strong/Partial/Thin/Missing).
2. **Doctor surface** (engines, SOAP lock, tabs, SGK) and **patient surface** (portal module) are **same sprint scope**, not a later nice-to-have.
3. Golden refs for TR practice stay in `lib/asistan/turkishSpecialtyRefs.ts` + chapter `manifest` / `protocols/sources` — portal never invents its own citation stack.
4. Citation display policy: TR legal floor (SB/TOD/TDD/…) first for patient-safe instructions; international texts are clinician-side depth only.

## Göz (ophthalmology) — portal expectations when that chapter ships

Patient-facing “Gözlerim” (names flexible, content not):

- Next kontrol / dilatasyon hatırlatması
- Damla rejimi (uyum checkbox / “biten şişe” — no dose invention)
- Anti-VEGF / enjeksiyon takvim hatırlatması (dates the MD set)
- Görme keskinliği / GİB trend **as recorded by clinic** (numbers only, no interpretation)
- “Görüntüleriniz yüklendi” for OCT/fundus — open viewer if product supports; **no AI tanı**
- Red-flag copy: ani görme kaybı / ağrı / flaş → 112 / acil — not portal message

Doctor-side chapter (separate but paired) owns VA/GİB bilateral entry, glokom/DR/katarakt engines, TOD/SB sources, SGK GİL/anti-VEGF rapor — portal only mirrors patient-safe outputs.

## Checklist (every specialty PR that touches portal)

```
- [ ] Core shell unchanged in behavior for other specialties
- [ ] New UI gated by registry eligibility (not global Takip clutter)
- [ ] Bundle fields typed; emptyBundle + demo updated
- [ ] No diagnosis language; no PHI in demos/audits
- [ ] Pediatri widgets absent for adult-only practices unless age_rule fires
- [ ] specialty-audit-report “Hasta portalı” depth row updated
- [ ] OPEN-COMMITMENTS / chapter README notes the portal module
```

## When this skill applies

- “Hasta portalı specialty’ye göre olsun”
- Building göz / next specialty chapters
- Refactoring `PortalShell`, `PortalBundle`, or portal API specialty branches
- Audit asks “is the patient portal practice-specific?”

Do **not** use this skill for mali/avukat portals (`/portal/mali`, `/portal/avukat`) — different products.
