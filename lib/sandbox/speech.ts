export type SpeechCallbacks = {
  onResult: (text: string) => void
  onError?: (message: string) => void
  onListeningChange?: (listening: boolean) => void
}

export type SpeechController = {
  stop: () => void
  isListening: () => boolean
}

/** Request mic permission first — required on many Android browsers before STT. */
export async function ensureMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    })
    stream.getTracks().forEach((t) => t.stop())
    return true
  } catch {
    return false
  }
}

export function createSpeechRecognizer(callbacks: SpeechCallbacks): SpeechController | null {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null

  let rec: SpeechRecognition | null = null
  let listening = false
  let shouldRestart = false

  const stop = () => {
    shouldRestart = false
    listening = false
    callbacks.onListeningChange?.(false)
    try {
      rec?.stop()
    } catch {
      /* ignore */
    }
    rec = null
  }

  const startOnce = () => {
    if (listening) return
    rec = new SR()
    rec.lang = 'tr-TR'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 1

    rec.onstart = () => {
      listening = true
      callbacks.onListeningChange?.(true)
    }

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0]?.[0]?.transcript?.trim()
      if (text) callbacks.onResult(text)
    }

    rec.onerror = (ev: Event & { error?: string }) => {
      const code = (ev as { error?: string }).error
      if (code === 'not-allowed') {
        callbacks.onError?.('Mikrofon izni gerekli. Ayarlar → Chrome → Mikrofon.')
      } else if (code === 'no-speech') {
        if (shouldRestart) setTimeout(startOnce, 300)
      } else if (code !== 'aborted') {
        callbacks.onError?.(`Ses tanıma hatası: ${code || 'bilinmiyor'}`)
      }
      listening = false
      callbacks.onListeningChange?.(false)
    }

    rec.onend = () => {
      listening = false
      callbacks.onListeningChange?.(false)
      if (shouldRestart) setTimeout(startOnce, 400)
    }

    try {
      rec.start()
    } catch {
      callbacks.onError?.('Ses tanıma başlatılamadı')
    }
  }

  return {
    stop,
    isListening: () => listening,
    start: () => {
      shouldRestart = true
      startOnce()
    },
  } as SpeechController & { start: () => void }
}
