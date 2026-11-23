/**
 * ESNEK-MUAYENE-B1 — gölge mod.
 *  GET  → doctor: status, the daily line, the rolling match, the offer, recent comparisons (with ?ayrinti=1); staff: whether
 *         shadow mode is in force (so the desk shows the upload panel).
 *  POST { kaynakId, kaynagi: 'yapistir' | 'yazdi' | 'not', metin? | noteId?, sureMs?, beyanDk? } → the secretary's own note
 *         for a page set already read; Notya's draft + the comparison run after the response. Doctor or staff ('elnotu.hazirla').
 *  PUT  { islem: 'baslat' | 'durdur' | 'teklif_evet' | 'teklif_hayir' | 'sekreter_yazsin' } → the doctor's choices.
 * HASTA-IZOLASYON: source by id AND doctor_id (kaynakAl) and it must be a shadow source; an existing note by id AND
 * doctor_id with the same patient; every row carries doctor_id.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json } from '@/lib/elNotu/rota'
import { esnekAyarYukle } from '@/lib/esnek/sunucu'
import { golgeDurumu, golgeEtkinMi, golgeIslem, golgeKaydet } from '@/lib/esnek/golge'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const ayar = await esnekAyarYukle(o.supabase, o.doktorId)
  if (o.rol !== 'doktor') return json({ acik: golgeEtkinMi(ayar) })
  return json(await golgeDurumu(o.supabase, o.doktorId, ayar, new URL(req.url).searchParams.get('ayrinti') === '1'))
}

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  if (!golgeEtkinMi(await esnekAyarYukle(o.supabase, o.doktorId))) return json({ error: 'Gölge mod açık değil.' }, 409)
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const kaynagi = b?.kaynagi === 'yazdi' || b?.kaynagi === 'not' ? b.kaynagi : 'yapistir'
  const r = await golgeKaydet(o.supabase, { doktorId: o.doktorId, kaynakId: b?.kaynakId, aktor: o.aktor, kaynagi, metin: b?.metin, noteId: b?.noteId, sureMs: b?.sureMs, beyanDk: b?.beyanDk })
  if ('hata' in r) return json({ error: r.hata }, r.durum)
  return json({ id: r.id })
}

export async function PUT(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const r = await golgeIslem(o.supabase, o.doktorId, o.user.id, b?.islem)
  if ('hata' in r) return json({ error: r.hata }, r.durum)
  return json(await golgeDurumu(o.supabase, o.doktorId, r.ayar))
}
