export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — AR aging report (0-30/31-60/61-90/90+). Sekreter sees it only if granted. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { getAgingReport } from '@/lib/accounting/ar/ledger'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { loadGrants } from '@/lib/accounting/grants'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId } = oturum
  try {
    assertCan(rol, 'ar.view.all', await loadGrants(supabase, { userId: '', doktorId, role: rol, personelId }))
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Tüm alacak raporunu görmek için doktor onayı gerekir.' }, { status: 403 })
    }
    throw err
  }
  const report = await getAgingReport(supabase, doktorId)
  return NextResponse.json({ success: true, data: report })
}
