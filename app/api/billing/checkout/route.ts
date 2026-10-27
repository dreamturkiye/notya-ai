// ============================================================
// NOTYA AI - Stripe Checkout (STRIPE-NOTYA-01)
// POST /api/billing/checkout
//
// Creates a Checkout Session for a DOCTOR subscribing to NOTYA ITSELF — monthly or yearly, one
// of the plans in lib/billing/stripePlans.ts, with a 15-day free trial. This is NOT
// lib/accounting/ (the doctor billing their own patients) — do not wire this into that module.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/billing/stripeClient'
import { NOTYA_TRIAL_DAYS, planByKey, type NotyaBillingInterval } from '@/lib/billing/stripePlans'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })

function appUrl(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const sb = getSupabase()
    const { data: { user }, error: authError } = await sb.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const planKey = String(body.plan_key || '')
    const interval = (body.interval === 'year' ? 'year' : 'month') as NotyaBillingInterval
    const seats = Number.isFinite(Number(body.seats)) ? Math.max(1, Math.floor(Number(body.seats))) : 1

    const plan = planByKey(planKey)
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Geçersiz plan.', code: 'INVALID_PLAN' }, { status: 400 })
    }
    const priceId = plan.priceIds[interval]
    if (!priceId) {
      return NextResponse.json({ success: false, error: 'Bu plan için fiyat tanımlı değil.', code: 'PRICE_NOT_CONFIGURED' }, { status: 500 })
    }

    const stripe = getStripe()

    // Reuse an existing Stripe Customer for this doctor (users.stripe_customer_id) or create one,
    // tied to users.id via metadata so the webhook can always resolve the doctor from the event.
    const { data: profile } = await sb
      .from('users')
      .select('id, email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id || null
    if (customerId) {
      // Verify it still exists on this Stripe account (switching accounts later would orphan it).
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = null
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await sb.from('users').update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: plan.perSeat ? seats : 1 }],
      subscription_data: {
        trial_period_days: NOTYA_TRIAL_DAYS,
        metadata: { supabase_user_id: user.id, notya_plan_key: plan.key, notya_interval: interval },
      },
      metadata: { supabase_user_id: user.id, notya_plan_key: plan.key, notya_interval: interval },
      success_url: `${appUrl()}/dashboard/doktor?billing=success&plan=${plan.key}`,
      cancel_url: `${appUrl()}/onboarding?billing=cancelled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ success: true, data: { checkout_url: session.url, session_id: session.id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[API/billing/checkout]', message)
    return NextResponse.json({ success: false, error: 'Ödeme oturumu oluşturulamadı.' }, { status: 500 })
  }
}
