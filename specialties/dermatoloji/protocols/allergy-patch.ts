import type { EvalResult } from './eval'
import { EUROPEAN_BASELINE_STUB } from '../engines/patch-calendar'

export function evaluatePatch(input: { photopatch?: boolean }): EvalResult {
  return {
    triage: 'routine',
    next: [
      `European baseline stub (${EUROPEAN_BASELINE_STUB.length} antigens)`,
      'apply day 0, read D2 and D4',
      'photo each read',
      input.photopatch ? 'photopatch flag' : 'standard patch',
    ],
    citations: ['temel-derm'],
    photoPlan: ['yama_d2', 'yama_d4'],
  }
}
