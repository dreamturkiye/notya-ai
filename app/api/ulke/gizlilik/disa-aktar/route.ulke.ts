/**
 * AU-MKT-06 — /api/ulke/gizlilik/disa-aktar: the doctor downloads ONE patient's data as JSON to answer an access request
 * (APP 12). Doctor's session only; the patient is read with the doctor's id, so another doctor's patient answers 404.
 *   GET ?hastaId=<uuid>   200 application/json (attachment)   400 GECERSIZ   401 OTURUM_YOK   404 NOT_FOUND
 * Nothing is sent anywhere: the doctor decides how the file reaches the patient. Initial compliance draft – external legal review later.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { hastaVerisi } from '@/lib/ulke/gizlilik/disaAktar'

export const dynamic = 'force-dynamic'

export const GET = sinirda('gizlilik disa-aktar GET', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.gizlilik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const hastaId = req.nextUrl.searchParams.get('hastaId')
  if (!uuidMi(hastaId)) return KOD.gecersiz('hastaId')
  const veri = await hastaVerisi(oturum.supabase, oturum.user.id, hastaId)
  if (!veri) return KOD.yok()
  return new Response(JSON.stringify(veri, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="patient-data-export.json"', 'cache-control': 'no-store' },
  })
})
