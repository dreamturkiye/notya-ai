/**
 * HASTA-ALANI-MARKA — the Notya Klinik clinic logo shown at the top of every patient portal of the clinic's doctors.
 * POST multipart `file` (same gate as the doctor logo: PNG / JPEG / WebP by magic bytes, ≤ 2 MB, ≤ 1024 px, metadata
 * stripped, no SVG) → brand bucket klinik/<clinic_id>/logo-<hash>.<ext>, clinics.logo_url = its public URL. DELETE clears it.
 * Only the clinic's owner or an admin member; the clinic is resolved from the signed-in user, never from the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { MarkaGorselHatasi } from '@/lib/portal/markaGorsel'
import { eskiLogoyuSil, markaLogosuYukle } from '@/lib/portal/markaYukle'
import { markaKovaTabani } from '@/lib/portal/markaSunucu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function yonetilenKlinik(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum
  const { user, supabase } = oturum
  const sahip = await supabase.from('clinics').select('id, logo_url').eq('owner_id', user.id).eq('is_active', true).limit(1).maybeSingle()
  if (sahip.data) return { supabase, klinik: sahip.data as { id: string; logo_url: string | null } }
  const uye = await supabase.from('clinic_members').select('clinic_id').eq('user_id', user.id).eq('role', 'admin').eq('is_active', true).limit(1).maybeSingle()
  if (!uye.data?.clinic_id) return { hata: NextResponse.json({ error: 'Bu ayarı yalnız klinik sahibi veya yöneticisi değiştirir.' }, { status: 403 }) }
  const k = await supabase.from('clinics').select('id, logo_url').eq('id', String(uye.data.clinic_id)).eq('is_active', true).maybeSingle()
  if (!k.data) return { hata: NextResponse.json({ error: 'Klinik bulunamadı.' }, { status: 404 }) }
  return { supabase, klinik: k.data as { id: string; logo_url: string | null } }
}

const eskiYol = (url: string | null | undefined) => {
  const u = String(url || '')
  return u.startsWith(markaKovaTabani()) ? u.slice(markaKovaTabani().length) : null
}

export async function POST(req: NextRequest) {
  const b = await yonetilenKlinik(req)
  if ('hata' in b) return b.hata
  const { supabase, klinik } = b
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'Logo dosyası seçin.' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Logo en fazla 2 MB olabilir.' }, { status: 400 })
  const klasor = `klinik/${klinik.id}`
  try {
    const { yol } = await markaLogosuYukle(supabase, klasor, Buffer.from(await file.arrayBuffer()))
    const logoUrl = `${markaKovaTabani()}${yol}`
    const { error } = await supabase.from('clinics').update({ logo_url: logoUrl, updated_at: new Date().toISOString() }).eq('id', klinik.id)
    if (error) return NextResponse.json({ error: 'Logo kaydedilemedi.' }, { status: 500 })
    await eskiLogoyuSil(supabase, klasor, eskiYol(klinik.logo_url), yol)
    return NextResponse.json({ logoUrl }, { status: 201 })
  } catch (e) {
    if (e instanceof MarkaGorselHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[klinik-logo]', (e as Error).message)
    return NextResponse.json({ error: 'Logo yüklenemedi.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const b = await yonetilenKlinik(req)
  if ('hata' in b) return b.hata
  const { supabase, klinik } = b
  const { error } = await supabase.from('clinics').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', klinik.id)
  if (error) return NextResponse.json({ error: 'Logo kaldırılamadı.' }, { status: 500 })
  await eskiLogoyuSil(supabase, `klinik/${klinik.id}`, eskiYol(klinik.logo_url))
  return NextResponse.json({ ok: true, logoUrl: null })
}
