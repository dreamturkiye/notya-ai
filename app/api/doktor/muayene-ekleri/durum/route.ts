/**
 * MUAYENE-EKLERI-01 — kill switch durumu. İstemci bunu okur; hata/zaman aşımında "kapalı" varsayar (eski akış).
 * Hasta/belge kimliği almaz; yalnız oturum açmış kullanıcıya {acik} döner.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { muayeneEkleriAcikMi } from '@/lib/doktor/muayeneEk/bayrak'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  return NextResponse.json({ acik: muayeneEkleriAcikMi() }, { headers: { 'Cache-Control': 'private, no-store' } })
}
