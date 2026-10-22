/**
 * AU-BETA-01 — /api/ulke/odeme-baglantisi: the doctor's OWN merchant-account connection (bring-your-own). Doctor's session only.
 *   GET                                                  the connection (provider, mode, last four, webhook set?, active?) and the webhook URL to register
 *   POST   { saglayici:'stripe', anahtar, webhookGizli? }              the owner's restricted TEST key (rk_test_…), CHECKED against Stripe before it is kept; a live key → 400 CANLI_MOD
 *   POST   { saglayici:'tyro', istemciId, istemciGizli, konumId, webhookGizli? }   Tyro Connect credentials (needs Tyro onboarding; adapter OFF until NOTYA_TYRO_ETKIN=1)
 *   DELETE                                              removes it
 * The credentials are never returned and never logged.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { baglantiKaydet, baglantiOku, baglantiSil } from '@/lib/ulke/fatura/fatura'

const webhookUrl = (req: NextRequest, saglayici: string, doktorId: string) => `${req.nextUrl.origin}${ulkePaketi().yolOnEki ?? ''}/api/ulke/odeme-webhook/${saglayici}?d=${doktorId}`

export const dynamic = 'force-dynamic'

export const GET = sinirda('odeme-baglantisi GET', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const b = await baglantiOku(oturum.supabase, oturum.user.id)
  return cevap({ baglanti: b, webhookUrl: b ? webhookUrl(req, b.saglayici, oturum.user.id) : null })
})

export const POST = sinirda('odeme-baglantisi POST', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await baglantiKaydet(oturum.supabase, oturum.user.id, { saglayici: g.saglayici, anahtar: g.anahtar, webhookGizli: g.webhookGizli, istemciId: g.istemciId, istemciGizli: g.istemciGizli, konumId: g.konumId })
  if (r === 'TAMAM') { const b = await baglantiOku(oturum.supabase, oturum.user.id); return cevap({ ok: true, baglanti: b, webhookUrl: b ? webhookUrl(req, b.saglayici, oturum.user.id) : null }) }
  return cevap({ code: r }, r === 'BASARISIZ' ? 500 : 400)
})

export const DELETE = sinirda('odeme-baglantisi DELETE', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return (await baglantiSil(oturum.supabase, oturum.user.id)) ? cevap({ ok: true }) : KOD.basarisiz()
})
