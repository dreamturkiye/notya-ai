/**
 * NOTYA-MESLEKTAS-V2 Faz 2 — 03:30 TRT rutin + 30 gün kullanım silme.
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { rutinHesaplaVeYaz } from '@/lib/doktor/ogrenme/rutinTuret'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })
  const sb = servisSupabase()
  const kesim = new Date(Date.now() - 30 * 86400000).toISOString()
  await sb.from('doktor_kullanim_olaylari').delete().lt('zaman', kesim)

  const { data: doktorlar } = await sb.from('doktor_kullanim_olaylari').select('doctor_id').gte('zaman', kesim)
  const idler = [...new Set((doktorlar || []).map((r) => String((r as { doctor_id: string }).doctor_id)))]
  let n = 0
  for (const id of idler.slice(0, 200)) {
    try { await rutinHesaplaVeYaz(sb, id); n++ } catch (e) { console.error('[rutin-cron]', id, e) }
  }
  return NextResponse.json({ ok: true, doktor: n })
}
