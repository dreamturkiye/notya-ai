/**
 * NOTYA-ULKE-PORTAL-01 — /api/ulke/hasta-portali/ozet: a DOCTOR's summary of one approved note, for the patient.
 *
 *   GET   ?not=<notId>           200 { ozet: { id, notId, dil, metin, paylasildi, paylasimAni, guncellendi } | null, onayli, dil, yazilabilir }
 *   POST  { notId }              the model writes the DRAFT from the approved note only, in the patient's language
 *                                200 { ozet }     502 { code: 'OZET_YAZILAMADI' }
 *   PATCH { notId, metin }       the doctor's own text for the draft       200 { ozet }     400 { code: 'BOS' }
 *   PUT   { notId, paylas }      true = SHARE it (the portal shows it from now), false = TAKE IT BACK (the portal
 *                                stops showing it at once). Recorded for the doctor either way.   200 { ozet }
 *
 *   409 { code: 'ONAYSIZ' }      the note is not approved: it has no summary and can never be shared
 *   409 { code: 'PAYLASILDI' }   the summary is shared: take it back before changing it
 *   404 { code: 'NOT_FOUND' }    no such note FOR THIS DOCTOR (another doctor's: exactly the same), or feature off
 *   401 { code: 'OTURUM_YOK' }   503 { code: 'HAZIR_DEGIL' }   500 { code: 'BASARISIZ' }
 *
 * NOTHING IS SHARED BY THIS ROUTE UNLESS THE DOCTOR SAYS SO: POST and PATCH only ever write a draft.
 * A DOCTOR'S SESSION ONLY. PATIENT ISOLATION: the note id is read with the authenticated doctor's id in the same
 * query (lib/ulke/portal/ozet.ts). Codes only — never a sentence, never an error's text.
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { portalAcik } from '@/lib/ulke/portal/giris'
import { ozetGetir, ozetKaydet, ozetMetniAl, ozetPaylas, ozetUret, OZET_DURUMU, type OzetRetKodu } from '@/lib/ulke/portal/ozet'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ret = (kod: OzetRetKodu) => cevap({ code: kod }, OZET_DURUMU[kod])

export const GET = sinirda('hasta-portali/ozet GET', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('not')
  if (!uuidMi(id)) return KOD.yok()
  const d = await ozetGetir(oturum.supabase, oturum.user.id, id)
  if (!d) return KOD.yok()
  return cevap(d)
})

export const POST = sinirda('hasta-portali/ozet POST', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await ozetUret(oturum.supabase, oturum.user.id, g.notId, rotaButcesiMs(maxDuration))
  if (!r.tamam) return ret(r.kod)
  return cevap({ ozet: r.ozet })
})

export const PATCH = sinirda('hasta-portali/ozet PATCH', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await ozetKaydet(oturum.supabase, oturum.user.id, g.notId, ozetMetniAl(g.metin))
  if (!r.tamam) return ret(r.kod)
  return cevap({ ozet: r.ozet })
})

export const PUT = sinirda('hasta-portali/ozet PUT', async (req: NextRequest) => {
  if (!portalAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  // Sharing needs the word itself: anything but a literal true or false is refused, never read as "share".
  if (typeof g.paylas !== 'boolean') return KOD.gecersiz('paylas')
  const r = await ozetPaylas(oturum.supabase, oturum.user.id, g.notId, g.paylas)
  if (!r.tamam) return ret(r.kod)
  return cevap({ ozet: r.ozet })
})
