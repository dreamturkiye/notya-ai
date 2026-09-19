/**
 * ARACLAR-CILA-01 Faz 4 — /api/doktor/araclar/sablonlarim
 * Araçlar › Sık kullandıklarım / hızlı şablonlar. Şablonlar HEKİME ÖZELDİR.
 *
 * İZOLASYON: burada hasta verisi YOKTUR — ne patient_id alınır ne de hasta tablosu okunur. Korunan
 * sınır doktor-izolasyonudur: her okuma ve yazma `doctor_id = oturum sahibi` ile daraltılır, id ile
 * gelen istekler de (güncelleme / silme) o daraltmayı taşır; başka hekimin şablonu bulunamaz (404).
 *
 * DOZ KİLİDİ: Notya hiçbir şablon, ilaç ya da doz önermez. Alanların içeriği tamamen hekimin kendi
 * yazdığı metindir; sunucu yalnız uzunluk sınırı uygular.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { sablonTemizle, SABLON_SINIRLARI } from '@/lib/doktor/sablonlar'

export const dynamic = 'force-dynamic'

const ALANLAR = 'id, ad, tani, recete_taslagi, kontrol_araligi, notlar, kullanim_sayisi, son_kullanim, updated_at'
const yok = () => NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })

/** Hekimin kendi şablonları — sık kullanılan üstte. */
export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data, error } = await supabase
    .from('doktor_sablonlari').select(ALANLAR)
    .eq('doctor_id', user.id)
    .order('kullanim_sayisi', { ascending: false })
    .order('son_kullanim', { ascending: false, nullsFirst: false })
    .limit(200)
  if (error) return NextResponse.json({ sablonlar: [], tabloHazir: false, error: 'Şablon tablosu henüz hazır değil.' })
  return NextResponse.json({ sablonlar: data || [], tabloHazir: true })
}

/** Yeni şablon ya da mevcut şablonun güncellenmesi; `kullanildi: true` sık kullanılan sayacını artırır. */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const id = typeof b?.id === 'string' && b.id ? b.id : null

  // Sayaç: hekim şablonu kullandı — içerik değişmez.
  if (b?.kullanildi === true) {
    if (!id) return NextResponse.json({ error: 'Şablon seçilmedi.' }, { status: 400 })
    const { data: mevcut } = await supabase.from('doktor_sablonlari').select('kullanim_sayisi').eq('id', id).eq('doctor_id', user.id).maybeSingle()
    if (!mevcut) return yok()
    const { error } = await supabase.from('doktor_sablonlari')
      .update({ kullanim_sayisi: Number(mevcut.kullanim_sayisi || 0) + 1, son_kullanim: new Date().toISOString() })
      .eq('id', id).eq('doctor_id', user.id)
    if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const temiz = sablonTemizle(b)
  if (!temiz) return NextResponse.json({ error: `Şablon adı gerekli (en çok ${SABLON_SINIRLARI.ad} karakter).` }, { status: 400 })

  if (id) {
    // DOKTOR-IZOLASYON: id saldırgan kontrolündedir — güncelleme doctor_id ile daraltılır.
    const { data, error } = await supabase.from('doktor_sablonlari')
      .update({ ...temiz, updated_at: new Date().toISOString() })
      .eq('id', id).eq('doctor_id', user.id).select(ALANLAR).maybeSingle()
    if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
    if (!data) return yok()
    return NextResponse.json({ ok: true, sablon: data })
  }

  const { data, error } = await supabase.from('doktor_sablonlari')
    .insert({ ...temiz, doctor_id: user.id }).select(ALANLAR).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Kaydedilemedi — şablon tablosu hazır olmayabilir.' }, { status: 500 })
  return NextResponse.json({ ok: true, sablon: data })
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Şablon seçilmedi.' }, { status: 400 })
  // DOKTOR-IZOLASYON: silme de doctor_id ile daraltılır; yabancı id bulunamaz.
  const { data, error } = await supabase.from('doktor_sablonlari').delete().eq('id', id).eq('doctor_id', user.id).select('id').maybeSingle()
  if (error) return NextResponse.json({ error: 'Silinemedi.' }, { status: 500 })
  if (!data) return yok()
  return NextResponse.json({ ok: true })
}
