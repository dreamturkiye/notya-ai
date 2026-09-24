/**
 * NOTYA-ARSIV-01 (Dr. Gökhan via Kaan, 2026-09-23) — POST /api/doktor/hastalar/[id]/sessions/[sessionId]/arsivden-cikar
 * Reverse of .../arsivle: clears sessions.archived_at. Same ownership check (doctor_id + patient_id
 * together, 404 otherwise). Once cleared, the muayene and its note reappear on every surface that
 * reads through lib/doktor/arsiv (dashboard, İnceleme, Ayşe, portal, export).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; sessionId: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: seans } = await supabase
    .from('sessions')
    .select('id, archived_at')
    .eq('id', params.sessionId)
    .eq('doctor_id', user.id)
    .eq('patient_id', params.id)
    .maybeSingle()
  if (!seans) return NextResponse.json({ error: 'Muayene bulunamadı' }, { status: 404 })
  if (!seans.archived_at) return NextResponse.json({ ok: true, zaten: true })

  const { error } = await supabase.from('sessions').update({ archived_at: null }).eq('id', params.sessionId).eq('doctor_id', user.id)
  if (error) return NextResponse.json({ error: 'Arşivden çıkarılamadı' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
