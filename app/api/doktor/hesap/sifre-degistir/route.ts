/**
 * NOTYA-HESAP-01 / NOTYA-SEKRETER-01 — Şifre değiştirme.
 * Oturumdaki kullanıcının kendi şifresi (doktor veya sekreter) — doktorId değil user.id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { servisSupabase } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const body = await req.json().catch(() => ({})) as { yeniSifre?: string }
  const yeniSifre = String(body.yeniSifre || '')
  if (yeniSifre.length < 8) {
    return NextResponse.json({ error: 'Şifre en az 8 karakter olmalıdır.' }, { status: 400 })
  }
  const { error } = await servisSupabase().auth.admin.updateUserById(oturum.user.id, { password: yeniSifre })
  if (error) return NextResponse.json({ error: 'Şifre güncellenemedi: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
