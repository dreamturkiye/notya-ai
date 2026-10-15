/**
 * NOTYA-ACCOUNTING-01 — shared types for the Notya Accounting (Faturalama & Tahsilat) module.
 *
 * Money rule (non-negotiable, see docs/ARCH-NOTYA-ACCOUNTING.md §5): every amount is an
 * **integer** number of kuruş (TRY × 100). Never a float. `Money` exists purely as a type alias
 * so call sites read as money, but at runtime it is just a `number` (safe-integer checked by
 * lib/accounting/ledger/money.ts helpers, which are the only place that does arithmetic on it).
 *
 * Country-agnostic core: nothing in this file is Turkey-specific except the literal union values
 * for `EbelgeDocType` / `DocumentIssuer` naming (e-SMM/e-Fatura/e-Arşiv are TR GİB document
 * types). A second country's adapter would add its own doc-type union and tax-rate codes without
 * touching the ledger/invoice/RBAC shapes below — see docs/ARCH-NOTYA-ACCOUNTING.md §7.
 */

/** Integer kuruş (TRY × 100). Never a float. */
export type Money = number

/**
 * NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15 audit §4.6.1) — the single source of truth for the
 * reduced KDV rate this module defaults new services/settings to. Traced (as of this audit) to the
 * 7346 sayılı Cumhurbaşkanı Kararı KDV rate structure for health/medical services — see
 * docs/ARCH-NOTYA-ACCOUNTING.md §4.6.1 for sources and confidence level (MODERATE, not
 * independently re-verified against a live GİB rate table). Every other "1000" literal in this
 * module (migration column default, `catalog/service.ts`) must be read as THIS rate; if the rate
 * ever changes, update here AND the `default_kdv_rate_bp` column default in
 * `lib/db/migrations/151_accounting_core.sql` (a new migration — the old column default cannot be
 * changed retroactively for already-created rows, which is correct: an already-issued invoice's
 * stored rate must never silently change). This constant does not reach out to a live government
 * rate table; nothing in this module does — see §4.6.1 for why that is a named operational risk.
 */
export const KDV_RATE_BP_HEALTH_DEFAULT = 1000 // 1000 bp = 10.00%

export type AccountingRole = 'doktor' | 'sekreter'

/** Who is acting, resolved the same way every other Notya route resolves it (pratikOturum). */
export interface ActingUser {
  userId: string
  doktorId: string
  role: AccountingRole
  personelId?: string
}

// ---------------------------------------------------------------------------
// Catalog (open-ended muayene / aşı / hizmet / paket definitions — CEO requirement)
// ---------------------------------------------------------------------------

export type ServiceKind = 'muayene' | 'asi' | 'hizmet' | 'paket'

export interface AccountingService {
  id: string
  doctorId: string
  kind: ServiceKind
  name: string
  description: string | null
  priceKurus: Money
  kdvRateBp: number // basis points, e.g. 1000 = 10.00%
  active: boolean
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Invoice lifecycle
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | 'draft'
  | 'pending_issue'
  | 'issued'
  | 'issue_failed'
  | 'partially_paid'
  | 'paid'
  | 'cancel_pending'
  | 'cancelled'
  | 'credit_pending'
  | 'credited'

export type EbelgeDocType = 'esmm' | 'efatura' | 'earsiv'

export interface InvoiceLine {
  id: string
  invoiceId: string
  serviceId: string | null
  description: string
  quantity: number
  unitPriceKurus: Money
  discountKurus: Money
  kdvRateBp: number
  kdvKurus: Money
  lineTotalKurus: Money
}

export interface DiscountInput {
  scope: 'line' | 'invoice'
  lineId?: string
  type: 'percent' | 'fixed'
  value: number // percent: 0-100 (two-decimal bp handled internally); fixed: kuruş
  reason: string
}

export interface Invoice {
  id: string
  doctorId: string
  patientId: string | null
  status: InvoiceStatus
  docType: EbelgeDocType
  subtotalKurus: Money
  discountKurus: Money
  kdvKurus: Money
  totalKurus: Money
  paidKurus: Money
  portalVisible: boolean
  ebelgeVendor: string | null
  ebelgeEnvironment: 'test' | 'live' | null
  ebelgeUuid: string | null
  ebelgeDocNumber: string | null
  ebelgePdfUrl: string | null
  ebelgeLastError: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  issuedAt: string | null
  cancelledAt: string | null
}

// ---------------------------------------------------------------------------
// Payments (bank POS orchestration)
// ---------------------------------------------------------------------------

export type PaymentMethod = 'card_3ds' | 'nakit' | 'havale_eft'
export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded' | 'cancelled'

export interface PaySessionInput {
  invoiceId: string
  amountKurus: Money
  currency: 'TRY'
  returnUrl: string
  webhookUrl: string
  buyerName?: string
  buyerEmail?: string
  /**
   * Facilitator-only buyer fields (iyzico's Checkout Form `buyer` object requires all of these —
   * see lib/accounting/facilitators/iyzico.ts). Bank adapters ignore them entirely.
   *
   * KNOWN GAP (docs/OPEN-COMMITMENTS.md ACCOUNTING-11, unchanged by this hybrid-model pass):
   * the invoice engine does not yet resolve a patient's real TCKN/address onto these fields —
   * callers currently pass conservative placeholders. Finishing ACCOUNTING-11 (a KVKK-aware
   * decision on how much patient PII an outside facilitator/e-belge vendor may see) is what
   * replaces the placeholders with real patient data; it does not change this adapter's protocol.
   */
  buyer?: {
    id: string
    surname: string
    identityNumber: string
    gsmNumber?: string
    registrationAddress: string
    city: string
    country: string
    ip?: string
  }
}

export interface HostedSession {
  bankKey: string
  sessionId: string
  redirectUrl: string
  merchantRef: string
  environment: 'test' | 'live'
  expiresAt: string
  /**
   * Some gateways (NestPay/EST "3D Pay Hosting" — see lib/accounting/banks/nestpay.ts) deliver
   * their session as a set of form fields the BROWSER must POST to `redirectUrl`, not a
   * server-created session the browser can simply navigate to with a GET. When set, the UI must
   * render a hidden auto-submitting form instead of `window.location.href = redirectUrl`.
   * Omitted (undefined) means the classic GET-navigation redirect every other adapter uses.
   */
  redirectMethod?: 'GET' | 'POST'
  redirectFormFields?: Record<string, string>
}

export interface PaymentEvent {
  bankKey: string
  merchantRef: string
  status: PaymentStatus
  amountKurus: Money
  authCode?: string
  last4?: string
  brand?: string
  raw: unknown
}

// ---------------------------------------------------------------------------
// AR / aging
// ---------------------------------------------------------------------------

export type ArMovementType = 'charge' | 'payment' | 'credit' | 'writeoff'

export interface ArLedgerEntry {
  id: string
  doctorId: string
  patientId: string | null
  invoiceId: string | null
  movementType: ArMovementType
  amountKurus: Money
  balanceKurus: Money
  createdAt: string
}

export interface AgingBucket {
  label: '0-30' | '31-60' | '61-90' | '90+'
  invoiceIds: string[]
  totalKurus: Money
}

// ---------------------------------------------------------------------------
// Credentials (e-belge + bank merchants) — encrypted at rest, never logged
// ---------------------------------------------------------------------------

export type EbelgeVendor = 'generic_rest' | 'nes' | 'qnb_esolutions' | 'logo' | 'other'
export type BankKey =
  | 'generic_hosted'
  | 'yapi_kredi'
  | 'isbank'
  | 'garanti'
  | 'akbank'
  | 'qnb'
  | 'ziraat'
  | 'vakifbank'
  | 'halkbank'
  | 'denizbank'
  | 'teb'
  | 'kuveyt_turk'

export const ALL_BANK_KEYS: BankKey[] = [
  'yapi_kredi',
  'isbank',
  'garanti',
  'akbank',
  'qnb',
  'ziraat',
  'vakifbank',
  'halkbank',
  'denizbank',
  'teb',
  'kuveyt_turk',
]

/**
 * Direct-bank keys that share the NestPay/ASSEMIST (Payten/Asseco) gateway infrastructure, per
 * Kaan's 2026-10-15 hybrid-model instruction ("one adapter covers İş Bankası, Halkbank, TEB, QNB
 * Finansbank, Ziraat NestPay, Akbank NestPay"). They stay in `ALL_BANK_KEYS`/`BankKey` unchanged —
 * a doctor still picks their own bank by name — but all six are registered against ONE real
 * adapter (lib/accounting/banks/nestpay.ts, "3D Pay Hosting" mode) instead of six separate ones.
 * See lib/accounting/banks/CHECKLIST.md "NestPay/EST group" section for sources and status.
 */
export const NESTPAY_GROUP_BANK_KEYS: BankKey[] = ['isbank', 'halkbank', 'teb', 'qnb', 'ziraat', 'akbank']

/**
 * Payment facilitator keys (docs/ARCH-NOTYA-ACCOUNTING.md §2.6a — hybrid model). A facilitator
 * sits in front of many banks under one merchant agreement and, unlike the 11 direct banks, has
 * genuinely public hosted-checkout API docs (see lib/accounting/facilitators/iyzico.ts). This is
 * the default/recommended path in the UI; direct bank adapters are a parallel, not sequential,
 * path (Kaan, 2026-10-15: "Adding more direct-bank adapters later should never require touching
 * the facilitator code path or vice versa").
 */
export type FacilitatorKey = 'iyzico'
export const ALL_FACILITATOR_KEYS: FacilitatorKey[] = ['iyzico']

export class AdapterNotImplementedError extends Error {
  constructor(public readonly adapterKey: string, public readonly checklistPath: string) {
    super(
      `${adapterKey} adapter not implemented — no verified API docs/credentials were available. ` +
        `See ${checklistPath} for exactly what's needed to finish it.`
    )
    this.name = 'AdapterNotImplementedError'
  }
}
