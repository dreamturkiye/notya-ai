/** Energy + silence for one spoken turn. No ElevenLabs VAD. */

export const FISH_KONUSMA_ESIK = 0.02
/** Speaker leak of Haberci is quieter than the doctor at the mic. Barge-in must not fire on her own playback. */
export const FISH_BARGE_ESIK = 0.12
export const FISH_BARGE_MS = 350
export const FISH_SES_SIZLIGI_MS = 800
export const FISH_MIN_KONUSMA_MS = 500
export const FISH_AZAMI_TUR_MS = 16_000

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
