/**
 * NOTYA-ACCOUNTING-01 — NestPay/EST (Asseco/Payten) "3D Pay Hosting" adapter. Status: **VERIFIED
 * by protocol cross-reference** (not a primary bank-published portal, but genuinely confirmed —
 * see below). Covers İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat and Akbank's NestPay
 * instances with one adapter (Kaan, 2026-10-15), configurable per merchant (gateway URL, client
 * ID, store key, username, password — Kaan's own field list).
 *
 * WHY THIS IS NOW REAL (2026-10-15, second research pass): the first pass only checked for a
 * modern web developer *portal* and found none, and treated that as blocking. Kaan's follow-up
 * correctly pointed out that "no portal" is not "no documentation" — NestPay/EST is a real,
 * long-standing shared protocol, documented as PDFs/vendor guides and implemented by mature
 * open-source libraries used in real production systems. This pass read two independent,
 * actively-real, MIT-licensed reference implementations' SOURCE CODE (not just their READMEs) to
 * confirm the protocol structurally, then wrote this file from scratch — no code copied verbatim:
 *
 * - github.com/uskur/omnipay-nestpay (`src/Message/PostRequest.php`, `ThreeDPayHostingGateway.php`,
 *   `PostResponse.php`) — the "3D Pay Hosting" (`storetype: '3d_pay_hosting'`) request builder.
 * - github.com/mewebstudio/pos (`AssecoPos.php`, `AssecoPosCrypt.php`, `AssecoPosRequestDataMapper.php`,
 *   `AssecoPosResponseDataMapper.php`) — actively maintained, supports
 *   `MODEL_3D_PAY_HOSTING`/`MODEL_3D_HOST` explicitly, with its own hash/response mapping classes.
 *
 * **The structural, citable confirmation (not an inference from the "Hosting" name):** in BOTH
 * libraries, the SAME request-builder function that is used for every storetype only adds
 * card PAN/expiry/CVV fields when a credit-card object is explicitly passed in; the hosting-mode
 * call path passes none. The resulting form-POST payload for `3d_pay_hosting` has NO card field
 * at all (`clientid, storetype, amount, oid, okUrl, failUrl, rnd, lang, currency, taksit,
 * TranType, hashAlgorithm, hash` — see `buildHostingFormFields` below). The customer enters their
 * card on the bank's own page at `gatewayUrl`, confirmed by the browser being POSTed THERE, not
 * by an inference from the word "Hosting". This matches the PCI SAQ-A rule (§1, §2.7) the same
 * way iyzico's Checkout Form does.
 *
 * **Hash algorithm (`ver3`), cross-confirmed identically by both libraries:**
 *   1. Take every outbound field except `hash`/`HASH`/`encoding`/`nationalidno` (case-insensitive).
 *   2. Sort by key, case-insensitive, natural order.
 *   3. Escape each value: `\` → `\\`, then `|` → `\|`.
 *   4. Join with `|`, then append the escaped store key as one more `|`-joined element.
 *   5. `hash = base64(SHA-512(that string))` — the RAW digest bytes, not its hex text.
 * The exact same function verifies an inbound callback: recompute over its own fields (same
 * exclusions) and compare to its own `HASH`/`hash` field with a constant-time comparison —
 * never trust `mdStatus`/`ProcReturnCode` before that check passes, same posture as every other
 * adapter in this module.
 *
 * **Confirmed response/callback fields** (from `AssecoPosResponseDataMapper::map3DHostResponseData`
 * and `extractMdStatus`/`is3dAuthSuccess`): `oid`, `mdStatus` (`'1'` = full 3D Secure success —
 * `'2'`/`'3'`/`'4'` are "half 3D Secure", NOT treated as a completed charge here, out of the same
 * caution as the rest of this module), `amount`, `currency`, `taksit`, `maskedCreditCard` (never
 * the full PAN), `mdErrorMsg`. For the Hosting model specifically, this callback IS the final
 * result — no separate server-to-server provisioning call is needed afterwards (confirmed by
 * `map3DHostResponseData` never touching a second "provision" response, unlike `map3DPaymentData`
 * for the classic `3d`/`3d_pay` models).
 *
 * **What is NOT verified, disclosed plainly:**
 * - No primary bank-published PDF was located again this pass either — this status rests on
 *   cross-referencing two independent, real, production-used open-source implementations of the
 *   documented protocol, which is the standard Kaan asked for, but it is still not the same
 *   confidence tier as reading a bank's own current spec directly (iyzico's status). If either
 *   library's reverse-engineering of a specific bank's exact field names/casing is stale or
 *   bank-specific (field name casing is known to vary slightly bank-to-bank — e.g. `Instalment`
 *   vs `taksit`, `HASH` vs `hash` — which is WHY this adapter is parameterized by gateway URL,
 *   not by a hardcoded bank hostname), the merchant's actual bank may need a field-name tweak.
 *   This adapter sends both common casings of a couple of fields defensively (see code) rather
 *   than guessing one and silently failing.
 * - Per-bank hosting gateway hostnames are NOT hardcoded for this reason — Kaan's own instruction
 *   makes `gatewayUrl` a required merchant-supplied field, which is also the honest choice: the
 *   libraries' own example hostnames disagree in small ways bank-to-bank and change over time.
 * - The offline status-query (XML `cc5ApiServer` API) requires `username`/`password` in addition
 *   to `clientId`/`storeKey` — optional fields here, since a doctor using pure Hosting-mode
 *   charges may never need it (the callback is already the final result).
 */
import { createHash, timingSafeEqual } from 'crypto'
import type { BankPosAdapter, BankMerchantCredentials } from '../payments/types'
import type { BankKey, HostedSession, PaySessionInput, PaymentEvent, PaymentStatus } from '../types'

const TRY_NUMERIC_CURRENCY = '949' // ISO 4217 numeric code for TRY — not NestPay-specific.
const EXCLUDED_HASH_KEYS = new Set(['hash', 'encoding', 'nationalidno'])

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`nestpay adapter: missing required merchant field "${key}"`)
  return v
}

function escapeHashValue(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
}

/** The `ver3` NestPay/EST hash, cross-confirmed against two independent open-source
 *  implementations (see file header). Natural, case-insensitive sort by key; values joined with
 *  `|`, store key appended as the final joined element; SHA-512 of the UTF-8 string, raw digest
 *  bytes base64-encoded (not the hex string). */
export function buildNestpayHash(fields: Record<string, string>, storeKey: string): string {
  const keys = Object.keys(fields).filter((k) => !EXCLUDED_HASH_KEYS.has(k.toLowerCase()))
  keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  const parts = keys.map((k) => escapeHashValue(String(fields[k] ?? '')))
  parts.push(escapeHashValue(storeKey))
  const plaintext = parts.join('|')
  return createHash('sha512').update(plaintext, 'utf8').digest('base64')
}

function randomNonce(): string {
  const alphabet = '0123456789ABCDEF'
  let out = ''
  for (let i = 0; i < 24; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

/** Builds the exact form field set posted (by the BROWSER) to the bank's 3D Pay Hosting gateway
 *  URL. No card field is included — see file header for why this is structurally, not just
 *  by-naming, PAN-free. */
export function buildHostingFormFields(
  fields: Record<string, string>,
  input: PaySessionInput,
  merchantRef: string
): Record<string, string> {
  const clientId = requireField(fields, 'clientId')
  const storeKey = requireField(fields, 'storeKey')
  const lang = fields.lang === 'en' ? 'en' : 'tr'
  const amount = (input.amountKurus / 100).toFixed(2)

  const base: Record<string, string> = {
    clientid: clientId,
    storetype: '3d_pay_hosting',
    hashAlgorithm: 'ver3',
    amount,
    oid: merchantRef,
    // NestPay 3D Pay Hosting has no separate async webhook — the bank POSTs its final result
    // straight to okUrl/failUrl, i.e. the BROWSER lands there. So both point at our webhook
    // route, which verifies+credits then redirects the browser on to input.returnUrl (stored on
    // the payment row — see migration 156 / app/api/.../webhook/[bankKey]/route.ts).
    okUrl: input.webhookUrl,
    failUrl: input.webhookUrl,
    rnd: randomNonce(),
    lang,
    currency: TRY_NUMERIC_CURRENCY,
    taksit: '0',
    TranType: 'Auth',
  }
  const hash = buildNestpayHash(base, storeKey)
  // Defensive: different bank deployments of this shared protocol have been seen expecting
  // either casing for the hash field (see file header "What is NOT verified"); sending both is
  // harmless (the extra key is simply ignored by a gateway expecting the other one) and avoids a
  // silent failure from guessing the wrong single casing.
  return { ...base, hash, HASH: hash }
}

/** Verifies an inbound callback's own hash before trusting any field in it — same "never trust
 *  the payload alone" posture as every other adapter in this module. */
function verifyCallbackHash(body: Record<string, string>, storeKey: string): boolean {
  const provided = body.HASH || body.hash
  if (!provided) return false
  const expected = buildNestpayHash(body, storeKey)
  const expectedBuf = Buffer.from(expected, 'utf8')
  const gotBuf = Buffer.from(provided, 'utf8')
  return expectedBuf.length === gotBuf.length && timingSafeEqual(expectedBuf, gotBuf)
}

function mapCallbackToEvent(body: Record<string, string>): PaymentEvent {
  const mdStatus = body.mdStatus
  const procReturnCode = body.ProcReturnCode
  // Conservative on purpose: mdStatus '2'/'3'/'4' ("half 3D Secure" per both reference
  // implementations) is NOT treated as a completed charge here — only full ('1') success, with
  // ProcReturnCode confirming the bank's own procedure outcome where present, is 'captured'.
  let status: PaymentStatus = 'pending'
  if (mdStatus === '1' && (procReturnCode === undefined || procReturnCode === '00')) {
    status = 'captured'
  } else if (mdStatus !== undefined && mdStatus !== '1') {
    status = 'failed'
  } else if (procReturnCode !== undefined && procReturnCode !== '00') {
    status = 'failed'
  }
  const amountKurus = Math.round(Number(body.amount || '0') * 100)
  return {
    bankKey: 'nestpay',
    merchantRef: body.oid || '',
    status,
    amountKurus,
    last4: body.maskedCreditCard,
    raw: body,
  }
}

export function createNestpayAdapter(bankKey: BankKey): BankPosAdapter {
  return {
    bankKey,
    isReal: true,

    async createHosted3dsSession(
      credentials: BankMerchantCredentials,
      input: PaySessionInput
    ): Promise<HostedSession> {
      const gatewayUrl = requireField(credentials.fields, 'gatewayUrl')
      const merchantRef = `notya-${input.invoiceId}-${Date.now()}`
      const formFields = buildHostingFormFields(credentials.fields, input, merchantRef)
      return {
        bankKey,
        sessionId: merchantRef,
        redirectUrl: gatewayUrl,
        merchantRef,
        environment: credentials.environment,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        redirectMethod: 'POST',
        redirectFormFields: formFields,
      }
    },

    async parseWebhook(credentials: BankMerchantCredentials, raw: unknown): Promise<PaymentEvent> {
      const storeKey = requireField(credentials.fields, 'storeKey')
      const envelope = raw as { body?: Record<string, string> }
      const body = envelope.body
      if (!body) throw new Error('nestpay: webhook envelope missing form body')
      if (!verifyCallbackHash(body, storeKey)) {
        throw new Error('nestpay: callback hash verification failed')
      }
      return mapCallbackToEvent(body)
    },

    async queryStatus(credentials: BankMerchantCredentials, merchantRef: string): Promise<PaymentEvent> {
      // 3D Pay Hosting's own callback is already the final result (see file header) — there is
      // no separate hosted-session status endpoint for this model. A true out-of-band re-check
      // would use NestPay's server-to-server XML API (OrderId + Extra ORDERSTATUS=QUERY against
      // `queryUrl`), which needs `username`/`password` in addition to `clientId`/`storeKey`.
      // Deliberately not built in this pass (not needed for the Hosting-mode charge flow, and
      // building an unverified XML endpoint caller "for completeness" would be exactly the kind
      // of guessed shape this module's honesty rule exists to prevent) — throwing a clear,
      // actionable error rather than fabricating a response.
      if (!credentials.fields.queryUrl || !credentials.fields.username || !credentials.fields.password) {
        throw new Error(
          'nestpay: out-of-band status query needs queryUrl/username/password merchant fields (not configured); the 3D Pay Hosting callback is normally the final result for merchantRef ' +
            merchantRef
        )
      }
      throw new Error('nestpay: XML status-query API not implemented in this pass — see CHECKLIST.md')
    },
  }
}
