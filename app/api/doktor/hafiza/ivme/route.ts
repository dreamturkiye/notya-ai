/**
 * AYSE-OGRENME-V3 / 1 — öğrenme ivmesi. Yalnız gerçek ölçüm: doktor_ogrenme_metrik (onay anında yazılan düzeltme sayısı).
 * <3 onaylı not → yeterli:false (boş durum). Hasta/not metni dönmez; doktor kapsamı doktorId.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { onayMetrikleriYukle } from '@/lib/doktor/ogrenme/metrik'
import { ivmeHesapla, haftalikHesapla } from '@/lib/doktor/ogrenme/ivme'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const metrikler = await onayMetrikleriYukle(oturum.supabase, oturum.doktorId)
  return NextResponse.json({ ivme: ivmeHesapla(metrikler), haftalik: haftalikHesapla(metrikler) }, { headers: { 'Cache-Control': 'no-store' } })
}
