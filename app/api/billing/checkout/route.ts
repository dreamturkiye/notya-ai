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
import { KURUCU_DOLU_MESAJI, KURUCU_PLAN_KEY, sesliProFiyatiSec, type FiyatStripe } from '@/lib/billing/kurucuTeklifi'
import { aktifUlke } from '@/lib/ulke/ulke'

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

    // STRIPE-NOTYA-AU-05: the founding offer is Sesli Pro at a founding price (first N doctors of the country).
    const kurucuIstendi = planKey === KURUCU_PLAN_KEY
    const plan = planByKey(kurucuIstendi ? 'sesli_pro' : planKey)
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Geçersiz plan.', code: 'INVALID_PLAN' }, { status: 400 })
    }

    const stripe = getStripe()

    let priceId = plan.priceIds[interval]
    let kurucu = false
    let kurucuDolu = false
    if (plan.key === 'sesli_pro') {
      // The env var wins when set; otherwise the country's Stripe lookup key (AU: no env var needed); otherwise the
      // catalog fallback. Founding: lookup key + server-side seat cap; full = the regular price with a message.
      const envAdi = interval === 'year' ? 'STRIPE_PRICE_SESLI_PRO_YEAR' : 'STRIPE_PRICE_SESLI_PRO_MONTH'
      const secim = await sesliProFiyatiSec({
        stripe: stripe as unknown as FiyatStripe,
        ulke: aktifUlke(),
        aralik: interval,
        kurucuIstendi,
        envFiyati: (process.env[envAdi] || '').trim() || null,
        yedekFiyat: priceId || null,
      })
      if (secim) {
        priceId = secim.priceId
        kurucu = secim.kurucu
        kurucuDolu = secim.kurucuDolu
      }
    }
    if (!priceId) {
      return NextResponse.json({ success: false, error: 'Bu plan için fiyat tanımlı değil.', code: 'PRICE_NOT_CONFIGURED' }, { status: 500 })
    }

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

    const meta = { supabase_user_id: user.id, notya_plan_key: plan.key, notya_interval: interval, notya_founding: kurucu ? 'true' : 'false' }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: plan.perSeat ? seats : 1 }],
      // Card at trial signup is Kaan-approved (STRIPE-NOTYA-AU-05): Checkout always collects a payment method.
      payment_method_collection: 'always',
      subscription_data: {
        trial_period_days: NOTYA_TRIAL_DAYS,
        metadata: meta,
      },
      metadata: meta,
      ...(kurucuDolu ? { custom_text: { submit: { message: KURUCU_DOLU_MESAJI } } } : {}),
      success_url: `${appUrl()}/dashboard/doktor?billing=success&plan=${plan.key}`,
      cancel_url: `${appUrl()}/onboarding?billing=cancelled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      success: true,
      data: { checkout_url: session.url, session_id: session.id, founding: kurucu, founding_full: kurucuDolu, ...(kurucuDolu ? { message: KURUCU_DOLU_MESAJI } : {}) },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[API/billing/checkout]', message)
    return NextResponse.json({ success: false, error: 'Ödeme oturumu oluşturulamadı.' }, { status: 500 })
  }
}
