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
| Brand: Notya · Sağlığım | Trust |
| Mesajlar (compose + practice reply + e-mail notify, no body in mail) | Care continuity |
| Ziyaretler / Sonuçlar / İlaçlar / Öykü | Shared medical record spine |
| Footer: 112, KVKK, “acil değil” | Legal |
| No PHI on public demos / audit HTML | Safety |

Do **not** duplicate these per specialty. Do **not** invent a second portal product.

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
