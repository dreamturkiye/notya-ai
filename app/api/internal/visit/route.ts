/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — POST /api/internal/visit: one page view of a PUBLIC page, sent by
 * components/ziyaret/ZiyaretSayaci.tsx (navigator.sendBeacon). Public by design (a visitor has no session); it lives
 * under /api/internal/ because that is the API prefix every build already opens. Country builds run the same handler
 * from route.ulke.ts.
 *
 *   204   always — counted, or dropped (bot, not a public page, malformed, rate-limited, database down). The answer
 *         carries no hint which, and never a body.
 *
 * No cookie is read or set. The raw IP and user agent are used only inside the daily-salted hash (lib/ziyaret/ziyaret.ts)
 * and are never stored or logged. One database round trip per page view (site_visit_record, migration 194).
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { istemciIp, tuzOnbellegi, ziyaretIsle } from '@/lib/ziyaret/ziyaret'
import { ziyaretDeposu } from '@/lib/ziyaret/depo'

export const dynamic = 'force-dynamic'

const ULKE = 'tr'
let istemci: SupabaseClient | null = null
const sb = () => (istemci ??= servisSupabase())
const depo = ziyaretDeposu(sb)
const tuz = tuzOnbellegi((u, g) => depo.tuzAl(u, g))
const BOS = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') || 0) > 1024) return BOS()
  const govde = await req.text().catch(() => '')
  await ziyaretIsle(
    { ua: req.headers.get('user-agent'), ip: istemciIp(req.headers), host: req.headers.get('host') || '', govde },
    { tuzAl: (u, g) => tuz.al(u, g), kaydet: (k) => depo.kaydet(k) },
    { ulke: ULKE },
  )
  return BOS()
}
