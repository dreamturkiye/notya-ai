/**
 * NOTYA-FISH-AYSE-01 — playback we can cut the moment the doctor speaks.
 *
 * The server streams 24 kHz PCM. The first chunk is scheduled as soon as it
 * arrives, so the bubble and the voice are not a full clip apart. `kes` stops
 * every scheduled buffer in the same turn.
 */

import { FISH_ORNEK_HZ } from '@/lib/asistan/fishSes'

export type FishGetir = (metin: string, sinyal: AbortSignal) => Promise<ReadableStream<Uint8Array> | null>

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
  let kaynaklar: AudioBufferSourceNode[] = []
  let abort: AbortController | null = null
  let kapali = false

  async function baglam(): Promise<AudioContext> {
    if (!ctx || ctx.state === 'closed') {
      const Pencere = window as Window & { webkitAudioContext?: typeof AudioContext }
      const Kur = window.AudioContext || Pencere.webkitAudioContext
      if (!Kur) throw new Error('ses yok')
      ctx = new Kur()
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined)
    return ctx
  }

  function kaynakDurdur(): void {
    for (const s of kaynaklar) {
      try { s.onended = null; s.stop() } catch { /* already stopped */ }
      try { s.disconnect() } catch { /* already disconnected */ }
    }
    kaynaklar = []
  }

  function kes(): void {
    const vardi = calisiyor || kuyruk.length > 0 || kaynaklar.length > 0
    nesil += 1
    kuyruk = []
    abort?.abort()
    abort = null
    kaynakDurdur()
    calisiyor = false
    if (vardi && !kapali) olay?.onDurdu?.()
  }

  async function pcmOku(stream: ReadableStream<Uint8Array>, ses: AudioContext, ben: number): Promise<number> {
    const reader = stream.getReader()
    let artik = new Uint8Array(0)
    let zaman = ses.currentTime + 0.02
    let basladi = false
    const planla = (ornek: Int16Array) => {
      if (!ornek.length || ben !== nesil) return
      const buf = ses.createBuffer(1, ornek.length, FISH_ORNEK_HZ)
      const kanal = buf.getChannelData(0)
      for (let i = 0; i < ornek.length; i++) kanal[i] = ornek[i] / 32768
      const src = ses.createBufferSource()
      src.buffer = buf
      src.connect(ses.destination)
      const basla = Math.max(zaman, ses.currentTime + 0.01)
      src.start(basla)
      zaman = basla + buf.duration
      kaynaklar.push(src)
      if (!basladi) {
        basladi = true
        olay?.onBasladi?.()
      }
    }
    try {
      while (ben === nesil && !kapali) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value?.length) continue
        const birlesik = new Uint8Array(artik.length + value.length)
        birlesik.set(artik)
        birlesik.set(value, artik.length)
        const cift = birlesik.length - (birlesik.length % 2)
        artik = birlesik.subarray(cift)
        if (cift < 2) continue
        const gorunum = birlesik.subarray(0, cift)
        const ornek = new Int16Array(gorunum.buffer, gorunum.byteOffset, cift / 2)
        planla(ornek)
      }
    } finally {
      reader.cancel().catch(() => undefined)
    }
    return zaman
  }

  async function cal(ben: number, metin: string): Promise<void> {
    calisiyor = true
    const kontrol = new AbortController()
    abort = kontrol
    let akis: ReadableStream<Uint8Array> | null = null
    let iptal = false
    try {
      akis = await getir(metin, kontrol.signal)
    } catch (e) {
      iptal = e instanceof DOMException && e.name === 'AbortError'
      akis = null
    }
    if (ben !== nesil || kapali) {
      calisiyor = false
      return
    }
    if (!akis) {
      calisiyor = false
      if (!iptal) {
        kes()
        olay?.onHata?.()
      }
      return
    }
    try {
      const ses = await baglam()
      const bitis = await pcmOku(akis, ses, ben)
      if (ben !== nesil || kapali) {
        calisiyor = false
        return
      }
      const kalanMs = Math.max(0, (bitis - ses.currentTime) * 1000)
      await new Promise((r) => setTimeout(r, kalanMs))
      if (ben !== nesil || kapali) return
      calisiyor = false
      kaynaklar = []
      if (kuyruk.length) siradaki()
      else olay?.onDurdu?.()
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
