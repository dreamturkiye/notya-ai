/**
 * NOTYA-ACCOUNTING-01 — AR aging bucket computation.
 *
 * Pure function over a list of open receivables (invoices with an unpaid balance), bucketed by
 * days-since-issued relative to a reference "as of" date. Kept separate from any DB access so
 * it can be unit-tested without Supabase, and reused by both the nightly aging job and the
 * on-demand reporting API route (lib/accounting/reports/*).
 */
import type { Money } from '../types'
import { addKurus } from '../ledger/money'

export interface OpenReceivable {
  invoiceId: string
  issuedAt: string // ISO date the invoice was issued (not created)
  openBalanceKurus: Money // total - paid, > 0
}

export type AgingBucketLabel = '0-30' | '31-60' | '61-90' | '90+'

export interface AgingReport {
  asOf: string
  buckets: Record<AgingBucketLabel, { invoiceIds: string[]; totalKurus: Money }>
  totalOpenKurus: Money
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) {
    throw new TypeError(`invalid date in aging computation: "${fromIso}" / "${toIso}"`)
  }
  return Math.floor((to - from) / (1000 * 60 * 60 * 24))
}

export function bucketFor(ageDays: number): AgingBucketLabel {
  if (ageDays < 0) return '0-30' // not-yet-due / clock skew — don't crash, just park it in the youngest bucket
  if (ageDays <= 30) return '0-30'
  if (ageDays <= 60) return '31-60'
  if (ageDays <= 90) return '61-90'
  return '90+'
}

export function computeAgingReport(receivables: OpenReceivable[], asOf: string = new Date().toISOString()): AgingReport {
  const buckets: AgingReport['buckets'] = {
    '0-30': { invoiceIds: [], totalKurus: 0 },
    '31-60': { invoiceIds: [], totalKurus: 0 },
    '61-90': { invoiceIds: [], totalKurus: 0 },
    '90+': { invoiceIds: [], totalKurus: 0 },
  }

  for (const r of receivables) {
    if (r.openBalanceKurus <= 0) continue // fully paid / credited — not a receivable
    const label = bucketFor(daysBetween(r.issuedAt, asOf))
    buckets[label].invoiceIds.push(r.invoiceId)
    buckets[label].totalKurus = addKurus(buckets[label].totalKurus, r.openBalanceKurus)
  }

  const totalOpenKurus = addKurus(...Object.values(buckets).map((b) => b.totalKurus))
  return { asOf, buckets, totalOpenKurus }
}
