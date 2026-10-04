/**
 * NOTYA-TAKIP-01 — prepare kontrol_hatirlatma in each practice's Hazır mesajlar queue
 * for open kontrol cases whose vade is due (or recently overdue).
 *
 * Does NOT auto-send (kontrol_hatirlatma is outside OTOMATIK_TURLER) — doctor taps send,
 * same policy as aşı hatırlatma. Soft-fails when takip_isleri is not migrated yet.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { takipHatirlatmalariHazirla, takipSenkronize } from '@/lib/doktor/takip'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }

  const sb = servisSupabase()
  const bugun = bugunTrIso()

  const { data: doktorlar, error } = await sb.from('takip_isleri')
    .select('doktor_id')
    .eq('durum', 'acik')
    .eq('tur', 'kontrol')
    .limit(2000)

  if (error) {
    if (tabloYokMu(error)) {
      return NextResponse.json({ calisma_zamani: new Date().toISOString(), hazir: false, hazirlanan: 0 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ids = [...new Set((doktorlar || []).map((d) => String(d.doktor_id)))]
  let hazirlanan = 0
  for (const doktorId of ids.slice(0, 200)) {
    await takipSenkronize(sb, doktorId)
    hazirlanan += await takipHatirlatmalariHazirla(sb, doktorId, bugun)
  }

  return NextResponse.json({
    calisma_zamani: new Date().toISOString(),
    hazir: true,
    doktor: ids.length,
    hazirlanan,
  })
}
