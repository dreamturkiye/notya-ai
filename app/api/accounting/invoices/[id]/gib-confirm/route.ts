export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 (2026-10-16) — the doctor issued the real e-SMM/e-Fatura/e-Arşiv
 * themselves on GİB Portalı (earsivportal.efatura.gov.tr) and pastes its official document number
 * back here to link it to the Notya invoice/receipt record. Body: `{ documentNumber: string,
 * issueDate?: string }`. Sekreter only if granted the same `invoice.issue` tier they already have
 * by default (lib/accounting/rbac.ts) — day-to-day billing, not a credentials/cancel/credit-tier
 * action.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { confirmGibPortalIssuance, InvoiceNotFoundError } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'
import { InvalidInvoiceTransitionError } from '@/lib/accounting/invoices/stateMachine'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  try {
    const invoice = await confirmGibPortalIssuance(
      supabase,
      { userId: user.id, doktorId, role: rol },
      params.id,
      String(body.documentNumber || ''),
      typeof body.issueDate === 'string' ? body.issueDate : undefined
    )
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    if (err instanceof InvalidInvoiceTransitionError) return NextResponse.json({ success: false, error: 'Bu fatura şu an onaylanamaz.' }, { status: 409 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Onaylanamadı.' }, { status: 400 })
  }
}
