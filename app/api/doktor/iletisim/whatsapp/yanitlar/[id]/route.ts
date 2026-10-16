/**
 * WHATSAPP-API-01 — one-tap actions on a "Gelen Yanıtlar" card: onayla | iptal | yeniden_planla | yanitla | goruldu.
 * Doctor-only (doktorOturum). The card is loaded with id AND doctor_id; the appointment with doktor_id AND the card's own
 * patient_id (lib/iletisim/whatsapp/eylem.ts, randevuEylem.ts). The request carries only the card id, the action, an
 * optional free-text reply and an optional time that must pass the doctor's slot engine.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { KART_EYLEMLERI, kartEylemi, type KartEylemi } from '@/lib/iletisim/whatsapp/eylem'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Yanıt bulunamadı.' }, { status: 404 })
  const g = (await req.json().catch(() => null)) as { eylem?: unknown; metin?: unknown; baslangic?: unknown } | null
  const eylem = String(g?.eylem || '') as KartEylemi
  if (!KART_EYLEMLERI.includes(eylem)) return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
  const baslangic = typeof g?.baslangic === 'string' && Number.isFinite(Date.parse(g.baslangic)) ? new Date(g.baslangic).toISOString() : undefined
  const s = await kartEylemi(oturum.supabase, {
    doktorId: oturum.user.id,
    yapanId: oturum.user.id,
    kartId: id,
    eylem,
    metin: typeof g?.metin === 'string' ? g.metin : undefined,
    baslangic,
  })
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  return NextResponse.json(s)
}
