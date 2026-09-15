import type { EvalResult } from './eval'
import type { BedsideTest } from '../schema'

export function evaluateBedside(t: BedsideTest): EvalResult {
  const pos = (Object.keys(t) as Array<keyof BedsideTest>).filter((k) => t[k] === 'pos')
  return {
    triage: pos.includes('pathergy') ? 'urgent' : 'routine',
    next: pos.length ? pos.map(String) : ['KOH Wood Tzanck pathergy demodex darkfield nativeFungus'],
    citations: ['temel-derm'],
    photoPlan: t.wood === 'pos' ? ['wood'] : [],
  }
}
