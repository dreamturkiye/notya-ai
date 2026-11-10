/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — POST /api/internal/visit in a country build: one page view of a PUBLIC page,
 * sent by components/ziyaret/ZiyaretSayaci.tsx (navigator.sendBeacon). The same handler as Türkiye's
 * app/api/internal/visit/route.ts; public by design (a visitor has no session), under /api/internal/ because every pack
 * already opens that prefix. Bound to this build's country (aktifUlke) and this build's own database.
 *
 *   204   always — counted, or dropped (bot, not a public page, malformed, rate-limited, database down); no body, no hint.
 *
 * No cookie is read or set. The raw IP and user agent are used only inside the daily-salted hash (lib/ziyaret/ziyaret.ts)
 * and are never stored or logged. One database round trip per page view (site_visit_record, migration 194).
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { aktifUlke } from '@/lib/ulke/ulke'
import { istemciIp, tuzOnbellegi, ziyaretIsle } from '@/lib/ziyaret/ziyaret'
import { ziyaretDeposu } from '@/lib/ziyaret/depo'

export const dynamic = 'force-dynamic'

let istemci: SupabaseClient | null = null
const sb = () => (istemci ??= ulkeServisSupabase())
const depo = ziyaretDeposu(sb)
const tuz = tuzOnbellegi((u, g) => depo.tuzAl(u, g))
const BOS = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') || 0) > 1024) return BOS()
  const govde = await req.text().catch(() => '')
  await ziyaretIsle(
    { ua: req.headers.get('user-agent'), ip: istemciIp(req.headers), host: req.headers.get('host') || '', govde },
    { tuzAl: (u, g) => tuz.al(u, g), kaydet: (k) => depo.kaydet(k) },
    { ulke: aktifUlke() },
  )
  return BOS()
}
