'use client'

/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — the visit beacon of the PUBLIC pages. The SAME component in every build.
 * Mounted only on the public marketing pages (the landing pages, signup and login entry pages, the demo page; the list
 * is SAYILAN_SAYFALAR in lib/ziyaret/ziyaret.ts) — never inside the signed-in doctor or patient application; a test
 * fails on any other import site (lib/ziyaret/ziyaret.test.ts).
 *
 * After the page has rendered it sends ONE request per page view: the route path (no query string) and the referrer
 * HOST only (never the full referrer URL), with navigator.sendBeacon (fetch keepalive as the fallback). It renders
 * nothing, sets no cookie, stores no identifier, and never delays the page (it runs in an effect, after paint).
 * Skipped: automated browsers (navigator.webdriver), and the founder's own browser once the founder console has
 * marked it (a constant flag, not an identifier — see ZIYARET_HARIC_ANAHTARI).
 *
 * `onEk` is the build's base path ('' in Türkiye, '/uzbek' in Uzbekistan); the recorded path is the route without it.
 */
import { useEffect } from 'react'
import { ZIYARET_HARIC_ANAHTARI, ZIYARET_YOLU } from '@/lib/ziyaret/sabitler'

export default function ZiyaretSayaci({ onEk = '' }: { onEk?: string }) {
  useEffect(() => {
    try {
      if (navigator.webdriver) return
      try { if (window.localStorage.getItem(ZIYARET_HARIC_ANAHTARI) === '1') return } catch { /* storage blocked: count */ }
      let yol = window.location.pathname
      if (onEk && (yol === onEk || yol.startsWith(`${onEk}/`))) yol = yol.slice(onEk.length) || '/'
      let r = ''
      try { r = document.referrer ? new URL(document.referrer).hostname : '' } catch { r = '' }
      const govde = JSON.stringify({ p: yol, r })
      const adres = `${onEk}${ZIYARET_YOLU}`
      const blob = new Blob([govde], { type: 'text/plain' })
      if (!(typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(adres, blob))) {
        void fetch(adres, { method: 'POST', body: govde, keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
      }
    } catch {
      /* counting must never break a page */
    }
  }, [onEk])
  return null
}
