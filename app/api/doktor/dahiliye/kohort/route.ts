/**
 * NOTYA-DAH-WOW W4.1 — Kronik kohort paneli API.
 * GET → { satirlar, toplamHasta } (hekimin dahiliye hastaları, bayraklı).
 * POST { patientIds[] } → her hasta için klinik değer içermeyen hatırlatma mesajı mevcut Sağlığım mesaj kanalına (hasta_mesaj_konulari).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { recallMesaji } from '@/specialties/dahiliye/engines/kohort'
import { kohortVerisi } from '../_kohort'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const v = await kohortVerisi(oturum.supabase, oturum.user.id, bugun())
  return NextResponse.json(v)
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as { patientIds?: unknown } | null
  const ids = (Array.isArray(b?.patientIds) ? b!.patientIds : []).map(String).slice(0, 50)
  if (!ids.length) return NextResponse.json({ error: 'patientIds gerekli' }, { status: 400 })
  const { satirlar } = await kohortVerisi(sb, user.id, bugun(), ids)
  const simdi = new Date().toISOString()
  let gonderilen = 0
  const atlanan: string[] = []
  for (const s of satirlar) {
    // Aynı hastaya 7 gün içinde ikinci hatırlatma gönderme
    const { data: yakin } = await sb.from('hasta_mesaj_konulari').select('id').eq('doctor_id', user.id).eq('patient_id', s.patientId).eq('konu', 'Kontrol zamanınız geldi').gte('son_mesaj_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(1)
    if (yakin?.length) { atlanan.push(s.patientId); continue }
    const m = recallMesaji(s.bayraklar)
    const { data: konu, error } = await sb.from('hasta_mesaj_konulari').insert({ doctor_id: user.id, patient_id: s.patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: simdi, okundu_hasta: false, okundu_pratik: true }).select('id').single()
    if (error || !konu) { atlanan.push(s.patientId); continue }
    await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: user.id, metin: m.metin })
    try { await notifyPatientNewPracticeMessage(sb, { doctorId: user.id, patientId: s.patientId }) } catch { /* e-posta hatası gönderimi bozmaz */ }
    gonderilen++
  }
  return NextResponse.json({ ok: true, gonderilen, atlanan: atlanan.length })
}
