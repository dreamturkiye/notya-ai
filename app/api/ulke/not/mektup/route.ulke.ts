/**
 * AU-GAP-CLOSE-01 — /api/ulke/not/mektup: clinical letter draft from ONE approved note of THIS doctor.
 *
 *   GET  ?not=<id>              200 { onayli, yazilabilir, turler }
 *   POST { notId, tur }         200 { mektup: { tur, metin } }
 *
 *   409 ONAYSIZ · 404 NOT_FOUND · 503 HAZIR_DEGIL · 502 YAZILAMADI · 400 GECERSIZ
 * PATIENT ISOLATION: note id + doctor id in the same query (lib/ulke/mektup/mektup.ts → notGetir).
 * Nothing is sent, lodged or written to a PMS.
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { MEKTUP_DURUMU, mektupHazirMi, mektupUret, type MektupRetKodu } from '@/lib/ulke/mektup/mektup'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ret = (kod: MektupRetKodu) => cevap({ code: kod }, MEKTUP_DURUMU[kod])

export const GET = sinirda('not/mektup GET', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('not')
  if (!uuidMi(id)) return KOD.yok()
  const d = await mektupHazirMi(oturum.supabase, oturum.user.id, id)
  if (!d) return KOD.yok()
  return cevap(d)
})

export const POST = sinirda('not/mektup POST', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await mektupUret(oturum.supabase, oturum.user.id, g.notId, g.tur, rotaButcesiMs(maxDuration))
  if (!r.tamam) return ret(r.kod)
  return cevap({ mektup: r.mektup })
})
