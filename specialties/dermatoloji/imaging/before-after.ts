import { diffDays } from '../engines/dates'
import type { BeforeAfterPair, PhotoAsset } from '../schema'
import { sameRegion } from './capture-protocol'

export function pairBeforeAfter(before: PhotoAsset, after: PhotoAsset, lesionId: string): BeforeAfterPair | { ok: false; reason: string } {
  const region = sameRegion(before, after)
  if (!region.ok) return region
  if (before.lesionId !== lesionId || after.lesionId !== lesionId) return { ok: false, reason: 'lesion mismatch' }
  const intervalDays = diffDays(after.capturedAt, before.capturedAt)
  if (intervalDays < 0) return { ok: false, reason: 'after precedes before' }
  return {
    id: `ba-${before.id}-${after.id}`,
    lesionId,
    beforePhotoId: before.id,
    afterPhotoId: after.id,
    intervalDays,
    regionMatch: true,
  }
}

export function isotretinoinMonthSeries(month0: PhotoAsset, month3: PhotoAsset, lesionId: string) {
  return pairBeforeAfter(month0, month3, lesionId)
}
