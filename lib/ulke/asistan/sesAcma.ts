/**
 * AU-CANLI-04 — let the assistant's voice out in Safari/iOS. The ElevenLabs client plays the agent through a
 * MediaStream <audio autoplay> element created AFTER the microphone prompt and the opening request, i.e. outside the
 * click. Safari then keeps it silent while the text still arrives (Kaan, 2026-10-23: "no voice, just the text").
 * Türkiye does the same unlock inside the tap (components/asistan/AsistanOturumContext.tsx sesiDokunustaAc); this is
 * the country's copy so the shared Türkiye code is not touched. MUST be called synchronously in the click, before any await.
 *
 * SES-ILK-SOZ-01 (Kaan GO 2026-11-24 12:15 EST): the unlock AudioContext is RETURNED and kept for the whole call, and closed
 * only when the call ends (sesBaglaminiKapat). It used to be closed on a 3 s timer, which on a normal connect fired while
 * the agent's greeting was playing: the page's audio set-up changed mid-greeting and the start of the voice sounded quiet
 * and far away (AU Paediatrics / Dietitian test). Türkiye keeps its unlock context open for the call in the same way.
 */
const SESSIZ_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

export function sesiDokunustaAc(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const audio = new Audio(SESSIZ_WAV)
    audio.setAttribute('playsinline', 'true')
    ;(audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
    void audio.play().catch(() => undefined)
  } catch { /* the call still connects */ }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    const ctx = new AC()
    const kaynak = ctx.createBufferSource()
    kaynak.buffer = ctx.createBuffer(1, 1, 22050)
    kaynak.connect(ctx.destination)
    kaynak.start(0)
    void ctx.resume().catch(() => undefined)
    // Kept until the call ends (SES-ILK-SOZ-01): closing it mid-greeting changed the page's audio set-up while she spoke.
    return ctx
  } catch {
    return null
  }
}

/** Close the unlock context of a call that has ended. Quiet; safe to call twice or with null. */
export function sesBaglaminiKapat(ctx: AudioContext | null | undefined): void {
  if (!ctx || ctx.state === 'closed') return
  try { void ctx.close().catch(() => undefined) } catch { /* quiet */ }
}

/** A line with no letter or digit (".", "…", "-") is never shown as a bubble. */
export const okunurMu = (metin: string): boolean => /[\p{L}\p{N}]/u.test(String(metin ?? ''))
