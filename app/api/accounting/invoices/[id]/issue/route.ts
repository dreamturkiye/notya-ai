export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — validate + submit a draft invoice to the practice's e-belge integrator. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { issueInvoice, InvoiceNotFoundError } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'
import { InvalidInvoiceTransitionError } from '@/lib/accounting/invoices/stateMachine'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  try {
    const invoice = await issueInvoice(supabase, { userId: user.id, doktorId, role: rol }, params.id)
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    if (err instanceof InvalidInvoiceTransitionError) return NextResponse.json({ success: false, error: 'Bu fatura şu an kesilemez.' }, { status: 409 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Fatura kesilemedi.' }, { status: 400 })
  }
}
