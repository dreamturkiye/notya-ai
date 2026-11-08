/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — the signature between the founder console (Türkiye build, /kurucu) and each
 * country build's /api/internal/founder-stats. The SAME file on main and on every release branch.
 *
 * Why a signature and not keys: the six country databases' service-role keys never go into the Türkiye project. Each
 * country answers for itself, only to a request signed with the shared secret FOUNDER_STATS_SECRET.
 *
 *   header  x-notya-kurucu-imza: t=<unix ms>,n=<nonce hex>,s=<hex HMAC-SHA256>
 *   signed  "<t>.<n>.<ulke>"            (ulke = the country code the request is meant for, so a signature for one country
 *                                         cannot be replayed against another)
 *
 * Refused: no secret configured, a malformed header, a wrong signature (constant-time compare), a timestamp more than
 * 5 minutes old (or more than 1 minute in the future), and a nonce already seen inside that window (replay). The nonce
 * memory is per server instance, which is what the 5-minute window bounds; a replay across instances would still have
 * to land inside the same 5 minutes and only ever returns the same read-only doctor-account summary.
 *
 * Also here: a small per-instance rate limiter for the endpoint (no new service, no database round trip).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const IMZA_BASLIGI = 'x-notya-kurucu-imza'
export const IMZA_PENCERESI_MS = 5 * 60 * 1000
const GELECEK_TOLERANSI_MS = 60 * 1000

const imzaHesapla = (gizli: string, t: number, n: string, ulke: string): string =>
  createHmac('sha256', gizli).update(`${t}.${n}.${ulke}`).digest('hex')

/** The header value for one request to one country. */
export function imzaUret(gizli: string, ulke: string, simdi: number = Date.now(), nonce: string = randomBytes(16).toString('hex')): string {
  return `t=${simdi},n=${nonce},s=${imzaHesapla(gizli, simdi, nonce, ulke)}`
}

export type ImzaSonucu = { ok: true } | { ok: false; neden: 'gizli-yok' | 'bicim' | 'imza' | 'suresi-gecmis' | 'tekrar' }

const gorulenler = new Map<string, number>()

/** Test hook. */
export function imzaBellegiTemizle(): void {
  gorulenler.clear()
}

function bellegiBuda(simdi: number): void {
  for (const [n, bitis] of gorulenler) if (bitis <= simdi) gorulenler.delete(n)
}

export function imzaDogrula(gizli: string | undefined, baslik: string | null | undefined, ulke: string, simdi: number = Date.now()): ImzaSonucu {
  if (!gizli || gizli.length < 32) return { ok: false, neden: 'gizli-yok' }
  if (!baslik || baslik.length > 300) return { ok: false, neden: 'bicim' }
  const parca: Record<string, string> = {}
  for (const p of baslik.split(',')) {
    const i = p.indexOf('=')
    if (i > 0) parca[p.slice(0, i).trim()] = p.slice(i + 1).trim()
  }
  const t = Number(parca.t)
  const n = parca.n || ''
  const s = parca.s || ''
  if (!Number.isFinite(t) || !/^[0-9a-f]{16,64}$/.test(n) || !/^[0-9a-f]{64}$/.test(s)) return { ok: false, neden: 'bicim' }
  const beklenen = Buffer.from(imzaHesapla(gizli, t, n, ulke), 'hex')
  const gelen = Buffer.from(s, 'hex')
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return { ok: false, neden: 'imza' }
  if (simdi - t > IMZA_PENCERESI_MS || t - simdi > GELECEK_TOLERANSI_MS) return { ok: false, neden: 'suresi-gecmis' }
  bellegiBuda(simdi)
  if (gorulenler.has(n)) return { ok: false, neden: 'tekrar' }
  gorulenler.set(n, t + IMZA_PENCERESI_MS + GELECEK_TOLERANSI_MS)
  return { ok: true }
}

/** Per-instance fixed-window limiter: at most `azami` calls per `pencereMs` for one key. */
export function sinirlayici(azami: number, pencereMs: number) {
  const kayit = new Map<string, { bas: number; sayi: number }>()
  return {
    izinli(anahtar: string, simdi: number = Date.now()): boolean {
      const k = kayit.get(anahtar)
      if (!k || simdi - k.bas >= pencereMs) {
        if (kayit.size > 1000) kayit.clear()
        kayit.set(anahtar, { bas: simdi, sayi: 1 })
        return true
      }
      if (k.sayi >= azami) return false
      k.sayi += 1
      return true
    },
    temizle() { kayit.clear() },
  }
}
