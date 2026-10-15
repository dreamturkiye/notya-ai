/**
 * NOTYA-OKUL-RAPOR-01 — ÇÖZGER takip ve katkı modülü (başvuru). Notya resmi ÇÖZGER raporu ÜRETMEZ —
 * bkz. lib/doktor/cozgerTakip.ts COZGER_UYARI_METNI, ekranda ve basılı çıktıda sabit kalmalı.
 * Base/ORTAK tool, gated on the PATIENT being a minor/öğrenci. HASTA-IZOLASYON-01: hastaSahibiMi before
 * any read/write; "hasta_id başına bir başvuru" BU DOKTORUN kendi patients satırı kapsamındadır
 * (unique doctor_id+patient_id) — kurul üyeleri arasındaki paylaşım basvuru_id üzerinden, bkz. katki/route.ts.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { cozgerDurumGecerliMi } from '@/lib/doktor/cozgerTakip'

export const dynamic = 'force-dynamic'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })
}

async function dogrulaKullanici(request: NextRequest) {
  const supabase = sb()
  const authH = request.headers.get('authorization')
  const token = authH?.startsWith('Bearer ') ? authH.slice(7) : undefined
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return { supabase, userId: user.id }
}

/** GET ?hastaId=... — bu doktorun bu hasta için başvurusu + ona bağlı (bu doktorun yazdığı) katkılar. */
export async function GET(request: NextRequest) {
  const kimlik = await dogrulaKullanici(request)
  if (!kimlik) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const { supabase, userId } = kimlik

  const { searchParams } = new URL(request.url)
  const hastaId = searchParams.get('hastaId') || ''
  if (!hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, userId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data: basvuru, error: basvuruHata } = await supabase
    .from('cozger_basvurulari')
    .select('*')
    .eq('doctor_id', userId)
    .eq('patient_id', hastaId)
    .maybeSingle()
  if (basvuruHata) return NextResponse.json({ error: basvuruHata.message }, { status: 500 })

  let katkilar: unknown[] = []
  if (basvuru) {
    const { data, error } = await supabase
      .from('cozger_kurul_katkilari')
      .select('*')
      .eq('basvuru_id', basvuru.id)
      .eq('doctor_id', userId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    katkilar = data || []
  }

  return NextResponse.json({ basvuru, katkilar })
}

/** POST — başvuru oluştur (hasta_id başına tek — zaten varsa mevcut kayıt döner). */
export async function POST(request: NextRequest) {
  const kimlik = await dogrulaKullanici(request)
  if (!kimlik) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const { supabase, userId } = kimlik

  const body = await request.json().catch(() => ({}))
  const hastaId = String(body?.hastaId || '')
  if (!hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, userId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data: mevcut } = await supabase
    .from('cozger_basvurulari')
    .select('*')
    .eq('doctor_id', userId)
    .eq('patient_id', hastaId)
    .maybeSingle()
  if (mevcut) return NextResponse.json({ basvuru: mevcut, yeni: false })

  const { data, error } = await supabase
    .from('cozger_basvurulari')
    .insert({ doctor_id: userId, patient_id: hastaId, not_metni: String(body?.notMetni || '').trim().slice(0, 2000) || null })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ basvuru: data, yeni: true })
}

/** PATCH — durum / heyet tarihi / ÖKGV benzeri düzey ve sonuç metni güncellemesi. Gövde: basvuruId + alanlar. */
export async function PATCH(request: NextRequest) {
  const kimlik = await dogrulaKullanici(request)
  if (!kimlik) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const { supabase, userId } = kimlik

  const body = await request.json().catch(() => ({}))
  const basvuruId = String(body?.basvuruId || '')
  if (!basvuruId) return NextResponse.json({ error: 'Başvuru seçimi zorunludur.' }, { status: 400 })

  const guncelleme: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.durum !== undefined) {
    if (!cozgerDurumGecerliMi(String(body.durum))) return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    guncelleme.durum = body.durum
  }
  if (body.heyetTarihi !== undefined) guncelleme.heyet_tarihi = String(body.heyetTarihi || '').slice(0, 10) || null
  if (body.okgvDuzeyi !== undefined) guncelleme.okgv_duzeyi = String(body.okgvDuzeyi || '').trim().slice(0, 60) || null
  if (body.okgvSonucMetni !== undefined) guncelleme.okgv_sonuc_metni = String(body.okgvSonucMetni || '').trim().slice(0, 2000) || null
  if (body.notMetni !== undefined) guncelleme.not_metni = String(body.notMetni || '').trim().slice(0, 2000) || null

  const { data, error } = await supabase
    .from('cozger_basvurulari')
    .update(guncelleme)
    .eq('id', basvuruId)
    .eq('doctor_id', userId)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Başvuru bulunamadı.' }, { status: 404 })
  return NextResponse.json({ basvuru: data })
}
