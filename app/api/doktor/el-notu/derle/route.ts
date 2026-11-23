/**
 * ESNEK-MUAYENE-A — POST { sessionId } → the visit's note from all its sources (Muayene Derleyici), with or without a
 * transcript; a late source regenerates only the sections it may change. Doctor, or staff with 'elnotu.hazirla' when the
 * doctor lets the secretary prepare his hand notes. HASTA-IZOLASYON: seansSahibi in muayeneDerle; writes by doctor_id.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { muayeneDerle } from '@/lib/elNotu/derlemeServisi'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { sessionId?: unknown } | null
  if (!uuidMu(b?.sessionId)) return json({ error: 'Muayene gerekli.' }, 400)
  const kota = await aiKotaKullan(o.supabase, o.doktorId, 'soap')
  if (!kota.izin) return json({ error: KOTA_MESAJI }, 429)
  try {
    const r = await muayeneDerle(o.supabase, { doktorId: o.doktorId, sessionId: b!.sessionId as string, aktor: o.aktor, metin: EL_NOTU_TR })
    if ('hata' in r) return json({ error: r.hata }, r.durum)
    return json(r)
  } catch (e) {
    console.error(`[el-notu/derle] ${e instanceof Error ? e.name : 'Hata'}`)
    return json({ error: 'Not oluşturulamadı. Lütfen tekrar deneyin — kaynaklar kaybolmadı.' }, 500)
  }
}
