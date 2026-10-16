/**
 * WHATSAPP-API-01 — hourly WhatsApp maintenance (vercel.json): number health + messaging tier, expired tokens, templates,
 * stuck outbound attempts, e-posta fallback for failed deliveries, audit-log retention. Logic: lib/iletisim/whatsapp/bakim.ts.
 * SEC-CRON-01: only Vercel's Bearer CRON_SECRET (or ?secret= by hand). Takes no id from the request.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { bakimCalistir } from '@/lib/iletisim/whatsapp/bakim'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  const ozet = await bakimCalistir(servisSupabase(), { sureButcesiMs: 45_000 })
  return NextResponse.json({ calisma_zamani: new Date().toISOString(), ...ozet })
}
