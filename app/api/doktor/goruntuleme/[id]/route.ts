import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Ctx = { params: { id: string } }

/**
 * NOTYA-GORUNTU-DEL-01 (Gökhan, 2026-09-08): Görüntüleme arşivindeki çöp ikonu çalışmıyordu —
 * istemci /api/doktor/goruntuleme/[id]'ye DELETE atıyordu ama bu route hiç yoktu (yalnız GET
 * ve yukle vardı), istek 404/405 dönüyor, görüntü silinmiyordu. Bu route hem DB kaydını
 * (doktor-sahiplik kontrollü) hem de storage'daki dosyayı siler.
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Görüntü kimliği gerekli' }, { status: 400 })
    }

    const { data: kayit, error: bulErr } = await supabase
      .from('hasta_goruntulemeler')
      .select('id, doctor_id, dosya_url')
      .eq('id', id)
      .maybeSingle()

    if (bulErr || !kayit) {
      return NextResponse.json({ error: 'Görüntü bulunamadı' }, { status: 404 })
    }
    if (kayit.doctor_id !== user.id) {
      return NextResponse.json({ error: 'Bu görüntüyü silme yetkiniz yok' }, { status: 403 })
    }

    try {
      const url = String(kayit.dosya_url || '')
      const marker = '/hasta-goruntuleme/'
      const idx = url.indexOf(marker)
      if (idx >= 0) {
        const filePath = decodeURIComponent(url.slice(idx + marker.length))
        await supabase.storage.from('hasta-goruntuleme').remove([filePath])
      }
    } catch {
      // Storage temizliği başarısız olsa bile DB kaydını silmeye devam et.
    }

    const { error: silErr } = await supabase.from('hasta_goruntulemeler').delete().eq('id', id)
    if (silErr) {
      return NextResponse.json({ error: 'Görüntü silinemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Görüntü silinemedi' }, { status: 500 })
  }
}
