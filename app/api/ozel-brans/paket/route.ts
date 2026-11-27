/**
 * BRANS-PAKETI — the professional's module templates (Özel Branşlar › Hasta alanı paketi; medical doctors: Ayarlar ›
 * Hasta alanı paketi — the same route and component, BRANS-PAKETI Phase 2).
 *   GET  → the modules of the professional's OWN branş with their acceptance state (no patient data).
 *   POST { modul, icerik } → accept (and optionally edit) one template; timestamp + history recorded. A module reaches
 *        no patient before this acceptance — the treating professional is the reviewer.
 * HASTA-IZOLASYON: doktorOturum; reads / writes brans_paket_sablon with doctor_id = session user only; the module code
 * must belong to that doctor's own branş (modulBransaAitMi). No patient id is accepted.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { sablonKabul, sablonListesi } from '@/lib/portal/bransPaketiSunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await doktorOturum(req)
  if ('hata' in o) return o.hata
  try {
    return NextResponse.json(await sablonListesi(o.supabase, o.user.id))
  } catch {
    return NextResponse.json({ error: 'Şablonlar okunamadı.' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const o = await doktorOturum(req)
  if ('hata' in o) return o.hata
  const b = await req.json().catch(() => null)
  const r = await sablonKabul(o.supabase, o.user.id, b)
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.hata }, { status: r.status })
}
