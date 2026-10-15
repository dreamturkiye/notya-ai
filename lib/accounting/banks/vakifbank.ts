/**
 * NOTYA-ACCOUNTING-01 — VakıfBank "PayFlex Common Payment" (Ortak Ödeme / "Güvenli Ortak Ödeme")
 * V4 adapter. Status: **REAL — BEST-EFFORT, single-source OSS structural confirmation** (one tier
 * below `garanti.ts`'s direct-vendor-portal tier, same tier as `yapikredi_posnet.ts`) — see
 * "WHAT IS NOT CONFIRMED" below for the one real gap. Hosted/redirect only — SAQ-A posture, never
 * touches raw PAN/CVV (Kaan's non-negotiable rule). This is a genuinely DIFFERENT flow shape from
 * every other adapter in this module: it needs a server-to-server "register" call BEFORE the
 * browser redirect (to obtain a one-time `PaymentToken`), not just a browser-POSTed form.
 *
 * THIS PASS'S WORKAROUND (per Kaan's own instruction): the prior pass's fetch tool refused every
 * raw GitHub URL for the `vakifbankpay`/`VakifBankPosPay.php` driver it had identified in
 * `mews/pos`'s Packagist listing. This pass used `git clone --depth 1
 * https://github.com/mewebstudio/pos.git` directly and read the cloned source with Read/Grep —
 * which worked without any refusal. **What that source read actually found differs from what the
 * prior pass was looking for**: current `mews/pos` has NO file named `VakifBankPosPay.php` and no
 * driver called `vakifbankpay` — that may be an old/renamed Packagist listing. What IS in the
 * current source, under the bank-config key `'vakifbank-cp'`, is `PayFlexCPV4Pos` — VakıfBank's
 * own "PayFlex Common Payment" product. This is almost certainly the SAME product Kaan's
 * instruction named ("Güvenli Ortak Ödeme" = "Secure Common Payment"; "PayFlex" is confirmed
 * directly in `config/pos_production.php`'s own comment as `// VakifBank-PayFlex-Common-Payment`,
 * i.e. VakıfBank's own gateway brand name) — just reached via the actual current driver name
 * rather than the stale one the prior pass had.
 *
 * SOURCES (all read directly this pass, 2026-10-15, fifth pass, from the `mewebstudio/pos` clone):
 * - `config/pos_production.php` / `config/pos_test.php`, `'vakifbank-cp'` block — confirms this
 *   library treats VakıfBank's "PayFlex Common Payment" as a gateway DISTINCT from the plain
 *   `'vakifbank'` (Standart/MPI, PAN-touching, already correctly ruled out) entry in the SAME
 *   config file. Endpoints: live `https://cpweb.vakifbank.com.tr/CommonPayment/api`, test
 *   `https://cptest.vakifbank.com.tr/CommonPayment/api`.
 * - `src/Gateway/PayFlexCPV4Pos.php` — class doc comment: `PayFlex Common Payment (Ortak Ödeme)
 *   ISD v4.0`. `$supportedTransactions` for `TX_TYPE_PAY_AUTH` lists ONLY `MODEL_3D_PAY` and
 *   `MODEL_3D_HOST` — this gateway does not even offer a card-collecting `MODEL_NON_SECURE` path
 *   for a sale. `registerPayment()`/`get3DFormData()` show the actual two-step flow (this is the
 *   structural confirmation, not an inference from "Common Payment" in the name):
 *     1. Server-to-server POST to `{baseUrl}/RegisterTransaction` via
 *        `create3DFormInitializeRequestData()` — the request only adds
 *        `PAN`/`CVV`/`ExpireMonth`/`ExpireYear`/`CardHoldersName`/`BrandNumber`
 *        `if ($creditCard instanceof CreditCardInterface)` (`PayFlexCPV4PosRequestDataMapper.php`
 *        line ~114) — for `MODEL_3D_HOST` no card object is ever passed in (same
 *        `check3DFormInputs()` guard as InterPos: `AbstractGateway.php` line ~558 THROWS if a
 *        card is passed together with `MODEL_3D_HOST`). The register call returns only
 *        `{CommonPaymentUrl, PaymentToken}` (or an error code) — no card data goes either way.
 *     2. `create3DFormData()` (`PayFlexCPV4PosRequestDataMapper.php` line ~190) turns that into a
 *        plain `GET {CommonPaymentUrl}?Ptkn={PaymentToken}` redirect — the browser's ENTIRE
 *        payload to the bank is one opaque token, nothing card-shaped at all. Card entry happens
 *        on VakıfBank's own `CommonPaymentUrl` page.
 *     3. After the bank redirects back to `SuccessUrl`/`FailUrl` with `{TransactionId,
 *        PaymentToken}`, `get3DPaymentStatus()` makes a SECOND server-to-server POST to
 *        `{baseUrl}/VposTransaction` (via `create3DPaymentStatusRequestData()`) to get the real
 *        result: `{Rc, AuthCode, TransactionId, PaymentToken, MaskedPan}` on success or `{Rc,
 *        Message, TransactionId, PaymentToken}` on failure. `Rc === '0000'`
 *        (`PayFlexCPV4PosResponseDataMapper::PROCEDURE_SUCCESS_CODE`) is the only success code.
 * - `src/Client/PayFlexCPV4PosHttpClient.php` — confirms the wire format directly: POST,
 *   `Content-Type: application/x-www-form-urlencoded`, `Accept: text/xml` — i.e. form-encoded
 *   request, XML response (NOT JSON) — and the exact two endpoint paths
 *   (`.../RegisterTransaction` for the register step, `.../VposTransaction` for everything else,
 *   including the status-check step above).
 * - `src/Model/Account/PayFlexPosAccount.php` — confirms credential fields: `merchantId` ("Isyeri
 *   No"), `password` ("Isyeri Sifre"), `terminalId` ("Terminal No") — matches the 3 fields a
 *   VakıfBank merchant account actually has.
 * - `examples/payflex-cp-v4/3d-host/_config.php` — the worked example literally constructs
 *   `AccountFactory::createPayFlexPosAccount('vakifbank-cp', $merchantId, $merchantPassword,
 *   $terminalId)` with `$paymentModel = PosInterface::MODEL_3D_HOST` — confirms this bank-config
 *   key and this exact payment model are the intended, documented way to use this gateway.
 *
 * WHAT IS **NOT** CONFIRMED, disclosed plainly rather than papered over (this is the file's one
 * real gap, same honesty posture as `yapikredi_posnet.ts`'s own disclosed MAC-encoding gap):
 * - `src/Crypt/PayFlexCPV4PosCrypt.php::createHash()` — the HASH FIELD'S OWN CORRECTNESS IS
 *   FLAGGED AS UNRESOLVED BY THE LIBRARY'S OWN AUTHOR. Its source has a literal `// todo` comment
 *   reading: `"ErrorCode" => "5029" "ResponseMessage" => "Geçersiz İstek" hash ile istek
 *   gonderince hatasi aliyoruz` — i.e. "we get error 5029 'Invalid Request' when sending the
 *   request WITH the hash" — the library's own maintainer documents that this exact hash
 *   construction may not even be accepted by VakıfBank's real endpoint. The formula implemented
 *   below (`buildVakifCpHash`) mirrors that source exactly (HostMerchantId + AmountCode + Amount +
 *   MerchantPassword + '' + the literal constant string `'VBank3DPay2014'`, SHA-?+base64 via the
 *   same `hashString()` helper InterPos/NestPay use — SHA-1, base64 of raw digest bytes, since
 *   `PayFlexCPV4PosCrypt` doesn't override `HASH_ALGORITHM`), but this is flagged here with the
 *   SAME uncertainty the source itself carries — **not independently confirmed working, and the
 *   source explicitly suggests it may not be.** A human must run one real VakıfBank test-sandbox
 *   RegisterTransaction call and check whether `ErrorCode: 5029` comes back before this is trusted
 *   with real money; if it does, the fix is almost certainly VakıfBank's own PayFlex integration
 *   guide (not publicly found this pass — VakıfBank's merchant-only documentation, available after
 *   opening a real PayFlex merchant account, per the file header's "What would unstub this" below).
 * - No independent second source cross-confirmed this hash (GitLab, where `ankapix`'s fork lives,
 *   was separately found policy-blocked at the network/proxy level this pass — a `git clone`
 *   returned a 403 at the CONNECT tunnel, not a content refusal).
 * - Numeric `Rc` values beyond `'0000'` (success) were not reached — any other value, including
 *   the known `5029`, maps to `failed` here, never guessed into `captured`.
 * - **A second, disclosed source inconsistency, resolved by picking the more reliable signal, not
 *   by guessing**: the PRIVATE method `get3DPaymentStatus()`'s own PHPDoc return-type hint lists
 *   only `{Rc, AuthCode, TransactionId, PaymentToken, MaskedPan}` for a success response — no
 *   `Amount`/`AmountCode`/`OrderID`. But the GENERIC response mapper that actually consumes that
 *   same response, `PayFlexCPV4PosResponseDataMapper::map3DPayResponseData()`, unconditionally
 *   reads `$raw3DAuthResponseData['Amount']`, `['AmountCode']`, `['OrderID']`,
 *   `['InstallmentCount']`, `['HostDate']` in its success branch, with no `isset` guard — strong
 *   evidence the private method's own docblock is simply stale/incomplete (a common pattern for
 *   an internal, non-public method), not that the live response truly lacks these fields, since a
 *   real library wouldn't unconditionally index into keys its own code paths never populate.
 *   `extractXmlTags`/`mapStatusXmlToEvent` below therefore ALSO reads `Amount`/`AmountCode`/
 *   `OrderID` from the VposTransaction response (treating the response-mapper's actual field
 *   access as the more reliable signal of the true wire shape) rather than hardcoding
 *   `amountKurus: 0` from the narrower, likely-stale private-method hint — the safer failure mode
 *   given this module trusts the adapter's returned `amountKurus` to credit the ledger
 *   (`lib/accounting/payments/session.ts::applyPaymentEvent`). **This one field's presence in the
 *   real response is the adapter's single biggest remaining assumption** — a human's first real
 *   sandbox transaction should specifically confirm `Amount`/`AmountCode` actually come back on
 *   `VposTransaction`, not just that `Rc`/`AuthCode`/`MaskedPan` do.
 *
 * - **Third disclosed gap — how the bank's own GET callback identifies WHICH order it's for.**
 *   `examples/_templates/_payment_secure_response.php` (read directly this pass) has an inline
 *   comment confirming PayFlexCPV4Pos's callback uses GET, not POST (`"3D odemelerde gatewayden
 *   genelde POST istek bekleniyor... PayFlexCP ve PayTr GET request ile cevaplıyor"` — "3D
 *   payments usually expect a POST from the gateway... PayFlexCP and PayTR reply with a GET
 *   request"), matching `create3DFormData()`'s plain `GET ?Ptkn=...` shape above. But that SAME
 *   example then recovers which order this is from **its own PHP session**
 *   (`$order = $_SESSION['order']`), NOT from anything the bank echoes back in the GET query
 *   string. That is an application-level design choice outside the library, and this pass found
 *   NO source confirming whether VakıfBank's own redirect preserves extra query parameters a
 *   merchant appends to `SuccessUrl`/`FailUrl`. This adapter's own design choice — appending
 *   `?merchantRef={orderId}` to both URLs — is a standard, common pattern for a stateless
 *   server-side webhook (Notya has no PHP-session equivalent), but it is EXPLICITLY NOT
 *   source-confirmed to survive VakıfBank's redirect; a human's first real sandbox transaction
 *   should specifically check that this query parameter comes back unchanged.
 *
 * WHAT WOULD FULLY UNSTUB THE REMAINING UNCERTAINTY: VakıfBank's own PayFlex Common Payment
 * integration guide (merchant-only, requested after opening a real test/sandbox PayFlex account),
 * confirming the `HashedData` formula, the `VposTransaction` response's real field set, and
 * whether `SuccessUrl`/`FailUrl` query parameters survive the redirect — or a successful real
 * test-sandbox round trip confirming all three directly.
 */
import { createHash } from 'crypto'
import type { BankPosAdapter, BankMerchantCredentials } from '../payments/types'
import type { HostedSession, PaySessionInput, PaymentEvent, PaymentStatus } from '../types'

const DEFAULT_TEST_BASE_URL = 'https://cptest.vakifbank.com.tr/CommonPayment/api'
const DEFAULT_LIVE_BASE_URL = 'https://cpweb.vakifbank.com.tr/CommonPayment/api'
/** Literal constant from `PayFlexCPV4PosCrypt::createHash()` — the library's own source hardcodes
 *  this exact string as the hash's final element, with a `// todo` beside it. Carried over as-is,
 *  not invented — see file header "WHAT IS NOT CONFIRMED". */
const PAYFLEX_HASH_CONSTANT = 'VBank3DPay2014'

export interface PayFlexTransport {
  /** Posts `application/x-www-form-urlencoded` fields and returns the raw XML response body —
   *  PayFlex CP speaks form+XML, never JSON (confirmed directly from `PayFlexCPV4PosHttpClient.php`
   *  — see file header), so this does NOT reuse the module's shared JSON `HttpTransport`. */
  postForm(url: string, fields: Record<string, string>): Promise<{ status: number; xml: string }>
}

export const fetchPayFlexTransport: PayFlexTransport = {
  async postForm(url, fields) {
    const body = new URLSearchParams(fields).toString()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/xml' },
      body,
    })
    const xml = await res.text()
    return { status: res.status, xml }
  },
}

/** Minimal, non-validating leaf-tag extractor — PayFlex CP's responses are flat (no nesting, no
 *  attributes, per every response type hint read in `PayFlexCPV4Pos.php`/
 *  `PayFlexCPV4PosResponseDataMapper.php`), so a tiny regex scan is honest here; this deliberately
 *  does NOT claim to be a general XML parser. */
export function extractXmlTags(xml: string, tags: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const tag of tags) {
    const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
    out[tag] = m ? m[1] : undefined
  }
  return out
}

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`vakifbank adapter: missing required merchant field "${key}"`)
  return v
}

/** `PayFlexCPV4PosCrypt::createHash()`, carried over exactly (including its unresolved `// todo`
 *  — see file header). SHA-1 of the plain concatenation, base64 of the raw digest bytes (the same
 *  `hashString()` convention InterPos/NestPay use — `PayFlexCPV4PosCrypt` inherits it unchanged). */
export function buildVakifCpHash(hostMerchantId: string, amountCode: string, amount: string, merchantPassword: string): string {
  const plaintext = hostMerchantId + amountCode + amount + merchantPassword + '' + PAYFLEX_HASH_CONSTANT
  return createHash('sha1').update(plaintext, 'utf8').digest('base64')
}

function mapRegisterError(fields: Record<string, string | undefined>): never {
  throw new Error(
    `vakifbank: RegisterTransaction failed (ErrorCode ${fields.ErrorCode ?? '?'}): ${fields.ResponseMessage ?? 'no message'}` +
      (fields.ErrorCode === '5029'
        ? ' — this is the exact "Geçersiz İstek" code PayFlexCPV4PosCrypt\'s own source flags as unresolved for HashedData; see file header.'
        : '')
  )
}

export function createVakifBankAdapter(transport: PayFlexTransport = fetchPayFlexTransport): BankPosAdapter {
  return {
    bankKey: 'vakifbank',
    isReal: true,

    async createHosted3dsSession(
      credentials: BankMerchantCredentials,
      input: PaySessionInput
    ): Promise<HostedSession> {
      const baseUrl =
        credentials.fields.baseUrl ||
        (credentials.environment === 'live' ? DEFAULT_LIVE_BASE_URL : DEFAULT_TEST_BASE_URL)
      const merchantId = requireField(credentials.fields, 'merchantId')
      const merchantPassword = requireField(credentials.fields, 'merchantPassword')
      const terminalId = requireField(credentials.fields, 'terminalId')
      const orderId = `notya${input.invoiceId}${Date.now()}`.slice(0, 36)
      const amountCode = '949' // TRY, ISO 4217 numeric — confirmed PayFlexCPV4PosRequestValueMapper mapping
      const amount = (input.amountKurus / 100).toFixed(2) // PayFlex formats amount as "123.45", not kuruş
      // Own design choice, NOT source-confirmed to survive the redirect — see file header "third
      // disclosed gap". A stateless webhook needs some way to recover which order this is; the
      // library's own example instead relies on a PHP session Notya has no equivalent of.
      const successFailUrl = `${input.webhookUrl}${input.webhookUrl.includes('?') ? '&' : '?'}merchantRef=${encodeURIComponent(orderId)}`

      const hashedData = buildVakifCpHash(merchantId, amountCode, amount, merchantPassword)
      // Fields exactly as PayFlexCPV4PosRequestDataMapper::create3DFormInitializeRequestData()
      // builds them for MODEL_3D_HOST — no creditCard is ever constructed/passed here, so no
      // PAN/CVV/BrandNumber/CardHoldersName field exists in this object at all (see file header).
      const registerFields: Record<string, string> = {
        HostMerchantId: merchantId,
        MerchantPassword: merchantPassword,
        HostTerminalId: terminalId,
        TransactionType: 'Sale',
        AmountCode: amountCode,
        Amount: amount,
        OrderID: orderId,
        IsSecure: 'true',
        AllowNotEnrolledCard: 'false',
        SuccessUrl: successFailUrl,
        FailUrl: successFailUrl,
        RequestLanguage: credentials.fields.lang === 'en' ? 'en' : 'tr',
        Extract: '',
        CustomItems: '',
        HashedData: hashedData,
      }

      const { status, xml } = await transport.postForm(`${baseUrl}/RegisterTransaction`, registerFields)
      if (status < 200 || status >= 300) {
        throw new Error(`vakifbank: RegisterTransaction HTTP ${status}`)
      }
      const parsed = extractXmlTags(xml, ['CommonPaymentUrl', 'PaymentToken', 'ErrorCode', 'ResponseMessage'])
      if (parsed.ErrorCode || !parsed.CommonPaymentUrl || !parsed.PaymentToken) {
        mapRegisterError(parsed)
      }

      // create3DFormData(): a plain GET to {CommonPaymentUrl}?Ptkn={PaymentToken} — the browser's
      // entire payload to the bank is this one opaque token (see file header).
      const redirectUrl = `${parsed.CommonPaymentUrl}${parsed.CommonPaymentUrl!.includes('?') ? '&' : '?'}Ptkn=${encodeURIComponent(parsed.PaymentToken!)}`

      return {
        bankKey: 'vakifbank',
        sessionId: orderId,
        redirectUrl,
        merchantRef: orderId,
        environment: credentials.environment,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        // Classic GET-navigation redirect — redirectMethod/redirectFormFields intentionally omitted.
      }
    },

    async parseWebhook(credentials: BankMerchantCredentials, raw: unknown): Promise<PaymentEvent> {
      // The bank's browser-redirect callback itself only carries {TransactionId, PaymentToken} —
      // never a trustworthy final result on its own (create3DPaymentStatusRequestData() exists
      // precisely because that callback must be confirmed server-to-server). So "verification"
      // here IS the status query, not a local hash check — there is no inbound hash to check on
      // this callback per the source read this pass.
      const baseUrl =
        credentials.fields.baseUrl ||
        (credentials.environment === 'live' ? DEFAULT_LIVE_BASE_URL : DEFAULT_TEST_BASE_URL)
      const merchantId = requireField(credentials.fields, 'merchantId')
      const password = requireField(credentials.fields, 'merchantPassword')
      const envelope = raw as { body?: Record<string, string> }
      const body = envelope.body
      if (!body?.TransactionId || !body?.PaymentToken) {
        throw new Error('vakifbank: webhook envelope missing TransactionId/PaymentToken')
      }

      // create3DPaymentStatusRequestData()'s own getRequestAccountData() uses the key "Password",
      // NOT "MerchantPassword" — a real, read-not-assumed discrepancy from the register step above.
      const statusFields: Record<string, string> = {
        HostMerchantId: merchantId,
        Password: password,
        TransactionId: body.TransactionId,
        PaymentToken: body.PaymentToken,
      }
      const { status, xml } = await transport.postForm(`${baseUrl}/VposTransaction`, statusFields)
      if (status < 200 || status >= 300) {
        throw new Error(`vakifbank: VposTransaction HTTP ${status}`)
      }
      // Our own `merchantRef` query param (see createHosted3dsSession) is the reliable
      // correlation id — applyPaymentEvent looks up accounting_payments by it + bankKey, and it's
      // the one value this adapter itself generated and is certain of, unlike the response
      // fields' disclosed uncertainty above.
      return mapStatusXmlToEvent(xml, body.merchantRef)
    },

    async queryStatus(credentials: BankMerchantCredentials, merchantRef: string): Promise<PaymentEvent> {
      // Same VposTransaction call as parseWebhook, keyed by OrderID instead of a fresh callback —
      // but create3DPaymentStatusRequestData() only accepts TransactionId/PaymentToken, which this
      // module does not persist independently of the payment row. Rather than guess an OrderID-
      // keyed query shape that was never read from source, this throws a clear, actionable error.
      throw new Error(
        'vakifbank: out-of-band status query by merchantRef alone is not a confirmed VposTransaction shape (it needs TransactionId+PaymentToken from the bank\'s own callback) for merchantRef ' +
          merchantRef
      )
    },
  }
}

function mapStatusXmlToEvent(xml: string, merchantRef: string | undefined): PaymentEvent {
  const parsed = extractXmlTags(xml, [
    'Rc',
    'AuthCode',
    'TransactionId',
    'PaymentToken',
    'MaskedPan',
    'Message',
    'Amount',
    'AmountCode',
    'OrderID',
  ])
  // PROCEDURE_SUCCESS_CODE per PayFlexCPV4PosResponseDataMapper — only '0000' is captured; the
  // known-flagged '5029' and everything else is failed, never guessed into captured.
  const status: PaymentStatus = parsed.Rc === '0000' ? 'captured' : 'failed'
  // Amount/AmountCode: see file header "second source inconsistency" — read from the
  // response-mapper's own (unconditional) field access, not the narrower private-method hint.
  // formatAmount() on this gateway is number_format(amount, 2) — a decimal TRY string.
  const amountKurus = parsed.Amount ? Math.round(Number(parsed.Amount) * 100) : 0
  return {
    bankKey: 'vakifbank',
    // Prefer OUR OWN merchantRef (the query param this adapter attached to SuccessUrl/FailUrl —
    // see file header "third disclosed gap") over the bank's echoed OrderID, since this is the
    // one value the adapter is certain of regardless of what VakıfBank's response does or doesn't
    // preserve.
    merchantRef: merchantRef || parsed.OrderID || parsed.TransactionId || '',
    status,
    amountKurus,
    authCode: parsed.AuthCode,
    last4: parsed.MaskedPan,
    raw: parsed,
  }
}
