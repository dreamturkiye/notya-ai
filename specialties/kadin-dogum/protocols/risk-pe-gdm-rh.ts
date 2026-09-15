/**
 * Risk / emergency checklists — not full EHRs.
 * evaluateX(input) => { triage, next, citations }
 */
export type Triage = 'routine' | 'urgent' | 'emergency'
export type EvalResult = { triage: Triage; next: string[]; citations: string[] }

const W = ['williams-26']
const RG = ['riskli-gebelikler', 'williams-26']

export function evaluatePE(input: {
  sbp: number
  dbp: number
  proteinuria: boolean
  headache?: boolean
  visual?: boolean
  epigastric?: boolean
  platelets_low?: boolean
  ast_alt_high?: boolean
}): EvalResult {
  const severe = input.sbp >= 160 || input.dbp >= 110
  const hellp = Boolean(input.platelets_low && input.ast_alt_high)
  const symptoms = Boolean(input.headache || input.visual || input.epigastric)
  if (hellp || (severe && symptoms)) {
    return { triage: 'emergency', next: ['MgSO4 flag', 'delivery flags', 'stabilize BP', 'sevk'], citations: RG }
  }
  if (input.sbp >= 140 || input.dbp >= 90 || input.proteinuria) {
    return { triage: 'urgent', next: ['repeat BP', 'spot/24h protein', 'labs', 'fetal surveillance'], citations: RG }
  }
  return { triage: 'routine', next: ['routine BP each visit'], citations: ['dobyr-2026'] }
}

export function evaluateAPH(input: { previa?: boolean; accreta?: boolean; abruption?: boolean; bleeding: boolean }): EvalResult {
  if (input.bleeding && (input.previa || input.accreta || input.abruption)) {
    return { triage: 'emergency', next: ['ABC', 'Rh/IDC', 'crossmatch', 'do not PV if previa suspected'], citations: W }
  }
  if (input.bleeding) return { triage: 'urgent', next: ['localize placenta', 'vital signs', 'FHR'], citations: W }
  return { triage: 'routine', next: ['previa follow if known'], citations: W }
}

export function evaluatePPH(input: { atony?: boolean; trauma?: boolean; tissue?: boolean; thrombin?: boolean }): EvalResult {
  const fours = ['tone', 'trauma', 'tissue', 'thrombin'] as const
  const hit = [input.atony, input.trauma, input.tissue, input.thrombin].some(Boolean)
  return {
    triage: hit ? 'emergency' : 'urgent',
    next: ['4T checklist', ...fours, 'uterotonics', 'balloon/surgery path'],
    citations: W,
  }
}

export function evaluateEctopic(input: { bhcg_trend: 'rising' | 'plateau' | 'falling'; tvusg_iug_seen: boolean; mtx_candidate?: boolean }): EvalResult {
  if (!input.tvusg_iug_seen && input.bhcg_trend !== 'falling') {
    return {
      triage: 'urgent',
      next: input.mtx_candidate ? ['MTX criteria checklist', 'consent'] : ['diagnostic laparoscopy path', 'serial β-hCG + TVUSG'],
      citations: W,
    }
  }
  return { triage: 'routine', next: ['continue viability follow'], citations: W }
}

export function evaluateAbortus(input: { type: 'threatened' | 'incomplete' | 'missed' | 'septic'; ga_weeks: number }): EvalResult {
  const legal = input.ga_weeks <= 10
  return {
    triage: input.type === 'septic' ? 'emergency' : 'urgent',
    next: [
      'misoprostol protocol if indicated',
      legal ? 'küretaj legal packet ≤10w' : 'indicated board / tahliye path',
    ],
    citations: ['temel-kd-4', 'williams-26'],
  }
}

export function evaluatePTL(input: { contractions: boolean; pprom: boolean; ga_weeks: number }): EvalResult {
  const acsWindow = input.ga_weeks >= 24 && input.ga_weeks <= 34
  return {
    triage: input.pprom || input.contractions ? 'urgent' : 'routine',
    next: [
      input.pprom ? 'PPROM antibiotics + latency plan' : 'tocodynamometry',
      acsWindow ? 'ACS betamethasone window' : 'ACS not in window',
      'tocolysis checklist',
    ],
    citations: W,
  }
}

export function evaluateGDM(input: { ogtt_positive: boolean; on_insulin?: boolean; macrosomia?: boolean }): EvalResult {
  if (!input.ogtt_positive) return { triage: 'routine', next: ['diet counseling if screen pending'], citations: W }
  return {
    triage: input.on_insulin || input.macrosomia ? 'urgent' : 'routine',
    next: ['diet', input.on_insulin ? 'insulin titration' : 'trial of diet', input.macrosomia ? 'growth USG / delivery plan' : 'fetal growth watch'],
    citations: W,
  }
}

export function evaluateIUGR(input: { stage: 'ua' | 'mca' | 'dv' }): EvalResult {
  const next = {
    ua: ['UA Doppler', 'repeat growth'],
    mca: ['MCA after UA', 'surveillance intensify'],
    dv: ['DV stage — delivery decision'],
  }[input.stage]
  return { triage: input.stage === 'dv' ? 'emergency' : 'urgent', next, citations: W }
}

export function evaluateRh(input: { rh: 'D+' | 'D-' | 'unknown'; idc: 'positive' | 'negative' | 'unknown' | 'not_tested'; ga_weeks: number }): EvalResult {
  if (input.rh !== 'D-' || input.idc !== 'negative') {
    return { triage: 'routine', next: ['Anti-D not indicated on this Rh/IDC pair'], citations: W }
  }
  return {
    triage: 'routine',
    next: input.ga_weeks >= 27 && input.ga_weeks <= 29 ? ['Anti-D 300 µg now'] : ['plan Anti-D ~28w', 'postpartum if neonate Rh+'],
    citations: W,
  }
}

export function evaluateICP(input: { bile_acids_umol: number }): EvalResult {
  if (input.bile_acids_umol >= 40) return { triage: 'urgent', next: ['ursodeoxycholic acid path', 'delivery timing'], citations: W }
  if (input.bile_acids_umol >= 10) return { triage: 'routine', next: ['repeat bile acids', 'pruritus care'], citations: W }
  return { triage: 'routine', next: ['ICP unlikely'], citations: W }
}

export function evaluateVTE(input: { score: number }): EvalResult {
  return {
    triage: input.score >= 3 ? 'urgent' : 'routine',
    next: input.score >= 3 ? ['enoxaparin pregnancy note', 'anesthesia plan'] : ['mobility / hydration'],
    citations: W,
  }
}

export function evaluateTTTS(input: { stage: 1 | 2 | 3 | 4 | 5 }): EvalResult {
  return {
    triage: input.stage >= 2 ? 'emergency' : 'urgent',
    next: ['monochorionic surveillance', `Quintero stage ${input.stage}`, 'laser/sevk path if ≥2'],
    citations: W,
  }
}

export function evaluateLabor(input: { bishop: number; nst: 'I' | 'II' | 'III'; oxytocin?: boolean }): EvalResult {
  return {
    triage: input.nst === 'III' ? 'emergency' : input.nst === 'II' ? 'urgent' : 'routine',
    next: ['partogram', `Bishop ${input.bishop}`, `NST cat ${input.nst}`, input.oxytocin ? 'oxytocin running' : 'oxytocin not started'],
    citations: W,
  }
}

export function evaluateCS(input: { indication: string; prior_cs?: boolean }): EvalResult {
  return {
    triage: 'urgent',
    next: input.prior_cs ? ['VBAC counseling', 'uterine rupture signs', input.indication] : ['CS indication note', input.indication],
    citations: W,
  }
}

export function evaluateShoulderDystocia(): EvalResult {
  return { triage: 'emergency', next: ['HELPERR / McRoberts', 'suprapubic', 'document head-to-body interval'], citations: W }
}

export function evaluateEclampsia(): EvalResult {
  return { triage: 'emergency', next: ['seizure algorithm', 'airway', 'MgSO4', 'delivery after stabilize'], citations: W }
}
