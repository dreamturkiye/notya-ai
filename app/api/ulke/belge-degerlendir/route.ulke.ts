/**
 * NOTYA-ULKE-EKLER-01 — /api/ulke/belge-degerlendir: the "add documents" step reads ONE document of a visit.
 *
 *   POST { seansId, tur: 'auto' | <type>, base64 }
 *        base64 = the browser's MASKED copy of one image (JPEG / PNG / WebP, at most ~2.4 MB)
 *        200 { sonuc: { tur, kalite, sinavZamani, ozet, bulgular, acil } }      nothing is stored
 *        400 { code: 'GECERSIZ' }                 not an image of the allowed kind / size, or an unknown type
 *        404 { code: 'NOT_FOUND' }                the visit is not this doctor's
 *        422 { code: 'DUSUK_KALITE' }             the image could not be read (blurred, cropped, not a document)
 *        502 { code: 'DEGERLENDIRILEMEDI' }       the reader gave no usable answer
 *        503 { code: 'HAZIR_DEGIL' }              the country has no clinical pack here
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the visit id is matched against the authenticated doctor in the same statement before
 * anything is read or sent (lib/ulke/belgeler/belgeDegerlendir.ts). Codes only — never a sentence, never an error's text.
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { BELGE_DURUMU, belgeDegerlendir } from '@/lib/ulke/belgeler/belgeDegerlendir'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export const POST = sinirda('belge-degerlendir POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.seansId)) return KOD.yok()
  const r = await belgeDegerlendir(oturum.supabase, oturum.user.id, { seansId: g.seansId, tur: g.tur, base64: g.base64 }, rotaButcesiMs(maxDuration))
  if (!r.tamam) return cevap({ code: r.kod }, BELGE_DURUMU[r.kod])
  return cevap({ sonuc: r.sonuc })
})
