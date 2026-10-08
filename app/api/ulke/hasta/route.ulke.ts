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
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { hastaGetir } from '@/lib/ulke/uygulama/hastalar'
import { hastaninMuayeneleri } from '@/lib/ulke/uygulama/muayeneler'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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
}
