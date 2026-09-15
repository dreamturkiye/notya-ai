/**
 * Capture protocol: overview + close-up; scale if possible; same lighting;
 * dermoscopy after clinical; reject compare if region mismatch.
 * Wraps core görüntüleme — stores coreImageId only.
 */
import type { PhotoAsset } from '../schema'

export type CaptureCheck = { ok: true } | { ok: false; reason: string }

export function hasOverviewAndCloseup(photos: PhotoAsset[], lesionId: string): CaptureCheck {
  const set = photos.filter((p) => p.lesionId === lesionId)
  const genel = set.some((p) => p.kind === 'klinik_genel')
  const yakin = set.some((p) => p.kind === 'klinik_yakin')
  if (!genel || !yakin) return { ok: false, reason: 'need klinik_genel + klinik_yakin' }
  return { ok: true }
}

export function dermoscopyAfterClinical(photos: PhotoAsset[], lesionId: string): CaptureCheck {
  const set = photos.filter((p) => p.lesionId === lesionId)
  const clinical = set.filter((p) => p.kind === 'klinik_genel' || p.kind === 'klinik_yakin')
  const derm = set.filter((p) => p.kind === 'dermoskopi_polarize' || p.kind === 'dermoskopi_immersion')
  if (!derm.length) return { ok: true }
  if (!clinical.length) return { ok: false, reason: 'dermoscopy after clinical' }
  return { ok: true }
}

export function sameRegion(a: PhotoAsset, b: PhotoAsset): CaptureCheck {
  if (a.region !== b.region) return { ok: false, reason: 'region mismatch' }
  return { ok: true }
}
