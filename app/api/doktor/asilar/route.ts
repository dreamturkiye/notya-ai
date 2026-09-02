/**
 * NOTYA-INTAKE-02 — aşı kayıtları listesi ve ekleme. Hem pediatrik (çok doz, SB Ulusal Aşılama
 * Takvimi'ne göre yaşa bağlı sıklık) hem yetişkin (tetanoz-difteri 10 yılda bir, grip yıllık,
 * KOVID) senaryosu aynı tabloda — `kategori` yalnızca UI gruplamasını ve hatırlatma sıklığı
 * beklentisini değiştirir, şemayı değil.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const url = new URL(req.url)
  const patientId = url.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data, error } = await supabase
    .from('asilar')
    .select('*')
    .eq('doktor_id', doktorId)
    .eq('patient_id', patientId)
    .order('uygulama_tarihi', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: 'A\u015f\u0131 kay\u0131tlar\u0131 al\u0131namad\u0131.' }, { status: 500 })
  return NextResponse.json({ asilar: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { patientId, asiAdi, dozNo, kategori, uygulamaTarihi, sonrakiDozTarihi, kaynak, notlar } = body as {
    patientId?: string
    asiAdi?: string
    dozNo?: number
    kategori?: string
    uygulamaTarihi?: string
    sonrakiDozTarihi?: string
    kaynak?: string
    notlar?: string
  }
  if (!patientId || !asiAdi?.trim()) {
    return NextResponse.json({ error: 'patientId ve a\u015f\u0131 ad\u0131 zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('asilar')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      asi_adi: asiAdi.trim(),
      doz_no: dozNo || null,
      kategori: kategori === 'pediatrik' ? 'pediatrik' : 'yetiskin',
      uygulama_tarihi: uygulamaTarihi || null,
      sonraki_doz_tarihi: sonrakiDozTarihi || null,
      kaynak: kaynak === 'beyan' ? 'beyan' : 'kayit',
      notlar: notlar?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'A\u015f\u0131 kayd\u0131 eklenemedi.' }, { status: 500 })
  return NextResponse.json({ asi: data })
}
