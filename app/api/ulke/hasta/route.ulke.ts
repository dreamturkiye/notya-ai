/**
 * NOTYA-UZ-MUAYENE-01 — GET /api/ulke/hasta?id=…: one patient's file — the patient and their visits.
 *
 *   200 { hasta, muayeneler: [{ seansId, notId, baslangic, durum }] }
 *   404 { code: 'NOT_FOUND' }    no such patient FOR THIS DOCTOR (another doctor's patient answers exactly the same),
 *                                a malformed id, or the feature is off
 *   401 { code: 'OTURUM_YOK' }   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the id comes from the address, so it is matched against the authenticated doctor in the same
 * query that reads the patient (hastaGetir) BEFORE anything else is read with it.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { hastaGetir, hastaGirdisiHatasi, hastaGuncelle, type HastaGirdisi } from '@/lib/ulke/uygulama/hastalar'
import { hastaninMuayeneleri } from '@/lib/ulke/uygulama/muayeneler'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hasta GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  const hasta = await hastaGetir(oturum.supabase, oturum.user.id, id)
  if (!hasta) return KOD.yok()
  const muayeneler = await hastaninMuayeneleri(oturum.supabase, oturum.user.id, hasta.id)
  if (!muayeneler) return KOD.basarisiz()
  return cevap({ hasta, muayeneler: muayeneler.map(({ seansId, notId, baslangic, durum }) => ({ seansId, notId, baslangic, durum })) })
})

/**
 * PATCH /api/ulke/hasta?id=… replaces the identity fields of the caller's patient.
 * The id is proven (hastaGetir) before the body is judged. A foreign id is 404, the same as a missing id.
 */
export const PATCH = sinirda('hasta PATCH', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  const mevcut = await hastaGetir(oturum.supabase, oturum.user.id, id)
  if (!mevcut) return KOD.yok()
  const g = await govdeOku(req)
  const cinsiyet = metinAlani(g.cinsiyet, 10)
  const girdi: HastaGirdisi = {
    ad: metinAlani(g.ad, 160).replace(/\s+/g, ' '),
    otaIsmi: metinAlani(g.otaIsmi, 120).replace(/\s+/g, ' '),
    dogumTarihi: metinAlani(g.dogumTarihi, 10),
    cinsiyet: cinsiyet as HastaGirdisi['cinsiyet'],
    telefon: metinAlani(g.telefon, 40),
    dil: metinAlani(g.dil, 3),
    ulusalKimlik: metinAlani(g.ulusalKimlik, 40),
  }
  const hatali = hastaGirdisiHatasi(girdi)
  if (hatali) return KOD.gecersiz(hatali)
  const hasta = await hastaGuncelle(oturum.supabase, oturum.user.id, id, girdi)
  if (!hasta) return KOD.basarisiz()
  return cevap({ hasta })
})
