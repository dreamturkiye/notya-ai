/**
 * NOTYA-RANDEVU-01 — kim oturum açtı: doktor mu, sekreter mi. DoktorNav ve randevu sayfası bunu
 * okuyup role-aware render eder (sekreter klinik menüleri görmez).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum

  const { data: doktor } = await supabase
    .from('users')
    .select('first_name, last_name, title')
    .eq('id', doktorId)
    .maybeSingle()

  const doktorAdi = doktor
    ? [doktor.title, doktor.first_name, doktor.last_name].filter(Boolean).join(' ').trim()
    : ''

  return NextResponse.json({ rol, doktorAdi: doktorAdi || null })
}
