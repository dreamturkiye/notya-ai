/**
 * NOTYA-HASTA-ILETISIMI-01 — audience preview. UNIVERSAL: doktor AND personel (sekreter) both get
 * full access (pratikOturum, no sadeceDoktor guard) — see migration 166 / lib/iletisim/toplu/README.md.
 * POST { filtre } → { hedefSayisi, ornekler: [{ ad, telefon, eposta, smsHazir, epostaHazir }] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { kampanyaOnizle } from '@/lib/iletisim/toplu/kampanya'
import { gonderilebilirMi } from '@/lib/iletisim/izin'
import type { ToplamaFiltre } from '@/lib/iletisim/toplu/tipler'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = (await req.json().catch(() => null)) as { filtre?: ToplamaFiltre } | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  try {
    const { aday, hedefSayisi } = await kampanyaOnizle(supabase, doktorId, body.filtre || {})
    const smsHazirSayisi = aday.filter((h) => gonderilebilirMi({ telefon: h.telefon, izinSms: h.izinSms }, 'sms')).length
    const epostaHazirSayisi = aday.filter((h) => gonderilebilirMi({ eposta: h.eposta, izinEposta: h.izinEposta }, 'eposta')).length
    return NextResponse.json({
      hedefSayisi,
      smsHazirSayisi,
      epostaHazirSayisi,
      ornekler: aday.slice(0, 20).map((h) => ({ id: h.id, ad: h.ad, sonZiyaret: h.sonZiyaretIso, brans: h.sonBrans })),
    })
  } catch (e) {
    console.error('[hasta-iletisimi/toplu/onizleme]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Önizleme alınamadı.' }, { status: 500 })
  }
}
