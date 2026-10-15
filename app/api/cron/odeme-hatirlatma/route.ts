/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 — daily sweep: every doctor with the accounting module enabled,
 * find invoices that just aged into a new reminder tier (31-60 / 61-90+, lib/accounting/ar/
 * reminders.ts) and write DRAFT rows into the existing iletisim queue for a human to review and
 * send. Never sends anything itself — see that file's header for exactly why that is structurally
 * true, not just this route's intent. Scheduled once daily (vercel.json); aging buckets are by
 * calendar day, so running more often would not find anything new.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { sweepPaymentReminders } from '@/lib/accounting/ar/reminderSweep'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }
  const ozet = await sweepPaymentReminders(servisSupabase())
  return NextResponse.json({ calisma_zamani: new Date().toISOString(), ...ozet })
}
