import type { EvalResult } from './eval'
import type { Admission } from '../schema'

export function evaluateEmergency(kind: Admission['reason'] | 'angioedema_airway' | 'necrotizing'): EvalResult {
  const photoOnce = kind === 'sjs_ten' || kind === 'eritrodermi' || kind === 'necrotizing' || kind === 'angioedema_airway'
  return {
    triage: 'emergency',
    next: ['stabilize', 'consult', photoOnce ? 'photo once only if safe' : 'photo plan defer'],
    citations: ['bolognia-5'],
    photoPlan: photoOnce ? ['single overview if safe'] : [],
  }
}

export function yatisVisitType(): 'yatis' {
  return 'yatis'
}

export function consultVisitType(): 'konsultasyon' {
  return 'konsultasyon'
}
