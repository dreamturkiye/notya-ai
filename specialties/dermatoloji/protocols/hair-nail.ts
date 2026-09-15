import type { EvalResult } from './eval'

export function evaluateHairNail(input: { salt: number }): EvalResult {
  return {
    triage: input.salt >= 50 ? 'urgent' : 'routine',
    next: ['SALT', 'trichoscopy series', 'DPCP note if AA extensive'],
    citations: ['bolognia-5'],
    photoPlan: ['trichoscopy serial'],
  }
}
