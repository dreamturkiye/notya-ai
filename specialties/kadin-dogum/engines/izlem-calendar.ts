/**
 * Dual calendar: SB DÖBYR legal minimum (4 izlem) + ACOG overlay + lohusa.
 * Cite ACOG (pratik gold) then DÖBYR / Doğum Sonu Bakım (yasal taban) then Williams (ders kitabı).
 * Never put ACOG-only cadence in the sb_required column. Never collapse a conflict.
 */
import type { KadinDogumPayload } from '../schema'
import { citeProtocol, dualWhenConflict, UI_HINT_YASAL_VS_KLINIK, type DualRecommendation } from '../protocols/sources'

export type VisitKind =
  | 'sb_izlem'
  | 'acog_overlay'
  | 'clinic_overlay'
  | 'lohusa_hastane'
  | 'lohusa_asm'
  | 'asm_kadin_15_49'
  | 'clinic_annual_gyn'

export type VisitSource = 'sb' | 'acog' | 'both'

export type PlannedVisit = {
  kind: VisitKind
  /** Pregnancy: GA weeks (may be fractional). Lohusa: postpartum day. */
  ga_or_pp_day: number
  sb_required: boolean
  acog_recommended: boolean
  source: VisitSource
  duration_min: number
  checklist: string[]
  izlem_no?: 1 | 2 | 3 | 4
  layer: 'sb' | 'acog' | 'private' | 'lohusa' | 'jinekoloji'
  /** Late booking still counts as izlem 1. */
  late_booking?: boolean
  /** Recorded izlem week/day marks this planned visit Yapıldı. */
  done?: boolean
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
    acog_recommended: true,
    source: 'both',
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
 * ACOG overlay (not Williams-only): to 28w q4 weeks; 28–36w q2 weeks; ≥36w weekly.
 * High risk: more frequent + NST/Doppler.
 * These rows are never sb_required.
 */
export function acogOverlay(risk: KadinDogumPayload['risk_class']): PlannedVisit[] {
  const checklist = ['KB', 'kilo', 'SF', 'FKA', 'klinik USG (endikasyon varsa)']
  const high = risk === 'yuksek'
  const nst = high ? ['NST', 'Doppler (endikasyon varsa)'] : []
  const weeks = high
    ? [...range(8, 28, 2), ...range(30, 42, 1)]
    : [...range(8, 28, 4), ...range(30, 36, 2), ...range(37, 40, 1)]

  return weeks.map((w) => ({
    kind: 'acog_overlay' as const,
    ga_or_pp_day: w,
    sb_required: false,
    acog_recommended: true,
    source: 'acog' as const,
    duration_min: high ? 20 : 15,
    checklist: [...checklist, ...nst],
    layer: 'acog' as const,
  }))
}

/** Alias kept so existing tests and barrels keep working. Overlay is ACOG cadence. */
export const privateOverlay = acogOverlay

export const LOHUSA_DISCHARGE = {
  nsd_min_hours: 24,
  cs_min_hours: 48,
}

/** 6 lohusa visits: hospital 3 + ASM/home 3. Clinic windows days 2–5, 13–17, 30–40. */
export function lohusaCalendar(): PlannedVisit[] {
  const hastane: PlannedVisit[] = [
    { kind: 'lohusa_hastane', ga_or_pp_day: 0, sb_required: true, acog_recommended: true, source: 'both', duration_min: 20, checklist: ['doğum notu', 'kanama', 'KB', 'emzirme', `NSD ≥${LOHUSA_DISCHARGE.nsd_min_hours}s / CS ≥${LOHUSA_DISCHARGE.cs_min_hours}s taburcu`], layer: 'lohusa' },
    { kind: 'lohusa_hastane', ga_or_pp_day: 1, sb_required: true, acog_recommended: true, source: 'both', duration_min: 15, checklist: ['uterus involüsyon', 'loşi', 'ağrı', 'DVT işaretleri'], layer: 'lohusa' },
    { kind: 'lohusa_hastane', ga_or_pp_day: 2, sb_required: true, acog_recommended: true, source: 'both', duration_min: 15, checklist: ['taburculuk eğitimi', 'tehlike işaretleri', 'Anti-D lojistik'], layer: 'lohusa' },
  ]
  const asm: PlannedVisit[] = [
    { kind: 'lohusa_asm', ga_or_pp_day: 3, sb_required: true, acog_recommended: true, source: 'both', duration_min: 20, checklist: ['ASM/ev ziyareti', 'pencere 2–5 gün', 'emzirme', 'yenidoğan'], layer: 'lohusa' },
    { kind: 'lohusa_asm', ga_or_pp_day: 15, sb_required: true, acog_recommended: true, source: 'both', duration_min: 20, checklist: ['pencere 13–17 gün', 'epizyotomi/kesi', 'duygu durum'], layer: 'lohusa' },
    { kind: 'lohusa_asm', ga_or_pp_day: 35, sb_required: true, acog_recommended: true, source: 'both', duration_min: 20, checklist: ['pencere 30–40 gün', 'aile planlaması', '6. hafta kapanış'], layer: 'lohusa' },
  ]
  return [...hastane, ...asm]
}

export function jinekolojiReminders(): PlannedVisit[] {
  return [
    { kind: 'asm_kadin_15_49', ga_or_pp_day: 0, sb_required: false, acog_recommended: false, source: 'sb', duration_min: 15, checklist: ['ASM 15–49 kadın 2/yıl hatırlatma'], layer: 'jinekoloji' },
    { kind: 'clinic_annual_gyn', ga_or_pp_day: 0, sb_required: false, acog_recommended: true, source: 'acog', duration_min: 20, checklist: ['yıllık jinekoloji', 'HPV/Pap tarama hatırlatma'], layer: 'jinekoloji' },
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
    ...acogOverlay(input.risk_class),
  ]
}

export type CadenceDue = { due: boolean; detail: string }

/**
 * At a given GA, SB due only if an incomplete DÖBYR izlem window is open.
 * ACOG due on q4w / q2w / weekly overlay. Do not collapse when they differ.
 */
export function evaluateCadence(input: {
  ga_weeks: number
  completed_sb_izlem: Array<1 | 2 | 3 | 4>
  risk_class: KadinDogumPayload['risk_class']
}): DualRecommendation<CadenceDue> {
  const sbOpen = SB_IZLEM_WINDOWS.find((w) =>
    !input.completed_sb_izlem.includes(w.izlem_no)
    && input.ga_weeks >= w.week_lo
    && input.ga_weeks <= w.week_hi,
  )
  const interval =
    input.ga_weeks >= 36 ? 'weekly' : input.ga_weeks >= 28 ? 'q2w' : 'q4w'
  const overlay = acogOverlay(input.risk_class)
  const acogHit = overlay.some((v) => Math.abs(v.ga_or_pp_day - input.ga_weeks) <= 1)
  const sb: CadenceDue = {
    due: Boolean(sbOpen),
    detail: sbOpen ? `izlem ${sbOpen.izlem_no} window ${sbOpen.week_lo}–${sbOpen.week_hi}` : 'no open DÖBYR izlem window',
  }
  const acog: CadenceDue = {
    due: acogHit,
    detail: `ACOG ${interval}`,
  }
  return dualWhenConflict(sb, acog, sb.due !== acog.due)
}

export type VisitCountSlice = { enough: boolean; count: number; min: number }

export function completedSbIzlemNos(yapilanHaftalar: readonly number[]): Array<1 | 2 | 3 | 4> {
  return SB_IZLEM_WINDOWS
    .filter((w) => yapilanHaftalar.some((h) => h >= w.week_lo && h <= w.week_hi))
    .map((w) => w.izlem_no)
}

/** Match a recorded GA week to the DÖBYR checklist that should be ticked on + İzlem Ekle. */
export function aktifIzlemPenceresi(hafta: number, completed: readonly (1 | 2 | 3 | 4)[] = []) {
  const open = SB_IZLEM_WINDOWS.find((w) =>
    !completed.includes(w.izlem_no) && hafta >= w.week_lo && hafta <= w.week_hi)
  if (open) return open
  const overdue = [...SB_IZLEM_WINDOWS].reverse().find((w) =>
    !completed.includes(w.izlem_no) && hafta > w.week_hi)
  if (overdue) return overdue
  return SB_IZLEM_WINDOWS.find((w) => !completed.includes(w.izlem_no)) ?? SB_IZLEM_WINDOWS[3]
}

/**
 * Mark planned visits Yapıldı from recorded izlem weeks (pregnancy) or postpartum days (lohusa).
 * One calendar — live CRUD weeks are the truth; chapter overlay does not keep a second done store.
 */
export function markVisitsDone(
  visits: PlannedVisit[],
  input: { completedWeeks?: readonly number[]; completedPpDays?: readonly number[] },
): PlannedVisit[] {
  const weeks = input.completedWeeks ?? []
  const pp = input.completedPpDays ?? []
  const sbDone = new Set(completedSbIzlemNos(weeks))
  return visits.map((v) => {
    if (v.layer === 'sb' && v.izlem_no) return { ...v, done: sbDone.has(v.izlem_no) }
    if (v.layer === 'acog' || v.kind === 'acog_overlay' || v.kind === 'clinic_overlay') {
      return { ...v, done: weeks.some((h) => Math.abs(h - v.ga_or_pp_day) <= 1) }
    }
    if (v.layer === 'lohusa') {
      if (v.kind === 'lohusa_hastane') {
        const lo = v.ga_or_pp_day
        const hi = v.ga_or_pp_day
        return { ...v, done: pp.some((d) => d >= lo && d <= hi) }
      }
      // ASM windows: 2–5, 13–17, 30–40 (anchors 3 / 15 / 35)
      const window = v.ga_or_pp_day <= 5 ? [2, 5] : v.ga_or_pp_day <= 17 ? [13, 17] : [30, 40]
      return { ...v, done: pp.some((d) => d >= window[0] && d <= window[1]) }
    }
    return { ...v, done: false }
  })
}

/** 4 SB visits can satisfy sb_required while ACOG still wants the denser overlay. */
export function visitCountAdequacy(input: {
  completed_sb_izlem: number
  completed_acog_visits: number
  risk_class: KadinDogumPayload['risk_class']
}): DualRecommendation<VisitCountSlice> {
  const sbMin = 4
  const acogMin = acogOverlay(input.risk_class).length
  const sb: VisitCountSlice = {
    enough: input.completed_sb_izlem >= sbMin,
    count: input.completed_sb_izlem,
    min: sbMin,
  }
  const acog: VisitCountSlice = {
    enough: input.completed_acog_visits >= acogMin,
    count: input.completed_acog_visits,
    min: acogMin,
  }
  return {
    ...dualWhenConflict(sb, acog, sb.enough && !acog.enough),
    uiHint: UI_HINT_YASAL_VS_KLINIK,
    citations: citeProtocol('obstetrik'),
  }
}
