/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — monthly edition check of the Turkish protocol library (vercel.json: 3rd of each
 * month, 02:17 UTC). Re-reads every official URL in the registry and the SB / HSGM listing pages, flags changed / new /
 * vanished editions into protokol_inceleme_kuyrugu for founder review (/kurucu/kaynaklar). Never edits the registry and
 * never notifies doctors by itself. Same auth as every cron (lib/cronYetki). Takes no patient, note or session id.
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { takipCalistir } from '@/lib/kaynaklar/protokolKutuphanesi/takipSunucu'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })
  try {
    const ozet = await takipCalistir(servisSupabase())
    console.log('[protokol-surum]', JSON.stringify(ozet))
    return NextResponse.json({ ok: true, ...ozet })
  } catch (e) {
    console.error('[protokol-surum]', e instanceof Error ? e.message : 'hata')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
