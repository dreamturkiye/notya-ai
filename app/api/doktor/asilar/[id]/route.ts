/** NOTYA-INTAKE-02 — tekil aşı kaydı: güncelle, sil. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { asiAdi, dozNo, kategori, uygulamaTarihi, sonrakiDozTarihi, kaynak, notlar } = body as {
    asiAdi?: string
    dozNo?: number
    kategori?: string
    uygulamaTarihi?: string
    sonrakiDozTarihi?: string
    kaynak?: string
    notlar?: string
  }

  const guncelleme: Record<string, unknown> = {}
  if (asiAdi !== undefined) guncelleme.asi_adi = asiAdi.trim()
  if (dozNo !== undefined) guncelleme.doz_no = dozNo
  if (kategori !== undefined) guncelleme.kategori = kategori === 'pediatrik' ? 'pediatrik' : 'yetiskin'
  if (uygulamaTarihi !== undefined) guncelleme.uygulama_tarihi = uygulamaTarihi || null
  if (sonrakiDozTarihi !== undefined) {
    guncelleme.sonraki_doz_tarihi = sonrakiDozTarihi || null
    // Tarih değiştiyse hatırlatma yeniden gönderilmeli — eski tarihe göre zaten gönderilmiş
    // olabilir.
    guncelleme.hatirlatma_gonderildi = false
  }
  if (kaynak !== undefined) guncelleme.kaynak = kaynak === 'beyan' ? 'beyan' : 'kayit'
  if (notlar !== undefined) guncelleme.notlar = notlar?.trim() || null

  if (Object.keys(guncelleme).length === 0) {
    return NextResponse.json({ error: 'G\u00fcncellenecek alan yok.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('asilar')
    .update(guncelleme)
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'A\u015f\u0131 kayd\u0131 g\u00fcncellenemedi.' }, { status: 500 })
  return NextResponse.json({ asi: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { error } = await supabase.from('asilar').delete().eq('id', params.id).eq('doktor_id', doktorId)
  if (error) return NextResponse.json({ error: 'A\u015f\u0131 kayd\u0131 silinemedi.' }, { status: 500 })
  return NextResponse.json({ silindi: true })
}
