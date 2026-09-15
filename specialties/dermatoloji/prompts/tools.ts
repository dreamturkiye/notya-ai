/** Tools the specialty-locked prompt may call. Keep in sync with manifest.toolsWhitelist. */
export const DERMATOLOJI_TOOLS = [
  { name: 'derm.list_series', description: 'List ImageSeries for the episode' },
  { name: 'derm.get_images', description: 'Resolve photos by id / coreImageId' },
  { name: 'derm.compare_before_after', description: 'Pair before/after; reject region mismatch' },
  { name: 'derm.analyze_image', description: 'Draft VisionRead only' },
  { name: 'derm.pin_to_body_map', description: 'Pin lesion node on total-body map' },
  { name: 'derm.attach_to_visit', description: 'Attach coreImageId to visit' },
  { name: 'derm.request_dual_review', description: 'Asistan draft → uzman onay' },
] as const

export type DermatolojiToolName = (typeof DERMATOLOJI_TOOLS)[number]['name']
