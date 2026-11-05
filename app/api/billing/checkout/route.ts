// ============================================================
// NOTYA AI - Stripe Checkout (STRIPE-NOTYA-01)
// POST /api/billing/checkout
//
// Creates a Checkout Session for a DOCTOR subscribing to NOTYA ITSELF — monthly or yearly, one
// of the plans in lib/billing/stripePlans.ts. Türkiye: with a 15-day Stripe trial. A country with an in-app trial
// (lib/billing/ulkeTicari.ts `deneme`, AU): no Stripe trial, charged at once - the trial already ran in the app, no card. This is NOT
// lib/accounting/ (the doctor billing their own patients) — do not wire this into that module.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/billing/stripeClient'
import { NOTYA_TRIAL_DAYS, planByKey, type NotyaBillingInterval } from '@/lib/billing/stripePlans'
import { KURUCU_DOLU_MESAJI, KURUCU_PLAN_KEY, sesliProFiyatiSec, type FiyatStripe } from '@/lib/billing/kurucuTeklifi'
import { aktifUlke } from '@/lib/ulke/ulke'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { hesapMuafMi } from '@/lib/ulke/uygulama/deneme'
import { ulkeYolu } from '@/lib/ulke/yol'
import { UYGULAMA_EKRANLARI } from '@/lib/ulke/tipler'

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

    // Founder exemption (Kaan, 2026-11-02, migration 186): an exempt country account has nothing to pay, so it never
    // opens Checkout and never takes a founding seat (the seat count is of founding subscriptions in Stripe).
    if (ulkeTicari(aktifUlke())?.deneme && (await hesapMuafMi(sb, user.id))) {
      return NextResponse.json({ success: false, error: 'This account is exempt: there is nothing to pay.', code: 'MUAF' }, { status: 409 })
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

    // A country build's account lives in `ulke_hesaplari` and may have no `users` row, but `subscriptions.user_id`
    // references `users(id)`: without the row the webhook could never record the payment and a paying doctor would stay
    // in the trial / read-only. Write the minimal row once, here (checkout only, never a hot path).
    const ulke = aktifUlke()
    const ulkeBuildi = Boolean(ulke && ulke !== 'tr')
    if (!profile && ulkeBuildi) {
      const ad = String((user.user_metadata as { full_name?: unknown } | null)?.full_name || '').trim() || (user.email || '').split('@')[0]
      const dil = String((user.user_metadata as { ui_language?: unknown } | null)?.ui_language || 'en')
      await sb.from('users').upsert(
        { id: user.id, email: user.email || '', full_name: ad, country: ulke, ui_language: /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/.test(dil) ? dil : 'en' },
        { onConflict: 'id', ignoreDuplicates: true },
      )
    }

    // AU-HUKUK-YANIT-01: the country's supplier line on Notya's own invoices and receipts (Stripe customer invoice footer).
    const faturaNotu = ulkeTicari(ulke)?.faturaNotu
    let customerId = profile?.stripe_customer_id || null
    if (customerId) {
      // Verify it still exists on this Stripe account (switching accounts later would orphan it).
      try {
        const mevcut = await stripe.customers.retrieve(customerId)
        if (faturaNotu && !('deleted' in mevcut && mevcut.deleted) && (mevcut as { invoice_settings?: { footer?: string | null } }).invoice_settings?.footer !== faturaNotu) {
          try { await stripe.customers.update(customerId, { invoice_settings: { footer: faturaNotu } }) } catch { /* the footer is a note; checkout goes on */ }
        }
      } catch {
        customerId = null
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
        ...(faturaNotu ? { invoice_settings: { footer: faturaNotu } } : {}),
      })
      customerId = customer.id
      await sb.from('users').update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() }).eq('id', user.id)
    }

    // Trial model (Kaan, 2026-11-02): where the country runs the free trial IN THE APP (no card), Checkout is reached only
    // when the doctor chooses to pay - no Stripe trial, charged at once. Elsewhere the Stripe trial is unchanged.
    const uygulamaIciDeneme = Boolean(ulkeTicari(ulke)?.deneme)
    const meta = { supabase_user_id: user.id, notya_plan_key: plan.key, notya_interval: interval, notya_founding: kurucu ? 'true' : 'false' }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: plan.perSeat ? seats : 1 }],
      // Checkout always collects a payment method: it is either a paid plan charged now (in-app trial countries) or,
      // elsewhere, the card-first Stripe trial.
      payment_method_collection: 'always',
      subscription_data: {
        ...(uygulamaIciDeneme ? {} : { trial_period_days: NOTYA_TRIAL_DAYS }),
        metadata: meta,
      },
      metadata: meta,
      ...(kurucuDolu ? { custom_text: { submit: { message: KURUCU_DOLU_MESAJI } } } : {}),
      // A country build has no /dashboard or /onboarding page: back to its own home screen (the account's data is all there).
      success_url: ulkeBuildi ? `${req.nextUrl.origin}${ulkeYolu(UYGULAMA_EKRANLARI.bugun)}?billing=success` : `${appUrl()}/dashboard/doktor?billing=success&plan=${plan.key}`,
      cancel_url: ulkeBuildi ? `${req.nextUrl.origin}${ulkeYolu(UYGULAMA_EKRANLARI.bugun)}?billing=cancelled` : `${appUrl()}/onboarding?billing=cancelled`,
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
