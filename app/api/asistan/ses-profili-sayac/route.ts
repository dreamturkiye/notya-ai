/**
 * NOTYA-SES-PROFILI-01 — anonymous tuning counters for the voice profile: how many speech segments were accepted,
 * rejected, undecided or too short in a voice session. No audio, no text, no doctor id stored — only daily totals
 * per model version (ses_profili_sayaclari). A signed-in doctor is required so the endpoint cannot be spammed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { SES_PROFILI_MODEL_SURUMU } from '@/lib/asistan/sesProfili/ayar'

export const dynamic = 'force-dynamic'

const AZAMI = 5000

function sayi(x: unknown): number {
  const n = typeof x === 'number' && Number.isFinite(x) ? Math.round(x) : 0
  return Math.min(AZAMI, Math.max(0, n))
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const g = (await req.json().catch(() => ({}))) as Record<string, unknown>
  if (g.model_surumu !== SES_PROFILI_MODEL_SURUMU) return new NextResponse(null, { status: 204 })
  const s = { kabul: sayi(g.kabul), red: sayi(g.red), belirsiz: sayi(g.belirsiz), kisa: sayi(g.kisa) }
  if (!(s.kabul || s.red || s.belirsiz || s.kisa)) return new NextResponse(null, { status: 204 })
  const gun = new Date().toISOString().slice(0, 10)
  const { error } = await oturum.supabase.rpc('ses_profili_sayac_ekle', {
    p_gun: gun, p_surum: SES_PROFILI_MODEL_SURUMU, p_kabul: s.kabul, p_red: s.red, p_belirsiz: s.belirsiz, p_kisa: s.kisa,
  })
  if (error) return NextResponse.json({ ok: false }, { status: 202 })
  return new NextResponse(null, { status: 204 })
}
