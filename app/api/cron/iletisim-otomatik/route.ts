/**
 * NOTYA-ILETISIM-04 — daytime sweep of the Hazır mesajlar queue: every 10 minutes, 07:00–21:00 TRT (vercel.json).
 *
 * Sends what can go automatically from each doctor's OWN connected WhatsApp / mailbox: items enqueued since the
 * last run (Sağlığım'da yeni mesaj from the ~35 notifyPatientNewPracticeMessage callers, bookings for tomorrow
 * made after the 07:00 randevu run) and items of a doctor who connected an account during the day. The enqueue
 * triggers themselves stay fast and never wait on Google / Microsoft / Meta.
 *
 * The rules (only non-clinical types, consent per channel, at most one automatic attempt per item, WhatsApp →
 * e-posta, quiet hours, one doctor's error never blocks the rest) live in lib/iletisim/otomatikGonderim.ts.
 * Does nothing until migration 098 is applied and a doctor has connected an account.
 * No asilar read or write here (lib/asi/hatirlatma.test.ts): vaccine reminders are never automatic.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { otomatikGonder } from '@/lib/iletisim/otomatikGonderim'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  // SEC-CRON-01: Vercel's Bearer CRON_SECRET (or ?secret= by hand), never the spoofable x-vercel-cron header.
  if (!cronYetkiliMi(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }
  const ozet = await otomatikGonder(servisSupabase(), { sureButcesiMs: 45_000 })
  return NextResponse.json({ calisma_zamani: new Date().toISOString(), ...ozet })
}
