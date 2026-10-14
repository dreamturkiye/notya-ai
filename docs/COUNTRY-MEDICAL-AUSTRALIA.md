# Australia — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the Australian pack (`countries/au`). It does not change Turkish files. Nothing here is a live connection.

## Authorities

| Role | What was read |
| --- | --- |
| Subsidised medicines | Pharmaceutical Benefits Scheme, expenditure and prescriptions reports. The index was opened on 14 October 2026 and names a current report for 1 July 2024 to 30 June 2025. https://www.pbs.gov.au/info/statistics/expenditure-prescriptions/pbs-expenditure-and-prescriptions |
| Reuse | The copyright page (https://www.pbs.gov.au/general/copyright, last updated 6 July 2022) was read on 9 October 2026 and is quoted in `docs/medicines/AUSTRALIA.md`: the material is copyright, personal reference only, other rights reserved. No Creative Commons licence. The top-50 table was not copied. Department contact recorded there: HPP.Support@Health.gov.au. |
| Immunisation | Already in the pack as `au-immunisation-schedule`, from NSW Health's rendering of the National Immunisation Program, read 13 October 2026. Not duplicated. |
| My Health Record | The provider page and the initiatives page both returned HTTP 500 on 14 October 2026. An earlier pass built a link tile and then removed it (see the comment in `countries/au/ayarlar.ts`): a government link was judged not to belong on every role's grid. It was not put back. Registration steps were not loaded. |

## What was already in the pack

Body size, a mental-health screen, oncology grading, the immunisation record, a growth-chart link, and consultations. Slots that stay empty include prescription writing, interactions, diagnosis codes, and notifiable diseases (`au-mandatory-notifications` is a proposed slot, not a list).

## What this job added

| Tool | What it is |
| --- | --- |
| `au-pbs-report-link` | A link for doctors to the report index. No drug row, strength, brand, or schedule was copied. |

No 250-drug list was added. The official publication that ranks medicines stops at 50 in the research already in the repo, and the copyright page does not allow that table into this product.

## Registration

My Health Record, the eRx token, and Healthcare Identifiers were not configured. The pages that would state conformance did not load on 14 October 2026.

## Clinician and lawyer

- Lawyer: do not copy PBS tables until the Department says a commercial product may. The link does not copy them.
- Clinician: the immunisation record was already unsigned. This job did not change its rows.
- Not loaded: interaction pairs, ICD-10-AM (licensed), dosing, a notifiable list, and any live API.
