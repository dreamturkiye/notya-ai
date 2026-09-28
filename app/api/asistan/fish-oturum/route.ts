/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — Ayşe Kaya'nın uçtan uca Fish sesli görüşmesini açar.
 *
 * ElevenLabs'e HİÇ gidilmez (imzalı URL yok, ajan ayarı yok); başka satıcıya anahtar alınmaz — dinleme
 * (/api/asistan/fish-dinle) ve konuşma (/api/asistan/fish-ses) sunucudaki FISH_API_KEY ile. Döner: ortak asistan
 * oturumu (yazılı sohbetin oturumu verildiyse ve bu doktorunsa o; değilse yeni) — tek beyin /api/asistan/signed-url
 * ile aynı ilke: yazı ve ses TEK konuşma. Yol kapalıysa (persona Ayşe değil, Fish anahtarı yok, oturum açılamadı)
 * `{ fish: false }` — istemci Ayşe için görünür hata gösterir (ElevenLabs'e düşmez).
 *
 * HASTA-IZOLASYON-01: sayfa hastası (patientId) oturuma yazılmadan önce hastaSahibiMi(doktorId); istenen
 * asistanSessionId yalnız id + doctor_id eşleşirse yeniden kullanılır, yoksa yeni oturum açılır (yabancı oturum
 * ne okunur ne yazılır).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { asistanOturumuAc } from '@/lib/asistan/ayseCevapla'
import { fishUctanUcaAcik } from '@/lib/asistan/fishSes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id
  const q = req.nextUrl.searchParams
  const personaId = String(q.get('persona') || '').trim()
  if (!fishUctanUcaAcik(personaId)) return NextResponse.json({ fish: false })

  const istenenHasta = String(q.get('patientId') || '').trim() || null
  const patientId = istenenHasta && (await hastaSahibiMi(supabase, doktorId, istenenHasta)) ? istenenHasta : null
  let oturumId: string | null = null
  const istenenOturum = String(q.get('asistanSessionId') || '').trim()
  if (istenenOturum) {
    const { data } = await supabase.from('asistan_sessions').select('id').eq('id', istenenOturum).eq('doctor_id', doktorId).maybeSingle()
    oturumId = (data as { id?: string } | null)?.id || null
  }
  if (!oturumId) {
    const { data: u } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
    const yeni = await asistanOturumuAc(supabase, {
      doktorId, personaId, specialty: 'pediatri',
      hekimBransi: (u as { specialty?: string } | null)?.specialty, patientId,
    })
    oturumId = (yeni?.id as string) || null
  }
  if (!oturumId) return NextResponse.json({ fish: false })

  return NextResponse.json({
    fish: true,
    asistan_session_id: oturumId,
    // ses-ekran yoklaması sunucu saatinden sayar (istemci saati kayık olabilir).
    baslangic: new Date().toISOString(),
  })
}
