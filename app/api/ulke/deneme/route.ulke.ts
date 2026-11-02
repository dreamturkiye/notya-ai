/**
 * STRIPE-NOTYA-AU-05, trial model (Kaan, 2026-11-02) - GET /api/ulke/deneme: the caller's in-app free trial, for the
 * upgrade prompt and the read-only band. Called once when the application frame opens (the screen keeps the answer for
 * ten minutes), never per request.
 *
 *   200 { aktif: false }                                  this country has no in-app trial (nothing is read)
 *   200 { aktif: false, muaf: true }                      founder exemption (migration 186): no band, no prompt, ever
 *   200 { aktif: true, tur: 'ucretli' | 'deneme' | 'bitti', gun, kalanGun, bitis, muayene, muayeneSiniri,
 *         sesDakika, sesSiniri, istem: null | { neden: 'bitti' | 'muayene' | 'ses' | 'hatirlatma', teklif:
 *         'kurucu' | 'normal', kalanGun?, hatirlatmaGunu? } }
 *   401 { code: 'OTURUM_YOK' }   500 { code: 'BASARISIZ' }
 *
 * Machine codes and numbers only; the words are the country's (lib/billing/ulkeTicari.ts `yukseltme`). The founding
 * seat count (Stripe) is read only when a prompt is due, and cached for ten minutes. Own account only, no id from the request.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { aktifUlke } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { denemeOku } from '@/lib/ulke/uygulama/deneme'
import { sesDakikaKapisi } from '@/lib/ulke/uygulama/sesDakikaSiniri'
import { istemNedeni, teklifSec } from '@/lib/billing/deneme'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { kurucuKoltukKaldiMi, type FiyatStripe } from '@/lib/billing/kurucuTeklifi'
import { getStripe } from '@/lib/billing/stripeClient'

export const dynamic = 'force-dynamic'

export const GET = sinirda('deneme GET', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const ulke = aktifUlke()
  const ticari = ulkeTicari(ulke)
  if (!ticari?.deneme) return cevap({ aktif: false })
  const o = await denemeOku(oturum.supabase, oturum.user.id, ulke, { muayeneSay: true })
  // Fail open: an unreadable trial shows no prompt and gates nothing.
  if (!o) return cevap({ aktif: false })
  const { durum, ayar } = o
  if (durum.tur === 'muaf') return cevap({ aktif: false, muaf: true })
  const muayene = o.muayeneSayisi ?? 0
  const ses = durum.tur === 'deneme' ? await sesDakikaKapisi(oturum.supabase, oturum.user.id, ulke) : null
  const neden = istemNedeni({ durum, ayar, muayeneSayisi: muayene, sesDakika: ses?.kullanilanDakika ?? null, sesSiniri: ses?.limitDakika ?? null })
  let istem = null
  if (neden) {
    let koltukKaldi: boolean | null = null
    if (ticari.kurucu) {
      try { koltukKaldi = await kurucuKoltukKaldiMi(getStripe() as unknown as FiyatStripe, ulke) } catch { koltukKaldi = null }
    }
    istem = { ...neden, teklif: teklifSec(Boolean(ticari.kurucu), koltukKaldi) }
  }
  return cevap({
    aktif: true,
    tur: durum.tur,
    gun: durum.gun,
    kalanGun: durum.kalanGun,
    bitis: durum.bitis,
    muayene,
    muayeneSiniri: ayar.muayene,
    sesDakika: ses?.kullanilanDakika ?? null,
    sesSiniri: ticari.sesDakika?.denemeDakika ?? null,
    istem,
  })
})
