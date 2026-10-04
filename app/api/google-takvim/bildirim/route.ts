/**
 * NOTYA-RANDEVU-V2 PR2 — Google Calendar push notifications (events.watch). Google sends headers only.
 * Accepted only when X-Goog-Channel-ID names a stored channel AND X-Goog-Channel-Token matches its stored hash;
 * then that one doctor's calendar is imported incrementally. Always 200 quickly (Google retries otherwise);
 * a missed notification is caught up by the randevu-v2 cron.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { googleTakvimHazirMi } from '@/lib/randevu/v2/google/istemci'
import { ayniOzetMi, doktoruSenkle, jetonOzeti } from '@/lib/randevu/v2/google/senk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const kanal = req.headers.get('x-goog-channel-id') || ''
  const jeton = req.headers.get('x-goog-channel-token') || ''
  const durum = req.headers.get('x-goog-resource-state') || ''
  if (!googleTakvimHazirMi() || !kanal || !jeton) return new NextResponse(null, { status: 200 })
  const sb = servisSupabase()
  const { data: b } = await sb.from('google_takvim_baglantilari').select('doktor_id, kanal_jeton_hash').eq('kanal_id', kanal).maybeSingle()
  if (!b || !ayniOzetMi(b.kanal_jeton_hash, jetonOzeti(jeton))) return new NextResponse(null, { status: 200 })
  if (durum !== 'sync') await doktoruSenkle(sb, String(b.doktor_id), { bitis: Date.now() + 20_000, sadeceIce: true })
  return new NextResponse(null, { status: 200 })
}
