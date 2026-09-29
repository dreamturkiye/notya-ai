import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'

/**
 * NOTYA-SAYFA-HASTA-01 — panel etiketi doktorun açık sayfasını izler.
 * Doktor bir hastanın sayfasını açtığında AsistanOturumContext bu rotayı bir kez çağırır ve oturum
 * `currentPatientId` yazar (yuzen panel "aktif hasta"). NOTYA-SES-DOSYA-ISTE-01: bu odak chart açmaz;
 * Ayşe dosyayı yalnız bu mesajda adı geçen hasta için derler. Adsız "kaç kilo?" başka çocuğun kilosunu
 * söylemez. Migration yok: yalnız oturum JSON'u.
 *
 * HASTA-IZOLASYON-01: oturum id + doctor_id ile çözülür (yabancı / bilinmeyen oturum 404); hasta hastaSahibiMi ile
 * doğrulanır — başka doktorun hastası ile olmayan hasta AYNI cevabı verir: 404 (NOTYA-SAYFA-HASTA-02, Kaan
 * 2026-09-27: 403 "bu kimlikte bir hasta var ama sizin değil" demek olurdu; kimlikle hasta varlığı sorgulanamasın)
 * ve hiçbir şey yazılmaz.
 */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const govde = (await req.json().catch(() => ({}))) as { asistanSessionId?: unknown; patientId?: unknown }
  const asistanSessionId = String(govde.asistanSessionId || '').trim()
  const patientId = String(govde.patientId || '').trim()
  if (!asistanSessionId || !patientId) {
    return NextResponse.json({ error: 'asistanSessionId ve patientId gerekli.' }, { status: 400 })
  }

  const { data: asistanOturumu } = await supabase
    .from('asistan_sessions')
    .select('id, active_context')
    .eq('id', asistanSessionId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!asistanOturumu) return NextResponse.json({ error: 'Asistan oturumu bulunamadı.' }, { status: 404 })

  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const { data: hasta } = await supabase
    .from('patients')
    .select('name_encrypted')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  const ad = hastaAdiCoz((hasta as { name_encrypted?: string | null } | null)?.name_encrypted ?? null) || null

  // NOTYA-SES-DEVAM-01'in kalanı önceki hastanın cevabıdır — odak değişince okunmaz.
  const { sesDevam: _eskiDevam, ...baglam } = ((asistanOturumu as { active_context?: Record<string, unknown> | null }).active_context || {}) as Record<string, unknown>
  const { error } = await supabase
    .from('asistan_sessions')
    .update({
      patient_id: patientId,
      active_context: { ...baglam, currentPatientId: patientId, patientName: ad, odakKaynak: 'sayfa', odakZaman: new Date().toISOString() },
    })
    .eq('id', asistanSessionId)
    .eq('doctor_id', doktorId)
  if (error) return NextResponse.json({ error: 'Odak kaydedilemedi.' }, { status: 500 })

  return NextResponse.json({ ad })
}
