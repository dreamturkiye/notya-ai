/**
 * NOTYA-SILERO-01 — Silero VAD in the browser via @ricky0123/vad-web (onnxruntime-web, WASM,
 * AudioWorklet). Assets are served from /vad/ (copied by scripts/vad-varliklari.mjs at build).
 * We only consume per-frame speech probabilities; recording, pre-roll, barge-in and the junk
 * gate stay in fishMikrofon.ts. Anything failing here → `null` → the RMS gate keeps working.
 */
import type { SileroOlasilik } from '@/lib/asistan/fishVad'

export const SILERO_VARLIK_YOLU = '/vad/'
/** Model + worklet + first frame must arrive within this, or the turn starts on RMS. */
export const SILERO_ACILIS_MS = 4000
export const SILERO_ILK_KARE_MS = 1500

export type SileroKapi = {
  olasilik: () => SileroOlasilik
  kareSayisi: () => number
  kapat: () => Promise<void>
}

/** iPhone / iPad (incl. iPadOS "Macintosh" UA with touch). Unverified there → RMS unless NEXT_PUBLIC_NOTYA_SILERO_IOS=1. */
export function iosMu(ua: string, dokunma = 0): boolean {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && dokunma > 1)
}

export function sileroKullanilirMi(g: { ua: string; dokunma?: number; genel?: string; ios?: string }): boolean {
  const genel = String(g.genel ?? '').trim().toLowerCase()
  if (genel === '0' || genel === 'false' || genel === 'off') return false
  if (iosMu(g.ua, g.dokunma ?? 0)) return String(g.ios ?? '').trim() === '1'
  return true
}

function tarayicidaKullanilirMi(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (typeof WebAssembly === 'undefined') return false
  return sileroKullanilirMi({
    ua: navigator.userAgent,
    dokunma: navigator.maxTouchPoints || 0,
    genel: process.env.NEXT_PUBLIC_NOTYA_SILERO,
    ios: process.env.NEXT_PUBLIC_NOTYA_SILERO_IOS,
  })
}

/**
 * Attach Silero to an existing mic stream on the capture AudioContext. Resolves `null` on any
 * failure (no throw) so the caller simply keeps the RMS gate.
 */
export async function sileroAc(akis: MediaStream, baglam: AudioContext): Promise<SileroKapi | null> {
  if (!tarayicidaKullanilirMi()) return null
  const t0 = Date.now()
  let son: SileroOlasilik = null
  let kare = 0
  let ilkKare: (() => void) | null = null
  const ilkKareSozu = new Promise<void>((r) => { ilkKare = r })
  try {
    const mod = await Promise.race([
      import('@ricky0123/vad-web'),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('silero_yukleme_zaman')), SILERO_ACILIS_MS)),
    ])
    const vad = await mod.MicVAD.new({
      model: 'v5',
      baseAssetPath: SILERO_VARLIK_YOLU,
      onnxWASMBasePath: SILERO_VARLIK_YOLU,
      audioContext: baglam,
      getStream: async () => akis,
      // The mic stream belongs to the session; never stop its tracks from here.
      pauseStream: async () => undefined,
      resumeStream: async (s) => s,
      startOnLoad: true,
      processorType: 'auto',
      // We do not use vad-web's own segmenter; frames only.
      submitUserSpeechOnPause: false,
      onFrameProcessed: (olasilik) => {
        kare += 1
        son = { p: olasilik.isSpeech, zaman: Date.now() }
        if (ilkKare) { ilkKare(); ilkKare = null }
      },
      onSpeechStart: () => undefined,
      onSpeechRealStart: () => undefined,
      onSpeechEnd: () => undefined,
      onVADMisfire: () => undefined,
    })
    if (vad.errored) throw new Error(vad.errored)
    // Safari can create the worklet and never feed it — no frame within the window means RMS.
    await Promise.race([ilkKareSozu, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('silero_kare_yok')), SILERO_ILK_KARE_MS))])
    console.info('[fish-vad]', { silero: 'acik', yukleme_ms: Date.now() - t0 })
    return {
      olasilik: () => son,
      kareSayisi: () => kare,
      kapat: async () => { try { await vad.destroy() } catch { /* */ } },
    }
  } catch (e) {
    console.info('[fish-vad]', { silero: 'kapali', neden: e instanceof Error ? e.message : 'hata', ms: Date.now() - t0 })
    return null
  }
}
