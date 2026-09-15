import type { EvalResult } from './eval'
import { diffDays } from '../engines/dates'

export type BzbhKind = 'sifiliz' | 'gonore' | 'hiv' | 'sark_cibani' | 'lepra'

export function evaluateBzbh(kind: BzbhKind): EvalResult {
  const form014 = true
  return {
    triage: kind === 'hiv' ? 'urgent' : 'routine',
    next: kind === 'sark_cibani'
      ? ['endemic SE Anatolia/Çukurova', 'dermatologist-led treat', '3-month follow-up ×1 year', 'Form 014']
      : kind === 'lepra'
        ? ['lepra report', 'Form 014']
        : ['TDD CYBE algorithm', form014 ? 'Form 014/TSİM' : ''],
    citations: ['tdd-cybe', 'bzbh-014'],
    photoPlan: kind === 'sark_cibani' ? ['baseline', 'month 3', 'month 6', 'month 9', 'month 12'] : ['lesion'],
  }
}

/** Şark çıbanı: 3-month follow-up for 1 year. Overdue if last visit > 90 days and course < 365 days. */
export function sarkCibaniFollowUpOverdue(input: {
  startIso: string
  lastVisitIso: string
  todayIso: string
}): boolean {
  const courseDays = diffDays(input.todayIso, input.startIso)
  if (courseDays > 365) return false
  return diffDays(input.todayIso, input.lastVisitIso) > 90
}
