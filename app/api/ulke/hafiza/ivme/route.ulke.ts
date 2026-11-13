/**
 * AYSE-OGRENME-V3f — GET /api/ulke/hafiza/ivme: the doctor's learning momentum, the country's version of Türkiye's
 * /api/doktor/hafiza/ivme.
 *
 *   200 { ivme, haftalik }   ivme: { yeterli, n, seri, ilkOrtalama, sonOrtalama, yon }; haftalik: the last-7-days summary or null
 *                            Fewer than 3 approved notes: `yeterli: false` (the screen shows its empty state).
 *                            The tables not on the database yet (migration 198): the same empty answer, never an error.
 *   404 { code: 'NOT_FOUND' }   the country has no signed-in application
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: takes NO id from the request. The measurements are read by the authenticated account's own id
 * and the build's country; a count is a number, never note or patient text.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { onayMetrikleriniOku } from '@/lib/ulke/ogrenme/kayit'
import { haftalikHesapla, ivmeHesapla } from '@/lib/doktor/ogrenme/ivme'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hafiza/ivme GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const metrikler = await onayMetrikleriniOku(oturum.supabase, oturum.user.id)
  return cevap({ ivme: ivmeHesapla(metrikler), haftalik: haftalikHesapla(metrikler) })
})
