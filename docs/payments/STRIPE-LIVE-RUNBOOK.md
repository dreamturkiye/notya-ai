# Stripe LIVE-mode runbook (the doctor or clinic, about 20 minutes) — BYO-PAYMENTS-01

**Initial compliance draft – external legal review later.** Live mode was switched on by the owner's order of 2026-10-22. No external legal or payments review of live mode has happened, and **no live charge has been run by the people who built it**: the first real payment is yours. Do the TEST runbook (`STRIPE-TEST-RUNBOOK.md`) first, in test mode, and only then this one.

**What this is.** You connect YOUR OWN Stripe account. Notya is not the merchant of record, never holds your funds, keeps no balance or ledger of customer money and takes no platform fee. A payment is created on your Stripe account with your key; the card is typed on Stripe's hosted page; the money settles to you. Notya sees only what Stripe tells it (payment status, amount, refunds).

## 1. Create a restricted LIVE key (never a secret key)

1. Stripe dashboard, in **live mode** → *Developers* → *API keys* → **Create restricted key** (https://dashboard.stripe.com/apikeys). You will be asked for two-factor verification.
2. Name it (for example `notya-billing`). Give it exactly these permissions and leave every other resource at **None**:

   | Resource | Level | Why |
   |---|---|---|
   | Checkout Sessions | **Write** | creates the hosted payment page for one invoice |
   | Payment Intents | **Read** | the connection check, and reconciliation |
   | Refunds | **Write** | full and partial refunds from the invoice |
   | Charges | **Read** | the refunded total, for reconciliation |

   Stripe's own example of the naming is "Payment Intents: Write", "Customers: Read" (https://docs.stripe.com/keys/restricted-api-keys, read 2026-10-22). That page does not list every resource; the labels *Checkout Sessions*, *Refunds* and *Charges* above are the API object names and were **not verified against the dashboard screen**. If Stripe shows slightly different labels, choose the matching resources. If a call fails, open the key's *request logs* (⋯ → View request logs): a 403 names the permission that is missing. Write includes Read.
3. Create the key, copy the value (`rk_live_…`) and keep it somewhere safe: **Stripe shows it once**. Notya refuses any key that starts with `sk_` (a full-access secret key), in test or live mode.

## 2. Add the live webhook endpoint

The Billing screen shows your webhook URL before you connect (it ends in `/api/ulke/odeme-webhook/stripe?d=<your account id>`). It must be reachable over HTTPS (Stripe requires HTTPS in live mode).

1. Stripe dashboard, **live mode** → *Developers* → *Webhooks* (Workbench) → **Create an event destination** → *Your account*.
2. Payload format: **Snapshot** (Notya verifies the standard event object; it does not read thin events). API version: your account's default.
3. Select exactly these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`.
4. Destination type *Webhook endpoint* → paste the URL from the Billing screen → create it.
5. Open the endpoint, **Reveal secret**, copy the signing secret (`whsec_…`). **Live and test endpoints have different secrets**; Notya will not reuse a test secret for a live key.

## 3. Connect in Notya

Billing → *Your own merchant account* → paste the `rk_live_…` key **and** the live `whsec_…` secret → *Save connection*. A confirmation panel appears: read it, tick the box, press *Connect live account*. Notya checks the key with one read against Stripe before keeping it (encrypted). The badge now says **LIVE — real money**. Without the live signing secret the connection is refused.

## 4. First real payment (small, and yours)

Create an invoice for a small amount, press **Pay**, pay with a real card on the Stripe page. Expected: the invoice turns **Paid** within seconds (set by the signed webhook, never by the browser). If it stays *Awaiting payment confirmation*, open the endpoint in Stripe → *Event deliveries*: 400 = wrong signing secret, 404 = the URL's account id is wrong, a timeout/5xx = Notya could not process it (Stripe retries up to three days in live mode). Then press *Refund in full* and check the refund in Stripe. Reconcile (Billing → Reconciliation) and expect *Matched, refunded*.

## Safety rules that stay on

Restricted keys only; the key is encrypted at rest and is never shown again or logged; amounts are integer minor units; every Stripe write carries an idempotency key; no application fee and no transfer; no funds held; events are de-duplicated by Stripe event id; an event whose mode (live/test) disagrees with the connection is ignored.

## Turning it off

Billing → *Disconnect* removes the stored key and secret from Notya. Then **roll or delete the key** in Stripe (*API keys* → ⋯ → Roll key / Delete) and delete the webhook endpoint. Disconnecting in Notya does not revoke anything at Stripe.

Not covered: payouts and balance transactions (not read), Stripe Connect OAuth (not built), disputes, receipts/tax invoices as legal documents.
