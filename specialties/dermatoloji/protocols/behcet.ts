import type { EvalResult } from './eval'
import type { BehcetCard } from '../schema'

export function evaluateBehcet(card: BehcetCard): EvalResult {
  return {
    triage: card.eye ? 'urgent' : 'routine',
    next: [
      card.oral ? 'Oral ülser var' : 'Oral ülser yok',
      card.genital ? 'Genital ülser var — fotoğraf için ek onam' : 'Genital ülser yok',
      card.eye ? 'Göz tutulumu — sevk' : 'Göz muayenesi',
      card.pathergy ? 'Paterji pozitif' : 'Paterji testi',
      card.isgCriteriaMet ? 'ISG kriterleri karşılandı' : 'ISG kriterleri eksik',
    ],
    citations: ['alpsoy-behcet'],
    photoPlan: ['mucosa'],
  }
}
