/**
 * ESNEK-MUAYENE-B2 — "Bu hafta öğrendiklerim" (at most 3). GET → the items; POST { id } → one-tap undo of exactly what the
 * overnight loop wrote (a reverted item is never re-learned). Doctor only. HASTA-IZOLASYON: candidate by id AND doctor_id.
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json } from '@/lib/esnek/rota'
import { haftalikOgrenilenler, ogrenileniGeriAl } from '@/lib/esnek/gece'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  return json({ ogeler: await haftalikOgrenilenler(o.supabase, o.doktorId) })
}

export async function POST(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { id?: unknown } | null
  if (!(await ogrenileniGeriAl(o.supabase, o.doktorId, b?.id))) return json({ error: 'Bulunamadı.' }, 404)
  return json({ ok: true, ogeler: await haftalikOgrenilenler(o.supabase, o.doktorId) })
}
