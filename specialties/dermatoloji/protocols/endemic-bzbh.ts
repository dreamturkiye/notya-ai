import type { EvalResult } from './eval'
import { diffDays } from '../engines/dates'

export type BzbhKind = 'sifiliz' | 'gonore' | 'hiv' | 'sark_cibani' | 'lepra'

export function evaluateBzbh(kind: BzbhKind): EvalResult {
  const form014 = true
  return {
    triage: kind === 'hiv' ? 'urgent' : 'routine',
    next: kind === 'sark_cibani'
      ? ['Güneydoğu Anadolu / Çukurova endemik', 'Tedaviyi dermatolog yönetir', '1 yıl boyunca 3 ayda bir kontrol', 'Form 014']
      : kind === 'lepra'
        ? ['Lepra bildirimi', 'Form 014']
        : ['TDD CYBE algoritması', form014 ? 'Form 014/TSİM' : ''],
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
