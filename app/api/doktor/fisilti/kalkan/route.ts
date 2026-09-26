/**
 * NOTYA-KALKAN-01 — Fısıltı Onayla / Düzelt. Sekreter 403. Başka hekimin taslağı 404.
 * Onaysız çağrı kartı değiştirmez (belirsiz → 409, ilaç satırı durur).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { kalkanDuzelt, kalkanOnayla } from '@/lib/iletisim/kalkan/onayla'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const hastaId = req.nextUrl.searchParams.get('hastaId') || ''
  if (!hastaId) return NextResponse.json({ taslaklar: [] })
  const { data: hasta, error: hata } = await oturum.supabase.from('patients').select('id').eq('id', hastaId).eq('doctor_id', oturum.doktorId).maybeSingle()
  if (hata && tabloYokMu(hata)) return NextResponse.json({ taslaklar: [] })
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const { data, error } = await oturum.supabase.from('wa_taslak').select('id, metin, emin, eylem, kapsam, ilac_id, zaman').eq('doctor_id', oturum.doktorId).eq('patient_id', hastaId).eq('durum', 'bekliyor').order('zaman', { ascending: true })
  if (error) {
    if (tabloYokMu(error)) return NextResponse.json({ taslaklar: [] })
    return NextResponse.json({ error: 'Taslaklar alınamadı.' }, { status: 503 })
  }
  return NextResponse.json({ taslaklar: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const b = (await req.json().catch(() => null)) as { islem?: string; taslakId?: string; kapsam?: string; ilacId?: string } | null
  if (!b?.taslakId) return NextResponse.json({ error: 'Eksik istek.' }, { status: 400 })
  try {
    const sonuc = b.islem === 'duzelt'
      ? await kalkanDuzelt(oturum.supabase, { doktorId: oturum.doktorId, taslakId: b.taslakId, kapsam: b.kapsam, ilacId: b.ilacId })
      : await kalkanOnayla(oturum.supabase, { doktorId: oturum.doktorId, taslakId: b.taslakId, kapsam: b.kapsam, ilacId: b.ilacId })
    if (sonuc.durum === 'yok') return NextResponse.json({ error: 'Taslak bulunamadı.' }, { status: 404 })
    if (sonuc.durum === 'belirsiz') return NextResponse.json({ error: 'Önce ilaç ve kapsam seçilmeli.' }, { status: 409 })
    return NextResponse.json({ ok: true, durum: sonuc.durum })
  } catch (e) {
    if (tabloYokMu(e)) return NextResponse.json({ error: 'Bu kayıt henüz açılamıyor.' }, { status: 503 })
    console.error('[kalkan-onay]', e instanceof Error ? e.message : 'bilinmeyen')
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 503 })
  }
}
