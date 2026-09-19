/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Kohort GET/POST.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { ccKohortVerisi, ccHatirlatmaGonder } from '../_kohort'
import type { CcKohortBayrak } from '@/specialties/cocuk-cerrahisi/engines/kohort'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const bugun = new Date().toISOString().slice(0, 10)
  const { satirlar, toplamHasta } = await ccKohortVerisi(sb, user.id, bugun)
  return NextResponse.json({ satirlar, toplamHasta })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: string[] } | null
  const ids = Array.isArray(b?.patientIds) ? b!.patientIds!.map(String).slice(0, 50) : []
  if (!ids.length) return NextResponse.json({ error: 'patientIds gerekli' }, { status: 400 })
  const bugun = new Date().toISOString().slice(0, 10)
  const { satirlar } = await ccKohortVerisi(sb, user.id, bugun, ids)
  const izinli = new Map(satirlar.map((s) => [s.patientId, s.bayraklar as CcKohortBayrak[]]))
  let gonderilen = 0, atlanan = 0
  for (const id of ids) {
    const bayraklar = izinli.get(id)
    if (!bayraklar?.length) { atlanan++; continue }
    const r = await ccHatirlatmaGonder(sb, user.id, id, bayraklar, bugun)
    if (r === 'gonderildi') gonderilen++
    else atlanan++
  }
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
