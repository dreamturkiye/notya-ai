/**
 * NOTYA-RANDEVU-01 → NOTYA-ILETISIM-01 (Kaan, 2026-09-25) — randevu hatırlatma.
 *
 * An automatic pre-visit reminder is still the biggest lever on no-shows, but it no longer leaves
 * from a Twilio number: once a day this cron PREPARES tomorrow's reminders in each doctor's
 * "Hazır mesajlar" queue (iletisim_kuyrugu). The doctor or the secretary opens them in the morning
 * and sends each one from the practice's OWN WhatsApp / mail with one tap. Nothing is sent here.
 *
 * Runs every day at 07:00 and 17:00 TRT (vercel.json) — the second run catches bookings made during the
 * day for tomorrow. De-duplicated by (doctor_id, tekil_anahtar = appointment id + start time):
 * running it twice, or the doctor moving the appointment, never doubles an item. Only bookings that
 * belong to a registered patient are enqueued — consent lives on the patient record.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { gunEkle, randevuAdaylari, trGunAraligi, type RandevuSatiri } from '@/lib/iletisim/kuyruk'
import { kuyrugaEkle } from '@/lib/iletisim/sunucu'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  // SEC-CRON-01: sahte x-vercel-cron başlığı yerine Vercel'in Bearer CRON_SECRET'ı (ya da elle ?secret=).
  if (!cronYetkiliMi(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }

  const supabase = servisSupabase()
  const bugun = bugunTrIso()
  const { bas, son } = trGunAraligi(gunEkle(bugun, 1))

  const { data: randevular, error } = await supabase
    .from('randevular')
    .select('id, doktor_id, patient_id, baslangic, durum')
    .in('durum', ['planlandi', 'onaylandi'])
    .not('patient_id', 'is', null)
    .gte('baslangic', bas)
    .lt('baslangic', son)
    .limit(5000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const adaylar = randevuAdaylari((randevular || []) as RandevuSatiri[], bugun)

  // HASTA-IZOLASYON-01: a reminder is only prepared for the patient of the doctor who owns the booking.
  const gecerli: typeof adaylar = []
  for (const doktorId of Array.from(new Set(adaylar.map((a) => a.doctor_id)))) {
    const buDoktor = adaylar.filter((a) => a.doctor_id === doktorId)
    const { data: hastalar } = await supabase.from('patients').select('id')
      .eq('doctor_id', doktorId).in('id', buDoktor.map((a) => a.patient_id))
    const sahip = new Set((hastalar || []).map((p) => String(p.id)))
    gecerli.push(...buDoktor.filter((a) => sahip.has(a.patient_id)))
  }

  const eklenen = await kuyrugaEkle(supabase, gecerli)
  return NextResponse.json({
    calisma_zamani: new Date().toISOString(),
    yarin_randevu: randevular?.length || 0,
    hazirlanan: eklenen,
    zaten_hazir_veya_atlandi: gecerli.length - eklenen,
  })
}
