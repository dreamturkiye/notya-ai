/**
 * NOTYA-ULKE-PORTAL-01 — POST /api/ulke/portal/randevu-istegi { gunler: ['YYYY-MM-DD', …], neden? }: the signed-in
 * PATIENT asks their doctor for an appointment. A request holds no time and books nothing: the doctor answers it.
 *
 *   200 { istek: { durum: 'bekliyor', gunler, olusturuldu } }
 *   409 { code: 'BEKLEYEN_VAR' }          the patient already has a request that is not answered
 *   400 { code: 'GECERSIZ', alan }        gunler: none, too many, or a day that cannot be chosen
 *   401 { code: 'OTURUM_YOK' }            no portal session (a doctor's session is not one)
 *   404 { code: 'NOT_FOUND' }             the feature, or appointments, are off in this country
 *
 * TAKES NO DOCTOR AND NO PATIENT FROM THE REQUEST: both are the session's own (lib/ulke/portal/istek.ts).
 */
import { NextRequest } from 'next/server'
import { govdeOku } from '@/lib/ulke/uygulama/cevap'
import { portalOturum } from '@/lib/ulke/portal/giris'
import { istekAcik, istekOlustur } from '@/lib/ulke/portal/istek'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'

export const dynamic = 'force-dynamic'

export const POST = portalSinirinda('randevu-istegi POST', async (req: NextRequest) => {
  if (!istekAcik()) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await istekOlustur(oturum.supabase, oturum, { gunler: g.gunler, neden: g.neden })
  if (!r.tamam) return portalCevabi({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, r.kod === 'BEKLEYEN_VAR' ? 409 : r.kod === 'GECERSIZ' ? 400 : r.kod === 'NOT_FOUND' ? 404 : 500)
  return portalCevabi({ istek: { durum: r.istek.durum, gunler: r.istek.gunler, olusturuldu: r.istek.olusturuldu } })
})
