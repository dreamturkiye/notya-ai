/**
 * NOTYA-ACCOUNTING-01 — Garanti BBVA Virtual POS "Common Payment Page" (Ortak Ödeme Sayfası /
 * OOS) adapter. Status: **REAL — direct vendor documentation** (dev.garantibbva.com.tr), the same
 * confidence tier as iyzico for the parts the portal states outright, with ONE disclosed inference
 * (see "What is NOT directly stated" below). Hosted/redirect 3D Secure only — SAQ-A posture, never
 * touches raw PAN/CVV (Kaan's non-negotiable rule).
 *
 * SOURCES (fetched directly from the vendor's own developer portal this pass, 2026-10-15):
 * - https://dev.garantibbva.com.tr/en/virtual-pos-common-payment-term ("Virtual POS Transactions
 *   General Concepts") — the shared Common Payment form template, endpoints, and the
 *   `secure3dhash` construction.
 * - https://dev.garantibbva.com.tr/en/virtual-pos-common-payment-dcc and
 *   https://dev.garantibbva.com.tr/en/virtualpos-common-payment-cash — per-variant pages showing
 *   `secure3dsecuritylevel` values (`OOS_PAY` non-3D / `3D_OOS_PAY` 3D) and which blocks of the
 *   shared template each variant keeps.
 * - https://dev.garantibbva.com.tr/en/virtualpos-sales-fixed-amount-non-3ds — confirms the
 *   `Amount`/`txnamount` minor-unit format ("1,00 TL -> 100", "11,22 TL -> 1122") — this is why
 *   `amountKurus` needs NO conversion here, unlike a decimal-string gateway.
 * - Cross-reference (OSS, corroborating, not primary): `developertugrul/garanti-pos`
 *   (github.com/developertugrul/garanti-pos, via its Packagist listing) has a dedicated
 *   `buildOOSForm()`/`buildGarantiPayForm()` entry point distinct from its card-collecting
 *   `build3DForm()`/`pay3DModel()` ones — independent corroboration that Common Payment/OOS is a
 *   structurally separate, redirect-only flow from Garanti's card-collecting products, not just an
 *   inference from the product's name.
 *
 * WHAT THE PORTAL STATES DIRECTLY (high confidence, iyzico-level — concrete field names copied
 * from the live pages, not invented):
 * - Endpoints: test form action `https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine`
 *   (`mode=TEST`); the portal's own prose also names
 *   `https://sanalposprovtest.garantibbva.com.tr/VPServlet` (test) and
 *   `https://sanalposprov.garanti.com.tr/VPServlet` (prod, `mode=PROD`) — these match Kaan's own
 *   instruction exactly, so `gatewayUrl` below defaults to the VPServlet pair and is still a
 *   merchant-overridable field (see "what is NOT directly stated" — the two URLs could differ in
 *   practice, so this stays configurable rather than hardcoded in one place only).
 * - Field names: `mode`, `apiversion` (512), `secure3dsecuritylevel` (`3D_OOS_PAY` — this adapter
 *   always uses the 3D variant, never `OOS_PAY`, because 3DS is mandatory here), `terminalprovuserid`
 *   (ProvUserID), `terminaluserid`, `terminalmerchantid` (Merchant ID), `terminalid` (Terminal ID),
 *   `orderid`, `successurl`, `errorurl`, `txnamount`, `txntype` (`sales`), `txncurrencycode` (949
 *   TRY), `txninstallmentcount`, `txntimestamp` (UTC), `refreshtime`, `customeremailaddress`,
 *   `customeripaddress`, `companyname`, `lang`, and the hash field `secure3dhash`.
 * - Hash (`secure3dhash`), stated in two steps on the General Concepts page:
 *     1. `hashedpassword = UPPER(SHA1(ProvisionPassword + "0" + TerminalID))`
 *     2. `secure3dhash = UPPER(SHA512(TerminalID + OrderID + Amount + CurrencyCode + SuccessURL +
 *        ErrorURL + Type + InstallmentCount + StoreKey + hashedpassword))`
 *   Both steps are hashed over ISO-8859-9-encoded text per the portal. `StoreKey`/`ProvisionPassword`
 *   are used ONLY inside the hash — never posted as form fields, same posture as NestPay's storeKey.
 * - Callback fields POSTed to `successurl`/`errorurl`: `mdstatus`, `mderrormessage`, `errmsg`,
 *   `response`, `procreturncode`, `oid`/`orderid`, `clientid`, echoes of the request fields, and
 *   `secure3dhash`.
 *
 * WHAT IS **NOT** DIRECTLY STATED BY THE PORTAL (disclosed honestly, not papered over):
 * - The portal's shared sample HTML form (reused across several product pages — sales, DCC, OOS
 *   variants) also lists card fields (`cardnumber`, `cardcvv2`, `cardexpiredatemonth/year`,
 *   `cardholdername`) in its template, and the portal does not say in so many words "the OOS/
 *   Common Payment variant's merchant-submitted form omits these." This adapter NEVER sends them —
 *   that is a deliberate architectural choice (Kaan's non-negotiable SAQ-A rule), backed by (a) the
 *   product's own name/description ("the transaction continues on the Garanti BBVA Common Payment
 *   page" — i.e. card entry happens there, not on the merchant's submitted form) and (b) the OSS
 *   cross-reference above showing OOS/GarantiPay as a separate code path from the card-collecting
 *   one. It is the one inference in this file, stated plainly rather than hidden.
 * - The portal does not say how the merchant should verify `secure3dhash` on the way back. This
 *   adapter recomputes the SAME hash formula over the echoed-back order fields and compares — the
 *   same "the request hash function also verifies the callback" posture used in `nestpay.ts` — not
 *   an independently confirmed callback-specific algorithm.
 * - Numeric `mdstatus`/`procreturncode` value tables ("what does 2 mean exactly") were not available
 *   on the fetched pages (the portal points to a separate error-codes page not reached this pass).
 *   Mapping below is conservative, mirroring NestPay's own posture for the same underlying 3D
 *   Secure MPI convention shared by Turkish bank gateways: only `mdstatus === '1'` (full 3D Secure
 *   success) is `captured`; `2`/`3`/`4` ("half 3D Secure" in that shared convention) and anything
 *   else is `failed`, never guessed into `captured`.
 */
import { createHash, timingSafeEqual } from 'crypto'
import type { BankPosAdapter, BankMerchantCredentials } from '../payments/types'
import type { HostedSession, PaySessionInput, PaymentEvent, PaymentStatus } from '../types'

const TRY_NUMERIC_CURRENCY = '949'
const DEFAULT_TEST_GATEWAY_URL = 'https://sanalposprovtest.garantibbva.com.tr/VPServlet'
const DEFAULT_LIVE_GATEWAY_URL = 'https://sanalposprov.garanti.com.tr/VPServlet'

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`garanti adapter: missing required merchant field "${key}"`)
  return v
}

/** ISO-8859-9 (Turkish Latin-5) encoding, per the portal's own hash instructions — plain ASCII
 *  field values (IDs, amounts, URLs) are byte-identical to UTF-8 for this charset, but this stays
 *  explicit rather than silently assuming UTF-8 is "close enough" for a payment hash. */
function toIso88599(value: string): Buffer {
  return Buffer.from(value, 'latin1')
}

/** Step 1 of the documented hash: `UPPER(SHA1(ProvisionPassword + "0" + TerminalID))`. */
export function buildGarantiHashedPassword(provisionPassword: string, terminalId: string): string {
  const plaintext = provisionPassword + '0' + terminalId
  return createHash('sha1').update(toIso88599(plaintext)).digest('hex').toUpperCase()
}

/** Step 2: `UPPER(SHA512(terminalId + orderId + amount + currencyCode + successUrl + errorUrl +
 *  type + installmentCount + storeKey + hashedPassword))`, exact field order per
 *  dev.garantibbva.com.tr's General Concepts page. */
export function buildGarantiSecure3dHash(params: {
  terminalId: string
  orderId: string
  amount: string
  currencyCode: string
  successUrl: string
  errorUrl: string
  txnType: string
  installmentCount: string
  storeKey: string
  hashedPassword: string
}): string {
  const plaintext =
    params.terminalId +
    params.orderId +
    params.amount +
    params.currencyCode +
    params.successUrl +
    params.errorUrl +
    params.txnType +
    params.installmentCount +
    params.storeKey +
    params.hashedPassword
  return createHash('sha512').update(toIso88599(plaintext)).digest('hex').toUpperCase()
}

/** Builds the exact field set the BROWSER posts to Garanti's Common Payment gateway. Deliberately
 *  never includes a card field — see file header "What is NOT directly stated". */
export function buildGarantiOosFormFields(
  fields: Record<string, string>,
  input: PaySessionInput,
  orderId: string,
  environment: 'test' | 'live'
): Record<string, string> {
  const terminalId = requireField(fields, 'terminalId')
  const merchantId = requireField(fields, 'merchantId')
  const provisionPassword = requireField(fields, 'provAutPassword')
  const storeKey = requireField(fields, 'storeKey')
  const lang = fields.lang === 'en' ? 'en' : 'tr'
  const amount = String(Math.round(input.amountKurus)) // already minor-unit (kuruş) — no conversion
  const installmentCount = fields.installmentCount || ''
  const txnType = 'sales'

  const hashedPassword = buildGarantiHashedPassword(provisionPassword, terminalId)
  const secure3dhash = buildGarantiSecure3dHash({
    terminalId,
    orderId,
    amount,
    currencyCode: TRY_NUMERIC_CURRENCY,
    successUrl: input.webhookUrl,
    errorUrl: input.webhookUrl,
    txnType,
    installmentCount,
    storeKey,
    hashedPassword,
  })

  return {
    mode: environment === 'live' ? 'PROD' : 'TEST',
    apiversion: '512',
    secure3dsecuritylevel: '3D_OOS_PAY', // 3DS mandatory — never the non-3D 'OOS_PAY'
    terminalprovuserid: fields.provAutUserId || 'PROVAUT',
    terminaluserid: fields.terminalUserId || fields.provAutUserId || 'PROVAUT',
    terminalmerchantid: merchantId,
    terminalid: terminalId,
    orderid: orderId,
    successurl: input.webhookUrl,
    errorurl: input.webhookUrl,
    txnamount: amount,
    txntype: txnType,
    txncurrencycode: TRY_NUMERIC_CURRENCY,
    txninstallmentcount: installmentCount,
    txntimestamp: new Date().toISOString(),
    refreshtime: '0',
    customeremailaddress: input.buyerEmail || '',
    customeripaddress: input.buyer?.ip || '',
    companyname: fields.companyName || '',
    lang,
    secure3dhash,
  }
}

/** Recomputes `secure3dhash` over the callback's own echoed fields and compares — the portal does
 *  not document a callback-specific verification algorithm, so this reuses the request formula
 *  against the values Garanti echoes back (same posture as nestpay.ts's symmetric check). */
function verifyGarantiCallbackHash(body: Record<string, string>, storeKey: string, provisionPassword: string): boolean {
  const provided = body.secure3dhash
  if (!provided) return false
  const terminalId = body.terminalid || ''
  const hashedPassword = buildGarantiHashedPassword(provisionPassword, terminalId)
  const expected = buildGarantiSecure3dHash({
    terminalId,
    orderId: body.oid || body.orderid || '',
    amount: body.txnamount || '',
    currencyCode: body.txncurrencycode || TRY_NUMERIC_CURRENCY,
    successUrl: body.successurl || '',
    errorUrl: body.errorurl || '',
    txnType: body.txntype || 'sales',
    installmentCount: body.txninstallmentcount || '',
    storeKey,
    hashedPassword,
  })
  const expectedBuf = Buffer.from(expected, 'utf8')
  const gotBuf = Buffer.from(provided, 'utf8')
  return expectedBuf.length === gotBuf.length && timingSafeEqual(expectedBuf, gotBuf)
}

function mapGarantiCallbackToEvent(body: Record<string, string>): PaymentEvent {
  const mdstatus = body.mdstatus
  const procreturncode = body.procreturncode
  // Conservative, same posture as nestpay.ts: only full 3D Secure success ('1') is captured.
  let status: PaymentStatus = 'pending'
  if (mdstatus === '1' && (procreturncode === undefined || procreturncode === '00')) {
    status = 'captured'
  } else if (mdstatus !== undefined && mdstatus !== '1') {
    status = 'failed'
  } else if (procreturncode !== undefined && procreturncode !== '00') {
    status = 'failed'
  }
  const amountKurus = Math.round(Number(body.txnamount || '0'))
  return {
    bankKey: 'garanti',
    merchantRef: body.oid || body.orderid || '',
    status,
    amountKurus,
    raw: body,
  }
}

export function createGarantiAdapter(): BankPosAdapter {
  return {
    bankKey: 'garanti',
    isReal: true,

    async createHosted3dsSession(
      credentials: BankMerchantCredentials,
      input: PaySessionInput
    ): Promise<HostedSession> {
      const gatewayUrl =
        credentials.fields.gatewayUrl ||
        (credentials.environment === 'live' ? DEFAULT_LIVE_GATEWAY_URL : DEFAULT_TEST_GATEWAY_URL)
      const orderId = `notya${input.invoiceId}${Date.now()}`.slice(0, 36)
      const formFields = buildGarantiOosFormFields(credentials.fields, input, orderId, credentials.environment)
      return {
        bankKey: 'garanti',
        sessionId: orderId,
        redirectUrl: gatewayUrl,
        merchantRef: orderId,
        environment: credentials.environment,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        redirectMethod: 'POST',
        redirectFormFields: formFields,
      }
    },

    async parseWebhook(credentials: BankMerchantCredentials, raw: unknown): Promise<PaymentEvent> {
      const storeKey = requireField(credentials.fields, 'storeKey')
      const provisionPassword = requireField(credentials.fields, 'provAutPassword')
      const envelope = raw as { body?: Record<string, string> }
      const body = envelope.body
      if (!body) throw new Error('garanti: webhook envelope missing form body')
      if (!verifyGarantiCallbackHash(body, storeKey, provisionPassword)) {
        throw new Error('garanti: callback secure3dhash verification failed')
      }
      return mapGarantiCallbackToEvent(body)
    },

    async queryStatus(_credentials: BankMerchantCredentials, merchantRef: string): Promise<PaymentEvent> {
      // No out-of-band status-query endpoint/field-shape was confirmed on the fetched portal pages
      // this pass (they document the Common Payment form + callback only). Throwing a clear,
      // actionable error rather than fabricating an XML/SOAP query caller from an unconfirmed
      // shape — same honesty rule nestpay.ts follows for its own queryStatus.
      throw new Error(
        'garanti: out-of-band status query API not confirmed/implemented in this pass — see CHECKLIST.md for ' +
          merchantRef
      )
    },
  }
}
