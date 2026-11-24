/**
 * ESNEK-MUAYENE-A — self-consistency (pure): two independent reads of the same line (different crops / resolutions /
 * preprocessing, separate model calls) are aligned word by word. Agreement raises confidence; disagreement is never
 * resolved by picking one — the word goes to Doğrula with both readings as candidates.
 */
import type { HamKelime, HamSatir } from './tipler'

export const kelimeAnahtari = (s: string) => s.normalize('NFC').toLocaleLowerCase('tr').replace(/[.,;:!?"'`´]/g, '').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC').trim()

export function benzerlik(a: string, b: string): number {
  const x = kelimeAnahtari(a), y = kelimeAnahtari(b)
  if (x === y) return 1
  if (!x || !y) return 0
  const m = x.length, n = y.length
  const d = new Array(n + 1).fill(0).map((_, j) => j)
  for (let i = 1; i <= m; i++) {
    let onceki = d[0]; d[0] = i
    for (let j = 1; j <= n; j++) {
      const t = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, onceki + (x[i - 1] === y[j - 1] ? 0 : 1))
      onceki = t
    }
  }
  return 1 - d[n] / Math.max(m, n)
}

export type HizaliKelime = { a: HamKelime | null; b: HamKelime | null }

/** Needleman–Wunsch alignment on words (match score = similarity, gap = -0.4). */
export function hizala(a: HamKelime[], b: HamKelime[]): HizaliKelime[] {
  const m = a.length, n = b.length, GAP = -0.4
  const S: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0)))
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const s = benzerlik(a[i - 1].m, b[j - 1].m)
    S[i][j] = Math.max(S[i - 1][j - 1] + (s >= 0.5 ? s : s - 0.6), S[i - 1][j] + GAP, S[i][j - 1] + GAP)
  }
  const out: HizaliKelime[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const s = benzerlik(a[i - 1].m, b[j - 1].m)
      if (Math.abs(S[i][j] - (S[i - 1][j - 1] + (s >= 0.5 ? s : s - 0.6))) < 1e-9) { out.push({ a: a[i - 1], b: b[j - 1] }); i--; j--; continue }
    }
    if (i > 0 && Math.abs(S[i][j] - (S[i - 1][j] + GAP)) < 1e-9) { out.push({ a: a[i - 1], b: null }); i--; continue }
    out.push({ a: null, b: b[j - 1] }); j--
  }
  return out.reverse()
}

export type UzlasikKelime = { metin: string; guven: number; uyum: boolean; adaylar: string[]; /** agreement was near-identical, not exact (plain words only) */ yakin?: boolean }

/** Two readings of a plain word that differ by at most a letter or two count as agreement (never numbers / short words). */
export const YAKIN_ESIK = 0.8
export function yakinMi(a: string, b: string): boolean {
  const x = kelimeAnahtari(a), y = kelimeAnahtari(b)
  if (x.length < 5 || y.length < 5 || /\d/.test(x + y) || /[?]/.test(a + b)) return false
  return benzerlik(x, y) >= YAKIN_ESIK
}

/**
 * Merge two reads of one line. Agree (same word after folding) → that word, confidence = 1 - (1-gA)(1-gB) capped at 0.99.
 * Disagree → the higher-confidence reading is shown as the provisional text but `uyum` is false and both readings are
 * candidates (Doğrula decides). A word only one read saw → kept with half its confidence (never silently dropped).
 */
export function uzlastir(a: HamSatir | null, b: HamSatir | null): UzlasikKelime[] {
  const ka = a?.kelimeler || [], kb = b?.kelimeler || []
  if (!kb.length) return ka.map((k) => ({ metin: k.m, guven: k.g * 0.5, uyum: false, adaylar: [k.m, ...(k.alt || [])].slice(0, 4) }))
  if (!ka.length) return kb.map((k) => ({ metin: k.m, guven: k.g * 0.5, uyum: false, adaylar: [k.m, ...(k.alt || [])].slice(0, 4) }))
  return hizala(ka, kb).map(({ a: x, b: y }) => {
    if (x && y) {
      const ayni = kelimeAnahtari(x.m) === kelimeAnahtari(y.m)
      const adaylar = [...new Set([x.m, y.m, ...(x.alt || []), ...(y.alt || [])].filter(Boolean))].slice(0, 5)
      if (ayni) return { metin: x.g >= y.g ? x.m : y.m, guven: Math.min(0.99, 1 - (1 - clamp(x.g)) * (1 - clamp(y.g))), uyum: true, adaylar }
      // near-identical (one letter apart in a long plain word): agreement with a lower confidence; the reader still
      // demands an exact agreement for protected words (side, negation, number, dose, drug, allergy)
      if (yakinMi(x.m, y.m)) return { metin: x.g >= y.g ? x.m : y.m, guven: Math.min(0.95, 1 - (1 - clamp(x.g)) * (1 - clamp(y.g))) * 0.92, uyum: true, yakin: true, adaylar }
      const ust = x.g >= y.g ? x : y
      return { metin: ust.m, guven: Math.min(clamp(x.g), clamp(y.g)) * 0.6, uyum: false, adaylar }
    }
    const k = (x || y)!
    return { metin: k.m, guven: clamp(k.g) * 0.5, uyum: false, adaylar: [k.m, ...(k.alt || [])].slice(0, 4) }
  })
}

const clamp = (g: number) => (Number.isFinite(g) ? Math.max(0, Math.min(1, g)) : 0)
