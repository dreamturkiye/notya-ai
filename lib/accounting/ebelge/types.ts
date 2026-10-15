/**
 * NOTYA-ACCOUNTING-01 — e-belge adapter contract (docs/ARCH-NOTYA-ACCOUNTING.md §2.3.1).
 *
 * Notya is never the legal issuer: every document is submitted under the doctor's/clinic's own
 * tax identity (`sellerIdentity`), via the doctor's own integrator credentials. The adapter never
 * sees or sets a Notya-owned VKN/TCKN.
 */
import type { EbelgeDocType, EbelgeVendor, Money } from '../types'

export interface EbelgeCredentials {
  vendor: EbelgeVendor
  environment: 'test' | 'live'
  /** Vendor-shaped fields, decrypted from accounting_ebelge_credentials.secrets_enc just before use. */
  fields: Record<string, string>
}

export interface SellerIdentity {
  /** 'tckn' for an independent doctor (e-SMM), 'vkn' for a clinic/company. */
  idType: 'tckn' | 'vkn'
  idValue: string
  unvan: string
  address: string
  vergiDairesi?: string
}

export interface BuyerIdentity {
  idType: 'tckn' | 'vkn' | 'foreign' | 'unknown'
  idValue?: string
  name: string
  email?: string
  address?: string
}

export interface EbelgeLineDto {
  description: string
  quantity: number
  unitPriceKurus: Money
  kdvRateBp: number
  kdvKurus: Money
  lineTotalKurus: Money
}

export interface EbelgeInvoiceDto {
  invoiceId: string
  docType: EbelgeDocType
  seller: SellerIdentity
  buyer: BuyerIdentity
  lines: EbelgeLineDto[]
  subtotalKurus: Money
  kdvKurus: Money
  totalKurus: Money
  currency: 'TRY'
  issueDate: string
}

export interface EbelgeIssueResult {
  vendor: EbelgeVendor
  uuid: string
  documentNumber: string
  pdfUrl: string | null
  raw: unknown
}

export interface EbelgeCreditResult {
  vendor: EbelgeVendor
  creditUuid: string
  raw: unknown
}

export interface EbelgeAdapter {
  readonly vendor: EbelgeVendor
  readonly isReal: boolean
  testConnection(credentials: EbelgeCredentials): Promise<{ ok: boolean; detail?: string }>
  issue(credentials: EbelgeCredentials, invoice: EbelgeInvoiceDto): Promise<EbelgeIssueResult>
  /** Void/cancel an issued document when the vendor allows it before payment settles. */
  cancel(credentials: EbelgeCredentials, ebelgeUuid: string): Promise<{ ok: boolean; raw: unknown }>
  /** Credit note / iade for an already-issued document. */
  credit(credentials: EbelgeCredentials, ebelgeUuid: string, amountKurus: Money, reason: string): Promise<EbelgeCreditResult>
}
