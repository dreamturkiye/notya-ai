/**
 * PEDI-ARACLAR-02 — Araçlar › Pediatri kohort paneli API.
 * GET → { satirlar, toplamCocuk } (hekimin 18 yaş altı hastaları; aşı gecikmesi, kaçan izlem, persentil kayması,
 *   D vitamini / demir, işitme · görme · otizm taraması).
 * POST { patientIds[] } → her çocuk için hasta-güvenli hatırlatma (Sağlığım › Mesajlar + e-posta bildirimi).
 * Kimlikler pediKohortVerisi(doktorId) süzgecinden geçmeden hiçbir mesaj yazılmaz; yabancı / bayraksız kimlik atlanır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pediOturum, bugunTr } from '../_ortak'
import { pediKohortVerisi } from '../_kohort'
import { pediHatirlatmaGonder } from '../_kohortHatirlatma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  return NextResponse.json(await pediKohortVerisi(o.sb, o.doktorId, bugunTr()))
}

export async function POST(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { patientIds?: unknown } | null
  const ids = (Array.isArray(b?.patientIds) ? b!.patientIds : []).map(String).filter((x) => /^[0-9a-f-]{8,64}$/i.test(x)).slice(0, 50)
  if (!ids.length) return NextResponse.json({ error: 'Hasta seçin.' }, { status: 400 })
  const { satirlar } = await pediKohortVerisi(o.sb, o.doktorId, bugunTr(), ids)
  let gonderilen = 0, atlanan = 0
  for (const s of satirlar) {
    const r = await pediHatirlatmaGonder(o.sb, o.doktorId, s.patientId, s.bayraklar)
    if (r === 'gonderildi') gonderilen++; else atlanan++
  }
  // Seçilip kohortta olmayan (bayraksız / başka hekimin) kimlikler sessizce atlanır.
  atlanan += ids.length - satirlar.length
  return NextResponse.json({ ok: true, gonderilen, atlanan })
}
