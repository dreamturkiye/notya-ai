/**
 * AU-BETA-01 — /api/ulke/fatura (pack extension `uzanti.fatura`). Doctor's session only.
 *   GET   ?hasta=<id>?            200 { faturalar, baglanti, demo }
 *   POST  { hastaId, muayeneId?, kalemler }   create an invoice (draft). Totals are worked out HERE, never taken from the browser.
 *   PATCH { id, eylem: 'ode' }                 pay (demo adapter unless a verified adapter exists: see lib/ulke/fatura/odemeSaglayici.ts)
 *   PATCH { id, eylem: 'iade', kurus }         refund, full or partial, on the same adapter
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { baglantiOku, faturaIade, faturaListe, faturaOde, faturaOlustur, type FaturaRet } from '@/lib/ulke/fatura/fatura'

export const dynamic = 'force-dynamic'
const durum = (k: FaturaRet) => (k === 'NOT_FOUND' || k === 'KAPALI' ? 404 : k === 'BASARISIZ' ? 500 : k === 'DURUM' ? 409 : 400)

export const GET = sinirda('fatura GET', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const hasta = new URL(req.url).searchParams.get('hasta')
  if (hasta && !uuidMi(hasta)) return KOD.gecersiz('hasta')
  const [faturalar, baglanti] = await Promise.all([faturaListe(oturum.supabase, oturum.user.id, hasta ?? undefined), baglantiOku(oturum.supabase, oturum.user.id)])
  // The browser never gets a credential: only the provider, the mode and the last four characters.
  return cevap({ faturalar, baglanti, demo: true })
})

export const POST = sinirda('fatura POST', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.gecersiz('hastaId')
  const r = await faturaOlustur(oturum.supabase, oturum.user.id, oturum.user.user_metadata, { hastaId: g.hastaId, muayeneId: uuidMi(g.muayeneId) ? g.muayeneId : undefined, kalemler: g.kalemler })
  if (!r.tamam) return cevap({ code: r.kod }, durum(r.kod))
  return cevap({ fatura: r.fatura })
})

export const PATCH = sinirda('fatura PATCH', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.gecersiz('id')
  if (g.eylem === 'ode') {
    const r = await faturaOde(oturum.supabase, oturum.user.id, g.id)
    return r.tamam ? cevap({ ok: true }) : cevap({ code: r.kod }, durum(r.kod))
  }
  if (g.eylem === 'iade') {
    const r = await faturaIade(oturum.supabase, oturum.user.id, g.id, g.kurus)
    return r.tamam ? cevap({ ok: true, iadeKurus: r.iadeKurus }) : cevap({ code: r.kod }, durum(r.kod))
  }
  return KOD.gecersiz('eylem')
})
