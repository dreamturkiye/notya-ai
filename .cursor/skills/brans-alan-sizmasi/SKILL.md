---
name: brans-alan-sizmasi
description: >-
  Standing rule for every field, form section, vocabulary choice, or UI
  element added anywhere in Notya: something specific to ONE specialty must
  never render, appear, or get generated for a doctor in a DIFFERENT
  specialty. Use before merging any change to a shared/baseline-spine
  component (Yaşamsal Bulgular, Anamnez, SOAP, hasta/veli özeti, portal,
  intake, SGK rapor, epikriz, Asistan sohbet) — and when writing the PR
  description for one. Answers "is this genuinely universal, or does it
  belong behind a specialty gate?" This is the mirror image of
  cross-specialty-parity: that skill says a FIX must reach every branch;
  this skill says a specialty-SPECIFIC thing must reach only its own branch.
---

# Branş alan sızması (bir branşa özel bir şey başka branşta görünmemeli)

Boss rule (verbatim intent, from two live bugs he found as a Kadın Doğum
doctor): the Yaşamsal Bulgular form showed a **Baş Çevresi** (head
circumference) field — pediatri-only, meaningless for an obstetrics patient —
and the hasta/veli özeti used the word **"veli"** (guardian) — pediatri-only
vocabulary, wrong for an adult KD patient with no guardian. Neither was
gated. Both leaked from wherever they were written straight into every
specialty's shared form.

His principle: things specific to one specialty — forms, dosyalar,
vocabulary, sections, fields — must never carry over to another specialty.
Optometri (göz-hastalıkları) will have many eye-specific fields; none of
them should ever appear for a Kardiyoloji or Pediatri doctor, and vice versa.

## The architecture this rule rests on

Same spine as cross-specialty-parity:

| Layer | What it is | Who uses it |
|-------|------------|-------------|
| **Shared spine** | Yaşamsal Bulgular, Anamnez, SOAP üretimi, hasta/veli özeti, İnceleme/onay, portal, intake, SGK rapor, epikriz | **Every** specialty, by construction |
| **Chapter delta** | `specialties/<slug>/` — own `prompts/`, `engines/`, `ui/` | Only the specialties that have a folder |
| **Profile registry** | `lib/specialties/<key>.ts` + `registry.ts` | Chapters with a `SpecialtyProfile`; everything else falls back to `baselineProfile(...)` |

The failure mode this skill guards against is the **opposite direction**
from parity: a specialty-specific thing gets written directly into a
*shared* component instead of behind a gate — so instead of missing one
branch, it leaks into all 29+ of them.

`lib/intake/bransSorulari.ts` is the reference model for doing this
correctly: content is branch-keyed from the start, so a KD-only question
never appears for a dahiliye doctor. Any new specialty-specific content
should look like that, not like an unconditional field in a shared form.

## The check (run before adding ANYTHING to a shared/baseline component)

1. **Ask: is this field/section/word genuinely true for every specialty, or
   only for one (or a few)?** "Baş Çevresi" is true only for pediatri (and
   maybe neonatoloji). "Veli" is true only where the patient can legally be
   a minor — pediatri, not KD/dahiliye/göz/kardiyoloji/dermatoloji/etc.
2. **If it's universal** — leave it in the shared component, no gate needed.
3. **If it's specialty-specific** — gate it explicitly using the
   `SpecialtyProfile`/registry mechanism (or the `specialties/<slug>/` own
   files), never a bare unconditional render. Never assume "it'll just be
   empty/ignored for other branches" — an empty field a KD doctor sees is
   still a leak; it signals the wrong thing was even considered.
4. **Never hardcode a single specialty string check scattered ad hoc** — if
   the gate mechanism doesn't yet support the component you're touching,
   extend the mechanism once, consistently, rather than adding a fifth
   different `if (specialty === 'pediatri')` pattern in a fifth different file.
5. **Read the current specialty list live, never from memory:**
```bash
   ls specialties/                 # chapters with their own delta folder
   sed -n '/^const CHAPTERS/,/^}/p' lib/specialties/registry.ts
```
   This list grows. A hardcoded assumption about "which specialties need X"
   goes stale.

## PR description requirement

Any PR that touches a shared/baseline component and adds specialty-flavored
content must state explicitly: which specialty(ies) this belongs to, and
what gate mechanism restricts it to them. "Added Baş Çevresi to vitals" is
not enough — "Baş Çevresi gated to pediatri via `SpecialtyProfile.vitals`"
is.

## Related

- `.cursor/rules/brans-alan-sizmasi.mdc` (always-on Cursor rule)
- `.cursor/skills/cross-specialty-parity/SKILL.md` (mirror: shared *fixes* must reach every branş)
- `.cursor/skills/specialty-universal-vs-chapter/SKILL.md`
- `.cursor/skills/specialty-doktor-araclari/SKILL.md` (Araçlar visibility)
- `.cursor/skills/specialty-hasta-portali/SKILL.md`
