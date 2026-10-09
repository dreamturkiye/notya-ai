/**
 * NOTYA-ULKE-INTAKE-01 — /api/ulke/hasta-formu: a DOCTOR asks a patient to fill in the intake form, and reads it.
 *
 *   GET    ?hasta=<hastaId>     200 { formlar: [{ id, durum, veli, rolAdi, randevuId, olusturuldu, gonderildi,
 *                                     yenidenAcildi, surumFarkli, bolumler }] }
 *                               newest first, withdrawn ones left out. `bolumler` (the answers, as text in the
 *                               doctor's own form) is there for a SUBMITTED form only.
 *   POST   { hastaId, randevuId?, yeniBaglanti? }
 *                               200 { formId, yeniForm, erisim: 'yeni' | 'var', yol?, pin?, davetDili }
 *                               asks for the form. Where the patient has no portal link that works (or
 *                               `yeniBaglanti` is true: the link before it stops at once), a NEW link and PIN are
 *                               made in the same step and answered this once. An open form is kept as it is.
 *   PATCH  { formId, islem: 'yeniden-ac' | 'geri-cek' }
 *                               200 { ok: true }
 *                               reopens a submitted form (a draft again), or withdraws one that was not submitted
 *
 *   404 { code: 'NOT_FOUND' }   no such patient, appointment or form FOR THIS DOCTOR (another doctor's: exactly the
 *                               same), a malformed id, or the feature is off
 *   409 { code: 'DURUM' }       the form is not in a state the action applies to
 *   409 { code: 'ACIK_VAR' }    reopening: the patient already has another open form
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY (the bearer token of the sign-in service). A patient's portal cookie is not a session here.
 * PATIENT ISOLATION: every id from the request is matched against the authenticated doctor before anything is read
 * or written with it (lib/ulke/intake/form.ts). NOTHING IS SENT TO ANYBODY from here.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { formGeriCek, formIste, formYenidenAc, hastaninFormlari } from '@/lib/ulke/intake/form'
import { aktifFormIcerigi } from '@/lib/ulke/intake/icerik'

export const dynamic = 'force-dynamic'

const DURUM: Record<string, number> = { NOT_FOUND: 404, HAZIR_DEGIL: 503, DURUM: 409, ACIK_VAR: 409, BASARISIZ: 500 }

export const GET = sinirda('hasta-formu GET', async (req: NextRequest) => {
  const icerik = aktifFormIcerigi()
  if (!icerik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  const formlar = await hastaninFormlari(oturum.supabase, oturum.user.id, id, icerik)
  if (!formlar) return KOD.yok()
  return cevap({ formlar })
})

export const POST = sinirda('hasta-formu POST', async (req: NextRequest) => {
  const icerik = aktifFormIcerigi()
  if (!icerik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  if (g.randevuId !== undefined && g.randevuId !== null && !uuidMi(g.randevuId)) return KOD.yok()
  const r = await formIste(oturum.supabase, oturum.user.id, { hastaId: g.hastaId, randevuId: uuidMi(g.randevuId) ? g.randevuId : null, yeniBaglanti: g.yeniBaglanti === true }, icerik)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, DURUM[r.kod] ?? 500)
  return cevap({ formId: r.formId, yeniForm: r.yeniForm, erisim: r.erisim, davetDili: r.davetDili, ...(r.erisim === 'yeni' ? { yol: r.yol, pin: r.pin } : {}) })
})

export const PATCH = sinirda('hasta-formu PATCH', async (req: NextRequest) => {
  if (!aktifFormIcerigi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.formId)) return KOD.yok()
  if (g.islem !== 'yeniden-ac' && g.islem !== 'geri-cek') return KOD.gecersiz('islem')
  const r = g.islem === 'yeniden-ac' ? await formYenidenAc(oturum.supabase, oturum.user.id, g.formId) : await formGeriCek(oturum.supabase, oturum.user.id, g.formId)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, DURUM[r.kod] ?? 500)
  return cevap({ ok: true })
})
