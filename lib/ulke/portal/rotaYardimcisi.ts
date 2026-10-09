/**
 * NOTYA-ULKE-PORTAL-01 — what every route a PATIENT's browser calls has in common (app/api/ulke/portal/*).
 *
 * PRIVACY DEFAULTS. Every answer says: private, never stored, never indexed. A portal answer is about one patient;
 * no shared cache between the server and the patient's browser may keep it, and no search engine may list it.
 *
 * A REQUEST THAT CHANGES SOMETHING must carry the portal's own header and JSON. A page of another site cannot send
 * that header without the browser asking this server first, and this server allows no other origin; together with a
 * cookie that is never sent on a request from another site, a patient's session cannot be made to act by a link
 * placed somewhere else.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { ARAMA_GIZLI_BASLIGI } from '../rotaKapisi'
import { PORTAL_ISTEK_BASLIGI } from './sabitler'

export const PORTAL_BASLIKLARI: Readonly<Record<string, string>> = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Robots-Tag': ARAMA_GIZLI_BASLIGI,
  'Referrer-Policy': 'no-referrer',
}

export const portalCevabi = (govde: Record<string, unknown>, status = 200): NextResponse => NextResponse.json(govde, { status, headers: PORTAL_BASLIKLARI })

export const PORTAL_KOD = {
  /** Feature off, a link that does not exist (or is withdrawn, ended, another country's): indistinguishable. */
  yok: () => portalCevabi({ code: 'NOT_FOUND' }, 404),
  /** No portal session. A doctor's session does not count. */
  oturumYok: () => portalCevabi({ code: 'OTURUM_YOK' }, 401),
  gecersiz: (alan?: string) => portalCevabi({ code: 'GECERSIZ', ...(alan ? { alan } : {}) }, 400),
  basarisiz: () => portalCevabi({ code: 'BASARISIZ' }, 500),
} as const

/** true = the request carries the portal's header and says it sends JSON. */
export const portalIstegiMi = (req: NextRequest): boolean => req.headers.get(PORTAL_ISTEK_BASLIGI) === '1' && /^application\/json\b/i.test(req.headers.get('content-type') ?? '')

type Isleyici = (req: NextRequest) => Promise<Response>
/** The boundary of a portal route: whatever is thrown, the patient gets a code, with the privacy headers, and nothing else. */
export function portalSinirinda(ad: string, isleyici: Isleyici): Isleyici {
  return async (req) => {
    try {
      return await isleyici(req)
    } catch (e) {
      console.error(`[ulke/portal] ${ad}: ${e instanceof Error ? e.name : typeof e}`)
      return PORTAL_KOD.basarisiz()
    }
  }
}
