/**
 * Scores stay in this folder. PASI BSA PGA DLQI EASI SCORAD POEM UAS7 VASI SALT Hurley PDAI.
 */
export type PasiRegion = { e: number; i: number; d: number; a: number }

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

/** PASI = 0.1(E+I+D)A head + 0.2 upper + 0.3 trunk + 0.4 lower. E/I/D 0–4, A 0–6. */
export function pasi(input: { head: PasiRegion; upper: PasiRegion; trunk: PasiRegion; lower: PasiRegion }): number {
  const part = (w: number, r: PasiRegion) =>
    w * (clamp(r.e, 0, 4) + clamp(r.i, 0, 4) + clamp(r.d, 0, 4)) * clamp(r.a, 0, 6)
  const v = part(0.1, input.head) + part(0.2, input.upper) + part(0.3, input.trunk) + part(0.4, input.lower)
  return Math.round(v * 10) / 10
}

export function dlqi(items0to3: number[]): number {
  return items0to3.slice(0, 10).reduce((s, n) => s + clamp(n, 0, 3), 0)
}

export function easi(input: { head: PasiRegion; upper: PasiRegion; trunk: PasiRegion; lower: PasiRegion }): number {
  const area = (a: number) => clamp(a, 0, 6)
  const sev = (r: PasiRegion) => clamp(r.e, 0, 3) + clamp(r.i, 0, 3) + clamp(r.d, 0, 3)
  const v = 0.1 * sev(input.head) * area(input.head.a)
    + 0.2 * sev(input.upper) * area(input.upper.a)
    + 0.3 * sev(input.trunk) * area(input.trunk.a)
    + 0.4 * sev(input.lower) * area(input.lower.a)
  return Math.round(v * 10) / 10
}

export function uas7(daily0to6: number[]): number {
  return daily0to6.slice(0, 7).reduce((s, n) => s + clamp(n, 0, 6), 0)
}

export function salt(percent: number): number {
  return clamp(percent, 0, 100)
}

export function pdai(score: number): number {
  return clamp(score, 0, 263)
}

export function hurley(stage: 1 | 2 | 3): 1 | 2 | 3 {
  return stage
}

export function poem(items0to4: number[]): number {
  return items0to4.slice(0, 7).reduce((s, n) => s + clamp(n, 0, 4), 0)
}

export function pga(score0to4: number): number {
  return clamp(score0to4, 0, 4)
}

export function bsaPercent(p: number): number {
  return clamp(p, 0, 100)
}

export function scorad(extent0to100: number, intensity0to18: number, subjective0to20: number): number {
  return Math.round((extent0to100 / 5 + 3.5 * intensity0to18 + subjective0to20) * 10) / 10
}

export function vasi(percent: number): number {
  return clamp(percent, 0, 100)
}
