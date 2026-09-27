/**
 * NOTYA-MESLEKTAS-V2 Faz 2 — kullanım olayı (PII yok). sendBeacon veya keepalive.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { olayPiiIcerirMi, SAYFA_TIPLERI, EYLEMLER } from '@/lib/telemetri/kullanim'

export const dynamic = 'force-dynamic'

const SAYFA = new Set<string>(SAYFA_TIPLERI)
const EYLEM = new Set<string>(EYLEMLER)

export async function POST(req: NextRequest) {
  const ham = await req.json().catch(() => ({})) as { olaylar?: unknown; erisim?: string }
  let istek = req
  if (!req.headers.get('authorization') && typeof ham.erisim === 'string' && ham.erisim.length > 20) {
    const h = new Headers(req.headers)
    h.set('authorization', `Bearer ${ham.erisim}`)
    istek = new NextRequest(req.url, { method: 'POST', headers: h })
  }
  const oturum = await pratikOturum(istek)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const liste = Array.isArray(ham.olaylar) ? ham.olaylar.slice(0, 40) : []
  const satirlar: Record<string, unknown>[] = []
  for (const o of liste) {
    if (!o || typeof o !== 'object') continue
    if (olayPiiIcerirMi(o)) continue
    const r = o as { sayfa?: string; eylem?: string; onceki?: string | null; sureMs?: number; cihaz?: string }
    if (!r.sayfa || !SAYFA.has(r.sayfa) || !r.eylem || !EYLEM.has(r.eylem)) continue
    if (r.onceki && !SAYFA.has(r.onceki) && !EYLEM.has(r.onceki)) continue
    satirlar.push({
      doctor_id: doktorId,
      sayfa_tipi: r.sayfa,
      eylem: r.eylem,
      onceki: r.onceki || null,
      sure_ms: typeof r.sureMs === 'number' ? Math.max(0, Math.round(r.sureMs)) : null,
      cihaz: typeof r.cihaz === 'string' ? r.cihaz.slice(0, 20) : null,
    })
  }
  if (satirlar.length) {
    const { error } = await supabase.from('doktor_kullanim_olaylari').insert(satirlar)
    if (error) return NextResponse.json({ ok: false }, { status: 204 })
  }
  return new NextResponse(null, { status: 204 })
}
