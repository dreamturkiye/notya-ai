/**
 * NOTYA-ONBURO-FISILTI-01 — GET /api/doktor/on-buro-fisilti
 *
 * Desk fısıltı for the practice (doktor + sekreter via pratikOturum). Returns the single most
 * urgent Ön büro item plus total count — same "one whisper at a time" UX as clinical Fısıltı,
 * but never mixes in kohort / kalkan / lab clinical flags.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { onBuroFisiltiOgeleri } from '@/lib/doktor/onBuroFisilti'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum

  const ogeler = await onBuroFisiltiOgeleri(req, supabase, doktorId, rol)
  if (!ogeler.length) return NextResponse.json({ item: null, toplam: 0 })

  const item = { ...ogeler[0], toplamBekleyen: ogeler.length }
  return NextResponse.json({ item, toplam: ogeler.length })
}
