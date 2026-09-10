/**
 * NOTYA-RECETE-03 — kâğıt reçete başlığı (doktorun kendi yazdığı satırlar, diploma no, logo).
 * Kaan (2026-09-10). Tek JSONB kolon (users.recete_baslik); logo data URL ≤ 120 KB.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const body = await req.json().catch(() => ({})) as { satirlar?: unknown; diplomaNo?: unknown; logoDataUrl?: unknown }
  const satirlar = Array.isArray(body.satirlar) ? body.satirlar.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 6).map((x) => x.slice(0, 120)) : []
  const diplomaNo = String(body.diplomaNo ?? '').trim().slice(0, 40)
  let logoDataUrl = String(body.logoDataUrl ?? '').trim()
  if (logoDataUrl && (!/^data:image\/(png|jpeg|webp);base64,/.test(logoDataUrl) || logoDataUrl.length > 160_000)) {
    return NextResponse.json({ error: 'Logo PNG/JPEG olmalı ve 120 KB altında kalmalı.' }, { status: 400 })
  }
  const { error } = await oturum.supabase.from('users').update({ recete_baslik: { satirlar, diplomaNo, logoDataUrl } }).eq('id', oturum.doktorId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
