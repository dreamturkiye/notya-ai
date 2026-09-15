import type { EvalResult } from './eval'

export function evaluateAtopic(input: { easi: number; face_or_hand?: boolean }): EvalResult {
  const step = input.easi >= 16 ? 'systemic / phototherapy consider' : input.easi >= 7 ? 'topical step-up' : 'emollient + low-potency'
  return {
    triage: input.easi >= 16 ? 'urgent' : 'routine',
    next: [step, 'TDD 2018 ladder'],
    citations: ['tdd-ad-2018'],
    photoPlan: ['baseline', 'week 4'],
  }
}
