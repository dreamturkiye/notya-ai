/**
 * NOTYA-ILAC-03 — ilaç arama: yazım hatasına toleranslı, etken maddeye göre de arar.
 *
 * Two requirements drove this, both from the founder:
 *   1. the doctor cannot always spell the drug — search must survive typos
 *   2. search must work by ETKEN MADDE (active ingredient), not only by brand
 *
 * Turkish makes both harder than they look:
 *   - "İ".toLowerCase() is "i̇" (i + combining dot) in the default locale, so naive lowercasing
 *     breaks every word starting with İ — which in a drug list is a lot of them.
 *   - a doctor typing quickly writes "amoksisilin", "amoxisilin", "amoksislin" or "AMOKSİSİLİN",
 *     and Turkish keyboards produce ı/i and ş/s inconsistently.
 * So everything is folded to a diacritic-free ASCII form before comparison, and matching is
 * ranked rather than boolean.
 *
 * Ranking, best first:
 *   100  exact match on brand or ingredient
 *    90  starts with the query
 *    75  contains the query
 *    60  a word inside the name starts with the query
 *   <60  fuzzy: edit distance within a threshold that scales with query length
 * A single ordering means the doctor sees the most likely drug first rather than an alphabetical
 * accident.
 */

export interface IlacKaydi {
  ad: string
  marka: string
  etkenMadde?: string
  barkod?: string
  kamuNo?: string
  esdegerGrubu?: string
  sgk?: boolean
  form?: string
  doz?: string
  /** NOTYA-ILAC-07: from TİTCK's licensed-products list, joined by barcode (scripts/import-titck-etken.mjs). */
  atc?: string
  /** 'titck' = direct barcode match; 'esdeger' = inherited from an eşdeğer grubu that shares one ATC. */
  etkenKaynak?: 'titck' | 'esdeger'
  /** TİTCK licence suspension code (1 = madde-23, 2 = farmakovijilans, 3 = madde-22). Absent when active. */
  ruhsatAskida?: number
}

export interface AramaSonucu extends IlacKaydi {
  skor: number
  eslesenAlan: 'marka' | 'etken' | 'ad'
}

/** Fold Turkish to a comparable ASCII form. Applied to BOTH sides of every comparison. */
export function normalize(s: string): string {
  return String(s || '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c')
    .replace(/ö/g, 'o').replace(/ü/g, 'u')
    // common misspellings of the same sound: doctors type x for ks, w for v
    .replace(/x/g, 'ks')
    .replace(/w/g, 'v')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Levenshtein with an early exit — we only care whether it is under a small threshold. */
export function editDistance(a: string, b: string, limit = 3): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (cur[j] < best) best = cur[j]
    }
    if (best > limit) return limit + 1 // no cell in this row can lead anywhere useful
    prev = cur
  }
  return prev[b.length]
}

/** Typos allowed, scaled to length: a 4-letter drug tolerating 3 edits would match anything. */
function tolerans(q: string): number {
  if (q.length <= 4) return 1
  if (q.length <= 7) return 2
  return 3
}

function puanla(alan: string, q: string, prefixOnly = false): number {
  const a = normalize(alan)
  if (!a) return 0
  if (a === q) return 100
  if (a.startsWith(q)) return 90
  if (prefixOnly) {
    // Word-prefix still counts: "AUGMENTIN ES" should surface on "es" as well as on "au".
    return a.split(/[\s,()\/-]+/).some((w) => w.startsWith(q)) ? 60 : 0
  }
  if (a.includes(q)) return 75
  if (a.split(/[\s,()\/-]+/).some((w) => w.startsWith(q))) return 60

  // Fuzzy, against the whole field and against each word, so "amoksislin" still finds
  // "AMOKSISILIN 500 MG 16 KAPSUL".
  const lim = tolerans(q)
  let en = lim + 1
  const d = editDistance(a.slice(0, q.length + lim), q, lim)
  if (d < en) en = d
  for (const w of a.split(/[\s,()\/-]+/)) {
    if (!w || Math.abs(w.length - q.length) > lim) continue
    const dw = editDistance(w, q, lim)
    if (dw < en) en = dw
  }
  if (en <= lim) return Math.max(20, 55 - en * 12)
  return 0
}

/**
 * Search brand, ingredient and full product name at once, ranked.
 * `limit` keeps the dropdown short — a doctor scans a handful, not a hundred.
 */
export interface AramaSecenekleri {
  /**
   * NOTYA-ILAC-06: disable fuzzy matching. At one or two characters an edit distance of one
   * matches most of the alphabet, so fuzzy results are noise. Prefix-only is also what a doctor
   * means when they type a single letter.
   */
  prefixOnly?: boolean
}

export function ilacAra(
  kayitlar: IlacKaydi[],
  sorgu: string,
  limit = 8,
  secenekler: AramaSecenekleri = {},
): AramaSonucu[] {
  const q = normalize(sorgu)
  if (q.length < 1) return []

  const out: AramaSonucu[] = []
  for (const k of kayitlar) {
    const sMarka = puanla(k.marka || '', q, secenekler.prefixOnly)
    const sEtken = puanla(k.etkenMadde || '', q, secenekler.prefixOnly)
    const sAd = puanla(k.ad || '', q, secenekler.prefixOnly)
    const skor = Math.max(sMarka, sEtken, sAd)
    if (skor <= 0) continue
    const eslesenAlan: AramaSonucu['eslesenAlan'] =
      skor === sMarka ? 'marka' : skor === sEtken ? 'etken' : 'ad'
    out.push({ ...k, skor, eslesenAlan })
  }

  return out
    .sort((a, b) => b.skor - a.skor || a.ad.length - b.ad.length || a.ad.localeCompare(b.ad, 'tr'))
    .slice(0, limit)
}
