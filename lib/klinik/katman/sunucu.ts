/**
 * Klinik oturumu. Doktor uygulamasının pratikOturum yoluna girmez.
 * Service-role kullanır; her okuma bu klinikteki üye hekimlerle sınırlıdır.
 */
import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { varsayilanYetkiler } from './yetki'
import { varsayilanHafta, varsayilanRezervasyon } from './kurulum'

export type KlinikKaydi = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  phone: string | null
  adres: string | null
  vergi_no: string | null
  city: string | null
  seat_count: number
  seats_used: number
  owner_id: string
  calisma: unknown
  rezervasyon: unknown
  widget: unknown
  mesaj: unknown
  resepsiyon_acik: boolean
}

export type KlinikOturum = {
  userId: string
  supabase: SupabaseClient
  klinik: KlinikKaydi
  yonetici: boolean
  doktorlar: string[]
}

type Bos = { userId: string; supabase: SupabaseClient; klinik: null }

export async function klinikBaglam(req: NextRequest): Promise<KlinikOturum | Bos | { hata: NextResponse }> {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum
  const { user, supabase } = oturum
  const sahip = await supabase.from('clinics').select('*').eq('owner_id', user.id).eq('is_active', true).maybeSingle()
  if (sahip.error) return { hata: NextResponse.json({ error: 'Klinik okunamadı.' }, { status: 500 }) }
  let kayit = sahip.data as KlinikKaydi | null
  let rol: string | null = kayit ? 'owner' : null
  if (!kayit) {
    const uyelik = await supabase.from('clinic_members').select('clinic_id, role').eq('user_id', user.id).eq('is_active', true).maybeSingle()
    if (uyelik.error) return { hata: NextResponse.json({ error: 'Klinik okunamadı.' }, { status: 500 }) }
    if (!uyelik.data) return { userId: user.id, supabase, klinik: null }
    const klinik = await supabase.from('clinics').select('*').eq('id', uyelik.data.clinic_id).eq('is_active', true).maybeSingle()
    if (klinik.error || !klinik.data) return { hata: NextResponse.json({ error: 'Klinik okunamadı.' }, { status: 500 }) }
    kayit = klinik.data as KlinikKaydi
    rol = uyelik.data.role
  }
  const uyeler = await supabase.from('clinic_members').select('user_id').eq('clinic_id', kayit.id).eq('is_active', true)
  if (uyeler.error) return { hata: NextResponse.json({ error: 'Üyeler okunamadı.' }, { status: 500 }) }
  const doktorlar = Array.from(new Set([kayit.owner_id, ...(uyeler.data || []).map((u) => u.user_id).filter(Boolean)]))
  return {
    userId: user.id,
    supabase,
    klinik: kayit,
    yonetici: rol === 'owner' || rol === 'admin',
    doktorlar,
  }
}

export function yoneticiDegil() {
  return NextResponse.json({ error: 'Bu ayarı yalnız klinik sahibi veya yöneticisi değiştirir.' }, { status: 403 })
}

export function slugYap(ad: string): string {
  const temel = ad
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'klinik'
  return `${temel}-${randomBytes(3).toString('hex')}`
}

export function tokenUret(): { ham: string; ozet: string } {
  const ham = randomBytes(24).toString('hex')
  return { ham, ozet: createHash('sha256').update(ham).digest('hex') }
}

export function tokenOzet(ham: string): string {
  return createHash('sha256').update(ham).digest('hex')
}

/** Mevcut hekim hesabını kliniğe bağlar. Muayene ekranı bu satırdan okunmaz. */
export async function klinikHesabiniBagla(
  supabase: SupabaseClient,
  userId: string,
  klinikId: string,
  yonetici: boolean,
) {
  await supabase.from('users').update({
    clinic_id: klinikId,
    account_type: yonetici ? 'clinic_admin' : 'clinic_member',
    updated_at: new Date().toISOString(),
  }).eq('id', userId)
}

export async function yetkileriKur(supabase: SupabaseClient, klinikId: string) {
  const satirlar = varsayilanYetkiler().map((s) => ({
    clinic_id: klinikId, rol: s.rol, modul: s.modul, oku: s.oku, yaz: s.yaz, sil: s.sil,
  }))
  await supabase.from('clinic_yetkileri').upsert(satirlar)
}

export function bosProfil() {
  return {
    calisma: varsayilanHafta(),
    rezervasyon: varsayilanRezervasyon(),
    widget: { acik: false, baslik: '' },
    mesaj: { hatirlatma: false },
  }
}
