/**
 * AYSE-OGRENME-V3 / 3 — Klinik ortak üslup: açık rıza anahtarı (varsayılan KAPALI).
 * GET  -> { uye, aktif, gelen }  (gelen = havuzdan size gelen kural SAYISI; metin ve yazar dönmez)
 * POST { ac: true | false } -> katıl / ayrıl (ayrılınca havuzdaki kuralları silinir).
 * Doktor kapsamı doktorId; sekreter erişemez (sadeceDoktor).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { klinikDurumu, klinikKurallariYukle, klinikUslupAc, klinikUslupKapat } from '@/lib/doktor/ogrenme/klinikUslup'

export const dynamic = 'force-dynamic'
const NOSTORE = { 'Cache-Control': 'no-store' }

async function durum(oturum: { supabase: import('@supabase/supabase-js').SupabaseClient; doktorId: string }) {
  const d = await klinikDurumu(oturum.supabase, oturum.doktorId).catch(() => ({ uye: false, clinicId: null, aktif: false }))
  const gelen = d.aktif ? (await klinikKurallariYukle(oturum.supabase, oturum.doktorId, 40)).length : 0
  return { uye: d.uye, aktif: d.aktif, gelen }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  return NextResponse.json(await durum(oturum), { headers: NOSTORE })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const body = await req.json().catch(() => ({})) as { ac?: unknown }
  if (typeof body.ac !== 'boolean') return NextResponse.json({ error: 'ac: true|false gerekli' }, { status: 400 })
  try {
    if (body.ac) {
      const r = await klinikUslupAc(oturum.supabase, oturum.doktorId)
      if (!r.ok) return NextResponse.json({ error: 'Bir klinik üyeliği bulunmuyor.' }, { status: 403 })
    } else {
      await klinikUslupKapat(oturum.supabase, oturum.doktorId)
    }
    return NextResponse.json(await durum(oturum), { headers: NOSTORE })
  } catch (e) {
    console.error('[klinik-uslup] post', e)
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }
}
