/**
 * NOTYA-ACCOUNTING-01 — bank adapter registry.
 *
 * All 11 banks from docs/ARCH-NOTYA-ACCOUNTING.md §2.6 are registered against the same
 * `BankPosAdapter` interface. `generic_hosted` is additionally registered as a 12th, selectable
 * entry so a practice can go live on the real generic pattern today while real-bank adapters are
 * finished one at a time (see CHECKLIST.md). `adapter.isReal` tells API routes/UI whether to show
 * a bank as usable or as "coming soon — see checklist".
 */
import type { BankKey } from '../types'
import type { BankPosAdapter } from '../payments/types'
import { ALL_BANK_KEYS, NESTPAY_GROUP_BANK_KEYS } from '../types'
import { createGenericHostedAdapter } from './generic_hosted'
import { createStubBankAdapter } from './stub'
import { createNestpayAdapter } from './nestpay'
import { createGarantiAdapter } from './garanti'
import { createYapiKrediPosnetAdapter } from './yapikredi_posnet'

const registry = new Map<BankKey, BankPosAdapter>()
registry.set('generic_hosted', createGenericHostedAdapter())
for (const key of ALL_BANK_KEYS) {
  registry.set(key, createStubBankAdapter(key))
}
// Hybrid model (Kaan, 2026-10-15): İş Bankası/Halkbank/TEB/QNB/Ziraat/Akbank share ONE real
// NestPay "3D Pay Hosting" adapter (lib/accounting/banks/nestpay.ts) instead of six independent
// stubs — see CHECKLIST.md "NestPay/EST group" for sources/status (VERIFIED by protocol
// cross-reference, 2026-10-15 second pass).
for (const key of NESTPAY_GROUP_BANK_KEYS) {
  registry.set(key, createNestpayAdapter(key))
}
// Phase 2 of the hybrid model (Kaan, 2026-10-15): Garanti BBVA (Common Payment Page/OOS, REAL —
// direct vendor docs) and Yapı Kredi (POSNET OOS, REAL — single-source OSS cross-reference) —
// see CHECKLIST.md for the per-bank confidence tier and sources.
registry.set('garanti', createGarantiAdapter())
registry.set('yapi_kredi', createYapiKrediPosnetAdapter())

export function getBankAdapter(bankKey: BankKey): BankPosAdapter {
  const adapter = registry.get(bankKey)
  if (!adapter) throw new Error(`Unknown bank key "${bankKey}"`)
  return adapter
}

export function listBankAdapters(): BankPosAdapter[] {
  return Array.from(registry.values())
}
