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
}

export interface HostedSession {
  bankKey: string
  sessionId: string
  redirectUrl: string
  merchantRef: string
  environment: 'test' | 'live'
  expiresAt: string
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

export class AdapterNotImplementedError extends Error {
  constructor(public readonly adapterKey: string, public readonly checklistPath: string) {
    super(
      `${adapterKey} adapter not implemented — no verified API docs/credentials were available. ` +
        `See ${checklistPath} for exactly what's needed to finish it.`
    )
    this.name = 'AdapterNotImplementedError'
  }
}
