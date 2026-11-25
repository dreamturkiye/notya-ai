/**
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25) — Ayarlar › Hasta Alanı Görünümü: how the doctor's patient portal (Sağlığım) is
 * branded. GET = the doctor's own settings + the brand inputs for the live preview; PUT = display name, accent, photo
 * on/off. Core for every branş. Isolation: only the signed-in doctor's own row (doctor_id = user.id) is read or written;
 * the request carries no doctor or patient id. Notya Klinik membership is read for the preview only (clinic name/logo).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hamMarkaOku, klinikLogoGuvenli, markaLogoUrl } from '@/lib/portal/markaSunucu'
import { hekimUnvanliSatirdan } from '@/lib/doktor/hekimAdi'
import { bransEtiketi } from '@/lib/doktor/bransAdlari'
import { vurguGecerliMi, type MarkaGirdisi } from '@/lib/portal/marka'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const h = await hamMarkaOku(supabase, user.id)
  const specialty = String(h.user?.specialty || '').trim()
  const girdi: MarkaGirdisi = {
    hekimAdi: hekimUnvanliSatirdan(h.user) || null,
    brans: specialty ? bransEtiketi(specialty) : null,
    klinikAdi: h.user?.clinic_name ? String(h.user.clinic_name) : null,
    gorunenAd: h.ayar?.gorunen_ad ? String(h.ayar.gorunen_ad) : null,
    vurgu: h.ayar?.vurgu ? String(h.ayar.vurgu) : null,
    logoUrl: markaLogoUrl(h.ayar?.logo_yol as string | null),
    fotoGoster: h.ayar ? h.ayar.foto_goster !== false : true,
    notyaKlinik: h.klinik?.name ? { ad: String(h.klinik.name), logoUrl: klinikLogoGuvenli(h.klinik.logo_url as string | null) } : null,
  }
  return NextResponse.json({ girdi, fotoVar: !!h.avatar }, { headers: { 'cache-control': 'no-store' } })
}

export async function PUT(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  const g: Record<string, unknown> = { doctor_id: user.id, updated_at: new Date().toISOString() }
  if ('gorunenAd' in b) {
    const ad = typeof b.gorunenAd === 'string' ? b.gorunenAd.replace(/\s+/g, ' ').trim() : ''
    if (ad && (ad.length < 2 || ad.length > 80)) return NextResponse.json({ error: 'Görünen ad 2–80 karakter olmalı.' }, { status: 400 })
    if (/[<>{}\\]|https?:/i.test(ad)) return NextResponse.json({ error: 'Görünen adda bağlantı veya özel karakter kullanılamaz.' }, { status: 400 })
    g.gorunen_ad = ad || null
  }
  if ('vurgu' in b) {
    if (b.vurgu !== null && !vurguGecerliMi(b.vurgu)) return NextResponse.json({ error: 'Geçersiz renk.' }, { status: 400 })
    g.vurgu = b.vurgu ?? null
  }
  if ('fotoGoster' in b) {
    if (typeof b.fotoGoster !== 'boolean') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    g.foto_goster = b.fotoGoster
  }
  const { error } = await supabase.from('hasta_alani_gorunumu').upsert(g, { onConflict: 'doctor_id' })
  if (error) return NextResponse.json({ error: 'Ayar kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
