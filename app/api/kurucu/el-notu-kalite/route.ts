/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the founder's El Notu quality dashboard (app/kurucu/el-notu/page.tsx).
 *
 *   GET   200 ElNotuKaliteVerisi   numbers only (lib/kurucu/elNotuKalite.ts): per doctor / branş weekly trend, regression set
 *                                  trend + size, branş lexicon proposals (abbreviation + meaning + doctor count)
 *   POST  { id, karar: 'onayli' | 'reddedildi' | 'oneri' }   approve / reject / reopen one branş lexicon proposal
 *   404   everyone who is not on FOUNDER_EMAILS (lib/kurucu/erisim.ts) — the same answer as no route at all
 *
 * Takes no patient, note or session id; the only id is a proposal row's (no doctor, no patient in it).
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { elNotuKaliteVerisi } from '@/lib/kurucu/elNotuKalite'
import { bransOneriKarari } from '@/lib/elNotu/bransSozluk'

export const dynamic = 'force-dynamic'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET(req: NextRequest) {
  const sb = servisSupabase()
  if (!(await kurucuOturumu(req, sb))) return yokCevabi()
  return NextResponse.json(await elNotuKaliteVerisi(sb), { headers: BASLIK })
}

export async function POST(req: NextRequest) {
  const sb = servisSupabase()
  const kurucu = await kurucuOturumu(req, sb)
  if (!kurucu) return yokCevabi()
  const b = (await req.json().catch(() => null)) as { id?: unknown; karar?: unknown } | null
  const r = await bransOneriKarari(sb, { id: b?.id, karar: b?.karar, userId: kurucu.id })
  if ('hata' in r) return NextResponse.json({ error: r.hata }, { status: r.durum, headers: BASLIK })
  return NextResponse.json({ ok: true }, { headers: BASLIK })
}
