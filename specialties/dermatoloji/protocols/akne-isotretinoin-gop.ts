import type { EvalResult } from './eval'
import { gopIsotretinoin, type GopInput } from '../engines/gop-isotretinoin'

export function evaluateAkne(input: { nodulocystic: boolean; gop: GopInput }): EvalResult {
  const gop = gopIsotretinoin(input.gop)
  if (input.nodulocystic && !gop.allowed) {
    return {
      triage: 'urgent',
      next: ['GÖP block', ...('blocks' in gop ? gop.blocks : []), 'SUT dermatologist-only isotretinoin'],
      citations: ['tdd-akne', 'gop-kub', 'sut-2026'],
      photoPlan: ['month 0', 'month 1', 'month 3'],
    }
  }
  return {
    triage: 'routine',
    next: input.nodulocystic ? ['isotretinoin GÖP complete', 'Rx ≤30 days'] : ['topical / antibiotic ladder'],
    citations: ['tdd-akne', 'gop-kub'],
    photoPlan: ['month 0', 'month 1', 'month 3'],
  }
}
