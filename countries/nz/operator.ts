/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — New Zealand: what this country states for the operating surgeon's tools of the English
 * set (countries/_dil/en/araclar/arac6.ts): its numbers and the source under each result. MACHINE-WRITTEN AND UNVERIFIED
 * BY A CLINICIAN of New Zealand. Each number is named with its source; what was not re-opened in this session is listed in
 * docs/OPEN-COMMITMENTS.md KD-OPERATOR-01.
 *
 *   antibiotic prophylaxis  RANZCOG statement C-Gen 17 (current March 2021), read 2026-11-05: the same amounts as
 *                           Australia's (RANZCOG is the college of both countries).
 *   haemorrhage             WHO thresholds (500 / 1000 mL), labelled international.
 *   consent                 Code of Health and Disability Services Consumers' Rights 1996, Right 6 (to be fully informed)
 *                           and Right 7 (to make an informed choice and give informed consent).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = EnUlkeGirdisi['araclar']

export const NZ_OPERATOR_PARAMETRELERI: NonNullable<A['parametreler']> = {
  'antibiyotik-profilaksi-kd': { sefazolin_g: 2, sefazolin_yuksek_g: 3, kilo_esigi_kg: 120, kilo_esigi_dahil: 0, kilo_esigi_yalniz_sezaryen: 1, klindamisin_mg: 600, gentamisin_mg_kg: 2, metronidazol_mg: 500, tekrar_saat: 3 },
  'kanama-izlem': { esik_1_ml: 500, esik_2_ml: 1000 },
}

export const NZ_OPERATOR_DEGISEN: NonNullable<A['degisen']> = {
  'antibiyotik-profilaksi-kd': { not: 'New Zealand: RANZCOG statement C-Gen 17, Prophylactic antibiotics in obstetrics and gynaecology (2021). A decision-support tool: diagnosis, medicines and doses are the doctor\'s.' },
  'kanama-izlem': {
    sayilar: { evre: 'Stage (WHO: 1 from 500 mL, 2 severe from 1000 mL)' },
    not: 'Sources: WHO definition of postpartum haemorrhage (500 mL or more within 24 hours; severe 1000 mL or more), international; shock index thresholds, El Ayadi, Nathan et al., PLoS ONE 2016. Medicines and doses are the clinician\'s.',
  },
  'onam-formu-kd': { not: 'New Zealand: Code of Health and Disability Services Consumers\' Rights 1996, Rights 6 and 7. Risk frequencies are the clinician\'s to discuss and write for this patient.' },
}
