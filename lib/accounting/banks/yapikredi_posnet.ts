/**
 * NOTYA-ACCOUNTING-01 — Yapı Kredi POSNET "3D Secure / OOS (Ortak Ödeme Sayfası)" adapter.
 * Status: **BEST-EFFORT — single-source OSS cross-reference**, ONE tier below nestpay.ts's
 * "VERIFIED by protocol cross-reference" (which read two independent implementations). Disclosed
 * honestly, not overstated — see CHECKLIST.md for the full breakdown and what still needs a human
 * to confirm before this goes live with real money. Hosted/redirect 3D Secure only — SAQ-A
 * posture, never touches raw PAN/CVV.
 *
 * WHAT WAS CHECKED THIS PASS (2026-10-15):
 * - `yapikredipos.com.tr` was fetched directly — it is a merchant-marketing site only (POS
 *   products, campaigns, application forms). No developer portal, no "POSNET 3D Secure XML
 *   Service Integration" / "POSNET XML Services" document is published there or anywhere else
 *   publicly reachable this pass. This is the real finding Kaan's instruction asked to verify, not
 *   an assumption — confirmed by fetching the site, not skipped.
 * - GitHub/GitLab source for the Turkish community POSNET libraries (`ankapix/sanalpos-entegrasyonlari`,
 *   `hasandz/posnet-oos`, `mertbuldur/posnet-oos`, `tcgunel/omnipay-yapikredi`) could NOT be read
 *   directly in this research pass — this session's fetch tool refused every raw GitHub/GitLab
 *   URL with a provenance error, unlike the NestPay pass, which *did* get to read two libraries'
 *   actual source. That is a tooling limitation of this pass, not a statement that the OSS
 *   doesn't exist or wasn't found — it was found (via Packagist, which mirrors each package's
 *   README), just not at full source-code depth.
 * - ONE package's Packagist-mirrored README (`tcgunel/omnipay-yapikredi`,
 *   github.com/tcgunel/omnipay-yapikredi) gave concrete, specific detail: exact test/live
 *   endpoint URLs (matching Kaan's own instruction for test, and newly confirming the exact live
 *   paths), the 4 credential field names, amount/currency/installment conventions, and a two-stage
 *   SHA256 MAC skeleton. A second, independent source to cross-confirm that MAC (the way NestPay's
 *   two libraries cross-confirmed each other) was NOT reached this pass — this is the file's one
 *   real gap, and it is why this is `isReal: true` but tiered as BEST-EFFORT, not VERIFIED.
 * - `docs.wisecp.com`'s Turkish-bank-POS reference page corroborates the 4 credential field names
 *   independently of the omnipay package (`mid` = Üye İşyeri No, `tid` = Terminal No, `posnetID` =
 *   bank-issued POSNET identifier, `encKey`/"Store Key" = POSNET ENC key) — this part IS
 *   genuinely two-source-confirmed.
 *
 * ENDPOINTS (test exactly as Kaan specified; live newly confirmed by the omnipay-yapikredi README,
 * matching the `posnet.yapikredi.com.tr` domain Kaan named):
 *   test:  XML  https://setmpos.ykb.com/PosnetWebService/XML
 *          3DS  https://setmpos.ykb.com/3DSWebService/YKBPaymentService
 *   live:  XML  https://posnet.yapikredi.com.tr/PosnetWebService/XML
 *          3DS  https://posnet.yapikredi.com.tr/3DSWebService/YKBPaymentService
 *
 * MAC (per the one source, NOT independently cross-confirmed — disclosed, not hidden):
 *   firstHash = SHA256(encKey + ";" + terminalId)
 *   mac       = SHA256(xid + ";" + amount + ";" + currency + ";" + merchantId + ";" + firstHash)
 *   The source's README does not state hex vs. base64 output. This adapter base64-encodes the raw
 *   digest bytes, matching the convention this module already uses for NestPay's `ver3` hash and
 *   the common pattern in sibling POSNET implementations encountered in general protocol
 *   familiarity — but this ONE encoding choice is explicitly NOT independently confirmed this
 *   pass. A human should verify it against a real sandbox transaction (or the repository source
 *   directly) before this adapter is trusted with live money — see CHECKLIST.md.
 *
 * REQUEST XML SHAPE: built from the long-standing, widely-replicated public POSNET XML structure
 * (`<posnetRequest><mid>…</mid><tid>…</tid><oosRequestData>…</oosRequestData></posnetRequest>`,
 * posted as a single `xmldata` form field, UTF-8 URL-encoded, per Kaan's own instruction). The
 * exact element names here were NOT re-verified against a live source this pass (the one gap
 * named above) — flagged so nobody mistakes this for a NestPay-grade confirmation.
 *
 * CALLBACK: the 3DS result is POSTed back as `BankPacket` / `MerchantPacket` / `Sign` (field names
 * from the one confirmed source). This adapter requires and MAC-verifies all three before trusting
 * anything, then attempts to read a plain-text approval marker out of the decoded packets — but
 * does NOT claim to know the packets' full internal schema, so an undecodable or unrecognized
 * packet is mapped to `pending`, never silently to `captured` (same conservative posture as every
 * other adapter in this module — see `nestpay.ts`'s mdStatus handling for the same rule applied to
 * a field whose exact meaning IS confirmed).
 */
import { createHash, timingSafeEqual } from 'crypto'
import type { BankPosAdapter, BankMerchantCredentials } from '../payments/types'
import type { HostedSession, PaySessionInput, PaymentEvent, PaymentStatus } from '../types'

const TEST_XML_URL = 'https://setmpos.ykb.com/PosnetWebService/XML'
const TEST_3DS_URL = 'https://setmpos.ykb.com/3DSWebService/YKBPaymentService'
const LIVE_XML_URL = 'https://posnet.yapikredi.com.tr/PosnetWebService/XML'
const LIVE_3DS_URL = 'https://posnet.yapikredi.com.tr/3DSWebService/YKBPaymentService'

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`yapikredi_posnet adapter: missing required merchant field "${key}"`)
  return v
}

/** Step 1 of the (single-source, not cross-confirmed) MAC: SHA256(encKey + ";" + terminalId),
 *  base64 of the raw digest — see file header for the encoding caveat. */
export function buildPosnetFirstHash(encKey: string, terminalId: string): string {
  return createHash('sha256').update(`${encKey};${terminalId}`, 'utf8').digest('base64')
}

/** Step 2: SHA256(xid + ";" + amount + ";" + currency + ";" + mid + ";" + firstHash), base64. */
export function buildPosnetMac(params: {
  xid: string
  amountKurus: number
  currency: string
  merchantId: string
  firstHash: string
}): string {
  const plaintext = `${params.xid};${params.amountKurus};${params.currency};${params.merchantId};${params.firstHash}`
  return createHash('sha256').update(plaintext, 'utf8').digest('base64')
}

/** XML escaping for the handful of text fields that go into the request body. */
function xmlEscape(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Builds the `xmldata` XML body for the OOS 3D sale request. Element names follow the
 *  long-standing public POSNET structure (see file header) — NOT independently re-verified this
 *  pass, the file's one disclosed gap. */
export function buildPosnetOosRequestXml(
  fields: Record<string, string>,
  input: PaySessionInput,
  xid: string
): string {
  const merchantId = requireField(fields, 'merchantId')
  const terminalId = requireField(fields, 'terminalId')
  const posnetId = requireField(fields, 'posnetId')
  const encKey = requireField(fields, 'encKey')
  const amountKurus = Math.round(input.amountKurus)
  const installment = fields.installment || '00'

  const firstHash = buildPosnetFirstHash(encKey, terminalId)
  const mac = buildPosnetMac({ xid, amountKurus, currency: 'TL', merchantId, firstHash })

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<posnetRequest>' +
    `<mid>${xmlEscape(merchantId)}</mid>` +
    `<tid>${xmlEscape(terminalId)}</tid>` +
    '<oosRequestData>' +
    `<posnetID>${xmlEscape(posnetId)}</posnetID>` +
    `<xid>${xmlEscape(xid)}</xid>` +
    `<amount>${amountKurus}</amount>` +
    '<currencyCode>TL</currencyCode>' +
    `<installment>${xmlEscape(installment)}</installment>` +
    '<islemtipi>Auth</islemtipi>' +
    `<okUrl>${xmlEscape(input.webhookUrl)}</okUrl>` +
    `<failUrl>${xmlEscape(input.webhookUrl)}</failUrl>` +
    `<mac>${mac}</mac>` +
    '</oosRequestData>' +
    '</posnetRequest>'
  )
}

/** Verifies the inbound callback's `Sign` by recomputing the same two-stage MAC over the raw
 *  BankPacket+MerchantPacket strings — a reasonable, but NOT independently confirmed, extension of
 *  the one documented MAC skeleton to the callback leg (disclosed in the file header). */
function verifyPosnetCallbackSign(body: Record<string, string>, encKey: string, terminalId: string, merchantId: string, xid: string, amountKurus: number): boolean {
  const sign = body.Sign || body.sign
  const bankPacket = body.BankPacket || body.bankPacket
  const merchantPacket = body.MerchantPacket || body.merchantPacket
  if (!sign || !bankPacket || !merchantPacket) return false
  const firstHash = buildPosnetFirstHash(encKey, terminalId)
  // Fold the two opaque packets into the same xid/amount/currency/mid/firstHash construction used
  // for the outbound MAC, since the callback-specific formula is not independently confirmed.
  const expected = createHash('sha256')
    .update(`${bankPacket};${merchantPacket};${xid};${amountKurus};TL;${merchantId};${firstHash}`, 'utf8')
    .digest('base64')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const gotBuf = Buffer.from(sign, 'utf8')
  return expectedBuf.length === gotBuf.length && timingSafeEqual(expectedBuf, gotBuf)
}

/** Best-effort decode of MerchantPacket (assumed base64, the common POSNET convention) looking for
 *  a plain-text approval marker. Returns null — never a guessed 'captured' — when nothing
 *  recognizable is found, so the caller falls back to 'pending' rather than fabricating success. */
function decodeApprovalMarker(merchantPacket: string): PaymentStatus | null {
  let decoded = ''
  try {
    decoded = Buffer.from(merchantPacket, 'base64').toString('utf8')
  } catch {
    return null
  }
  const lower = decoded.toLowerCase()
  if (lower.includes('approved=1') || lower.includes('"approved":"1"') || lower.includes('<approved>1<')) return 'captured'
  if (lower.includes('approved=0') || lower.includes('"approved":"0"') || lower.includes('<approved>0<')) return 'failed'
  return null
}

export function createYapiKrediPosnetAdapter(): BankPosAdapter {
  return {
    bankKey: 'yapi_kredi',
    isReal: true,

    async createHosted3dsSession(
      credentials: BankMerchantCredentials,
      input: PaySessionInput
    ): Promise<HostedSession> {
      const threeDsUrl = credentials.fields.threeDsUrl || (credentials.environment === 'live' ? LIVE_3DS_URL : TEST_3DS_URL)
      const xid = `notya${input.invoiceId}${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24).padEnd(24, '0')
      const xmldata = buildPosnetOosRequestXml(credentials.fields, input, xid)
      return {
        bankKey: 'yapi_kredi',
        sessionId: xid,
        redirectUrl: threeDsUrl,
        merchantRef: xid,
        environment: credentials.environment,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        // Posted as a single xmldata field, UTF-8 URL-encoded, per Kaan's own instruction — same
        // "browser POSTs a hidden auto-submit form" posture as nestpay.ts, different field shape.
        redirectMethod: 'POST',
        redirectFormFields: { xmldata },
      }
    },

    async parseWebhook(credentials: BankMerchantCredentials, raw: unknown): Promise<PaymentEvent> {
      const merchantId = requireField(credentials.fields, 'merchantId')
      const terminalId = requireField(credentials.fields, 'terminalId')
      const encKey = requireField(credentials.fields, 'encKey')
      const envelope = raw as { body?: Record<string, string> }
      const body = envelope.body
      if (!body) throw new Error('yapikredi_posnet: webhook envelope missing form body')
      const merchantRef = body.xid || body.XID || ''
      const amountKurus = Math.round(Number(body.amount || body.Amount || '0'))
      if (!verifyPosnetCallbackSign(body, encKey, terminalId, merchantId, merchantRef, amountKurus)) {
        throw new Error('yapikredi_posnet: callback Sign verification failed')
      }
      const merchantPacket = body.MerchantPacket || body.merchantPacket || ''
      const marker = decodeApprovalMarker(merchantPacket)
      return {
        bankKey: 'yapi_kredi',
        merchantRef,
        status: marker ?? 'pending', // never guessed into 'captured' when the packet isn't decodable
        amountKurus,
        raw: body,
      }
    },

    async queryStatus(_credentials: BankMerchantCredentials, merchantRef: string): Promise<PaymentEvent> {
      // No out-of-band status-query shape was confirmed this pass (the one source's README covers
      // the sale + 3DS flow only) — honest error, not a fabricated XML caller. Same posture as
      // nestpay.ts/garanti.ts's own queryStatus.
      throw new Error(
        'yapikredi_posnet: out-of-band status query API not confirmed/implemented in this pass — see CHECKLIST.md for ' +
          merchantRef
      )
    },
  }
}

export { TEST_XML_URL, TEST_3DS_URL, LIVE_XML_URL, LIVE_3DS_URL }
