/**
 * NOTYA-FISH-AYSE-01 — playback we can cut the moment the doctor speaks.
 *
 * The server streams 24 kHz PCM. The first chunk is scheduled as soon as it
 * arrives, so the bubble and the voice are not a full clip apart. `kes` stops
 * every scheduled buffer in the same turn.
 */

import { FISH_ORNEK_HZ } from '@/lib/asistan/fishSes'

/** Join a streaming text part onto the transcript so far. Deltas may be a chunk or the full text. */
export function fishBirlestir(buf: string, parca: string): string {
  if (!parca) return buf
  if (!buf) return parca
  if (parca.startsWith(buf)) return parca
  if (buf.endsWith(parca)) return buf
  return buf + parca
}

function cumleSonu(s: string, from: number): number {
  for (let i = from; i < s.length; i++) {
    const ch = s[i]
    if (ch !== '.' && ch !== '!' && ch !== '?' && ch !== '…') continue
    let j = i + 1
    while (j < s.length && (s[j] === '.' || s[j] === '…')) j++
    if (j < s.length && (s[j] === '"' || s[j] === '”' || s[j] === "'")) j++
    if (j >= s.length || /\s/.test(s[j])) return j < s.length ? j + 1 : j
  }
  return -1
}

/**
 * Text already handed to the player (`islenen`) versus the transcript now.
 * Finished sentences leave while the model is still writing. The final full
 * text, if nothing was spoken yet, stays one clip so a late dump is not chopped.
 */
export function fishYeniCumleler(islenen: string, tam: string, bitir: boolean): { soyle: string[]; islenen: string } {
  const hedef = String(tam || '')
  if (!hedef.trim()) return { soyle: [], islenen }
  if (islenen && !hedef.startsWith(islenen)) {
    const kirpik = islenen.trimEnd()
    if (kirpik && (hedef.startsWith(kirpik) || hedef.startsWith(`${kirpik} `))) {
      islenen = hedef.startsWith(islenen) ? islenen : (hedef.startsWith(`${kirpik} `) ? `${kirpik} ` : kirpik)
    } else if (!bitir) return { soyle: [], islenen }
    else return { soyle: [hedef.trim()], islenen: hedef }
  }
  if (!islenen && bitir) {
    const t = hedef.trim()
    return { soyle: t ? [t] : [], islenen: hedef }
  }
  const kalan = hedef.slice(islenen.length)
  const soyle: string[] = []
  let pos = 0
  for (;;) {
    const son = cumleSonu(kalan, pos)
    if (son < 0) break
    const parca = kalan.slice(pos, son).trim()
    if (parca) soyle.push(parca)
    pos = son
  }
  if (bitir) {
    const kuyruk = kalan.slice(pos).trim()
    if (kuyruk) soyle.push(kuyruk)
    pos = kalan.length
  }
  return { soyle, islenen: islenen + kalan.slice(0, pos) }
}

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
  let sira: { kontrol: AbortController; akis: Promise<ReadableStream<Uint8Array> | null>; iptal: boolean; hata: boolean }[] = []
  let calisiyor = false
  let ctx: AudioContext | null = hazirBaglam ?? null
  let kaynaklar: AudioBufferSourceNode[] = []
  let aktifKontrol: AbortController | null = null
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
    const vardi = calisiyor || sira.length > 0 || kaynaklar.length > 0
    nesil += 1
    for (const is of sira) { is.iptal = true; is.kontrol.abort() }
    sira = []
    aktifKontrol?.abort()
    aktifKontrol = null
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

  async function oynat(): Promise<void> {
    if (kapali || calisiyor) return
    const is = sira.shift()
    if (!is) return
    const ben = nesil
    calisiyor = true
    aktifKontrol = is.kontrol
    const akis = await is.akis
    if (ben !== nesil || kapali) return
    if (!akis) {
      calisiyor = false
      aktifKontrol = null
      if (!is.iptal && is.hata) {
        kes()
        olay?.onHata?.()
      } else void oynat()
      return
    }
    try {
      const ses = await baglam()
      if (ben !== nesil || kapali) return
      const bitis = await pcmOku(akis, ses, ben)
      if (ben !== nesil || kapali) return
      const kalanMs = Math.max(0, (bitis - ses.currentTime) * 1000)
      await new Promise((r) => setTimeout(r, kalanMs))
      if (ben !== nesil || kapali) return
      calisiyor = false
      aktifKontrol = null
      kaynaklar = []
      if (sira.length) void oynat()
      else olay?.onDurdu?.()
    } catch {
      if (ben !== nesil || kapali) return
      kes()
      olay?.onHata?.()
    }
  }

  return {
    hazirla: async () => { await baglam() },
    soyle(metin: string) {
      const t = String(metin || '').trim()
      if (kapali || !t) return
      const kontrol = new AbortController()
      const is = { kontrol, iptal: false, hata: false, akis: Promise.resolve(null as ReadableStream<Uint8Array> | null) }
      is.akis = getir(t, kontrol.signal).then((s) => {
        if (!s && !is.iptal) is.hata = true
        return s
      }).catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') is.iptal = true
        else is.hata = true
        return null
      })
      sira.push(is)
      void oynat()
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
