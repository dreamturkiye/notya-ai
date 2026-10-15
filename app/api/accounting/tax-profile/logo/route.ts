export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * NOTYA-ACCOUNTING-ENCOUNTER-01 — practice logo for invoice/makbuz PDFs (ARCH doc §4.9.8 "company
 * profile + logo"). Same envelope/shape as the doctor's own profile photo
 * (app/api/doktor/profil/avatar/route.ts) — AES-256-GCM via lib/vault/crypto, stored as a data URL
 * only to the authenticated doctor, never a public URL. Doktor-only (sekreter cannot touch the
 * tax/billing identity, same boundary as every other field on accounting_tax_profiles).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decryptBytes, encryptBytes } from '@/lib/vault/crypto'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data, error } = await supabase
    .from('accounting_tax_profiles')
    .select('logo_mime_type, logo_image_encrypted, updated_at')
    .eq('doctor_id', user.id)
    .maybeSingle()
  if (error || !data || !data.logo_image_encrypted) return NextResponse.json({ success: true, data: null })
  try {
    const bytes = decryptBytes(Buffer.from(String(data.logo_image_encrypted), 'base64'))
    return NextResponse.json({ success: true, data: { dataUrl: `data:${data.logo_mime_type};base64,${bytes.toString('base64')}` } })
  } catch {
    return NextResponse.json({ success: true, data: null })
  }
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: existing } = await supabase.from('accounting_tax_profiles').select('doctor_id').eq('doctor_id', user.id).maybeSingle()
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Önce vergi profilini (unvan/adres/TCKN-VKN) kaydedin, logo ondan sonra eklenebilir.' }, { status: 400 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Dosya zorunludur.' }, { status: 400 })
    if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ success: false, error: 'Desteklenen türler: JPEG, PNG, WebP.' }, { status: 400 })
    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length === 0) return NextResponse.json({ success: false, error: 'Dosya boş olamaz.' }, { status: 400 })
    if (bytes.length > MAX_BYTES) return NextResponse.json({ success: false, error: 'Logo 2 MB sınırını aşıyor.' }, { status: 400 })

    const { error } = await supabase
      .from('accounting_tax_profiles')
      .update({
        logo_mime_type: file.type,
        logo_byte_length: bytes.length,
        logo_image_encrypted: encryptBytes(bytes).toString('base64'),
        updated_at: new Date().toISOString(),
      })
      .eq('doctor_id', user.id)
    if (error) return NextResponse.json({ success: false, error: 'Logo kaydedilemedi.' }, { status: 500 })

    return NextResponse.json({ success: true, data: { dataUrl: `data:${file.type};base64,${bytes.toString('base64')}` } })
  } catch {
    return NextResponse.json({ success: false, error: 'Logo yüklenemedi.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { error } = await supabase
    .from('accounting_tax_profiles')
    .update({ logo_mime_type: null, logo_byte_length: null, logo_image_encrypted: null, updated_at: new Date().toISOString() })
    .eq('doctor_id', user.id)
  if (error) return NextResponse.json({ success: false, error: 'Logo kaldırılamadı.' }, { status: 500 })
  return NextResponse.json({ success: true, data: null })
}
