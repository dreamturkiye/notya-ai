/**
 * Dual calendar: SB DÖBYR legal minimum (4 izlem) + private Williams/TR clinic overlay + lohusa.
 * Cite DÖBYR 2026 / Doğum Sonu Bakım by role; do not dump book text.
 */
import type { KadinDogumPayload } from '../schema'

export type VisitKind =
  | 'sb_izlem'
  | 'clinic_overlay'
  | 'lohusa_hastane'
  | 'lohusa_asm'
  | 'asm_kadin_15_49'
  | 'clinic_annual_gyn'

export type PlannedVisit = {
  kind: VisitKind
  /** Pregnancy: GA weeks (may be fractional). Lohusa: postpartum day. */
  ga_or_pp_day: number
  sb_required: boolean
  duration_min: number
  checklist: string[]
  izlem_no?: 1 | 2 | 3 | 4
  layer: 'sb' | 'private' | 'lohusa' | 'jinekoloji'
  /** Late booking still counts as izlem 1. */
  late_booking?: boolean
}

const IZLEM1_CHECKLIST = [
  'öykü', 'boy', 'kilo', 'KB', 'kan grubu', 'Rh', 'hemogram', 'idrar', 'HBsAg', 'TSH',
  'risk formu', 'folik asit', 'tetanoz planı', 'e-Nabız gebe bildirimi',
]

const IZLEM2_CHECKLIST = [
  'KB', 'kilo', 'SF', 'FKA', 'idrar protein', 'hemogram', 'demir', 'D vit', 'anomali USG penceresi',
]

/** 28–32w; aliases 24–28 / 26–32 accepted as izlem 3 in comments / matching. */
const IZLEM3_CHECKLIST = [
  'GDM/OGTT', 'Rh', 'IDC', 'Anti-D', 'anemi', 'fetal büyüme',
]

const IZLEM4_CHECKLIST = [
  'prezentasyon', 'plasenta', 'NST', 'doğum yeri', 'sevk',
]

export const SB_IZLEM_WINDOWS = [
  { izlem_no: 1 as const, ga_or_pp_day: 12, week_lo: 0, week_hi: 14, duration_min: 30, checklist: IZLEM1_CHECKLIST, aliases: [] as string[] },
  { izlem_no: 2 as const, ga_or_pp_day: 20, week_lo: 18, week_hi: 24, duration_min: 20, checklist: IZLEM2_CHECKLIST, aliases: [] as string[] },
  // aliases: 24–28 / 26–32 still count as izlem 3
  { izlem_no: 3 as const, ga_or_pp_day: 30, week_lo: 28, week_hi: 32, duration_min: 20, checklist: IZLEM3_CHECKLIST, aliases: ['24-28', '26-32'] },
  { izlem_no: 4 as const, ga_or_pp_day: 37, week_lo: 36, week_hi: 38, duration_min: 20, checklist: IZLEM4_CHECKLIST, aliases: [] as string[] },
]

function sbIzlem(n: 1 | 2 | 3 | 4, over: Partial<PlannedVisit> = {}): PlannedVisit {
  const w = SB_IZLEM_WINDOWS[n - 1]
  return {
    kind: 'sb_izlem',
    ga_or_pp_day: w.ga_or_pp_day,
    sb_required: true,
    duration_min: w.duration_min,
    checklist: w.checklist,
    izlem_no: n,
    layer: 'sb',
    ...over,
  }
}

/**
 * SB four visits. A late booker (first contact after 14w) still receives izlem 1
 * (duration 30 min, full checklist) — the visit is not dropped.
 */
export function sbMinimumFour(bookingGaWeeks: number): PlannedVisit[] {
  const late = bookingGaWeeks > 14
  const izlem1 = sbIzlem(1, late
    ? { ga_or_pp_day: bookingGaWeeks, late_booking: true }
    : { late_booking: false })
  return [izlem1, sbIzlem(2), sbIzlem(3), sbIzlem(4)]
}

function range(start: number, end: number, step: number): number[] {
  const out: number[] = []
  for (let w = start; w <= end + 1e-9; w += step) out.push(Number(w.toFixed(2)))
  return out
}

/**
 * Private overlay (Williams / TR clinic cadence):
 * ≤28w every ~4 weeks; 28–36w every 2 weeks; ≥36w weekly.
 * High risk: weekly or q2w + NST/Doppler.
 */
export function privateOverlay(risk: KadinDogumPayload['risk_class']): PlannedVisit[] {
  const checklist = ['KB', 'kilo', 'SF', 'FKA', 'clinic USG as indicated']
  const high = risk === 'yuksek'
  const nst = high ? ['NST', 'Doppler as indicated'] : []
  const weeks = high
    ? [...range(8, 28, 2), ...range(30, 42, 1)]
    : [...range(8, 28, 4), ...range(30, 36, 2), ...range(37, 40, 1)]

  return weeks.map((w) => ({
    kind: 'clinic_overlay' as const,
    ga_or_pp_day: w,
    sb_required: false,
    duration_min: high ? 20 : 15,
    checklist: [...checklist, ...nst],
    layer: 'private' as const,
  }))
}

export const LOHUSA_DISCHARGE = {
  nsd_min_hours: 24,
  cs_min_hours: 48,
}

/** 6 lohusa visits: hospital 3 + ASM/home 3. Clinic windows days 2–5, 13–17, 30–40. */
export function lohusaCalendar(): PlannedVisit[] {
  const hastane: PlannedVisit[] = [
    { kind: 'lohusa_hastane', ga_or_pp_day: 0, sb_required: true, duration_min: 20, checklist: ['doğum notu', 'kanama', 'KB', 'emzirme', `NSD ≥${LOHUSA_DISCHARGE.nsd_min_hours}s / CS ≥${LOHUSA_DISCHARGE.cs_min_hours}s taburcu`], layer: 'lohusa' },
    { kind: 'lohusa_hastane', ga_or_pp_day: 1, sb_required: true, duration_min: 15, checklist: ['uterus involüsyon', 'loşi', 'ağrı', 'DVT işaretleri'], layer: 'lohusa' },
    { kind: 'lohusa_hastane', ga_or_pp_day: 2, sb_required: true, duration_min: 15, checklist: ['taburculuk eğitimi', 'tehlike işaretleri', 'Anti-D lojistik'], layer: 'lohusa' },
  ]
  const asm: PlannedVisit[] = [
    { kind: 'lohusa_asm', ga_or_pp_day: 3, sb_required: true, duration_min: 20, checklist: ['ASM/ev ziyareti', 'pencere 2–5 gün', 'emzirme', 'yenidoğan'], layer: 'lohusa' },
    { kind: 'lohusa_asm', ga_or_pp_day: 15, sb_required: true, duration_min: 20, checklist: ['pencere 13–17 gün', 'epizyotomi/kesi', 'duygu durum'], layer: 'lohusa' },
    { kind: 'lohusa_asm', ga_or_pp_day: 35, sb_required: true, duration_min: 20, checklist: ['pencere 30–40 gün', 'aile planlaması', '6. hafta kapanış'], layer: 'lohusa' },
  ]
  return [...hastane, ...asm]
}

export function jinekolojiReminders(): PlannedVisit[] {
  return [
    { kind: 'asm_kadin_15_49', ga_or_pp_day: 0, sb_required: false, duration_min: 15, checklist: ['ASM 15–49 kadın 2/yıl hatırlatma'], layer: 'jinekoloji' },
    { kind: 'clinic_annual_gyn', ga_or_pp_day: 0, sb_required: false, duration_min: 20, checklist: ['yıllık jinekoloji', 'HPV/Pap tarama hatırlatma'], layer: 'jinekoloji' },
  ]
}

export function buildIzlemCalendar(input: {
  risk_class: KadinDogumPayload['risk_class']
  booking_ga_weeks: number
  episode_status: KadinDogumPayload['episode_status']
}): PlannedVisit[] {
  if (input.episode_status === 'lohusa') return lohusaCalendar()
  if (input.episode_status === 'kapandi') return []
  return [
    ...sbMinimumFour(input.booking_ga_weeks),
    ...privateOverlay(input.risk_class),
  ]
}
