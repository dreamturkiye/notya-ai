/**
 * NOTYA-ULKE-DEMO-01 — the booking link of /demo.
 *
 * The link is NEXT_PUBLIC_DEMO_BOOKING_URL, one value per country deployment (each country is its own Vercel
 * project). Only a Cal.com booking address counts: https://cal.com/<user>[/<event>] or https://app.cal.com/<…>.
 * Anything else — empty, http, another host, a bare domain, credentials, a port, odd characters — is NOT SET: the
 * page says booking opens soon and embeds no calendar. The landing button still links to that page. Plain data
 * and pure functions: no pack.
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
 * Read at render time so tests can switch it. Next inlines the literal `process.env.NEXT_PUBLIC_DEMO_BOOKING_URL` when
 * it builds: setting or changing the value takes a new deployment.
 */
export function demoBaglantisi(): DemoBaglantisi | null {
  return demoBaglantisiCoz(process.env.NEXT_PUBLIC_DEMO_BOOKING_URL)
}

/** The kit's route of the page (prefix-free, as route lists are). */
export const DEMO_SAYFASI = '/demo'
