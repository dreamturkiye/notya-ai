/**
 * NOTYA-ASI-ONAM-01 — in-clinic consent flow: GET lists a patient's immutable consent records
 * and any still-pending remote requests; POST records an in-clinic ("klinik") consent — the
 * doctor hands a tablet to the parent (or shows the screen), the parent taps
 * "Okudum, kabul ediyorum" (or declines), and the record is written ONCE, immediately, with no
 * update path afterward (lib/db/migrations/161_asi_onam.sql).
 *
 * HASTA-IZOLASYON-01: patientId (and sessionId, when given) are proven to belong to this doctor's
 * practice BEFORE any read or write. pratikOturum: doctor or their secretary may read; recording
 * a consent is kept doctor-only (clinical act) — a secretary gets 403, not a silent no-op.
 *
 * Classification against .cursor/skills/specialty-doktor-araclari/SKILL.md: this is muayene-
 * embedded (mounted inside the İnceleme/note screen, gated by asiOnamBransUygunMu — see
 * lib/asi/onam/asiOnamBransKapisi.ts), not a Doktor Araçları tile — it does not belong in
 * ORTAK_DOKTOR_ARACLARI or BRANS_DOKTOR_ARACLARI and is not added to lib/doktor/doktorAraclari.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { decrypt } from '@/lib/security/encryption'
import { asiOnamIstegiHazirla, asiOnamOnayEdenGecerliMi, type AsiOnamOnayEden } from '@/lib/asi/onam/asiOnamMotoru'
import { VARSAYILAN_ONAM_DILI } from '@/lib/asi/onam/dil'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const [kayitlarQ, talepQ] = await Promise.all([
    supabase.from('asi_onam_kayitlari').select('*').eq('doktor_id', doktorId).eq('patient_id', patientId).order('created_at', { ascending: false }),
    supabase.from('asi_onam_talepleri').select('*').eq('doktor_id', doktorId).eq('patient_id', patientId).eq('durum', 'gonderildi').order('created_at', { ascending: false }),
  ])
  if (kayitlarQ.error) return NextResponse.json({ error: 'Onam kayıtları alınamadı.' }, { status: 500 })
  return NextResponse.json({ kayitlar: kayitlarQ.data || [], bekleyenTalepler: talepQ.data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  // Recording a consent is a clinical act — keep it doctor-only (not the secretary), same
  // convention as e-reçete/SGK in pratikOturum.ts's own doc comment.
  if (oturum.rol !== 'doktor') return NextResponse.json({ error: 'Bu işlem yalnız hekim tarafından yapılabilir.' }, { status: 403 })
  const { supabase, doktorId, user } = oturum

  const body = await req.json().catch(() => ({}))
  const {
    patientId, sessionId, randevuId, asilar, durum, onayEden, dil,
  } = body as {
    patientId?: string
    sessionId?: string | null
    randevuId?: string | null
    asilar?: unknown
    durum?: string
    onayEden?: unknown
    dil?: string
  }
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  if (sessionId) {
    const seans = await seansSahibi(supabase, doktorId, sessionId)
    if (!seans) return NextResponse.json({ error: 'Muayene bulunamadı.' }, { status: 404 })
    if (seans.patient_id && seans.patient_id !== patientId) {
      return NextResponse.json({ error: 'Muayene bu hastaya ait değil.' }, { status: 400 })
    }
  }

  const durumGecerli = durum === 'reddedildi' ? 'reddedildi' : 'alindi'
  if (!asiOnamOnayEdenGecerliMi(onayEden)) {
    return NextResponse.json({ error: 'Onayı veren kişinin adı zorunludur (veli/yasal temsilci veya hastanın kendisi).' }, { status: 400 })
  }
  const onay = onayEden as AsiOnamOnayEden

  const istek = asiOnamIstegiHazirla(asilar, dil || VARSAYILAN_ONAM_DILI)
  if (!istek.ok) return NextResponse.json({ error: istek.hata }, { status: 400 })

  const { data: hasta } = await supabase.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  let dogumTarihi: string | null = null
  try { dogumTarihi = hasta?.dob_encrypted ? decrypt(String(hasta.dob_encrypted)) : null } catch { dogumTarihi = null }

  const { data, error } = await supabase
    .from('asi_onam_kayitlari')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      session_id: sessionId || null,
      randevu_id: randevuId || null,
      asilar: istek.asilar,
      icerik_anlik_goruntu: istek.icerikAnlikGoruntu,
      dil: dil || VARSAYILAN_ONAM_DILI,
      yontem: 'klinik',
      durum: durumGecerli,
      onay_eden_adi: onay.ad.trim(),
      onay_eden_yakinlik: onay.yakinlik?.trim() || null,
      onay_eden_telefon: onay.telefon?.trim() || null,
      hasta_dogum_tarihi_anlik: dogumTarihi,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Onam kaydı oluşturulamadı.' }, { status: 500 })
  return NextResponse.json({ kayit: data })
}
