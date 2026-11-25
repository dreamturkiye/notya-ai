/**
 * HASTA-PORTALI-GUNLUK — scheduled work of the Sağlığım daily health home (lib/saglikEvi/hatirlatmaCron.ts).
 *   ?is=doz     every 15 min: web push for dose slots that came due and are not marked (quiet hours respected)
 *   ?is=gunluk  daily: two-missed-days nudges, kritik-medicine doctor alerts, tomorrow's Kontrol Öncesi Özet
 *   HEKIM-PUSH: the 15-minute tick also sends each doctor's morning summary once, at the start of his working hours
 *   (lib/saglikEvi/hekimBildirim.ts) — no extra Vercel cron.
 * Auth: cronYetkiliMi (CRON_SECRET). No patient id is taken from the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisIstemcisi } from '@/lib/saglikEvi/portalKapisi'
import { dozHatirlatmalari, gunlukIsler, varsayilanGonderici } from '@/lib/saglikEvi/hatirlatmaCron'
import { vapidAnahtarlari } from '@/lib/saglikEvi/push/webPush'
import { hekimSabahOzeti, varsayilanHekimGonderici } from '@/lib/saglikEvi/hekimBildirim'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const sb = servisIstemcisi()
  if (!sb) return NextResponse.json({ error: 'Yapılandırılmamış' }, { status: 500 })
  const vapid = vapidAnahtarlari()
  const is = req.nextUrl.searchParams.get('is')
  try {
    if (is === 'doz') {
      if (!vapid) return NextResponse.json({ ok: true, atlandi: 'vapid_yok' })
      const [doz, hekim] = await Promise.all([dozHatirlatmalari(sb, varsayilanGonderici(vapid)), hekimSabahOzeti(sb, varsayilanHekimGonderici())])
      return NextResponse.json({ ok: true, ...doz, hekimOzet: hekim.ozet })
    }
    if (is === 'gunluk') return NextResponse.json({ ok: true, ...(await gunlukIsler(sb, vapid ? varsayilanGonderici(vapid) : null, Date.now(), varsayilanHekimGonderici())) })
    return NextResponse.json({ error: 'is=doz|gunluk' }, { status: 400 })
  } catch (e) {
    console.error('[cron/saglik-evi]', is, (e as Error).message)
    return NextResponse.json({ error: 'Hata' }, { status: 500 })
  }
}
