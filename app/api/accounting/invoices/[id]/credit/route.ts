export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15 audit §4.6.5) — düzeltme/iade: credit note for an
 * already-issued invoice. Mirrors the cancel route exactly (same RBAC capability tier). Body:
 * { amountKurus: number, reason: string }. Sekreter only if granted (lib/accounting/rbac.ts,
 * same `invoice.credit` capability that already gates cancel).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { creditInvoice, InvoiceNotFoundError } from '@/lib/accounting/invoices/engine'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  const amountKurus = Number(body.amountKurus)
  try {
    const invoice = await creditInvoice(supabase, { userId: user.id, doktorId, role: rol }, params.id, amountKurus, String(body.reason || ''))
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Düzeltme/iade uygulanamadı.' }, { status: 400 })
  }
}
