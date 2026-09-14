/**
 * NOTYA-HESAP-01 — Şifre değiştirme (Kaan/Gökhan 2026-09-14: "şifremi değiştirecek bir yol bulamadım").
 * Doktor kendi oturum belirtecine sahip; yeni şifreyi doğrudan admin API ile yazıyoruz —
 * mevcut şifreyi tekrar sormaya gerek yok, oturum zaten kimliği doğruluyor.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { servisSupabase } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const body = await req.json().catch(() => ({})) as { yeniSifre?: string }
  const yeniSifre = String(body.yeniSifre || '')
  if (yeniSifre.length < 8) {
    return NextResponse.json({ error: 'Şifre en az 8 karakter olmalıdır.' }, { status: 400 })
  }
  const { error } = await servisSupabase().auth.admin.updateUserById(oturum.doktorId, { password: yeniSifre })
  if (error) return NextResponse.json({ error: 'Şifre güncellenemedi: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
