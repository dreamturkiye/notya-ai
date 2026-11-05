/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — Canada: what this country states for the operating surgeon's tools of the English
 * set (countries/_dil/en/araclar/arac6.ts): its numbers and the source under each result. MACHINE-WRITTEN AND UNVERIFIED
 * BY A CLINICIAN of Canada. Each number is named with its source; what was not re-opened in this session is listed in
 * docs/OPEN-COMMITMENTS.md KD-OPERATOR-01.
 *
 *   antibiotic prophylaxis  no SOGC amount was re-opened in this session: the ACOG amounts are stated and LABELLED as
 *                           international (the same as the Türkiye build); SOGC's own guidance is listed in
 *                           docs/OPEN-COMMITMENTS.md KD-OPERATOR-01 to replace them.
 *   haemorrhage             WHO thresholds (500 / 1000 mL), labelled international.
 *   consent                 Reibl v Hughes, [1980] 2 SCR 880 (material risk).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = EnUlkeGirdisi['araclar']

export const CA_OPERATOR_PARAMETRELERI: NonNullable<A['parametreler']> = {
  'antibiyotik-profilaksi-kd': { sefazolin_g: 2, sefazolin_yuksek_g: 3, kilo_esigi_kg: 120, kilo_esigi_dahil: 1, azitromisin_mg: 500, klindamisin_mg: 900, gentamisin_mg_kg: 5, tekrar_saat: 4, tekrar_kan_ml: 1500 },
  'kanama-izlem': { esik_1_ml: 500, esik_2_ml: 1000 },
}

export const CA_OPERATOR_DEGISEN: NonNullable<A['degisen']> = {
  'antibiyotik-profilaksi-kd': { not: 'Amounts: ACOG Practice Bulletins 199 and 195 (2018), international: no SOGC amount is stated here yet. A decision-support tool: diagnosis, medicines and doses are the doctor\'s.' },
  'kanama-izlem': {
    sayilar: { evre: 'Stage (WHO: 1 from 500 mL, 2 severe from 1000 mL)' },
    not: 'Sources: WHO definition of postpartum hemorrhage (500 mL or more within 24 hours; severe 1000 mL or more), international; shock index thresholds, El Ayadi, Nathan et al., PLoS ONE 2016. Medicines and doses are the clinician\'s.',
  },
  'onam-formu-kd': { not: 'Canada: disclosure of material risks (Reibl v Hughes, 1980). Risk frequencies are the clinician\'s to discuss and write for this patient.' },
}
