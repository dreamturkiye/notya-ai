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
import { buildMonthlyMusavirReport } from '@/lib/accounting/reports/monthly'

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

  // Monthly mali müşavir report (Raporlar tab) — strictly ay/yıl, never a custom range, per Kaan's
  // "Bu raporlar sadece aylık olabilir" instruction (2026-10-15). See lib/accounting/reports/monthly.ts.
  if (type === 'musavir') {
    const year = Number(req.nextUrl.searchParams.get('year'))
    const month = Number(req.nextUrl.searchParams.get('month'))
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return NextResponse.json({ success: false, error: 'Ay ve yıl zorunludur.' }, { status: 400 })
    }
    try {
      const report = await buildMonthlyMusavirReport(supabase, doktorId, { year, month })
      return NextResponse.json({ success: true, data: report })
    } catch (err) {
      if (err instanceof RangeError) return NextResponse.json({ success: false, error: 'Geçersiz ay/yıl.' }, { status: 400 })
      throw err
    }
  }

  return NextResponse.json({ success: false, error: 'Geçersiz rapor türü.' }, { status: 400 })
}
