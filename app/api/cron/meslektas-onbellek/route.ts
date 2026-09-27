/**
 * NOTYA-MESLEKTAS-V2 Faz 3 — 06:00 TRT: bugünkü randevu hastalarının paketini ısıt.
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { onbellekIsin } from '@/lib/doktor/ogrenme/dosyaOnbellek'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })
  const sb = servisSupabase()
  const gun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { data } = await sb
    .from('randevular')
    .select('doktor_id, patient_id')
    .gte('baslangic', `${gun}T00:00:00+03:00`)
    .lte('baslangic', `${gun}T23:59:59+03:00`)
    .neq('durum', 'iptal')
    .not('patient_id', 'is', null)
    .limit(400)
  const gorulen = new Set<string>()
  let n = 0
  for (const r of data || []) {
    const d = String((r as { doktor_id: string }).doktor_id)
    const p = String((r as { patient_id: string }).patient_id)
    const k = `${d}:${p}`
    if (gorulen.has(k)) continue
    gorulen.add(k)
    try { await onbellekIsin(sb, d, p); n++ } catch (e) { console.error('[onbellek-cron]', e) }
  }
  return NextResponse.json({ ok: true, paket: n })
}
