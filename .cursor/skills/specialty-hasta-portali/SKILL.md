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

## Verdict in one line

**One shell. Many chapters.** Shared trust + messaging + visits + results + meds + history. Everything clinical-facing beyond that is declared per `SpecialtyProfile` and mounted only when that practice (or that patient’s active chapter data) qualifies.

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

### Contract shape (target)

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
| **Dermatoloji** | Derm photo series / tedavi plan patient-safe summaries | Fundus/OCT; Neyzi curves |
| **Göz** | Doctor specialty `goz-hastaliklari` → Gözlerim (VA/GİB trends, damla uyumu, enjeksiyon/kontrol hatırlatma, hasta-safe OCT/fundus “görüntü hazır” — **no tanı**) | Pediatri büyüme; Pap/HPV; HbA1c DM loop as home |

Mixed-care edge (e.g. dahiliye patient with active pregnancy): attach **only** the modules whose eligibility fires; never dump every specialty’s widgets.

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
| Views | `app/portal/_components/<Specialty>Portal*.tsx` **or** `specialties/<slug>/ui/portal/*` | Section UI |
| Demo | `lib/portal/demoData.ts` + `/portal/demo` | Per-specialty demo fixtures when chapter ships |

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
