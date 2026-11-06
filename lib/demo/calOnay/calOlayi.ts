/**
 * NOTYA-DEMO-EPOSTA-01 — a Cal.com webhook delivery: signature check and the few fields our e-mail needs.
 *
 * Cal.com signs every delivery with HMAC-SHA256 over the raw request body, keyed with the webhook's secret, and sends
 * the hex digest in `X-Cal-Signature-256` (Cal.com source, packages/features/webhooks/lib/sendPayload.ts). A delivery
 * without that header, or with a digest that does not match, is rejected before anything is parsed.
 * Pure: no network, no environment.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { DemoOlayi } from './metinler'

export const IMZA_BASLIGI = 'x-cal-signature-256'

/** true only for a well-formed hex HMAC-SHA256 of `govde` under `sir`. Constant-time compare. */
export function calImzasiGecerli(govde: string, imza: string | null | undefined, sir: string | null | undefined): boolean {
  if (!sir || typeof imza !== 'string' || !/^[0-9a-f]{64}$/i.test(imza.trim())) return false
  const beklenen = createHmac('sha256', sir).update(govde).digest()
  const gelen = Buffer.from(imza.trim().toLowerCase(), 'hex')
  return gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen)
}

const TETIKLER: Record<string, DemoOlayi> = {
  BOOKING_CREATED: 'olustu',
  BOOKING_RESCHEDULED: 'yeniden',
  BOOKING_CANCELLED: 'iptal',
}

export type DemoKatilimci = { ad: string; eposta: string; saatDilimi: string | null }

export type DemoRezervasyonu = {
  olay: DemoOlayi
  tetik: string
  /** Cal.com event slug, e.g. "demo-tr". */
  etkinlik: string
  uid: string
  baslangic: Date
  bitis: Date
  katilimcilar: DemoKatilimci[]
  /** https link to the call, only from a known video host. */
  gorusmeLinki: string | null
  /** Organizer's address, used as Reply-To only when it is one of ours (@notya.io). */
  hekimEposta: string | null
  /** https://cal.com or https://app.cal.com — where the cancel and reschedule pages live. */
  calKoku: string
}

export type CozumSonucu =
  | { tur: 'rezervasyon'; r: DemoRezervasyonu }
  | { tur: 'ping' }
  | { tur: 'yoksay'; neden: string }
  | { tur: 'hata'; neden: string }

const EPOSTA = /^[^\s@<>()",;:]{1,64}@[^\s@<>()",;:]{1,190}\.[^\s@<>()",;:]{2,63}$/
const UID = /^[A-Za-z0-9_-]{6,128}$/
const SLUG = /^[a-z0-9-]{1,64}$/
const VIDEO_ALANLARI = [/^app\.cal\.com$/, /^cal\.com$/, /^meet\.google\.com$/, /^([a-z0-9-]+\.)?zoom\.us$/, /^teams\.microsoft\.com$/]

const metin = (v: unknown, sinir = 200): string => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, sinir) : '')

function saatDilimi(v: unknown): string | null {
  const s = metin(v, 64)
  if (!s) return null
  try {
    new Intl.DateTimeFormat('en', { timeZone: s })
    return s
  } catch {
    return null
  }
}

function videoLinki(...adaylar: unknown[]): string | null {
  for (const a of adaylar) {
    const s = metin(a, 500)
    if (!s) continue
    try {
      const u = new URL(s)
      if (u.protocol === 'https:' && !u.username && !u.password && VIDEO_ALANLARI.some((k) => k.test(u.hostname))) return u.toString()
    } catch {
      /* not a URL */
    }
  }
  return null
}

function calKoku(v: unknown): string {
  const s = metin(v, 100)
  try {
    const u = new URL(s)
    if (u.protocol === 'https:' && (u.hostname === 'cal.com' || u.hostname === 'app.cal.com')) return u.origin
  } catch {
    /* default below */
  }
  return 'https://app.cal.com'
}

/** Reads a verified delivery body. Never throws. */
export function calOlayiCoz(govde: string): CozumSonucu {
  let j: unknown
  try {
    j = JSON.parse(govde)
  } catch {
    return { tur: 'hata', neden: 'json' }
  }
  if (!j || typeof j !== 'object') return { tur: 'hata', neden: 'json' }
  const kok = j as Record<string, unknown>
  const tetik = metin(kok.triggerEvent, 64)
  if (tetik === 'PING') return { tur: 'ping' }
  const olay = TETIKLER[tetik]
  if (!olay) return { tur: 'yoksay', neden: `tetik:${tetik || '?'}` }
  const p = (kok.payload && typeof kok.payload === 'object' ? kok.payload : {}) as Record<string, unknown>
  const etkinlik = metin(p.type, 64)
  if (!SLUG.test(etkinlik)) return { tur: 'hata', neden: 'etkinlik' }
  const uid = metin(p.uid, 128)
  if (!UID.test(uid)) return { tur: 'hata', neden: 'uid' }
  const baslangic = new Date(metin(p.startTime, 40))
  const bitis = new Date(metin(p.endTime, 40))
  if (Number.isNaN(baslangic.getTime()) || Number.isNaN(bitis.getTime()) || bitis <= baslangic) return { tur: 'hata', neden: 'zaman' }
  const ham = Array.isArray(p.attendees) ? p.attendees.slice(0, 5) : []
  const katilimcilar: DemoKatilimci[] = []
  for (const a of ham) {
    if (!a || typeof a !== 'object') continue
    const k = a as Record<string, unknown>
    const eposta = metin(k.email, 254).toLowerCase()
    if (!EPOSTA.test(eposta) || katilimcilar.some((x) => x.eposta === eposta)) continue
    katilimcilar.push({ ad: metin(k.name, 80), eposta, saatDilimi: saatDilimi(k.timeZone) })
  }
  if (!katilimcilar.length) return { tur: 'hata', neden: 'katilimci' }
  const org = (p.organizer && typeof p.organizer === 'object' ? p.organizer : {}) as Record<string, unknown>
  const orgEposta = metin(org.email, 254).toLowerCase()
  const meta = (p.metadata && typeof p.metadata === 'object' ? p.metadata : {}) as Record<string, unknown>
  const video = (p.videoCallData && typeof p.videoCallData === 'object' ? p.videoCallData : {}) as Record<string, unknown>
  return {
    tur: 'rezervasyon',
    r: {
      olay,
      tetik,
      etkinlik,
      uid,
      baslangic,
      bitis,
      katilimcilar,
      gorusmeLinki: videoLinki(video.url, meta.videoCallUrl, p.location),
      hekimEposta: EPOSTA.test(orgEposta) && orgEposta.endsWith('@notya.io') ? orgEposta : null,
      calKoku: calKoku(p.bookerUrl),
    },
  }
}
