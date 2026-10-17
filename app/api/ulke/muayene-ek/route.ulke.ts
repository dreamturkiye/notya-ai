/**
 * MUAYENE-EKLERI-07 — /api/ulke/muayene-ek: a file attached to one visit of the caller ("Yüklenen dosyalar").
 *
 *   GET  ?seansId=<id>          200 { ekler: [MuayeneEki] }     oldest first
 *        404 { code: 'NOT_FOUND' }        the visit is not this doctor's
 *
 *   GET  ?indir=<ekId>          200 { url }     a short-lived (5 min) signed URL to the file's bytes
 *        404 { code: 'NOT_FOUND' }        the attachment is not this doctor's
 *
 *   POST { seansId, yol, ad, mimeTuru, boyut }      200 { id }
 *        The file at `yol` was already uploaded by the browser straight into the caller's own folder of the
 *        `muayene-ekleri` bucket; this call only registers it.
 *        400 { code: 'AD_GEREKLI' | 'DOSYA_TURU' | 'BUYUK' }
 *        404 { code: 'NOT_FOUND' }        the visit is not this doctor's, or the path is not the caller's own folder
 *
 *   DELETE { id }                200 { ok: true }
 *        404 { code: 'NOT_FOUND' }        not this doctor's attachment
 *
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the visit id comes from the query or the body and is matched against the authenticated doctor
 * in the same statement before anything is read or written with it; an attachment id is matched the same way
 * (lib/ulke/muayeneEki/muayeneEki.ts). Codes only — never a sentence, never an error's own text.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { MUAYENE_EKI_DURUMU, muayeneEkiIndirmeBaglantisi, muayeneEkiKaydet, muayeneEkleriListesi, muayeneEkiSil } from '@/lib/ulke/muayeneEki/muayeneEki'

export const dynamic = 'force-dynamic'

export const GET = sinirda('muayene-ek GET', async (req: NextRequest) => {
  if (!ozellikAcik('muayeneEkleri')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const s = req.nextUrl.searchParams
  const indir = s.get('indir')
  if (indir !== null) {
    if (!uuidMi(indir)) return KOD.yok()
    const url = await muayeneEkiIndirmeBaglantisi(oturum.supabase, oturum.user.id, indir)
    return url ? cevap({ url }) : KOD.yok()
  }
  const seansId = s.get('seansId')
  if (!uuidMi(seansId)) return KOD.yok()
  const ekler = await muayeneEkleriListesi(oturum.supabase, oturum.user.id, seansId)
  return ekler ? cevap({ ekler }) : KOD.yok()
})

export const POST = sinirda('muayene-ek POST', async (req: NextRequest) => {
  if (!ozellikAcik('muayeneEkleri')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.seansId)) return KOD.yok()
  const r = await muayeneEkiKaydet(oturum.supabase, oturum.user.id, { seansId: g.seansId, yol: g.yol, ad: g.ad, mimeTuru: g.mimeTuru, boyut: g.boyut })
  if (!r.tamam) return cevap({ code: r.kod }, MUAYENE_EKI_DURUMU[r.kod])
  return cevap({ id: r.id })
})

export const DELETE = sinirda('muayene-ek DELETE', async (req: NextRequest) => {
  if (!ozellikAcik('muayeneEkleri')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  const r = await muayeneEkiSil(oturum.supabase, oturum.user.id, g.id)
  if (!r.tamam) return cevap({ code: r.kod }, MUAYENE_EKI_DURUMU[r.kod])
  return cevap({ ok: true })
})
