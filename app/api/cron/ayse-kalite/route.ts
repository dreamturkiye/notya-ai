/**
 * AKKS — nightly cron (vercel.json: every 15 minutes 01:00–04:45 UTC; SEC-CRON-01: cronYetkiliMi only). Each invocation
 * continues the open weekly / gate run, or starts one (weekly on Sundays; a gate run whenever this build's AKKS-watched
 * prompt / model / routing hash has not been measured yet) — lib/akks/calistir.ts devamEt. Time-boxed; items on the
 * production text assistant path; nothing patient-derived. AKKS_CRON_KAPALI=1 switches it off without a deploy.
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { devamEt } from '@/lib/akks/calistir'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const preferredRegion = 'iad1'

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })
  try {
    return NextResponse.json({ ok: true, ...(await devamEt(servisSupabase(), { butceMs: 280_000, paralel: 4 })) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error && e.message.startsWith('akks:') ? e.message : 'akks failed' }, { status: 500 })
  }
}
