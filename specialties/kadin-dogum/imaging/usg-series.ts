/**
 * USG series locked to the episode dating method (sat | crl).
 * 3D/4D souvenir must set nonDiagnostic true. Never auto-delete. coreImageId only.
 */
import type { UsgSeriesPayload, UsgStudyPayload } from '../schema'
import { hadlockEfwG } from '../engines/growth-curve'

export const USG_NEVER_AUTO_DELETE = true

export function lockSeriesToDating(series: UsgSeriesPayload, ga_locked: 'sat' | 'crl'): boolean {
  if (series.datingMethod !== ga_locked) return false
  return series.studies.every((s) => s.datingMethod === ga_locked)
}

export function markSouvenir3d4d(study: Omit<UsgStudyPayload, 'kind' | 'nonDiagnostic'>): UsgStudyPayload {
  return { ...study, kind: '3d4d_hatira', nonDiagnostic: true }
}

export function compareGrowth(series: UsgSeriesPayload, fetusId: 'A' | 'B') {
  const points = series.studies
    .filter((s) => s.fetusId === fetusId && (s.kind === 'buyume' || s.kind === 'ayrintili_18_22' || s.kind === 'nt_11_14'))
    .sort((a, b) => a.gaWeeksDays.weeks * 7 + a.gaWeeksDays.days - (b.gaWeeksDays.weeks * 7 + b.gaWeeksDays.days))
    .map((s) => {
      const efw = s.measurements.efw ?? hadlockEfwG({
        HC: s.measurements.hc,
        AC: s.measurements.ac,
        FL: s.measurements.fl,
      })
      return {
        studyId: s.id,
        gaDays: s.gaWeeksDays.weeks * 7 + s.gaWeeksDays.days,
        kind: s.kind,
        efw_g: efw,
        coreImageId: s.coreImageId,
      }
    })
  const declining = points.length >= 2 && points.every((p, i) => {
    if (i === 0) return true
    const prev = points[i - 1].efw_g
    return p.efw_g != null && prev != null && p.efw_g < prev
  })
  return { points, iugr_flag: declining }
}

export function detailedAndGrowthPair(series: UsgSeriesPayload): { detailed: UsgStudyPayload | null; growth: UsgStudyPayload | null } {
  return {
    detailed: series.studies.find((s) => s.kind === 'ayrintili_18_22') ?? null,
    growth: series.studies.find((s) => s.kind === 'buyume') ?? null,
  }
}
