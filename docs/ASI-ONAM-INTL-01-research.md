# NOTYA-ASI-ONAM-01 Phase 2 — per-country pediatric-vaccination consent law research

Status date: 2026-10-16. Scope: the 6 non-Turkey country modules this product actually has
(`release/au`, `release/ca`, `release/gb`, `release/nz`, `release/us`, `release/uz` — confirmed
from the repo's own branches, same 6 the `ACCOUNTING-INTL-01` entry in `docs/OPEN-COMMITMENTS.md`
independently confirmed). Every country's internal specialty key stays `pediatri` (verified by
reading each `release/<cc>:lib/specialties/registry.ts` directly — the branş key is not localized,
only its displayed label/content is), so `AsiOnamUlkePaketi.pediatriBransi` is `'pediatri'` for all six.

Confidence scale (same as `docs/ARCH-NOTYA-ACCOUNTING-<CC>.md`): **VERIFIED** (primary official source,
fetched and quoted directly) / **BEST-EFFORT** (one authoritative official source found, but the
country/program is sub-nationally fragmented and only one jurisdiction's rule was checked) /
**MODERATE** (the underlying statutory framework is confirmed but the specific current clinical
guidance document could not be fetched directly) / **UNCONFIRMED** (no citable official source found).

This document covers the LEGAL CONSENT RULE per country only (who may consent, what must be
disclosed, written-vs-verbal). It does **not** attempt to re-vet a per-vaccine side-effect content
dataset for any of the six countries — see "What is and isn't implemented" below for why that is
deliberately out of scope this round.

## GB — VERIFIED

Source: UK Health Security Agency, "Green Book on immunisation, Chapter 2: Consent", gov.uk,
dated 27 October 2025 — https://www.gov.uk/government/publications/consent-the-green-book-chapter-2
(PDF: https://assets.publishing.service.gov.uk/media/6908d79fef26c341988b25f0/Green_Book_on_immunisation_Ch2_Consent_27_10_25.pdf),
fetched and quoted directly.

- **Who consents**: a child under 16 who is Gillick-competent ("understand[s] fully what is
  involved in the proposed procedure") may consent themself, and a parent cannot override that
  consent. 16–17-year-olds are "presumed in law to have the capacity to consent." For infants and
  non-competent children, "a person with parental responsibility" consents (mother automatically;
  father if married to the mother, named on the birth certificate, or covered by a court order).
  If one parent agrees and the other refuses, "the immunisation should not be carried out" unless
  both agree or a court approves — this rule does not apply to a Gillick-competent child or a 16–17-year-old.
- **What must be disclosed**: "the process, the benefits of immunisation, and the risks" — known
  side effects, what to do if they occur, and the risks of *not* vaccinating — given by a
  "suitably knowledgeable registered healthcare professional," in an understandable form.
- **Form**: "there is no requirement for consent to immunisation to be in writing"; a parent
  bringing the child in after an appropriate consultation "may be considered evidence of consent."
  School programmes use written forms in practice because the parent isn't present, not because
  the law requires it.

## NZ — MODERATE

Primary source for the general consent *principle*: the Code of Health and Disability Services
Consumers' Rights (a binding regulation under the Health and Disability Commissioner Act 1994,
still current law), Rights 5–7, as cited directly by an official DHB vaccinator-training document —
https://www.nmdhb.govt.nz/assets/Uploads/27-June-2017-08.1-Consent-and-Vaccination.pdf (Nelson
Marlborough DHB, pre-2022 health-system reform, fetched and quoted). The current Ministry/Health NZ
**Immunisation Handbook**'s own consent chapter (the document this DHB memo itself cites as the
source of "Standard 2: informed consent") is the right primary citation going forward, but its exact
URL/text could not be fetched directly in this research pass — https://tewhatuora.govt.nz/for-health-professionals/clinical-guidance/immunisation-handbook
lists the handbook (2024 v3 PDF) without exposing the consent chapter's text to a page fetch.
**MODERATE, not VERIFIED**, for that reason; the substantive legal basis (the Code of Rights) is
confirmed, the specific current handbook wording is not.

- **Who consents**: no fixed statutory age for a minor's own vaccination consent; the DHB document
  frames it as a one-on-one discussion between "the vaccinator and the parent or patient" and treats
  capacity as assessed per Rights 5–7, not a bright-line age — consistent with the common-law "mature
  minor" pattern GB/AU/CA also use, though NZ's specific case law was not independently verified here.
- **What must be disclosed**: informed consent requires "effective communication" (Right 5) and
  "the information a reasonable consumer, in that consumer's circumstances, would expect" (Right 6) —
  risks, benefits and likely effects, discussed at a level tailored to the client.
- **Form**: both verbal (the "normal process in primary care", recorded in case notes) and written
  (used for school-based programmes, where the vaccinator and parent don't routinely meet) are valid.

## AU — BEST-EFFORT

Source: Queensland Health, "Age of consent for immunisations" (official state clinical-guideline
page) — https://www.health.qld.gov.au/clinical-practice/guidelines-procedures/diseases-infection/immunisation/provider-education,-qualifications-and-updates/consent,
fetched and quoted. **BEST-EFFORT, not VERIFIED nationally**: Australian health consent law is set
state-by-state (each state/territory runs its own immunisation program and consent policy); only
Queensland's was checked directly. The underlying common-law doctrine (Gillick competence) is shared
Australia-wide, so the *principle* below is a safe general statement, but exact administrative
requirements (e.g. whether written consent is mandated) may differ by state.

- **Who consents**: Gillick competence — no fixed age; a child who is "old enough and mature enough
  to decide for themselves" and can understand the treatment may consent. Queensland's guidance
  says a child "of 15 or older would normally be expected to have the necessary maturity," but
  states no rule for younger children (case-by-case provider judgement). Parental consent for
  younger/non-competent children is implicit in the rest of the Australian immunisation system but
  not itself detailed on this particular page.
- **What must be disclosed**: the disease and the vaccine, risks and benefits, common side effects
  and reactions, and rarer but more serious risks — with "sufficient time to ask questions."
- **Form**: Queensland's page states written consent is required before administration — this is
  the one point most likely to vary by state and was not cross-checked outside Queensland.

## CA — BEST-EFFORT

Source: HealthLinkBC (British Columbia government), "Informed consent for immunization" —
https://www.healthlinkbc.ca/health-library/immunizations/children/informed-consent, fetched and
quoted. **BEST-EFFORT, not VERIFIED nationally**: Canadian health consent law is provincial;
only British Columbia was checked directly, and other provinces differ materially — e.g. Ontario's
Health Care Consent Act has no fixed age at all (pure capacity test), unlike BC's Infants Act.

- **Who consents**: "Only one parent, legal guardian, or foster parent is required" (disagreement
  between parents does not block it in BC). Under BC's Infants Act, anyone under 19 "can provide
  consent to a medical treatment on their own" if the provider is satisfied it is in the child's
  best interest and the child understands the risks/benefits — "there is no set age" for this
  mature-minor rule; in practice parents usually consent for children "12 years of age and younger."
- **What must be disclosed**: the vaccine, benefits of immunization, risks of *not* being immunized,
  common/expected side effects, rare but serious side effects, and medical reasons not to vaccinate.
- **Form**: not addressed explicitly on this page either way; BC's described process is a verbal
  discussion with case-note documentation (parallel to NZ/GB), not a signed form requirement.

## US — BEST-EFFORT (federal disclosure mandate verified; state consent-authority law not)

Source: National Childhood Vaccine Injury Act (NCVIA) Vaccine Information Statement (VIS) mandate,
as summarized by the Immunization Action Coalition from CDC/federal sources —
https://www.immunize.org/technically-speaking/20150801.asp, cross-checked against
https://www.cdc.gov/vaccines/hcp/vis/about/required-use-instructions.html. **VERIFIED for the
federal disclosure mandate specifically; BEST-EFFORT/UNCONFIRMED for "who may consent"**, which in
the US is governed by the law of the patient's own state, not federal law — exactly the same caveat
the parallel `ACCOUNTING-INTL-01` research gave for US sales tax ("one example state verified, not a
50-state table"); no state was checked here for the consent-authority question, only the one
nationwide federal piece.

- **What is federally required (confirmed)**: a Vaccine Information Statement must be given to the
  patient or parent/legal representative *before* every dose of an NCVIA-covered vaccine (DTaP,
  MMR, polio, HepA/B, Hib, influenza, PCV, MenACWY, rotavirus, HPV, varicella, among others) — "This
  includes providing a VIS before each dose of vaccines given as a series." The provider must log
  the VIS edition date, date given, vaccine date, administering person, office, manufacturer and
  lot — but federal law does **not** require a parent's signature on anything.
- **What is state law, not checked here**: who holds the authority to consent for a minor (default:
  a parent/legal guardian in nearly every state), and the handful of state-specific "mature minor"
  or vaccine-specific self-consent exceptions (e.g. some states let an older minor self-consent to
  HPV or hepatitis B vaccination in specific circumstances) — **left unconfirmed, not guessed.**

## UZ — UNCONFIRMED

No citable official source was found for ROUTINE childhood-immunization informed-consent
requirements. Search results returned only 2021–2022 news coverage of COVID-19 vaccination of
12+-year-olds (e.g. kun.uz reporting "voluntary" Pfizer vaccination of children), which is a
different, pandemic-specific policy, not the general legal rule for the Milliy Immunizatsiya
Jadvali (national childhood immunization schedule) BCG/DTP/OPV/MMR-type program. This matches the
pattern the parallel `ACCOUNTING-INTL-02` research flagged for UZ in a different domain (the one
country of the six with a real mandatory government e-invoice system, but also the one with the
least English-language official documentation generally). **Per the brief's own instruction, no
consent-law content is implemented for UZ beyond the generic, country-agnostic framework** — see below.

## What is and isn't implemented this round

The **engine** (`lib/asi/onam/asiOnamMotoru.ts`'s `AsiOnamUlkePaketi` contract — a locale + its own
`icerik: AsiOnamIcerigi[]` + its own `pediatriBransi`) already required **zero code changes** to
support a sixth country: it was designed in Phase 1 to take country content as data from the start
(confirmed by reading it — `TURKIYE_ASI_ONAM_PAKETI` is just one instance of the same generic shape).
`AsiOnamDil` is already `'tr' | (string & {})`, open to any locale string with no type change needed.

**Not implemented this round, deliberately**: a per-vaccine, per-country content dataset — the
`AsiOnamIcerigi[]` array Phase 1 built for Turkey (15 vaccines, name + protects-against + common
side effects + a standard consent sentence, each vetted against WHO/Sağlık Bakanlığı material).
Building that same bar for six more countries is its own Phase-1-sized research-and-vetting effort
per country (a national schedule to source, then vaccine-by-vaccine content to write and cite), not
something to rush alongside the legal-consent-rule research above. **Per the brief's explicit
fallback for exactly this situation** ("implement the generic framework/data structure with
clearly-labeled placeholder/draft content... a confidently wrong consent form is worse than an
honestly incomplete one"), no country pack is wired into that country's live UI/gating yet.
`lib/asi/onam/intl/ulkePaketleri.ts` (this same branch) defines all six as explicit, clearly-labeled
placeholders — present so the next pass has the exact shape to fill, absent any invented medical
content. See `docs/OPEN-COMMITMENTS.md` (`ASI-ONAM-INTL-*`) for the itemized next steps per country.
