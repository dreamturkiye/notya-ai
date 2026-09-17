---
name: specialty-universal-vs-chapter
description: >-
  Distinguishes universal product changes (apply to all ~29 medical specialties)
  from chapter-specific work (stay inside one branş like Göz). Use when editing
  hasta dosyası tabs, Sağlığım portal, registry, imaging modalities, SOAP/spine
  chrome, or when closing specialty gaps so shared fixes are not left göz-only.
---

# Universal vs chapter-specific (all ~29 specialties)

Boss rule (2026-09-17): Changes that are **universal** must be done **across the board** for every medical specialty in Notya (~29 branşlar in `lib/doktor/specialties.ts` / `SpecialtyKey`). Anything that is **for Göz** (or KD, derm, dahiliye, pediatri, …) stays inside that practice’s chapter.

## One-line rule

**Shared spine → every branş. Specialty clinical content → that chapter only.**

## Universal (do once, every specialty benefits)

Apply via registry / shared libs — never hardcode only `goz-hastaliklari`:

| Area | Where | Rule |
|------|--------|------|
| Sağlığım **core** shell | `app/portal/**`, `lib/portal/*` | PIN, mesajlar, ziyaretler, sonuçlar, ilaçlar, öykü, KVKK/112 identical |
| Portal **module registry** | `SpecialtyProfile.portal`, `lib/portal/moduller.ts` | Eligibility-gated extras; no cross-branş widget leak |
| Hasta dosyası **tab chrome** | `lib/doktor/hastaDosyaSekmeleri.ts` | Exclusive chapter tabs only for that doctor’s specialty; baseline/aile may use age/sex mixed-care rules |
| Imaging modality catalog | `lib/doktor/imagingModalities.ts` | Add codes once (oct/fundus/dermatoskopi…); chapters opt in via `goruntu.modaliteler` |
| Baseline SOAP / İnceleme / reçete / epikriz / randevu | core doctor app | Never fork per branş |
| Dose-lock / no invented form names / no internal field leak | `lib/doktor/*` | Specialty locks may extend; universal guards stay global |
| Audit vocabulary | `specialty-audit-report` | Strong/Partial/Thin/Missing + **Hasta portalı** row on every chapter audit |

When you fix a chrome leak for Göz (e.g. Deri tab on a göz chart), **fix the shared helper** so kardiyoloji / KBB / üroloji get the same specialty-gate — do not `if (goz) hideDeri`.

## Chapter-specific (stay in that practice)

| Area | Example (Göz) | Must NOT |
|------|----------------|----------|
| Engines / `goz_*` tables | VA logMAR, glokom, DR, anti-VEGF SUT | Pollute `patients` / other chapters’ tables |
| Prompts lock | `specialties/goz-hastaliklari/prompts/` | Load into pediatri SOAP |
| Hasta dosyası tab body | `GozHome` | Mount on non-göz doctors |
| Portal module content | **Gözlerim** (VA/GİB numbers, damla, enjeksiyon dates) | Show on pediatri/derm tokens by default |
| Golden refs / SUT gates | TOD, SUT 4.2.33 | Invent as universal medical law for all branşlar |

## Hasta portalı uniqueness (every specialty)

See `.cursor/skills/specialty-hasta-portali/SKILL.md`. Hard requirements:

1. **Each practice’s Sağlığım is unique** beyond the shared core — content must match what that specialty’s patients need (pediatri ≠ göz ≠ KD ≠ dahiliye ≠ derm).
2. Shipping a chapter **includes** its portal module in the same program (not “later”).
3. Patient-safe only: reminders, clinic-recorded numbers, MD-set dates/regimens, “görüntü eklendi” — **no tanı / no interpretation language**.
4. Baseline-only branşlar (not yet built) keep core shell only until their chapter ships; do not fake specialty widgets.

## Checklist when closing gaps

```
- [ ] Is this fix universal chrome/registry? → shared path + tests for ≥2 specialties
- [ ] Is this clinical content? → specialties/<slug>/ only + that profile’s portal
- [ ] Portal module unique for this branş?
- [ ] No cross-leak (göz chart without Deri/ped tabs; göz portal without büyüme)
- [ ] OPEN-COMMITMENTS + audit HTML updated
```
