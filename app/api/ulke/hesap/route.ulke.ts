/**
 * NOTYA-ULKE-01 — GET /api/ulke/hesap: "does this session belong to an account of THIS country, and in which
 * language does it read?" Called by the core login form and the holding page.
 *
 * Answers with machine codes only (the caller shows text in the visitor's language):
 *   200 { ulke, dil, durum: 'bekletme', ad }                         where the application is not switched on
 *   200 { ulke, dil, durum: 'uygulama', ad, notDili, dilSoruldu }    where it is (feature `cekirdekMuayene`);
 *       plus { saatDilimi, saatDilimleri } where the country has more than one time zone
 *   401 { code: 'OTURUM_YOK' }    no session, an invalid one, or an account stamped with another country
 *   403 { code: 'HESAP_REDDI' }   a session whose country account row is missing or belongs to another country
 *
 * Reads only the caller's own row of `ulke_hesaplari` (id = the authenticated user, country = this build's).
 * Türkiye's `users` table is not read. No patient data, no id from the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { HESAP_REDDI_KODU } from '@/lib/ulke/hesapUlkesi'
import { aktifUlke, dilSec, ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { saatDilimiMi, saatDilimleri } from '@/lib/ulke/uygulama/saatDilimi'
import { dilTercihleriniOku } from '@/lib/ulke/uygulama/dilTercihleri'
import { ulkeTablosu } from '@/lib/ulke/uygulama/tablolar'

export const dynamic = 'force-dynamic'

const cevap = (govde: Record<string, unknown>, status: number) =>
  NextResponse.json(govde, { status, headers: { 'Cache-Control': 'no-store' } })

export const GET = sinirda('hesap GET', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return cevap({ code: 'OTURUM_YOK' }, 401)
  const { data: satir, error } = await ulkeTablosu(oturum.supabase, 'ulke_hesaplari')
    .select('id, full_name, ulke, ui_language, saat_dilimi')
    .eq('id', oturum.user.id)
    .maybeSingle()
  // Fail closed. The read is bound to this build's country (ulkeTablosu): no row, an unreadable row (the table of
  // migration 130 is missing) or an account whose row belongs to another country is not an account of this deployment.
  const s = satir as { full_name?: unknown; ulke?: unknown; ui_language?: unknown; saat_dilimi?: unknown } | null
  if (error || !s || s.ulke !== aktifUlke()) return cevap({ code: HESAP_REDDI_KODU }, 403)
  const ad = String(s.full_name || '')
  if (!ozellikAcik('cekirdekMuayene')) return cevap({ ulke: aktifUlke(), dil: dilSec(typeof s.ui_language === 'string' ? s.ui_language : null), durum: 'bekletme', ad }, 200)
  // The application has its own language list (a script variant may exist there before the public pages have it).
  const t = await dilTercihleriniOku(oturum.supabase, oturum.user.id, s.ui_language)
  // The account's own time zone — answered only where the country has more than one (elsewhere there is nothing to
  // say: the pack's zone is the only one). Its choice when that is one of the pack's zones, otherwise the default.
  const dilimler = saatDilimleri()
  const saatDilimi = dilimler.length > 1 ? { saatDilimi: saatDilimiMi(s.saat_dilimi) ? s.saat_dilimi : ulkePaketi().saatDilimi, saatDilimleri: dilimler } : {}
  return cevap({ ulke: aktifUlke(), dil: t.arayuzDili, durum: 'uygulama', ad, notDili: t.notDili, dilSoruldu: t.soruldu, ...saatDilimi }, 200)
})
