/**
 * NOTYA-SEKRETER-01 — sekreter kendi profil fotoğrafı (yükle / getir / kaldır).
 * doctor_avatars ile aynı AES-256-GCM zarfı; kapsam yalnız oturumdaki personel_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decryptBytes, encryptBytes } from '@/lib/vault/crypto'
import { AvatarGecersizError, avatarDataUrl, avatarDogrula } from '@/lib/doktor/avatar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sekreterPersonelId(oturum: Awaited<ReturnType<typeof pratikOturum>>): string | NextResponse {
  if ('hata' in oturum) return oturum.hata
  if (oturum.rol !== 'sekreter' || !oturum.personelId) {
    return NextResponse.json({ error: 'Bu işlem yalnızca sekreter hesabı içindir.' }, { status: 403 })
  }
  return oturum.personelId
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  const personelId = sekreterPersonelId(oturum)
  if (personelId instanceof NextResponse) return personelId
  const { supabase } = oturum as Exclude<typeof oturum, { hata: NextResponse }>

  const { data, error } = await supabase
    .from('personel_avatars')
    .select('mime_type, image_encrypted, updated_at')
    .eq('personel_id', personelId)
    .maybeSingle()

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
    return NextResponse.json({ avatar: null })
  }
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  const personelId = sekreterPersonelId(oturum)
  if (personelId instanceof NextResponse) return personelId
  const { supabase } = oturum as Exclude<typeof oturum, { hata: NextResponse }>

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fotoğraf zorunludur' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    avatarDogrula(file.type || '', bytes.length)

    const { error } = await supabase
      .from('personel_avatars')
      .upsert(
        {
          personel_id: personelId,
          mime_type: file.type,
          byte_length: bytes.length,
          image_encrypted: encryptBytes(bytes).toString('base64'),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'personel_id' },
      )

    if (error) {
      return NextResponse.json({ error: 'Fotoğraf kaydedilemedi' }, { status: 500 })
    }

    return NextResponse.json(
      { avatar: { dataUrl: avatarDataUrl(file.type, bytes.toString('base64')), mime: file.type } },
      { status: 201 },
    )
  } catch (e) {
    if (e instanceof AvatarGecersizError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Fotoğraf yüklenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const oturum = await pratikOturum(req)
  const personelId = sekreterPersonelId(oturum)
  if (personelId instanceof NextResponse) return personelId
  const { supabase } = oturum as Exclude<typeof oturum, { hata: NextResponse }>

  const { error } = await supabase.from('personel_avatars').delete().eq('personel_id', personelId)
  if (error) {
    return NextResponse.json({ error: 'Fotoğraf kaldırılamadı' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, avatar: null })
}
