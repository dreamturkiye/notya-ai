/**
 * ESNEK-MUAYENE-A — time meter. POST { asama, sureMs, noteId?, sessionId?, kaynakId?, patientId? } records measured active time
 * on a Notya documentation screen; GET → today + the week (Türkiye days) against the best honest baseline (ESNEK-MUAYENE-B7).
 * HASTA-IZOLASYON: any patient / session / note / source id is checked to belong to the doctor before it is stored.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { sureYaz, kaynakAl } from '@/lib/elNotu/sunucu'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { ayarYukle } from '@/lib/elNotu/sunucu'

export const dynamic = 'force-dynamic'
const ASAMALAR = ['yakalama', 'dogrulama', 'duzenleme', 'onay', 'kayit'] as const

export async function POST(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const asama = ASAMALAR.includes(b?.asama as never) ? (b!.asama as (typeof ASAMALAR)[number]) : null
  if (!asama) return json({ error: 'Geçersiz aşama.' }, 400)
  const patientId = uuidMu(b?.patientId) && (await hastaSahibiMi(o.supabase, o.doktorId, b!.patientId as string)) ? (b!.patientId as string) : null
  const sessionId = uuidMu(b?.sessionId) && (await seansSahibi(o.supabase, o.doktorId, b!.sessionId as string)) ? (b!.sessionId as string) : null
  const kaynak = uuidMu(b?.kaynakId) ? await kaynakAl(o.supabase, o.doktorId, b!.kaynakId) : null
  let noteId: string | null = null
  if (uuidMu(b?.noteId)) { const { data } = await o.supabase.from('notes').select('id').eq('id', b!.noteId as string).eq('doctor_id', o.doktorId).maybeSingle(); noteId = data ? String(data.id) : null }
  await sureYaz(o.supabase, { doktorId: o.doktorId, patientId: patientId ?? kaynak?.patient_id ?? null, sessionId: sessionId ?? kaynak?.session_id ?? null, noteId, kaynakId: kaynak?.id ?? null, aktor: { userId: o.user.id, rol: o.rol }, asama, sureMs: Number(b?.sureMs) })
  return json({ ok: true })
}

/** ESNEK-MUAYENE-B7: today + the last 7 days, "önce" from the best honest baseline (shadow-mode measured → declared → doctor's). */
export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const ayar = await ayarYukle(o.supabase, o.doktorId)
  const { zamanYukle } = await import('@/lib/esnek/zaman')
  return json(await zamanYukle(o.supabase, o.doktorId, ayar.tabanDk))
}
