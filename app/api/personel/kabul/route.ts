/**
 * NOTYA-RANDEVU-01 / NOTYA-SEKRETER-01 — davet kabul: personel için Supabase auth hesabı.
 *
 * Uses `auth.admin.createUser({ email_confirm: true })` rather than normal signup — that is the
 * deliberate choice, not an oversight. Standard email/password signup requires Supabase's
 * confirmation e-mail, and no custom SMTP is configured yet. The doctor's act of sharing the
 * invite link IS the verification.
 *
 * E-posta zaten varsa (yarım kalmış önceki kabul): şifreyi güncelle, personel.user_id bağla —
 * "zaten hesap var → doktor onboarding" tuzağına düşmesin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

async function emailIleAuthKullanici(
  supabase: ReturnType<typeof servisSupabase>,
  email: string,
): Promise<{ id: string } | null> {
  const hedef = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) return null
    const bul = data.users.find((u) => String(u.email || '').toLowerCase() === hedef)
    if (bul) return { id: bul.id }
    if (data.users.length < 200) return null
  }
  return null
}

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

  const email = String(davet.email || '').trim().toLowerCase()
  const adSoyad = String(davet.ad_soyad || '').trim()
  const meta = { ad_soyad: adSoyad, personel: true, onboarding_completed: true }

  let userId: string | null = null

  const { data: yeniKullanici, error: olusturmaHatasi } = await supabase.auth.admin.createUser({
    email,
    password: sifre,
    email_confirm: true,
    user_metadata: meta,
  })

  if (yeniKullanici?.user?.id) {
    userId = yeniKullanici.user.id
  } else {
    const zatenVar = String(olusturmaHatasi?.message || '').toLowerCase().includes('already')
    if (!zatenVar) {
      return NextResponse.json({ error: 'Hesap oluşturulamadı.' }, { status: 400 })
    }
    const mevcut = await emailIleAuthKullanici(supabase, email)
    if (!mevcut) {
      return NextResponse.json({ error: 'Bu e-posta ile hesap bulundu ama bağlanamadı. Notya ekibine yazın.' }, { status: 400 })
    }
    // Doktor hesabı sekreter davetine bağlanamaz.
    const { data: doktorProfil } = await supabase
      .from('users')
      .select('id, profession_type')
      .eq('id', mevcut.id)
      .maybeSingle()
    if (doktorProfil && (doktorProfil.profession_type === 'doktor' || doktorProfil.id === davet.doktor_id)) {
      return NextResponse.json({
        error: 'Bu e-posta bir hekim hesabına ait. Sekreter için ayrı bir e-posta kullanın.',
      }, { status: 400 })
    }
    const { error: guncelleHata } = await supabase.auth.admin.updateUserById(mevcut.id, {
      password: sifre,
      email_confirm: true,
      user_metadata: meta,
    })
    if (guncelleHata) {
      return NextResponse.json({ error: 'Mevcut hesap güncellenemedi.' }, { status: 400 })
    }
    userId = mevcut.id
  }

  const { error: baglaHata } = await supabase
    .from('personel')
    .update({
      user_id: userId,
      davet_kabul_edildi_at: new Date().toISOString(),
      aktif: true,
    })
    .eq('id', davet.id)

  if (baglaHata) {
    return NextResponse.json({ error: 'Personel kaydı bağlanamadı.' }, { status: 500 })
  }

  return NextResponse.json({ basarili: true, email })
}
