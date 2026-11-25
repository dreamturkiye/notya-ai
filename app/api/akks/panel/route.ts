/**
 * AKKS panel — GET/POST /api/akks/panel with `x-akks-panel: <token>` (a pseudonymous invite created on the founder dashboard;
 * only its SHA-256 is stored; ≤ 30 days; revocable). Unknown / revoked / expired token → 404 (same as no route).
 *
 *   cevaplayici      the panel member answers the questions WITHOUT seeing Ayşe's answer, the key points or the source
 *   degerlendirici   a third reviewer grades two unlabelled answers (A / B, order per invite + item) with the AKKS rubric
 *   soru-inceleyici  a clinician approves / flags / removes the gold items of one branş
 *
 * Takes no patient, note or session id; stores no identity (the pseudonym code only).
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { yokCevabi } from '@/lib/kurucu/erisim'
import { panelDavet, panelKaydet, panelVerisi } from '@/lib/akks/veri'

export const dynamic = 'force-dynamic'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET(req: Request) {
  const sb = servisSupabase()
  const d = await panelDavet(req, sb)
  if (!d) return yokCevabi()
  return NextResponse.json(await panelVerisi(sb, d), { headers: BASLIK })
}

export async function POST(req: Request) {
  const sb = servisSupabase()
  const d = await panelDavet(req, sb)
  if (!d) return yokCevabi()
  const r = await panelKaydet(sb, d, (await req.json().catch(() => null)) as Record<string, unknown> | null)
  if ('hata' in r) return NextResponse.json({ error: r.hata }, { status: r.durum, headers: BASLIK })
  return NextResponse.json(r, { headers: BASLIK })
}
