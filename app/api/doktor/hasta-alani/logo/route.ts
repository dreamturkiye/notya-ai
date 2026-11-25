/**
 * HASTA-ALANI-MARKA — the doctor's portal logo. POST multipart `file` (PNG / JPEG / WebP by magic bytes, ≤ 2 MB,
 * ≤ 1024 px, metadata stripped — lib/portal/markaGorsel.ts; NO SVG) → brand bucket <doctor_id>/logo-<hash>.<ext>;
 * DELETE removes it. Isolation: the folder is the signed-in doctor's own id, decided here — the request names no path,
 * no doctor and no patient.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { MarkaGorselHatasi } from '@/lib/portal/markaGorsel'
import { eskiLogoyuSil, markaLogosuYukle } from '@/lib/portal/markaYukle'
import { markaLogoUrl } from '@/lib/portal/markaSunucu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'Logo dosyası seçin.' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Logo en fazla 2 MB olabilir.' }, { status: 400 })
  try {
    const { data: eski } = await supabase.from('hasta_alani_gorunumu').select('logo_yol').eq('doctor_id', user.id).maybeSingle()
    const { yol, mime } = await markaLogosuYukle(supabase, user.id, Buffer.from(await file.arrayBuffer()))
    const { error } = await supabase.from('hasta_alani_gorunumu').upsert({ doctor_id: user.id, logo_yol: yol, logo_mime: mime, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id' })
    if (error) return NextResponse.json({ error: 'Logo kaydedilemedi.' }, { status: 500 })
    await eskiLogoyuSil(supabase, user.id, eski?.logo_yol as string | null, yol)
    return NextResponse.json({ logoUrl: markaLogoUrl(yol) }, { status: 201 })
  } catch (e) {
    if (e instanceof MarkaGorselHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[hasta-alani] logo:', (e as Error).message)
    return NextResponse.json({ error: 'Logo yüklenemedi.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data: eski } = await supabase.from('hasta_alani_gorunumu').select('logo_yol').eq('doctor_id', user.id).maybeSingle()
  const { error } = await supabase.from('hasta_alani_gorunumu').update({ logo_yol: null, logo_mime: null, updated_at: new Date().toISOString() }).eq('doctor_id', user.id)
  if (error) return NextResponse.json({ error: 'Logo kaldırılamadı.' }, { status: 500 })
  await eskiLogoyuSil(supabase, user.id, eski?.logo_yol as string | null)
  return NextResponse.json({ ok: true, logoUrl: null })
}
