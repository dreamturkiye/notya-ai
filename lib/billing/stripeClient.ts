/**
 * STRIPE-NOTYA-01 — single Stripe client for Notya's own subscription billing.
 * STRIPE_SECRET_KEY must be the key for the connected account (StopThreatAI test mode today,
 * Notya's own account once Kaan creates it — see lib/billing/stripePlans.ts).
 */
import Stripe from 'stripe'

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY tanımlı değil.')
  client = new Stripe(key)
  return client
}
