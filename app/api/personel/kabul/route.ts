/**
 * NOTYA-RANDEVU-01 — davet kabul: personel için Supabase auth hesabı oluşturur.
 *
 * Uses `auth.admin.createUser({ email_confirm: true })` rather than normal signup — that is the
 * deliberate choice, not an oversight. Standard email/password signup requires Supabase's
 * confirmation e-mail, and no custom SMTP is configured yet (docs/OPEN-COMMITMENTS.md — this is
 * the doctor-signup launch blocker). Routing personel invites through the same broken mail path
 * would just give the secretary the identical dead end. Since the doctor already hands the
 * invite link to the secretary directly (WhatsApp, in person), there is no confirmation step
 * left to perform — the doctor's own act of sharing the link IS the verification.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { token, sifre } = body as { token?: string; sifre?: string }
  if (!token || !sifre) return NextResponse.json({ error: 'Token ve şifre zorunludur.' }, { status: 400 })
  if (sifre.length < 8) return NextResponse.json({ error: 'Şifre en az 8 karakter olmalıdır.' }, { status: 400 })

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const supabase = servisSupabase()

  const { data: davet } = await supabase
    .from('personel')
    .select('id, email, ad_soyad, davet_expires_at, davet_kabul_edildi_at, doktor_id')
    .eq('davet_token_hash', tokenHash)
    .maybeSingle()

  if (!davet) return NextResponse.json({ error: 'Davet bulunamadı.' }, { status: 404 })
  if (davet.davet_kabul_edildi_at) return NextResponse.json({ error: 'Bu davet zaten kullanılmış.' }, { status: 400 })
  if (davet.davet_expires_at && new Date(davet.davet_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Davetin süresi dolmuş.' }, { status: 400 })
  }

  const { data: yeniKullanici, error: olusturmaHatasi } = await supabase.auth.admin.createUser({
    email: davet.email,
    password: sifre,
    email_confirm: true,
    user_metadata: { ad_soyad: davet.ad_soyad, personel: true },
  })

  if (olusturmaHatasi || !yeniKullanici?.user) {
    const zatenVar = String(olusturmaHatasi?.message || '').toLowerCase().includes('already')
    return NextResponse.json(
      { error: zatenVar ? 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.' : 'Hesap oluşturulamadı.' },
      { status: 400 }
    )
  }

  await supabase
    .from('personel')
    .update({ user_id: yeniKullanici.user.id, davet_kabul_edildi_at: new Date().toISOString(), aktif: true })
    .eq('id', davet.id)

  return NextResponse.json({ basarili: true })
}
