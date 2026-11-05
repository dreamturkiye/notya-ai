/**
 * REFERANS-01 (Kaan, 2026-11-05) — /api/ulke/referans: the doctor's own referral code and what has come of it.
 *
 *   GET  200 { kod, baglanti, davet, odeyen, verilen, son12ay, bekleyen, sinir }
 *        the code is made on the first call (unique, unambiguous letters) and never changes
 *   401 OTURUM_YOK · 429 COK_FAZLA · 500 BASARISIZ
 *
 * The sign-up link carries the code (`/signup?ref=NTY-XXXX`); the trial never needs it and it gives no discount. The reward
 * (one free month for both doctors, as Stripe customer balance credit after the invited doctor's first paid invoice, at
 * most 12 a year for the inviter, never to oneself or within one clinic) is granted by the subscription webhook
 * (lib/billing/referans.ts), the same code as Türkiye's.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { referansKoduAl, referansOzeti } from '@/lib/billing/referans'
import { hizSiniri } from '@/lib/belge/hizSiniri'
import { referansIslevi } from '@/lib/ulke/belge/sunucu'
import { ulkeYolu } from '@/lib/ulke/yol'

export const dynamic = 'force-dynamic'
const SINIR = hizSiniri(20, 60_000)

export const GET = sinirda('referans GET', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!SINIR.izinli(oturum.user.id)) return cevap({ code: 'COK_FAZLA' }, 429)
  const islev = referansIslevi(oturum.supabase)
  const kod = await referansKoduAl(islev, oturum.user.id)
  if (!kod) return KOD.basarisiz()
  const ozet = await referansOzeti(islev, oturum.user.id)
  return cevap({ kod, baglanti: `${ulkeYolu('/signup')}?ref=${encodeURIComponent(kod)}`, ...(ozet ?? {}) })
})
