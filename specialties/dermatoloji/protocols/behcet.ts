import type { EvalResult } from './eval'
import type { BehcetCard } from '../schema'

export function evaluateBehcet(card: BehcetCard): EvalResult {
  return {
    triage: card.eye ? 'urgent' : 'routine',
    next: [
      card.oral ? 'oral ulcers' : 'no oral',
      card.genital ? 'genital ulcers — extra consent photos' : 'no genital',
      card.eye ? 'eye refer' : 'eye exam',
      card.pathergy ? 'pathergy pos' : 'pathergy',
      card.isgCriteriaMet ? 'ISG met' : 'ISG incomplete',
    ],
    citations: ['alpsoy-behcet'],
    photoPlan: ['mucosa'],
  }
}
