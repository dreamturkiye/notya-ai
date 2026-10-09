/**
 * NOTYA-ULKE-PORTAL-01 — /api/ulke/hasta-portali/istekler: a DOCTOR's appointment requests from patients.
 *
 *   GET                                               200 { istekler: [{ id, hastaId, hastaAdi, gunler, neden, olusturuldu }] }   not answered yet, oldest first
 *   PATCH { id, gun, saat, sureDk, yineDe?, neden? }  ACCEPTS by choosing the time: the appointment is booked and the
 *                                                     request marked accepted together.    200 { randevuId }
 *         409 { code: 'DOLU' }          the doctor already has an appointment in that time. NEVER overridable; the request is still waiting
 *         422 { code: 'MESAI_DISI' }    outside the working hours: nothing was written; the same request with `yineDe: true` books it
 *         400 { code: 'GECERSIZ', alan }   gun | saat | sure
 *   PATCH { id, red: true }                           DECLINES.                             200 { ok: true }
 *         409 { code: 'CEVAPLANDI' }    the request was answered already: nothing is changed
 *
 *   404 { code: 'NOT_FOUND' }   no such request FOR THIS DOCTOR (another doctor's: exactly the same), or feature off
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY. PATIENT ISOLATION: the request id is read and written with the authenticated doctor's id
 * in the same statement; its patient is proven the doctor's before an appointment is written (lib/ulke/portal/istek.ts).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { NEDEN_AZAMI } from '@/lib/ulke/uygulama/randevular'
import { RANDEVU_DURUMU } from '@/lib/ulke/uygulama/randevuDurumu'
import { gunCoz, saatCoz } from '@/lib/ulke/uygulama/zaman'
import { bekleyenIstekler, ISTEK_DURUMU, istekAcik, istekKabul, istekReddet, type IstekRetKodu } from '@/lib/ulke/portal/istek'

export const dynamic = 'force-dynamic'

const ret = (r: { kod: IstekRetKodu; alan?: string }) =>
  cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, r.kod === 'BEKLEYEN_VAR' || r.kod === 'CEVAPLANDI' ? ISTEK_DURUMU[r.kod] : RANDEVU_DURUMU[r.kod])

export const GET = sinirda('hasta-portali/istekler GET', async (req: NextRequest) => {
  if (!istekAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const istekler = await bekleyenIstekler(oturum.supabase, oturum.user.id)
  if (!istekler) return KOD.basarisiz()
  return cevap({ istekler: istekler.map(({ id, hastaId, hastaAdi, gunler, neden, olusturuldu }) => ({ id, hastaId, hastaAdi, gunler, neden, olusturuldu })) })
})

export const PATCH = sinirda('hasta-portali/istekler PATCH', async (req: NextRequest) => {
  if (!istekAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  if (g.red === true) {
    const r = await istekReddet(oturum.supabase, oturum.user.id, g.id)
    if (!r.tamam) return ret(r)
    return cevap({ ok: true })
  }
  const r = await istekKabul(oturum.supabase, oturum.user.id, g.id, {
    gun: gunCoz(g.gun, ulkePaketi().bicim.tarihDeseni) ?? '', saatDk: saatCoz(g.saat), sureDk: Number(g.sureDk), yineDe: g.yineDe === true, neden: metinAlani(g.neden, NEDEN_AZAMI),
  })
  if (!r.tamam) return ret(r)
  return cevap({ randevuId: r.randevuId })
})
