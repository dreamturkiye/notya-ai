/**
 * Risk / emergency checklists — not full EHRs.
 * evaluateX(input) => { triage, next, citations }
 * Citations: ACOG → DÖBYR/Riskli → Williams → Temel KD. Never collapse ACOG vs DÖBYR.
 */
import { citeProtocol, UI_HINT_YASAL_VS_KLINIK } from './sources'

export type Triage = 'routine' | 'urgent' | 'emergency'
export type EvalResult = {
  triage: Triage
  next: string[]
  citations: string[]
  conflict?: boolean
  sb_required?: { next: string[] }
  acog_recommended?: { next: string[] }
  uiHint?: typeof UI_HINT_YASAL_VS_KLINIK
}

const CITE = citeProtocol('obstetrik')
const CITE_RISK = citeProtocol('risk')
const CITE_GYN = citeProtocol('jinekoloji')

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
    return { triage: 'emergency', next: ['MgSO4 flag', 'delivery flags', 'stabilize BP', 'sevk'], citations: CITE_RISK }
  }
  if (input.sbp >= 140 || input.dbp >= 90 || input.proteinuria) {
    return { triage: 'urgent', next: ['repeat BP', 'spot/24h protein', 'labs', 'fetal surveillance'], citations: CITE_RISK }
  }
  return { triage: 'routine', next: ['routine BP each visit'], citations: CITE_RISK }
}

export function evaluateAPH(input: { previa?: boolean; accreta?: boolean; abruption?: boolean; bleeding: boolean }): EvalResult {
  if (input.bleeding && (input.previa || input.accreta || input.abruption)) {
    return { triage: 'emergency', next: ['ABC', 'Rh/IDC', 'crossmatch', 'do not PV if previa suspected'], citations: CITE }
  }
  if (input.bleeding) return { triage: 'urgent', next: ['localize placenta', 'vital signs', 'FHR'], citations: CITE }
  return { triage: 'routine', next: ['previa follow if known'], citations: CITE }
}

export function evaluatePPH(input: { atony?: boolean; trauma?: boolean; tissue?: boolean; thrombin?: boolean }): EvalResult {
  const fours = ['tone', 'trauma', 'tissue', 'thrombin'] as const
  const hit = [input.atony, input.trauma, input.tissue, input.thrombin].some(Boolean)
  return {
    triage: hit ? 'emergency' : 'urgent',
    next: ['4T checklist', ...fours, 'uterotonics', 'balloon/surgery path'],
    citations: CITE,
  }
}

export function evaluateEctopic(input: { bhcg_trend: 'rising' | 'plateau' | 'falling'; tvusg_iug_seen: boolean; mtx_candidate?: boolean }): EvalResult {
  if (!input.tvusg_iug_seen && input.bhcg_trend !== 'falling') {
    return {
      triage: 'urgent',
      next: input.mtx_candidate ? ['MTX criteria checklist', 'consent'] : ['diagnostic laparoscopy path', 'serial β-hCG + TVUSG'],
      citations: CITE,
    }
  }
  return { triage: 'routine', next: ['continue viability follow'], citations: CITE }
}

export function evaluateAbortus(input: { type: 'threatened' | 'incomplete' | 'missed' | 'septic'; ga_weeks: number }): EvalResult {
  const legal = input.ga_weeks <= 10
  return {
    triage: input.type === 'septic' ? 'emergency' : 'urgent',
    next: [
      'misoprostol protocol if indicated',
      legal ? 'küretaj legal packet ≤10w' : 'indicated board / tahliye path',
    ],
    citations: CITE_GYN,
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
    citations: CITE,
  }
}

export function evaluateGDM(input: { ogtt_positive: boolean; on_insulin?: boolean; macrosomia?: boolean }): EvalResult {
  if (!input.ogtt_positive) {
    return {
      triage: 'routine',
      next: ['diet counseling if screen pending'],
      citations: CITE,
      conflict: true,
      sb_required: { next: ['75g OGTT or 50+100 at 24–28w (DÖBYR/SUT)'] },
      acog_recommended: { next: ['GDM screening per current ACOG PB (verify number at implement time)'] },
      uiHint: UI_HINT_YASAL_VS_KLINIK,
    }
  }
  return {
    triage: input.on_insulin || input.macrosomia ? 'urgent' : 'routine',
    next: ['diet', input.on_insulin ? 'insulin titration' : 'trial of diet', input.macrosomia ? 'growth USG / delivery plan' : 'fetal growth watch'],
    citations: CITE,
  }
}

export function evaluateIUGR(input: { stage: 'ua' | 'mca' | 'dv' }): EvalResult {
  const next = {
    ua: ['UA Doppler', 'repeat growth'],
    mca: ['MCA after UA', 'surveillance intensify'],
    dv: ['DV stage — delivery decision'],
  }[input.stage]
  return { triage: input.stage === 'dv' ? 'emergency' : 'urgent', next, citations: CITE }
}

export function evaluateRh(input: { rh: 'D+' | 'D-' | 'unknown'; idc: 'positive' | 'negative' | 'unknown' | 'not_tested'; ga_weeks: number }): EvalResult {
  if (input.rh !== 'D-' || input.idc !== 'negative') {
    return { triage: 'routine', next: ['Anti-D not indicated on this Rh/IDC pair'], citations: CITE }
  }
  return {
    triage: 'routine',
    next: input.ga_weeks >= 27 && input.ga_weeks <= 29 ? ['Anti-D 300 µg now'] : ['plan Anti-D ~28w', 'postpartum if neonate Rh+'],
    citations: CITE,
  }
}

export function evaluateICP(input: { bile_acids_umol: number }): EvalResult {
  if (input.bile_acids_umol >= 40) return { triage: 'urgent', next: ['ursodeoxycholic acid path', 'delivery timing'], citations: CITE }
  if (input.bile_acids_umol >= 10) return { triage: 'routine', next: ['repeat bile acids', 'pruritus care'], citations: CITE }
  return { triage: 'routine', next: ['ICP unlikely'], citations: CITE }
}

export function evaluateVTE(input: { score: number }): EvalResult {
  return {
    triage: input.score >= 3 ? 'urgent' : 'routine',
    next: input.score >= 3 ? ['enoxaparin pregnancy note', 'anesthesia plan'] : ['mobility / hydration'],
    citations: CITE,
  }
}

/** GBS: ACOG universal culture ~36–37w vs DÖBYR 35–37w if protocol. Never collapse. */
export function evaluateGBS(input: {
  ga_weeks: number
  kultur?: 'pozitif' | 'negatif' | 'bekleniyor' | null
}): EvalResult {
  const inWindow = input.ga_weeks >= 35 && input.ga_weeks <= 37
  const pozitif = input.kultur === 'pozitif'
  return {
    triage: pozitif ? 'urgent' : 'routine',
    next: pozitif
      ? ['intrapartum penicillin path', 'newborn handoff GBS+']
      : inWindow
        ? ['GBS culture this window']
        : ['plan GBS culture 35–37w'],
    citations: CITE,
    conflict: true,
    sb_required: { next: ['35–37w GBS if protocol (DÖBYR)'] },
    acog_recommended: { next: ['universal culture-based screen ~36–37w (ACOG CO 797)'] },
    uiHint: UI_HINT_YASAL_VS_KLINIK,
  }
}

export function evaluateTTTS(input: { stage: 1 | 2 | 3 | 4 | 5 }): EvalResult {
  return {
    triage: input.stage >= 2 ? 'emergency' : 'urgent',
    next: ['monochorionic surveillance', `Quintero stage ${input.stage}`, 'laser/sevk path if ≥2'],
    citations: CITE,
  }
}

export function evaluateLabor(input: { bishop: number; nst: 'I' | 'II' | 'III'; oxytocin?: boolean }): EvalResult {
  return {
    triage: input.nst === 'III' ? 'emergency' : input.nst === 'II' ? 'urgent' : 'routine',
    next: ['partogram', `Bishop ${input.bishop}`, `NST cat ${input.nst}`, input.oxytocin ? 'oxytocin running' : 'oxytocin not started'],
    citations: CITE,
  }
}

export function evaluateCS(input: { indication: string; prior_cs?: boolean }): EvalResult {
  return {
    triage: 'urgent',
    next: input.prior_cs ? ['VBAC counseling', 'uterine rupture signs', input.indication] : ['CS indication note', input.indication],
    citations: CITE,
  }
}

export function evaluateShoulderDystocia(): EvalResult {
  return { triage: 'emergency', next: ['HELPERR / McRoberts', 'suprapubic', 'document head-to-body interval'], citations: CITE }
}

export function evaluateEclampsia(): EvalResult {
  return { triage: 'emergency', next: ['seizure algorithm', 'airway', 'MgSO4', 'delivery after stabilize'], citations: CITE }
}
