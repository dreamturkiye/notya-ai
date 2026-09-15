/** TBSE by risk 3–12 months; Euromelanoma May; KETEM breast/cervix/colon as HINTS only. */
export type RiskBand = 'low' | 'medium' | 'high'

export function tbseIntervalMonths(risk: RiskBand): number {
  if (risk === 'high') return 3
  if (risk === 'medium') return 6
  return 12
}

export function euromelanomaMonth(): number {
  return 5
}

export const KETEM_HINTS = ['breast', 'cervix', 'colon'] as const
export const KETEM_IS_NOT_SKIN_CANCER = true
