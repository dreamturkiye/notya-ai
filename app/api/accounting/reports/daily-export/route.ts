export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-DAILY-01 — "Mali Müşavire Gönder" download, daily counterpart of
 * musavir-export/route.ts: GET ?year=&month=&day= returns a single day's report as .xlsx, reusing
 * buildMusavirExportWorkbook's exact layout (lib/accounting/reports/musavirExport.ts) with a
 * day-level period label.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { assertCan, AccountingForbiddenError } from '@/lib/accounting/rbac'
import { loadGrants } from '@/lib/accounting/grants'
import { buildDailyMusavirReport } from '@/lib/accounting/reports/daily'
import { buildMusavirExportWorkbook, dailyMusavirExportFilename, AY_ADLARI } from '@/lib/accounting/reports/musavirExport'

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
  const day = Number(req.nextUrl.searchParams.get('day'))
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return NextResponse.json({ success: false, error: 'Gün, ay ve yıl zorunludur.' }, { status: 400 })
  }

  let report
  try {
    report = await buildDailyMusavirReport(supabase, doktorId, { year, month, day })
  } catch (err) {
    if (err instanceof RangeError) return NextResponse.json({ success: false, error: 'Geçersiz tarih.' }, { status: 400 })
    throw err
  }

  const { data: taxProfile } = await supabase.from('accounting_tax_profiles').select('unvan').eq('doctor_id', doktorId).maybeSingle()
  const periodLabel = `${day} ${AY_ADLARI[month - 1]} ${year}`
  const buf = buildMusavirExportWorkbook(report, taxProfile?.unvan || undefined, periodLabel, 'Günlük')
  const filename = dailyMusavirExportFilename({ year, month, day })

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
