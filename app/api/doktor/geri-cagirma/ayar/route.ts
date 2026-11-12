/**
 * GERI-CAGIRMA-01 — the doctor's recall settings: the cool-down (days before the same patient is offered again for
 * the same reason). GET: doktor + personel. PUT: doctor only (a practice policy, like the booking settings).
 * No patient-derived id is accepted.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { onbellegiTemizle, ULKE } from '@/lib/geriCagirma/kaynak'
import { beklemeGunTemizle, BEKLEME_GUN_ALT, BEKLEME_GUN_UST, VARSAYILAN_BEKLEME_GUN } from '@/lib/geriCagirma/tipler'
import { tabloYokMu } from '@/lib/iletisim/sunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { data, error } = await oturum.supabase.from('geri_cagirma_ayarlari').select('bekleme_gun').eq('ulke', ULKE).eq('doctor_id', oturum.doktorId).maybeSingle()
  if (error && tabloYokMu(error)) return NextResponse.json({ kurulu: false, beklemeGun: VARSAYILAN_BEKLEME_GUN, alt: BEKLEME_GUN_ALT, ust: BEKLEME_GUN_UST })
  return NextResponse.json({ kurulu: true, beklemeGun: data ? beklemeGunTemizle((data as { bekleme_gun?: unknown }).bekleme_gun) : VARSAYILAN_BEKLEME_GUN, alt: BEKLEME_GUN_ALT, ust: BEKLEME_GUN_UST })
}

export async function PUT(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const b = (await req.json().catch(() => null)) as { beklemeGun?: unknown } | null
  const n = Number(b?.beklemeGun)
  if (!Number.isFinite(n) || n < BEKLEME_GUN_ALT || n > BEKLEME_GUN_UST) return NextResponse.json({ error: `Bekleme süresi ${BEKLEME_GUN_ALT}–${BEKLEME_GUN_UST} gün olmalı.` }, { status: 400 })
  const { error } = await oturum.supabase.from('geri_cagirma_ayarlari').upsert({ ulke: ULKE, doctor_id: oturum.doktorId, bekleme_gun: Math.round(n), updated_at: new Date().toISOString() }, { onConflict: 'ulke,doctor_id' })
  if (error) return NextResponse.json({ error: 'Ayar kaydedilemedi.' }, { status: 503 })
  onbellegiTemizle(oturum.doktorId)
  return NextResponse.json({ ok: true, beklemeGun: Math.round(n) })
}
