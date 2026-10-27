/**
 * NOTYA-DEMO-01 — "Demo planla" booking link.
 *
 * The link comes from NEXT_PUBLIC_DEMO_BOOKING_URL (one value per Vercel project). Only a Cal.com booking
 * address is accepted: https://cal.com/<user>[/<event>] or https://app.cal.com/<user>[/<event>]. Anything
 * else — empty, http, another host, a bare domain, credentials, a port, odd characters — counts as NOT SET:
 * the /demo page shows its "opens soon" text and no "Demo planla" button appears anywhere on the landing.
 */

export type DemoBaglantisi = {
  /** The normalised address, e.g. https://cal.com/notya/demo */
  url: string
  /** Cal.com embed origin: https://cal.com or https://app.cal.com */
  origin: string
  /** Cal.com embed calLink: "<user>/<event>" */
  calLink: string
}

const IZINLI_ALANLAR = new Set(['cal.com', 'app.cal.com'])
const YOL_KALIBI = /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*\/?$/

export function demoBaglantisiCoz(ham: string | undefined | null): DemoBaglantisi | null {
  if (typeof ham !== 'string') return null
  const metin = ham.trim()
  if (!metin) return null
  let u: URL
  try {
    u = new URL(metin)
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  if (!IZINLI_ALANLAR.has(u.hostname)) return null
  if (u.port || u.username || u.password) return null
  if (!YOL_KALIBI.test(u.pathname)) return null
  const calLink = u.pathname.replace(/^\/+|\/+$/g, '')
  if (!calLink) return null
  return { url: `${u.origin}/${calLink}`, origin: u.origin, calLink }
}

/**
 * Read at render time (not at module load) so tests can switch the value. In the browser bundle Next inlines
 * the literal `process.env.NEXT_PUBLIC_DEMO_BOOKING_URL` at build time — changing it needs a redeploy.
 */
export function demoBaglantisi(): DemoBaglantisi | null {
  return demoBaglantisiCoz(process.env.NEXT_PUBLIC_DEMO_BOOKING_URL)
}

/** Script and frame origins the Cal.com inline embed needs; allowed in the CSP of /demo only. */
export const CAL_EMBED_KAYNAKLARI = ['https://app.cal.com', 'https://cal.com'] as const

/** Directives the inline embed needs: its loader script (app.cal.com), its iframe (cal.com / app.cal.com) and the font its
 *  injected styles reference (https://cal.com/cal.ttf). Nothing else is widened. */
const CAL_CSP_YONERGELERI = ['script-src', 'script-src-elem', 'frame-src', 'font-src'] as const

/**
 * NOTYA-DEMO-01 — widen a Content-Security-Policy for /demo only: append the Cal.com origins to the four directives
 * above. An absent frame-src / font-src (which falls back to default-src) is added as `'self'` + Cal.com; an absent
 * script-src-elem is left absent because it falls back to script-src, which is widened.
 */
export function demoCspGenislet(csp: string): string {
  const parcalar = csp.split(';').map((p) => p.trim()).filter(Boolean)
  const ek = CAL_EMBED_KAYNAKLARI.join(' ')
  for (const yonerge of CAL_CSP_YONERGELERI) {
    const i = parcalar.findIndex((p) => p.split(/\s+/)[0] === yonerge)
    if (i >= 0) parcalar[i] = `${parcalar[i]} ${ek}`
    else if (yonerge !== 'script-src-elem') parcalar.push(`${yonerge} 'self' ${ek}`)
  }
  return parcalar.join('; ')
}

export function demoYoluMu(pathname: string): boolean {
  return pathname === '/demo' || pathname === '/demo/'
}
