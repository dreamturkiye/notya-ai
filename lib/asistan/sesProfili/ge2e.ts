/**
 * NOTYA-SES-PROFILI-01 — GE2E speaker encoder (Resemblyzer, Apache-2.0) in plain TypeScript.
 *
 * Mirrors resemblyzer 0.1.4 (`audio.wav_to_mel_spectrogram`, `VoiceEncoder.forward / embed_utterance`):
 * 16 kHz mono → linear mel power spectrogram (librosa: n_fft 400, hop 160, 40 Slaney mels, hann, centred,
 * zero-padded) → 3-layer LSTM (40→256) → last hidden state → linear 256→256 → ReLU → L2 normalise.
 * Weights: public/ses-profili/ge2e-v1.bin (float16; scripts/ses-profili/ge2e-donustur.py).
 * Pure functions, no DOM: runs in the Web Worker (isci.ts) and in node tests.
 */

export const GE2E_HZ = 16000
const N_FFT = 400
const HOP = 160
const N_MEL = 40
const GIZLI = 256
const PARCA_KARE = 160
const HEDEF_DBFS = -30

export type Ge2eAgirlik = {
  /** Per layer: W_ih (1024 × giris), W_hh (1024 × 256), b = b_ih + b_hh. Gate order i, f, g, o (PyTorch). */
  katmanlar: { wih: Float32Array; whh: Float32Array; b: Float32Array; giris: number }[]
  lw: Float32Array
  lb: Float32Array
}

function f16(h: number): number {
  const s = h & 0x8000 ? -1 : 1
  const e = (h >> 10) & 0x1f
  const m = h & 0x3ff
  if (e === 0) return s * m * 2 ** -24
  if (e === 31) return m ? Number.NaN : s * Number.POSITIVE_INFINITY
  return s * (1 + m / 1024) * 2 ** (e - 15)
}

/** Parse the 'NSP1' weight file. Throws on anything unexpected (the caller then runs without a profile). */
export function agirlikCoz(buf: ArrayBuffer): Ge2eAgirlik {
  const v = new DataView(buf)
  if (buf.byteLength < 8 || String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)) !== 'NSP1') throw new Error('ses_profili_model_bicim')
  const bl = v.getUint32(4, true)
  const baslik = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, bl))) as { tur: string; tensorler: { ad: string; sekil: number[]; ofset: number }[] }
  if (baslik.tur !== 'f16') throw new Error('ses_profili_model_tur')
  const veri = 8 + bl
  const t: Record<string, Float32Array> = {}
  for (const x of baslik.tensorler) {
    const n = x.sekil.reduce((a, b) => a * b, 1)
    const out = new Float32Array(n)
    const bas = veri + x.ofset * 2
    if (bas + n * 2 > buf.byteLength) throw new Error('ses_profili_model_kisa')
    for (let i = 0; i < n; i++) out[i] = f16(v.getUint16(bas + i * 2, true))
    t[x.ad] = out
  }
  const katmanlar: Ge2eAgirlik['katmanlar'] = []
  for (let l = 0; l < 3; l++) {
    const bih = t[`lstm.bias_ih_l${l}`]
    const bhh = t[`lstm.bias_hh_l${l}`]
    const wih = t[`lstm.weight_ih_l${l}`]
    const whh = t[`lstm.weight_hh_l${l}`]
    if (!bih || !bhh || !wih || !whh) throw new Error('ses_profili_model_eksik')
    const b = new Float32Array(4 * GIZLI)
    for (let i = 0; i < b.length; i++) b[i] = bih[i] + bhh[i]
    katmanlar.push({ wih, whh, b, giris: l === 0 ? N_MEL : GIZLI })
  }
  if (!t['linear.weight'] || !t['linear.bias']) throw new Error('ses_profili_model_eksik')
  return { katmanlar, lw: t['linear.weight'], lb: t['linear.bias'] }
}

/* ---- Mel spectrogram (librosa-compatible) ---- */

let melFiltre: Float32Array[] | null = null
let pencere: Float32Array | null = null
let cosT: Float32Array | null = null
let sinT: Float32Array | null = null

function hzMel(f: number): number {
  const fSp = 200 / 3
  const minLog = 1000
  const minLogMel = minLog / fSp
  const logStep = Math.log(6.4) / 27
  return f >= minLog ? minLogMel + Math.log(f / minLog) / logStep : f / fSp
}
function melHz(m: number): number {
  const fSp = 200 / 3
  const minLog = 1000
  const minLogMel = minLog / fSp
  const logStep = Math.log(6.4) / 27
  return m >= minLogMel ? minLog * Math.exp(logStep * (m - minLogMel)) : fSp * m
}

function hazirla(): void {
  if (melFiltre) return
  const nBin = N_FFT / 2 + 1
  const fftF = Array.from({ length: nBin }, (_, i) => (i * GE2E_HZ) / N_FFT)
  const mMin = hzMel(0)
  const mMax = hzMel(GE2E_HZ / 2)
  const melF = Array.from({ length: N_MEL + 2 }, (_, i) => melHz(mMin + ((mMax - mMin) * i) / (N_MEL + 1)))
  melFiltre = []
  for (let m = 0; m < N_MEL; m++) {
    const w = new Float32Array(nBin)
    const alt = melF[m]
    const orta = melF[m + 1]
    const ust = melF[m + 2]
    const enorm = 2 / (ust - alt)
    for (let k = 0; k < nBin; k++) {
      const a = (fftF[k] - alt) / (orta - alt)
      const b = (ust - fftF[k]) / (ust - orta)
      w[k] = Math.max(0, Math.min(a, b)) * enorm
    }
    melFiltre.push(w)
  }
  pencere = new Float32Array(N_FFT)
  for (let n = 0; n < N_FFT; n++) pencere[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / N_FFT)
  cosT = new Float32Array(nBin * N_FFT)
  sinT = new Float32Array(nBin * N_FFT)
  for (let k = 0; k < nBin; k++) {
    for (let n = 0; n < N_FFT; n++) {
      const a = (2 * Math.PI * k * n) / N_FFT
      cosT[k * N_FFT + n] = Math.cos(a)
      sinT[k * N_FFT + n] = Math.sin(a)
    }
  }
}

/** Frames × 40 linear mel power (librosa center=True, pad_mode='constant'). Row-major Float32Array. */
export function melSpektrogram(wav: Float32Array): { kare: number; mel: Float32Array } {
  hazirla()
  const fil = melFiltre as Float32Array[]
  const pen = pencere as Float32Array
  const ct = cosT as Float32Array
  const st = sinT as Float32Array
  const nBin = N_FFT / 2 + 1
  const kare = 1 + Math.floor(wav.length / HOP)
  const mel = new Float32Array(kare * N_MEL)
  const cerceve = new Float32Array(N_FFT)
  const guc = new Float32Array(nBin)
  const yarim = N_FFT / 2
  for (let f = 0; f < kare; f++) {
    const bas = f * HOP - yarim
    for (let n = 0; n < N_FFT; n++) {
      const i = bas + n
      cerceve[n] = i >= 0 && i < wav.length ? wav[i] * pen[n] : 0
    }
    for (let k = 0; k < nBin; k++) {
      let re = 0
      let im = 0
      const o = k * N_FFT
      for (let n = 0; n < N_FFT; n++) {
        re += cerceve[n] * ct[o + n]
        im -= cerceve[n] * st[o + n]
      }
      guc[k] = re * re + im * im
    }
    for (let m = 0; m < N_MEL; m++) {
      const w = fil[m]
      let s = 0
      for (let k = 0; k < nBin; k++) s += w[k] * guc[k]
      mel[f * N_MEL + m] = s
    }
  }
  return { kare, mel }
}

/* ---- Encoder ---- */

const sig = (x: number) => 1 / (1 + Math.exp(-x))

/** Embedding of mel frames [bas, bit). Returns an L2-normalised Float32Array(256). */
export function kareGomme(a: Ge2eAgirlik, mel: Float32Array, bas: number, bit: number): Float32Array {
  const T = Math.max(0, bit - bas)
  let girdi = new Float32Array(T * N_MEL)
  girdi.set(mel.subarray(bas * N_MEL, bit * N_MEL))
  let girisBoyut = N_MEL
  const h = new Float32Array(GIZLI)
  const c = new Float32Array(GIZLI)
  const g = new Float32Array(4 * GIZLI)
  for (const k of a.katmanlar) {
    const cikti = new Float32Array(T * GIZLI)
    h.fill(0)
    c.fill(0)
    for (let t = 0; t < T; t++) {
      const xo = t * girisBoyut
      for (let r = 0; r < 4 * GIZLI; r++) {
        let s = k.b[r]
        const wo = r * girisBoyut
        for (let j = 0; j < girisBoyut; j++) s += k.wih[wo + j] * girdi[xo + j]
        const ho = r * GIZLI
        for (let j = 0; j < GIZLI; j++) s += k.whh[ho + j] * h[j]
        g[r] = s
      }
      for (let j = 0; j < GIZLI; j++) {
        const ig = sig(g[j])
        const fg = sig(g[GIZLI + j])
        const gg = Math.tanh(g[2 * GIZLI + j])
        const og = sig(g[3 * GIZLI + j])
        c[j] = fg * c[j] + ig * gg
        h[j] = og * Math.tanh(c[j])
      }
      cikti.set(h, t * GIZLI)
    }
    girdi = cikti
    girisBoyut = GIZLI
  }
  const e = new Float32Array(GIZLI)
  let n2 = 0
  for (let r = 0; r < GIZLI; r++) {
    let s = a.lb[r]
    const o = r * GIZLI
    for (let j = 0; j < GIZLI; j++) s += a.lw[o + j] * h[j]
    e[r] = s > 0 ? s : 0
    n2 += e[r] * e[r]
  }
  const n = Math.sqrt(n2) || 1
  for (let r = 0; r < GIZLI; r++) e[r] /= n
  return e
}

/** resemblyzer `normalize_volume(wav, -30, increase_only=True)`. */
export function sesSeviyele(wav: Float32Array): Float32Array {
  let s = 0
  for (let i = 0; i < wav.length; i++) s += wav[i] * wav[i]
  const rms = Math.sqrt(s / Math.max(1, wav.length))
  if (!(rms > 0)) return wav
  const degisim = HEDEF_DBFS - 20 * Math.log10(rms)
  if (degisim < 0) return wav
  const k = 10 ** (degisim / 20)
  const out = new Float32Array(wav.length)
  for (let i = 0; i < wav.length; i++) out[i] = wav[i] * k
  return out
}

/** resemblyzer `embed_utterance` (rate 1.3, min_coverage 0.75): mean of 1.6 s partials, L2-normalised. */
export function sozGomme(a: Ge2eAgirlik, wav16: Float32Array): Float32Array {
  let wav = sesSeviyele(wav16)
  const n = wav.length
  const nKare = Math.ceil((n + 1) / HOP)
  const adim = Math.round(GE2E_HZ / 1.3 / HOP)
  const dilimler: [number, number][] = []
  const son = Math.max(1, nKare - PARCA_KARE + adim + 1)
  for (let i = 0; i < son; i += adim) dilimler.push([i, i + PARCA_KARE])
  const kapsam = (n - dilimler[dilimler.length - 1][0] * HOP) / (PARCA_KARE * HOP)
  if (kapsam < 0.75 && dilimler.length > 1) dilimler.pop()
  const azami = dilimler[dilimler.length - 1][1] * HOP
  if (azami >= n) {
    const p = new Float32Array(azami)
    p.set(wav)
    wav = p
  }
  const { mel } = melSpektrogram(wav)
  const top = new Float32Array(GIZLI)
  for (const [b, e] of dilimler) {
    const g = kareGomme(a, mel, b, e)
    for (let i = 0; i < GIZLI; i++) top[i] += g[i]
  }
  return normalize(top)
}

/** One short runtime segment (≤ 1.6 s): a single partial over its own frames. */
export function parcaGomme(a: Ge2eAgirlik, wav16: Float32Array): Float32Array {
  const wav = sesSeviyele(wav16)
  const { kare, mel } = melSpektrogram(wav)
  return kareGomme(a, mel, 0, Math.min(kare, PARCA_KARE))
}

export function normalize(v: ArrayLike<number>): Float32Array {
  let n2 = 0
  for (let i = 0; i < v.length; i++) n2 += v[i] * v[i]
  const n = Math.sqrt(n2) || 1
  const out = new Float32Array(v.length)
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n
  return out
}

export function kosinus(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || !a.length) return Number.NaN
  let s = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na > 0 && nb > 0 ? s / Math.sqrt(na * nb) : Number.NaN
}

/** Profile = L2-normalised mean of the sentence embeddings (resemblyzer `embed_speaker`). */
export function profilOrtalama(gommeler: ArrayLike<number>[]): Float32Array {
  const top = new Float32Array(GIZLI)
  for (const g of gommeler) for (let i = 0; i < GIZLI; i++) top[i] += g[i]
  return normalize(top)
}

/** Linear-interpolation resample with a box low-pass when downsampling (enrolment audio at the device rate). */
export function yenidenOrnekle(pcm: Float32Array, hz: number): Float32Array {
  if (hz === GE2E_HZ) return pcm
  const oran = hz / GE2E_HZ
  let kaynak = pcm
  if (oran > 1) {
    const w = Math.max(1, Math.round(oran))
    kaynak = new Float32Array(pcm.length)
    let s = 0
    for (let i = 0; i < pcm.length; i++) {
      s += pcm[i]
      if (i >= w) s -= pcm[i - w]
      kaynak[i] = s / Math.min(i + 1, w)
    }
  }
  const n = Math.floor(pcm.length / oran)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = i * oran
    const j = Math.floor(x)
    const f = x - j
    out[i] = (kaynak[j] ?? 0) * (1 - f) + (kaynak[j + 1] ?? kaynak[j] ?? 0) * f
  }
  return out
}
