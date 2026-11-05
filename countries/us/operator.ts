/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — United States: what this country states for the operating surgeon's tools of the English
 * set (countries/_dil/en/araclar/arac6.ts): its numbers and the source under each result. MACHINE-WRITTEN AND UNVERIFIED
 * BY A CLINICIAN of United States. Each number is named with its source; what was not re-opened in this session is listed in
 * docs/OPEN-COMMITMENTS.md KD-OPERATOR-01.
 *
 *   antibiotic prophylaxis  ACOG Practice Bulletins 199 (2018, cesarean) and 195 (2018, gynecologic procedures), as
 *                           applied in a US obstetric protocol read 2026-11-05: cefazolin 2 g, 3 g at 120 kg or more;
 *                           azithromycin 500 mg added in labor or after rupture of membranes; severe beta-lactam allergy
 *                           clindamycin 900 mg with gentamicin 5 mg/kg; repeat after 4 hours or blood loss over 1500 mL.
 *   hemorrhage              WHO thresholds (500 / 1000 mL), labelled international; ACOG's reVITALize definition was not
 *                           re-opened in this session.
 *   consent                 ACOG Committee Opinion 819, Informed consent and shared decision making in obstetrics and
 *                           gynecology (2021).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = EnUlkeGirdisi['araclar']

export const US_OPERATOR_PARAMETRELERI: NonNullable<A['parametreler']> = {
  // antibiotic prophylaxis: kept as a slot here (./ayarlar.ts, `kapali`, unit safety); the ACOG amounts it would take are,
  // for the day it is switched on: cefazolin_g 2, high 3 at 120 kg or more, azithromycin 500 mg, clindamycin 900 mg,
  // gentamicin 5 mg/kg, repeat after 4 h or blood loss over 1500 mL.
  'kanama-izlem': { esik_1_ml: 500, esik_2_ml: 1000 },
}

export const US_OPERATOR_DEGISEN: NonNullable<A['degisen']> = {
  'kanama-izlem': {
    sayilar: { evre: 'Stage (WHO: 1 from 500 mL, 2 severe from 1000 mL)' },
    not: 'Sources: WHO definition of postpartum hemorrhage (500 mL or more within 24 hours; severe 1000 mL or more), international; shock index thresholds, El Ayadi, Nathan et al., PLoS ONE 2016. Medicines and doses are the clinician\'s.',
  },
  'onam-formu-kd': { not: 'United States: ACOG Committee Opinion 819, Informed consent and shared decision making in obstetrics and gynecology (2021). Risk frequencies are the clinician\'s to discuss and write for this patient.' },
}
