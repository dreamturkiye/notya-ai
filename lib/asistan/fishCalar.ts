/**
 * NOTYA-FISH-AYSE-01 — playback we can cut the moment the doctor speaks.
 *
 * ElevenLabs still owns the microphone, turn-taking and the interruption
 * event. This player only speaks. `kes` stops the current buffer in the same
 * turn (well under the 300 ms barge-in budget) and drops anything still queued.
 */

export type FishGetir = (metin: string, sinyal: AbortSignal) => Promise<ArrayBuffer | null>

export type FishCalar = {
  hazirla: () => Promise<void>
  soyle: (metin: string) => void
  kes: () => void
  caliyorMu: () => boolean
  kapat: () => void
}

export function fishCalarOlustur(
  getir: FishGetir,
  olay?: { onHata?: () => void; onBasladi?: () => void; onDurdu?: () => void },
  hazirBaglam?: AudioContext | null,
): FishCalar {
  let nesil = 0
  let kuyruk: string[] = []
  let calisiyor = false
  let ctx: AudioContext | null = hazirBaglam ?? null
  let kaynak: AudioBufferSourceNode | null = null
  let abort: AbortController | null = null
  let kapali = false

  async function baglam(): Promise<AudioContext> {
    if (!ctx || ctx.state === 'closed') {
      const Pencere = window as Window & { webkitAudioContext?: typeof AudioContext }
      const Kur = window.AudioContext || Pencere.webkitAudioContext
      ctx = new Kur()
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined)
    return ctx
  }

  function kaynakDurdur(): void {
    if (!kaynak) return
    try { kaynak.onended = null; kaynak.stop() } catch { /* already stopped */ }
    kaynak.disconnect()
    kaynak = null
  }

  function kes(): void {
    const vardi = calisiyor || kuyruk.length > 0 || kaynak !== null
    nesil += 1
    kuyruk = []
    abort?.abort()
    abort = null
    kaynakDurdur()
    calisiyor = false
    if (vardi && !kapali) olay?.onDurdu?.()
  }

  async function cal(ben: number, metin: string): Promise<void> {
    calisiyor = true
    olay?.onBasladi?.()
    const kontrol = new AbortController()
    abort = kontrol
    let buf: ArrayBuffer | null = null
    let iptal = false
    try {
      buf = await getir(metin, kontrol.signal)
    } catch (e) {
      iptal = e instanceof DOMException && e.name === 'AbortError'
      buf = null
    }
    if (ben !== nesil || kapali) {
      calisiyor = false
      return
    }
    if (!buf) {
      calisiyor = false
      if (!iptal) {
        kes()
        olay?.onHata?.()
      }
      return
    }
    try {
      const ses = await baglam()
      const cozum = await ses.decodeAudioData(buf.slice(0))
      if (ben !== nesil || kapali) {
        calisiyor = false
        return
      }
      const src = ses.createBufferSource()
      src.buffer = cozum
      src.connect(ses.destination)
      kaynak = src
      src.onended = () => {
        if (kaynak !== src) return
        kaynak = null
        if (ben !== nesil || kapali) return
        calisiyor = false
        if (kuyruk.length) siradaki()
        else olay?.onDurdu?.()
      }
      src.start()
    } catch {
      if (ben !== nesil || kapali) return
      kes()
      olay?.onHata?.()
    }
  }

  function siradaki(): void {
    if (kapali || calisiyor) return
    const metin = kuyruk.shift()
    if (!metin) return
    void cal(nesil, metin)
  }

  return {
    hazirla: async () => { await baglam() },
    soyle(metin: string) {
      const t = String(metin || '').trim()
      if (kapali || !t) return
      kuyruk.push(t)
      siradaki()
    },
    kes,
    caliyorMu: () => calisiyor,
    kapat() {
      kapali = true
      kes()
      const kapanan = ctx
      ctx = null
      if (kapanan && kapanan.state !== 'closed') void kapanan.close().catch(() => undefined)
    },
  }
}
