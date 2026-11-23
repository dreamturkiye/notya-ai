/**
 * ESNEK-MUAYENE-A — personal handwriting memory (pure).
 *
 * Every confirmed word/line crop of a doctor is stored (masked crop in the vault + a small shape descriptor). When a new page
 * is read, the doctor's own crops most similar to the page's words are retrieved and passed to the reader as in-context
 * examples ("this doctor writes 'tükürük' like this"), so accuracy improves with each confirmation. Candidates are then
 * re-ranked with the doctor's own vocabulary (words of his past approved notes) — never with another doctor's.
 *
 * Descriptor: the word's ink bounding box, resized to 10 x 32 cells of mean ink darkness (blurred, L2-normalised) + its
 * aspect ratio. Cheap enough for the device (computed in the browser) and stable across pens and lighting.
 */
import type { Gri, HafizaOrnegi, Kutu } from './tipler'
import { benzerlik, kelimeAnahtari } from './uzlastir'

export const TANIM_SATIR = 10
export const TANIM_SUTUN = 32

/** Descriptor of one word box on a contrast-normalised (and masked) page. Null when the box holds almost no ink. */
export function tanimlayici(n: Gri, kutu: Kutu): { v: number[]; enBoy: number } | null {
  let x0 = Math.max(0, Math.floor(kutu.x0 * n.w)), x1 = Math.min(n.w - 1, Math.ceil(kutu.x1 * n.w))
  let y0 = Math.max(0, Math.floor(kutu.y0 * n.h)), y1 = Math.min(n.h - 1, Math.ceil(kutu.y1 * n.h))
  if (x1 - x0 < 3 || y1 - y0 < 3) return null
  // tighten to the ink
  let tx0 = x1, tx1 = x0, ty0 = y1, ty1 = y0, ink = 0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (n.d[y * n.w + x] < 170) { ink++; if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; if (y < ty0) ty0 = y; if (y > ty1) ty1 = y }
  if (ink < 12 || tx1 <= tx0 || ty1 <= ty0) return null
  x0 = tx0; x1 = tx1; y0 = ty0; y1 = ty1
  const v = new Array(TANIM_SATIR * TANIM_SUTUN).fill(0)
  const sayi = new Array(TANIM_SATIR * TANIM_SUTUN).fill(0)
  for (let y = y0; y <= y1; y++) {
    const cy = Math.min(TANIM_SATIR - 1, Math.floor(((y - y0) / (y1 - y0 + 1)) * TANIM_SATIR))
    for (let x = x0; x <= x1; x++) {
      const cx = Math.min(TANIM_SUTUN - 1, Math.floor(((x - x0) / (x1 - x0 + 1)) * TANIM_SUTUN))
      v[cy * TANIM_SUTUN + cx] += 255 - n.d[y * n.w + x]
      sayi[cy * TANIM_SUTUN + cx]++
    }
  }
  for (let i = 0; i < v.length; i++) v[i] = sayi[i] ? v[i] / sayi[i] : 0
  // 3x3 blur on the grid (shift tolerance)
  const b = v.map((_, i) => {
    const r = Math.floor(i / TANIM_SUTUN), c = i % TANIM_SUTUN
    let t = 0, k = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < TANIM_SATIR && cc >= 0 && cc < TANIM_SUTUN) { t += v[rr * TANIM_SUTUN + cc] * (dr || dc ? 0.5 : 1); k += dr || dc ? 0.5 : 1 } }
    return t / k
  })
  const ort = b.reduce((a, x) => a + x, 0) / b.length
  const c = b.map((x) => x - ort)
  const norm = Math.sqrt(c.reduce((a, x) => a + x * x, 0)) || 1
  return { v: c.map((x) => Math.round((x / norm) * 10000) / 10000), enBoy: Math.round(((x1 - x0 + 1) / (y1 - y0 + 1)) * 1000) / 1000 }
}

export function kosinus(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length) return 0
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/** Shape similarity: cosine of the descriptors, penalised when the aspect ratios differ a lot (a word vs a letter). */
export function sekilBenzerligi(a: { v: number[]; enBoy: number }, b: { tanimlayici: number[]; enBoy: number }): number {
  const oran = Math.min(a.enBoy, b.enBoy) / Math.max(a.enBoy, b.enBoy, 1e-6)
  return kosinus(a.v, b.tanimlayici) * (0.6 + 0.4 * oran)
}

/** The k most similar memory examples to any of the page's word descriptors (deduplicated by text, best first). */
export function benzerOrnekler(sorgular: { v: number[]; enBoy: number }[], hafiza: HafizaOrnegi[], k = 12, esik = 0.55): (HafizaOrnegi & { benzerlik: number })[] {
  const enIyi = new Map<string, HafizaOrnegi & { benzerlik: number }>()
  for (const ornek of hafiza) {
    let skor = -1
    for (const q of sorgular) { const s = sekilBenzerligi(q, ornek); if (s > skor) skor = s }
    if (skor < esik) continue
    const anah = kelimeAnahtari(ornek.metin)
    const onceki = enIyi.get(anah)
    if (!onceki || onceki.benzerlik < skor) enIyi.set(anah, { ...ornek, benzerlik: skor })
  }
  return [...enIyi.values()].sort((a, b) => b.benzerlik - a.benzerlik).slice(0, k)
}

/** Word frequencies of the doctor's own approved notes (folded keys). */
export function kelimeDagarcigi(metinler: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of metinler) for (const w of t.split(/[^\p{L}\p{N}]+/u)) { const k = kelimeAnahtari(w); if (k.length >= 2) m.set(k, (m.get(k) || 0) + 1) }
  return m
}

export type SiralamaGirdisi = {
  metin: string
  guven: number
  adaylar: string[]
  /** Descriptor of this word's crop (when available) to look it up in the memory. */
  tanim?: { v: number[]; enBoy: number } | null
}

/**
 * Re-rank a word's candidates with the doctor's own vocabulary and memory. A memory crop that is almost the same shape
 * (≥ 0.9) with a confirmed text is strong evidence for that text; vocabulary frequency is a mild prior. The model's top
 * reading changes only when the evidence is clearly better; the returned confidence never exceeds the model's own unless
 * the memory match is near-identical.
 */
export function yenidenSirala(g: SiralamaGirdisi, dagarcik: Map<string, number>, hafiza: HafizaOrnegi[]): { metin: string; guven: number; adaylar: string[]; hafizadan: boolean } {
  const adaylar = [...new Set([g.metin, ...g.adaylar].filter(Boolean))]
  if (!adaylar.length) return { metin: g.metin, guven: g.guven, adaylar: [], hafizadan: false }
  let hafizaMetni: string | null = null, hafizaSkoru = 0
  if (g.tanim) for (const o of hafiza) {
    const s = sekilBenzerligi(g.tanim, o)
    if (s > hafizaSkoru) { hafizaSkoru = s; hafizaMetni = o.metin }
  }
  const skorlar = adaylar.map((a, i) => {
    let s = i === 0 ? g.guven : g.guven * 0.7
    const f = dagarcik.get(kelimeAnahtari(a)) || 0
    s += Math.min(0.15, Math.log1p(f) * 0.04)
    if (hafizaMetni && hafizaSkoru >= 0.9 && benzerlik(a, hafizaMetni) >= 0.8) s += 0.3
    return s
  })
  // a near-identical memory crop whose text is not among the candidates becomes a candidate itself
  if (hafizaMetni && hafizaSkoru >= 0.93 && !adaylar.some((a) => benzerlik(a, hafizaMetni!) >= 0.8)) {
    adaylar.push(hafizaMetni); skorlar.push(g.guven * 0.7 + 0.3)
  }
  let en = 0
  for (let i = 1; i < skorlar.length; i++) if (skorlar[i] > skorlar[en] + 0.05) en = i
  const hafizadan = Boolean(hafizaMetni && hafizaSkoru >= 0.9 && benzerlik(adaylar[en], hafizaMetni) >= 0.8)
  const guven = en === 0 ? Math.min(0.99, hafizadan && hafizaSkoru >= 0.95 ? Math.max(g.guven, 0.9) : g.guven) : Math.min(g.guven, 0.75)
  const sirali = [adaylar[en], ...adaylar.filter((_, i) => i !== en)]
  return { metin: adaylar[en], guven, adaylar: sirali.slice(0, 5), hafizadan }
}
