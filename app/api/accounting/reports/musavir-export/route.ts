export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — "Mali Müşavire Gönder" download: GET ?year=&month= returns the monthly
 * report as a downloadable .xlsx (lib/accounting/reports/musavirExport.ts). Strictly one calendar
 * month per request — no custom range, same rule as /api/accounting/reports?type=musavir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { loadGrants } from '@/lib/accounting/grants'
import { buildMonthlyMusavirReport } from '@/lib/accounting/reports/monthly'
import { buildMusavirExportWorkbook, musavirExportFilename } from '@/lib/accounting/reports/musavirExport'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, personelId } = oturum
  try {
    assertCan(rol, 'reports.export', await loadGrants(supabase, { userId: '', doktorId, role: rol, personelId }))
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Mali müşavir raporunu dışa aktarmak için doktor onayı gerekir.' }, { status: 403 })
    }
    throw err
  }

  const year = Number(req.nextUrl.searchParams.get('year'))
  const month = Number(req.nextUrl.searchParams.get('month'))
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ success: false, error: 'Ay ve yıl zorunludur.' }, { status: 400 })
  }

  let report
  try {
    report = await buildMonthlyMusavirReport(supabase, doktorId, { year, month })
  } catch (err) {
    if (err instanceof RangeError) return NextResponse.json({ success: false, error: 'Geçersiz ay/yıl.' }, { status: 400 })
    throw err
  }

  const { data: taxProfile } = await supabase.from('accounting_tax_profiles').select('unvan').eq('doctor_id', doktorId).maybeSingle()
  const buf = buildMusavirExportWorkbook(report, taxProfile?.unvan || undefined)
  const filename = musavirExportFilename({ year, month })

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buf.length),
      'Cache-Control': 'private, no-store',
    },
  })
}
