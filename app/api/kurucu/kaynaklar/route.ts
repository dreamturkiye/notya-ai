/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — founder review of the protocol library's monthly edition check.
 *
 *   GET   → { bekleyen: queue rows waiting, son: last 30 decisions, takip: per-URL last check, kapsam: per-branş coverage }
 *   POST  { id, karar: 'onayla' | 'reddet', not?, duyuru?: { belgeId, surum, yil, url } }
 *         → decides one queue row; an approved new edition may publish one announcement (Fısıltı to that document's branşlar)
 *   404   everyone not on FOUNDER_EMAILS (lib/kurucu/erisim.ts)
 *
 * Never edits the registry. Takes no patient, note or session id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { bransKapsami, TUM_BRANSLAR } from '@/lib/kaynaklar/protokolKutuphanesi'
import { incelemeKarariCoz, incelemeKarariUygula } from '@/lib/kaynaklar/protokolKutuphanesi/inceleme'

export const dynamic = 'force-dynamic'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET(req: NextRequest) {
  const sb = servisSupabase()
  if (!(await kurucuOturumu(req, sb))) return yokCevabi()
  const kolon = 'id, tur, url, belge_idleri, ayrinti, durum, created_at, karar_at, karar_notu'
  const [bekleyen, son, takip] = await Promise.all([
    sb.from('protokol_inceleme_kuyrugu').select(kolon).eq('durum', 'bekliyor').order('created_at', { ascending: false }).limit(200),
    sb.from('protokol_inceleme_kuyrugu').select(kolon).neq('durum', 'bekliyor').order('karar_at', { ascending: false }).limit(30),
    sb.from('protokol_takip_durum').select('url, http_durum, kontrol_at, degisti_at').order('kontrol_at', { ascending: false }).limit(500),
  ])
  return NextResponse.json(
    { bekleyen: bekleyen.data || [], son: son.data || [], takip: takip.data || [], kapsam: TUM_BRANSLAR.map((b) => bransKapsami(b)) },
    { headers: BASLIK },
  )
}

export async function POST(req: NextRequest) {
  const sb = servisSupabase()
  const kurucu = await kurucuOturumu(req, sb)
  if (!kurucu) return yokCevabi()
  const k = incelemeKarariCoz(await req.json().catch(() => null))
  if ('hata' in k) return NextResponse.json({ error: k.hata }, { status: 400, headers: BASLIK })
  const r = await incelemeKarariUygula(sb, k, kurucu.id)
  if ('hata' in r) return NextResponse.json({ error: r.hata }, { status: r.durum, headers: BASLIK })
  return NextResponse.json(r, { headers: BASLIK })
}
