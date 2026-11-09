/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — New Zealand: the four O&G records of the English set (countries/_dil/en/araclar/arac8.ts) with
 * this country's numbers, HPV schedule and source lines. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of New Zealand. Every number
 * below is named with the source it was read from on 2026-11-09; "-1" in the HPV table = the source states no number there.
 *
 *   THYROID: RANZCOG (the binational Royal Australian and New Zealand College) statement C-Obs 46 (current March 2022), read 2026-11-09: the
 *     same fallback and targeted testing as for Australia (section 3.3, 4.1.1, 4.1.2); follow-up intervals and TRAb windows ATA 2017,
 *     labelled international.
 *   HPV: Te Whatu Ora, HPV immunisation programme page (read 2026-11-09): "free for everyone aged 9 to 26 years (inclusive)"; ages 9 to
 *     14 two doses, "the second at least six months after the first"; from age 15 three doses over six months (no interval stated);
 *     immunocompromised: not stated on the page (it refers to the Immunisation Handbook 2025, chapter 10, not opened) — no row.
 *   SMA: Te Whatu Ora newborn metabolic screening programme added SMA on 12 February 2025 ("The test is not able to detect healthy
 *     carriers of SMA"); no funded antenatal or preconception carrier screening programme was found in this session.
 *   PMS / PMDD: DSM-5-TR structure (APA 2022); management options ACOG Clinical Practice Guideline No. 7 (2023), international. The
 *     patient-side daily diary in the country portal: docs/OPEN-COMMITMENTS.md KD-TARAMA-01e.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['kdTaramalari']>

export const NZ_KD_TARAMALARI: A = {
  parametreler: {
    'gebelik-tiroid': { t1_alt_dusus: 0.5, t1_ust_dusus: 0.5, t23_gebelik_disi: 1, sabit_ust: 4, hedef_alt_yari: 1, hipo_aralik_hafta: 4, hipo_son_hafta: 20, hipo_ek_hafta: 30, postpartum_hafta: 6, hiper_aralik_hafta: 4, trab1_bas: 18, trab1_son: 22, trab2_bas: 30, trab2_son: 34, antikor_aralik_hafta: 4, antikor_son_hafta: 20 },
  },
  tablolar: {
    'hpv-asi-kaydi': { hpv_takvimi: { satirlar: [
      { immun: "normal", yas_alt: 9, yas_ust: 14, doz_en_az: 2, doz_en_cok: 2, d2_en_az_ay: 6, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: -1, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
      { immun: "normal", yas_alt: 15, yas_ust: 26, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: -1, d2_en_cok_ay: -1, d2_en_az_hafta: -1, d3_en_az_ay: -1, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
    ] } },
  },
  degisen: {
    'gebelik-tiroid': { not: "New Zealand: RANZCOG C-Obs 46 (binational, current March 2022): local pregnancy-specific intervals first; otherwise 0.5 mU/L below the non-pregnant range in the first trimester and the non-pregnant range in trimesters 2 and 3, or 4 mU/L as the upper limit throughout pregnancy; free T4 needs method-specific intervals. Follow-up intervals and TRAb windows: American Thyroid Association 2017, labelled international. A decision-support tool: diagnosis, medicines and doses are the doctor's.", uyarilar: { tarama_istemi: "Booking visit, RANZCOG C-Obs 46: targeted testing — TSH (with free T4) for women with symptoms of thyroid disease, type 1 diabetes or a personal history of thyroid disease." } },
    'hpv-asi-kaydi': { not: "New Zealand: Te Whatu Ora — free for everyone aged 9 to 26 (inclusive); 9 to 14, two doses, the second at least six months after the first; from 15, three doses over six months. Immunocompromised schedules: Immunisation Handbook 2025, chapter 10 (not stated here). A decision-support tool: the course is the doctor's." },
    'sma-tasiyicilik': { not: "New Zealand: SMA is part of newborn screening since 12 February 2025 (Te Whatu Ora), which does not detect carriers; no funded antenatal carrier screening programme was found. Carrier status is the laboratory's." },
    'pmdd-gunluk-ozeti': { not: "Structure: American Psychiatric Association, DSM-5-TR (2022), premenstrual dysphoric disorder. Management options: ACOG Clinical Practice Guideline No. 7 (2023), labelled international. An original diary: the DRSP was not used (commercial licence not confirmed). The patient-side daily diary of the portal is not in this build yet: enter the highest ratings from the patient's own diary." },
  },
}
