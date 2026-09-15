import type { EvalResult } from './eval'

export function evaluatePsoriasis(input: { pasi: number; dlqi: number; psa?: boolean }): EvalResult {
  const systemic = input.pasi >= 10 || input.dlqi >= 10 || input.psa
  return {
    triage: systemic ? 'urgent' : 'routine',
    next: systemic ? ['systemic/biologic path (PSOKİD 2025)', 'TB/HBV screen if biologic'] : ['topical / phototherapy ladder'],
    citations: ['psokid-2025'],
    photoPlan: ['baseline', 'week 4', 'week 12'],
  }
}
