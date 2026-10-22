/**
 * Text-free LMS maths (interpolation, z-score, percentile, inverse, curves). No locale strings, so any
 * country build may import it. Extracted from buyumeEgrisi.ts (the Turkish Neyzi tables and wording stay there).
 */

export interface LMSNokta { ay: number; L: number; M: number; S: number }

/** Linear interpolation of L, M, S between the two neighbouring age points. */
export function lmsAra(tablo: LMSNokta[], ayYas: number): LMSNokta | null {
  if (ayYas < 0) return null
  if (ayYas <= tablo[0].ay) return tablo[0]
  if (ayYas >= tablo[tablo.length - 1].ay) return tablo[tablo.length - 1]
  for (let i = 0; i < tablo.length - 1; i++) {
    const a = tablo[i], b = tablo[i + 1]
    if (ayYas >= a.ay && ayYas <= b.ay) {
      const t = (ayYas - a.ay) / (b.ay - a.ay)
      return { ay: ayYas, L: a.L + t * (b.L - a.L), M: a.M + t * (b.M - a.M), S: a.S + t * (b.S - a.S) }
    }
  }
  return null
}

export function zSkorHesapla(deger: number, lms: LMSNokta): number {
  if (Math.abs(lms.L) < 1e-6) return Math.log(deger / lms.M) / lms.S
  return (Math.pow(deger / lms.M, lms.L) - 1) / (lms.L * lms.S)
}


/** Standard normal CDF, Abramowitz-Stegun approximation. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  if (z > 0) p = 1 - p
  return p
}

export interface PersentilSonuc { persentil: number; zSkor: number }

/** Same LMS maths for any reference table. Range checking is the caller's job; values clamp at the table ends. */
export function lmsDegerlendir(tablo: LMSNokta[], ayYas: number, deger: number): PersentilSonuc | null {
  if (!tablo.length || !Number.isFinite(deger) || deger <= 0 || !Number.isFinite(ayYas) || ayYas < 0) return null
  const lms = lmsAra(tablo, ayYas)
  if (!lms) return null
  const z = zSkorHesapla(deger, lms)
  const p = Math.max(0.1, Math.min(99.9, normalCdf(z) * 100))
  return { persentil: p, zSkor: z }
}

/** Inverse standard normal CDF (percentile to z), Acklam's rational approximation. */
export function normalInvCdf(p: number): number {
  if (p <= 0) return -8
  if (p >= 1) return 8
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
  const pLow = 0.02425
  const pHigh = 1 - pLow
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= pHigh) {
    const q = p - 0.5
    const r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}

/** Inverse LMS transform: the value at a given percentile (Cole 1990). */
export function degerdenPersentil(lms: LMSNokta, persentil: number): number {
  const z = normalInvCdf(persentil / 100)
  if (Math.abs(lms.L) < 1e-6) return lms.M * Math.exp(z * lms.S)
  return lms.M * Math.pow(1 + lms.L * lms.S * z, 1 / lms.L)
}

export interface EgriNoktasi { ay: number; deger: number }
export interface EgriSerisi { persentil: number; noktalar: EgriNoktasi[] }

/** Table-independent percentile curves (0 to ustSinir months). */
export function lmsEgrileri(tablo: LMSNokta[], ustSinir: number, persentiller: number[] = [3, 10, 25, 50, 75, 90, 97], adimAy = 1, altSinir = 0): EgriSerisi[] {
  const noktaSayisi = Math.ceil((ustSinir - altSinir) / adimAy) + 1
  return persentiller.map((p) => ({
    persentil: p,
    noktalar: Array.from({ length: noktaSayisi }, (_, i) => {
      const ay = Math.min(ustSinir, altSinir + i * adimAy)
      const lms = lmsAra(tablo, ay)
      return lms ? { ay, deger: Math.round(degerdenPersentil(lms, p) * 100) / 100 } : null
    }).filter((x): x is EgriNoktasi => x !== null),
  }))
}
