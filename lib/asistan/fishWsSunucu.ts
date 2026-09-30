/**
 * NOTYA-FISH-WS-01 — one Fish live socket per spoken turn (server side, Node runtime).
 * Text goes in as complete words as the LLM writes; PCM comes back the moment Fish has
 * it, so word N+1 is synthesised while N is still playing in the browser.
 */
import WebSocket from 'ws'
import { FISH_WS_ACILIS_MS, FISH_WS_BITIS_MS, FISH_WS_DUR, FISH_WS_URL, fishWsBaslangic, fishWsKodla, fishWsMetinOlayi, fishWsModel, fishWsOlayCoz } from '@/lib/asistan/fishWs'

export type FishWsDinleyici = {
  onSes: (pcm: Uint8Array) => void
  /** Socket died mid-turn (after open). The route falls back to REST for the rest of the text. */
  onHata: (neden: string) => void
}

export type FishWsOturumu = {
  /** NOTYA-FISH-HAVUZ-01: a pre-opened socket gets its turn's listeners here, before the first `metin`. */
  bagla: (d: FishWsDinleyici) => void
  /** Milliseconds since the socket opened — the pool drops sockets older than FISH_WS_HAVUZ_YAS_MS. */
  yas: () => number
  /** Queue one finished word-group. Returns false when the socket is gone. */
  metin: (cumle: string) => boolean
  /** No more text: ask Fish to finish; resolves when the last audio frame arrived (or timeout / error). */
  bitir: () => Promise<void>
  kapat: () => void
  acik: () => boolean
  /** Bytes of PCM relayed so far — for the latency log line. */
  bayt: () => number
}

export type FishWsGirdi = {
  anahtar: string
  /** Optional at open time: a pooled socket is opened before its turn exists and bound later with `bagla`. */
  onSes?: (pcm: Uint8Array) => void
  onHata?: (neden: string) => void
  url?: string
}

export function fishWsAc(g: FishWsGirdi): Promise<FishWsOturumu> {
  return new Promise<FishWsOturumu>((coz, reddet) => {
    let acik = false
    let kapali = false
    let bitisCoz: (() => void) | null = null
    let toplam = 0
    let ilkSesMs: number | null = null
    const t0 = Date.now()
    let acilisMs = 0
    const dinleyici: FishWsDinleyici = { onSes: g.onSes ?? (() => {}), onHata: g.onHata ?? (() => {}) }
    const ws = new WebSocket(g.url || FISH_WS_URL, {
      headers: { Authorization: `Bearer ${g.anahtar}`, model: fishWsModel() },
      perMessageDeflate: false,
      handshakeTimeout: FISH_WS_ACILIS_MS,
    })
    ws.binaryType = 'nodebuffer'
    const acilisZamani = setTimeout(() => { if (!acik) { kapat(); reddet(new Error('ws_acilis_zaman')) } }, FISH_WS_ACILIS_MS)

    function kapat(): void {
      if (kapali) return
      kapali = true
      clearTimeout(acilisZamani)
      try { ws.close() } catch { /* */ }
      try { ws.terminate() } catch { /* */ }
      bitisCoz?.()
      bitisCoz = null
    }
    function gonder(olay: Parameters<typeof fishWsKodla>[0]): boolean {
      if (kapali || ws.readyState !== WebSocket.OPEN) return false
      try { ws.send(fishWsKodla(olay), { binary: true }); return true } catch { return false }
    }

    ws.on('open', () => {
      acik = true
      acilisMs = Date.now()
      clearTimeout(acilisZamani)
      if (!gonder(fishWsBaslangic())) { reddet(new Error('ws_start')); kapat(); return }
      coz({
        bagla: (d) => { dinleyici.onSes = d.onSes; dinleyici.onHata = d.onHata },
        yas: () => Date.now() - acilisMs,
        metin: (cumle) => {
          const olay = fishWsMetinOlayi(cumle)
          if (!olay) return true
          return gonder(olay)
        },
        bitir: () => new Promise<void>((r) => {
          if (kapali) { r(); return }
          bitisCoz = r
          if (!gonder(FISH_WS_DUR)) { kapat(); return }
          setTimeout(() => { if (!kapali) { dinleyici.onHata('ws_bitis_zaman'); kapat() } }, FISH_WS_BITIS_MS)
        }),
        kapat,
        acik: () => acik && !kapali,
        bayt: () => toplam,
      })
    })
    ws.on('message', (veri) => {
      if (kapali) return
      const ham = Buffer.isBuffer(veri) ? new Uint8Array(veri.buffer, veri.byteOffset, veri.byteLength)
        : veri instanceof ArrayBuffer ? new Uint8Array(veri)
        : new Uint8Array(Buffer.concat(veri as Buffer[]))
      const olay = fishWsOlayCoz(ham)
      if (olay.tur === 'audio') {
        if (!olay.ses.byteLength) return
        if (ilkSesMs === null) ilkSesMs = Date.now() - t0
        toplam += olay.ses.byteLength
        dinleyici.onSes(olay.ses)
      } else if (olay.tur === 'finish') {
        if (olay.neden && olay.neden !== 'stop') dinleyici.onHata(`finish_${olay.neden}`)
        kapat()
      } else if (olay.tur === 'log') {
        console.info('[fish-ws]', { log: olay.mesaj.slice(0, 200) })
      }
    })
    ws.on('error', (e) => {
      const neden = e instanceof Error ? e.message.slice(0, 120) : 'hata'
      if (!acik) { clearTimeout(acilisZamani); kapat(); reddet(new Error(neden)); return }
      if (!kapali) dinleyici.onHata(neden)
      kapat()
    })
    ws.on('unexpected-response', (_req, res) => {
      clearTimeout(acilisZamani)
      kapat()
      reddet(new Error(`http_${res.statusCode}`))
    })
    ws.on('close', () => {
      if (!acik) { clearTimeout(acilisZamani); reddet(new Error('ws_kapandi')); return }
      console.info('[fish-ws]', { ilk_ses_ms: ilkSesMs, bayt: toplam, sure_ms: Date.now() - t0 })
      kapat()
    })
  })
}
