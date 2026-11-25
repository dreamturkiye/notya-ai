/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — the doctor's Kaynak kütüphanesi (/dashboard/doktor/kaynaklar).
 *
 *   GET  ?brans=<one of the 40 keys>  → registry documents of that branş (default: the doctor's own branş) + the branş picker
 *                                       + this branş's reviewed new-edition announcements of the last 90 days
 *   POST { duyuruId }                 → marks one announcement seen for THIS doctor (session id; never a body id)
 *
 * No patient, note or session id anywhere. All 30 medical branşlar + 10 Özel Branşlar (core feature).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { kutuphaneGorunumu } from '@/lib/kaynaklar/protokolKutuphanesi/kutuphane'
import { bransKoduCoz, duyuruGoruldu, DUYURU_PENCERESI_GUN } from '@/lib/kaynaklar/protokolKutuphanesi/duyuru'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data: profil } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
  const gorunum = kutuphaneGorunumu(bransKoduCoz(String(profil?.specialty || '')), req.nextUrl.searchParams.get('brans'))
  let duyurular: unknown[] = []
  try {
    const esik = new Date(Date.now() - DUYURU_PENCERESI_GUN * 86400_000).toISOString()
    const { data } = await supabase
      .from('protokol_surum_duyurulari')
      .select('id, belge_id, baslik, surum, yil, url, yayin_at')
      .contains('branslar', [gorunum.secili])
      .gte('yayin_at', esik)
      .order('yayin_at', { ascending: false })
      .limit(20)
    duyurular = data || []
  } catch {
    // Migration 206 yoksa duyuru yok.
  }
  return NextResponse.json({ ...gorunum, duyurular }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const b = (await req.json().catch(() => null)) as { duyuruId?: unknown } | null
  const id = typeof b?.duyuruId === 'string' ? b.duyuruId : ''
  if (!(await duyuruGoruldu(oturum.supabase, oturum.user.id, id))) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
