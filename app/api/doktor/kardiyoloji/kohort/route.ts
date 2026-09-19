/**
 * KARDIO-EXCEPTIONAL-01 — Araçlar › Kardiyoloji kohort paneli API.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { kardioKohortVerisi, kardioHatirlatmaGonder } from '../_kohort'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  return NextResponse.json(await kardioKohortVerisi(oturum.supabase, oturum.user.id, bugun()))
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: unknown } | null
  const ids = (Array.isArray(b?.patientIds) ? b!.patientIds : []).map(String).slice(0, 50)
  if (!ids.length) return NextResponse.json({ error: 'Hasta seçin.' }, { status: 400 })
  const T = bugun()
  const { satirlar } = await kardioKohortVerisi(sb, user.id, T, ids)
  let gonderilen = 0, atlanan = 0
  for (const s of satirlar) {
    const r = await kardioHatirlatmaGonder(sb, user.id, s.patientId, s.bayraklar, T)
    if (r === 'gonderildi') gonderilen++; else atlanan++
  }
  atlanan += ids.length - satirlar.length
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
