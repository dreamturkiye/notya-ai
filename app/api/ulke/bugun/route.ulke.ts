/**
 * NOTYA-UZ-MUAYENE-01 — GET /api/ulke/bugun: the caller's own visits of today (the country's day), for the home.
 *
 *   200 { muayeneler: [{ seansId, notId, hastaId, hastaAdi, baslangic, durum }] }
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * Takes no id from the request: everything is read by the authenticated doctor's id (lib/ulke/uygulama/muayeneler.ts).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { bugunkuMuayeneler } from '@/lib/ulke/uygulama/muayeneler'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const muayeneler = await bugunkuMuayeneler(oturum.supabase, oturum.user.id)
  if (!muayeneler) return KOD.basarisiz()
  return cevap({ muayeneler })
}
