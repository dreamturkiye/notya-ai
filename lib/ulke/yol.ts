/**
 * NOTYA-UZ-MUAYENE-01 — the PATH a country's build is served under (Kaan, 2026-10-08: no separate address per
 * country; each country is a folder in this repository and a path on the main site — Uzbekistan is notya.io/uzbek).
 *
 * The prefix is a fact of the pack (`yolOnEki`), mirrored for the build in countries/<kod>/derleme.mjs, where
 * next.config.mjs reads it as Next's `basePath`. No prefix (the default, and Türkiye) = the domain root: every
 * function here then returns its argument unchanged.
 *
 * WHO NEEDS THIS. Next adds the base path by itself to its own router, to server-side `redirect()`, to its assets
 * (/_next/…) and to the middleware matcher, and it strips it from `req.nextUrl.pathname`. It does NOT touch a plain
 * `<a href>`, a `<form action>`, `window.location` or `fetch()` — and the country screens use exactly those. Every
 * such address goes through `ulkeYolu`. A test fails on a screen that links outside the prefix
 * (countries/uz/uygulama/uygulama.test.ts, lib/ulke/ulkeEkranlari.uz.test.ts).
 *
 * Route lists (`rotalar`, UYGULAMA_EKRANLARI) and the middleware stay prefix-free: they name routes, not addresses.
 */
import { AKTIF_PAKET } from '@/countries/active'

/** '' or '/segment' — never a trailing slash. */
export const YOL_ON_EKI_BICIMI = /^(\/[a-z0-9][a-z0-9-]*)?$/

export function ulkeYolOnEki(): string {
  return AKTIF_PAKET.yolOnEki ?? ''
}

/**
 * The address of a route of this build: '/today' → '/uzbek/today', '/' → '/uzbek', '/?dil=ru#narx' → '/uzbek?dil=ru#narx'.
 * Only root-relative routes are prefixed; '#top', 'mailto:…' and absolute URLs are returned as they are.
 */
export function ulkeYolu(yol: string): string {
  const onEk = ulkeYolOnEki()
  if (!onEk || !yol.startsWith('/') || yol.startsWith('//')) return yol
  // The root itself has no trailing slash under a prefix (Next answers '/uzbek/' with a redirect to '/uzbek').
  return yol === '/' || /^\/[?#]/.test(yol) ? `${onEk}${yol.slice(1)}` : `${onEk}${yol}`
}
