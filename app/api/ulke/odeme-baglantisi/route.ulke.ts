/**
 * AU-BETA-01 — /api/ulke/odeme-baglantisi: the doctor's OWN merchant-account connection (bring-your-own). Doctor's session only.
 *   POST   { saglayici: 'stripe'|'tyro', anahtar }   stores the TEST-mode key encrypted; a live key answers 400 CANLI_MOD
 *   DELETE                                              removes it
 * The key is never returned and never logged. No adapter for Stripe or Tyro exists yet: payments run on the demo adapter.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { baglantiKaydet, baglantiOku, baglantiSil } from '@/lib/ulke/fatura/fatura'

export const dynamic = 'force-dynamic'

export const POST = sinirda('odeme-baglantisi POST', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await baglantiKaydet(oturum.supabase, oturum.user.id, { saglayici: g.saglayici, anahtar: g.anahtar })
  if (r === 'TAMAM') return cevap({ ok: true, baglanti: await baglantiOku(oturum.supabase, oturum.user.id) })
  return cevap({ code: r }, r === 'BASARISIZ' ? 500 : 400)
})

export const DELETE = sinirda('odeme-baglantisi DELETE', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return (await baglantiSil(oturum.supabase, oturum.user.id)) ? cevap({ ok: true }) : KOD.basarisiz()
})
