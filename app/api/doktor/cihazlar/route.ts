/**
 * NOTYA-BLE-SANDBOX-01 — hatırlanan Bluetooth cihazları (Ayarlar › Cihazlar).
 * Yalnız cihazSandboxAcikMi — Kaan + Dr. Gökhan. Yetkisiz → 403.
 *
 * GET  → { yetkili, cihazlar[], yetenek? }  (yetkili false ise liste boş; kimlik sızdırılmaz)
 * POST → cihaz kaydı (eşleştirme sonrası)
 * DELETE ?id= → kendi kaydını sil
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { cihazSandboxAcikMi } from '@/lib/doktor/cihazSandbox'

export const dynamic = 'force-dynamic'

const YETKISIZ = 'Bu sayfa henüz herkese açık değil.'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  if (!cihazSandboxAcikMi(user.id)) {
    return NextResponse.json({ yetkili: false, cihazlar: [] })
  }
  const { data, error } = await supabase
    .from('doktor_cihazlar')
    .select('id, cihaz_adi, uretici, model, seri_no, profil, son_kullanim')
    .eq('doctor_id', user.id)
    .order('son_kullanim', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: 'Cihaz listesi alınamadı' }, { status: 500 })
  return NextResponse.json({ yetkili: true, cihazlar: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  if (!cihazSandboxAcikMi(user.id)) {
    return NextResponse.json({ error: YETKISIZ }, { status: 403 })
  }
  const body = (await req.json().catch(() => null)) as {
    cihazAdi?: string | null
    uretici?: string | null
    model?: string | null
    seriNo?: string | null
    profil?: string | null
  } | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })

  const cihazAdi = String(body.cihazAdi || '').trim().slice(0, 120) || null
  const uretici = String(body.uretici || '').trim().slice(0, 80) || null
  const model = String(body.model || '').trim().slice(0, 80) || null
  const seriNo = String(body.seriNo || '').trim().slice(0, 80) || null
  const profil = String(body.profil || '').trim().slice(0, 80) || null
  if (!cihazAdi && !uretici && !model && !seriNo) {
    return NextResponse.json({ error: 'Cihaz bilgisi eksik' }, { status: 400 })
  }

  const simdi = new Date().toISOString()
  if (seriNo) {
    const { data, error } = await supabase
      .from('doktor_cihazlar')
      .upsert(
        {
          doctor_id: user.id,
          cihaz_adi: cihazAdi,
          uretici,
          model,
          seri_no: seriNo,
          profil,
          son_kullanim: simdi,
        },
        { onConflict: 'doctor_id,seri_no' },
      )
      .select('id, cihaz_adi, uretici, model, seri_no, profil, son_kullanim')
      .maybeSingle()
    if (error) return NextResponse.json({ error: 'Cihaz kaydedilemedi' }, { status: 500 })
    return NextResponse.json({ ok: true, cihaz: data })
  }

  const { data, error } = await supabase
    .from('doktor_cihazlar')
    .insert({
      doctor_id: user.id,
      cihaz_adi: cihazAdi,
      uretici,
      model,
      seri_no: null,
      profil,
      son_kullanim: simdi,
    })
    .select('id, cihaz_adi, uretici, model, seri_no, profil, son_kullanim')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Cihaz kaydedilemedi' }, { status: 500 })
  return NextResponse.json({ ok: true, cihaz: data })
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  if (!cihazSandboxAcikMi(user.id)) {
    return NextResponse.json({ error: YETKISIZ }, { status: 403 })
  }
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  const { error } = await supabase.from('doktor_cihazlar').delete().eq('id', id).eq('doctor_id', user.id)
  if (error) return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
