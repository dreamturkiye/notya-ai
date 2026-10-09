/**
 * NOTYA-ULKE-INTAKE-01 — /api/ulke/portal/form: the signed-in PATIENT's intake form.
 *
 *   GET                         200 { form: { id, durum, veli, dil, riza: { metin, kabul }, bolumler, cevaplar, gonderildi } | null }
 *                               the open form (to fill in), else the last submitted one (to read), else null.
 *                               `bolumler` holds the core questions and the questions of the ONE role the form was
 *                               asked with, in the patient's own language form.
 *   PUT   { cevaplar, riza? }   200 { form }     SAVES the open form as a draft ("saved as they go")
 *   POST  { cevaplar, riza? }   200 { form }     SUBMITS it, once. Afterwards it is read-only for the patient.
 *
 *   400 { code: 'RIZA_GEREKLI' }         nothing is saved before the consent sentence is accepted (`riza: true`)
 *   400 { code: 'EKSIK', eksik: [...] }  submitting: required questions without an answer (their keys)
 *   400 { code: 'GECERSIZ' }             not the portal's own request, or answers too large to be a form
 *   404 { code: 'NOT_FOUND' }            the feature is off; or (PUT, POST) there is no open form to write to —
 *                                        it was submitted or withdrawn, or never asked for
 *   401 { code: 'OTURUM_YOK' }           no portal session (a doctor's session is not one)
 *
 * TAKES NO DOCTOR, NO PATIENT AND NO FORM ID FROM THE REQUEST: all three are the session's own
 * (lib/ulke/intake/form.ts). An answer to a question that is not on THIS form is dropped, whatever is sent.
 * Private, never stored by a cache, never indexed (lib/ulke/portal/rotaYardimcisi.ts).
 */
import { NextRequest } from 'next/server'
import { govdeOku } from '@/lib/ulke/uygulama/cevap'
import { portalOturum } from '@/lib/ulke/portal/giris'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'
import { hastaFormuOku, hastaFormuYaz } from '@/lib/ulke/intake/form'
import { aktifFormIcerigi } from '@/lib/ulke/intake/icerik'

export const dynamic = 'force-dynamic'

export const GET = portalSinirinda('portal form GET', async (req: NextRequest) => {
  const icerik = aktifFormIcerigi()
  if (!icerik) return PORTAL_KOD.yok()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  return portalCevabi({ form: await hastaFormuOku(oturum.supabase, oturum, icerik) })
})

const yaz = (gonder: boolean) => async (req: NextRequest) => {
  const icerik = aktifFormIcerigi()
  if (!icerik) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await hastaFormuYaz(oturum.supabase, oturum, { cevaplar: g.cevaplar, riza: g.riza, gonder }, icerik)
  if (!r.tamam) return portalCevabi({ code: r.kod, ...(r.eksik ? { eksik: r.eksik } : {}) }, r.kod === 'NOT_FOUND' ? 404 : r.kod === 'BASARISIZ' ? 500 : 400)
  return portalCevabi({ form: r.form })
}

export const PUT = portalSinirinda('portal form PUT', yaz(false))
export const POST = portalSinirinda('portal form POST', yaz(true))
