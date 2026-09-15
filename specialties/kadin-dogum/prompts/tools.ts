/** Tools the specialty-locked prompt may call. Keep in sync with manifest.toolsWhitelist. */
export const KADIN_DOGUM_TOOLS = [
  { name: 'current_ga', description: 'SAT/CRL-locked current GA w+d' },
  { name: 'izlem_calendar', description: 'SB 4 izlem + private overlay + lohusa' },
  { name: 'test_windows', description: 'Screening windows with overdue flags' },
  { name: 'anti_d_due', description: 'Anti-D only if Rh− IDC−' },
  { name: 'usg_gallery', description: 'Gallery keyed by GA + dating method' },
  { name: 'evaluate_pe', description: 'PE/HELLP checklist' },
  { name: 'evaluate_gdm', description: 'GDM diet/insulin path' },
  { name: 'evaluate_rh', description: 'Rh/IDC Anti-D path' },
  { name: 'kd.list_usg_series', description: 'List SAT/EDD-locked USG series' },
  { name: 'kd.get_usg', description: 'Resolve USG studies by id / coreImageId' },
  { name: 'kd.compare_growth', description: 'Plot measurements over GA per fetus A/B' },
  { name: 'kd.analyze_usg', description: 'Draft USG VisionRead only' },
  { name: 'kd.analyze_nst', description: 'Draft NST VisionRead only' },
  { name: 'kd.request_dual_review', description: 'Asistan draft → uzman onay' },
] as const

export type KadinDogumToolName = (typeof KADIN_DOGUM_TOOLS)[number]['name']
