import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'

/**
 * NOTYA-SAYFA-HASTA-01 (Dr. Gökhan canlı vaka, Kaan kuralı, 2026-09-26) — asistan doktoru takip eder.
 * Doktor bir hastanın sayfasını açtığında (/dashboard/doktor/hastalar/<id>[/…]) AsistanOturumContext bu rotayı
 * o gezinmede BİR KEZ çağırır: ortak asistan oturumunun odağı o hasta olur (hastayı adıyla söylemekle eş değer).
 * En son açık sinyal kazanır; adsız takip sorusu mevcut odakta kalır (NOTYA-HASTA-ODAK-01 — her mesajda sayfa
 * hastası YOK). Ses ve yazı bir sonraki turda active_context.currentPatientId'yi okur (ayseCevapla).
 * Migration yok: yalnız oturum JSON'u.
 *
 * HASTA-IZOLASYON-01: oturum id + doctor_id ile çözülür (yabancı / bilinmeyen oturum 404); hasta hastaSahibiMi ile
 * doğrulanır — başka doktorun hastası 403 ve hiçbir şey yazılmaz.
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
    return NextResponse.json({ error: 'Bu hasta size ait değil.' }, { status: 403 })
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
