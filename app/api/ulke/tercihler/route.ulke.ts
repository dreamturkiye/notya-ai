/**
 * NOTYA-UZ-MUAYENE-01 — POST /api/ulke/tercihler: the account's interface language and note language.
 * Called by the first-login question (/start) and by the settings page (/settings). Saving also marks the
 * question as answered.
 *
 *   200 { ok: true, dil, notDili }
 *   400 { code: 'GECERSIZ', alan }   a language the country's application does not offer
 *   401 { code: 'OTURUM_YOK' }       no session, or an account of another country
 *   404 { code: 'NOT_FOUND' }        the feature is off in this country
 *
 * Writes only the caller's own rows (id = the authenticated account). No id is read from the request.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { ozellikAcik, uygulamaDiliMi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { dilTercihleriniYaz } from '@/lib/ulke/uygulama/dilTercihleri'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uygulamaDiliMi(g.arayuzDili)) return KOD.gecersiz('arayuzDili')
  if (!uygulamaDiliMi(g.notDili)) return KOD.gecersiz('notDili')
  const tamam = await dilTercihleriniYaz(oturum.supabase, oturum.user.id, { arayuzDili: g.arayuzDili, notDili: g.notDili })
  if (!tamam) return KOD.basarisiz()
  return cevap({ ok: true, dil: g.arayuzDili, notDili: g.notDili })
}
