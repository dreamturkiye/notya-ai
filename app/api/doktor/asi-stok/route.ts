/**
 * NOTYA-ASI-STOK-BARKOD-01 — klinik stok listesi + yeni stok ekleme.
 * GET  → düşük stok / SKT uyarılarıyla birlikte lot listesi (modül kapalıysa 403: UI bu hâli hiç göstermemeli).
 * POST → { asiAdi, barkod, lotNo?, miktar, sonKullanmaTarihi?, birimFiyatKurus?, varsayilanUygulamaBolgesi? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { asiStokModuluAktifMiDoktor } from '@/lib/asi/stok/modul'
import { lotlariListele, stokEkle, AsiStokHatasi } from '@/lib/asi/stok/motor'
import { DUSUK_STOK_ESIGI, sktDurumu } from '@/lib/asi/stok/tipler'
import { asiBekleyenHastaIdleri } from '@/lib/asi/bekleyenler'

export const dynamic = 'force-dynamic'
const MODUL_KAPALI = 'Aşı Stok ve Barkod Sistemi bu hekim/branş için açık değil.'
const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  if (!(await asiStokModuluAktifMiDoktor(supabase, doktorId))) return NextResponse.json({ error: MODUL_KAPALI }, { status: 403 })

  const lotlar = await lotlariListele(supabase, doktorId)
  const bugun = bugunTr()
  const items = lotlar.map((l) => ({
    ...l,
    sktDurumu: sktDurumu(l.sonKullanmaTarihi, bugun),
    dusukStok: l.miktar > 0 && l.miktar <= DUSUK_STOK_ESIGI,
    stokTukendi: l.miktar === 0,
  }))
  return NextResponse.json({ lotlar: items })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum
  if (!(await asiStokModuluAktifMiDoktor(supabase, doktorId))) return NextResponse.json({ error: MODUL_KAPALI }, { status: 403 })

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  try {
    const asiAdi = String(body.asiAdi || '')
    const barkod = String(body.barkod || '')
    // NOTYA-HASTA-ILETISIMI-01: "was this lot at zero before this add" — read BEFORE stokEkle
    // mutates it, so the Hasta İletişimi "Bekleyen ailelere bildir" action knows to offer itself.
    // Non-invasive: stokEkle's own return type/behaviour (NOTYA-ASI-STOK-BARKOD-01) is untouched.
    const { data: oncekiLot } = await supabase.from('asi_stok_lotlari').select('miktar').eq('doktor_id', doktorId).eq('barkod', barkod).maybeSingle()
    const sifirdanGeldi = !!oncekiLot && oncekiLot.miktar === 0

    const lot = await stokEkle(supabase, doktorId, {
      asiAdi,
      barkod,
      lotNo: body.lotNo != null ? String(body.lotNo) : null,
      miktar: Number(body.miktar),
      sonKullanmaTarihi: body.sonKullanmaTarihi != null ? String(body.sonKullanmaTarihi) : null,
      birimFiyatKurus: body.birimFiyatKurus != null ? Number(body.birimFiyatKurus) : null,
      varsayilanUygulamaBolgesi: body.varsayilanUygulamaBolgesi != null ? String(body.varsayilanUygulamaBolgesi) : null,
      notlar: body.notlar != null ? String(body.notlar) : null,
    })

    let bekleyenSayisi = 0
    if (sifirdanGeldi) {
      try { bekleyenSayisi = (await asiBekleyenHastaIdleri(supabase, doktorId, asiAdi)).size } catch { bekleyenSayisi = 0 }
    }
    return NextResponse.json({ lot, sifirdanGeldi, bekleyenSayisi })
  } catch (e) {
    if (e instanceof AsiStokHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[asi-stok] ekleme', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Stok eklenemedi.' }, { status: 500 })
  }
}
