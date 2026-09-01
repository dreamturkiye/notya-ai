/**
 * NOTYA-RANDEVU-01 — randevu listesi ve oluşturma.
 *
 * GET ?baslangic=ISO&bitis=ISO — appointments in a date range, for the calendar view. Both the
 * doctor and their sekreter see the SAME calendar (scoped by pratikOturum().doktorId, not by
 * who is logged in) — a shared calendar is the entire point of a secretary being able to book.
 *
 * POST — create. Server-side overlap check: two appointments for the same doctor cannot occupy
 * the same window. NBYS and Dr.Plazma both treat double-booking prevention as core, not optional
 * — a doctor's clock is the one resource that cannot be oversold.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

interface HastaOzet { id: string; ad: string; telefon: string }

async function hastaBilgisi(supabase: any, patientId: string | null): Promise<HastaOzet | null> {
  if (!patientId) return null
  const { data } = await supabase
    .from('patients')
    .select('id, name_encrypted, phone_encrypted')
    .eq('id', patientId)
    .maybeSingle()
  if (!data) return null
  let ad = 'Bilinmiyor'
  try {
    if (data.name_encrypted) ad = (JSON.parse(decrypt(data.name_encrypted)).ad || '').trim() || 'Bilinmiyor'
  } catch { /* leave default */ }
  let telefon = ''
  try {
    if (data.phone_encrypted) telefon = decrypt(data.phone_encrypted) || ''
  } catch { /* leave blank */ }
  return { id: data.id, ad, telefon }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const url = new URL(req.url)
  const baslangic = url.searchParams.get('baslangic')
  const bitis = url.searchParams.get('bitis')
  if (!baslangic || !bitis) {
    return NextResponse.json({ error: 'baslangic ve bitis (ISO tarih) zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('randevular')
    .select('*')
    .eq('doktor_id', doktorId)
    .lt('baslangic', bitis)
    .gt('bitis', baslangic)
    .order('baslangic', { ascending: true })

  if (error) return NextResponse.json({ error: 'Randevular alınamadı.' }, { status: 500 })

  const randevular = await Promise.all(
    (data || []).map(async (r: any) => {
      const hasta = await hastaBilgisi(supabase, r.patient_id)
      return {
        id: r.id,
        baslangic: r.baslangic,
        bitis: r.bitis,
        tur: r.tur,
        durum: r.durum,
        notlar: r.notlar,
        iptalNedeni: r.iptal_nedeni,
        patientId: r.patient_id,
        hastaAdi: hasta?.ad || r.hasta_adi_serbest || 'İsimsiz',
        hastaTelefon: hasta?.telefon || r.hasta_telefon_serbest || '',
        kayitliHasta: !!hasta,
      }
    })
  )

  return NextResponse.json({ randevular })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user } = oturum

  const body = await req.json().catch(() => ({}))
  const { patientId, hastaAdiSerbest, hastaTelefonSerbest, baslangic, bitis, tur, notlar } = body as {
    patientId?: string
    hastaAdiSerbest?: string
    hastaTelefonSerbest?: string
    baslangic?: string
    bitis?: string
    tur?: string
    notlar?: string
  }

  if (!baslangic || !bitis) {
    return NextResponse.json({ error: 'Başlangıç ve bitiş saati zorunludur.' }, { status: 400 })
  }
  if (new Date(bitis) <= new Date(baslangic)) {
    return NextResponse.json({ error: 'Bitiş saati başlangıçtan sonra olmalıdır.' }, { status: 400 })
  }
  if (!patientId && !hastaAdiSerbest?.trim()) {
    return NextResponse.json({ error: 'Kayıtlı hasta seçin veya hasta adı girin.' }, { status: 400 })
  }

  // Overlap check: any existing (non-cancelled) appointment for this doctor whose window
  // intersects the requested one. Standard interval overlap: existing.start < new.end AND
  // existing.end > new.start.
  const { data: cakisan, error: cakismaHata } = await supabase
    .from('randevular')
    .select('id, baslangic, bitis, hasta_adi_serbest, patient_id')
    .eq('doktor_id', doktorId)
    .neq('durum', 'iptal')
    .lt('baslangic', bitis)
    .gt('bitis', baslangic)
    .limit(1)

  if (cakismaHata) return NextResponse.json({ error: 'Çakışma kontrolü yapılamadı.' }, { status: 500 })
  if (cakisan && cakisan.length > 0) {
    return NextResponse.json(
      { error: 'Bu saat aralığında zaten bir randevu var. Lütfen başka bir saat seçin.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('randevular')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId || null,
      hasta_adi_serbest: patientId ? null : hastaAdiSerbest?.trim() || null,
      hasta_telefon_serbest: patientId ? null : hastaTelefonSerbest?.trim() || null,
      baslangic,
      bitis,
      tur: tur || 'muayene',
      notlar: notlar?.trim() || null,
      olusturan_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Randevu oluşturulamadı.' }, { status: 500 })
  return NextResponse.json({ randevu: data })
}
