import type { EvalResult } from './eval'

export function evaluateBiologic(input: { tb_screen: boolean; hbv_screen: boolean }): EvalResult {
  return {
    triage: input.tb_screen && input.hbv_screen ? 'routine' : 'urgent',
    next: [
      'TB ve HBV taramaları',
      'Canlı aşı yapılmaz',
      'Önce aylık, sonra üç ayda bir izlem',
      'SUT basamağı + rapor',
    ],
    citations: ['sut-2026', 'psokid-2025'],
    photoPlan: ['baseline', 'week 12'],
  }
}
