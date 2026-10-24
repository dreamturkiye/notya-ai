/**
 * NOTYA-ULKE-EKLER-01 — /api/ulke/not/belge: documents added to a DRAFT note after it was written.
 *
 *   POST { notId, ekler: [{ belgeId, tur, sinavZamani, ozet, bulgular, acil }] }
 *        the evaluations are merged into the note's findings section in ONE write (labelled blocks, "Ultrasound 2/3",
 *        idempotent per document id: sending a document again replaces its own block)
 *        200 { o, eklendi }            the findings section as saved
 *        400 { code: 'BOS' | 'GECERSIZ' }   nothing usable was sent / the section would be too long
 *        409 { code: 'ONAYLI' }        the note is approved: it is not changed
 *        404 { code: 'NOT_FOUND' }     no such note FOR THIS DOCTOR
 *   401 { code: 'OTURUM_YOK' }   404 (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the note id is read with the authenticated doctor's id in the same query, and the write carries
 * the doctor's id and `approved_at IS NULL` again (lib/ulke/uygulama/notlar.ts → notBelgeEkle). Codes only.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { notBelgeEkle } from '@/lib/ulke/uygulama/notlar'
import { NOT_DURUMU } from '@/lib/ulke/uygulama/notDurumu'

export const dynamic = 'force-dynamic'

export const POST = sinirda('not belge POST', async (req: NextRequest) => {
  // AU-LAUNCH-01: no document / image reading results where the pack leaves that feature off.
  if (!ozellikAcik('cekirdekMuayene') || !ozellikAcik('goruntuDegerlendirme')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await notBelgeEkle(oturum.supabase, oturum.user.id, g.notId, g.ekler)
  if (!r.tamam) return cevap({ code: r.kod }, NOT_DURUMU[r.kod])
  return cevap({ o: r.o, eklendi: r.eklendi })
})
