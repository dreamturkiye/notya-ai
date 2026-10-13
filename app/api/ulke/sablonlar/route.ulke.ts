/**
 * NOTYA-ULKE-MESAJ-01 — /api/ulke/sablonlar: a DOCTOR's own templates.
 *
 *   GET     ?yer=not|mesaj            200 { sablonlar: [{ id, ad, metin, kapsam, guncellendi }] }
 *                                     the doctor's templates in use, last saved first; `yer` narrows to what a picker
 *                                     in a note or in a message offers. Without it: all of them.
 *   POST    { ad, metin, kapsam }     200 { sablon }
 *   PATCH   { id, ad, metin, kapsam } 200 { sablon }
 *   DELETE  { id }                    200 { ok: true }     soft: the row stays, marked; it is listed no more
 *
 *   404 { code: 'NOT_FOUND' }   no such template FOR THIS DOCTOR (another doctor's and a deleted one: exactly the
 *                               same), a malformed id, or the country has no templates
 *   400 { code: 'AD_GEREKLI' | 'METIN_GEREKLI' | 'UZUN' | 'KAPSAM' | 'GECERSIZ' }
 *   409 { code: 'COK_FAZLA' }   the account already keeps the most templates the kit allows
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY. TAKES NO PATIENT ID and reads no patient's table: a template is bound to no patient.
 * Every statement carries the authenticated doctor's id (lib/ulke/sablon/sablon.ts). No model is called.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { SABLON_DURUMU, sablonAcik, sablonGuncelle, sablonlariListele, sablonOlustur, sablonSil } from '@/lib/ulke/sablon/sablon'
import { yerMi } from '@/lib/ulke/sablon/sabitler'

export const dynamic = 'force-dynamic'

export const GET = sinirda('sablonlar GET', async (req: NextRequest) => {
  if (!sablonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const yer = req.nextUrl.searchParams.get('yer')
  if (yer !== null && !yerMi(yer)) return KOD.gecersiz('yer')
  return cevap({ sablonlar: await sablonlariListele(oturum.supabase, oturum.user.id, yer ?? undefined) })
})

export const POST = sinirda('sablonlar POST', async (req: NextRequest) => {
  if (!sablonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await sablonOlustur(oturum.supabase, oturum.user.id, { ad: g.ad, metin: g.metin, kapsam: g.kapsam })
  if (!r.tamam) return cevap({ code: r.kod }, SABLON_DURUMU[r.kod])
  return cevap({ sablon: r.sablon })
})

export const PATCH = sinirda('sablonlar PATCH', async (req: NextRequest) => {
  if (!sablonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  const r = await sablonGuncelle(oturum.supabase, oturum.user.id, g.id, { ad: g.ad, metin: g.metin, kapsam: g.kapsam })
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, SABLON_DURUMU[r.kod])
  return cevap({ sablon: r.sablon })
})

export const DELETE = sinirda('sablonlar DELETE', async (req: NextRequest) => {
  if (!sablonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  const r = await sablonSil(oturum.supabase, oturum.user.id, g.id)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, SABLON_DURUMU[r.kod])
  return cevap({ ok: true })
})
