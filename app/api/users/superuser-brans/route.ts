/**
 * NOTYA-SUPERUSER-BRANS-01 — hekimin KENDİ hesabının aktif branşını anında değiştirmesi.
 * Yalnız lib/auth/superuserBranslar.ts içindeki doğrulanmış iki kimlik için açıktır.
 *
 * Yetki kontrolü bu dosyada, sunucuda ve AÇIKÇA yapılır. Arayüzdeki gizleme kozmetiktir;
 * güvenlik sınırı burasıdır. Genel /api/users/profile rotasının ne yaptığından bağımsız
 * olarak bu rotanın kendi bağımsız izin listesi kontrolü vardır (bkz. docs/OPEN-COMMITMENTS.md).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { bransDegistirebilir, gecerliBransMi, bransSecenekleri } from '@/lib/auth/superuserBranslar'

export const dynamic = 'force-dynamic'

const YETKISIZ = 'Bu işlem için yetkiniz yok.'

/**
 * Arayüz "seçiciyi göstereyim mi" diye buraya sorar. Yetkisiz oturuma yalnız
 * `{ yetkili: false }` döner — izin listesinin içeriği ya da uzunluğu sızmaz.
 */
export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  if (!bransDegistirebilir(user.id)) {
    return NextResponse.json({ yetkili: false })
  }

  const { data: profil } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
  const metaBrans = typeof user.user_metadata?.specialty === 'string' ? user.user_metadata.specialty : null
  const profilBrans = typeof profil?.specialty === 'string' && profil.specialty !== 'genel' ? profil.specialty : null

  return NextResponse.json({
    yetkili: true,
    brans: profilBrans || metaBrans || null,
    secenekler: bransSecenekleri(),
  })
}

/** Gövde: `{ brans: '<anahtar>' }`. Yalnız çağıran kendi satırını değiştirir. */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  // Bağımsız, açık izin listesi kontrolü — atlanamaz.
  if (!bransDegistirebilir(user.id)) {
    return NextResponse.json({ error: YETKISIZ }, { status: 403 })
  }

  let govde: unknown = null
  try {
    govde = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }
  const brans = (govde as { brans?: unknown } | null)?.brans

  if (!gecerliBransMi(brans)) {
    return NextResponse.json({ error: 'Geçersiz branş.' }, { status: 400 })
  }

  // `users.specialty` asıl kaynak; `auth.users.user_metadata.specialty` ise /api/users/me ve
  // birkaç rota tarafından yedek olarak okunuyor. İkisi ayrışırsa branş yarım değişir —
  // ikisini birden yazıyoruz.
  const { error: guncelleHatasi } = await supabase
    .from('users')
    .update({ specialty: brans, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (guncelleHatasi) {
    return NextResponse.json({ error: guncelleHatasi.message }, { status: 500 })
  }

  const mevcutMeta = (user.user_metadata || {}) as Record<string, unknown>
  const { error: metaHatasi } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...mevcutMeta, specialty: brans },
  })
  if (metaHatasi) {
    return NextResponse.json({ error: metaHatasi.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, brans })
}
