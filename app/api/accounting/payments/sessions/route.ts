export const dynamic = 'force-dynamic'

/** NOTYA-ACCOUNTING-01 — create a hosted 3DS payment session against the doctor's own bank merchant. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { createPaymentSession } from '@/lib/accounting/payments/session'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  const origin = req.nextUrl.origin
  try {
    const session = await createPaymentSession(supabase, { userId: user.id, doktorId, role: rol }, {
      invoiceId: body.invoiceId,
      bankKey: body.bankKey,
      returnUrl: body.returnUrl || `${origin}/portal/odeme/tamamlandi`,
      webhookBaseUrl: `${origin}/api/accounting/payments/webhook`,
    })
    return NextResponse.json({ success: true, data: session })
  } catch (err) {
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Ödeme oturumu açılamadı.' }, { status: 400 })
  }
}
