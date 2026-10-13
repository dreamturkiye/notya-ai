/**
 * NOTYA-UZ-MUAYENE-01 — /api/ulke/not: the note of a visit of the caller.
 *
 *   POST  { seansId }                 writes the note of that visit from its transcript, in the doctor's note
 *                                     language (once per visit: asked again, it answers with the existing note)
 *         200 { notId }
 *         502 { code: 'NOT_YAZILAMADI' }   the note could not be written; the visit and its transcript are kept
 *   GET   ?id=<notId>
 *         200 { not: { notId, seansId, onayli, onayTarihi, dil, icerik, ikinci, yenidenYazilabilir, muayene } }
 *   PATCH { notId, dil, s, o, a, p }  saves the doctor's edits to the draft in that language
 *         200 { ok: true }
 *         409 { code: 'ONAYLI' }           the note is approved: it is not changed
 *         400 { code: 'GECERSIZ', alan }   no draft in that language
 *
 *   404 { code: 'NOT_FOUND' }   no such visit / note FOR THIS DOCTOR (another doctor's: the same), or feature off
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the visit id and the note id come from the request; each is read with the authenticated
 * doctor's id in the same query (lib/ulke/uygulama/notlar.ts). Codes only — never a sentence, never an error's text.
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { icerikAl, notGetir, notKaydet, notYaz } from '@/lib/ulke/uygulama/notlar'
import { NOT_DURUMU } from '@/lib/ulke/uygulama/notDurumu'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export const POST = sinirda('not POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.seansId)) return KOD.yok()
  const r = await notYaz(oturum.supabase, oturum.user.id, g.seansId, rotaButcesiMs(maxDuration))
  if (!r.tamam) return cevap({ code: r.kod }, NOT_DURUMU[r.kod])
  return cevap({ notId: r.notId })
})

export const GET = sinirda('not GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  const not = await notGetir(oturum.supabase, oturum.user.id, id)
  if (!not) return KOD.yok()
  return cevap({ not })
})

export const PATCH = sinirda('not PATCH', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await notKaydet(oturum.supabase, oturum.user.id, g.notId, g.dil, icerikAl(g))
  if (!r.tamam) return cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, NOT_DURUMU[r.kod])
  return cevap({ ok: true })
})
