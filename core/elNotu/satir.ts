/**
 * ESNEK-MUAYENE-A — layout: text-line and word segmentation of a handwritten page (pure).
 *
 * Handwriting is rarely in one column or on ruled lines (a right-hand column "sigara: 2 aydır Ø" next to the anamnez,
 * annotations beside drawings), so lines are built from connected ink blobs, not from a full-width projection:
 * blobs are found on a horizontally dilated ink mask, then merged into a line when they overlap vertically and sit close
 * horizontally. Long thin strokes are leader lines / underlines, kept apart (they link an annotation to a drawing region).
 */
import { etiketle, genislet } from './onisleme'
import type { Kutu, Maske } from './tipler'

export type SatirKutusu = { no: number; kutu: Kutu; kelimeler: Kutu[]; murekkep: number }
export type CizgiKutusu = { kutu: Kutu; uclar: [{ x: number; y: number }, { x: number; y: number }] }
export type Yerlesim = { satirlar: SatirKutusu[]; cizgiler: CizgiKutusu[] }

type Blob = { x0: number; y0: number; x1: number; y1: number; n: number; noktalar?: number[] }

const icinde = (x: number, y: number, k: Kutu, w: number, h: number) => x >= k.x0 * w && x <= k.x1 * w && y >= k.y0 * h && y <= k.y1 * h

/**
 * @param m ink mask of the de-warped page
 * @param haric regions to ignore (template header band — already blacked out — and printed drawing regions)
 */
export function yerlesimBul(m: Maske, haric: Kutu[] = [], o: { azamiSatir?: number } = {}): Yerlesim {
  const { w, h } = m
  const temiz: Maske = { w, h, d: new Uint8Array(m.d) }
  if (haric.length) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (temiz.d[y * w + x] && haric.some((k) => icinde(x, y, k, w, h))) temiz.d[y * w + x] = 0
  // drop the outer 1.5% margin (page edge shadows, binder holes, staples)
  const kx = Math.round(w * 0.015), ky = Math.round(h * 0.012)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < kx || x >= w - kx || y < ky || y >= h - ky) temiz.d[y * w + x] = 0

  const rx = Math.max(4, Math.round(w * 0.011)), ry = Math.max(1, Math.round(w * 0.0025))
  const gen = genislet(temiz, rx, ry)
  const { etiket, boyutlar } = etiketle(gen)
  const bloblar: Blob[] = boyutlar.map(() => ({ x0: Infinity, y0: Infinity, x1: -1, y1: -1, n: 0 }))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (!temiz.d[i]) continue
    const b = bloblar[etiket[i] - 1]
    if (!b) continue
    b.n++
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y
  }
  const minMurekkep = Math.max(18, Math.round(w * h * 0.000012))
  const aday = bloblar.map((b, i) => ({ ...b, lbl: i + 1 })).filter((b) => b.n >= minMurekkep && b.x1 >= 0)
  // x-height scale from ordinary blobs (not page-tall shadows, not specks)
  const hs = aday.map((b) => b.y1 - b.y0 + 1).filter((v) => v > 4 && v < h * 0.12).sort((a, b) => a - b)
  const medH = hs.length ? hs[Math.floor(hs.length / 2)] : h * 0.02
  const metin: Blob[] = [], cizgi: Blob[] = []
  for (const b0 of aday) {
    const h0 = b0.y1 - b0.y0 + 1, w0 = b0.x1 - b0.x0 + 1
    // page-tall shadows / folds / the dark strip beyond a page edge: dropped before any splitting
    if (h0 > h * 0.3 || (w0 > w * 0.6 && h0 > h * 0.12)) continue
    const kenarda = b0.x0 <= kx + 2 || b0.x1 >= w - kx - 3 || b0.y0 <= ky + 2 || b0.y1 >= h - ky - 3
    if (kenarda && h0 > medH * 4 && b0.n / (w0 * h0) > 0.25) continue
    for (const b of uzunuBol(b0, b0.lbl, medH, etiket, temiz)) {
      const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
      const yogunluk = b.n / (bw * bh)
      // page-tall or page-wide giants: an edge shadow, a fold, a printed drawing — never text
      if (bh > h * 0.3 || (bw > w * 0.6 && bh > h * 0.12)) continue
      // leader lines / underlines / arrows: much flatter than handwriting, or very sparse and long, or a thin vertical
      if ((bh < medH * 0.55 && bw > medH * 4) || (bw > w * 0.22 && yogunluk < 0.035) || (bh > medH * 5 && bw < medH * 0.6)) { cizgi.push(b); continue }
      metin.push(b)
    }
  }
  metin.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2)
  type Hat = Blob & { parca: Blob[] }
  const hatlar: Hat[] = []
  for (const b of metin) {
    const bh = b.y1 - b.y0 + 1
    let enIyi: Hat | null = null, enIyiSkor = 0
    for (const s of hatlar) {
      const ortusme = Math.min(s.y1, b.y1) - Math.max(s.y0, b.y0)
      const kucuk = Math.min(bh, s.y1 - s.y0 + 1)
      if (ortusme <= 0 || ortusme < kucuk * 0.45) continue
      const bosluk = b.x0 > s.x1 ? b.x0 - s.x1 : s.x0 > b.x1 ? s.x0 - b.x1 : 0
      if (bosluk > Math.max(w * 0.07, medH * 4)) continue
      // a line must not grow much taller than ~2.4 x-heights (two stacked lines would merge)
      const yeniH = Math.max(s.y1, b.y1) - Math.min(s.y0, b.y0)
      if (yeniH > Math.max(medH * 2.6, bh * 1.3, (s.y1 - s.y0) * 1.3)) continue
      const skor = ortusme / kucuk - bosluk / w
      if (skor > enIyiSkor) { enIyiSkor = skor; enIyi = s }
    }
    if (enIyi) {
      enIyi.x0 = Math.min(enIyi.x0, b.x0); enIyi.x1 = Math.max(enIyi.x1, b.x1); enIyi.y0 = Math.min(enIyi.y0, b.y0); enIyi.y1 = Math.max(enIyi.y1, b.y1)
      enIyi.n += b.n; enIyi.parca.push(b)
    } else hatlar.push({ ...b, parca: [b] })
  }
  // tiny isolated marks (a dot, a stray tick) are not lines; a single "Ø" or "N" is kept (clinically meaningful)
  const kalan = hatlar.filter((s) => (s.n >= minMurekkep * 2 || (s.y1 - s.y0) >= medH * 0.8) && !((s.x1 - s.x0) < w * 0.035 && (s.y1 - s.y0) > h * 0.07))
  kalan.sort((a, b) => {
    const ay = (a.y0 + a.y1) / 2, by = (b.y0 + b.y1) / 2
    const ayni = Math.abs(ay - by) < medH * 0.6
    return ayni ? a.x0 - b.x0 : ay - by
  })
  const azami = o.azamiSatir ?? 60
  const satirlar: SatirKutusu[] = kalan.slice(0, azami).map((s, i) => {
    const sh = s.y1 - s.y0 + 1
    const py = Math.round(sh * 0.22), px = Math.round(w * 0.008)
    const kelimeler = kelimeKutulari(s.parca, medH).map((k) => ({ x0: Math.max(0, k.x0 - 2) / w, y0: Math.max(0, s.y0 - py) / h, x1: Math.min(w - 1, k.x1 + 2) / w, y1: Math.min(h - 1, s.y1 + py) / h }))
    return {
      no: i + 1,
      kutu: { x0: Math.max(0, s.x0 - px) / w, y0: Math.max(0, s.y0 - py) / h, x1: Math.min(w - 1, s.x1 + px) / w, y1: Math.min(h - 1, s.y1 + py) / h },
      kelimeler,
      murekkep: s.n,
    }
  })
  const cizgiler: CizgiKutusu[] = cizgi.map((b) => {
    const yatay = b.x1 - b.x0 >= b.y1 - b.y0
    return {
      kutu: { x0: b.x0 / w, y0: b.y0 / h, x1: b.x1 / w, y1: b.y1 / h },
      uclar: yatay
        ? [{ x: b.x0 / w, y: (b.y0 + b.y1) / 2 / h }, { x: b.x1 / w, y: (b.y0 + b.y1) / 2 / h }]
        : [{ x: (b.x0 + b.x1) / 2 / w, y: b.y0 / h }, { x: (b.x0 + b.x1) / 2 / w, y: b.y1 / h }],
    }
  })
  return { satirlar, cizgiler }
}

/**
 * A blob taller than ~1.9 x-heights is usually two lines glued by a descender/ascender. Split it at the emptiest rows of
 * its own ink profile (only pixels of this blob), recursively, into pieces of at least 0.6 x-height.
 */
function uzunuBol(b: Blob, lbl: number, medH: number, etiket: Int32Array, m: Maske): Blob[] {
  const bh = b.y1 - b.y0 + 1, bw = b.x1 - b.x0 + 1
  if (bh < medH * 1.9 || bw < medH * 2.5) return [b]
  const prof = new Float64Array(bh)
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * m.w + x; if (m.d[i] && etiket[i] === lbl) prof[y - b.y0]++ }
  const enCok = Math.max(...prof)
  const alt = Math.round(medH * 0.6), ust = bh - alt
  let enIyi = -1, enAz = Infinity
  for (let r = alt; r < ust; r++) {
    const v = (prof[r - 1] + prof[r] + prof[r + 1]) / 3
    if (v < enAz) { enAz = v; enIyi = r }
  }
  if (enIyi < 0 || enAz > enCok * 0.22) return [b]
  const parca = (y0: number, y1: number): Blob => {
    const p: Blob = { x0: Infinity, y0: Infinity, x1: -1, y1: -1, n: 0 }
    for (let y = y0; y <= y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const i = y * m.w + x
      if (!m.d[i] || etiket[i] !== lbl) continue
      p.n++
      if (x < p.x0) p.x0 = x; if (x > p.x1) p.x1 = x; if (y < p.y0) p.y0 = y; if (y > p.y1) p.y1 = y
    }
    return p
  }
  const ust1 = parca(b.y0, b.y0 + enIyi), alt1 = parca(b.y0 + enIyi + 1, b.y1)
  return [ust1, alt1].filter((p) => p.n > 0).flatMap((p) => uzunuBol(p, lbl, medH, etiket, m))
}

/** Words of one line: blobs (already dilated by ~1 character) merged when the gap is below 0.7 x-height. */
function kelimeKutulari(parca: Blob[], medH: number): Blob[] {
  const p = [...parca].sort((a, b) => a.x0 - b.x0)
  const out: Blob[] = []
  for (const b of p) {
    const son = out[out.length - 1]
    if (son && b.x0 - son.x1 < medH * 0.7) { son.x1 = Math.max(son.x1, b.x1); son.y0 = Math.min(son.y0, b.y0); son.y1 = Math.max(son.y1, b.y1); son.n += b.n }
    else out.push({ ...b })
  }
  return out
}

/** Which template drawing region a line annotates: a leader line touching both wins, else the nearest region within reach. */
export function bolgeyeBagla(satir: Kutu, bolgeler: { id: string; kutu: Kutu; notKutusu?: Kutu }[], cizgiler: CizgiKutusu[], erisim = 0.12): string | null {
  if (!bolgeler.length) return null
  // written in a drawing's note area (under the eardrum, beside the head …): that drawing, before any proximity guess.
  // A leader line from it into another drawing wins (checked first below only for lines outside every note area).
  const orta = { x: (satir.x0 + satir.x1) / 2, y: (satir.y0 + satir.y1) / 2 }
  const notta = bolgeler.filter((r) => r.notKutusu && orta.x >= r.notKutusu.x0 && orta.x <= r.notKutusu.x1 && orta.y >= r.notKutusu.y0 && orta.y <= r.notKutusu.y1)
  const yakin = (p: { x: number; y: number }, k: Kutu, pay: number) => p.x >= k.x0 - pay && p.x <= k.x1 + pay && p.y >= k.y0 - pay && p.y <= k.y1 + pay
  for (const c of cizgiler) {
    for (const [a, b] of [[c.uclar[0], c.uclar[1]], [c.uclar[1], c.uclar[0]]] as const) {
      if (!yakin(a, satir, 0.02)) continue
      const hedef = bolgeler.find((r) => yakin(b, r.kutu, 0.01))
      if (hedef) return hedef.id
    }
  }
  if (notta.length) return notta[0].id
  const mesafe = (a: Kutu, b: Kutu) => {
    const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1)
    return Math.hypot(dx, dy)
  }
  let enIyi: string | null = null, d = Infinity
  for (const r of bolgeler) { const m = mesafe(satir, r.kutu); if (m < d) { d = m; enIyi = r.id } }
  return d <= erisim ? enIyi : null
}

/**
 * Band layout for dense or slanted handwriting (lines touching each other, glued by ascenders and descenders): line
 * centres are the peaks of the smoothed horizontal ink profile, spaced by the page's own line pitch (autocorrelation);
 * a band runs from valley to valley with a small overlap, and is split at wide horizontal gaps (columns, a side note).
 * Each band is read on its own at high resolution; the reader is told to transcribe the band's central line only.
 */
export function seritleriBul(m: Maske, haric: Kutu[] = [], o: { azamiSatir?: number } = {}): Yerlesim {
  const { w, h } = m
  const temiz = new Uint8Array(m.d)
  const kx = Math.round(w * 0.02), ky = Math.round(h * 0.012)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (!temiz[i]) continue
    if (x < kx || x >= w - kx || y < ky || y >= h - ky || (haric.length && haric.some((k) => icinde(x, y, k, w, h)))) temiz[i] = 0
  }
  const prof = new Float64Array(h)
  for (let y = 0; y < h; y++) { let t = 0; for (let x = 0; x < w; x++) t += temiz[y * w + x]; prof[y] = t }
  const pit = satirAraligi(prof, h)
  const sig = Math.max(1.5, pit / 5)
  const p = yumusat(prof, sig)
  const sirali = [...p].sort((a, b) => a - b)
  const tepeEsigi = Math.max(1, sirali[Math.floor(sirali.length * 0.97)] * 0.12)
  const tepeler: number[] = []
  for (let y = 1; y < h - 1; y++) {
    if (p[y] < tepeEsigi || p[y] < p[y - 1] || p[y] < p[y + 1]) continue
    const son = tepeler[tepeler.length - 1]
    if (son !== undefined && y - son < pit * 0.6) { if (p[y] > p[son]) tepeler[tepeler.length - 1] = y; continue }
    tepeler.push(y)
  }
  const satirlar: SatirKutusu[] = []
  for (let i = 0; i < tepeler.length; i++) {
    const c = tepeler[i]
    const ust = i ? vadi(p, tepeler[i - 1], c) : Math.max(0, Math.round(c - pit * 0.6))
    const alt = i < tepeler.length - 1 ? vadi(p, c, tepeler[i + 1]) : Math.min(h - 1, Math.round(c + pit * 0.6))
    const pay = Math.round(pit * 0.18)
    const y0 = Math.max(0, ust - pay), y1 = Math.min(h - 1, alt + pay)
    // column profile of the band's core (valley to valley) → segments split at wide gaps
    const sut = new Uint32Array(w)
    for (let y = ust; y <= alt; y++) for (let x = 0; x < w; x++) sut[x] += temiz[y * w + x]
    const minSut = 1
    const bosluk = Math.max(Math.round(w * 0.1), Math.round(pit * 3.2))
    let bas = -1, sonDolu = -1
    const parcalar: [number, number][] = []
    for (let x = 0; x < w; x++) {
      if (sut[x] >= minSut) { if (bas < 0) bas = x; sonDolu = x }
      else if (bas >= 0 && x - sonDolu > bosluk) { parcalar.push([bas, sonDolu]); bas = -1 }
    }
    if (bas >= 0) parcalar.push([bas, sonDolu])
    for (const [a, b] of parcalar) {
      let mur = 0
      for (let x = a; x <= b; x++) mur += sut[x]
      if (mur < Math.max(25, pit * 2) || b - a < pit * 0.5) continue
      const px = Math.round(w * 0.006)
      // words: gaps of at least 0.8 x pitch/2 in the band's column profile
      const kelimeler: Kutu[] = []
      let kb = -1, ks = -1
      const kg = Math.max(3, Math.round(pit * 0.45))
      for (let x = a; x <= b + 1; x++) {
        const dolu = x <= b && sut[x] >= minSut
        if (dolu) { if (kb < 0) kb = x; ks = x }
        else if (kb >= 0 && (x > b || x - ks > kg)) { kelimeler.push({ x0: Math.max(0, kb - 2) / w, y0: y0 / h, x1: Math.min(w - 1, ks + 2) / w, y1: y1 / h }); kb = -1 }
      }
      satirlar.push({ no: 0, kutu: { x0: Math.max(0, a - px) / w, y0: y0 / h, x1: Math.min(w - 1, b + px) / w, y1: y1 / h }, kelimeler, murekkep: mur })
    }
  }
  satirlar.sort((a, b) => (Math.abs(a.kutu.y0 - b.kutu.y0) < 0.004 ? a.kutu.x0 - b.kutu.x0 : a.kutu.y0 - b.kutu.y0))
  const azami = o.azamiSatir ?? 60
  return { satirlar: satirlar.slice(0, azami).map((s, i) => ({ ...s, no: i + 1 })), cizgiler: [] }
}

function yumusat(p: Float64Array, sig: number): Float64Array {
  const r = Math.ceil(sig * 2.5), k: number[] = []
  let t = 0
  for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sig * sig)); k.push(v); t += v }
  const out = new Float64Array(p.length)
  for (let y = 0; y < p.length; y++) {
    let s = 0
    for (let i = -r; i <= r; i++) { const yy = y + i; if (yy >= 0 && yy < p.length) s += p[yy] * k[i + r] }
    out[y] = s / t
  }
  return out
}

function vadi(p: Float64Array, a: number, b: number): number {
  let enAz = Infinity, y0 = Math.round((a + b) / 2)
  for (let y = a + 1; y < b; y++) if (p[y] < enAz) { enAz = p[y]; y0 = y }
  return y0
}

/** Line pitch (px) from the autocorrelation of the row profile; falls back to 3.5% of the page height. */
export function satirAraligi(prof: Float64Array, h: number): number {
  const n = prof.length
  let ort = 0
  for (const v of prof) ort += v
  ort /= n || 1
  const c = prof.map((v) => v - ort)
  const minL = Math.max(6, Math.round(h * 0.014)), maxL = Math.max(minL + 1, Math.round(h * 0.07))
  const r0 = c.reduce((t, v) => t + v * v, 0) || 1
  const r: number[] = []
  for (let lag = 0; lag <= maxL + 1; lag++) {
    let t = 0
    for (let y = 0; y + lag < n; y++) t += c[y] * c[y + lag]
    r.push(t / r0)
  }
  // the FIRST clear local maximum is the line pitch (later maxima are its multiples)
  for (let lag = minL; lag <= maxL; lag++) if (r[lag] > 0.05 && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) return lag
  let L = Math.round(h * 0.035), enIyi = -Infinity
  for (let lag = minL; lag <= maxL; lag++) if (r[lag] > enIyi) { enIyi = r[lag]; L = lag }
  return L
}

/**
 * The layout the reader uses: connected-blob lines when they explain the page well (sparse notes, columns, side notes);
 * otherwise valley-to-valley bands (dense, slanted, touching lines). "Well" = at most two lines (and ≤ 8%) are taller than
 * 2.6 x the median line height and none exceeds 10% of the page — a taller box means lines were glued together.
 */
export function satirlariCikar(m: Maske, haric: Kutu[] = []): Yerlesim & { yontem: 'blob' | 'serit' } {
  const blob = yerlesimBul(m, haric, { azamiSatir: 80 })
  const yuk = blob.satirlar.map((s) => s.kutu.y1 - s.kutu.y0).sort((a, b) => a - b)
  const med = yuk.length ? yuk[Math.floor(yuk.length / 2)] : 0
  const uzun = yuk.filter((v) => v > med * 2.6).length
  if (yuk.length >= 3 && uzun <= 2 && uzun <= yuk.length * 0.08 && (yuk[yuk.length - 1] ?? 0) <= 0.1) return { ...blob, yontem: 'blob' }
  const serit = seritleriBul(m, haric, { azamiSatir: 80 })
  return { satirlar: serit.satirlar, cizgiler: blob.cizgiler, yontem: 'serit' }
}
