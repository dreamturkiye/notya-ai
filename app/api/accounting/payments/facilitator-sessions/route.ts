export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — create a hosted checkout session against the doctor's own facilitator
 * merchant (iyzico). Parallel to payments/sessions/route.ts (direct banks), kept separate per
 * Kaan's instruction #3.
 *
 * Buyer identity (name/surname/TCKN/address/city) is required by iyzico's Checkout Form and is
 * NOT fabricated here — see docs/OPEN-COMMITMENTS.md ACCOUNTING-11 (buyer-identity resolution is
 * still an open item) and lib/accounting/types.ts PaySessionInput.buyer doc comment. Until that
 * lands, the caller (UI) must collect it from the doctor for this one charge.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { createFacilitatorPaymentSession } from '@/lib/accounting/payments/facilitatorSession'
import { AccountingForbiddenError } from '@/lib/accounting/rbac'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user } = oturum
  const body = await req.json().catch(() => ({}))
  const origin = req.nextUrl.origin
  const buyer = body.buyer && typeof body.buyer === 'object' ? body.buyer : null
  if (!buyer?.surname || !buyer?.identityNumber || !buyer?.registrationAddress || !buyer?.city) {
    return NextResponse.json(
      {
        success: false,
        error:
          'iyzico ile tahsilat için alıcı bilgileri (ad, soyad, TCKN, adres, şehir) zorunludur — bkz. docs/OPEN-COMMITMENTS.md ACCOUNTING-11.',
      },
      { status: 400 }
    )
  }
  try {
    const session = await createFacilitatorPaymentSession(supabase, { userId: user.id, doktorId, role: rol }, {
      invoiceId: body.invoiceId,
      facilitatorKey: body.facilitatorKey || 'iyzico',
      returnUrl: body.returnUrl || `${origin}/portal/odeme/tamamlandi`,
      webhookBaseUrl: `${origin}/api/accounting/payments/facilitator-webhook`,
      buyer: {
        id: buyer.id || body.invoiceId,
        surname: buyer.surname,
        identityNumber: buyer.identityNumber,
        gsmNumber: buyer.gsmNumber,
        registrationAddress: buyer.registrationAddress,
        city: buyer.city,
        country: buyer.country || 'Turkey',
        ip: buyer.ip,
      },
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
    })
    return NextResponse.json({ success: true, data: session })
  } catch (err) {
    if (err instanceof AccountingForbiddenError) return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Ödeme oturumu açılamadı.' }, { status: 400 })
  }
}
