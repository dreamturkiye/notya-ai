/** Android/iOS-safe audio playback — unlock session inside tap handler, reuse element. */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

let sharedAudio: HTMLAudioElement | null = null
let unlocked = false

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/** Call synchronously inside a user tap/click handler before any await. */
export async function unlockAudioSession(): Promise<void> {
  if (typeof window === 'undefined') return
  const audio = sharedAudio || new Audio(SILENT_WAV)
  audio.playsInline = true
  ;(audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
  audio.muted = false
  audio.setAttribute('playsinline', 'true')
  audio.setAttribute('webkit-playsinline', 'true')
  sharedAudio = audio
  try {
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    unlocked = true
  } catch {
    unlocked = false
  }

  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (Ctx) {
    const ctx = new Ctx()
    if (ctx.state === 'suspended') await ctx.resume()
    await ctx.close()
  }
}

export async function playBase64Mp3(b64: string | null): Promise<void> {
  if (!b64 || typeof window === 'undefined') return

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)

  const audio = sharedAudio || new Audio()
  audio.playsInline = true
  audio.setAttribute('playsinline', 'true')
  audio.setAttribute('webkit-playsinline', 'true')
  sharedAudio = audio

  return new Promise((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.src = url
    audio.play().catch(() => resolve())
  })
}

export function isAudioUnlocked(): boolean {
  return unlocked
}
