/**
 * GET /api/ulke/raporlar — the signed-in doctor's own practice numbers (Türkiye: Raporlar).
 *   200 { rapor: RaporOzeti }   401 { code: 'OTURUM_YOK' }   404 (feature off)   500 { code: 'BASARISIZ' }
 * Takes no id from the request: everything is counted by the authenticated doctor's id (lib/ulke/uygulama/raporlar.ts).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { raporOzeti } from '@/lib/ulke/uygulama/raporlar'

export const dynamic = 'force-dynamic'

export const GET = sinirda('reports GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const rapor = await raporOzeti(oturum.supabase, oturum.user.id)
  if (!rapor) return KOD.basarisiz()
  return cevap({ rapor })
})
