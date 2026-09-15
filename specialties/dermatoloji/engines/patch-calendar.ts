import { addDays, diffDays } from './dates'
import type { PatchCourse } from '../schema'

export type PatchStatus = 'not_yet' | 'open_d2' | 'open_d4' | 'done' | 'overdue_d2' | 'overdue_d4'

export function plannedReads(appliedAt: string): { d2: string; d4: string } {
  return { d2: addDays(appliedAt, 2), d4: addDays(appliedAt, 4) }
}

export function patchStatus(course: PatchCourse, todayIso: string): PatchStatus {
  const { d2, d4 } = plannedReads(course.appliedAt)
  if (course.readD2 && course.readD4) return 'done'
  if (!course.readD2) {
    if (diffDays(todayIso, d2) > 0) return 'overdue_d2'
    if (todayIso === d2 || (diffDays(todayIso, course.appliedAt) >= 2 && diffDays(todayIso, d2) <= 0)) return 'open_d2'
    return 'not_yet'
  }
  if (!course.readD4) {
    if (diffDays(todayIso, d4) > 0) return 'overdue_d4'
    if (todayIso === d4 || diffDays(todayIso, d2) >= 0) return 'open_d4'
  }
  return 'done'
}

export const EUROPEAN_BASELINE_STUB = [
  'nickel sulfate',
  'fragrance mix I',
  'MCI/MI',
  'formaldehyde',
  'cobalt chloride',
  'balsam of Peru',
  'colophony',
] as const
