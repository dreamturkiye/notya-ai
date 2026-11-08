/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — GET /api/kurucu/ozet: the founder console's data (app/kurucu/page.tsx).
 *
 *   200 KurucuKonsolVerisi   only for a session whose e-mail is on FOUNDER_EMAILS (lib/kurucu/erisim.ts)
 *   404                      everyone else (no token, bad token, any other account) — the same answer as no route at all
 *
 * Read-only. Doctor-account metadata and counts only; no patient field leaves (lib/kurucu/tipler.ts). Takes no id from
 * the request. Country data comes from each country build's signed endpoint, never from their databases' keys.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { konsolVerisiTopla, ulkeIstatistigiCek } from '@/lib/kurucu/konsol'
import { trKurucuVerisi } from '@/lib/kurucu/trVeri'
import { stripeDonusumuOku } from '@/lib/kurucu/stripeDonusum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = servisSupabase()
  const kurucu = await kurucuOturumu(req, supabase)
  if (!kurucu) return yokCevabi()
  const veri = await konsolVerisiTopla({
    tr: () => trKurucuVerisi(supabase),
    ulke: (ulke, taban) => ulkeIstatistigiCek(ulke, taban),
    stripe: () => stripeDonusumuOku(),
  })
  return NextResponse.json(veri, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}
