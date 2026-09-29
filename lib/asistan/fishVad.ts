/** Energy + silence for one spoken turn. No ElevenLabs VAD. */

export const FISH_KONUSMA_ESIK = 0.02
/** Speaker leak of Haberci is quieter than the doctor at the mic. Barge-in must not fire on her own playback. */
export const FISH_BARGE_ESIK = 0.12
export const FISH_BARGE_MS = 350
export const FISH_SES_SIZLIGI_MS = 800
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
