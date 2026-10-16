/**
 * NOTYA-RANDEVU-01 / MOBIL-PERSONEL-01 — tekil personel: aktif/pasif yap, rolünü değiştir, kaldır.
 * Yalnız doktor hesabı (sadeceDoktor) ve yalnız KENDİ personeli (id VE doktor_id aynı sorguda — hasta-izolasyon deseni).
 * Rol değişikliği anında etkilidir: pratikOturum her istekte personel satırını okur. Her değişiklik
 * personel_rol_gecmisi'ne (append-only) yazılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { personelRoluMu } from '@/lib/doktor/personelYetki'
import { personelGunlugeYaz } from '@/lib/doktor/personelGunluk'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId, user } = oturum

  const body = (await req.json().catch(() => ({}))) as { aktif?: unknown; rol?: unknown }
  const guncelleme: { aktif?: boolean; rol?: string } = {}
  if (body.aktif !== undefined) {
    if (typeof body.aktif !== 'boolean') return NextResponse.json({ error: 'aktif alanı geçersiz.' }, { status: 400 })
    guncelleme.aktif = body.aktif
  }
  if (body.rol !== undefined) {
    if (!personelRoluMu(body.rol)) return NextResponse.json({ error: 'Geçersiz personel rolü.' }, { status: 400 })
    guncelleme.rol = body.rol
  }
  if (guncelleme.aktif === undefined && guncelleme.rol === undefined) {
    return NextResponse.json({ error: 'aktif veya rol alanı zorunludur.' }, { status: 400 })
  }

  const { data: mevcut } = await supabase
    .from('personel')
    .select('id, email, rol, aktif')
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .maybeSingle()
  if (!mevcut) return NextResponse.json({ error: 'Personel bulunamadı.' }, { status: 404 })

  const { data, error } = await supabase
    .from('personel')
    .update(guncelleme)
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .select()
    .single()

  if (error || !data) {
    const rolHatasi = /personel_rol_check|check constraint/i.test(String(error?.message || ''))
    return NextResponse.json(
      { error: rolHatasi ? 'Bu rol için veritabanı güncellemesi henüz uygulanmadı. Notya ekibine bildirin.' : 'Personel güncellenemedi.' },
      { status: rolHatasi ? 400 : 500 },
    )
  }

  const eskiRol = String(mevcut.rol ?? 'sekreter')
  if (guncelleme.rol !== undefined && guncelleme.rol !== eskiRol) {
    await personelGunlugeYaz(supabase, { doktorId, personelId: params.id, email: mevcut.email, olay: 'rol_degisti', eskiRol, yeniRol: guncelleme.rol, yapanId: user.id })
  }
  if (guncelleme.aktif !== undefined && guncelleme.aktif !== Boolean(mevcut.aktif)) {
    await personelGunlugeYaz(supabase, { doktorId, personelId: params.id, email: mevcut.email, olay: 'aktiflik_degisti', eskiAktif: Boolean(mevcut.aktif), yeniAktif: guncelleme.aktif, yapanId: user.id })
  }
  return NextResponse.json({ personel: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId, user } = oturum

  const { data: mevcut } = await supabase
    .from('personel')
    .select('id, email, rol')
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .maybeSingle()
  if (!mevcut) return NextResponse.json({ error: 'Personel bulunamadı.' }, { status: 404 })

  const { error } = await supabase.from('personel').delete().eq('id', params.id).eq('doktor_id', doktorId)
  if (error) return NextResponse.json({ error: 'Personel silinemedi.' }, { status: 500 })
  await personelGunlugeYaz(supabase, { doktorId, personelId: params.id, email: mevcut.email, olay: 'kaldirildi', eskiRol: String(mevcut.rol ?? 'sekreter'), yapanId: user.id })
  return NextResponse.json({ silindi: true })
}
