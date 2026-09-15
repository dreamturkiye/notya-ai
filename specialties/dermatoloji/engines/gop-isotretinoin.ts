/**
 * GÖP isotretinoin. SUT: dermatologist-only 2026.
 * Two contraception, beta-hCG <14 days, start cycle day 2–3, Rx ≤30 days, post-stop 1 month test.
 * Acitretin: 3-year pregnancy ban.
 */
import { diffDays } from './dates'

export type GopInput = {
  two_contraception: boolean
  hcg_iso: string | null
  hcg_negative: boolean
  cycle_day: number | null
  rx_days: number
  start_iso: string
  today_iso: string
}

export type GopResult = { allowed: true } | { allowed: false; blocks: string[] }

export function gopIsotretinoin(input: GopInput): GopResult {
  const blocks: string[] = []
  if (!input.two_contraception) blocks.push('two contraception required')
  if (!input.hcg_iso || !input.hcg_negative) blocks.push('negative beta-hCG required')
  else if (diffDays(input.today_iso, input.hcg_iso) >= 14) blocks.push('beta-hCG must be <14 days')
  if (input.cycle_day == null || input.cycle_day < 2 || input.cycle_day > 3) {
    blocks.push('start cycle day 2–3')
  }
  if (input.rx_days > 30) blocks.push('Rx ≤30 days')
  return blocks.length ? { allowed: false, blocks } : { allowed: true }
}

export function acitretinPregnancyBanYears(): number {
  return 3
}

export function postStopHcgDue(stopIso: string, todayIso: string): boolean {
  return diffDays(todayIso, stopIso) >= 28
}
