/**
 * AU-BETA-02 — STRIPE adapter, bring-your-own account. Server only.
 *
 * WHOSE MONEY: the doctor pastes THEIR OWN restricted API key (rk_test_… or rk_live_…). Every call is made with that key,
 * so the charge is created on, and settles to, the doctor's own Stripe account. This product is not the merchant of
 * record, takes no application fee, passes no `on_behalf_of`/`transfer_data`, and holds no funds. Card details are typed
 * on Stripe's hosted Checkout page, never on this product's servers.
 *
 * SOURCES (fetched with WebFetch 2026-10-22, recorded in docs/au/SOURCES.md):
 *   https://docs.stripe.com/keys/restricted-api-keys   (rk_ prefixes; permissions None/Read/Write per resource; write implies read)
 *   https://docs.stripe.com/api/checkout/sessions/create (mode, line_items.price_data, client_reference_id, metadata, success_url, payment_intent_data)
 *   https://docs.stripe.com/api/refunds/create          (payment_intent, amount, metadata, reason)
 *   https://docs.stripe.com/webhooks                    (Stripe-Signature, raw body, 5-minute default tolerance, event-id dedupe)
 * The SDK (`stripe` 23.0.0) builds the HTTP requests; the tests inject a fake fetch into the SDK and read the request it sends.
 */
import Stripe from 'stripe'
import type { DogrulamaSonucu, GercekSaglayici, IadeIstegi, IadeYapildi, OdemeBaslatildi, OdemeBaslatma, SaglayiciKaydi } from './saglayiciTipleri'

/** The metadata key carrying the Notya invoice id on the Checkout Session AND on the PaymentIntent. */
export const STRIPE_FATURA_ANAHTARI = 'notya_invoice_id'

/**
 * Only a RESTRICTED key is accepted: `rk_test_…` → 'test', `rk_live_…` → 'live'. A full-access secret key (`sk_…`, any mode), a publishable
 * key and anything else → null. (Stripe: "A RAK starts with `rk_live_` or `rk_test_`" — https://docs.stripe.com/keys/restricted-api-keys, read 2026-10-22.)
 */
export function stripeAnahtarModu(ham: string): 'test' | 'live' | null {
  const m = /^rk_(test|live)_[A-Za-z0-9]{8,}$/.exec(ham.trim())
  return m ? (m[1] as 'test' | 'live') : null
}

/** A full-access secret key (`sk_test_…` / `sk_live_…`). Refused in every mode: the doctor must give a restricted key with only the permissions this product needs. */
export function stripeGizliAnahtarMi(ham: string): boolean {
  return /^sk_(test|live)_/i.test(ham.trim())
}

export function stripeIstemciYap(anahtar: string, http?: Stripe.HttpClient): Stripe {
  return new Stripe(anahtar, { maxNetworkRetries: 1, timeout: 20_000, httpClient: http, appInfo: { name: 'Notya (bring-your-own merchant account)' } })
}

export function stripeHataSinifi(e: unknown): 'anahtar' | 'izin' | 'ag' | 'bilinmeyen' {
  const tur = (e as { type?: string } | null)?.type
  if (tur === 'StripeAuthenticationError') return 'anahtar'
  if (tur === 'StripePermissionError') return 'izin'
  if (tur === 'StripeConnectionError' || tur === 'StripeAPIError') return 'ag'
  return 'bilinmeyen'
}

const kucuk = (p: string) => p.toLowerCase()

export function stripePaymentIntentKaydi(pi: Stripe.PaymentIntent): SaglayiciKaydi {
  const ch = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null
  const basarili = pi.status === 'succeeded'
  return {
    ref: pi.id,
    faturaId: pi.metadata?.[STRIPE_FATURA_ANAHTARI] || null,
    tutarKurus: basarili ? (pi.amount_received || pi.amount) : pi.amount,
    iadeKurus: ch?.amount_refunded ?? 0,
    paraKodu: pi.currency.toUpperCase(),
    basarili,
    olusturuldu: pi.created * 1000,
  }
}

export function stripeSaglayici(s: Stripe): GercekSaglayici {
  return {
    ad: 'stripe',

    /** A cheap authenticated read the key needs anyway (PaymentIntents: Read). A bad key → 'anahtar'; a key without that permission → 'izin'. */
    async dogrula(): Promise<DogrulamaSonucu> {
      try { await s.paymentIntents.list({ limit: 1 }); return { tamam: true } } catch (e) { return { tamam: false, hata: stripeHataSinifi(e) } }
    },

    /** A hosted Checkout Session for ONE invoice. The invoice id rides in the metadata of the session and of the PaymentIntent it creates. */
    async baslat(i: OdemeBaslatma): Promise<OdemeBaslatildi> {
      const meta = { [STRIPE_FATURA_ANAHTARI]: i.faturaId, notya_invoice_no: String(i.no) }
      const o = await s.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: i.faturaId,
        metadata: meta,
        payment_intent_data: { metadata: meta },
        line_items: [{ quantity: 1, price_data: { currency: kucuk(i.paraKodu), unit_amount: i.tutarKurus, product_data: { name: `Invoice #${i.no}` } } }],
        success_url: i.basariUrl,
        cancel_url: i.iptalUrl,
      }, { idempotencyKey: `notya-cs-${i.faturaId}-${i.tutarKurus}-${Math.floor(Date.now() / 1_800_000)}` })
      if (!o.url) throw new Error('stripe: checkout session without a url')
      return { ref: o.id, url: o.url }
    },

    /** Full or partial refund of a PaymentIntent. The idempotency key names the invoice, the amount already refunded and the amount asked: a retry of the same click is the same refund, a second refund is not. */
    async iade(i: IadeIstegi): Promise<IadeYapildi> {
      try {
        const r = await s.refunds.create({ payment_intent: i.odemeRef, amount: i.kurus, metadata: { [STRIPE_FATURA_ANAHTARI]: i.faturaId } }, { idempotencyKey: `notya-rf-${i.faturaId}-${i.oncekiIadeKurus}-${i.kurus}` })
        const tamam = r.status === 'succeeded' || r.status === 'pending' || r.status === 'requires_action'
        return { tamam, ref: r.id, iadeKurus: tamam ? r.amount : 0, bekliyor: r.status !== 'succeeded' }
      } catch { return { tamam: false, ref: '', iadeKurus: 0, bekliyor: false } }
    },

    /** PaymentIntents created in the range, with the latest charge expanded (its `amount_refunded` is the refunded total). Needs PaymentIntents: Read and Charges: Read. */
    async kayitlar(gte: number, lte: number): Promise<SaglayiciKaydi[]> {
      const hepsi = await s.paymentIntents.list({ created: { gte, lte }, limit: 100, expand: ['data.latest_charge'] }).autoPagingToArray({ limit: 5000 })
      return hepsi.map(stripePaymentIntentKaydi)
    },
  }
}

// ───────────────────────── webhook ─────────────────────────

/**
 * Signature check with the SDK's own `webhooks.constructEvent` (HMAC-SHA256 over `t.payload`, constant-time compare, 300 s default tolerance).
 * `govde` MUST be the raw request body text. Returns the verified event or the reason it was refused.
 */
export function stripeOlayiDogrula(govde: string, imza: string | null, gizli: string, toleransSn = 300): { tamam: true; olay: Stripe.Event } | { tamam: false; neden: 'imza_yok' | 'gizli_yok' | 'gecersiz' } {
  if (!gizli) return { tamam: false, neden: 'gizli_yok' }
  if (!imza) return { tamam: false, neden: 'imza_yok' }
  try { return { tamam: true, olay: Stripe.webhooks.constructEvent(govde, imza, gizli, toleransSn) } } catch { return { tamam: false, neden: 'gecersiz' } }
}
