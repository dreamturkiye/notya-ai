/**
 * ESNEK-MUAYENE-B2 — gece öğrenme turu, 03:40 TRT (vercel.json crons; SEC-CRON-01: cronYetkiliMi only). For each doctor with
 * something to learn from: candidates → regression test against his own past approved notes → only what breaks nothing is
 * activated. Time-boxed; a doctor not reached tonight is reached tomorrow (candidates persist).
 * ESNEK-GELISIM: then the branş lexicon proposals are refreshed (a pair confirmed by ≥ 3 doctors of the same branş →
 * proposed to the founder; abbreviation + meaning + count only — lib/elNotu/bransSozluk.ts).
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { geceDoktorlari, geceTuru } from '@/lib/esnek/gece'
import { bransOnerileriniGuncelle } from '@/lib/elNotu/bransSozluk'

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
  const brans = await bransOnerileriniGuncelle(sb).catch(() => null)
  return NextResponse.json({ ok: true, doktor: n, toplam: doktorlar.length, aktif, kirdi, geriDonen, bransOnerisi: brans })
}
