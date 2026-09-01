/**
 * NOTYA-RANDEVU-01 — randevu hatırlatma. Every system researched (Dr.Plazma, Bulut Randevu,
 * RandevuNet/E-Klinik) treats an automatic pre-visit reminder as core — it is the single biggest
 * lever on no-show rate, which is the whole reason a "gelmedi" status exists downstream.
 *
 * Runs hourly (vercel.json), sends WhatsApp (falls back silently — see below) for every
 * appointment 2–3 hours out that hasn't been reminded yet. The 2–3h window rather than "next N
 * minutes" is deliberate: an hourly cron with a narrower window would miss appointments whose
 * reminder time falls between two runs.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { sendTwilioMessage } from '@/lib/doktor/twilioNotify'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }

  const supabase = servisSupabase()
  const now = new Date()
  const pencereBaslangic = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
  const pencereBitis = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString()

  const { data: randevular, error } = await supabase
    .from('randevular')
    .select('id, doktor_id, patient_id, hasta_adi_serbest, hasta_telefon_serbest, baslangic')
    .in('durum', ['planlandi', 'onaylandi'])
    .eq('hatirlatma_gonderildi', false)
    .gte('baslangic', pencereBaslangic)
    .lt('baslangic', pencereBitis)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let gonderildi = 0
  let atlandi = 0
  const hatalar: string[] = []

  for (const r of randevular || []) {
    let telefon = r.hasta_telefon_serbest || ''
    let ad = r.hasta_adi_serbest || 'Hastamız'
    if (r.patient_id) {
      const { data: hasta } = await supabase
        .from('patients')
        .select('name_encrypted, phone_encrypted')
        .eq('id', r.patient_id)
        .maybeSingle()
      if (hasta?.phone_encrypted) {
        try { telefon = decrypt(hasta.phone_encrypted) || telefon } catch { /* keep fallback */ }
      }
      if (hasta?.name_encrypted) {
        try { ad = (JSON.parse(decrypt(hasta.name_encrypted)).ad || '').trim() || ad } catch { /* keep fallback */ }
      }
    }

    if (!telefon) { atlandi++; continue }

    const saat = new Date(r.baslangic).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
    const mesaj = `Merhaba ${ad}, bugün saat ${saat} için randevunuz bulunmaktadır. Lütfen zamanında gelmeye özen gösterin.`

    const sonuc = await sendTwilioMessage({ channel: 'whatsapp', toPhone: telefon, body: mesaj })
    // Mark as reminded whether or not the send succeeded — a Twilio outage should not cause the
    // same appointment to be retried every hour with a stale "in 2-3 hours" message once the
    // window has passed. Failures are still visible in `hatalar` for the response/logs.
    await supabase.from('randevular').update({ hatirlatma_gonderildi: true }).eq('id', r.id)

    if (sonuc.ok) gonderildi++
    else hatalar.push(`${r.id}: ${sonuc.error}`)
  }

  return NextResponse.json({
    calisma_zamani: now.toISOString(),
    toplam: randevular?.length || 0,
    gonderildi,
    telefonsuz_atlandi: atlandi,
    hatalar,
  })
}
