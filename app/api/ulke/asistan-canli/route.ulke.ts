/**
 * /api/ulke/asistan-canli — the live spoken assistant of a country (AU-CANLI-01).
 *
 *   GET   is it available for this account?          200 { hazir: false } | { hazir: true, ad, kisaAd, cinsiyet }
 *   POST  open a call (nothing is read from the body) 200 { signed_url, voice_id, persona_ad, first_message, language,
 *                                                        notya_jeton, ekran_araci }
 *                                                     401 OTURUM_YOK · 404 NOT_FOUND (not available here: hidden) ·
 *                                                     429 LIMIT · 502 BASARISIZ · 500 BASARISIZ
 *
 * Fail closed: a country, role or deployment without every part answers `hazir: false` / 404 and the screen draws
 * nothing. No patient or other id is accepted from the request.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { KOD } from '@/lib/ulke/uygulama/cevap'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { canliBaglantiCevabi, canliDurumCevabi } from '@/lib/ulke/asistan/sunucu'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export const GET = sinirda('asistan-canli GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return canliDurumCevabi(oturum)
})

export const POST = sinirda('asistan-canli POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return canliBaglantiCevabi(oturum)
})
