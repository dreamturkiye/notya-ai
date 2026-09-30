/**
 * NOTYA-FISH-AYSE-01 — playback we can cut the moment the doctor speaks.
 *
 * The server streams 24 kHz PCM (Fish `format: "pcm"`, `sample_rate: 24000`, 16-bit LE mono).
 * Playback starts once a small jitter buffer (FISH_TAMPON_MS, 40 ms) is in hand — not on the first
 * byte and not after a full sentence — and chunks are scheduled back to back so sentences
 * run into each other without a gap. `kes` stops every scheduled buffer in the same turn.
 * NOTYA-FISH-WS-01: `akisAc` is a push source for PCM relayed over the turn SSE (one Fish
 * socket per turn on the server) — it goes through the same queue, barge-in and callbacks.
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

/** Audio in hand before the first source starts (≈ first 1–2 Fish PCM chunks). */
export const FISH_TAMPON_MS = 40
/** After an underrun, wait for this much before resuming so one late chunk does not stutter. */
export const FISH_TAMPON_YENIDEN_MS = 80
/** Scheduling lead: a source must start at least this far ahead of the clock. */
export const FISH_PLAN_ONCE_SN = 0.01
/** NOTYA-SES-TUR-01: samples quieter than this (≈ −38 dBFS) are Fish's trailing padding, not her voice. */
export const FISH_SES_SONU_ESIK = 0.012
/** Playback counts as over this long after her last voiced sample; the echo guard lifts there, not when the padding drains. */
export const FISH_SES_SONU_PAYI_SN = 0.12

/** Index of the last sample above `esik`, −1 when the whole buffer is silence. */
export function sonSesliOrnek(kanal: ArrayLike<number>, esik = FISH_SES_SONU_ESIK): number {
  for (let i = kanal.length - 1; i >= 0; i--) {
    const v = kanal[i]
    if (v > esik || v < -esik) return i
  }
  return -1
}

/** When `caliyorMu` must drop: her voice end (+ pad) or the buffer end, whichever is earlier. */
export function calmaSonu(bitis: number, sesSonu: number): number {
  return sesSonu >= 0 ? Math.min(bitis, sesSonu + FISH_SES_SONU_PAYI_SN) : bitis
}

/**
 * Jitter-buffer decision for one arriving chunk. Pure so it can be tested against a fake clock.
 * `planSonu` is where the last scheduled source ends (AudioContext seconds), `simdi` the clock.
 */
export function tamponKarari(g: { bekleyenMs: number; basladi: boolean; planSonu: number; simdi: number; bitti: boolean }): boolean {
  if (g.bitti) return g.bekleyenMs > 0
  if (!g.basladi) return g.bekleyenMs >= FISH_TAMPON_MS
  // Still ahead of the clock: append immediately, back to back.
  if (g.planSonu > g.simdi + FISH_PLAN_ONCE_SN) return true
  // Underrun: re-buffer a little before resuming.
  return g.bekleyenMs >= FISH_TAMPON_YENIDEN_MS
}

/** `kesildiMi` is true once barge-in / `kes` dropped this stream — later chunks are discarded. */
export type FishAkisYazici = { yaz: (pcm: Uint8Array) => void; bitir: () => void; kesildiMi: () => boolean }

export type FishCalar = {
  hazirla: () => Promise<void>
  soyle: (metin: string) => void
  /** Push source: PCM chunks arrive from the turn SSE; `bitir` closes it. Queued like a sentence. */
  akisAc: () => FishAkisYazici
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

  async function pcmOku(stream: ReadableStream<Uint8Array>, ses: AudioContext, ben: number): Promise<{ bitis: number; sesSonu: number }> {
    const reader = stream.getReader()
    let artik = new Uint8Array(0)
    let zaman = 0
    let sesSonu = -1
    let basladi = false
    let bekleyen: Int16Array[] = []
    let bekleyenOrnek = 0
    const bosalt = () => {
      if (!bekleyenOrnek || ben !== nesil) { bekleyen = []; bekleyenOrnek = 0; return }
      const buf = ses.createBuffer(1, bekleyenOrnek, FISH_ORNEK_HZ)
      const kanal = buf.getChannelData(0)
      let i = 0
      for (const p of bekleyen) { for (let k = 0; k < p.length; k++) kanal[i++] = p[k] / 32768 }
      bekleyen = []
      bekleyenOrnek = 0
      const src = ses.createBufferSource()
      src.buffer = buf
      src.connect(ses.destination)
      const basla = Math.max(zaman, ses.currentTime + FISH_PLAN_ONCE_SN)
      src.start(basla)
      const son = sonSesliOrnek(kanal)
      if (son >= 0) sesSonu = basla + (son + 1) / FISH_ORNEK_HZ
      zaman = basla + buf.duration
      kaynaklar.push(src)
      if (!basladi) {
        basladi = true
        olay?.onBasladi?.()
      }
    }
    const karar = (bitti: boolean) => tamponKarari({
      bekleyenMs: (bekleyenOrnek / FISH_ORNEK_HZ) * 1000, basladi, planSonu: zaman, simdi: ses.currentTime, bitti,
    })
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
        const gorunum = birlesik.slice(0, cift)
        const ornek = new Int16Array(gorunum.buffer, gorunum.byteOffset, cift / 2)
        bekleyen.push(ornek)
        bekleyenOrnek += ornek.length
        if (karar(false)) bosalt()
      }
      if (ben === nesil && !kapali && karar(true)) bosalt()
    } finally {
      reader.cancel().catch(() => undefined)
    }
    return { bitis: zaman, sesSonu }
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
      const { bitis, sesSonu } = await pcmOku(akis, ses, ben)
      if (ben !== nesil || kapali) return
      // Anchored to the audio clock: the guard lifts when her voice ends, not when the trailing padding drains.
      const kalanMs = Math.max(0, (calmaSonu(bitis, sesSonu) - ses.currentTime) * 1000)
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
    akisAc() {
      const kontrol = new AbortController()
      let denetim: ReadableStreamDefaultController<Uint8Array> | null = null
      let bitti = false
      let kesildi = false
      const akis = new ReadableStream<Uint8Array>({
        start(c) { denetim = c },
        cancel() { bitti = true; denetim = null },
      })
      const kapatAkis = () => {
        if (bitti) return
        bitti = true
        try { denetim?.close() } catch { /* already closed */ }
        denetim = null
      }
      kontrol.signal.addEventListener('abort', () => { kesildi = true; kapatAkis() })
      if (kapali) { kesildi = true; kapatAkis() }
      else {
        sira.push({ kontrol, iptal: false, hata: false, akis: Promise.resolve(akis) })
        void oynat()
      }
      return {
        yaz: (pcm) => {
          if (bitti || !pcm?.byteLength) return
          try { denetim?.enqueue(pcm) } catch { bitti = true }
        },
        bitir: kapatAkis,
        kesildiMi: () => kesildi,
      }
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
