// ============================================================
// NOTYA AI - Ödeme Webhook'ları
// POST /api/billing/webhook
//
// STRIPE-NOTYA-01 (Kaan, 2026-10-27): handles Stripe events for a doctor's OWN Notya subscription
// (stripe-signature header). The legacy iyzico branch below (x-iyz-signature) is kept as-is —
// it predates this job, was never wired to a real checkout flow, and IYZICO_SECRET_KEY is unset
// in every known env, so it stays dormant rather than being deleted mid-job.
//
// This is NOT lib/accounting/'s webhook surface (a doctor billing their OWN patients) — unrelated
// system, do not merge the two.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/billing/stripeClient'
import { syncSubscriptionToDb } from '@/lib/billing/stripeSync'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })

async function alertTelegram(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!botToken || !chatId) return
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((e) => console.error('[billing/webhook] telegram alert failed:', e))
}

async function handleStripeEvent(req: NextRequest, rawBody: string, signature: string): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[billing/webhook] STRIPE_WEBHOOK_SECRET tanımlı değil — imza doğrulanamadı.')
    return NextResponse.json({ error: 'Webhook yapılandırılmamış' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[billing/webhook] Stripe imza doğrulama hatası:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 })
  }

  const sb = getSupabase()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) break
      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      const subscription = await stripe.subscriptions.retrieve(subId)
      await syncSubscriptionToDb(sb, subscription, session.metadata?.supabase_user_id || null)
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscriptionToDb(sb, subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // Stripe's own object status is already 'canceled' here; write it through as-is so
      // sessions/start's gate (canceled/unpaid + stripe_subscription_id set) picks it up.
      await syncSubscriptionToDb(sb, subscription)
      break
    }

    case 'customer.subscription.trial_will_end': {
      // 3 days before trial end. No in-app banner exists yet to surface this to the doctor —
      // logged + flagged for Kaan (see docs/OPEN-COMMITMENTS.md) rather than inventing one.
      const subscription = event.data.object as Stripe.Subscription
      console.log('[billing/webhook] trial_will_end:', subscription.id, 'customer:', subscription.customer)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subField = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription
      const subId = typeof subField === 'string' ? subField : subField?.id
      if (subId) {
        const subscription = await stripe.subscriptions.retrieve(subId)
        // Stripe will also fire customer.subscription.updated with status=past_due for this same
        // event; this write just makes sure it lands even if that second event is delayed/lost.
        const userId = await syncSubscriptionToDb(sb, subscription)
        await alertTelegram(
          `💳 NOTYA — Notya aboneliği ödeme hatası\nKullanıcı: ${userId || 'bilinmiyor'}\nAbonelik: ${subId}\nDurum: ${subscription.status}\n(Hard-lock YOK — grace period politikası Kaan'ın kararı, bkz. OPEN-COMMITMENTS)`
        )
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function handleIyzicoEvent(rawBody: string, signature: string): Promise<NextResponse> {
  const { verifyWebhookSignature } = await import('@/lib/security/encryption')
  const isValid = verifyWebhookSignature(rawBody, signature, process.env.IYZICO_SECRET_KEY || '')
  if (!isValid) {
    return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as {
    iyziEventType: string
    subscriptionReferenceCode: string
    customerEmail: string
    status: string
  }
  const { iyziEventType, subscriptionReferenceCode, customerEmail, status } = event

  switch (iyziEventType) {
    case 'SUBSCRIPTION_RENEWED':
      await getSupabase()
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)
      break

    case 'SUBSCRIPTION_CANCELLED':
      await getSupabase()
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)

      await getSupabase()
        .from('users')
        .update({ subscription_status: 'cancelled', subscription_tier: 'free' })
        .eq('email', customerEmail)
      break

    case 'PAYMENT_FAILED':
      await getSupabase()
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)
      await alertTelegram(`💳 NOTYA AI - ÖDEME HATASI (iyzico)\nMüşteri: ${customerEmail}\nAbonelik: ${subscriptionReferenceCode}\nDurum: ${status}`)
      break
  }

  return NextResponse.json({ received: true })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const stripeSig = req.headers.get('stripe-signature')
  if (stripeSig) return handleStripeEvent(req, rawBody, stripeSig)

  const iyzSig = req.headers.get('x-iyz-signature') || ''
  return handleIyzicoEvent(rawBody, iyzSig)
}
