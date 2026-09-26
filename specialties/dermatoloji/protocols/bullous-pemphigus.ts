import type { EvalResult } from './eval'
import type { BullousWorkup } from '../schema'

export function evaluateBullous(w: BullousWorkup): EvalResult {
  const biopsyDif = w.dif
  return {
    triage: biopsyDif ? 'urgent' : 'emergency',
    next: [
      biopsyDif ? 'DIF yapıldı' : 'Biyopsi + DIF gerekli',
      'Rituksimab / kortikosteroid birinci basamak (TR derlemeleri)',
      'Yaygın tutulumda yatış seçeneği',
    ],
    citations: ['pemphigus-tr', 'bolognia-5'],
    photoPlan: ['baseline mucosa + skin', 'week 4'],
  }
}
