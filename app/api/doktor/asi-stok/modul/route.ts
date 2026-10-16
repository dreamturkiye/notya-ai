/**
 * NOTYA-ASI-STOK-BARKOD-01 — hekim bazlı modül aç/kapa (branş varsayılanının üzerine yazar).
 * HASTA-IZOLASYON-01: hasta türevi kimlik yok — kapsam zaten doktorId.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { asiStokBransVarsayilaniAcikMi, asiStokEtkinDurum, getAsiStokModulAyari, setAsiStokModulAyari } from '@/lib/asi/stok/modul'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data: kullanici } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  const hamBrans = kullanici?.specialty ?? null
  const ayar = await getAsiStokModulAyari(supabase, doktorId)
  return NextResponse.json({
    aktifOverride: ayar.aktifOverride,
    faturaVarsayilan: ayar.faturaVarsayilan,
    bransVarsayilani: asiStokBransVarsayilaniAcikMi(hamBrans),
    etkinAktif: asiStokEtkinDurum(ayar, hamBrans),
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum

  const body = (await req.json().catch(() => null)) as { aktif?: unknown; faturaVarsayilan?: unknown } | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  const patch: { aktifOverride?: boolean | null; faturaVarsayilan?: boolean } = {}
  if (body.aktif === null) patch.aktifOverride = null // "branş varsayılanına dön"
  else if (typeof body.aktif === 'boolean') patch.aktifOverride = body.aktif
  if (typeof body.faturaVarsayilan === 'boolean') patch.faturaVarsayilan = body.faturaVarsayilan

  const next = await setAsiStokModulAyari(supabase, doktorId, patch)
  return NextResponse.json({ aktifOverride: next.aktifOverride, faturaVarsayilan: next.faturaVarsayilan })
}
