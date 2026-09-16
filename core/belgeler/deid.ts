/**
 * NOTYA-BELGE-01 — Client-side de-identification and audio preparation (runs in the doctor's browser).
 *  - images: canvas re-encode strips EXIF/metadata, downscales to ≤1568 px (Anthropic vision sweet spot),
 *            returns JPEG base64 + sha256. The vault original never leaves the device in original form.
 *  - audio : Web Audio decode → mono → mel-ish log spectrogram PNG + quality metrics (duration, clipping, RMS, SNR proxy).
 * Face blur for facial photos and OCR redaction of burned-in text are the doctor's explicit checkbox in V1
 * ("görüntüde hasta adı/TC yok"); automatic OCR/face blur is a Tier B item (README_BELGELER.md).
 */

export type DeIdGorsel = { mime: 'image/jpeg' | 'image/png'; base64: string; hash: string; genislik: number; yukseklik: number; kalite: { bulanik: boolean; laplacianVar: number; parlaklik: number } }
export type SesHazirlik = { spektrogram: DeIdGorsel; metrikler: Record<string, number | string>; kaliteDusuk: boolean; neden: string | null }

async function sha256(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const h = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, '0')).join('')
}

function laplacianVariance(ctx: CanvasRenderingContext2D, w: number, h: number): { v: number; mean: number } {
  const { data } = ctx.getImageData(0, 0, w, h)
  const g = new Float32Array(w * h)
  let sum = 0
  for (let i = 0; i < w * h; i++) { const y = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]; g[i] = y; sum += y }
  const mean = sum / (w * h)
  let lsum = 0, lsq = 0, n = 0
  for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < w - 1; x += 2) {
    const i = y * w + x
    const l = -4 * g[i] + g[i - 1] + g[i + 1] + g[i - w] + g[i + w]
    lsum += l; lsq += l * l; n++
  }
  const lmean = lsum / n
  return { v: lsq / n - lmean * lmean, mean }
}

export async function gorseliKimliksizlestir(dosya: Blob, maxKenar = 1568): Promise<DeIdGorsel> {
  const bmp = await createImageBitmap(dosya)
  const olcek = Math.min(1, maxKenar / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * olcek)), h = Math.max(1, Math.round(bmp.height * olcek))
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0, w, h)
  const kucuk = document.createElement('canvas'); kucuk.width = Math.min(w, 512); kucuk.height = Math.round(h * (kucuk.width / w))
  const kctx = kucuk.getContext('2d')!; kctx.drawImage(c, 0, 0, kucuk.width, kucuk.height)
  const { v, mean } = laplacianVariance(kctx, kucuk.width, kucuk.height)
  const dataUrl = c.toDataURL('image/jpeg', 0.9) // re-encode = metadata gone
  const base64 = dataUrl.split(',')[1]
  return { mime: 'image/jpeg', base64, hash: await sha256(base64), genislik: w, yukseklik: h, kalite: { bulanik: v < 40, laplacianVar: Math.round(v), parlaklik: Math.round(mean) } }
}

export async function pdfHazirla(): Promise<null> { return null } // PDF is sent server-side from the vault (no pixels to de-id)

/** Mono log-spectrogram as a PNG the writer can look at, plus quality metrics. */
export async function sesiHazirla(dosya: Blob): Promise<SesHazirlik> {
  const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
  const ac = new AC()
  const buf = await ac.decodeAudioData(await dosya.arrayBuffer())
  const sr = buf.sampleRate, sure = buf.duration
  const ch = buf.getChannelData(0)
  const mono = new Float32Array(ch.length)
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i] += d[i] / buf.numberOfChannels }
  let rms = 0, clip = 0, peak = 0
  for (let i = 0; i < mono.length; i++) { const a = Math.abs(mono[i]); rms += a * a; if (a > 0.985) clip++; if (a > peak) peak = a }
  rms = Math.sqrt(rms / mono.length)
  // STFT (Hann, 1024, hop 512) → 128 log-spaced bands up to 4 kHz (lung/heart sounds live below 2 kHz)
  const N = 1024, hop = 512, bands = 128, fmax = Math.min(4000, sr / 2)
  const frames = Math.max(1, Math.floor((mono.length - N) / hop))
  const hann = new Float32Array(N); for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N)
  const spec = new Float32Array(frames * bands)
  const re = new Float32Array(N), im = new Float32Array(N)
  const edges: number[] = []; for (let b = 0; b <= bands; b++) edges.push(Math.round((Math.pow(fmax / 40, b / bands) * 40) / (sr / N)))
  let gMin = Infinity, gMax = -Infinity
  const frameEnergy = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = mono[f * hop + i] * hann[i]; im[i] = 0 }
    fft(re, im)
    for (let b = 0; b < bands; b++) {
      let s = 0; const a0 = Math.max(1, edges[b]), a1 = Math.max(a0 + 1, edges[b + 1])
      for (let k = a0; k < a1 && k < N / 2; k++) s += re[k] * re[k] + im[k] * im[k]
      const v = Math.log10(s / (a1 - a0) + 1e-9); spec[f * bands + b] = v; if (v < gMin) gMin = v; if (v > gMax) gMax = v
      frameEnergy[f] += s
    }
  }
  // SNR proxy: loud frames vs quiet frames
  const sorted = Array.from(frameEnergy).sort((a, b) => a - b)
  const q10 = sorted[Math.floor(sorted.length * 0.1)] + 1e-9, q90 = sorted[Math.floor(sorted.length * 0.9)] + 1e-9
  const snrDb = 10 * Math.log10(q90 / q10)
  const c = document.createElement('canvas'); c.width = Math.min(1568, frames); c.height = bands
  const ctx = c.getContext('2d')!; const img = ctx.createImageData(c.width, c.height)
  for (let x = 0; x < c.width; x++) {
    const f = Math.floor((x / c.width) * frames)
    for (let b = 0; b < bands; b++) {
      const v = (spec[f * bands + b] - gMin) / (gMax - gMin + 1e-9)
      const i = ((bands - 1 - b) * c.width + x) * 4
      img.data[i] = Math.round(255 * Math.min(1, v * 1.6)); img.data[i + 1] = Math.round(255 * Math.max(0, Math.min(1, v * 2 - 0.6))); img.data[i + 2] = Math.round(255 * Math.max(0, 1 - v * 1.5)); img.data[i + 3] = 255
    }
  }
  const base64 = c.toDataURL('image/png').split(',')[1]
  const metrikler: Record<string, number | string> = { sure_sn: Math.round(sure * 10) / 10, ornekleme_hz: sr, rms: Math.round(rms * 1000) / 1000, tepe: Math.round(peak * 100) / 100, kirpilma_pct: Math.round((clip / mono.length) * 10000) / 100, snr_db_proxy: Math.round(snrDb), spektrogram: '128 log bant, 40 Hz–4 kHz' }
  let neden: string | null = null
  if (sure < 8) neden = 'Kayıt 8 saniyeden kısa'
  else if (clip / mono.length > 0.01) neden = 'Kayıt kırpılmış (aşırı yüksek seviye)'
  else if (rms < 0.005) neden = 'Kayıt çok sessiz'
  else if (snrDb < 6) neden = 'Gürültü seviyesi yüksek'
  return { spektrogram: { mime: 'image/png', base64, hash: await sha256(base64), genislik: c.width, yukseklik: c.height, kalite: { bulanik: false, laplacianVar: 0, parlaklik: 0 } }, metrikler, kaliteDusuk: neden !== null, neden }
}

// in-place radix-2 FFT
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]] } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j]
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr
        re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr
      }
    }
  }
}
