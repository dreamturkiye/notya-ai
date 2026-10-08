/**
 * NOTYA-UZ-MUAYENE-01 — /api/ulke/muayene: a visit of the caller.
 *
 *   POST { yol, hastaId, sablon, riza: true, randevuId? }
 *        The recording at `yol` (uploaded by the browser to the caller's own folder of the recordings bucket) is
 *        transcribed and removed; the visit is stored with its transcript and its language record.
 *        200 { seansId, ikinciGecis, dusukGuven, randevuBagli }
 *        `randevuId` (NOTYA-UZ-RANDEVU-01): the appointment the visit is started from — it must be the caller's and for
 *        this patient (anything else: 404, before the recording is read); the stored visit is then linked to it.
 *        400 { code: 'RIZA_GEREKLI' }           the recording-consent box was not ticked
 *        400 { code: 'GECERSIZ', alan }         a path outside the caller's folder, or an unknown template
 *        404 { code: 'NOT_FOUND' }              no such patient FOR THIS DOCTOR (another doctor's patient: the same)
 *        422 { code: 'KISA_KAYIT' }             not enough speech in the recording
 *        429 { code: 'LIMIT' }                  the day's ceiling is reached
 *        502 { code: 'SES_OKUNAMADI' }          the recording could not be read or transcribed
 *        503 { code: 'HAZIR_DEGIL' }            speech recognition is not configured in this deployment
 *
 *   GET ?id=<seansId>
 *        200 { muayene: { seansId, baslangic, sablon, metin, hasta, notId, notDurumu, konusma } }
 *        404 { code: 'NOT_FOUND' }              no such visit FOR THIS DOCTOR
 *
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the patient id and the recording path come from the body, the visit id from the address; each
 * is proven to be the authenticated doctor's before anything is read or written with it
 * (lib/ulke/uygulama/muayeneKaydi.ts). Codes only — never a sentence, never an error's own text.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { muayeneGetir, muayeneKaydet, type MuayeneRetKodu } from '@/lib/ulke/uygulama/muayeneKaydi'

export const dynamic = 'force-dynamic'
// Two transcription passes of a long recording at most; the platform must not cut the request before they finish.
export const maxDuration = 300

const DURUM: Record<MuayeneRetKodu, number> = { RIZA_GEREKLI: 400, GECERSIZ: 400, NOT_FOUND: 404, KISA_KAYIT: 422, LIMIT: 429, SES_OKUNAMADI: 502, HAZIR_DEGIL: 503, BASARISIZ: 500 }

export const POST = sinirda('muayene POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await muayeneKaydet(oturum.supabase, oturum.user.id, {
    yol: metinAlani(g.yol, 200),
    hastaId: g.hastaId,
    sablon: metinAlani(g.sablon, 40),
    riza: g.riza === true,
    // NOTYA-UZ-RANDEVU-01: a malformed appointment id is the same "not found" as a foreign one.
    randevuId: g.randevuId === undefined || g.randevuId === null ? null : uuidMi(g.randevuId) ? g.randevuId : 'x',
  })
  if (!r.tamam) return cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, DURUM[r.kod])
  return cevap({ seansId: r.seansId, ikinciGecis: r.ikinciGecis, dusukGuven: r.dusukGuven, randevuBagli: r.randevuBagli })
})

export const GET = sinirda('muayene GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  const muayene = await muayeneGetir(oturum.supabase, oturum.user.id, id)
  if (!muayene) return KOD.yok()
  return cevap({ muayene })
})
