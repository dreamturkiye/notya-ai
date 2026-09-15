/**
 * Body-map pins. Node ids are specialty metadata; pixels stay in core görüntüleme.
 */
import type { Lesion, PhotoAsset, TotalBodyMap } from '../schema'
import { pinNode } from '../imaging/total-body-map'

export type BodyPin = {
  nodeId: string
  lesionId: string
  region: string
  photoIds: string[]
}

export function pinLesion(map: TotalBodyMap, lesion: Lesion): { map: TotalBodyMap; pin: BodyPin } {
  const nodeId = lesion.body_map_node ?? `node-${lesion.id}`
  return {
    map: pinNode(map, nodeId),
    pin: { nodeId, lesionId: lesion.id, region: lesion.region, photoIds: [] },
  }
}

export function attachPhotosToPin(pin: BodyPin, photos: PhotoAsset[]): BodyPin {
  return {
    ...pin,
    photoIds: photos.filter((p) => p.lesionId === pin.lesionId).map((p) => p.id),
  }
}
