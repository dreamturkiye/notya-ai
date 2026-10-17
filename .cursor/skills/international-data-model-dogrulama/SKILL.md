---
name: international-data-model-dogrulama
description: >-
  Standing rule for every non-Turkey country module (US, UK, Canada,
  Australia, New Zealand, Uzbekistan, Azerbaijan, …): adapting a Turkey-built
  patient report, doctor-identity block, or other legal/official document is
  never just a translation pass. Each country has its own real
  doctor-identifier and licensing-body names, its own patient-identifier
  convention (or explicitly none), its own mandatory report content, and its
  own regulator — none of it may be assumed from the Turkish field set. Use
  before generating or localizing ANY patient-facing report, form, or
  identity block for a non-Turkey module, and when reviewing a PR that adds
  or changes one.
---

# Ülke veri modeli doğrulama (country data model must be verified, never translated)

Boss rule (Kaan, 2026-10-15, caught himself about to do this): adapting a
Turkey-built feature to one of Notya's other country modules is **not** a
translation/localization pass. Each country has its own legally/medically
required doctor-identity and patient-identity fields, its own official-report
format conventions, and its own regulator. Before generating or localizing
**any** patient-facing report, form, or identity block for a non-Turkey
country module, the data model for that country must be verified against
that country's actual medical/government standards — never assumed to be
the Turkish field set with translated labels, and never guessed without a
real check.

## Why a translation pass is not enough

A Turkish rapor's doctor-identity block carries **Diploma Tescil Numarası**
(diploma registration number) and the patient's **T.C. Kimlik No** (national
ID). Translating those two field *labels* into English and shipping them on
a US doctor's report produces a document that is wrong, not just
differently worded: US doctors don't have a "diploma registration number" —
they have an **NPI number** (National Provider Identifier) and a **state
medical license number**, issued by a state medical board, not a diploma
registry. And a US clinical report has **no national-ID-equivalent field for
the patient at all** — there is no US analogue to T.C. Kimlik No that belongs
on this document type. Shipping "Diploma Tescil No" and "T.C. Kimlik No"
with translated labels on a US report is not a softer version of the
correct US report; it is a document with the wrong legal fields on it,
possibly presented as if it carries US regulatory weight it does not have.

The same feature adapted to the **UK** looks different again: the doctor
identifier is a **GMC (General Medical Council) registration number**, not
an NPI, not a diploma number; the patient identifier convention is the
**NHS number**, which has its own check-digit format and is not a general
national-ID number. Three countries, three different real answers — none
of them derivable from the other two by translation.

## The check (run before building or localizing any country module's report / doctor-identity / legal-document feature)

1. **That country's real doctor-identifier field(s) and licensing-body name.**
   Not "a license number" — the actual field (NPI + state license number in
   the US; GMC number in the UK; Diploma Tescil No + Uzmanlık Belge No in
   Türkiye) and the body that issues/registers it.
2. **That country's real patient-identifier convention** — the national-ID
   equivalent that this document type actually carries, or explicitly
   **"none"** when that country's version of this document does not put a
   national identifier on it at all (US clinical reports: none). "None" is a
   verified answer, not a placeholder — write it down as confirmed-none, not
   left blank.
3. **Any country-specific mandatory report content.** A US work/school
   excuse note has different required conventions (dates covered, return-to
   activity language, no diagnosis disclosure norms) than a Turkish istirahat
   raporu (SGK-facing rest-report conventions, resmi mühür/imza expectations).
   Do not assume the Turkish rapor's structure — length, what must appear,
   what must not — carries over.
4. **Never reuse Turkish field names, validation, or formats for another
   country, even as a placeholder.** If the real field set for that country
   has not been verified yet, do not ship a translated Turkish shape "to get
   something working" — build the real field set, or explicitly mark the
   block `// TODO: unverified — <country> doctor-identity fields not yet
   confirmed` and keep it out of anything patient-facing or official-looking
   until it is.

## Where this bites in this repo

Country modules live under the `feat/ulke-*` / `ulke-uygula/*` branch family
and the `araclar-denetim/<ülke>` audit branches (au, ca, gb, nz, us, uz — see
`docs/country-pack-checklist`). Any of the following, for a non-Turkey
module, is in scope for this check:

- A patient report, rapor, or discharge/istirahat-style document generator.
- A doctor-identity block on a report, prescription, or official letterhead.
- A patient-facing form that asks for a national identifier or equivalent.
- Any `BRANS_` / `ORTAK_` content ported from the Türkiye chapter into a
  country pack's equivalent surface.

Signatures, registration-number validators (regex/length/check-digit), and
"resmi" formatting helpers written for Türkiye (e.g. anything validating a
T.C. Kimlik No checksum or a Diploma Tescil No shape) must never be reused
unmodified to validate a different country's fields — a UK NHS number and a
Turkish T.C. Kimlik No have different lengths and different checksum rules;
a validator built for one will silently misvalidate the other.

## Anti-patterns

- Shipping a translated Turkish report shape for a new country "for now" —
  there is no safe "for now" on a document a patient or regulator may rely on.
- Treating "no national ID field" as an oversight to fill in rather than a
  verified fact for that country's document type.
- Reusing a Turkish validator (T.C. Kimlik No checksum, Diploma Tescil No
  format) against another country's identifier because the field *name*
  looks similar after translation.
- Assuming one non-Turkey country's verified field set applies to another
  non-Turkey country ("US and UK are both English-speaking" is not a reason
  to assume NPI ≈ GMC number).

## Quick checklist

```
- [ ] Target country's real doctor-identifier field(s) + licensing body confirmed (not assumed from Türkiye)
- [ ] Target country's patient-identifier convention confirmed, or confirmed-none (not left blank, not guessed)
- [ ] Country-specific mandatory report content checked against that country's real document conventions
- [ ] No Turkish field name / validation / format reused for this country, even as a placeholder
- [ ] Unverified fields explicitly marked TODO/unverified and kept out of anything patient-facing
- [ ] Source for each confirmed field noted (where it was verified, not just "should be right")
```

## Related

- `.cursor/skills/brans-alan-sizmasi/SKILL.md` — mirror concern inside one country: specialty-specific content must
  not leak across branşlar. This skill is the same discipline across country modules: country-specific identity/report
  content must not leak from Türkiye's shape into another country's.
- `.cursor/skills/specialty-universal-vs-chapter/SKILL.md` — universal vs. chapter-specific content; country-module
  report/identity fields are the international analogue of chapter-specific clinical content — never assumed
  universal across countries.
- `docs/country-pack-checklist`
