/**
 * NOTYA-AVATAR-01 — hekimin kendi profil fotoğrafı (yükle / getir / kaldır).
 *
 * Kapsam: yalnız oturumdaki hekimin kendi satırı (`doctor_id = user.id`). Hasta verisi yok,
 * PHI yok. Baytlar kasadaki (lib/vault) ile aynı AES-256-GCM zarfıyla şifrelenir; herkese açık
 * URL üretilmez — görsel yalnız kimliği doğrulanmış bu rotadan data URL olarak döner.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decryptBytes, encryptBytes } from '@/lib/vault/crypto'
import { AvatarGecersizError, avatarDataUrl, avatarDogrula } from '@/lib/doktor/avatar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET — karşılama ekranı ve Ayarlar önizlemesi için. Fotoğraf yoksa `avatar: null`. */
export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data, error } = await supabase
    .from('doctor_avatars')
    .select('mime_type, image_encrypted, updated_at')
    .eq('doctor_id', user.id)
    .maybeSingle()

  // Fotoğraf yokluğu hata değil: baş harfli avatar zaten geçerli son durum.
  if (error || !data) return NextResponse.json({ avatar: null })

  try {
    const bytes = decryptBytes(Buffer.from(String(data.image_encrypted), 'base64'))
    return NextResponse.json({
      avatar: {
        dataUrl: avatarDataUrl(String(data.mime_type), bytes.toString('base64')),
        mime: String(data.mime_type),
        guncellendi: String(data.updated_at),
      },
    })
  } catch {
    // Çözülemeyen zarf (anahtar döndü vb.) karşılama ekranını kırmasın.
    return NextResponse.json({ avatar: null })
  }
}

/** POST multipart: file — mevcut fotoğrafın yerine geçer (hekim başına tek satır). */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fotoğraf zorunludur' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    avatarDogrula(file.type || '', bytes.length)

    const { error } = await supabase
      .from('doctor_avatars')
      .upsert(
        {
          doctor_id: user.id,
          mime_type: file.type,
          byte_length: bytes.length,
          image_encrypted: encryptBytes(bytes).toString('base64'),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'doctor_id' }
      )

    if (error) {
      return NextResponse.json({ error: 'Fotoğraf kaydedilemedi' }, { status: 500 })
    }

    return NextResponse.json(
      { avatar: { dataUrl: avatarDataUrl(file.type, bytes.toString('base64')), mime: file.type } },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof AvatarGecersizError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Fotoğraf yüklenemedi' }, { status: 500 })
  }
}

/** DELETE — fotoğrafı kaldır; karşılama ekranı baş harfli avatara döner. */
export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { error } = await supabase.from('doctor_avatars').delete().eq('doctor_id', user.id)
  if (error) {
    return NextResponse.json({ error: 'Fotoğraf kaldırılamadı' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, avatar: null })
}
