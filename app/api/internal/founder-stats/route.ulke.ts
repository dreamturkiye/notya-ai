/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — GET /api/internal/founder-stats: this country's doctor-account summary for the
 * founder console on the Türkiye build. The Türkiye project never holds this database's keys; it signs each request
 * with the shared secret FOUNDER_STATS_SECRET instead (lib/kurucu/imza.ts).
 *
 *   200 KurucuUlkeYaniti   a valid signature for THIS country, at most 5 minutes old, not seen before
 *   404                    anything else (no secret configured, missing/bad/expired/replayed signature) — no hint why
 *   429                    more than 20 calls in 5 minutes from one address (per instance)
 *
 * ZIYARET-SAYACI-01 (2026-11-10): the answer also carries this build's public-site visit summary (`ziyaret`, aggregated in
 * SQL by site_visit_stats, migration 194; null when the counter is not installed) and `denemeVar` (whether this build runs
 * a trial model), read in parallel with the accounts.
 *
 * Doctor-account metadata and aggregate counts only; never a patient field (lib/ulke/kurucu/kurucuUlke.ts). Takes no id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { imzaDogrula, IMZA_BASLIGI, sinirlayici } from '@/lib/kurucu/imza'
import { ulkeKurucuVerisi } from '@/lib/ulke/kurucu/kurucuUlke'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { aktifUlke } from '@/lib/ulke/ulke'
import { ziyaretOzetiOku } from '@/lib/ziyaret/depo'
export const dynamic = 'force-dynamic'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const sinir = sinirlayici(20, 5 * 60 * 1000)

export async function GET(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'yok'
  if (!sinir.izinli(ip)) return NextResponse.json({ code: 'COK_DENEME' }, { status: 429, headers: BASLIK })
  const imza = imzaDogrula(process.env.FOUNDER_STATS_SECRET, req.headers.get(IMZA_BASLIGI), aktifUlke())
  if (!imza.ok) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404, headers: BASLIK })
  try {
    const supabase = ulkeServisSupabase()
    const [veri, ziyaret] = await Promise.all([ulkeKurucuVerisi(supabase), ziyaretOzetiOku(supabase, aktifUlke())])
    return NextResponse.json({ ...veri, ziyaret, denemeVar: false }, { headers: BASLIK })
  } catch (e) {
    console.error('[internal/founder-stats] failed', e instanceof Error ? e.name : 'error')
    return NextResponse.json({ code: 'BASARISIZ' }, { status: 500, headers: BASLIK })
  }
}
