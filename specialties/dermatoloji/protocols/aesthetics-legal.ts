import type { EvalResult } from './eval'

export const SALON_IPL = { nm_lo: 600, nm_hi: 1200, diode_max_j: 20 }

export function evaluateAesthetics(input: {
  modality: 'physician_laser' | 'filler' | 'botox' | 'deep_peel' | 'salon_ipl'
  fitzpatrick: string
  test_spot?: boolean
}): EvalResult {
  const physicianOnly = input.modality !== 'salon_ipl'
  return {
    triage: 'routine',
    next: [
      physicianOnly ? 'medical laser/filler/botox/deep peel physician-only' : `salon IPL ${SALON_IPL.nm_lo}–${SALON_IPL.nm_hi}nm diode ≤${SALON_IPL.diode_max_j} J/cm²`,
      'complication intake',
      'lot numbers',
      `Fitzpatrick ${input.fitzpatrick}`,
      input.test_spot ? 'test spot done' : 'test spot',
    ],
    citations: ['ayakta-teshis'],
    photoPlan: ['islem_oncesi', 'islem_sonrasi'],
  }
}
