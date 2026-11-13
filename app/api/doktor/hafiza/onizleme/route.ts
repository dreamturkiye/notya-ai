/**
 * AYSE-OGRENME-V3 / 2 — kural önizleme: kuralın kendi kanıt notlarından önce/sonra örneği.
 * Saklı not_duzenlemeleri + deterministik fark; LLM yok. Doktor kapsamı doktorId (kanıt idleri yalnız kendi hafıza satırından).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { kuralOnizlemesiYukle } from '@/lib/doktor/ogrenme/onizleme'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const anahtar = new URL(req.url).searchParams.get('anahtar') || ''
  if (!anahtar) return NextResponse.json({ error: 'anahtar gerekli' }, { status: 400 })
  const onizleme = await kuralOnizlemesiYukle(oturum.supabase, oturum.doktorId, anahtar)
  return NextResponse.json({ onizleme }, { headers: { 'Cache-Control': 'no-store' } })
}
