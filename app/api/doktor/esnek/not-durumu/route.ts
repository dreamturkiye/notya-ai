/**
 * ESNEK-MUAYENE-B3 — the autonomy ladder on one note. GET ?noteId → per field: step, green / yellow / auto-accepted, the
 * sentences to look at, one-tap eligibility. POST { noteId, tur: 'acildi' | 'gordum', anahtar? } → the note was opened /
 * one protected item was seen (daily batch approval rules). Doctor only.
 * HASTA-IZOLASYON: note by id AND doctor_id (arsivsizNotlar) before anything is read or written.
 */
import { NextRequest } from 'next/server'
import { hekimIstegi, json, uuidMu } from '@/lib/esnek/rota'
import { notDurumu, notOlayi } from '@/lib/esnek/ozerklikServisi'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  const noteId = new URL(req.url).searchParams.get('noteId')
  if (!uuidMu(noteId)) return json({ error: 'Not gerekli.' }, 400)
  const d = await notDurumu(o.supabase, o.doktorId, noteId)
  if (!d) return json({ error: 'Not bulunamadı.' }, 404)
  return json(d)
}

export async function POST(req: NextRequest) {
  const o = await hekimIstegi(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { noteId?: unknown; tur?: unknown; anahtar?: unknown } | null
  if (!uuidMu(b?.noteId) || (b?.tur !== 'acildi' && b?.tur !== 'gordum')) return json({ error: 'Geçersiz istek.' }, 400)
  const ok = await notOlayi(o.supabase, o.doktorId, o.user.id, b.noteId as string, b.tur, typeof b.anahtar === 'string' ? b.anahtar.slice(0, 160) : undefined)
  if (!ok) return json({ error: 'Not bulunamadı.' }, 404)
  return json({ ok: true })
}
