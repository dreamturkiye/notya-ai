/**
 * MOBIL-PERSONEL-01 (c) — "Oturumlar": what Supabase auth really exposes, and nothing invented.
 *
 *   GET    → { sonGiris, hesapOlusturma, buCihaz }   last sign-in time (auth.users.last_sign_in_at) and a label for
 *            the device making THIS request. Supabase's public auth API does NOT list a user's other sessions or
 *            devices, so no per-device list is shown (see docs/audits/ITEM2-MOBIL-PERSONEL.md, MOBIL-PERSONEL-05).
 *   DELETE → "tüm cihazlardan çıkış yap": admin.signOut(jwt, 'global') revokes every refresh token of this account.
 *            Access tokens already issued stay valid until they expire (Supabase default: up to 1 hour).
 *
 * Doctor and every staff role may use it, on their OWN account only: the account is the one the bearer token
 * resolves to (user.id) — no id is taken from the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { cihazAdi } from '@/lib/doktor/cihazAdi'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user } = oturum
  return NextResponse.json({
    sonGiris: user.last_sign_in_at ?? null,
    hesapOlusturma: user.created_at ?? null,
    buCihaz: cihazAdi(req.headers.get('user-agent')),
  })
}

export async function DELETE(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase } = oturum
  const token = (req.headers.get('authorization') || '').slice(7).trim()
  const { error } = await supabase.auth.admin.signOut(token, 'global')
  if (error) return NextResponse.json({ error: 'Oturumlar kapatılamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
