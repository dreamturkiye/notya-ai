export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — cancel/void an invoice. Sekreter only if granted (lib/accounting/rbac.ts). */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { cancelInvoice, InvoiceNotFoundError } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  try {
    const invoice = await cancelInvoice(supabase, { userId: user.id, doktorId, role: rol }, params.id, String(body.reason || ''))
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'İptal edilemedi.' }, { status: 400 })
  }
}
