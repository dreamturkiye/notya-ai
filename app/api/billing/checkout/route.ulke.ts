/**
 * STRIPE-NOTYA-AU-02/04 — POST /api/billing/checkout for country builds (*.ulke.ts pageExtensions).
 * 15-day free trial, same catalog as Türkiye. Success lands on /{country}/today.
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkoutOlustur } from '@/lib/billing/checkoutOlustur'
import type { NotyaBillingInterval } from '@/lib/billing/stripePlans'
import { ulkePaketi } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Session not found. Please sign in again.' }, { status: 401 })
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
      yolOnEki: ulkePaketi().yolOnEki ?? '',
    })
    if (!sonuc.ok) {
      return NextResponse.json(
        { success: false, error: sonuc.error, ...(sonuc.code ? { code: sonuc.code } : {}) },
        { status: sonuc.status },
      )
    }
    return NextResponse.json({ success: true, data: { checkout_url: sonuc.checkout_url, session_id: sonuc.session_id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[API/billing/checkout.ulke]', message)
    return NextResponse.json({ success: false, error: 'Payment session could not be created.' }, { status: 500 })
  }
}
