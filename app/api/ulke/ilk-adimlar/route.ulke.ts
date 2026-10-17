/**
 * YENI-DOKTOR-UX-2026-10 — GET /api/ulke/ilk-adimlar: the first-run checklist of the home, in one request.
 *
 *   200 { hasta: boolean, muayene: boolean, randevu: boolean | null, yeniHesap: boolean }
 *       `randevu` is null where the country has no appointments. `yeniHesap`: fewer than 3 visits —
 *       an account past that never sees the card.
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md): takes no id from the request; every count is
 * bound to the authenticated doctor's id AND to this build's country (ulkeTablosu), and only booleans leave.
 * A failed count reports the step as done rather than nudging the doctor over uncertainty.
 */
import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { ulkeTablosu } from '@/lib/ulke/uygulama/tablolar'

export const dynamic = 'force-dynamic'

/** Up to `kadar` of the doctor's own rows — enough for "any?" and for the 3-visit threshold, never the whole table. */
async function sayi(supabase: SupabaseClient, tablo: 'ulke_hastalar' | 'ulke_muayeneler' | 'ulke_randevulari', doktorId: string, kadar: number): Promise<number> {
  try {
    const { data, error } = await ulkeTablosu(supabase, tablo).select('id').eq('doctor_id', doktorId).limit(kadar)
    return error || !Array.isArray(data) ? Number.MAX_SAFE_INTEGER : data.length
  } catch {
    return Number.MAX_SAFE_INTEGER
  }
}

export const GET = sinirda('first-steps GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const { supabase, user } = oturum
  const randevuVar = ozellikAcik('randevu')
  const [hasta, muayene, randevu] = await Promise.all([
    sayi(supabase, 'ulke_hastalar', user.id, 1),
    sayi(supabase, 'ulke_muayeneler', user.id, 3),
    randevuVar ? sayi(supabase, 'ulke_randevulari', user.id, 1) : Promise.resolve(null),
  ])
  return cevap({
    hasta: hasta > 0,
    muayene: muayene > 0,
    randevu: randevu === null ? null : randevu > 0,
    yeniHesap: muayene < 3,
  })
})
