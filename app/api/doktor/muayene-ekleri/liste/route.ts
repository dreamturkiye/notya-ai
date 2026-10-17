/** MUAYENE-EKLERI-01 — seansın kayıtlı ek değerlendirmeleri (sayfa yenilenince devam). Tablo yoksa boş liste. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { muayeneEkleriAcikMi } from '@/lib/doktor/muayeneEk/bayrak'
import { seansDegerlendirmeleri } from '@/lib/doktor/muayeneEk/saklama'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!muayeneEkleriAcikMi()) return NextResponse.json({ error: 'Kapalı.' }, { status: 404 })
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const sessionId = req.nextUrl.searchParams.get('sessionId') || ''
  if (!sessionId) return NextResponse.json({ error: 'sessionId zorunludur.' }, { status: 400 })
  if (!(await seansSahibi(oturum.supabase, oturum.doktorId, sessionId))) return NextResponse.json({ error: 'Seans bulunamadı.' }, { status: 404 })
  const satirlar = await seansDegerlendirmeleri(oturum.supabase, oturum.doktorId, sessionId)
  return NextResponse.json({ degerlendirmeler: satirlar }, { headers: { 'Cache-Control': 'private, no-store' } })
}
