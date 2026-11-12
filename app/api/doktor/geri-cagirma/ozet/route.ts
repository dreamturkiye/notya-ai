/**
 * GERI-CAGIRMA-01 — the home card's numbers. STORED COUNTERS ONLY: two keyed reads, nothing recomputed
 * (.cursor/skills/performans-butcesi-koruma). doktor + personel. No patient-derived id is accepted; no patient data
 * is returned (counts and, when recorded, an amount).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { ozetOku } from '@/lib/geriCagirma/sayac'
import { ATIF_PENCERESI_GUN } from '@/lib/geriCagirma/tipler'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const ozet = await ozetOku(oturum.supabase, oturum.doktorId)
  return NextResponse.json({ ...ozet, atifPenceresiGun: ATIF_PENCERESI_GUN }, { headers: { 'Cache-Control': 'no-store' } })
}
