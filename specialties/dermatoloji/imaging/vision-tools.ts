/**
 * Asistan vision tools. Wrap core görüntüleme (hasta_goruntulemeler /api/doktor/goruntuleme).
 * analyze_image always returns VisionRead status draft.
 * Asistan cannot finalize. Dual-sign: asistan draft → uzman onay.
 */
import type { BeforeAfterPair, ImageSeries, PhotoAsset, TotalBodyMap, VisionRead } from '../schema'
import { pinNode } from './total-body-map'
import { pairBeforeAfter } from './before-after'

export const VISION_DISCLAIMER = 'Tarama desteği, tanı değildir. Doktor onayı gerekir.' as const

export const CORE_GORUNTULEME_PATH = '/api/doktor/goruntuleme'

export type VisionTask = VisionRead['task']
export type Actor = 'asistan' | 'uzman'

export function listSeries(series: ImageSeries[]): ImageSeries[] {
  return series
}

export function getImages(photos: PhotoAsset[], ids: string[]): PhotoAsset[] {
  const want = new Set(ids)
  return photos.filter((p) => want.has(p.id) || want.has(p.coreImageId))
}

export function compareBeforeAfter(before: PhotoAsset, after: PhotoAsset, lesionId: string) {
  return pairBeforeAfter(before, after, lesionId)
}

export function analyzeImage(input: {
  assetIds: string[]
  task: VisionTask
  actor: Actor
  observations: string
  differentials?: string[]
  next_step?: string
}): VisionRead {
  return {
    id: `vr-${input.assetIds.join('-')}-${input.task}`,
    assetIds: input.assetIds,
    task: input.task,
    status: 'draft',
    drafted_by: input.actor,
    approved_by: null,
    observations: input.observations.trim()
      || 'Taslak gözlem: tarama desteği. Melanom tanısı konulmaz. Doktor onayı gerekir.',
    differentials: input.differentials ?? [],
    next_step: input.next_step ?? '',
    disclaimer: VISION_DISCLAIMER,
  }
}

export function pinToBodyMap(map: TotalBodyMap, nodeId: string): TotalBodyMap {
  return pinNode(map, nodeId)
}

export function attachToVisit(photo: PhotoAsset, visitId: string) {
  return { coreImageId: photo.coreImageId, visitId, photoId: photo.id }
}

export function requestDualReview(read: VisionRead): VisionRead {
  if (read.status === 'onayli') return read
  return { ...read, status: 'draft' }
}

export function uzmanOnay(read: VisionRead, actor: Actor): { ok: true; read: VisionRead } | { ok: false; reason: string } {
  if (actor !== 'uzman') {
    return {
      ok: false,
      reason: asistanSelfApproveBlocked(read, actor)
        ? 'dual-sign cannot self-approve as asistan'
        : 'asistan cannot finalize a VisionRead',
    }
  }
  return {
    ok: true,
    read: { ...read, status: 'onayli', approved_by: 'uzman' },
  }
}

export function asistanSelfApproveBlocked(read: VisionRead, actor: Actor): boolean {
  return actor === 'asistan' && read.drafted_by === 'asistan'
}

export const DERM_TOOLS = [
  'derm.list_series',
  'derm.get_images',
  'derm.compare_before_after',
  'derm.analyze_image',
  'derm.pin_to_body_map',
  'derm.attach_to_visit',
  'derm.request_dual_review',
] as const
