/**
 * ESNEK-MUAYENE-A — form templates (pure): layout fingerprint, matching, template drafting from a marked page.
 *
 * Fingerprint = the printed structure of the de-warped page on a coarse grid (24 x 34 cells, mean darkness of the
 * contrast-normalised page with coloured pen ink removed), z-scored. Two photos of the same printed form correlate
 * strongly even with different handwriting on them; a plain sheet, or another form, does not. Matching also checks the
 * page's aspect ratio.
 */
import type { CizimBolgesi, Gri, Kutu, Maske, Sablon } from './tipler'

export const PARMAK_IZI_SUTUN = 24
export const PARMAK_IZI_SATIR = 34

export function parmakIzi(normal: Gri, renkli?: Maske | null): number[] {
  const W = PARMAK_IZI_SUTUN, H = PARMAK_IZI_SATIR
  const t = new Float64Array(W * H), n = new Float64Array(W * H)
  for (let y = 0; y < normal.h; y++) {
    const cy = Math.min(H - 1, Math.floor((y / normal.h) * H))
    for (let x = 0; x < normal.w; x++) {
      const i = y * normal.w + x
      if (renkli && renkli.d[i]) continue
      const cx = Math.min(W - 1, Math.floor((x / normal.w) * W))
      t[cy * W + cx] += 255 - normal.d[i]
      n[cy * W + cx]++
    }
  }
  const v = Array.from(t, (s, i) => (n[i] ? s / n[i] : 0))
  const ort = v.reduce((a, b) => a + b, 0) / v.length
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - ort) ** 2, 0) / v.length) || 1
  return v.map((x) => Math.round(((x - ort) / sd) * 1000) / 1000)
}

export function korelasyon(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length) return 0
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s / a.length
}

/** Small shifts (±1 cell) tolerate a slightly off crop. */
export function eslesmeSkoru(a: number[], b: number[]): number {
  const W = PARMAK_IZI_SUTUN, H = PARMAK_IZI_SATIR
  if (a.length !== W * H || b.length !== W * H) return 0
  let enIyi = -1
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    let s = 0, n = 0
    for (let y = 0; y < H; y++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue
      for (let x = 0; x < W; x++) { const xx = x + dx; if (xx < 0 || xx >= W) continue; s += a[y * W + x] * b[yy * W + xx]; n++ }
    }
    if (n) enIyi = Math.max(enIyi, s / n)
  }
  return enIyi
}

/** Best formlu template for a page (score 0..1); aspect ratio must be within 12%. */
export function sablonBul(izi: number[], enBoy: number, sablonlar: Sablon[]): { sablon: Sablon | null; skor: number } {
  let enIyi: Sablon | null = null, skor = 0
  for (const s of sablonlar) {
    if (s.tur !== 'formlu' || !s.parmakIzi) continue
    if (Math.abs(s.enBoy - enBoy) / s.enBoy > 0.12) continue
    const k = eslesmeSkoru(izi, s.parmakIzi)
    if (k > skor) { skor = k; enIyi = s }
  }
  return { sablon: enIyi, skor: Math.max(0, skor) }
}

const sinirla = (k: Kutu): Kutu => ({ x0: Math.max(0, Math.min(1, Math.min(k.x0, k.x1))), y0: Math.max(0, Math.min(1, Math.min(k.y0, k.y1))), x1: Math.max(0, Math.min(1, Math.max(k.x0, k.x1))), y1: Math.max(0, Math.min(1, Math.max(k.y0, k.y1))) })

/** Validated template from the user's marks (header band(s), drawing regions). Throws a code string on bad input. */
export function sablonTaslagi(g: {
  id: string; ad: string; tur: 'formlu' | 'serbest'; brans: string | null; enBoy: number
  baslik: Kutu[]; cizim: CizimBolgesi[]; parmakIzi: number[] | null
}): Sablon {
  if (!g.ad.trim()) throw new Error('ad_gerekli')
  if (g.tur === 'formlu' && !g.baslik.length) throw new Error('baslik_gerekli')
  if (g.tur === 'formlu' && (!g.parmakIzi || g.parmakIzi.length !== PARMAK_IZI_SUTUN * PARMAK_IZI_SATIR)) throw new Error('parmak_izi_gerekli')
  const baslik = g.baslik.map(sinirla).filter((k) => k.x1 - k.x0 > 0.02 && k.y1 - k.y0 > 0.01)
  if (g.tur === 'formlu' && !baslik.length) throw new Error('baslik_gerekli')
  const cizim = g.cizim.slice(0, 24).map((c, i) => ({ ...c, id: c.id || `b${i + 1}`, kutu: sinirla(c.kutu) })).filter((c) => c.kutu.x1 - c.kutu.x0 > 0.01 && c.kutu.y1 - c.kutu.y0 > 0.01)
  return { id: g.id, ad: g.ad.trim().slice(0, 80), tur: g.tur, brans: g.brans, enBoy: g.enBoy, baslikBolgeleri: g.tur === 'formlu' ? baslik : [], cizimBolgeleri: cizim, parmakIzi: g.tur === 'formlu' ? g.parmakIzi : null }
}
