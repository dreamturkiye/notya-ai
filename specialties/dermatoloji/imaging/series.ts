import type { ImageSeries, PhotoAsset } from '../schema'

export function timepointAt(series: ImageSeries, label: string) {
  return series.timepoints.find((t) => t.label === label) ?? null
}

export function attachPhotoToTimepoint(series: ImageSeries, label: string, photoId: string, at: string): ImageSeries {
  const existing = series.timepoints.find((t) => t.label === label)
  const timepoints = existing
    ? series.timepoints.map((t) => t.label === label ? { ...t, photoIds: [...t.photoIds, photoId] } : t)
    : [...series.timepoints, { at, label, photoIds: [photoId] }]
  return { ...series, timepoints }
}

export function photosForSeries(series: ImageSeries, photos: PhotoAsset[]): PhotoAsset[] {
  const ids = new Set(series.timepoints.flatMap((t) => t.photoIds))
  return photos.filter((p) => ids.has(p.id) && p.lesionId === series.lesionId)
}

export const NEVER_AUTO_DELETE = true
