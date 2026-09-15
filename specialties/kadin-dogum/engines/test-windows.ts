/**
 * Screening / diagnostic windows. Missed window → overdue, never silent skip.
 * Screens are not diagnoses; high risk opens a consent path for NIPT / invasive tests.
 * SUT: ikili P.901.120, üçlü P.904.090; NIPT usually out of pocket.
 */
import { gaToDays, parseGaToken, type GaWeeksDays } from './dates'
import type { KadinDogumPayload } from '../schema'

export type WindowId =
  | 'serial_bhcg_tvusg'
  | 'first_visit_labs'
  | 'ikili_nt'
  | 'nipt_optional'
  | 'triple_quad_afp'
  | 'ayrintili_usg'
  | 'uterin_doppler'
  | 'ogtt_gdm'
  | 'anti_d_28'
  | 'nst_bpp_growth'
  | 'gbs_prezentasyon'
  | 'cvs'
  | 'amnio'
  | 'kordosentez'
  | 'fetal_echo'
  | 'souvenir_3d4d'

export type WindowStatus = 'not_yet' | 'open' | 'overdue' | 'done'

export type TestWindow = {
  id: WindowId
  label: string
  /** Inclusive GA tokens, e.g. 11+0 */
  open: string
  close: string
  indicated_only?: boolean
  sut_code?: string
  out_of_pocket?: boolean
  non_diagnostic?: boolean
  notes: string[]
}

export const TEST_WINDOWS: TestWindow[] = [
  {
    id: 'serial_bhcg_tvusg',
    label: 'Seri β-hCG + TVUSG canlılık / ektopik / abortus',
    open: '4+0',
    close: '8+6',
    notes: ['4–8w'],
  },
  {
    id: 'first_visit_labs',
    label: 'İlk vizit panel',
    open: '0+0',
    close: '14+0',
    notes: ['kan grubu', 'Rh', 'IDC', 'CBC', 'ferritin', 'TSH', 'HBsAg', 'HIV/VDRL/HCV per protocol', 'U/A+culture', 'glucose'],
  },
  {
    id: 'ikili_nt',
    label: 'Kombine / ikili NT + nazal kemik + PAPP-A + free β-hCG (T21/T18)',
    open: '11+0',
    close: '13+6',
    sut_code: 'P.901.120',
    notes: ['11+0 to 13+6'],
  },
  {
    id: 'nipt_optional',
    label: 'NIPT (opsiyonel)',
    open: '11+0',
    close: '14+0',
    out_of_pocket: true,
    notes: ['11–14 optional NIPT; usually out of pocket; high risk opens consent path'],
  },
  {
    id: 'triple_quad_afp',
    label: 'Üçlü AFP+hCG+uE3 veya dörtlü +inhibin-A; ikili yapıldıysa yalnız AFP (NTD)',
    open: '16+0',
    close: '20+0',
    sut_code: 'P.904.090',
    notes: ['16–20'],
  },
  {
    id: 'ayrintili_usg',
    label: 'Ayrıntılı / 2. düzey USG + servikal uzunluk',
    open: '18+0',
    close: '22+0',
    notes: ['18–22'],
  },
  {
    id: 'uterin_doppler',
    label: 'Uterin arter Doppler (PE/IUGR indicated)',
    open: '20+0',
    close: '24+0',
    indicated_only: true,
    notes: ['20–24 if indicated PE/IUGR'],
  },
  {
    id: 'ogtt_gdm',
    label: '75g OGTT veya 50+100, CBC, IDC if Rh−',
    open: '24+0',
    close: '28+0',
    notes: ['24–28'],
  },
  {
    id: 'anti_d_28',
    label: 'Anti-D 300 µg ~28w',
    open: '27+0',
    close: '29+0',
    notes: ['Rh− IDC− only'],
  },
  {
    id: 'nst_bpp_growth',
    label: 'NST / BPP / büyüme USG / UA–MCA Doppler as indicated',
    open: '28+0',
    close: '42+0',
    indicated_only: true,
    notes: ['28+'],
  },
  {
    id: 'gbs_prezentasyon',
    label: 'GBS if protocol + prezentasyon USG',
    open: '35+0',
    close: '37+0',
    notes: ['35–37'],
  },
  {
    id: 'cvs',
    label: 'CVS',
    open: '10+0',
    close: '13+6',
    indicated_only: true,
    notes: ['diagnosis not screening'],
  },
  {
    id: 'amnio',
    label: 'Amniyosentez',
    open: '16+0',
    close: '22+6',
    indicated_only: true,
    notes: ['16+; diagnosis not screening'],
  },
  {
    id: 'kordosentez',
    label: 'Kordosentez',
    open: '18+0',
    close: '34+0',
    indicated_only: true,
    notes: ['indicated only'],
  },
  {
    id: 'fetal_echo',
    label: 'Fetal eko',
    open: '18+0',
    close: '24+0',
    indicated_only: true,
    notes: ['diagnosis not screening'],
  },
  {
    id: 'souvenir_3d4d',
    label: '24–32w 3D/4D hatıra',
    open: '24+0',
    close: '32+0',
    non_diagnostic: true,
    notes: ['non_diagnostic true; optional monthly clinic USG is separate'],
  },
]

export type EvaluatedWindow = TestWindow & { status: WindowStatus; ga: GaWeeksDays }

function inRange(total: number, open: string, close: string): boolean {
  return total >= parseGaToken(open).totalDays && total <= parseGaToken(close).totalDays
}

export function windowStatus(win: TestWindow, ga: GaWeeksDays, done: boolean): WindowStatus {
  if (done) return 'done'
  const total = ga.totalDays
  if (total < parseGaToken(win.open).totalDays) return 'not_yet'
  if (inRange(total, win.open, win.close)) return 'open'
  return 'overdue'
}

export function evaluateWindows(ga: GaWeeksDays, doneIds: readonly WindowId[] = []): EvaluatedWindow[] {
  return TEST_WINDOWS.map((win) => ({
    ...win,
    ga,
    status: windowStatus(win, ga, doneIds.includes(win.id)),
  }))
}

export function evaluateWindowsAtWeeks(weeks: number, days: number, doneIds: readonly WindowId[] = []): EvaluatedWindow[] {
  return evaluateWindows({ weeks, days, totalDays: gaToDays(weeks, days) }, doneIds)
}

/** Anti-D ~28w only if Rh− and IDC−. */
export function antiDIndicated(rh: KadinDogumPayload['rh'], idc: KadinDogumPayload['idc_history']): boolean {
  return rh === 'D-' && idc === 'negative'
}

export function souvenir3d4d(gaWeeks: number): { eligible: boolean; non_diagnostic: true } {
  return { eligible: gaWeeks >= 24 && gaWeeks <= 32, non_diagnostic: true }
}
