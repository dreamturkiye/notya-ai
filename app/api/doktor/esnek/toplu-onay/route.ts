/**
 * ESNEK-MUAYENE-B3 — daily batch approval (B3, opened by the doctor). GET → waiting notes eligible for the batch, with what
 * still must be opened / seen. POST { noteIds } → approves only notes the server itself finds ready (B3 on, opened today, every
 * protected item seen), each through the ONE approval path (notOnayla). Doctor only.
 * HASTA-IZOLASYON: notes by doctor_id (arsivsizNotlar); each approval re-reads the note by id AND doctor_id.
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json } from '@/lib/esnek/rota'
import { topluListe, topluOnayla } from '@/lib/esnek/ozerklikServisi'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  return json(await topluListe(o.supabase, o.doktorId))
}

export async function POST(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { noteIds?: unknown } | null
  const r = await topluOnayla(o.supabase, o.doktorId, o.user.id, b?.noteIds)
  if ('hata' in r) return json({ error: r.hata }, r.durum)
  return json(r)
}
