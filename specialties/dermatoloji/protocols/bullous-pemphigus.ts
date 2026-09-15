import type { EvalResult } from './eval'
import type { BullousWorkup } from '../schema'

export function evaluateBullous(w: BullousWorkup): EvalResult {
  const biopsyDif = w.dif
  return {
    triage: biopsyDif ? 'urgent' : 'emergency',
    next: [
      biopsyDif ? 'DIF done' : 'biopsy + DIF required flag',
      'rituximab/CS first line (TR reviews)',
      'inpatient option if extensive',
    ],
    citations: ['pemphigus-tr', 'bolognia-5'],
    photoPlan: ['baseline mucosa + skin', 'week 4'],
  }
}
