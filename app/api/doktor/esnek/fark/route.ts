/**
 * ESNEK-MUAYENE-B4 — fark notu. POST { islem: 'onizle', patientId, metin } → the merged kontrol note (nothing saved);
 * POST { islem: 'kaydet', patientId, metin } or { islem: 'kaydet', kaynakId } (a hand-note change line already read) → the
 * kontrol visit's draft note (normal review / approval). Doctor only.
 * HASTA-IZOLASYON: patient via hastaSahibiMi before any read; source by id AND doctor_id; previous note by doctor_id AND the
 * patient's visits; writes by doctor_id.
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json, uuidMu } from '@/lib/esnek/rota'
import { farkKaydet, farkOnizle } from '@/lib/esnek/fark'
import { ESNEK_TR } from '@/core/esnek/metinTr'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (b?.islem === 'onizle') {
    if (!uuidMu(b.patientId)) return json({ error: 'Hasta gerekli.' }, 400)
    const r = await farkOnizle(o.supabase, o.doktorId, b.patientId, typeof b.metin === 'string' ? b.metin : '', ESNEK_TR)
    if ('hata' in r) return json({ error: r.hata }, r.durum)
    return json(r)
  }
  if (b?.islem === 'kaydet') {
    const r = await farkKaydet(o.supabase, { doktorId: o.doktorId, aktor: { userId: o.user.id, rol: o.rol }, M: ESNEK_TR, patientId: b.patientId, metin: b.metin, kaynakId: uuidMu(b.kaynakId) ? b.kaynakId : undefined })
    if ('hata' in r) return json({ error: r.hata }, r.durum)
    return json(r)
  }
  return json({ error: 'Geçersiz işlem.' }, 400)
}
