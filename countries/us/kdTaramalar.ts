/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — The United States: the four O&G records of the English set (countries/_dil/en/araclar/arac8.ts) with
 * this country's numbers, HPV schedule and source lines. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of the United States. Every number
 * below is named with the source it was read from on 2026-11-09; "-1" in the HPV table = the source states no number there.
 *
 *   THYROID: American Thyroid Association 2017 guideline (Recommendation 26, Question 2 text, Recommendations 11, 33, 37, 48a, 52, 96–97),
 *     read 2026-11-09. ACOG Practice Bulletin No. 223 (2020) was read only through a secondary summary (ObG Project, 22 June 2020):
 *     "Universal TSH screening for thyroid disease in pregnancy is not recommended" — risk-based testing. Primary ACOG text not opened.
 *   HPV: CDC, HPV vaccination considerations for health care providers (last reviewed 9 July 2024): routine at 11 or 12, from 9; catch-up
 *     through 26; 27–45 shared clinical decision-making (no row); 2 doses when starting before the 15th birthday, the second 6–12 months
 *     after the first, a third if the two are less than 5 months apart; 3 doses at 0, 1–2 and 6 months when starting at 15–26 and for
 *     immunocompromised persons aged 9–26.
 *   SMA: ACOG Committee Opinion No. 691 (2017), as summarised by Quest Diagnostics (30 May 2025): carrier screening for cystic fibrosis,
 *     spinal muscular atrophy and haemoglobinopathies offered to all women considering pregnancy or pregnant; partner screening when
 *     a carrier is found. Primary ACOG text not opened (docs/OPEN-COMMITMENTS.md KD-TARAMA-01).
 *   PMS / PMDD: DSM-5-TR structure (APA 2022); management options ACOG Clinical Practice Guideline No. 7 (2023), international. The
 *     patient-side daily diary in the country portal: docs/OPEN-COMMITMENTS.md KD-TARAMA-01e.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['kdTaramalari']>

export const US_KD_TARAMALARI: A = {
  parametreler: {
    'gebelik-tiroid': { t1_alt_dusus: 0.4, t1_ust_dusus: 0.5, t1_bas_hafta: 7, sabit_ust: 4, sabit_bas_hafta: 7, sabit_son_hafta: 13, hedef_alt_yari: 1, hipo_aralik_hafta: 4, hipo_son_hafta: 20, hipo_ek_hafta: 30, postpartum_hafta: 6, hiper_aralik_hafta: 4, trab1_bas: 18, trab1_son: 22, trab2_bas: 30, trab2_son: 34, antikor_aralik_hafta: 4, antikor_son_hafta: 20 },
  },
  tablolar: {
    'hpv-asi-kaydi': { hpv_takvimi: { satirlar: [
      { immun: "baskilanmis", yas_alt: 9, yas_ust: 26, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 1, d2_en_cok_ay: 2, d2_en_az_hafta: -1, d3_en_az_ay: 6, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
      { immun: "normal", yas_alt: 9, yas_ust: 14, doz_en_az: 2, doz_en_cok: 2, d2_en_az_ay: 6, d2_en_cok_ay: 12, d2_en_az_hafta: -1, d3_en_az_ay: -1, d3_en_cok_ay: -1, kisa_aralik_ay: 5, kisa_ek_doz: 3 },
      { immun: "normal", yas_alt: 15, yas_ust: 26, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 1, d2_en_cok_ay: 2, d2_en_az_hafta: -1, d3_en_az_ay: 6, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
    ] } },
  },
  degisen: {
    'gebelik-tiroid': { not: "United States: American Thyroid Association 2017 (Thyroid 2017;27:315-389): the laboratory's pregnancy range first; otherwise from week 7 of the first trimester the non-pregnant range lowered by about 0.4 / 0.5 mU/L, or an upper limit of about 4.0 mU/L; no number for trimesters 2 and 3; treated hypothyroidism in the lower half of the trimester range. A decision-support tool: diagnosis, medicines and doses are the doctor's.", uyarilar: { tarama_istemi: "Booking visit: universal TSH screening is not recommended (ACOG Practice Bulletin No. 223, as summarized; primary text not opened); test with a risk factor (American Thyroid Association 2017, Recommendation 97: thyroid history or symptoms, antibodies or goiter, head and neck radiation or thyroid surgery, age over 30, type 1 diabetes or other autoimmune disease, pregnancy loss, preterm birth or infertility, two or more prior pregnancies, family history, BMI 40 or more, amiodarone, lithium or recent iodinated contrast, iodine deficiency)." } },
    'hpv-asi-kaydi': { not: "United States: CDC/ACIP (reviewed 9 July 2024) — starting before the 15th birthday, 2 doses, the second 6 to 12 months after the first (a third if less than 5 months apart); starting at 15 to 26, and immunocompromised persons 9 to 26, 3 doses at 0, 1–2 and 6 months; 27 to 45, shared clinical decision-making. A decision-support tool: the course is the doctor's." },
    'sma-tasiyicilik': { not: "United States: ACOG Committee Opinion No. 691 (2017), as summarized (primary text not opened): offer carrier screening for spinal muscular atrophy to all patients considering pregnancy or pregnant, and partner screening after a carrier result. Carrier status is the laboratory's." },
    'pmdd-gunluk-ozeti': { not: "Structure: American Psychiatric Association, DSM-5-TR (2022), premenstrual dysphoric disorder. Management options: ACOG Clinical Practice Guideline No. 7 (2023), labeled international. An original diary: the DRSP was not used (commercial license not confirmed). The patient-side daily diary of the portal is not in this build yet: enter the highest ratings from the patient's own diary." },
  },
}
