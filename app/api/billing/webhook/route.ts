// ============================================================
// NOTYA AI - iyzico Ödeme Webhook
// POST /api/billing/webhook
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-iyz-signature') || ''

  const { verifyWebhookSignature } = await import('@/lib/security/encryption')
  const isValid = verifyWebhookSignature(body, signature, process.env.IYZICO_SECRET_KEY!)

  if (!isValid) {
    return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 })
  }

  const event = JSON.parse(body) as {
    iyziEventType: string
    subscriptionReferenceCode: string
    customerEmail: string
    status: string
  }
  const { iyziEventType, subscriptionReferenceCode, customerEmail, status } = event

  switch (iyziEventType) {
    case 'SUBSCRIPTION_RENEWED':
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)
      break

    case 'SUBSCRIPTION_CANCELLED':
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)

      await supabase
        .from('users')
        .update({ subscription_status: 'cancelled', subscription_tier: 'free' })
        .eq('email', customerEmail)
      break

    case 'PAYMENT_FAILED': {
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)

      const botToken = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `💳 NOTYA AI - ÖDEME HATASI\nMüşteri: ${customerEmail}\nAbonelik: ${subscriptionReferenceCode}\nDurum: ${status}`,
          }),
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
