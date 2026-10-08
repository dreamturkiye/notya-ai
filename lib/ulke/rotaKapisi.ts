/**
 * NOTYA-ULKE-01 — which paths exist in the country this deployment serves. Pure: the middleware calls it with the
 * active pack's `rotalar`, tests call it with any pack's.
 *
 * 'hepsi' is the pre-split application (Türkiye today): the gate does nothing at all. An allow-list is the opposite
 * default: a path that is not listed does not exist there, so a screen that has not been split and translated cannot
 * be reached by typing its address. That is how "no Turkish screen in another country" is enforced before any of the
 * 1,800 Turkish screens is touched.
 */
import type { RotaIzni } from './tipler'

/** Framework internals every deployment needs (chunks, HMR, image optimiser). Never application content. */
const CATI_ON_EKLERI = ['/_next/'] as const

function duzYol(pathname: string): string {
  const y = pathname.split('?')[0].split('#')[0]
  return y.length > 1 && y.endsWith('/') ? y.slice(0, -1) : y || '/'
}

export function rotaAcikMi(izin: RotaIzni, pathname: string): boolean {
  if (izin === 'hepsi') return true
  const yol = duzYol(pathname)
  if (CATI_ON_EKLERI.some((o) => yol.startsWith(o))) return true
  if (yol.startsWith('/api/') || yol === '/api') {
    // Prefixes must end in '/', so '/api/ulke/' can never open '/api/ulkeler'.
    return izin.apiOnEkleri.some((o) => o.endsWith('/') && `${yol}/`.startsWith(o))
  }
  return izin.sayfalar.includes(yol)
}

/** Served at /robots.txt for a country that is hidden from search engines. */
export const ROBOTS_HERKESE_KAPALI = 'User-agent: *\nDisallow: /\n'
export const ARAMA_GIZLI_BASLIGI = 'noindex, nofollow, noarchive, nosnippet'
