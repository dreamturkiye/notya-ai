/**
 * NOTYA-BELGE-OTO-01 — batch write of automatically evaluated documents into the muayene note.
 * No per-document approval and no revision-page navigation: one call, one write per note, idempotent per document id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { belgeleriNotaYaz } from '@/lib/doktor/belgeNotaYaz'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const body = (await req.json().catch(() => null)) as { analizIds?: unknown } | null
  const ids = Array.isArray(body?.analizIds) ? (body!.analizIds as unknown[]).filter((x): x is string => typeof x === 'string') : []
  if (!ids.length) return NextResponse.json({ error: 'analizIds gerekli' }, { status: 400 })
  const r = await belgeleriNotaYaz(oturum.supabase, oturum.user.id, ids)
  return NextResponse.json({ ok: true, ...r })
}
