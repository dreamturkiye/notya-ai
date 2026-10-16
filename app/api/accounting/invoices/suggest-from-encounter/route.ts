export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-ENCOUNTER-01 — read-only preview for the "Faturala" entry point at the end of a
 * muayene. POST { encounterId, asiNames?: string[] } -> { patientId, lines, unmatchedAsiNames,
 * moduleEnabled }. Never writes anything — app/dashboard/doktor/notlar/[id]/faturala/page.tsx lets
 * the doctor review/adjust this before the actual POST /api/accounting/invoices draft-create call.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { suggestEncounterInvoiceLines } from '@/lib/accounting/invoices/engine'
import { isAccountingEnabled } from '@/lib/accounting/module'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum

  const moduleEnabled = await isAccountingEnabled(supabase, doktorId)
  if (!moduleEnabled) {
    return NextResponse.json({ success: true, data: { moduleEnabled: false, patientId: null, lines: [], unmatchedAsiNames: [] } })
  }

  const body = await req.json().catch(() => ({}))
  const encounterId = typeof body.encounterId === 'string' ? body.encounterId : ''
  if (!encounterId) return NextResponse.json({ success: false, error: 'encounterId zorunludur.' }, { status: 400 })
  const asiNames = Array.isArray(body.asiNames) ? body.asiNames.filter((x: unknown) => typeof x === 'string') : []

  try {
    const suggestion = await suggestEncounterInvoiceLines(supabase, { userId: user.id, doktorId, role: rol }, encounterId, asiNames)
    return NextResponse.json({ success: true, data: { moduleEnabled: true, ...suggestion } })
  } catch (err) {
    if (err instanceof AccountingForbiddenError) {
      return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Öneri hazırlanamadı.' }, { status: 400 })
  }
}
