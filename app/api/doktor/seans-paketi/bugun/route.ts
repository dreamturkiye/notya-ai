/**
 * NOTYA-PAKET-01 — bugünün paket sayacı. Arşivli seans yok.
 * Tablo veya plan uygun değilse şerit gizlenir, 500 yok.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { tabloYokMu, hastaAdiCoz } from '@/lib/iletisim/sunucu'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { paketSayaci } from '@/lib/seansPaketi/sayac'
import { kapiModu } from '@/lib/seansPaketi/sutKurallari'

export const dynamic = 'force-dynamic'

function ertesi(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return dt.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const sb = oturum.supabase
  let tier: string | null = null
  try {
    const { data } = await sb.from('users').select('subscription_tier').eq('id', oturum.doktorId).maybeSingle()
    tier = data?.subscription_tier ? String(data.subscription_tier) : null
  } catch { tier = null }
  if (kapiModu(tier) !== 'tam') return NextResponse.json({ goster: false })

  const gun = bugunTrIso()
  const bas = `${gun}T00:00:00+03:00`
  const bit = `${ertesi(gun)}T00:00:00+03:00`
  const { data: seanslar, error: sErr } = await arsivsizSeanslar(sb, 'id, patient_id, created_at').eq('doctor_id', oturum.doktorId).gte('created_at', bas).lt('created_at', bit)
  if (sErr) return NextResponse.json({ goster: false })
  const { data: paketler, error } = await sb.from('seans_paketleri').select('seans_id, durum').eq('doctor_id', oturum.doktorId).gte('onay_at', bas).lt('onay_at', bit)
  if (error) {
    if (tabloYokMu(error)) return NextResponse.json({ goster: false })
    return NextResponse.json({ goster: false })
  }
  const hazir = new Set((paketler || []).filter((p) => p.durum === 'hekim_onayli' || p.durum === 'kopyalandi_mbys').map((p) => String(p.seans_id || '')))
  const vizitler = seanslar || []
  const onayli = vizitler.filter((s) => hazir.has(String(s.id))).length
  const say = paketSayaci({ vizit: vizitler.length, onayli })
  const acikSeans = vizitler.filter((s) => !hazir.has(String(s.id))).slice(0, 20)
  const hastaIds = [...new Set(acikSeans.map((s) => String(s.patient_id || '')).filter(Boolean))]
  const adlar = new Map<string, string>()
  if (hastaIds.length) {
    const { data: hastalar } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', oturum.doktorId).in('id', hastaIds)
    for (const h of hastalar || []) adlar.set(String(h.id), hastaAdiCoz(h.name_encrypted) || 'Hasta')
  }
  return NextResponse.json({
    goster: true,
    ...say,
    aciklar: acikSeans.map((s) => ({ seansId: s.id, hasta: adlar.get(String(s.patient_id || '')) || 'Hasta' })),
  })
}
