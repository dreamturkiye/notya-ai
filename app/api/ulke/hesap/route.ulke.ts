/**
 * NOTYA-ULKE-01 — GET /api/ulke/hesap: "does this session belong to an account of THIS country, and in which
 * language does it read?" Called by the core login form and the holding page.
 *
 * Answers with machine codes only (the caller shows text in the visitor's language):
 *   200 { ulke, dil, durum: 'bekletme', ad }
 *   401 { code: 'OTURUM_YOK' }    no session, an invalid one, or an account stamped with another country
 *   403 { code: 'HESAP_REDDI' }   a session whose users row is missing or belongs to another country
 *
 * Reads only the caller's own users row (id = the authenticated user). No patient data, no id from the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { HESAP_REDDI_KODU, satirBuUlkedeMi } from '@/lib/ulke/hesapUlkesi'
import { aktifUlke, dilSec } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'

const cevap = (govde: Record<string, unknown>, status: number) =>
  NextResponse.json(govde, { status, headers: { 'Cache-Control': 'no-store' } })

export async function GET(req: NextRequest) {
  const oturum = await ulkeOturum(req)
  if (!oturum) return cevap({ code: 'OTURUM_YOK' }, 401)
  const { data: satir, error } = await oturum.supabase
    .from('users')
    .select('id, full_name, country, ui_language')
    .eq('id', oturum.user.id)
    .maybeSingle()
  // Fail closed: no row, an unreadable row (for example the columns of migration 128 are missing) or another
  // country's row is not an account of this deployment.
  if (error || !satir || typeof satir.country !== 'string' || !satirBuUlkedeMi(satir)) return cevap({ code: HESAP_REDDI_KODU }, 403)
  return cevap({ ulke: aktifUlke(), dil: dilSec(satir.ui_language), durum: 'bekletme', ad: String(satir.full_name || '') }, 200)
}
