/**
 * FOTO-ARSIV-01 / FOTO-AI-01 — instant, free, on-device quality gate for a photo that is about to be saved.
 *
 * The AI evaluation also reports quality, but it costs a call. This pure check runs on a downscaled copy of the frame
 * in the browser (blur by variance of the Laplacian, exposure from the histogram, contrast, resolution) and decides
 * whether to suggest "çekimi yenileyin" BEFORE the photo is stored. It never blocks: the doctor can always keep the photo.
 *
 * The thresholds below are starting points chosen on synthetic frames only. They have NOT been tuned on real
 * clinical photographs (open commitment FOTO-AI-02) — treat a "uyarı" as a hint, not a measurement.
 */
export interface KaliteOlcumu {
  /** variance of the Laplacian of the luma plane (higher = sharper); measured on <= 512 px frame */
  netlik: number
  ortalamaParlaklik: number
  /** share of pixels with luma < 25 */
  karanlikOrani: number
  /** share of pixels with luma > 245 */
  patlamaOrani: number
  /** standard deviation of luma */
  kontrast: number
}

export type KaliteKodu = 'bulanik' | 'karanlik' | 'asiri-parlak' | 'dusuk-kontrast' | 'kucuk'

export interface KaliteSorunu { kod: KaliteKodu; agir: boolean; mesaj: string }

export interface KaliteKarari {
  durum: 'iyi' | 'uyari' | 'yetersiz'
  sorunlar: KaliteSorunu[]
  /** Turkish one-liner for the doctor, null when the frame is fine. */
  oneri: string | null
}

export const KALITE_ESIKLERI = {
  netlikUyari: 60,
  netlikYetersiz: 18,
  ortalamaKaranlik: 55,
  ortalamaKaranlikYetersiz: 30,
  ortalamaParlak: 205,
  ortalamaParlakYetersiz: 235,
  patlamaOrani: 0.25,
  kontrastDusuk: 22,
  kisaKenarAzami: 480,
} as const

const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b

/** Box-downscale an RGBA frame so its longest side is <= azami (nearest-neighbour is enough for statistics). */
export function kucultRgba(veri: Uint8ClampedArray, w: number, h: number, azami = 512): { veri: Uint8ClampedArray; w: number; h: number } {
  const oran = Math.min(1, azami / Math.max(w, h))
  if (oran >= 1) return { veri, w, h }
  const nw = Math.max(1, Math.round(w * oran)), nh = Math.max(1, Math.round(h * oran))
  const out = new Uint8ClampedArray(nw * nh * 4)
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(h - 1, Math.floor((y + 0.5) / oran))
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(w - 1, Math.floor((x + 0.5) / oran))
      const s = (sy * w + sx) * 4, d = (y * nw + x) * 4
      out[d] = veri[s]; out[d + 1] = veri[s + 1]; out[d + 2] = veri[s + 2]; out[d + 3] = 255
    }
  }
  return { veri: out, w: nw, h: nh }
}

export function kaliteOlc(veri: Uint8ClampedArray, w: number, h: number): KaliteOlcumu {
  const k = kucultRgba(veri, w, h)
  const n = k.w * k.h
  const y = new Float32Array(n)
  let toplam = 0, karanlik = 0, patlama = 0
  for (let i = 0; i < n; i++) {
    const l = luma(k.veri[i * 4], k.veri[i * 4 + 1], k.veri[i * 4 + 2])
    y[i] = l
    toplam += l
    if (l < 25) karanlik++
    if (l > 245) patlama++
  }
  const ort = n ? toplam / n : 0
  let varyans = 0
  for (let i = 0; i < n; i++) varyans += (y[i] - ort) ** 2
  const kontrast = n ? Math.sqrt(varyans / n) : 0

  // Laplacian (4-neighbour) variance
  let lSum = 0, lSq = 0, lN = 0
  for (let r = 1; r < k.h - 1; r++) {
    for (let c = 1; c < k.w - 1; c++) {
      const i = r * k.w + c
      const lap = y[i - 1] + y[i + 1] + y[i - k.w] + y[i + k.w] - 4 * y[i]
      lSum += lap; lSq += lap * lap; lN++
    }
  }
  const netlik = lN ? lSq / lN - (lSum / lN) ** 2 : 0
  return { netlik, ortalamaParlaklik: ort, karanlikOrani: n ? karanlik / n : 0, patlamaOrani: n ? patlama / n : 0, kontrast }
}

export function kaliteKarari(o: KaliteOlcumu, w: number, h: number): KaliteKarari {
  const E = KALITE_ESIKLERI
  const sorunlar: KaliteSorunu[] = []
  if (o.netlik < E.netlikYetersiz) sorunlar.push({ kod: 'bulanik', agir: true, mesaj: 'Görüntü belirgin şekilde bulanık.' })
  else if (o.netlik < E.netlikUyari) sorunlar.push({ kod: 'bulanik', agir: false, mesaj: 'Görüntü hafif bulanık olabilir.' })
  if (o.ortalamaParlaklik < E.ortalamaKaranlikYetersiz) sorunlar.push({ kod: 'karanlik', agir: true, mesaj: 'Işık çok az.' })
  else if (o.ortalamaParlaklik < E.ortalamaKaranlik) sorunlar.push({ kod: 'karanlik', agir: false, mesaj: 'Işık az.' })
  if (o.ortalamaParlaklik > E.ortalamaParlakYetersiz) sorunlar.push({ kod: 'asiri-parlak', agir: true, mesaj: 'Görüntü aşırı parlak (patlamış).' })
  else if (o.ortalamaParlaklik > E.ortalamaParlak || o.patlamaOrani > E.patlamaOrani) sorunlar.push({ kod: 'asiri-parlak', agir: false, mesaj: 'Parlama ya da yansıma var.' })
  if (o.kontrast < E.kontrastDusuk && !sorunlar.some((s) => s.kod === 'karanlik' || s.kod === 'asiri-parlak')) {
    sorunlar.push({ kod: 'dusuk-kontrast', agir: false, mesaj: 'Kontrast düşük; ayrıntılar silik kalabilir.' })
  }
  if (Math.min(w, h) < E.kisaKenarAzami) sorunlar.push({ kod: 'kucuk', agir: Math.min(w, h) < 240, mesaj: 'Çözünürlük düşük.' })

  const agir = sorunlar.some((s) => s.agir)
  const durum: KaliteKarari['durum'] = agir ? 'yetersiz' : sorunlar.length ? 'uyari' : 'iyi'
  const oneri = sorunlar.length
    ? `${sorunlar.map((s) => s.mesaj).join(' ')} ${agir ? 'Çekimi yenileyin.' : 'Mümkünse çekimi yenileyin.'}`
    : null
  return { durum, sorunlar, oneri }
}
