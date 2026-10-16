/**
 * NOTYA-ASI-ONAM-01 — optional secondary flow: pre-visit REMOTE consent request. The doctor (when
 * an appointment is created, or the day before) picks the planned vaccines; this route records
 * the request (mutable workflow state — lib/db/migrations/161_asi_onam.sql) and enqueues ONE
 * notice through the existing one-tap channel (lib/iletisim — doctor's own WhatsApp account is
 * this product's literal "doctor's own number" patient channel; e-posta is the second channel).
 * No new send mechanism: it reuses HazirMesajlar / GonderDugmesi exactly as asi_hatirlatma and
 * saglikim_yeni_mesaj already do — see lib/iletisim/README.md "no clinical content in any
 * message": the queued notice never names a vaccine, only points at the Sağlığım link where the
 * parent actually reviews and confirms (app/api/portal/hasta/[token]/asi-onam/route.ts).
 *
 * HASTA-IZOLASYON-01: patientId / randevuId / sessionId are all proven to belong to this doctor
 * before any read or write.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { asiOnamIstegiHazirla } from '@/lib/asi/onam/asiOnamMotoru'
import { VARSAYILAN_ONAM_DILI } from '@/lib/asi/onam/dil'
import { asiOnamTalebiKuyrugaEkle } from '@/lib/iletisim/sunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const { data, error } = await supabase.from('asi_onam_talepleri').select('*').eq('doktor_id', doktorId).eq('patient_id', patientId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Talepler alınamadı.' }, { status: 500 })
  return NextResponse.json({ talepler: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user } = oturum

  const body = await req.json().catch(() => ({}))
  const { patientId, randevuId, sessionId, asilar, bildirimKanali, dil } = body as {
    patientId?: string
    randevuId?: string | null
    sessionId?: string | null
    asilar?: unknown
    bildirimKanali?: string
    dil?: string
  }
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  if (randevuId) {
    const { data: r } = await supabase.from('randevular').select('id, patient_id').eq('id', randevuId).eq('doktor_id', doktorId).maybeSingle()
    if (!r) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
    if (r.patient_id && r.patient_id !== patientId) return NextResponse.json({ error: 'Randevu bu hastaya ait değil.' }, { status: 400 })
  }
  if (sessionId) {
    const seans = await seansSahibi(supabase, doktorId, sessionId)
    if (!seans) return NextResponse.json({ error: 'Muayene bulunamadı.' }, { status: 404 })
  }

  const kanal = bildirimKanali === 'eposta' || bildirimKanali === 'whatsapp' || bildirimKanali === 'dogrudan-portal' ? bildirimKanali : null
  if (!kanal) return NextResponse.json({ error: 'Geçerli bir bildirim kanalı seçin (e-posta / WhatsApp / doğrudan Sağlığım).' }, { status: 400 })

  // Reuses the dataset validation only — the frozen snapshot itself is built again at the moment
  // the parent actually confirms (app/api/portal/.../asi-onam POST), never reused stale from here.
  const istek = asiOnamIstegiHazirla(asilar, dil || VARSAYILAN_ONAM_DILI)
  if (!istek.ok) return NextResponse.json({ error: istek.hata }, { status: 400 })

  const { data: talep, error } = await supabase
    .from('asi_onam_talepleri')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      randevu_id: randevuId || null,
      session_id: sessionId || null,
      asilar: istek.asilar,
      dil: dil || VARSAYILAN_ONAM_DILI,
      bildirim_kanali: kanal,
      olusturan_id: user.id,
    })
    .select()
    .single()
  if (error || !talep) return NextResponse.json({ error: 'Talep oluşturulamadı.' }, { status: 500 })

  if (kanal !== 'dogrudan-portal') {
    try { await asiOnamTalebiKuyrugaEkle(supabase, { doctorId: doktorId, patientId, talepId: talep.id }) } catch { /* fail soft — talep is still on file, doctor can resend from the queue */ }
  }

  return NextResponse.json({ talep })
}
