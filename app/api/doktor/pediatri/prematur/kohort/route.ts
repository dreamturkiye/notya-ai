/**
 * PREMATURE-MODUL — Araçlar › Prematüre kohort paneli API (yalnız pediatri; pediOturum branş kapısı).
 * GET → { satirlar, bilinmeyenSayisi, protokol } — hekimin KENDİ prematüre / ≤ 1500 g bebekleri (doctor_id kapsamlı) ve
 * geciken / yaklaşan takip kalemleri. Salt okunur: hasta mesajı, görev ya da sipariş üretmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pediOturum, bugunTr } from '../../_ortak'
import { prematurKohortGirdileri } from '../../_prematur'
import { prematurKohortSatirlari } from '@/specialties/pediatri/engines/prematurKohort'
import { prematurProtokolu } from '@/lib/clinical/prematur/protokolTR'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const protokol = prematurProtokolu('tr')
  const girdiler = await prematurKohortGirdileri(o.sb, o.doktorId, bugunTr())
  const { satirlar, bilinmeyenSayisi } = prematurKohortSatirlari(girdiler, bugunTr(), protokol)
  return NextResponse.json({ satirlar, bilinmeyenSayisi, toplamBebek: girdiler.length, protokol: { ad: protokol.ad, surum: protokol.surum } })
}
