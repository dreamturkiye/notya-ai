/**
 * MUAYENE-EKLERI-07 — "Yüklenen dosyalar" list of a visit (metadata only, never bytes).
 * Doctor AND the doctor's staff (pratikOturum → doktorId); the scope is always doktorId, never a client value.
 * Kill switch NOTYA_MUAYENE_EKLERI=off → 404 and the note screens render no section.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { muayeneEkleriAcikMi } from '@/lib/doktor/muayeneEk/bayrak'
import { seansYuklenenDosyalari } from '@/lib/doktor/muayeneEk/yuklenenDosyalar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!muayeneEkleriAcikMi()) return NextResponse.json({ error: 'Kapalı.' }, { status: 404 })
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const sessionId = req.nextUrl.searchParams.get('sessionId') || ''
  if (!sessionId) return NextResponse.json({ error: 'sessionId zorunludur.' }, { status: 400 })
  try {
    const dosyalar = await seansYuklenenDosyalari(oturum.supabase, oturum.doktorId, sessionId)
    if (!dosyalar) return NextResponse.json({ error: 'Muayene bulunamadı.' }, { status: 404 })
    return NextResponse.json({ dosyalar }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Dosyalar listelenemedi.' }, { status: 500 })
  }
}
