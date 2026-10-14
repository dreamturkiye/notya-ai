# Canada — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the Canadian pack (`countries/ca`). It does not change Turkish files. Nothing here is a live connection.

## Authorities

| Role | What was read |
| --- | --- |
| Federal health department | The department's own front page, opened 14 October 2026. It says it is a federal institution in the Health portfolio, responsible for helping people maintain and improve their health, and it lists drugs and health products among its work. https://www.canada.ca/en/health-canada.html |
| Electronic prescribing | PrescribeIT homepage, opened 14 October 2026. It calls itself the country's electronic prescription service and says the national prescribing standard is reached by joining the ePrescribing Standards Working Group. https://www.prescribeit.ca/ |
| Drug ranking | No official national ranking of individual medicines by number of prescriptions was found. The earlier research file `docs/medicines/CANADA.md` keeps eight separate official rankings that count different things and says they must not be merged. The Drug Product Database is a register, not a ranking, and the extract that was sampled is not a list of the most prescribed medicines. |

## What was already in the pack

A unit converter and the 2021 eGFR equation. Laboratory units already live on the tools that use them. Empty slots stay empty: prescription form, interactions, diagnosis codes (ICD-10-CA is licensed and was not pasted), vaccination schedule, and notifiable diseases.

## What this job added

| Item | What it is |
| --- | --- |
| `ca-prescribeit-link` | A link for doctors. No call is made. |
| Service register | `countries/ca/kayit/sistemler.ts`. One service, `bagli: false`. |

No 250-drug list was added. Inventing one from separate rankings, or from a register of licensed products, would label the wrong thing as "most prescribed".

## Registration — not started

Joining the ePrescribing Standards Working Group is what the homepage states. The production contract, conformance tests, and registration fields were not on that page. Provincial electronic record systems were not opened.

## Clinician and lawyer

- Lawyer: the Open Government Licence – Canada can cover federal registers. It was not used to load a medicine list, because no national top 250 by prescriptions was in hand.
- Clinician: the PrescribeIT tile is not a prescription and not a transmission.
- Not loaded: interaction pairs, ICD-10-CA, a vaccination calendar, a notifiable list, dosing, and any live API.
