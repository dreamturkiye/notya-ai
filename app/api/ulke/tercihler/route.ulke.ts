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
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, uygulamaDiliMi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { dilTercihleriniYaz } from '@/lib/ulke/uygulama/dilTercihleri'
import { hesapSaatDiliminiYaz, saatDilimiMi } from '@/lib/ulke/uygulama/saatDilimi'

export const dynamic = 'force-dynamic'

export const POST = sinirda('tercihler POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uygulamaDiliMi(g.arayuzDili)) return KOD.gecersiz('arayuzDili')
  if (!uygulamaDiliMi(g.notDili)) return KOD.gecersiz('notDili')
  // NOTYA-ULKE-SABLON-01: the account's time zone, where the country has more than one. Optional; when sent it must
  // be one of the pack's zones — checked BEFORE anything is written, so a refused request changes nothing.
  const dilimVar = g.saatDilimi !== undefined && g.saatDilimi !== null
  if (dilimVar && !saatDilimiMi(g.saatDilimi)) return KOD.gecersiz('saatDilimi')
  const tamam = await dilTercihleriniYaz(oturum.supabase, oturum.user.id, { arayuzDili: g.arayuzDili, notDili: g.notDili })
  if (!tamam) return KOD.basarisiz()
  if (dilimVar && !(await hesapSaatDiliminiYaz(oturum.supabase, oturum.user.id, g.saatDilimi))) return KOD.basarisiz()
  return cevap({ ok: true, dil: g.arayuzDili, notDili: g.notDili, ...(dilimVar ? { saatDilimi: g.saatDilimi } : {}) })
})
