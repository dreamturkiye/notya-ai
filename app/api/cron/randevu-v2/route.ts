/**
 * NOTYA-RANDEVU-V2 — appointment jobs (vercel.json, every 10 minutes 06:00–22:59 TRT).
 *
 *   1. Escalation: a request unanswered for eskalasyon_saat gets eskalasyon_at + an event; the practice list
 *      shows it in red at the top. Requests never expire silently.
 *   2. Reminder jobs re-planned for confirmed new-flow appointments moved from the existing calendar.
 *   3. Due jobs (randevu_isleri): confirmation / proposal / outcome e-mails and the day-before 10:00 and
 *      morning-of 08:00 reminders. Idempotent — each job is claimed before anything leaves; a reschedule or
 *      cancel already replaced or dropped its jobs. Quiet hours (21:00–07:00 TRT) hold e-mails until morning.
 * Only doctors whose 'Hasta Portalı Randevu' is ON ever have jobs; with it OFF this does nothing.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { eskalasyonTara, hatirlatmalariTamamla, isleriCalistir } from '@/lib/randevu/v2/sunucu'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  const baslangic = Date.now()
  const sb = servisSupabase()
  const eskalasyon = await eskalasyonTara(sb).catch(() => 0)
  const tamamlanan = await hatirlatmalariTamamla(sb).catch(() => 0)
  const isler = await isleriCalistir(sb, { limit: 200, bitis: baslangic + 45_000 })
  return NextResponse.json({ calisma_zamani: new Date().toISOString(), eskalasyon, tamamlanan, ...isler })
}
