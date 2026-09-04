/**
 * GET /api/doktor/mesajlar/unread-count — badge for DoktorNav
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { count, error } = await supabase
    .from('hasta_mesaj_konulari')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', doktorId)
    .eq('okundu_pratik', false)
    .eq('pratik_arsiv', false)

  if (error) return NextResponse.json({ unreadCount: 0 })
  return NextResponse.json({ unreadCount: count || 0 })
}
