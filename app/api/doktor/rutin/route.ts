/**
 * NOTYA-MESLEKTAS-V2 Faz 2 — okuma + isteğe bağlı yeniden hesap (arka plan).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { rutinHesaplaVeYaz, rutinYukle } from '@/lib/doktor/ogrenme/rutinTuret'
import { arkaPlandaSurdur } from '@/lib/doktor/ogrenme/arkaPlandaOgren'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const hesapla = new URL(req.url).searchParams.get('hesapla') === '1'
  try {
    let paket = await rutinYukle(supabase, doktorId)
    if (hesapla || !paket) {
      arkaPlandaSurdur(rutinHesaplaVeYaz(supabase, doktorId).catch((e) => console.error('[rutin]', e)))
    }
    return NextResponse.json({ paket })
  } catch (e) {
    console.error('[rutin] get', e)
    return NextResponse.json({ paket: null })
  }
}
