/**
 * NOTYA-MUAYENE-ARSIV (Kaan, 2026-09-23) — POST /api/doktor/hastalar/[id]/sessions/[sessionId]/arsivle
 * Soft-archives one muayene (sessions.archived_at) -- same pattern as medical_documents.deleted_at:
 * visible on request, just excluded from the default Muayene Gecmisi list. Not a hard delete --
 * clinical records stay recoverable, only hidden. Doctor- and patient-scoped; the underlying note
 * (if any) is left untouched, only the session row is archived.
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
  if (seans.archived_at) return NextResponse.json({ ok: true, zaten: true })

  const { error } = await supabase.from('sessions').update({ archived_at: new Date().toISOString() }).eq('id', params.sessionId).eq('doctor_id', user.id)
  if (error) return NextResponse.json({ error: 'Arşivlenemedi' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
