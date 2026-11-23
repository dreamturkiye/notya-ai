/**
 * ESNEK-MUAYENE-B1 — POST { patientId, kanal, isleme } → the page-set source of a shadow comparison (no session: no phantom
 * visit). Called by the shared "El notu ekle" capture (same body as /api/doktor/el-notu/kaynak). Doctor, or staff with
 * 'elnotu.hazirla' while the doctor's shadow mode is in force.
 * HASTA-IZOLASYON: patientId via hastaSahibiMi before any write; idempotency lookup by doctor_id + isleme.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json } from '@/lib/elNotu/rota'
import { esnekAyarYukle } from '@/lib/esnek/sunucu'
import { golgeEtkinMi, golgeKaynagiOlustur } from '@/lib/esnek/golge'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  if (!golgeEtkinMi(await esnekAyarYukle(o.supabase, o.doktorId))) return json({ error: 'Gölge mod açık değil.' }, 409)
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (typeof b?.patientId !== 'string') return json({ error: 'Hasta gerekli.' }, 400)
  const isleme = typeof b.isleme === 'string' && /^[a-f0-9]{16,128}$/i.test(b.isleme) ? b.isleme : null
  if (!isleme) return json({ error: 'Geçersiz kaynak anahtarı.' }, 400)
  const r = await golgeKaynagiOlustur(o.supabase, { doktorId: o.doktorId, patientId: b.patientId, kanal: String(b.kanal || 'kamera'), isleme, aktor: o.aktor })
  if ('hata' in r) return json({ error: r.hata }, r.durum)
  return json({ kaynak: { id: r.kaynak.id, sessionId: null, durum: r.kaynak.durum, yeni: r.yeni } })
}
