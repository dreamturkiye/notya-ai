/**
 * /api/ulke/asistan-canli/yazili — the typed turn of the assistant page (AU-CANLI-02). The written chat beside the voice.
 *
 *   POST { mesaj, gecmis?: [{ rol: 'siz' | 'asistan', metin }] }   200 { cevap } · 400 GECERSIZ · 401 OTURUM_YOK ·
 *                                                                  404 NOT_FOUND (not available here: hidden) · 429 LIMIT · 502 BASARISIZ
 *
 * Fail closed like the voice: session first, feature gate, the same availability test. No patient or other id is accepted.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { KOD } from '@/lib/ulke/uygulama/cevap'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { denemeEngeli } from '@/lib/ulke/uygulama/deneme'
import { canliYaziliCevabi } from '@/lib/ulke/asistan/sunucu'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export const POST = sinirda('asistan-canli yazili POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  // STRIPE-NOTYA-AU-05 trial model: read-only after the free trial (402 DENEME_BITTI). No read where the country has no trial.
  const deneme = await denemeEngeli(oturum.supabase, oturum.user.id)
  if (deneme) return deneme
  return canliYaziliCevabi(oturum, req)
})
