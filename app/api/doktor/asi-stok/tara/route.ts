/**
 * NOTYA-ASI-STOK-BARKOD-01 — muayene ekranında barkod tarama/el girişi. Yazmaz, yalnız okur.
 * POST { barkod } → lot bilgisi + SKT durumu + engellenir mi.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { asiStokModuluAktifMiDoktor } from '@/lib/asi/stok/modul'
import { barkodTara } from '@/lib/asi/stok/motor'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  if (!(await asiStokModuluAktifMiDoktor(supabase, doktorId))) {
    return NextResponse.json({ error: 'Aşı Stok ve Barkod Sistemi bu hekim/branş için açık değil.' }, { status: 403 })
  }

  const body = (await req.json().catch(() => null)) as { barkod?: unknown } | null
  const barkod = String(body?.barkod || '').trim()
  if (!barkod) return NextResponse.json({ error: 'barkod zorunludur.' }, { status: 400 })

  const sonuc = await barkodTara(supabase, doktorId, barkod)
  return NextResponse.json(sonuc)
}
