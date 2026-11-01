/**
 * STRIPE-NOTYA-01 / AU-03 — shared Checkout Session builder for Notya billing the doctor for the app.
 * Used by app/api/billing/checkout/route.ts (Türkiye) and route.ulke.ts (country builds).
 */
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/billing/stripeClient'
import { NOTYA_TRIAL_DAYS, planByKey, type NotyaBillingInterval } from '@/lib/billing/stripePlans'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })

function appUrl(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, '')
}

export type CheckoutSonuc =
  | { ok: true; checkout_url: string; session_id: string }
  | { ok: false; status: number; error: string; code?: string }

/**
 * @param yolOnEki country pack path prefix (e.g. "/au") or "" for Türkiye at domain root.
 * Country builds land on /today after checkout; Türkiye keeps /dashboard/doktor.
 */
export async function checkoutOlustur(opts: {
  token: string
  planKey: string
  interval: NotyaBillingInterval
  seats: number
  yolOnEki?: string
}): Promise<CheckoutSonuc> {
  const sb = getSupabase()
  const { data: { user }, error: authError } = await sb.auth.getUser(opts.token)
  if (authError || !user) {
    return { ok: false, status: 401, error: 'Session not found. Please sign in again.' }
  }

  const plan = planByKey(opts.planKey)
  if (!plan) return { ok: false, status: 400, error: 'Invalid plan.', code: 'INVALID_PLAN' }
  const priceId = plan.priceIds[opts.interval]
  if (!priceId) return { ok: false, status: 500, error: 'Price not configured for this plan.', code: 'PRICE_NOT_CONFIGURED' }

  const stripe = getStripe()
  const onEk = opts.yolOnEki ?? ''

  // Country accounts live in ulke_hesaplari; billing columns live on users (STRIPE-NOTYA-AU-01).
  // Ensure a users row exists so customer id + webhook sync have somewhere to write.
  const { data: hesap } = await sb.from('ulke_hesaplari').select('full_name').eq('id', user.id).maybeSingle()
  const { data: profile } = await sb
    .from('users')
    .select('id, email, full_name, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    const ad = (hesap?.full_name as string | undefined) || String(user.user_metadata?.full_name || '') || null
    await sb.from('users').upsert(
      {
        id: user.id,
        email: user.email || null,
        full_name: ad,
        subscription_tier: 'free',
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
  }

  const { data: again } = await sb
    .from('users')
    .select('id, email, full_name, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  let customerId = again?.stripe_customer_id || null
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
    } catch {
      customerId = null
    }
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: again?.email || user.email || undefined,
      name: again?.full_name || (hesap?.full_name as string | undefined) || undefined,
      metadata: { supabase_user_id: user.id, notya_country_path: onEk || 'tr' },
    })
    customerId = customer.id
    await sb.from('users').update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() }).eq('id', user.id)
  }

  const successPath = onEk ? `${onEk}/today` : '/dashboard/doktor'
  const cancelPath = onEk ? `${onEk}/signup` : '/onboarding'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: plan.perSeat ? opts.seats : 1 }],
    subscription_data: {
      trial_period_days: NOTYA_TRIAL_DAYS,
      metadata: { supabase_user_id: user.id, notya_plan_key: plan.key, notya_interval: opts.interval },
    },
    metadata: { supabase_user_id: user.id, notya_plan_key: plan.key, notya_interval: opts.interval },
    success_url: `${appUrl()}${successPath}?billing=success&plan=${plan.key}`,
    cancel_url: `${appUrl()}${cancelPath}?billing=cancelled${onEk ? `&plan=${plan.key}` : ''}`,
    allow_promotion_codes: true,
  })

  if (!session.url) return { ok: false, status: 500, error: 'Checkout session could not be created.' }
  return { ok: true, checkout_url: session.url, session_id: session.id }
}
