/**
 * NOTYA-RANDEVU-01 — tekil randevu: güncelle (yeniden planla / durum değiştir), sil.
 *
 * PATCH covers three distinct actions through one endpoint, matched by which fields are sent:
 *   - reschedule: { baslangic, bitis } — re-checks the overlap window, excluding itself
 *   - status change: { durum, iptalNedeni? } — planlandi/onaylandi/tamamlandi/iptal/gelmedi
 *   - edit details: { tur, notlar }
 * DELETE removes the row outright — for a genuine mis-entry, not a real cancellation. A real
 * cancellation is PATCH durum=iptal, which keeps the record (and the reason) instead of erasing
 * it; deleting it would throw away exactly the history a doctor's day-to-day defense depends on.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data: mevcut } = await supabase
    .from('randevular')
    .select('id, baslangic, bitis')
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .maybeSingle()
  if (!mevcut) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { baslangic, bitis, durum, iptalNedeni, tur, notlar } = body as {
    baslangic?: string
    bitis?: string
    durum?: string
    iptalNedeni?: string
    tur?: string
    notlar?: string
  }

  const guncelleme: Record<string, unknown> = {}

  if (baslangic || bitis) {
    const yeniBaslangic = baslangic || mevcut.baslangic
    const yeniBitis = bitis || mevcut.bitis
    if (new Date(yeniBitis) <= new Date(yeniBaslangic)) {
      return NextResponse.json({ error: 'Bitiş saati başlangıçtan sonra olmalıdır.' }, { status: 400 })
    }
    const { data: cakisan, error: cakismaHata } = await supabase
      .from('randevular')
      .select('id')
      .eq('doktor_id', doktorId)
      .neq('id', params.id)
      .neq('durum', 'iptal')
      .lt('baslangic', yeniBitis)
      .gt('bitis', yeniBaslangic)
      .limit(1)
    if (cakismaHata) return NextResponse.json({ error: 'Çakışma kontrolü yapılamadı.' }, { status: 500 })
    if (cakisan && cakisan.length > 0) {
      return NextResponse.json(
        { error: 'Bu saat aralığında zaten bir randevu var. Lütfen başka bir saat seçin.' },
        { status: 409 }
      )
    }
    guncelleme.baslangic = yeniBaslangic
    guncelleme.bitis = yeniBitis
    // A reschedule invalidates any reminder already sent for the old time.
    guncelleme.hatirlatma_gonderildi = false
  }

  if (durum) {
    const gecerli = ['planlandi', 'onaylandi', 'tamamlandi', 'iptal', 'gelmedi']
    if (!gecerli.includes(durum)) return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    guncelleme.durum = durum
    guncelleme.iptal_nedeni = durum === 'iptal' ? iptalNedeni?.trim() || null : null
  }
  if (tur !== undefined) guncelleme.tur = tur
  if (notlar !== undefined) guncelleme.notlar = notlar?.trim() || null

  if (Object.keys(guncelleme).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('randevular')
    .update(guncelleme)
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Randevu güncellenemedi.' }, { status: 500 })
  return NextResponse.json({ randevu: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { error } = await supabase
    .from('randevular')
    .delete()
    .eq('id', params.id)
    .eq('doktor_id', doktorId)

  if (error) return NextResponse.json({ error: 'Randevu silinemedi.' }, { status: 500 })
  return NextResponse.json({ silindi: true })
}
