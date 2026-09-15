import type { EvalResult } from './eval'

export function evaluateNevus(input: { ugly_duckling: boolean; digital_map?: boolean }): EvalResult {
  return {
    triage: input.ugly_duckling ? 'urgent' : 'routine',
    next: [
      input.ugly_duckling ? 'ugly duckling' : 'routine mole check',
      input.digital_map ? 'digital map' : 'consider molemax/fotofinder/manual',
      'follow-up interval 3–12 months',
      'excision + pathology return if indicated',
    ],
    citations: ['bolognia-5', 'euromelanoma'],
    photoPlan: ['klinik_genel', 'klinik_yakin', 'dermoskopi_polarize'],
  }
}
