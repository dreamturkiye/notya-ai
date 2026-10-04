/**
 * KONSULTASYONLAR-01 — hekimin güvendiği konsültan defteri.
 * GET liste · POST ekle · PATCH güncelle · DELETE soft-hard sil.
 * HASTA-IZOLASYON: satırlar yalnız doctor_id = oturum.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import {
  DEFTER_KOLONLARI,
  defterDogrula,
  defterListeSatiri,
  type DefterSatiri,
} from '@/lib/doktor/konsultasyonDefter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const { data, error } = await sb
    .from('konsultasyon_defter')
    .select(DEFTER_KOLONLARI)
    .eq('doctor_id', user.id)
    .order('ad_soyad', { ascending: true })
    .limit(200)
  if (error) {
    // Tablo henüz yoksa yumuşak boş liste (migration 122).
    if (/does not exist|relation/i.test(error.message)) {
      return NextResponse.json({ ok: true, defter: [], tabloHazir: false })
    }
    return NextResponse.json({ error: 'Defter yüklenemedi.' }, { status: 500 })
  }
  const satirlar = (data || []) as unknown as DefterSatiri[]
  return NextResponse.json({ ok: true, defter: satirlar.map(defterListeSatiri), tabloHazir: true })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const d = defterDogrula(b)
  if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
  const { data, error } = await sb
    .from('konsultasyon_defter')
    .insert({ doctor_id: user.id, ...d.girdi, updated_at: new Date().toISOString() })
    .select(DEFTER_KOLONLARI)
    .maybeSingle()
  if (error || !data) {
    if (error && /does not exist|relation/i.test(error.message)) {
      return NextResponse.json({ error: 'Defter henüz hazır değil — kısa süre içinde açılacak.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Konsültan kaydedilemedi.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, kayit: defterListeSatiri(data as unknown as DefterSatiri) }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const id = String(b?.id || '')
  if (!id) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  const d = defterDogrula(b)
  if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
  const { data, error } = await sb
    .from('konsultasyon_defter')
    .update({ ...d.girdi, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('doctor_id', user.id)
    .select(DEFTER_KOLONLARI)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  return NextResponse.json({ ok: true, kayit: defterListeSatiri(data as unknown as DefterSatiri) })
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const id = String(req.nextUrl.searchParams.get('id') || '')
  if (!id) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  const { error, count } = await sb
    .from('konsultasyon_defter')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('doctor_id', user.id)
  if (error || !count) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
