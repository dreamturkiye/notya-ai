/** Energy + silence for one spoken turn. No ElevenLabs VAD. */

export const FISH_KONUSMA_ESIK = 0.02
/** Speaker leak of Haberci is quieter than the doctor at the mic. Barge-in must not fire on her own playback. */
export const FISH_BARGE_ESIK = 0.12
export const FISH_BARGE_MS = 350
/** End-of-turn silence tail. 800 → 600 ms (2026-09-29): RMS-only VAD; 500 clipped mid-sentence pauses ("eee"). */
export const FISH_SES_SIZLIGI_MS = 600
export const FISH_MIN_KONUSMA_MS = 500
export const FISH_AZAMI_TUR_MS = 16_000
/** Audio kept from before the first voiced frame (word onsets), everything older is dropped. */
export const FISH_ON_TAMPON_MS = 300
/** Client-side junk gate: a clip needs this much VOICED audio and this much total length. */
export const FISH_KLIP_MIN_SESLI_MS = 200
export const FISH_KLIP_MIN_TOPLAM_MS = 600

/**
 * A single click / cough used to pass: the old rule measured "time since first voiced
 * frame", which the 800 ms silence tail alone satisfied. Now the clip must carry real
 * voiced time and a minimum total length, or it never leaves the browser.
 */
export function klipGonderilirMi(g: { toplamMs: number; sesliMs: number }): { gonder: boolean; neden: string | null } {
  if (g.sesliMs < FISH_KLIP_MIN_SESLI_MS) return { gonder: false, neden: 'sesli_kisa' }
  if (g.toplamMs < FISH_KLIP_MIN_TOPLAM_MS) return { gonder: false, neden: 'toplam_kisa' }
  return { gonder: true, neden: null }
}

/**
 * Before speech starts the mic buffer must not grow forever: a doctor who listens for
 * 40 s and then speaks would send 40 s of silence (3 MB WAV → 413 and a lost turn).
 * Keep only the last `tamponMs` of pre-roll.
 */
export function onTamponuKirp(parcalar: Float32Array[], hz: number, tamponMs = FISH_ON_TAMPON_MS): void {
  const azami = Math.max(1, Math.ceil((tamponMs / 1000) * hz))
  let toplam = 0
  for (const p of parcalar) toplam += p.length
  while (parcalar.length > 1 && toplam - parcalar[0].length >= azami) {
    toplam -= parcalar[0].length
    parcalar.shift()
  }
}

export function bargeSayaci(oncekiMs: number, ajanKonusuyor: boolean, rms: number, tikMs = 50): { ms: number; kes: boolean } {
  if (!ajanKonusuyor || rms < FISH_BARGE_ESIK) return { ms: 0, kes: false }
  const ms = oncekiMs + tikMs
  return { ms, kes: ms >= FISH_BARGE_MS }
}

export function rmsHesapla(ornek: ArrayLike<number>): number {
  const n = ornek.length
  if (!n) return 0
  let s = 0
  for (let i = 0; i < n; i++) {
    const v = ornek[i]
    s += v * v
  }
  return Math.sqrt(s / n)
}

export function konusuyorMu(rms: number, esik = FISH_KONUSMA_ESIK): boolean {
  return rms >= esik
}

/* ---- NOTYA-SILERO-01: Silero VAD (in-browser, @ricky0123/vad-web) replaces the RMS gate when it loads. ---- */

/** End-of-turn silence tail with Silero: speech probability does not flicker on breaths like RMS did. */
export const FISH_SES_SIZLIGI_SILERO_MS = 350
/** Silero speech probability thresholds (hysteresis: enter above, leave below). */
export const FISH_SILERO_ESIK = 0.5
export const FISH_SILERO_CIKIS_ESIK = 0.35
/** A probability older than this (worklet stalled) is not trusted; the frame falls back to RMS. */
export const FISH_SILERO_TAZELIK_MS = 250

export type SileroOlasilik = { p: number; zaman: number } | null

/** Hysteresis gate on Silero's speech probability. `onceki` is last frame's decision. */
export function sileroKonusuyorMu(p: number, onceki: boolean, esik = FISH_SILERO_ESIK, cikis = FISH_SILERO_CIKIS_ESIK): boolean {
  if (!(p >= 0)) return false
  return onceki ? p >= cikis : p >= esik
}

/**
 * Per-frame speech decision: Silero when a fresh probability exists, RMS otherwise.
 * Barge-in stays on RMS on purpose — Silero hears Ayşe's own speaker leak as speech.
 */
export function kareKonusmasi(g: { rms: number; silero: SileroOlasilik; onceki: boolean; simdi: number }): { ses: boolean; kaynak: 'silero' | 'rms' } {
  const s = g.silero
  if (s && g.simdi - s.zaman <= FISH_SILERO_TAZELIK_MS) return { ses: sileroKonusuyorMu(s.p, g.onceki), kaynak: 'silero' }
  return { ses: konusuyorMu(g.rms), kaynak: 'rms' }
}

export function sessizlikKuyrugu(kaynak: 'silero' | 'rms'): number {
  return kaynak === 'silero' ? FISH_SES_SIZLIGI_SILERO_MS : FISH_SES_SIZLIGI_MS
}
