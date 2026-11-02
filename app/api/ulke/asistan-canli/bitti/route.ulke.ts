/**
 * /api/ulke/asistan-canli/bitti - a live-assistant call has ended (STRIPE-NOTYA-AU-05, Kaan 2026-11-02, pricing/limits only).
 *
 *   POST { notya_jeton, saniye? }   204 (recorded or not: nothing to tell the browser) · 401 OTURUM_YOK when the body
 *                                   carries no valid call token of this country (e.g. a portal key: never a doctor's call)
 *
 * The browser sends the call's own token once, when the call ends (keepalive, so a closed tab still sends it). The
 * account comes from the signed token only; the seconds are bounded by the token's issue time
 * (lib/ulke/uygulama/sesDakikaSiniri.ts). No patient or other id is read. A country without a minute cap records nothing.
 */
import { NextRequest } from 'next/server'
import { aktifUlke, ozellikAcik } from '@/lib/ulke/ulke'
import { govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cagriSuresiYaz } from '@/lib/ulke/uygulama/sesDakikaSiniri'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { canliJetonuDogrula } from '@/lib/ulke/asistan/jeton'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export const POST = sinirda('asistan-canli bitti', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const govde = await govdeOku(req)
  // The signed call token is this route's only credential: anything else (a portal token or session) is refused.
  if (!canliJetonuDogrula(govde.notya_jeton, aktifUlke())) return KOD.oturumYok()
  await cagriSuresiYaz(ulkeServisSupabase(), aktifUlke(), govde.notya_jeton, govde.saniye)
  return new Response(null, { status: 204 })
})
