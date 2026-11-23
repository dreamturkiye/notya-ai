/**
 * ESNEK-MUAYENE-B6 — "Notya sizi böyle tanıyor". GET → the learned profile (working style, approval habit, abbreviations,
 * style rules, suggestion preferences, autonomy steps, shadow mode). PATCH { islem, … } → one-tap correction / undo of one
 * line. Doctor only. HASTA-IZOLASYON: no patient id; every row by doctor_id (a lexicon / rule row by id AND doctor_id).
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json } from '@/lib/esnek/rota'
import { profilIslem, profilYukle } from '@/lib/esnek/profil'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  return json(await profilYukle(o.supabase, o.doktorId))
}

export async function PATCH(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || !(await profilIslem(o.supabase, o.doktorId, o.user.id, b))) return json({ error: 'Kaydedilemedi.' }, 400)
  return json(await profilYukle(o.supabase, o.doktorId))
}
