/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — the server half of the public-site visit counter. The SAME file on main and
 * on every release branch; POST /api/internal/visit (app/api/internal/visit/route.ts, and route.ulke.ts in a country
 * build) is a thin wrapper around `ziyaretIsle`.
 *
 * What one page view does, in order (anything that fails a step is dropped silently with the same 204):
 *   1. bots out: no user agent, or one that is not a browser (bot / crawler / spider / preview / headless / lighthouse /
 *      Vercel screenshot …) — `botMu`;
 *   2. the body is { p: path, r: referrer host } and at most 1 KB; the path must be one of the PUBLIC pages
 *      (SAYILAN_SAYFALAR), so nothing else can be written into the table;
 *   3. visitor key = SHA-256(daily salt + IP + user agent + host). The salt is random per UTC day and lives only in the
 *      database (site_visit_salts); this instance keeps today's in memory, so a page view costs ONE database round trip
 *      (the salt is fetched once per instance per day). The raw IP and the user-agent string go into the hash and
 *      nowhere else — they are never stored, logged or sent;
 *   4. at most 30 page views per visitor key per 10 minutes, per instance (a reload loop cannot inflate the numbers);
 *   5. one call to site_visit_record (migration 194): unique for the day + aggregate upsert.
 * Stored: day, path, referrer HOST, device class (mobile/desktop), counts. No cookie is set or read.
 */
import { createHash } from 'node:crypto'
import { sinirlayici } from '@/lib/kurucu/imza'

/** The public marketing pages that are counted: Türkiye's and the country builds' (route paths, without a base path). */
export const SAYILAN_SAYFALAR: readonly string[] = [
  // Türkiye (main)
  '/doktor', '/notya-klinik', '/home', '/avukat', '/mali', '/kayit', '/giris', '/giris/doktor', '/giris/notya-klinik', '/giris/avukat', '/giris/mali', '/demo',
  // country builds
  '/', '/for-clinics', '/login', '/signup', '/founding', '/dietitian-beta',
]

/** Normalises a route path: no query, no fragment, no trailing slash. */
export function yolTemizle(ham: unknown): string | null {
  if (typeof ham !== 'string' || !ham.startsWith('/') || ham.length > 200) return null
  const y = ham.split('?')[0].split('#')[0]
  return y.length > 1 && y.endsWith('/') ? y.slice(0, -1) : y
}

export function sayilanYolMu(yol: string | null): yol is string {
  return !!yol && SAYILAN_SAYFALAR.includes(yol)
}

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|screenshot|vercel|prerender|phantom|puppeteer|playwright|selenium|wget|curl|python|go-http|java\/|okhttp|axios|node-fetch|undici|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|monitor|uptime|pingdom|gtmetrix|chrome-lighthouse|bingpreview|google-inspectiontool|apis-google|mediapartners|feedfetcher/i
const TARAYICI = /mozilla\/5\.0/i
const MOTOR = /applewebkit|gecko\/|firefox\/|chrome\/|safari\//i

/** True when the request must not be counted: no user agent, not a browser, or a known bot / preview / headless agent. */
export function botMu(ua: string | null | undefined): boolean {
  if (!ua || ua.length < 20 || ua.length > 512) return true
  if (BOT.test(ua)) return true
  return !(TARAYICI.test(ua) && MOTOR.test(ua))
}

export function cihazSinifi(ua: string): 'mobile' | 'desktop' {
  return /mobi|android|iphone|ipad|ipod/i.test(ua) ? 'mobile' : 'desktop'
}

const HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

/** The referrer HOST only (the browser sends just the host), lower-case; the site's own host → '(internal)'; else ''. */
export function refHostuTemizle(ham: unknown, kendiHost: string): string {
  if (typeof ham !== 'string' || !ham) return ''
  const h = ham.trim().toLowerCase().replace(/^www\./, '')
  if (h.length > 100 || !HOST.test(h)) return ''
  return h === kendiHost.toLowerCase().split(':')[0].replace(/^www\./, '') ? '(internal)' : h
}

/** UTC day key. */
export const gunAnahtari = (simdi: number): string => new Date(simdi).toISOString().slice(0, 10)

/** SHA-256(salt + IP + UA + host), hex. */
export function ziyaretciOzeti(tuz: string, ip: string, ua: string, host: string): string {
  return createHash('sha256').update(`${tuz}|${ip}|${ua}|${host.toLowerCase()}`, 'utf8').digest('hex')
}

export type ZiyaretKaydi = { ulke: string; gun: string; ozet: string; yol: string; ref: string; cihaz: 'mobile' | 'desktop' }
export type ZiyaretDeposu = {
  tuzAl: (ulke: string, gun: string) => Promise<string | null>
  kaydet: (k: ZiyaretKaydi) => Promise<void>
}

/** Today's salt per instance: one database call per instance per UTC day. */
export function tuzOnbellegi(getir: (ulke: string, gun: string) => Promise<string | null>) {
  let kayit: { anahtar: string; tuz: string } | null = null
  return {
    async al(ulke: string, gun: string): Promise<string | null> {
      const anahtar = `${ulke}:${gun}`
      if (kayit && kayit.anahtar === anahtar) return kayit.tuz
      const tuz = await getir(ulke, gun)
      if (typeof tuz === 'string' && /^[0-9a-f]{64}$/.test(tuz)) kayit = { anahtar, tuz }
      else return null
      return tuz
    },
    temizle() { kayit = null },
  }
}

const ziyaretSiniri = sinirlayici(30, 10 * 60 * 1000)
/** Test hook. */
export const ziyaretSiniriniTemizle = () => ziyaretSiniri.temizle()

export type ZiyaretIstegi = { ua: string | null; ip: string; host: string; govde: string }
export type ZiyaretSonucu = 'sayildi' | 'bot' | 'gecersiz' | 'sinir' | 'tuz-yok' | 'hata'

/** The whole decision for one page view. Never throws. */
export async function ziyaretIsle(
  istek: ZiyaretIstegi,
  depo: ZiyaretDeposu,
  ayar: { ulke: string; simdi?: number },
): Promise<ZiyaretSonucu> {
  try {
    const ua = istek.ua || ''
    if (botMu(ua)) return 'bot'
    if (!istek.govde || istek.govde.length > 1024) return 'gecersiz'
    let govde: unknown
    try { govde = JSON.parse(istek.govde) } catch { return 'gecersiz' }
    if (!govde || typeof govde !== 'object') return 'gecersiz'
    const yol = yolTemizle((govde as Record<string, unknown>).p)
    if (!sayilanYolMu(yol)) return 'gecersiz'
    const host = (istek.host || '').toLowerCase().split(':')[0]
    if (!host) return 'gecersiz'
    const gun = gunAnahtari(ayar.simdi ?? Date.now())
    const tuz = await depo.tuzAl(ayar.ulke, gun)
    if (!tuz) return 'tuz-yok'
    const ozet = ziyaretciOzeti(tuz, istek.ip || 'yok', ua, host)
    if (!ziyaretSiniri.izinli(ozet, ayar.simdi)) return 'sinir'
    await depo.kaydet({ ulke: ayar.ulke, gun, ozet, yol, ref: refHostuTemizle((govde as Record<string, unknown>).r, host), cihaz: cihazSinifi(ua) })
    return 'sayildi'
  } catch {
    return 'hata'
  }
}

/** The client IP as the platform reports it (first x-forwarded-for hop). Used only inside the hash. */
export function istemciIp(h: { get(ad: string): string | null }): string {
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'yok'
}
