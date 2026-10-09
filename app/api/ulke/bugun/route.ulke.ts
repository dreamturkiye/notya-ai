/**
 * NOTYA-UZ-MUAYENE-01 — GET /api/ulke/bugun: the caller's own visits of today (the country's day), for the home.
 *
 *   200 { muayeneler: [{ seansId, notId, hastaId, hastaAdi, baslangic, durum }], randevular: [...] | null }
 *       `randevular` (NOTYA-UZ-RANDEVU-01): today's appointments in time order, with status — the home's list.
 *       null where the country has no appointments.
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * Takes no id from the request: everything is read by the authenticated doctor's id (lib/ulke/uygulama/muayeneler.ts,
 * lib/ulke/uygulama/randevular.ts).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { hesapSaatDilimi } from '@/lib/ulke/uygulama/saatDilimi'
import { bugunkuMuayeneler } from '@/lib/ulke/uygulama/muayeneler'
import { randevulariListele } from '@/lib/ulke/uygulama/randevular'

export const dynamic = 'force-dynamic'

export const GET = sinirda('bugun GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const muayeneler = await bugunkuMuayeneler(oturum.supabase, oturum.user.id)
  if (!muayeneler) return KOD.basarisiz()
  if (!ozellikAcik('randevu')) return cevap({ muayeneler, randevular: null })
  // "Today" is the account's own day (its time zone, one of the pack's list).
  const randevular = await randevulariListele(oturum.supabase, oturum.user.id, ulkeGunu(new Date(), await hesapSaatDilimi(oturum.supabase, oturum.user.id)), 1)
  if (!randevular) return KOD.basarisiz()
  return cevap({ muayeneler, randevular })
})
