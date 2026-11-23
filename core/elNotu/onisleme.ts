/**
 * ESNEK-MUAYENE-A — on-device page preprocessing (pure raster maths; runs in the browser and in the evaluation harness).
 *
 *  - page detection: the sheet is the largest bright region; its four corners are the hull extremes (x+y, x-y);
 *  - perspective correction: homography from the four corners to an upright page of the template's aspect ratio;
 *  - deskew: projection-profile search (±6°) on the ink mask;
 *  - contrast: background (paper + shadows) estimated with a coarse max filter and divided out, then stretched;
 *  - quality: blur (Laplacian variance), glare (saturated blobs), darkness, resolution — "tekrar çekin" before anything leaves.
 *
 * Nothing here knows a country, a language or a model. No allocation-heavy libraries: typed arrays only.
 */
import type { Dortgen, Gri, KaliteKarari, KaliteNedeni, Maske, Nokta, Rgba } from './tipler'

export function griyeCevir(r: Rgba): Gri {
  const d = new Uint8ClampedArray(r.w * r.h)
  for (let i = 0, j = 0; i < d.length; i++, j += 4) d[i] = (r.d[j] * 77 + r.d[j + 1] * 150 + r.d[j + 2] * 29) >> 8
  return { w: r.w, h: r.h, d }
}

/** Area-average downscale (or nearest upscale) to fit `maxKenar`. */
export function olcekle(g: Gri, maxKenar: number): Gri {
  const o = Math.min(1, maxKenar / Math.max(g.w, g.h))
  if (o === 1) return g
  const w = Math.max(1, Math.round(g.w * o)), h = Math.max(1, Math.round(g.h * o))
  const d = new Uint8ClampedArray(w * h)
  const sx = g.w / w, sy = g.h / h
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy))
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx))
      let t = 0, n = 0
      for (let yy = y0; yy < y1 && yy < g.h; yy++) for (let xx = x0; xx < x1 && xx < g.w; xx++) { t += g.d[yy * g.w + xx]; n++ }
      d[y * w + x] = n ? t / n : 0
    }
  }
  return { w, h, d }
}

/** Area-average RGBA downscale to fit `maxKenar`. */
export function rgbaKucult(r: Rgba, maxKenar: number): Rgba {
  const o = Math.min(1, maxKenar / Math.max(r.w, r.h))
  if (o === 1) return r
  const w = Math.max(1, Math.round(r.w * o)), h = Math.max(1, Math.round(r.h * o))
  const d = new Uint8ClampedArray(w * h * 4)
  const sx = r.w / w, sy = r.h / h
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy))
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx))
      let a = 0, b = 0, c = 0, n = 0
      for (let yy = y0; yy < y1 && yy < r.h; yy++) for (let xx = x0; xx < x1 && xx < r.w; xx++) { const i = (yy * r.w + xx) * 4; a += r.d[i]; b += r.d[i + 1]; c += r.d[i + 2]; n++ }
      const o2 = (y * w + x) * 4
      d[o2] = a / n; d[o2 + 1] = b / n; d[o2 + 2] = c / n; d[o2 + 3] = 255
    }
  }
  return { w, h, d }
}

export function otsu(g: Gri): number {
  const hist = new Float64Array(256)
  for (let i = 0; i < g.d.length; i++) hist[g.d[i]]++
  const n = g.d.length
  let toplam = 0
  for (let i = 0; i < 256; i++) toplam += i * hist[i]
  let sB = 0, wB = 0, enIyi = 0, esik = 128
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue
    const wF = n - wB; if (!wF) break
    sB += t * hist[t]
    const mB = sB / wB, mF = (toplam - sB) / wF
    const ara = wB * wF * (mB - mF) * (mB - mF)
    if (ara > enIyi) { enIyi = ara; esik = t }
  }
  return esik
}

/** Laplacian variance on a ≤512 px copy: low = blurred. */
export function bulaniklikOlc(g: Gri): number {
  const k = olcekle(g, 512)
  let s = 0, s2 = 0, n = 0
  for (let y = 1; y < k.h - 1; y++) for (let x = 1; x < k.w - 1; x++) {
    const i = y * k.w + x
    const l = -4 * k.d[i] + k.d[i - 1] + k.d[i + 1] + k.d[i - k.w] + k.d[i + k.w]
    s += l; s2 += l * l; n++
  }
  if (!n) return 0
  const m = s / n
  return s2 / n - m * m
}

/** Fraction of the page covered by saturated (blown-out) blobs ≥ 0.3% of the image each. */
export function parlamaOlc(g: Gri): number {
  const k = olcekle(g, 400)
  // a scanned / rendered page is uniformly white: "saturated" is the paper itself, not glare
  const sirali = Uint8ClampedArray.from(k.d).sort()
  if (sirali[Math.floor(sirali.length / 2)] >= 240) return 0
  const m: Maske = { w: k.w, h: k.h, d: new Uint8Array(k.w * k.h) }
  for (let i = 0; i < k.d.length; i++) m.d[i] = k.d[i] >= 250 ? 1 : 0
  const { boyutlar } = etiketle(m)
  const esik = 0.003 * k.w * k.h
  let t = 0
  for (const b of boyutlar) if (b >= esik) t += b
  return t / (k.w * k.h)
}

export function ortalama(g: Gri): number {
  let t = 0
  for (let i = 0; i < g.d.length; i++) t += g.d[i]
  return g.d.length ? t / g.d.length : 0
}

/** 4-connected component labelling. Returns labels (0 = background) and the pixel count per label (index = label-1). */
export function etiketle(m: Maske): { etiket: Int32Array; boyutlar: number[] } {
  const { w, h } = m
  const etiket = new Int32Array(w * h)
  const boyutlar: number[] = []
  const yigin = new Int32Array(w * h)
  let sonraki = 0
  for (let i = 0; i < w * h; i++) {
    if (!m.d[i] || etiket[i]) continue
    sonraki++
    let ust = 0, boyut = 0
    yigin[ust++] = i; etiket[i] = sonraki
    while (ust) {
      const p = yigin[--ust]; boyut++
      const x = p % w, y = (p - x) / w
      if (x > 0 && m.d[p - 1] && !etiket[p - 1]) { etiket[p - 1] = sonraki; yigin[ust++] = p - 1 }
      if (x < w - 1 && m.d[p + 1] && !etiket[p + 1]) { etiket[p + 1] = sonraki; yigin[ust++] = p + 1 }
      if (y > 0 && m.d[p - w] && !etiket[p - w]) { etiket[p - w] = sonraki; yigin[ust++] = p - w }
      if (y < h - 1 && m.d[p + w] && !etiket[p + w]) { etiket[p + w] = sonraki; yigin[ust++] = p + w }
    }
    boyutlar.push(boyut)
  }
  return { etiket, boyutlar }
}

export function dortgenAlani(q: Dortgen): number {
  let a = 0
  for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; a += p.x * r.y - r.x * p.y }
  return Math.abs(a) / 2
}

export type SayfaBulma = { koseler: Dortgen; oran: number; kenarBulundu: boolean }

type Dogru = { a: number; b: number; dikey: boolean } // dikey: x = a*y + b ; yatay: y = a*x + b

/** Least squares with two rounds of outlier rejection (residual > 2.5 x median). */
function dogruUydur(pts: Nokta[], dikey: boolean): Dogru | null {
  let p = pts
  for (let tur = 0; tur < 3; tur++) {
    if (p.length < 6) return null
    let su = 0, sv = 0, suu = 0, suv = 0
    for (const q of p) { const u = dikey ? q.y : q.x, v = dikey ? q.x : q.y; su += u; sv += v; suu += u * u; suv += u * v }
    const n = p.length, den = n * suu - su * su
    const a = Math.abs(den) < 1e-9 ? 0 : (n * suv - su * sv) / den
    const b = (sv - a * su) / n
    if (tur === 2) return { a, b, dikey }
    const art = p.map((q) => Math.abs((dikey ? q.x : q.y) - (a * (dikey ? q.y : q.x) + b)))
    const med = [...art].sort((x, y) => x - y)[Math.floor(art.length / 2)]
    const esik = Math.max(1.5, med * 2.5)
    p = p.filter((_, i) => art[i] <= esik)
  }
  return null
}

function kesisim(d1: Dogru, d2: Dogru): Nokta {
  // d1 dikey (x = a1 y + b1), d2 yatay (y = a2 x + b2)
  const v = d1.dikey ? d1 : d2, h = d1.dikey ? d2 : d1
  const y = (h.a * v.b + h.b) / (1 - h.a * v.a || 1e-9)
  return { x: v.a * y + v.b, y }
}

/**
 * The sheet = the largest bright connected region (paper is the brightest large object in a document photo). Each of its
 * four edges is a robust line fit through the region's boundary points; an edge that runs along the image border (the
 * sheet is cut by the frame) becomes that border. Corners = intersections of adjacent edges. When the sheet fills the
 * frame on all sides the image corners are used and `kenarBulundu` is false.
 */
export function sayfaBul(foto: Rgba): SayfaBulma {
  const k = rgbaKucult(foto, 420)
  const olc = foto.w / k.w
  const g = { w: foto.w, h: foto.h }
  const tum: Dortgen = [{ x: 0, y: 0 }, { x: g.w - 1, y: 0 }, { x: g.w - 1, y: g.h - 1 }, { x: 0, y: g.h - 1 }]
  // Paper = neutral (low chroma) and brighter than the background. Lighting falls off across a hand-held photo, so the
  // threshold is the lower of two Otsu levels (shadowed paper stays paper); chroma keeps a light wooden desk out.
  const gk = griyeCevir(k)
  const t1 = otsu(gk)
  const alti = gk.d.filter((v) => v < t1)
  const t0 = alti.length > 50 ? otsu({ w: alti.length, h: 1, d: alti }) : t1
  const t = Math.max(70, Math.min(t1, t0 + 10))
  const m: Maske = { w: k.w, h: k.h, d: new Uint8Array(k.w * k.h) }
  for (let i = 0, j = 0; i < gk.d.length; i++, j += 4) {
    const kroma = Math.max(k.d[j], k.d[j + 1], k.d[j + 2]) - Math.min(k.d[j], k.d[j + 1], k.d[j + 2])
    m.d[i] = gk.d[i] > t && kroma < 48 ? 1 : 0
  }
  const kapali = kapat(m, 3)
  const { etiket, boyutlar } = etiketle(kapali)
  if (!boyutlar.length) return { koseler: tum, oran: 1, kenarBulundu: false }
  let enIyi = 0
  for (let i = 1; i < boyutlar.length; i++) if (boyutlar[i] > boyutlar[enIyi]) enIyi = i
  const lbl = enIyi + 1
  const oran = boyutlar[enIyi] / (k.w * k.h)
  if (oran < 0.2) return { koseler: tum, oran, kenarBulundu: false }
  const sol: Nokta[] = [], sag: Nokta[] = [], ust: Nokta[] = [], alt: Nokta[] = []
  let solSinir = 0, sagSinir = 0, ustSinir = 0, altSinir = 0, satir = 0, sutun = 0
  for (let y = 0; y < k.h; y++) {
    let a = -1, b = -1
    for (let x = 0; x < k.w; x++) if (etiket[y * k.w + x] === lbl) { if (a < 0) a = x; b = x }
    if (a < 0) continue
    satir++
    if (a <= 1) solSinir++; else sol.push({ x: a, y })
    if (b >= k.w - 2) sagSinir++; else sag.push({ x: b, y })
  }
  for (let x = 0; x < k.w; x++) {
    let a = -1, b = -1
    for (let y = 0; y < k.h; y++) if (etiket[y * k.w + x] === lbl) { if (a < 0) a = y; b = y }
    if (a < 0) continue
    sutun++
    if (a <= 1) ustSinir++; else ust.push({ x, y: a })
    if (b >= k.h - 2) altSinir++; else alt.push({ x, y: b })
  }
  const kenar = (pts: Nokta[], sinirSay: number, toplam: number, dikey: boolean, sinirDogru: Dogru): { d: Dogru; gercek: boolean } => {
    if (sinirSay > toplam * 0.6 || pts.length < toplam * 0.25) return { d: sinirDogru, gercek: false }
    const d = dogruUydur(pts, dikey)
    return d ? { d, gercek: true } : { d: sinirDogru, gercek: false }
  }
  const L = kenar(sol, solSinir, satir, true, { a: 0, b: 0, dikey: true })
  const R = kenar(sag, sagSinir, satir, true, { a: 0, b: k.w - 1, dikey: true })
  const T = kenar(ust, ustSinir, sutun, false, { a: 0, b: 0, dikey: false })
  const B = kenar(alt, altSinir, sutun, false, { a: 0, b: k.h - 1, dikey: false })
  if (!L.gercek && !R.gercek && !T.gercek && !B.gercek) return { koseler: tum, oran, kenarBulundu: false }
  const sinirla = (p: Nokta): Nokta => ({ x: Math.min(g.w - 1, Math.max(0, p.x * olc)), y: Math.min(g.h - 1, Math.max(0, p.y * olc)) })
  const koseler: Dortgen = [kesisim(L.d, T.d), kesisim(R.d, T.d), kesisim(R.d, B.d), kesisim(L.d, B.d)].map(sinirla) as Dortgen
  if (dortgenAlani(koseler) < 0.2 * g.w * g.h) return { koseler: tum, oran, kenarBulundu: false }
  return { koseler, oran, kenarBulundu: true }
}

/** Morphological closing with a square of radius r (dilate then erode) on a binary mask. */
export function kapat(m: Maske, r: number): Maske { return asindir(genislet(m, r, r), r, r) }

/** Separable dilation with a (2rx+1)x(2ry+1) box. */
export function genislet(m: Maske, rx: number, ry: number): Maske {
  const { w, h } = m
  const a = new Uint8Array(w * h), b = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    let say = 0
    const satir = y * w
    for (let x = 0; x < Math.min(rx, w); x++) say += m.d[satir + x]
    for (let x = 0; x < w; x++) {
      const gir = x + rx; if (gir < w) say += m.d[satir + gir]
      const cik = x - rx - 1; if (cik >= 0) say -= m.d[satir + cik]
      a[satir + x] = say > 0 ? 1 : 0
    }
  }
  for (let x = 0; x < w; x++) {
    let say = 0
    for (let y = 0; y < Math.min(ry, h); y++) say += a[y * w + x]
    for (let y = 0; y < h; y++) {
      const gir = y + ry; if (gir < h) say += a[gir * w + x]
      const cik = y - ry - 1; if (cik >= 0) say -= a[cik * w + x]
      b[y * w + x] = say > 0 ? 1 : 0
    }
  }
  return { w, h, d: b }
}

export function asindir(m: Maske, rx: number, ry: number): Maske {
  const ters: Maske = { w: m.w, h: m.h, d: new Uint8Array(m.d.length) }
  for (let i = 0; i < m.d.length; i++) ters.d[i] = m.d[i] ? 0 : 1
  const g = genislet(ters, rx, ry)
  for (let i = 0; i < g.d.length; i++) g.d[i] = g.d[i] ? 0 : 1
  return g
}

/** Solve the 8-parameter homography mapping src[i] -> dst[i] (Gaussian elimination). */
export function homografi(src: Nokta[], dst: Nokta[]): number[] {
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i], { x: u, y: v } = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  for (let c = 0; c < 8; c++) {
    let p = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    const piv = A[c][c] || 1e-12
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c] / piv
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]
    }
  }
  const h = A.map((r, i) => r[8] / (A[i][i] || 1e-12))
  return [...h, 1]
}

export function noktaDonustur(H: number[], p: Nokta): Nokta {
  const z = H[6] * p.x + H[7] * p.y + H[8]
  return { x: (H[0] * p.x + H[1] * p.y + H[2]) / z, y: (H[3] * p.x + H[4] * p.y + H[5]) / z }
}

/** Upright page of size w x h from the four corners (inverse mapping, bilinear), RGBA in → RGBA out. */
export function perspektifDuzelt(r: Rgba, koseler: Dortgen, w: number, h: number): Rgba {
  const hedef: Nokta[] = [{ x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: w - 1, y: h - 1 }, { x: 0, y: h - 1 }]
  const H = homografi(hedef, koseler)
  const d = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = noktaDonustur(H, { x, y })
    const x0 = Math.floor(s.x), y0 = Math.floor(s.y)
    const o = (y * w + x) * 4
    if (x0 < 0 || y0 < 0 || x0 >= r.w - 1 || y0 >= r.h - 1) { d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = 255; continue }
    const fx = s.x - x0, fy = s.y - y0
    const i00 = (y0 * r.w + x0) * 4, i10 = i00 + 4, i01 = i00 + r.w * 4, i11 = i01 + 4
    for (let c = 0; c < 3; c++) {
      d[o + c] = (r.d[i00 + c] * (1 - fx) + r.d[i10 + c] * fx) * (1 - fy) + (r.d[i01 + c] * (1 - fx) + r.d[i11 + c] * fx) * fy
    }
    d[o + 3] = 255
  }
  return { w, h, d }
}

/** Output size for the de-warped page: keeps the detected height, width from the template aspect (w/h) or the quad. */
export function hedefBoyut(koseler: Dortgen, enBoy: number | null, maxKenar = 2200): { w: number; h: number } {
  const uz = (a: Nokta, b: Nokta) => Math.hypot(a.x - b.x, a.y - b.y)
  const w0 = (uz(koseler[0], koseler[1]) + uz(koseler[3], koseler[2])) / 2
  const h0 = (uz(koseler[0], koseler[3]) + uz(koseler[1], koseler[2])) / 2
  const oran = enBoy && enBoy > 0.3 && enBoy < 3 ? enBoy : w0 / Math.max(1, h0)
  let h = h0, w = h0 * oran
  const o = Math.min(1, maxKenar / Math.max(w, h))
  w *= o; h *= o
  return { w: Math.max(32, Math.round(w)), h: Math.max(32, Math.round(h)) }
}

/**
 * Background (paper + shadow) division: estimate the paper brightness with a max filter on a coarse grid, smooth it,
 * divide. Ink stays dark, shadows and colour casts disappear. Returns a stretched 8-bit image.
 */
export function kontrastNormalize(g: Gri): Gri {
  const hucre = Math.max(8, Math.round(Math.max(g.w, g.h) / 48))
  const gw = Math.ceil(g.w / hucre), gh = Math.ceil(g.h / hucre)
  const arka = new Float32Array(gw * gh)
  for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
    // 90th percentile of the cell (robust paper estimate; a pure max picks up glare)
    const hist = new Uint32Array(32)
    let n = 0
    for (let y = cy * hucre; y < Math.min(g.h, (cy + 1) * hucre); y++) for (let x = cx * hucre; x < Math.min(g.w, (cx + 1) * hucre); x++) { hist[g.d[y * g.w + x] >> 3]++; n++ }
    let birikim = 0, p = 31
    for (let b = 0; b < 32; b++) { birikim += hist[b]; if (birikim >= n * 0.9) { p = b; break } }
    arka[cy * gw + cx] = Math.max(40, p * 8 + 4)
  }
  // smooth the background grid (3x3 mean, twice)
  for (let tur = 0; tur < 2; tur++) {
    const k = arka.slice()
    for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
      let t = 0, n = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = cy + dy, xx = cx + dx; if (yy >= 0 && yy < gh && xx >= 0 && xx < gw) { t += k[yy * gw + xx]; n++ } }
      arka[cy * gw + cx] = t / n
    }
  }
  const d = new Uint8ClampedArray(g.w * g.h)
  for (let y = 0; y < g.h; y++) {
    const fy = Math.min(gh - 1.001, Math.max(0, y / hucre - 0.5)), y0 = Math.floor(fy), ay = fy - y0
    for (let x = 0; x < g.w; x++) {
      const fx = Math.min(gw - 1.001, Math.max(0, x / hucre - 0.5)), x0 = Math.floor(fx), ax = fx - x0
      const y1 = Math.min(gh - 1, y0 + 1), x1 = Math.min(gw - 1, x0 + 1)
      const b = (arka[y0 * gw + x0] * (1 - ax) + arka[y0 * gw + x1] * ax) * (1 - ay) + (arka[y1 * gw + x0] * (1 - ax) + arka[y1 * gw + x1] * ax) * ay
      d[y * g.w + x] = Math.min(255, (g.d[y * g.w + x] / b) * 255)
    }
  }
  return { w: g.w, h: g.h, d }
}

/** Ink threshold for a contrast-normalised page: Otsu minus a margin, clamped (light pencil-like ink vs show-through). */
export function murekkepEsigi(n: Gri): number {
  // darkest 1% = the pen; show-through of a printed reverse side sits much lighter than real ink
  const hist = new Uint32Array(256)
  for (let i = 0; i < n.d.length; i++) hist[n.d[i]]++
  let birikim = 0, p1 = 0
  for (let v = 0; v < 256; v++) { birikim += hist[v]; if (birikim >= n.d.length * 0.01) { p1 = v; break } }
  return Math.max(140, Math.min(195, otsu(n) - 15, p1 + 0.5 * (250 - p1)))
}

/** Ink mask on a contrast-normalised page: a pixel is ink when clearly darker than paper. */
export function murekkepMaskesi(n: Gri, esik = murekkepEsigi(n)): Maske {
  const d = new Uint8Array(n.w * n.h)
  for (let i = 0; i < d.length; i++) d[i] = n.d[i] < esik ? 1 : 0
  return { w: n.w, h: n.h, d }
}

/**
 * Pen ink that is coloured (blue / violet / red / green ballpoint): chroma clearly above the paper's and the grey print's.
 * Printed anatomical drawings on a black-and-white form are grey, so colour separates the doctor's marks from the print.
 */
export function renkliMurekkep(r: Rgba): Maske {
  const d = new Uint8Array(r.w * r.h)
  for (let i = 0, j = 0; i < d.length; i++, j += 4) {
    const R = r.d[j], G = r.d[j + 1], B = r.d[j + 2]
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B)
    const kroma = mx - mn
    // blue/violet ballpoint: B dominant; red: R dominant with low G; green rare. Dark enough to be ink, not paper tint.
    const mavi = B > R + 18 && B > G + 8 && kroma > 28 && mx < 225
    const kirmizi = R > G + 50 && R > B + 30 && mx < 235
    d[i] = mavi || kirmizi ? 1 : 0
  }
  return { w: r.w, h: r.h, d }
}

/** Rotation (degrees) that maximises the variance of the horizontal ink projection. Search ±6° in 0.25° steps. */
export function egimBul(m: Maske): number {
  const k = maskeyiKucult(m, 700)
  const noktalar: number[] = []
  for (let y = 0; y < k.h; y++) for (let x = 0; x < k.w; x++) if (k.d[y * k.w + x]) noktalar.push(x, y)
  if (noktalar.length < 200) return 0
  let enIyiAci = 0, enIyi = -1
  const cx = k.w / 2, cy = k.h / 2
  const prof = new Float64Array(k.h * 2)
  for (let aci = -6; aci <= 6.0001; aci += 0.25) {
    const r = (aci * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r)
    prof.fill(0)
    for (let i = 0; i < noktalar.length; i += 2) {
      const yy = Math.round(-(noktalar[i] - cx) * s + (noktalar[i + 1] - cy) * c + cy + k.h / 2)
      if (yy >= 0 && yy < prof.length) prof[yy]++
    }
    let t = 0, t2 = 0
    for (let i = 0; i < prof.length; i++) { t += prof[i]; t2 += prof[i] * prof[i] }
    const v = t2 / prof.length - (t / prof.length) ** 2
    if (v > enIyi) { enIyi = v; enIyiAci = aci }
  }
  return enIyiAci
}

export function maskeyiKucult(m: Maske, maxKenar: number): Maske {
  const o = Math.min(1, maxKenar / Math.max(m.w, m.h))
  if (o === 1) return m
  const w = Math.max(1, Math.round(m.w * o)), h = Math.max(1, Math.round(m.h * o))
  const d = new Uint8Array(w * h)
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.d[y * m.w + x]) d[Math.min(h - 1, Math.floor(y * o)) * w + Math.min(w - 1, Math.floor(x * o))] = 1
  return { w, h, d }
}

/** Rotate an RGBA raster by `aci` degrees around its centre (bilinear, white fill). */
export function dondur(r: Rgba, aci: number): Rgba {
  if (Math.abs(aci) < 0.05) return r
  const rad = (-aci * Math.PI) / 180, s = Math.sin(rad), c = Math.cos(rad)
  const cx = r.w / 2, cy = r.h / 2
  const d = new Uint8ClampedArray(r.d.length)
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const sx = (x - cx) * c - (y - cy) * s + cx, sy = (x - cx) * s + (y - cy) * c + cy
    const o = (y * r.w + x) * 4
    const x0 = Math.floor(sx), y0 = Math.floor(sy)
    if (x0 < 0 || y0 < 0 || x0 >= r.w - 1 || y0 >= r.h - 1) { d[o] = d[o + 1] = d[o + 2] = d[o + 3] = 255; continue }
    const fx = sx - x0, fy = sy - y0, i00 = (y0 * r.w + x0) * 4, i10 = i00 + 4, i01 = i00 + r.w * 4, i11 = i01 + 4
    for (let k = 0; k < 3; k++) d[o + k] = (r.d[i00 + k] * (1 - fx) + r.d[i10 + k] * fx) * (1 - fy) + (r.d[i01 + k] * (1 - fx) + r.d[i11 + k] * fx) * fy
    d[o + 3] = 255
  }
  return { w: r.w, h: r.h, d }
}

/** Thresholds of the capture gate (measured on the 2026-11 KBB sample set; see scripts/el-notu-degerlendir.mjs). */
export const KALITE_ESIKLERI = { bulaniklik: 55, parlama: 0.035, karanlik: 70, kisaKenar: 900, sayfaOrani: 0.2 }

export function kaliteKarari(o: { bulaniklik: number; parlama: number; parlaklik: number; kisaKenar: number; sayfaOrani: number }): KaliteKarari {
  const n: KaliteNedeni[] = []
  if (o.bulaniklik < KALITE_ESIKLERI.bulaniklik) n.push('bulanik')
  if (o.parlama > KALITE_ESIKLERI.parlama) n.push('parlama')
  if (o.parlaklik < KALITE_ESIKLERI.karanlik) n.push('karanlik')
  if (o.kisaKenar < KALITE_ESIKLERI.kisaKenar) n.push('kucuk')
  if (o.sayfaOrani < KALITE_ESIKLERI.sayfaOrani) n.push('sayfa_yok')
  return { tamam: n.length === 0, nedenler: n, olcum: o }
}

export type OnislemeSonucu = {
  /** Upright, de-skewed colour page (the ORIGINAL pixels, identity still present — never sent as is). */
  sayfa: Rgba
  /** Contrast-normalised grey of `sayfa`. */
  normal: Gri
  murekkep: Maske
  renkli: Maske
  kalite: KaliteKarari
  egim: number
  kenarBulundu: boolean
  koseler: Dortgen
}

/** Full chain for one captured photo. `enBoy` = template aspect (w/h) when the template is already known. */
export function sayfayiHazirla(foto: Rgba, o: { enBoy?: number | null; maxKenar?: number } = {}): OnislemeSonucu {
  const gri = griyeCevir(foto)
  const bulma = sayfaBul(foto)
  const { w, h } = hedefBoyut(bulma.koseler, o.enBoy ?? null, o.maxKenar ?? 2200)
  let sayfa = perspektifDuzelt(foto, bulma.koseler, w, h)
  let normal = kontrastNormalize(griyeCevir(sayfa))
  const egim = egimBul(murekkepMaskesi(normal))
  if (Math.abs(egim) >= 0.25) {
    sayfa = dondur(sayfa, -egim)
    normal = kontrastNormalize(griyeCevir(sayfa))
  }
  const kaliteGri = griyeCevir(sayfa)
  const kalite = kaliteKarari({
    bulaniklik: bulaniklikOlc(kaliteGri), parlama: parlamaOlc(gri), parlaklik: ortalama(gri),
    kisaKenar: Math.min(sayfa.w, sayfa.h), sayfaOrani: bulma.oran,
  })
  return { sayfa, normal, murekkep: murekkepMaskesi(normal), renkli: renkliMurekkep(sayfa), kalite, egim, kenarBulundu: bulma.kenarBulundu, koseler: bulma.koseler }
}
