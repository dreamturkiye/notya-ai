/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — The United Kingdom: the four O&G records of the English set (countries/_dil/en/araclar/arac8.ts) with
 * this country's numbers, HPV schedule and source lines. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of the United Kingdom. Every number
 * below is named with the source it was read from on 2026-11-09; "-1" in the HPV table = the source states no number there.
 *
 *   THYROID: A NICE / RCOG / British Thyroid Association position on thyroid testing in pregnancy could NOT be opened in this session: the
 *     fallback, follow-up and TRAb numbers are the American Thyroid Association 2017 guideline's (Recommendation 26, Question 2 text,
 *     Recommendations 11, 33, 37, 48a, 52), LABELLED INTERNATIONAL; booking testing is shown as risk-based (ATA Recommendation 97).
 *     docs/OPEN-COMMITMENTS.md KD-TARAMA-01 (UK source to verify).
 *   HPV: UK Health Security Agency, "HPV vaccination guidance for healthcare practitioners" (updated 20 June 2023): school Year 8 (usually
 *     12 and 13); from 1 September 2023 a single dose for eligible people under 25; girls remain eligible to their 25th birthday;
 *     immunosuppressed or living with HIV: 3 doses at 0, 1 and 4 to 6 months. (GBMSM 25–45: 2 doses — not an O&G row.)
 *   SMA: UK National Screening Committee, SMA page: newborn screening "is not currently recommended" (last review October 2018; an
 *     in-service evaluation under review); no antenatal / carrier screening recommendation exists on the page.
 *   PMS / PMDD: DSM-5-TR structure (APA 2022); management options ACOG Clinical Practice Guideline No. 7 (2023), international. The
 *     patient-side daily diary in the country portal: docs/OPEN-COMMITMENTS.md KD-TARAMA-01e.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['kdTaramalari']>

export const GB_KD_TARAMALARI: A = {
  parametreler: {
    'gebelik-tiroid': { t1_alt_dusus: 0.4, t1_ust_dusus: 0.5, t1_bas_hafta: 7, sabit_ust: 4, sabit_bas_hafta: 7, sabit_son_hafta: 13, hedef_alt_yari: 1, hipo_aralik_hafta: 4, hipo_son_hafta: 20, hipo_ek_hafta: 30, postpartum_hafta: 6, hiper_aralik_hafta: 4, trab1_bas: 18, trab1_son: 22, trab2_bas: 30, trab2_son: 34, antikor_aralik_hafta: 4, antikor_son_hafta: 20 },
  },
  tablolar: {
    'hpv-asi-kaydi': { hpv_takvimi: { satirlar: [
      { immun: "baskilanmis", yas_alt: 0, yas_ust: -1, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 1, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: 4, d3_en_cok_ay: 6, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
      { immun: "normal", yas_alt: 12, yas_ust: 24, doz_en_az: 1, doz_en_cok: 1, d2_en_az_ay: -1, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: -1, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
    ] } },
  },
  degisen: {
    'gebelik-tiroid': { not: "United Kingdom: no NICE or RCOG source on thyroid reference ranges in pregnancy was verified for this tool; the fallback and follow-up are the American Thyroid Association 2017 guideline's (Thyroid 2017;27:315-389), labelled international: first trimester from week 7, the non-pregnant range lowered by about 0.4 / 0.5 mU/L, or an upper limit of about 4.0 mU/L; no number for trimesters 2 and 3. A decision-support tool: diagnosis, medicines and doses are the doctor's.", uyarilar: { tarama_istemi: "Booking visit (American Thyroid Association 2017, Recommendations 96–97, international): ask every woman about thyroid disease; test TSH with a listed risk factor (thyroid history or symptoms, antibodies or goitre, head and neck radiation or thyroid surgery, age over 30, type 1 diabetes or other autoimmune disease, pregnancy loss, preterm birth or infertility, two or more prior pregnancies, family history, BMI 40 or more, amiodarone, lithium or recent iodinated contrast, iodine deficiency)." } },
    'hpv-asi-kaydi': { not: "United Kingdom: UKHSA (updated 20 June 2023) — school Year 8 (12 to 13); a single dose for eligible people under 25 since 1 September 2023, eligible to the 25th birthday; immunosuppressed or living with HIV, 3 doses at 0, 1 and 4 to 6 months. A decision-support tool: the course is the doctor's." },
    'sma-tasiyicilik': { not: "United Kingdom: the UK National Screening Committee has no antenatal SMA carrier screening programme; newborn SMA screening is not currently recommended (review October 2018). Carrier status is the laboratory's." },
    'pmdd-gunluk-ozeti': { not: "Structure: American Psychiatric Association, DSM-5-TR (2022), premenstrual dysphoric disorder. Management options: ACOG Clinical Practice Guideline No. 7 (2023), labelled international. An original diary: the DRSP was not used (commercial licence not confirmed). The patient-side daily diary of the portal is not in this build yet: enter the highest ratings from the patient's own diary." },
  },
}
