/**
 * NOTYA-RANDEVU-01 / NOTYA-SEKRETER-01 — kim oturum açtı: doktor mu, sekreter mi.
 * Sekreter için personel adı (ad/soyad) döner — chrome ve ön büro bunu gösterir (Dr. yok).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hekimAdi } from '@/lib/doktor/hekimAdi'
import { personelGorunenAd, personelKisaAd } from '@/lib/doktor/personelAd'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId } = oturum

  const doktorAdi = (await hekimAdi(supabase, doktorId)) || null

  if (rol !== 'sekreter' || !personelId) {
    return NextResponse.json({ rol, doktorAdi, personelAdi: null, personelKisaAdi: null, personelAd: null, personelSoyad: null })
  }

  // NOTYA-SEKRETER-01: ad/soyad kolonları migration 119 ile gelir; yoksa ad_soyad'a düş.
  let ad: string | null = null
  let soyad: string | null = null
  let adSoyad: string | null = null

  const tam = await supabase
    .from('personel')
    .select('ad, soyad, ad_soyad')
    .eq('id', personelId)
    .maybeSingle()

  if (tam.error) {
    const eski = await supabase
      .from('personel')
      .select('ad_soyad')
      .eq('id', personelId)
      .maybeSingle()
    adSoyad = eski.data?.ad_soyad ? String(eski.data.ad_soyad) : null
  } else {
    ad = tam.data?.ad ? String(tam.data.ad) : null
    soyad = tam.data?.soyad ? String(tam.data.soyad) : null
    adSoyad = tam.data?.ad_soyad ? String(tam.data.ad_soyad) : null
  }

  const personelAdi = personelGorunenAd({ ad, soyad, adSoyad }) || null
  const kisa = personelKisaAd({ ad, soyad, adSoyad }) || null

  return NextResponse.json({
    rol,
    doktorAdi,
    personelAdi,
    personelKisaAdi: kisa,
    personelAd: ad,
    personelSoyad: soyad,
  })
}
