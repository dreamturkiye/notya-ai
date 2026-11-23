/**
 * ESNEK-MUAYENE-B6 — the home screen's adaptive part in one request: working style (paper doctor → "El notu ekle" first, no
 * microphone push), the one daily notification of an end-of-day approver, the shadow-mode line, "Bu hafta öğrendiklerim".
 * Doctor only. HASTA-IZOLASYON: no patient id; counts and rows by doctor_id.
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json } from '@/lib/esnek/rota'
import { anaSayfaYukle } from '@/lib/esnek/profil'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  return json(await anaSayfaYukle(o.supabase, o.doktorId))
}
