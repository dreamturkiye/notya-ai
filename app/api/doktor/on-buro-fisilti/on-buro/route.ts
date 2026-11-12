/**
 * WHATSAPP-ONBURO-01 — POST /api/doktor/on-buro-fisilti/on-buro { kartId, eylem }
 *
 * The front desk (doctor OR the doctor's own secretary, pratikOturum) acts on an "Ayşe ön büro" item of the Ön büro
 * fısıltısı: approve / decline an appointment request, undo an appointment Ayşe booked, or mark an item as seen.
 *
 * HASTA-IZOLASYON-01: the card is read by id AND doctor_id = the practice's doctor (never the secretary's user id) and
 * must be a front-desk card (lib/iletisim/onburo/eylem.ts); the appointment and patient behind it are the card's own,
 * resolved with doctor_id AND patient_id. The request carries only a card id (UUID-checked) and an action name — a
 * secretary cannot reach a clinical question through this route.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { obEylemiMi, onBuroKartEylemi } from '@/lib/iletisim/onburo/eylem'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { kartId?: unknown; eylem?: unknown } | null
  const kartId = typeof b?.kartId === 'string' ? b.kartId : ''
  if (!UUID.test(kartId)) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  if (!obEylemiMi(b?.eylem)) return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
  const s = await onBuroKartEylemi(o.supabase, { doktorId: o.doktorId, yapanId: o.user.id, yapan: o.rol, kartId, eylem: b.eylem })
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  return NextResponse.json(s)
}
