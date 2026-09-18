import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeImagingModality } from '@/lib/doktor/imagingModalities'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }), headers: { Authorization: `Bearer ${token}` } },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const hastaId = formData.get('hastaId') as string
    const modalite = normalizeImagingModality(String(formData.get('modalite') || ''))
    const vucut_bolgesi = formData.get('vucut_bolgesi') as string
    const rapor_metni = String(formData.get('rapor_metni') || formData.get('rapor') || '')
    const tarih = formData.get('tarih') as string

    if (!file || !hastaId) {
      return NextResponse.json({ error: 'Dosya ve hastaId zorunludur' }, { status: 400 })
    }
    // HASTA-IZOLASYON-01: the table's RLS only checks doctor_id = auth.uid(), not whose patient it is —
    // without this, imaging (and its portal card) could be filed under another doctor's patient.
    if (!(await hastaSahibiMi(supabase, user.id, hastaId))) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }

    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    // Path includes modality so each patient upload is stored under the right category
    const filePath = `${user.id}/${hastaId}/${modalite}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('hasta-goruntuleme').upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

    if (uploadError) {
      console.error('[goruntuleme/yukle] storage', uploadError)
      return NextResponse.json({
        error: uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')
          ? 'Depolama kovası (hasta-goruntuleme) yok veya erişilemiyor. Belgeler › Belge Kasası ile yükleyebilirsiniz.'
          : `Dosya yüklenemedi: ${uploadError.message || 'bilinmeyen hata'}`,
      }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('hasta-goruntuleme').getPublicUrl(filePath)

    const { data: goruntuleme, error: insertError } = await supabase
      .from('hasta_goruntulemeler')
      .insert({
        doctor_id: user.id,
        patient_id: hastaId,
        modalite,
        vucut_bolgesi: vucut_bolgesi || null,
        dosya_url: urlData.publicUrl,
        rapor_metni: rapor_metni || null,
        goruntuleme_tarihi: tarih || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[goruntuleme/yukle] insert', insertError)
      return NextResponse.json({ error: `Kayıt oluşturulamadı: ${insertError.message || 'bilinmeyen hata'}` }, { status: 500 })
    }

    return NextResponse.json({ goruntuleme })
  } catch (e) {
    console.error('[goruntuleme/yukle]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
