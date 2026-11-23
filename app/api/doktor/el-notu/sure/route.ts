/**
 * ESNEK-MUAYENE-A — time meter. POST { asama, sureMs, noteId?, sessionId?, kaynakId?, patientId? } records measured active time
 * on a Notya documentation screen; GET → today's summary for the practice (Türkiye day) against the doctor's baseline.
 * HASTA-IZOLASYON: any patient / session / note / source id is checked to belong to the doctor before it is stored.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { sureYaz, kaynakAl } from '@/lib/elNotu/sunucu'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { gunlukOzet } from '@/core/elNotu/zaman'
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

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const gun = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date())
  const { data } = await o.supabase.from('dokumantasyon_sureleri').select('sure_ms, note_id, session_id, patient_id').eq('doctor_id', o.doktorId).eq('gun', gun).limit(5000)
  const ayar = await ayarYukle(o.supabase, o.doktorId)
  return json({ gun, ozet: gunlukOzet(data || [], ayar.tabanDk) })
}
