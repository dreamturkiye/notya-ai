/**
 * NOTYA-OGRENME-03 — Meslektaş hafızası okuma/unutma ucu.
 *
 * GET  -> sesli Ayşe (ElevenLabs promptu istemcide kurulur) ve şeffaflık için:
 *         ilişki durumu, karşılama seçimi, kısa ses bloğu, aktif kayıtlar.
 * POST -> doktorun elle söylediği bir bilgiyi kaydet ({kategori, anahtar, deger})
 *         veya unut ({unut: "anahtar"}). "Şefe söylemek" — anında kesin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hafizaYukle, hafizaBloguSes, karsilamaSecimi, hafizaKaydet, hafizaUnut, type HafizaKategori } from '@/lib/doktor/hafiza'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  try {
    const h = await hafizaYukle(supabase, doktorId)
    return NextResponse.json({
      iliski: {
        seans: h.iliski.seans_sayisi,
        asama: h.asama,
        toplamNot: h.iliski.toplam_not,
        toplamSohbet: h.iliski.toplam_sohbet,
        toplamDuzeltme: h.iliski.toplam_duzeltme,
        ozet: h.iliski.ozet,
        rutin: h.iliski.rutin,
      },
      karsilama: karsilamaSecimi(h.iliski),
      sesBlogu: hafizaBloguSes(h),
      kayitlar: [...h.kesinKayitlar, ...h.belirsizKayitlar],
    })
  } catch (e) {
    console.error('[hafiza] get', e)
    return NextResponse.json({ iliski: { seans: 0, asama: 'tanisma' }, karsilama: { tanit: true, onSoz: '' }, sesBlogu: '', kayitlar: [] })
  }
}

const KATEGORILER: HafizaKategori[] = ['klinik', 'uslup', 'rutin', 'iletisim', 'kisisel', 'uygulama']

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => ({})) as { kategori?: string; anahtar?: string; deger?: string; unut?: string }
  try {
    if (body.unut) {
      await hafizaUnut(supabase, doktorId, body.unut)
      return NextResponse.json({ ok: true, unutuldu: body.unut })
    }
    if (!body.kategori || !KATEGORILER.includes(body.kategori as HafizaKategori) || !body.anahtar || !body.deger) {
      return NextResponse.json({ error: 'kategori, anahtar ve deger zorunludur.' }, { status: 400 })
    }
    await hafizaKaydet(supabase, doktorId, {
      kategori: body.kategori as HafizaKategori, anahtar: body.anahtar, deger: body.deger, kaynak: 'doktor_soyledi',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[hafiza] post', e)
    return NextResponse.json({ error: 'Hafıza kaydedilemedi.' }, { status: 500 })
  }
}
