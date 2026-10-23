/**
 * AU-CANLI-04 — let the assistant's voice out in Safari/iOS. The ElevenLabs client plays the agent through a
 * MediaStream <audio autoplay> element created AFTER the microphone prompt and the opening request, i.e. outside the
 * click. Safari then keeps it silent while the text still arrives (Kaan, 2026-10-23: "no voice, just the text").
 * Türkiye does the same unlock inside the tap (components/asistan/AsistanOturumContext.tsx sesiDokunustaAc); this is
 * the country's copy so the shared Türkiye code is not touched. MUST be called synchronously in the click, before any await.
 */
const SESSIZ_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

export function sesiDokunustaAc(): void {
  if (typeof window === 'undefined') return
  try {
    const audio = new Audio(SESSIZ_WAV)
    audio.setAttribute('playsinline', 'true')
    ;(audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
    void audio.play().catch(() => undefined)
  } catch { /* the call still connects */ }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const kaynak = ctx.createBufferSource()
    kaynak.buffer = ctx.createBuffer(1, 1, 22050)
    kaynak.connect(ctx.destination)
    kaynak.start(0)
    void ctx.resume().catch(() => undefined)
    // The unlock belongs to the page; this context is not needed afterwards.
    setTimeout(() => { void ctx.close().catch(() => undefined) }, 3000)
  } catch { /* quiet */ }
}

/** A line with no letter or digit (".", "…", "-") is never shown as a bubble. */
export const okunurMu = (metin: string): boolean => /[\p{L}\p{N}]/u.test(String(metin ?? ''))
