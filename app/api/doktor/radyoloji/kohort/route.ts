/**
 * RADYOLOJI-EXCEPTIONAL-01 — Kohort API. Hasta izolasyonu: yalnız doctor_id kapsamı.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { radyoKohortVerisi, radyoHatirlatmaGonder } from '../_kohort'
import type { RadyoKohortBayrak } from '@/specialties/radyoloji/engines/kohort'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const bugun = new Date().toISOString().slice(0, 10)
  const veri = await radyoKohortVerisi(sb, user.id, bugun)
  return NextResponse.json(veri)
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: string[] } | null
  const ids = Array.isArray(b?.patientIds) ? b!.patientIds.map(String).slice(0, 50) : []
  if (!ids.length) return NextResponse.json({ error: 'patientIds gerekli' }, { status: 400 })
  const bugun = new Date().toISOString().slice(0, 10)
  const izinli = await radyoKohortVerisi(sb, user.id, bugun, ids)
  const map = new Map(izinli.satirlar.map((s) => [s.patientId, s.bayraklar as RadyoKohortBayrak[]]))
  let gonderilen = 0, atlanan = 0
  for (const id of ids) {
    const bayraklar = map.get(id)
    if (!bayraklar) { atlanan++; continue }
    const r = await radyoHatirlatmaGonder(sb, user.id, id, bayraklar, bugun)
    if (r === 'gonderildi') gonderilen++
    else atlanan++
  }
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
