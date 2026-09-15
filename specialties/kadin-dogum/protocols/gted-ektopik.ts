/**
 * GTD / ectopic. Protocol references only — do not invent standing MTX doses.
 */
export type BhcgPoint = { at: string; value: number }

export function bhcgSeriesTrend(points: BhcgPoint[]): 'rising' | 'plateau' | 'falling' | 'insufficient' {
  if (points.length < 2) return 'insufficient'
  const sorted = [...points].sort((a, b) => a.at.localeCompare(b.at))
  const a = sorted[sorted.length - 2].value
  const b = sorted[sorted.length - 1].value
  const delta = (b - a) / Math.max(a, 1)
  if (delta > 0.1) return 'rising'
  if (delta < -0.1) return 'falling'
  return 'plateau'
}

export function mtxCriteriaFlags(input: {
  stable: boolean
  no_rupture: boolean
  bhcg_below_threshold: boolean
  no_fetal_cardiac?: boolean
  follow_titers_plan: boolean
}): { eligible_flags: string[]; blocked: string[] } {
  const eligible_flags: string[] = []
  const blocked: string[] = []
  if (input.stable) eligible_flags.push('hemodynamically stable')
  else blocked.push('unstable')
  if (input.no_rupture) eligible_flags.push('no rupture')
  else blocked.push('rupture')
  if (input.bhcg_below_threshold) eligible_flags.push('β-hCG below protocol threshold (cite, do not invent dose)')
  else blocked.push('β-hCG above threshold')
  if (input.no_fetal_cardiac !== false) eligible_flags.push('no fetal cardiac activity')
  if (input.follow_titers_plan) eligible_flags.push('follow titers planned')
  else blocked.push('titers follow missing')
  return { eligible_flags, blocked }
}
