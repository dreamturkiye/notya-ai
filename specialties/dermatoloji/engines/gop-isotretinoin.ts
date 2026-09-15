/**
 * GÖP isotretinoin. SUT: dermatologist-only 2026.
 * Female: two contraception, beta-hCG <14 days, start cycle day 2–3.
 * Male: pregnancy / β-hCG / cycle-day gates do not apply.
 * Rx ≤30 days applies regardless of sex. Acitretin: 3-year pregnancy ban.
 */
import { diffDays } from './dates'

export type GopSex = 'female' | 'male' | 'unknown'

export type GopInput = {
  two_contraception: boolean
  hcg_iso: string | null
  hcg_negative: boolean
  cycle_day: number | null
  rx_days: number
  start_iso: string
  today_iso: string
  /** Defaults to unknown → pregnancy rules apply (safer). Male skips them. */
  sex?: GopSex
}

export const GOP_BLOCK = {
  twoContraception: 'Çift kontrasepsiyon gerekli',
  negativeHcg: 'Negatif β-hCG gerekli',
  staleHcg: 'β-hCG 14 günden eski olmamalı',
  cycleDay: 'Başlangıç siklusun 2–3. gününde olmalı',
  rxDays: 'Reçete süresi en fazla 30 gün',
} as const

export const GOP_NA_PREGNANCY = [
  'Çift kontrasepsiyon (kadın hasta)',
  'Negatif β-hCG (kadın hasta)',
  'Siklus 2–3. gün başlangıcı (kadın hasta)',
] as const

export type GopResult =
  | { allowed: true; notApplicable?: string[] }
  | { allowed: false; blocks: string[]; notApplicable?: string[] }

export function gopIsotretinoin(input: GopInput): GopResult {
  const sex = input.sex ?? 'unknown'
  const pregnancyApplies = sex !== 'male'
  const blocks: string[] = []
  const notApplicable = pregnancyApplies ? undefined : [...GOP_NA_PREGNANCY]

  if (pregnancyApplies) {
    if (!input.two_contraception) blocks.push(GOP_BLOCK.twoContraception)
    if (!input.hcg_iso || !input.hcg_negative) blocks.push(GOP_BLOCK.negativeHcg)
    else if (diffDays(input.today_iso, input.hcg_iso) >= 14) blocks.push(GOP_BLOCK.staleHcg)
    if (input.cycle_day == null || input.cycle_day < 2 || input.cycle_day > 3) {
      blocks.push(GOP_BLOCK.cycleDay)
    }
  }

  if (input.rx_days > 30) blocks.push(GOP_BLOCK.rxDays)

  if (blocks.length) {
    return notApplicable ? { allowed: false, blocks, notApplicable } : { allowed: false, blocks }
  }
  return notApplicable ? { allowed: true, notApplicable } : { allowed: true }
}

export function acitretinPregnancyBanYears(): number {
  return 3
}

export function postStopHcgDue(stopIso: string, todayIso: string): boolean {
  return diffDays(todayIso, stopIso) >= 28
}
