/**
 * HASTA-PORTALI-GUNLUK — KVKK rights over the patient's own home entries. PIN unlock required.
 *   GET ?bicim=json|csv → download everything the patient entered (readings, dose marks, own medicines, alerts, badges,
 *                         questions, preferences) — JSON, or the readings as CSV.
 *   DELETE { onay: 'SIL' } → delete all of it (the doctor's own thresholds stay; consent is withdrawn).
 * HASTA-IZOLASYON: every query carries the token's doctor_id + patient_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { portalKapsami, sonucYaniti } from '@/lib/saglikEvi/portalKapisi'
import { olcumlerCsv, veriDisaAktar, veriSil } from '@/lib/saglikEvi/sunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const veri = await veriDisaAktar(g.sb, g.kapsam)
  const gun = new Date().toISOString().slice(0, 10)
  if (req.nextUrl.searchParams.get('bicim') === 'csv') {
    return new NextResponse('﻿' + olcumlerCsv(veri.ev_olcumleri || []), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="saglikim-olcumler-${gun}.csv"`, 'cache-control': 'no-store' } })
  }
  return new NextResponse(JSON.stringify({ disaAktarim: gun, ...veri }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="saglikim-verilerim-${gun}.json"`, 'cache-control': 'no-store' } })
}

export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const b = (await req.json().catch(() => null)) as { onay?: unknown } | null
  if (b?.onay !== 'SIL') return NextResponse.json({ error: 'Silmek için onay gerekli.' }, { status: 422 })
  return sonucYaniti(await veriSil(g.sb, g.kapsam))
}
