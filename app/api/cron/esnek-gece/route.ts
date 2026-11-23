/**
 * ESNEK-MUAYENE-B2 — gece öğrenme turu, 03:40 TRT (vercel.json crons; SEC-CRON-01: cronYetkiliMi only). For each doctor with
 * something to learn from: candidates → regression test against his own past approved notes → only what breaks nothing is
 * activated. Time-boxed; a doctor not reached tonight is reached tomorrow (candidates persist).
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { geceDoktorlari, geceTuru } from '@/lib/esnek/gece'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })
  const sb = servisSupabase()
  const bas = Date.now()
  const doktorlar = await geceDoktorlari(sb)
  let n = 0, aktif = 0, kirdi = 0, geriDonen = 0
  for (const id of doktorlar.slice(0, 300)) {
    if (Date.now() - bas > 250_000) break
    try { const r = await geceTuru(sb, id); n++; aktif += r.aktif; kirdi += r.kirdi; geriDonen += r.geriDonen } catch (e) { console.error('[esnek-gece]', e instanceof Error ? e.name : 'hata') }
  }
  return NextResponse.json({ ok: true, doktor: n, toplam: doktorlar.length, aktif, kirdi, geriDonen })
}
