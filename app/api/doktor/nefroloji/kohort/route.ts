/**
 * NEFROLOJI-EXCEPTIONAL-01 — Kohort GET/POST.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { nefKohortVerisi, nefHatirlatmaGonder } from '../_kohort'
import type { NefKohortBayrak } from '@/specialties/nefroloji/engines/kohort'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const bugun = new Date().toISOString().slice(0, 10)
  const veri = await nefKohortVerisi(sb, user.id, bugun)
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
  const veri = await nefKohortVerisi(sb, user.id, bugun, ids)
  let gonderilen = 0
  let atlanan = 0
  for (const s of veri.satirlar) {
    if (!ids.includes(s.patientId)) continue
    const r = await nefHatirlatmaGonder(sb, user.id, s.patientId, s.bayraklar as NefKohortBayrak[], bugun)
    if (r === 'gonderildi') gonderilen++
    else atlanan++
  }
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
