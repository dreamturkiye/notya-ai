/**
 * Emergency packs with timestamps. Checklists, not standing orders.
 * Citations: ACOG → DÖBYR → Williams → Temel KD.
 */
import { citeProtocol } from './sources'

export type PackResult = {
  triage: 'emergency' | 'urgent'
  next: string[]
  citations: string[]
  at: string
}

const CITE = citeProtocol('acil')

export function mgso4Pack(input: { at: string; loading?: boolean; maintenance?: boolean }): PackResult & { loading: boolean; maintenance: boolean } {
  return {
    triage: 'emergency',
    loading: input.loading !== false,
    maintenance: Boolean(input.maintenance),
    next: [
      input.loading !== false ? 'MgSO4 loading flag' : 'loading already given',
      input.maintenance ? 'MgSO4 maintenance flag' : 'plan maintenance',
      'reflexes / urine output / respiratory rate',
    ],
    citations: CITE,
    at: input.at,
  }
}

export function eclampsiaSeizurePack(at: string): PackResult {
  return { triage: 'emergency', next: ['airway', 'MgSO4', 'delivery after stabilize'], citations: CITE, at }
}

export function pphPack(input: { at: string; ebl_ml: number; atony?: boolean; trauma?: boolean; tissue?: boolean; thrombin?: boolean }): PackResult & { ebl_ml: number } {
  if (input.ebl_ml == null || Number.isNaN(input.ebl_ml)) {
    throw new Error('PPH requires estimated blood loss field')
  }
  return {
    triage: 'emergency',
    ebl_ml: input.ebl_ml,
    next: ['4T', 'uterotonic sequence stub', `EBL ${input.ebl_ml} ml`],
    citations: CITE,
    at: input.at,
  }
}

export function previaAbruptionPack(at: string): PackResult {
  return { triage: 'emergency', next: ['ABC', 'no PV if previa suspected', 'crossmatch'], citations: CITE, at }
}

export function shoulderDystociaPack(at: string): PackResult {
  return { triage: 'emergency', next: ['McRoberts', 'suprapubic', 'HELPERR', 'head-to-body interval'], citations: CITE, at }
}

export function ppromPack(input: { at: string; ga_weeks: number }): PackResult {
  const acs = input.ga_weeks >= 24 && input.ga_weeks <= 34
  return {
    triage: 'urgent',
    next: ['latency antibiotics', acs ? 'ACS betamethasone window' : 'ACS not in window'],
    citations: CITE,
    at: input.at,
  }
}

export function ptlTocolysisPack(input: { at: string; ga_weeks: number }): PackResult {
  const acs = input.ga_weeks >= 24 && input.ga_weeks <= 34
  return {
    triage: 'urgent',
    next: ['tocolysis checklist', acs ? 'ACS betamethasone window' : 'ACS not in window'],
    citations: CITE,
    at: input.at,
  }
}

export function rupturedEctopicPack(at: string): PackResult {
  return { triage: 'emergency', next: ['ABC', 'surgical path', 'β-hCG + TVUSG if stable enough'], citations: CITE, at }
}
