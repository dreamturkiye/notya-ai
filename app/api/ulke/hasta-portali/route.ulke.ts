/**
 * NOTYA-ULKE-PORTAL-01 — /api/ulke/hasta-portali: a DOCTOR manages one patient's portal access.
 *
 *   GET    ?hasta=<hastaId>     200 { erisim: { durum: 'yok' | 'acik' | 'kilitli' | 'suresi-doldu', olusturuldu, sonGecerlilik, sonGiris },
 *                                     kayitlar: [{ olay, an, ozetId }] }      what happened: links, sign-ins, locks, shares
 *   POST   { hastaId }          200 { yol, pin, sonGecerlilik }               a NEW link and PIN, shown this once; the
 *                                                                             link before it stops working at once
 *   DELETE { hastaId }          200 { ok: true, vardi }                       withdraws the link (vardi false = there was none)
 *
 *   404 { code: 'NOT_FOUND' }   no such patient FOR THIS DOCTOR (another doctor's: exactly the same), a malformed
 *                               id, or the feature is off
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY (the bearer token of the sign-in service). A patient's portal cookie, a portal session key
 * or a link's token is not a session here: `ulkeOturum` does not read the cookie, and the sign-in service knows
 * neither key.
 * PATIENT ISOLATION: the patient id is matched against the authenticated doctor before anything is read or written
 * (lib/ulke/portal/erisim.ts). The token and the PIN are never stored and never answered again.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { portalErisimDurumu, portalErisimIptal, portalErisimVer } from '@/lib/ulke/portal/erisim'
import { portalAcik } from '@/lib/ulke/portal/giris'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hasta-portali GET', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  const d = await portalErisimDurumu(oturum.supabase, oturum.user.id, id)
  if (!d) return KOD.yok()
  return cevap(d)
})

export const POST = sinirda('hasta-portali POST', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await portalErisimVer(oturum.supabase, oturum.user.id, g.hastaId)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, r.kod === 'HAZIR_DEGIL' ? 503 : 500)
  return cevap({ yol: r.yol, pin: r.pin, sonGecerlilik: r.sonGecerlilik })
})

export const DELETE = sinirda('hasta-portali DELETE', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await portalErisimIptal(oturum.supabase, oturum.user.id, g.hastaId)
  if (r === 'NOT_FOUND') return KOD.yok()
  if (r === 'BASARISIZ') return KOD.basarisiz()
  return cevap({ ok: true, vardi: r === 'TAMAM' })
})
