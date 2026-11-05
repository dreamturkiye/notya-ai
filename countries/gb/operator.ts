/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — United Kingdom: what this country states for the operating surgeon's tools of the
 * English set (countries/_dil/en/araclar/arac6.ts): its numbers, the national source under each result, the licences.
 *
 * Every number was read in this job's session (2026-11-05), named beside it; none is from memory. MACHINE-WRITTEN AND
 * UNVERIFIED BY A CLINICIAN of the United Kingdom.
 *
 *   antibiotic prophylaxis  NICE NG192 (Caesarean birth) and NG125 (Surgical site infections) name no agent or dose: a
 *                           local formulary decision. No number is stated, and the tool says so (`ulusal_doz_yok`).
 *   RMI I                   NICE CG122 (Ovarian cancer), appendix "Risk of malignancy index (RMI I)": refer at 250 or
 *                           more. NICE-KAYNAKLI (./nice-kaynakli.json).
 *   Bishop                  NICE NG207 (Inducing labour), supporting documentation: "Bishop score 6 or less" ->
 *                           pharmacological or mechanical ripening; "more than 6" -> amniotomy and oxytocin. Favourable =
 *                           more than 6. NICE-KAYNAKLI.
 *   caesarean urgency       NICE NG192: category 1 within 30 minutes, category 2 within 75 minutes of the decision.
 *                           NICE-KAYNAKLI.
 *   haemorrhage             RCOG Green-top Guideline No. 52 (2016), as cited by NHS Scotland's PPH guideline (read
 *                           2026-11-05): minor 500-1000 mL, major over 1000 mL, moderate 1000-2000 mL, severe over 2000 mL.
 *   consent                 GMC, Decision making and consent (2020); Montgomery v Lanarkshire Health Board [2015] UKSC 11
 *                           (material risks); RCOG Consent Advice series.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = EnUlkeGirdisi['araclar']

export const GB_OPERATOR_PARAMETRELERI: NonNullable<A['parametreler']> = {
  rmi: { esik: 250 }, // NICE-KAYNAKLI: CG122, appendix RMI I, the referral cut-off 250
  bishop: { esik: 6 }, // NICE-KAYNAKLI: NG207, the Bishop threshold (6 or less / more than 6)
  'sezaryen-aciliyeti': { hedef_1_dk: 30, hedef_2_dk: 75 }, // NICE-KAYNAKLI: NG192, decision-to-birth targets 30 and 75 minutes
  'kanama-izlem': { esik_1_ml: 500, esik_2_ml: 1000, esik_3_ml: 2000 },
}

export const GB_OPERATOR_DEGISEN: NonNullable<A['degisen']> = {
  'antibiyotik-profilaksi-kd': { not: 'United Kingdom: NICE NG192 (Caesarean birth, 2021) and NICE NG125 (Surgical site infections, 2019) name no agent or dose; the regimen is your local formulary\'s. A decision-support tool: diagnosis, medicines and doses are the doctor\'s.' },
  rmi: { not: 'Source: Jacobs et al., 1990. Cut-off: NICE CG122 (Ovarian cancer, 2011): refer to a specialist multidisciplinary team at RMI I 250 or more. A decision-support tool: diagnosis and treatment are the doctor\'s.' },
  bishop: { not: 'Source: Bishop, 1964. Threshold: NICE NG207 (Inducing labour, 2021): a score of 6 or less is unfavourable, more than 6 favourable. A decision-support tool: diagnosis and treatment are the doctor\'s.' },
  'sezaryen-aciliyeti': { not: 'Categories: Lucas et al., 2000. Targets: NICE NG192 (Caesarean birth, 2021): category 1 within 30 minutes, category 2 within 75 minutes of the decision. An audit standard; the decision is the clinician\'s.' },
  'kanama-izlem': {
    sayilar: { evre: 'Stage (RCOG Green-top 52: 1 minor from 500 mL, 2 major from 1000 mL, 3 severe from 2000 mL)' },
    not: 'Sources: RCOG Green-top Guideline No. 52, Prevention and management of postpartum haemorrhage (2016); shock index thresholds, El Ayadi, Nathan et al., PLoS ONE 2016. Medicines and doses are the clinician\'s.',
  },
  caprini: { not: 'Sources: Caprini, Dis Mon 2005; Gould et al., CHEST 2012. In the United Kingdom VTE risk is assessed by NICE NG89 and the national risk assessment tool; the score here supports, and does not replace, that assessment. Diagnosis, medicines and doses are the doctor\'s.' },
  'onam-formu-kd': { not: 'United Kingdom: GMC, Decision making and consent (2020); Montgomery v Lanarkshire Health Board [2015] UKSC 11 (material risks); RCOG Consent Advice. Risk frequencies are the clinician\'s to discuss and write for this patient.' },
}
