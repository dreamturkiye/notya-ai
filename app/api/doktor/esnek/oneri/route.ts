/**
 * ESNEK-MUAYENE-B5 — the doctor's suggestion profile (per type: quieted / surfaced / normal; safety is never quieted).
 * GET → { profil }. Doctor only. HASTA-IZOLASYON: no patient id; rows by doctor_id.
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json } from '@/lib/esnek/rota'
import { oneriProfiliYukle } from '@/lib/esnek/oneriServisi'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  return json({ profil: (await oneriProfiliYukle(o.supabase, o.doktorId)).profil })
}
