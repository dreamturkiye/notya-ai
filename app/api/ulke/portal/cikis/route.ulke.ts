/**
 * NOTYA-ULKE-PORTAL-01 — POST /api/ulke/portal/cikis: the PATIENT signs out. The session is closed in the database
 * and the cookie is removed. Always 200 { ok: true }: there is nothing to learn from signing out.
 */
import { NextRequest } from 'next/server'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { portalAcik, portalCereziniSil, portalCikis } from '@/lib/ulke/portal/giris'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'
import { PORTAL_CEREZI } from '@/lib/ulke/portal/sabitler'

export const dynamic = 'force-dynamic'

export const POST = portalSinirinda('cikis POST', async (req: NextRequest) => {
  if (!portalAcik()) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  await portalCikis(ulkeServisSupabase(), req.cookies.get(PORTAL_CEREZI)?.value)
  const res = portalCevabi({ ok: true })
  portalCereziniSil(req, res)
  return res
})
