/**
 * Map Notya engines to ACOG document families.
 * Numbers verified against ACOG Combined List of Titles (September 2026)
 * https://www.acog.org/-/media/project/acog/acogorg/clinical/list-of-titles/combined-list-of-titles
 * Do not put these numbers on core/shared patient or visit types.
 */
export type AcogDocType =
  | 'practice_bulletin'
  | 'committee_opinion'
  | 'obstetric_care_consensus'
  | 'clinical_consensus'
  | 'practice_advisory'

export type AcogMapRow = {
  topic: string
  acogDocType: AcogDocType
  /** ACOG document number from the September 2026 titles list. */
  pbNumber: number
  needsLookup: false
  title: string
  year: number
  notes: string
  dobyrOverlap: string
}

export const ACOG_MAP: AcogMapRow[] = [
  {
    topic: 'izlem_sikligi',
    acogDocType: 'clinical_consensus',
    pbNumber: 8,
    needsLookup: false,
    title: 'Tailored Prenatal Care Delivery for Pregnant Individuals',
    year: 2025,
    notes: 'Clinical Consensus 8. Overlay still stores classic to-28w q4 weeks; 28–36w q2 weeks; ≥36w weekly; high risk more frequent + NST/Doppler. Individualize per CC 8.',
    dobyrOverlap: 'DÖBYR 4 izlem asgari (≤14, 18–24, 28–32, 36–38). Do not put ACOG cadence in sb_required.',
  },
  {
    topic: 'gdm_ogtt',
    acogDocType: 'practice_bulletin',
    pbNumber: 190,
    needsLookup: false,
    title: 'Gestational Diabetes Mellitus',
    year: 2018,
    notes: 'PB 190 (interim update; Clinical Practice Update listed through 2026). Screening method may differ from DÖBYR 75g — return dual, do not collapse.',
    dobyrOverlap: 'DÖBYR/SUT 24–28w OGTT window (75g or 50+100 as recorded).',
  },
  {
    topic: 'preeclampsia_hypertension',
    acogDocType: 'practice_bulletin',
    pbNumber: 222,
    needsLookup: false,
    title: 'Gestational Hypertension and Preeclampsia',
    year: 2020,
    notes: 'PB 222 (interim update + CPU). Related: PB 203 chronic hypertension; CPU on biomarker prediction of PE with severe features.',
    dobyrOverlap: 'Riskli Gebelikler overlay + DÖBYR BP each izlem.',
  },
  {
    topic: 'rh_anti_d',
    acogDocType: 'practice_bulletin',
    pbNumber: 181,
    needsLookup: false,
    title: 'Prevention of Rh D Alloimmunization',
    year: 2017,
    notes: 'PB 181 (CPU listed through 2026). Related PB 192 alloimmunization management. Anti-D ~28w + postpartum if neonate Rh+.',
    dobyrOverlap: 'DÖBYR Anti-D ~28w if Rh− IDC−.',
  },
  {
    topic: 'preterm_pprom_acs_tocolysis',
    acogDocType: 'practice_bulletin',
    pbNumber: 171,
    needsLookup: false,
    title: 'Management of Preterm Labor',
    year: 2016,
    notes: 'PB 171 PTL; also PB 217 Prelabor Rupture of Membranes (2020) and PB 234 Prediction and Prevention of Spontaneous Preterm Birth (2021). Protocol refs, not standing doses.',
    dobyrOverlap: 'Riskli Gebelikler preterm path; DÖBYR danger-sign referral.',
  },
  {
    topic: 'aneuploidy_screening',
    acogDocType: 'practice_advisory',
    pbNumber: 226,
    needsLookup: false,
    title: 'Screening for Fetal Chromosomal Abnormalities (PB 226) — replaced January 2026',
    year: 2026,
    notes: 'PB 226 (2020) is replaced by the January 2026 Practice Advisory endorsing SMFM Consult Series #74: cfDNA/NIPT as primary screen for common aneuploidies. Keep 226 as the historical PB number.',
    dobyrOverlap: 'SUT still pays ikili P.901.120 and üçlü P.904.090; NIPT usually out of pocket.',
  },
  {
    topic: 'indicated_delivery_cs_vbac',
    acogDocType: 'practice_bulletin',
    pbNumber: 205,
    needsLookup: false,
    title: 'Vaginal Birth After Cesarean Delivery',
    year: 2019,
    notes: 'PB 205 VBAC. Primary CS reduction: Committee Statement 17 (2025) Quality-Improvement Strategies for Safe Reduction of Primary Cesarean Birth. SB CS-rate is counseling not a veto.',
    dobyrOverlap: 'e-Doğum + Robson fields at birth; DÖBYR sevk / doğum yeri.',
  },
  {
    topic: 'gbs',
    acogDocType: 'committee_opinion',
    pbNumber: 797,
    needsLookup: false,
    title: 'Prevention of Group B Streptococcal Early-Onset Disease in Newborns',
    year: 2020,
    notes: 'CO 797 (interim update). Universal culture-based screen ~36–37w.',
    dobyrOverlap: '35–37w GBS if protocol; newborn handoff GBS field.',
  },
  {
    topic: 'fetal_surveillance_nst_bpp_doppler',
    acogDocType: 'practice_bulletin',
    pbNumber: 229,
    needsLookup: false,
    title: 'Antepartum Fetal Surveillance',
    year: 2021,
    notes: 'PB 229 (replaces older PB 145). Indications timing: CO 828 (2021) Indications for Outpatient Antenatal Fetal Surveillance. Asistan draft is not a diagnosis.',
    dobyrOverlap: 'DÖBYR izlem 4 NST; indicated growth/Doppler stays in specialty payload.',
  },
  {
    topic: 'postpartum_care',
    acogDocType: 'committee_opinion',
    pbNumber: 736,
    needsLookup: false,
    title: 'Optimizing Postpartum Care',
    year: 2018,
    notes: 'CO 736. Contact cadence, complications, contraception. Related Clinical Consensus 1 postpartum pain.',
    dobyrOverlap: 'Doğum Sonu Bakım: NSD ≥24h / CS ≥48h; 6 lohusa vizit (3 hastane + 3 ASM).',
  },
]
