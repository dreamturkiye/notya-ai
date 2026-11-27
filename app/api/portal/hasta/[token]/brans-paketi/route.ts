/**
 * BRANS-PAKETI (Kaan, 2026-11-27) — the patient's branş signature modules (Sağlığım › Özel Branş page). PIN unlock required.
 *   GET  → the modules on for this patient (accepted templates only), recent entries, photo list, screening due flag.
 *   POST { modul, veri | madde | cevaplar } → one diary entry / checklist or programme tick / screening answers.
 * HASTA-IZOLASYON: token → (patient_id, doctor_id) via portalKapsami; every read / write in lib/portal/bransPaketiSunucu.ts
 * carries both columns; the module code must belong to the token doctor's own Özel Branş and be on for this patient.
 * Not on the Sağlığım bundle hot path: fetched only when a package page opens (performans-butcesi-koruma).
 */
import { NextRequest, NextResponse } from 'next/server'
import { portalKapsami, sonucYaniti } from '@/lib/saglikEvi/portalKapisi'
import { hastaPaketiOku, kayitEkle } from '@/lib/portal/bransPaketiSunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  try {
    return NextResponse.json(await hastaPaketiOku(g.sb, g.kapsam), { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[portal/brans-paketi] oku:', (e as Error).message)
    return NextResponse.json({ error: 'Bu bölüm şu an yüklenemedi.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const g = await portalKapsami(req, params.token)
  if ('hata' in g) return g.hata
  const b = await req.json().catch(() => null)
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  try {
    return sonucYaniti(await kayitEkle(g.sb, g.kapsam, b))
  } catch (e) {
    console.error('[portal/brans-paketi] kayit:', (e as Error).message)
    return NextResponse.json({ error: 'Kayıt yazılamadı.' }, { status: 500 })
  }
}
