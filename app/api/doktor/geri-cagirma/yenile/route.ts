/**
 * GERI-CAGIRMA-01 — background refresh of the stored counters: recomputes the doctor's due list and attribution and
 * stores the results. Called by the home card AFTER the page has rendered, and only when the stored number is stale
 * (lib/geriCagirma/sayac.ts BAYAT_MS) — never on the page's own load path. doktor + personel. No patient id accepted,
 * no patient data returned.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { adaylariTopla } from '@/lib/geriCagirma/kaynak'
import { ozetOku, sayaclariYenile } from '@/lib/geriCagirma/sayac'
import { ATIF_PENCERESI_GUN } from '@/lib/geriCagirma/tipler'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const once = await ozetOku(supabase, doktorId)
  // Not installed, or another tab refreshed a moment ago: answer from the stored rows.
  if (!once.kurulu || !once.bayat) return NextResponse.json({ ...once, atifPenceresiGun: ATIF_PENCERESI_GUN })
  const { liste } = await adaylariTopla(supabase, doktorId, {})
  if (liste.kurulu) await sayaclariYenile(supabase, doktorId, { cagrilabilir: liste.adaylar.length }).catch(() => false)
  return NextResponse.json({ ...(await ozetOku(supabase, doktorId)), atifPenceresiGun: ATIF_PENCERESI_GUN }, { headers: { 'Cache-Control': 'no-store' } })
}
