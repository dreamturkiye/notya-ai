// ============================================================
// NOTYA AI - Stripe Checkout (STRIPE-NOTYA-01)
// POST /api/billing/checkout
//
// Creates a Checkout Session for a DOCTOR subscribing to NOTYA ITSELF — monthly or yearly, one
// of the plans in lib/billing/stripePlans.ts, with a 15-day free trial. This is NOT
// lib/accounting/ (the doctor billing their own patients) — do not wire this into that module.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { checkoutOlustur } from '@/lib/billing/checkoutOlustur'
import type { NotyaBillingInterval } from '@/lib/billing/stripePlans'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const planKey = String(body.plan_key || '')
    const interval = (body.interval === 'year' ? 'year' : 'month') as NotyaBillingInterval
    const seats = Number.isFinite(Number(body.seats)) ? Math.max(1, Math.floor(Number(body.seats))) : 1

    const sonuc = await checkoutOlustur({
      token: authHeader.slice(7),
      planKey,
      interval,
      seats,
      yolOnEki: '',
    })
    if (!sonuc.ok) {
      const tr =
        sonuc.status === 401
          ? 'Oturum bulunamadı. Lütfen tekrar giriş yapın.'
          : sonuc.code === 'INVALID_PLAN'
            ? 'Geçersiz plan.'
            : sonuc.code === 'PRICE_NOT_CONFIGURED'
              ? 'Bu plan için fiyat tanımlı değil.'
              : 'Ödeme oturumu oluşturulamadı.'
      return NextResponse.json(
        { success: false, error: tr, ...(sonuc.code ? { code: sonuc.code } : {}) },
        { status: sonuc.status },
      )
    }
    return NextResponse.json({ success: true, data: { checkout_url: sonuc.checkout_url, session_id: sonuc.session_id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[API/billing/checkout]', message)
    return NextResponse.json({ success: false, error: 'Ödeme oturumu oluşturulamadı.' }, { status: 500 })
  }
}
