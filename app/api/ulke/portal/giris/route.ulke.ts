/**
 * NOTYA-ULKE-PORTAL-01 — POST /api/ulke/portal/giris { token, pin }: a PATIENT signs in to the portal with the
 * link's token and the PIN the doctor gave them. No account, no password.
 *
 *   200 { ok: true, bitis }             and the session cookie (HttpOnly, sent to the portal's routes only)
 *   401 { code: 'PIN_YANLIS', kalan }   a wrong PIN; `kalan` tries are left before the link locks
 *   423 { code: 'KILITLI' }             too many wrong PINs: the link is locked for good. The doctor gives a new one.
 *   429 { code: 'YAVAS' }               the try before this one was a moment ago: not looked at, not counted
 *   404 { code: 'NOT_FOUND' }           no such link — the same answer for a token that never existed, a link that was
 *                                       withdrawn, one that has ended, a link of another country, and the feature off
 *   400 { code: 'GECERSIZ' }            not a PIN, or not a portal request
 *   500 { code: 'BASARISIZ' }
 *
 * THE TOKEN ALONE SHOWS NOTHING: no answer of this route says anything about a patient or a doctor.
 * NO OTHER SESSION COUNTS: the Authorization header is not read. A signed-in doctor gets no further here than anybody.
 */
import { NextRequest } from 'next/server'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { govdeOku } from '@/lib/ulke/uygulama/cevap'
import { portalAcik, portalCereziniYaz, portalGiris, type PortalGirisRetKodu } from '@/lib/ulke/portal/giris'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'

export const dynamic = 'force-dynamic'

const DURUM: Record<PortalGirisRetKodu, number> = { NOT_FOUND: 404, KILITLI: 423, YAVAS: 429, PIN_YANLIS: 401, GECERSIZ: 400, BASARISIZ: 500 }

export const POST = portalSinirinda('giris POST', async (req: NextRequest) => {
  if (!portalAcik()) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const g = await govdeOku(req)
  const r = await portalGiris(ulkeServisSupabase(), g.token, g.pin)
  if (!r.tamam) return portalCevabi({ code: r.kod, ...(r.kalan !== undefined ? { kalan: r.kalan } : {}) }, DURUM[r.kod])
  const res = portalCevabi({ ok: true, bitis: r.bitis })
  portalCereziniYaz(req, res, r.oturumAnahtari, r.bitis)
  return res
})
