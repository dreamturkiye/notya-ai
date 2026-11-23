/**
 * ESNEK-MUAYENE-A — the doctor's handwriting lexicon. GET → entries · POST { kisaltma, anlam } (doctor) · DELETE ?id= (doctor).
 * Doğrula answers add entries automatically (lib/elNotu/dogrulaServisi.ts). HASTA-IZOLASYON: no patient id; doctor_id rows.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { sozlugeEkle } from '@/lib/elNotu/sunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const { data } = await o.supabase.from('hekim_el_sozlugu').select('id, kisaltma, anlam, kaynak, sayac, updated_at').eq('doctor_id', o.doktorId).order('kisaltma').limit(500)
  return json({ girdiler: data || [] })
}

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { kisaltma?: unknown; anlam?: unknown } | null
  if (typeof b?.kisaltma !== 'string' || typeof b?.anlam !== 'string' || !b.kisaltma.trim() || !b.anlam.trim()) return json({ error: 'Kısaltma ve anlamı gerekli.' }, 400)
  const ok = await sozlugeEkle(o.supabase, o.doktorId, b.kisaltma, b.anlam, 'elle')
  return ok ? json({ ok: true }) : json({ error: 'Kaydedilemedi.' }, 500)
}

export async function DELETE(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const id = new URL(req.url).searchParams.get('id')
  if (!uuidMu(id)) return json({ error: 'Girdi gerekli.' }, 400)
  await o.supabase.from('hekim_el_sozlugu').delete().eq('id', id).eq('doctor_id', o.doktorId)
  return json({ ok: true })
}
