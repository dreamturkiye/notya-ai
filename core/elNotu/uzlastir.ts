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

/** One word after N independent page reads (reader v2). */
export type OyluKelime = {
  metin: string
  /** 0..1, combined from the agreeing reads, scaled by the share of reads that agree */
  guven: number
  /** reads that agree on `metin` (exact or near-identical for plain words) */
  oy: number
  /** reads that agree on `metin` EXACTLY (after folding) — protected words need tamOy === okuma */
  tamOy: number
  /** reads taken of the page (a read that missed the line counts as a disagreeing read) */
  okuma: number
  adaylar: string[]
  /** lowest confidence among the agreeing reads */
  enDusuk: number
  /** reads that wrote ANY word at this position (1 = a word only one read saw) */
  kapsam: number
}

/** Sum of matched-word similarity of two word lists (used to pick the medoid read). */
function hizaSkoru(a: HamKelime[], b: HamKelime[]): number {
  return hizala(a, b).reduce((t, { a: x, b: y }) => t + (x && y ? benzerlik(x.m, y.m) : 0), 0)
}

/**
 * Consensus of N independent reads of the same line. Pivot = the read most similar to the others (medoid); every other read
 * is aligned to it word by word (hizala). Each slot takes the reading most reads give (ties → higher summed confidence).
 * Words the pivot lacks: inserted when another read has them with g ≥ 0.5 or two reads share them — never silently lost,
 * but a word only one read saw stays a minority reading (oy = 1). `toplamOkuma` = reads taken of the page.
 */
export function cokluUzlastir(okumalar: (HamKelime[] | null)[], toplamOkuma = okumalar.length): OyluKelime[] {
  const dolu = okumalar.filter((o): o is HamKelime[] => !!o && o.length > 0)
  if (!dolu.length) return []
  let pivot = 0, enIyi = -1
  dolu.forEach((o, i) => {
    const s = dolu.reduce((t, p, j) => (j === i ? t : t + hizaSkoru(o, p)), 0) + o.length * 1e-3
    if (s > enIyi) { enIyi = s; pivot = i }
  })
  const P = dolu[pivot]
  const yuvalar: HamKelime[][] = P.map((k) => [k])
  // gap words of other reads, keyed by the pivot index they follow (-1 = before the first word)
  const araliklar = new Map<number, HamKelime[][]>()
  dolu.forEach((o, j) => {
    if (j === pivot) return
    let son = -1
    const bekleyen: HamKelime[] = []
    const bosalt = () => { if (bekleyen.length) { const l = araliklar.get(son) || []; l.push([...bekleyen]); araliklar.set(son, l); bekleyen.length = 0 } }
    let pi = 0
    for (const { a: x, b: y } of hizala(P, o)) {
      if (x) { const idx = P.indexOf(x, pi); pi = idx + 1; bosalt(); son = idx; if (y) yuvalar[idx].push(y) } else if (y) bekleyen.push(y)
    }
    bosalt()
  })
  const karar = (grup: HamKelime[]): OyluKelime => {
    const kumeler = new Map<string, HamKelime[]>()
    for (const k of grup) { const a = kelimeAnahtari(k.m); kumeler.set(a, [...(kumeler.get(a) || []), k]) }
    let sec: HamKelime[] = []
    for (const k of kumeler.values()) {
      const skor = k.length * 10 + k.reduce((t, x) => t + clamp(x.g), 0)
      const enIyiSkor = sec.length * 10 + sec.reduce((t, x) => t + clamp(x.g), 0)
      if (skor > enIyiSkor) sec = k
    }
    const ust = sec.reduce((m, x) => (clamp(x.g) > clamp(m.g) ? x : m), sec[0])
    const yakinlar = grup.filter((k) => !sec.includes(k) && yakinMi(k.m, ust.m))
    const uyan = [...sec, ...yakinlar]
    const birlesik = Math.min(0.99, 1 - uyan.reduce((t, x) => t * (1 - clamp(x.g)), 1))
    const adaylar = [...new Set([ust.m, ...grup.map((k) => k.m), ...grup.flatMap((k) => k.alt || [])].filter(Boolean))].slice(0, 5)
    return { metin: ust.m, guven: birlesik * (uyan.length / Math.max(1, toplamOkuma)), oy: uyan.length, tamOy: sec.length, okuma: toplamOkuma, adaylar, enDusuk: Math.min(...uyan.map((x) => clamp(x.g))), kapsam: grup.length }
  }
  const ekle = (sonra: number): OyluKelime[] => {
    const l = araliklar.get(sonra)
    if (!l) return []
    // align the gap runs of the other reads to each other: the longest run is the frame
    const cerceve = l.reduce((m, x) => (x.length > m.length ? x : m), l[0])
    const gruplar: HamKelime[][] = cerceve.map((k) => [k])
    for (const run of l) if (run !== cerceve) for (const { a: x, b: y } of hizala(cerceve, run)) if (x && y) gruplar[cerceve.indexOf(x)].push(y)
    return gruplar.filter((g) => g.length >= 2 || clamp(g[0].g) >= 0.5).map(karar)
  }
  const out: OyluKelime[] = [...ekle(-1)]
  yuvalar.forEach((g, i) => { out.push(karar(g)); out.push(...ekle(i)) })
  return out
}

/** Similarity of two transcribed lines (fuzzy word overlap, Dice) — used to align the lines of independent page reads. */
export function satirBenzerligi(a: string[], b: string[]): number {
  const x = a.map(kelimeAnahtari).filter(Boolean), y = b.map(kelimeAnahtari).filter(Boolean)
  if (!x.length || !y.length) return 0
  const kullanildi = new Set<number>()
  let eslesme = 0
  for (const w of x) {
    let en = -1, enS = 0
    y.forEach((z, j) => { if (kullanildi.has(j)) return; const s = w === z ? 1 : benzerlik(w, z); if (s > enS) { enS = s; en = j } })
    if (en >= 0 && enS >= 0.7) { kullanildi.add(en); eslesme += enS }
  }
  return (2 * eslesme) / (x.length + y.length)
}
