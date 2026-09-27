/**
 * NOTYA-OGRENME-03 + MESLEKTAS-V2 — Meslektaş hafızası okuma/unutma ucu.
 *
 * GET  -> sesli Ayşe, gün özeti, aktif kayıtlar. ?tum=1 → kapalılar dahil (Ayarlar).
 * POST -> kaydet / unut / kapat / durum (uygulanir|kapali).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hafizaYukle, hafizaYukleTum, hafizaBloguSes, karsilamaSecimi, hafizaKaydet, hafizaUnut, anahtarSlug, type HafizaKategori } from '@/lib/doktor/hafiza'
import { gunVerisiDerle, gunFazi, gunOzetiMetni, gunBlogu } from '@/lib/doktor/gunOzeti'
import { meslektasSelamSatiri, ogrenmeSelamSatiri } from '@/lib/doktor/ogrenme/selam'
import { kuralKapat } from '@/lib/doktor/ogrenme/kuralKaydet'
import { toAddressableUser, type DoctorProfile } from '@/lib/userProfile'
import { dahiliyeKilidi, dahiliyeMi } from '@/specialties/dahiliye/prompts'
import { kadinDogumKilidi, kadinDogumMi } from '@/specialties/kadin-dogum/prompts'
import { dermatolojiKilidi, dermatolojiMi } from '@/specialties/dermatoloji/prompts'
import { gozKilidi, gozMi } from '@/specialties/goz-hastaliklari/prompts'

export const dynamic = 'force-dynamic'

function sesKilidi(brans: string | null | undefined): string {
  if (dahiliyeMi(brans)) return dahiliyeKilidi('ses')
  if (kadinDogumMi(brans)) return kadinDogumKilidi('ses')
  if (dermatolojiMi(brans)) return dermatolojiKilidi('ses')
  if (gozMi(brans)) return gozKilidi('ses')
  return ''
}

function bugunTRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const tum = new URL(req.url).searchParams.get('tum') === '1'
  try {
    const [h, gunVerisi, doktorRow, tumKayit] = await Promise.all([
      hafizaYukle(supabase, doktorId),
      gunVerisiDerle(supabase, doktorId).catch(() => null),
      supabase.from('users').select('*').eq('id', doktorId).maybeSingle().then((r) => r.data),
      tum ? hafizaYukleTum(supabase, doktorId) : Promise.resolve(null),
    ])
    const doctor = toAddressableUser((doktorRow as DoctorProfile | null) || null)
    const faz = gunVerisi ? gunFazi(gunVerisi.saatTRT, h.iliski.rutin) : 'basi'
    let metin = gunVerisi ? gunOzetiMetni(gunVerisi, doctor, h.iliski, faz) : ''
    const bugun = bugunTRT()
    const sonSelam = h.iliski.ogrenme_selam_gunu || null
    const yeniKurallar = h.kesinKayitlar
      .filter((k) => k.kaynak === 'duzeltme' && k.durum !== 'kapali' && k.son_gorulme && (!sonSelam || String(k.son_gorulme).slice(0, 10) > sonSelam) && String(k.son_gorulme).slice(0, 10) !== bugun)
      .slice(0, 2)
    const ogrenmeSatir = ogrenmeSelamSatiri({ asama: h.asama, yeniKurallar })
    const meslektasSatir = meslektasSelamSatiri({
      seans: h.iliski.seans_sayisi,
      dahaOnceGosterildi: Boolean(h.iliski.meslektas_selam_at),
      kuralSayisi: h.kesinKayitlar.filter((k) => k.durum !== 'kapali').length,
      rutinBaslangic: typeof h.iliski.rutin?.tipikBaslangicSaati === 'string' ? String(h.iliski.rutin.tipikBaslangicSaati) : null,
    })
    const ekler = [ogrenmeSatir, meslektasSatir].filter(Boolean) as string[]
    if (ekler.length && metin) metin = `${metin} ${ekler.join(' ')}`
    if (ekler.length) {
      const guncelle: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (ogrenmeSatir) guncelle.ogrenme_selam_gunu = bugun
      if (meslektasSatir) guncelle.meslektas_selam_at = bugun
      void supabase.from('doktor_iliski').update(guncelle).eq('doctor_id', doktorId)
    }
    const gun = gunVerisi ? { faz, metin, blok: gunBlogu(gunVerisi, faz), veri: gunVerisi } : null
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
      sesBlogu: [hafizaBloguSes(h), sesKilidi((doktorRow as { specialty?: string } | null)?.specialty)].filter(Boolean).join('\n\n'),
      gun,
      kayitlar: tum && tumKayit ? tumKayit : [...h.kesinKayitlar, ...h.belirsizKayitlar],
    })
  } catch (e) {
    console.error('[hafiza] get', e)
    return NextResponse.json({ iliski: { seans: 0, asama: 'tanisma' }, karsilama: { tanit: true, onSoz: '' }, sesBlogu: '', gun: null, kayitlar: [] })
  }
}

const KATEGORILER: HafizaKategori[] = ['klinik', 'uslup', 'rutin', 'iletisim', 'kisisel', 'uygulama']

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => ({})) as { kategori?: string; anahtar?: string; deger?: string; unut?: string; kapat?: string; durum?: string }
  try {
    if (body.kapat || (body.durum === 'kapali' && body.anahtar)) {
      await kuralKapat(supabase, doktorId, anahtarSlug(body.kapat || body.anahtar || ''))
      return NextResponse.json({ ok: true, kapali: body.kapat || body.anahtar })
    }
    if (body.durum === 'uygulanir' && body.anahtar) {
      const slug = anahtarSlug(body.anahtar)
      await supabase.from('doktor_hafiza').update({
        durum: 'uygulanir', aktif: true, kesin: true, updated_at: new Date().toISOString(),
      }).eq('doctor_id', doktorId).eq('anahtar', slug)
      return NextResponse.json({ ok: true, durum: 'uygulanir' })
    }
    if (body.unut) {
      await hafizaUnut(supabase, doktorId, body.unut)
      await supabase.from('doktor_hafiza').update({ durum: 'kapali', updated_at: new Date().toISOString() })
        .eq('doctor_id', doktorId).eq('anahtar', anahtarSlug(body.unut))
      return NextResponse.json({ ok: true, unutuldu: body.unut })
    }
    if (!body.kategori || !KATEGORILER.includes(body.kategori as HafizaKategori) || !body.anahtar || !body.deger) {
      return NextResponse.json({ error: 'Kategori, anahtar ve değer zorunludur.' }, { status: 400 })
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
