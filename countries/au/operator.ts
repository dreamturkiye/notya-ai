/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — Australia: what this country states for the operating surgeon's tools of the English
 * set (countries/_dil/en/araclar/arac6.ts): its numbers and the source under each result. MACHINE-WRITTEN AND UNVERIFIED
 * BY A CLINICIAN of Australia. Each number is named with its source; what was not re-opened in this session is listed in
 * docs/OPEN-COMMITMENTS.md KD-OPERATOR-01.
 *
 *   antibiotic prophylaxis  RANZCOG statement C-Gen 17, Prophylactic antibiotics in obstetrics and gynaecology (current
 *                           March 2021), read 2026-11-05: caesarean cefazolin 2 g, 3 g over 120 kg; severe penicillin
 *                           allergy clindamycin 600 mg with gentamicin 2 mg/kg; major gynaecological surgery cefazolin 2 g
 *                           with metronidazole 500 mg; repeat dose after 3 hours.
 *   haemorrhage             WHO thresholds (500 / 1000 mL), labelled international.
 *   consent                 Rogers v Whitaker (1992) 175 CLR 479 (material risk).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = EnUlkeGirdisi['araclar']

export const AU_OPERATOR_PARAMETRELERI: NonNullable<A['parametreler']> = {
  'antibiyotik-profilaksi-kd': { sefazolin_g: 2, sefazolin_yuksek_g: 3, kilo_esigi_kg: 120, kilo_esigi_dahil: 0, kilo_esigi_yalniz_sezaryen: 1, klindamisin_mg: 600, gentamisin_mg_kg: 2, metronidazol_mg: 500, tekrar_saat: 3 },
  'kanama-izlem': { esik_1_ml: 500, esik_2_ml: 1000 },
}

export const AU_OPERATOR_DEGISEN: NonNullable<A['degisen']> = {
  'antibiyotik-profilaksi-kd': { not: 'Australia: RANZCOG statement C-Gen 17, Prophylactic antibiotics in obstetrics and gynaecology (2021). A decision-support tool: diagnosis, medicines and doses are the doctor\'s.' },
  'kanama-izlem': {
    sayilar: { evre: 'Stage (WHO: 1 from 500 mL, 2 severe from 1000 mL)' },
    not: 'Sources: WHO definition of postpartum haemorrhage (500 mL or more within 24 hours; severe 1000 mL or more), international; shock index thresholds, El Ayadi, Nathan et al., PLoS ONE 2016. Medicines and doses are the clinician\'s.',
  },
  'onam-formu-kd': { not: 'Australia: a material risk is one a reasonable person in the patient\'s position, or this patient, would attach significance to (Rogers v Whitaker, 1992). Risk frequencies are the clinician\'s to discuss and write for this patient.' },
}
