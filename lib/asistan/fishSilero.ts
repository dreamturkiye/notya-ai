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

/** iPhone / iPad (incl. iPadOS "Macintosh" UA with touch). Needs NEXT_PUBLIC_NOTYA_SILERO=1 *and* NEXT_PUBLIC_NOTYA_SILERO_IOS=1. */
export function iosMu(ua: string, dokunma = 0): boolean {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && dokunma > 1)
}

/**
 * Opt-in (2026-09-29): default OFF everywhere — the RMS gate with its 300 ms tail is the preview
 * path. `NEXT_PUBLIC_NOTYA_SILERO=1` enables Silero on desktop; iOS additionally needs
 * `NEXT_PUBLIC_NOTYA_SILERO_IOS=1`. A Safari session dropped two doctor turns after Silero attached.
 */
export function sileroKullanilirMi(g: { ua: string; dokunma?: number; genel?: string; ios?: string }): boolean {
  const genel = String(g.genel ?? '').trim().toLowerCase()
  if (!(genel === '1' || genel === 'true' || genel === 'on')) return false
  if (iosMu(g.ua, g.dokunma ?? 0)) return String(g.ios ?? '').trim() === '1'
  return true
}

function tarayicidaKullanilirMi(zorla = false): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (typeof WebAssembly === 'undefined') return false
  if (zorla) return true
  return sileroKullanilirMi({
    ua: navigator.userAgent,
    dokunma: navigator.maxTouchPoints || 0,
    genel: process.env.NEXT_PUBLIC_NOTYA_SILERO,
    ios: process.env.NEXT_PUBLIC_NOTYA_SILERO_IOS,
  })
}

export type SileroSecenek = {
  /**
   * NOTYA-AYSE-GURULTU-01: the ElevenLabs speech gate loads Silero regardless of the Fish opt-in flags
   * (NEXT_PUBLIC_NOTYA_SILERO*), which govern Fish turn-ending only. The gate has its own kill switch.
   */
  zorla?: boolean
  /**
   * Called on every processed frame with the speech probability (drives the gate state machine) and the frame's
   * 16 kHz audio (NOTYA-SES-PROFILI-01 scores the doctor's voice from it; copy it before keeping it).
   */
  onKare?: (p: number, zaman: number, kare: Float32Array) => void
  /** Console tag. */
  etiket?: string
}

/**
 * Attach Silero to an existing mic stream on the capture AudioContext. Resolves `null` on any
 * failure (no throw) so the caller simply keeps the RMS gate.
 */
export async function sileroAc(akis: MediaStream, baglam: AudioContext, secenek: SileroSecenek = {}): Promise<SileroKapi | null> {
  const etiket = secenek.etiket || '[fish-vad]'
  if (!tarayicidaKullanilirMi(Boolean(secenek.zorla))) {
    console.info(etiket, { motor: 'rms', silero: 'kapali', neden: 'ayar' })
    return null
  }
  const t0 = Date.now()
  let son: SileroOlasilik = null
  let kare = 0
  let ilkKare: (() => void) | null = null
  const ilkKareSozu = new Promise<void>((r) => { ilkKare = r })
  /** Destroyed on any failure after creation — a half-attached MicVAD would keep its source node and inference alive. */
  let vad: { destroy: () => Promise<void> | void; errored: string | null | false } | null = null
  try {
    const mod = await Promise.race([
      import('@ricky0123/vad-web'),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('silero_yukleme_zaman')), SILERO_ACILIS_MS)),
    ])
    vad = await mod.MicVAD.new({
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
      onFrameProcessed: (olasilik, ses) => {
        kare += 1
        son = { p: olasilik.isSpeech, zaman: Date.now() }
        if (ilkKare) { ilkKare(); ilkKare = null }
        if (secenek.onKare) { try { secenek.onKare(son.p, son.zaman, ses) } catch { /* the listener fails open on its own */ } }
      },
      onSpeechStart: () => undefined,
      onSpeechRealStart: () => undefined,
      onSpeechEnd: () => undefined,
      onVADMisfire: () => undefined,
    })
    const kapi = vad as NonNullable<typeof vad>
    if (kapi.errored) throw new Error(kapi.errored)
    // Safari can create the worklet and never feed it — no frame within the window means RMS.
    await Promise.race([ilkKareSozu, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('silero_kare_yok')), SILERO_ILK_KARE_MS))])
    const islemci = (kapi as unknown as { _audioProcessorAdapterType?: string })._audioProcessorAdapterType ?? null
    console.info(etiket, { motor: 'silero', silero: 'acik', islemci, hz: baglam.sampleRate, yukleme_ms: Date.now() - t0 })
    return {
      olasilik: () => son,
      kareSayisi: () => kare,
      kapat: async () => { try { await kapi.destroy() } catch { /* */ } },
    }
  } catch (e) {
    if (vad) { try { await vad.destroy() } catch { /* */ } }
    console.info(etiket, { motor: 'rms', silero: 'kapali', neden: e instanceof Error ? e.message : 'hata', ms: Date.now() - t0 })
    return null
  }
}
