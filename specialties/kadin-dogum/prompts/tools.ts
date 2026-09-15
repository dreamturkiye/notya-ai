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
] as const

export type KadinDogumToolName = (typeof KADIN_DOGUM_TOOLS)[number]['name']
