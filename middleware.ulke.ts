/**
 * NOTYA-ULKE-01 — MIDDLEWARE of a country that is not the pre-split application (see app/layout.ulke.tsx for why
 * this file has a second extension; the pre-split application's middleware.ts is untouched and never runs here).
 *
 * Two jobs:
 *   1. Country gate. Only the paths the active pack lists exist; anything else answers 404 here, before any screen
 *      renders. The build already contains only *.ulke.* routes; this is the second lock, and it also closes the
 *      static files in public/ that every build carries (internal pages, the Turkish app manifest, the service worker).
 *   2. Headers: the same security headers the application has always sent, plus "do not index" on every response
 *      and a robots.txt that disallows everything while the country is hidden from search engines. The patient's
 *      page (/portal) is never indexed, never cached and names no referrer, whatever the country's setting.
 */
import { NextRequest, NextResponse } from 'next/server'
import { AKTIF_PAKET } from '@/countries/active'
import { ARAMA_GIZLI_BASLIGI, ROBOTS_HERKESE_KAPALI, rotaAcikMi } from '@/lib/ulke/rotaKapisi'
import { PORTAL_SAYFASI } from '@/lib/ulke/portal/sabitler'

function guvenlikBasliklari(h: Headers) {
  h.set('X-Frame-Options', 'DENY')
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  if (AKTIF_PAKET.aramaMotorlarinaGizli) h.set('X-Robots-Tag', ARAMA_GIZLI_BASLIGI)
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/robots.txt' && AKTIF_PAKET.aramaMotorlarinaGizli) {
    const r = new NextResponse(ROBOTS_HERKESE_KAPALI, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    guvenlikBasliklari(r.headers)
    return r
  }

  // A pack that claims the whole pre-split application must not be built with this middleware at all
  // (next.config.mjs picks middleware.ts for it). If it ever is, close everything rather than open everything.
  const izin = AKTIF_PAKET.rotalar === 'hepsi' ? { sayfalar: [], apiOnEkleri: [] } : AKTIF_PAKET.rotalar
  if (!rotaAcikMi(izin, pathname)) {
    const r = pathname.startsWith('/api/')
      ? NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
      : new NextResponse(null, { status: 404 })
    r.headers.set('Cache-Control', 'no-store')
    guvenlikBasliklari(r.headers)
    return r
  }

  const r = NextResponse.next()
  guvenlikBasliklari(r.headers)
  // NOTYA-ULKE-PORTAL-01: the patient's page is never indexed (whatever the country's own setting), never kept by a
  // shared cache, and names no referrer. Its API routes set the same headers themselves (lib/ulke/portal/rotaYardimcisi.ts).
  if (pathname === PORTAL_SAYFASI) {
    r.headers.set('X-Robots-Tag', ARAMA_GIZLI_BASLIGI)
    r.headers.set('Cache-Control', 'private, no-store, max-age=0')
    r.headers.set('Referrer-Policy', 'no-referrer')
  }
  return r
}

export const config = {
  // NOTYA-UZ-MUAYENE-01: '/' is listed by itself on purpose. Under a path prefix (basePath '/uzbek') Next compiles the
  // second pattern to '/uzbek/(…)', which needs a slash after the prefix and so does NOT match the landing page at
  // exactly '/uzbek' — it was served without the gate and without its headers. Without a prefix '/' changes nothing.
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
