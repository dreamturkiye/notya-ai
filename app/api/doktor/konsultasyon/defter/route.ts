/**
 * KONSULTASYONLAR-01/02 — hekimin güvendiği konsültan defteri.
 * GET liste · POST ekle · PATCH güncelle · DELETE sil.
 * Hekim ve sekreter aynı pratik defterini görür (pratikOturum.doktorId).
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import {
  DEFTER_KOLONLARI,
  defterDogrula,
  defterListeSatiri,
  type DefterSatiri,
} from '@/lib/doktor/konsultasyonDefter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ESKI_KOLONLAR =
  'id, doctor_id, ad_soyad, brans, telefon, adres, eposta, whatsapp, kurum_ici, not_metni, created_at, updated_at'

function kolonYokMu(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(error.code || ''))) return true
  return /does not exist|relation|schema cache|could not find the/i.test(String(error.message || ''))
}

async function defterSelect(sb: SupabaseClient, doktorId: string) {
  const tam = await sb
    .from('konsultasyon_defter')
    .select(DEFTER_KOLONLARI)
    .eq('doctor_id', doktorId)
    .order('ad_soyad', { ascending: true })
    .limit(200)
  if (!tam.error || !kolonYokMu(tam.error)) return tam
  return sb
    .from('konsultasyon_defter')
    .select(ESKI_KOLONLAR)
    .eq('doctor_id', doktorId)
    .order('ad_soyad', { ascending: true })
    .limit(200)
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { data, error } = await defterSelect(oturum.supabase, oturum.doktorId)
  if (error) {
    if (kolonYokMu(error)) {
      return NextResponse.json({ ok: true, defter: [], tabloHazir: false })
    }
    return NextResponse.json({ error: 'Defter yüklenemedi.' }, { status: 500 })
  }
  const satirlar = (data || []) as unknown as DefterSatiri[]
  return NextResponse.json({ ok: true, defter: satirlar.map(defterListeSatiri), tabloHazir: true })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const d = defterDogrula(b)
  if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
  const { data, error } = await oturum.supabase
    .from('konsultasyon_defter')
    .insert({ doctor_id: oturum.doktorId, ...d.girdi, updated_at: new Date().toISOString() })
    .select(DEFTER_KOLONLARI)
    .maybeSingle()
  if (error || !data) {
    if (error && kolonYokMu(error)) {
      // ofis_telefon henüz yoksa eski kolonlarla dene
      const { ofis_telefon: _o, ...eski } = d.girdi
      const tekrar = await oturum.supabase
        .from('konsultasyon_defter')
        .insert({ doctor_id: oturum.doktorId, ...eski, updated_at: new Date().toISOString() })
        .select(ESKI_KOLONLAR)
        .maybeSingle()
      if (tekrar.error || !tekrar.data) {
        if (tekrar.error && /does not exist|relation/i.test(tekrar.error.message)) {
          return NextResponse.json({ error: 'Defter henüz hazır değil — kısa süre içinde açılacak.' }, { status: 503 })
        }
        return NextResponse.json({ error: 'Konsültan kaydedilemedi.' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, kayit: defterListeSatiri(tekrar.data as unknown as DefterSatiri) }, { status: 201 })
    }
    return NextResponse.json({ error: 'Konsültan kaydedilemedi.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, kayit: defterListeSatiri(data as unknown as DefterSatiri) }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const id = String(b?.id || '')
  if (!id) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  const d = defterDogrula(b)
  if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })
  const { data, error } = await oturum.supabase
    .from('konsultasyon_defter')
    .update({ ...d.girdi, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('doctor_id', oturum.doktorId)
    .select(DEFTER_KOLONLARI)
    .maybeSingle()
  if (error || !data) {
    if (error && kolonYokMu(error)) {
      const { ofis_telefon: _o, ...eski } = d.girdi
      const tekrar = await oturum.supabase
        .from('konsultasyon_defter')
        .update({ ...eski, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('doctor_id', oturum.doktorId)
        .select(ESKI_KOLONLAR)
        .maybeSingle()
      if (tekrar.error || !tekrar.data) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
      return NextResponse.json({ ok: true, kayit: defterListeSatiri(tekrar.data as unknown as DefterSatiri) })
    }
    return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, kayit: defterListeSatiri(data as unknown as DefterSatiri) })
}

export async function DELETE(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const id = String(req.nextUrl.searchParams.get('id') || '')
  if (!id) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  const { error, count } = await oturum.supabase
    .from('konsultasyon_defter')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('doctor_id', oturum.doktorId)
  if (error || !count) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
