/**
 * Map Notya engines to ACOG document families.
 * Do not invent Practice Bulletin / Committee Opinion numbers.
 * Exact PB/CO/OCC numbers are not in repo docs — store topic + needsLookup.
 * Verify the current document number at implement time.
 */
export type AcogDocType = 'practice_bulletin' | 'committee_opinion' | 'obstetric_care_consensus'

export type AcogMapRow = {
  topic: string
  acogDocType: AcogDocType
  /** Placeholder until the current PB/CO/OCC number is looked up from ACOG. */
  pbNumber: number | null
  needsLookup: boolean
  notes: string
  dobyrOverlap: string
}

export const ACOG_MAP: AcogMapRow[] = [
  {
    topic: 'izlem_sikligi',
    acogDocType: 'committee_opinion',
    pbNumber: null,
    needsLookup: true,
    notes: 'to 28w q4 weeks; 28–36w q2 weeks; ≥36w weekly; high risk more frequent + NST/Doppler',
    dobyrOverlap: 'DÖBYR 4 izlem asgari (≤14, 18–24, 28–32, 36–38). Do not put ACOG cadence in sb_required.',
  },
  {
    topic: 'gdm_ogtt',
    acogDocType: 'practice_bulletin',
    pbNumber: null,
    needsLookup: true,
    notes: 'GDM screening/diagnosis family — 2-step vs one-step; verify current PB',
    dobyrOverlap: 'DÖBYR/SUT 24–28w OGTT window (75g or 50+100 as recorded).',
  },
  {
    topic: 'preeclampsia_hypertension',
    acogDocType: 'practice_bulletin',
    pbNumber: null,
    needsLookup: true,
    notes: 'gestational hypertension / preeclampsia / HELLP / eclampsia',
    dobyrOverlap: 'Riskli Gebelikler overlay + DÖBYR BP each izlem.',
  },
  {
    topic: 'rh_anti_d',
    acogDocType: 'practice_bulletin',
    pbNumber: null,
    needsLookup: true,
    notes: 'Rh D alloimmunization prevention; Anti-D ~28w + postpartum if neonate Rh+',
    dobyrOverlap: 'DÖBYR Anti-D ~28w if Rh− IDC−.',
  },
  {
    topic: 'preterm_pprom_acs_tocolysis',
    acogDocType: 'practice_bulletin',
    pbNumber: null,
    needsLookup: true,
    notes: 'PTL / PPROM / ACS betamethasone window / tocolysis — protocol refs, not standing doses',
    dobyrOverlap: 'Riskli Gebelikler preterm path; DÖBYR danger-sign referral.',
  },
  {
    topic: 'aneuploidy_screening',
    acogDocType: 'practice_bulletin',
    pbNumber: null,
    needsLookup: true,
    notes: 'NT, serum, NIPT. ACOG allows NIPT as primary screen.',
    dobyrOverlap: 'SUT still pays ikili P.901.120 and üçlü P.904.090; NIPT usually out of pocket.',
  },
  {
    topic: 'indicated_delivery_cs_vbac',
    acogDocType: 'obstetric_care_consensus',
    pbNumber: null,
    needsLookup: true,
    notes: 'indicated delivery, cesarean, VBAC counseling. SB CS-rate is counseling not a veto.',
    dobyrOverlap: 'e-Doğum + Robson fields at birth; DÖBYR sevk / doğum yeri.',
  },
  {
    topic: 'gbs',
    acogDocType: 'committee_opinion',
    pbNumber: null,
    needsLookup: true,
    notes: 'GBS screening / intrapartum prophylaxis family',
    dobyrOverlap: '35–37w GBS if protocol; newborn handoff GBS field.',
  },
  {
    topic: 'fetal_surveillance_nst_bpp_doppler',
    acogDocType: 'practice_bulletin',
    pbNumber: null,
    needsLookup: true,
    notes: 'antepartum fetal surveillance: NST / BPP / Doppler. Asistan draft is not a diagnosis.',
    dobyrOverlap: 'DÖBYR izlem 4 NST; indicated growth/Doppler stays in specialty payload.',
  },
  {
    topic: 'postpartum_care',
    acogDocType: 'committee_opinion',
    pbNumber: null,
    needsLookup: true,
    notes: 'optimizing postpartum care — contact cadence, complications, contraception',
    dobyrOverlap: 'Doğum Sonu Bakım: NSD ≥24h / CS ≥48h; 6 lohusa vizit (3 hastane + 3 ASM).',
  },
]
