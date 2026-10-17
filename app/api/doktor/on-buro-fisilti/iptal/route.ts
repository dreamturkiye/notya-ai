/**
 * WHATSAPP-CANCEL-01 — POST /api/doktor/on-buro-fisilti/iptal { kartId }
 *
 * The front desk (doctor OR secretary, pratikOturum) acknowledges a patient's WhatsApp cancellation in the Ön büro fısıltısı:
 * the inbox card moves from 'yeni' to 'goruldu', so the item clears for both roles and the doctor's unread badge drops.
 *
 * HASTA-IZOLASYON-01: the card is read and updated with id AND doctor_id = the practice's doctor (never user.id of a
 * secretary). Only a cancellation-class card can be acknowledged here — a secretary cannot use this route to touch a clinical
 * question. No patient id is accepted.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { iptalKartTuru } from '@/lib/iletisim/whatsapp/onBuro'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { kartId?: unknown } | null
  const kartId = typeof b?.kartId === 'string' ? b.kartId : ''
  if (!UUID.test(kartId)) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  const { data: kart } = await o.supabase.from('whatsapp_yanitlar')
    .select('id, niyet, durum, otomatik_eylem, eylem_sonucu')
    .eq('id', kartId).eq('doctor_id', o.doktorId).maybeSingle()
  if (!kart || !iptalKartTuru(kart)) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  if (kart.durum === 'yeni') {
    const { error } = await o.supabase.from('whatsapp_yanitlar').update({ durum: 'goruldu' }).eq('id', kartId).eq('doctor_id', o.doktorId).eq('durum', 'yeni')
    if (error) return NextResponse.json({ error: 'İşlem şu an yapılamadı.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
