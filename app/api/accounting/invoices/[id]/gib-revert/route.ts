export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 (2026-10-16) — abandon a GİB Portalı prepare before actually
 * issuing anything on GİB's own site (the doctor spotted a mistake): pending_issue -> draft, so
 * the lines can be edited and re-prepared. No body.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { abandonGibPortalPrepare, InvoiceNotFoundError } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'
import { InvalidInvoiceTransitionError } from '@/lib/accounting/invoices/stateMachine'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  try {
    const invoice = await abandonGibPortalPrepare(supabase, { userId: user.id, doktorId, role: rol }, params.id)
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    if (err instanceof InvalidInvoiceTransitionError) return NextResponse.json({ success: false, error: 'Bu fatura şu an taslağa döndürülemez.' }, { status: 409 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Taslağa döndürülemedi.' }, { status: 400 })
  }
}
