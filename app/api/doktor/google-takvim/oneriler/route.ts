/**
 * NOTYA-RANDEVU-V2 PR2 — a Notya appointment moved or deleted in Google Takvim is shown to the doctor as a proposal.
 * GET  → { oneriler }                       (empty when Google is dormant or not connected)
 * POST { id, islem: 'uygula' | 'yoksay' }   uygula = take Google's change; yoksay = Notya wins, event pushed back
 * Doctor only (doktorOturum). Proposal and appointment are each resolved with id AND doktor_id = user.id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { googleTakvimHazirMi } from '@/lib/randevu/v2/google/istemci'
import { bekleyenOneriler, oneriYanitla } from '@/lib/randevu/v2/google/senk'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!googleTakvimHazirMi()) return NextResponse.json({ oneriler: [] })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  return NextResponse.json({ oneriler: await bekleyenOneriler(oturum.supabase, oturum.user.id) })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, user } = oturum
  const b = (await req.json().catch(() => ({}))) as { id?: string; islem?: string }
  if (!b.id || (b.islem !== 'uygula' && b.islem !== 'yoksay')) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  const s = await oneriYanitla(supabase, user.id, String(b.id), b.islem, user.id)
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  return NextResponse.json({ ok: true })
}
