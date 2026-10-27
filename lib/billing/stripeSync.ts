/**
 * STRIPE-NOTYA-01 — writes a Stripe subscription's state into Supabase. Called from the webhook
 * for checkout.session.completed / customer.subscription.updated / customer.subscription.deleted.
 *
 * Writes TWO places, matching the belt-and-suspenders pattern already used by
 * app/api/users/trial for the same reason: the detailed `subscriptions` row (history, seats,
 * Stripe ids) AND the summary columns on `users` that the existing gates already read
 * (app/api/sessions/start, app/api/doktor/seans-paketi, app/api/doktor/medula/recete,
 * lib/iletisim/kalkan) — so those keep working with zero changes to their own code.
 */
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planByPriceId } from './stripePlans'

// Stripe subscription.status -> what we store. Stripe's own values pass through unchanged;
// this exists only so a future Stripe status we haven't seen doesn't crash the write.
const KNOWN_STATUSES = new Set(['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'])

function isoOrNull(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null
}

export async function resolveSupabaseUserId(
  sb: SupabaseClient,
  sub: Stripe.Subscription,
  customer: Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<string | null> {
  const fromSub = sub.metadata?.supabase_user_id
  if (fromSub) return fromSub
  const fromCustomer = customer && !customer.deleted ? (customer as Stripe.Customer).metadata?.supabase_user_id : null
  if (fromCustomer) return fromCustomer
  // Last resort: look up by stripe_customer_id already stored on a users row.
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  if (!customerId) return null
  const { data } = await sb.from('users').select('id').eq('stripe_customer_id', customerId).maybeSingle()
  return data?.id || null
}

export async function syncSubscriptionToDb(sb: SupabaseClient, sub: Stripe.Subscription, userIdHint?: string | null): Promise<string | null> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null
  let userId = userIdHint || sub.metadata?.supabase_user_id || null
  if (!userId && customerId) {
    const { data } = await sb.from('users').select('id').eq('stripe_customer_id', customerId).maybeSingle()
    userId = data?.id || null
  }
  if (!userId) {
    console.error('[stripeSync] supabase_user_id çözülemedi, subscription:', sub.id)
    return null
  }

  const item = sub.items.data[0]
  const priceId = item?.price?.id || null
  const seats = item?.quantity || 1
  const planMeta = priceId ? planByPriceId(priceId) : null
  const planKey = sub.metadata?.notya_plan_key || planMeta?.plan.key || null
  const status = KNOWN_STATUSES.has(sub.status) ? sub.status : sub.status
  const currentPeriodEnd = isoOrNull(item?.current_period_end ?? null)
  const trialEnd = isoOrNull(sub.trial_end)

  await sb
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        provider: 'stripe',
        tier: planKey || 'unknown',
        status,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        user_count_limit: seats,
        trial_ends_at: trialEnd,
        current_period_start: isoOrNull(item?.current_period_start ?? null),
        current_period_end: currentPeriodEnd,
        cancelled_at: sub.canceled_at ? isoOrNull(sub.canceled_at) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    )

  await sb
    .from('users')
    .update({
      subscription_tier: planKey || undefined,
      subscription_status: status,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      trial_end: trialEnd,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: sub.cancel_at_period_end === true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return userId
}
