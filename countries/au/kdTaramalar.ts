/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — Australia: the four O&G records of the English set (countries/_dil/en/araclar/arac8.ts) with
 * this country's numbers, HPV schedule and source lines. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of Australia. Every number
 * below is named with the source it was read from on 2026-11-09; "-1" in the HPV table = the source states no number there.
 *
 *   THYROID: RANZCOG statement C-Obs 46, Testing for hypothyroidism during pregnancy with serum TSH (first endorsed July 2012, current March 2022, review due March 2027), read 2026-11-09:
 *     section 3.3 "Local pregnancy specific reference intervals should be used if available"; otherwise "0.5 mU/L less than the
 *     non-pregnant range in first trimester", "the same as the nonpregnant range in trimester 2 and 3", "or 4 mU/L can be used as the
 *     upper limit of the normal range throughout pregnancy"; free T4 "method specific reference intervals are necessary"; 4.1.1 TSH
 *     "for women with symptoms of thyroid disease, Type 1 diabetes or a personal history of thyroid disease" (targeted, not universal);
 *     4.1.2 treatment goal "within the lower half of trimester-specific pregnancy ranges". Follow-up intervals and TRAb windows: ATA 2017
 *     (Recommendations 11, 33, 37, 48a, 52), labelled international — C-Obs 46 states none.
 *   HPV: Australian Immunisation Handbook, "Recommended doses and intervals between doses for HPV vaccine" (last updated 2 July 2025):
 *     9–25 years not immunocompromised: 1 single dose; starting at 26 or older: 3 doses at months 0, 2 and 6; immunocompromised people of
 *     any age (excluding asplenia or hyposplenia): 3 doses at months 0, 2 and 6. The NIP funding page (health.gov.au) could not be opened
 *     (robots), so no funding line is written here (docs/OPEN-COMMITMENTS.md KD-TARAMA-01).
 *   SMA: MBS factsheet "Reproductive carrier testing for cystic fibrosis, spinal muscular atrophy and fragile X syndrome" (last updated
 *     22 November 2023): from 1 November 2023 items 73451 (a patient who is pregnant or planning pregnancy, one test per lifetime) and
 *     73452 (the reproductive partner of a patient found to be a carrier, one test per condition per lifetime); couples at high risk may be
 *     referred to a clinical genetics service or obstetrician.
 *   PMS / PMDD: DSM-5-TR structure (APA 2022); management options ACOG Clinical Practice Guideline No. 7 (2023), international. The
 *     patient-side daily diary in the country portal: docs/OPEN-COMMITMENTS.md KD-TARAMA-01e.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['kdTaramalari']>

export const AU_KD_TARAMALARI: A = {
  parametreler: {
    'gebelik-tiroid': { t1_alt_dusus: 0.5, t1_ust_dusus: 0.5, t23_gebelik_disi: 1, sabit_ust: 4, hedef_alt_yari: 1, hipo_aralik_hafta: 4, hipo_son_hafta: 20, hipo_ek_hafta: 30, postpartum_hafta: 6, hiper_aralik_hafta: 4, trab1_bas: 18, trab1_son: 22, trab2_bas: 30, trab2_son: 34, antikor_aralik_hafta: 4, antikor_son_hafta: 20 },
  },
  tablolar: {
    'hpv-asi-kaydi': { hpv_takvimi: { satirlar: [
      { immun: "baskilanmis", yas_alt: 0, yas_ust: -1, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 2, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: 6, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
      { immun: "normal", yas_alt: 9, yas_ust: 25, doz_en_az: 1, doz_en_cok: 1, d2_en_az_ay: -1, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: -1, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
      { immun: "normal", yas_alt: 26, yas_ust: -1, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 2, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: 6, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
    ] } },
  },
  degisen: {
    'gebelik-tiroid': { not: "Australia: RANZCOG C-Obs 46 (current March 2022): local pregnancy-specific intervals first; otherwise 0.5 mU/L below the non-pregnant range in the first trimester and the non-pregnant range in trimesters 2 and 3, or 4 mU/L as the upper limit throughout pregnancy; free T4 needs method-specific intervals; treated hypothyroidism kept within the lower half of the trimester range. Follow-up intervals and TRAb windows: American Thyroid Association 2017, labelled international. A decision-support tool: diagnosis, medicines and doses are the doctor's.", uyarilar: { tarama_istemi: "Booking visit, RANZCOG C-Obs 46: targeted testing — TSH (with free T4) for women with symptoms of thyroid disease, type 1 diabetes or a personal history of thyroid disease; screening for subclinical hypothyroidism or TPO antibodies is not recommended." } },
    'hpv-asi-kaydi': { not: "Australia: Australian Immunisation Handbook (updated 2 July 2025): 9–25 years, not immunocompromised, a single dose; starting at 26 or older, 3 doses at months 0, 2 and 6; immunocompromised people of any age (excluding asplenia or hyposplenia), 3 doses at months 0, 2 and 6. A decision-support tool: the course is the doctor's." },
    'sma-tasiyicilik': { not: "Australia: Medicare items 73451 (a patient pregnant or planning pregnancy, once per lifetime) and 73452 (the reproductive partner of a carrier, once per condition per lifetime), since 1 November 2023 (MBS factsheet, updated 22 November 2023); couples at high risk may be referred to a clinical genetics service or an obstetrician. Carrier status is the laboratory's." },
    'pmdd-gunluk-ozeti': { not: "Structure: American Psychiatric Association, DSM-5-TR (2022), premenstrual dysphoric disorder. Management options: ACOG Clinical Practice Guideline No. 7 (2023), labelled international. An original diary: the DRSP was not used (commercial licence not confirmed). The patient-side daily diary of the portal is not in this build yet: enter the highest ratings from the patient's own diary." },
  },
}
