/**
 * FOTO-ARSIV-01 — /api/ulke/hasta-foto: the clinical photo archive on one of the caller's patients. Storage and
 * viewing ONLY — no model ever reads a photo kept here (FOTO-ARSIV-02, a separate, not-yet-authorized item, stays
 * untouched).
 *
 *   GET  ?hastaId=<id>          200 { fotolar: [HastaFotosu] }     newest clinical date first
 *        404 { code: 'NOT_FOUND' }        the patient is not this doctor's
 *
 *   GET  ?indir=<fotoId>        200 { url }     a short-lived (5 min) signed URL to the image's bytes
 *        404 { code: 'NOT_FOUND' }        the photo is not this doctor's
 *
 *   POST { hastaId, yol, mimeTuru, boyut, cekimTarihi, etiket?, seansId? }      200 { id }
 *        The image at `yol` was already uploaded by the browser straight into the caller's own folder of the
 *        `hasta-fotograflari` bucket; this call only registers it. `seansId`, if given, must be a visit of THIS
 *        patient and THIS doctor — otherwise it is dropped (the photo is still filed, with no visit link).
 *        400 { code: 'DOSYA_TURU' | 'BUYUK' | 'TARIH_GECERSIZ' }
 *        404 { code: 'NOT_FOUND' }        the patient is not this doctor's, or the path is not the caller's own folder
 *
 *   PATCH { id, cekimTarihi?, etiket? }    200 { ok: true }
 *        Corrects the clinical date and/or the label of one of the caller's own photos. Nothing else about a row
 *        can ever change.
 *        400 { code: 'TARIH_GECERSIZ' }
 *        404 { code: 'NOT_FOUND' }        not this doctor's photo
 *
 *   DELETE { id }                200 { ok: true }
 *        404 { code: 'NOT_FOUND' }        not this doctor's photo
 *
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the patient id comes from the query or the body and is matched against the authenticated
 * doctor in the same statement before anything is read or written with it; a photo id is matched the same way
 * (lib/ulke/fotoArsivi/fotoArsivi.ts). Codes only — never a sentence, never an error's own text.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { fotoDuzenle, FOTO_DURUMU, fotoGoruntuBaglantisi, fotoKaydet, fotoSil, hastaninFotolari } from '@/lib/ulke/fotoArsivi/fotoArsivi'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hasta-foto GET', async (req: NextRequest) => {
  if (!ozellikAcik('fotoArsivi')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const s = req.nextUrl.searchParams
  const indir = s.get('indir')
  if (indir !== null) {
    if (!uuidMi(indir)) return KOD.yok()
    const url = await fotoGoruntuBaglantisi(oturum.supabase, oturum.user.id, indir)
    return url ? cevap({ url }) : KOD.yok()
  }
  const hastaId = s.get('hastaId')
  if (!uuidMi(hastaId)) return KOD.yok()
  const fotolar = await hastaninFotolari(oturum.supabase, oturum.user.id, hastaId)
  return fotolar ? cevap({ fotolar }) : KOD.yok()
})

export const POST = sinirda('hasta-foto POST', async (req: NextRequest) => {
  if (!ozellikAcik('fotoArsivi')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await fotoKaydet(oturum.supabase, oturum.user.id, {
    hastaId: g.hastaId, yol: g.yol, mimeTuru: g.mimeTuru, boyut: g.boyut, cekimTarihi: g.cekimTarihi, etiket: g.etiket, seansId: g.seansId,
  })
  if (!r.tamam) return cevap({ code: r.kod }, FOTO_DURUMU[r.kod])
  return cevap({ id: r.id })
})

export const PATCH = sinirda('hasta-foto PATCH', async (req: NextRequest) => {
  if (!ozellikAcik('fotoArsivi')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  const r = await fotoDuzenle(oturum.supabase, oturum.user.id, g.id, { cekimTarihi: g.cekimTarihi, etiket: g.etiket })
  if (!r.tamam) return cevap({ code: r.kod }, FOTO_DURUMU[r.kod])
  return cevap({ ok: true })
})

export const DELETE = sinirda('hasta-foto DELETE', async (req: NextRequest) => {
  if (!ozellikAcik('fotoArsivi')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  const r = await fotoSil(oturum.supabase, oturum.user.id, g.id)
  if (!r.tamam) return cevap({ code: r.kod }, FOTO_DURUMU[r.kod])
  return cevap({ ok: true })
})
