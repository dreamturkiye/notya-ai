import type { EvalResult } from './eval'

export function evaluateUrticaria(input: { weeks: number; angioedema?: boolean }): EvalResult {
  const chronic = input.weeks > 6
  return {
    triage: input.angioedema ? 'urgent' : 'routine',
    next: [
      chronic ? 'chronic >6 weeks' : 'acute',
      'ASST consider',
      'omalizumab stub if antihistamine fail',
    ],
    citations: ['bolognia-5', 'temel-derm'],
    photoPlan: ['wheal diary optional'],
  }
}
