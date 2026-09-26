import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { raporDerle } from '@/lib/doktor/raporDerle'

export const dynamic = 'force-dynamic'

/** NOTYA-RAPORLAR-01. Aralık: hafta | ay | 3ay | yil. Eski kontrol paneli alanları durur. */
export async function GET(request: NextRequest) {
  const oturum = await doktorOturum(request)
  if ('hata' in oturum) return oturum.hata
  const params = new URL(request.url).searchParams
  const aralik = params.get('aralik')
  try {
    const rapor = await raporDerle(oturum.supabase, oturum.user.id, aralik, new Date(), params.get('ozet') === '1')
    return NextResponse.json(rapor)
  } catch (error) {
    console.error('Rapor API hatası:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
