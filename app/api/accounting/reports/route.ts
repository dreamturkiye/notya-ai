export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — basic reporting (collections by bank, sales by service, KDV summary).
 * GET ?type=collections|sales|kdv&since=ISO&until=ISO
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { loadGrants } from '@/lib/accounting/grants'
import { collectionsByBank, salesByService, kdvSummary } from '@/lib/accounting/reports'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId } = oturum
  try {
    assertCan(rol, 'reports.view', await loadGrants(supabase, { userId: '', doktorId, role: rol, personelId }))
  } catch (err) {
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Raporları görmek için doktor onayı gerekir.' }, { status: 403 })
    throw err
  }

  const type = req.nextUrl.searchParams.get('type') || 'collections'
  const since = req.nextUrl.searchParams.get('since') || new Date(Date.now() - 30 * 86400000).toISOString()
  const until = req.nextUrl.searchParams.get('until') || new Date().toISOString()

  if (type === 'collections') return NextResponse.json({ success: true, data: await collectionsByBank(supabase, doktorId, since) })
  if (type === 'sales') return NextResponse.json({ success: true, data: await salesByService(supabase, doktorId, since) })
  if (type === 'kdv') return NextResponse.json({ success: true, data: await kdvSummary(supabase, doktorId, since, until) })
  return NextResponse.json({ success: false, error: 'Geçersiz rapor türü.' }, { status: 400 })
}
