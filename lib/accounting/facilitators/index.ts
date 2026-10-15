/**
 * NOTYA-ACCOUNTING-01 — facilitator adapter registry (hybrid model). Parallel to
 * lib/accounting/banks/index.ts but deliberately a separate module/table/registry per Kaan's
 * instruction #3 — nothing here is imported by the bank path or vice versa.
 */
import type { FacilitatorKey } from '../types'
import type { PaymentFacilitatorAdapter } from '../payments/facilitatorTypes'
import { createIyzicoAdapter } from './iyzico'

const registry = new Map<FacilitatorKey, PaymentFacilitatorAdapter>()
registry.set('iyzico', createIyzicoAdapter())

export function getFacilitatorAdapter(key: FacilitatorKey): PaymentFacilitatorAdapter {
  const adapter = registry.get(key)
  if (!adapter) throw new Error(`Unknown facilitator key "${key}"`)
  return adapter
}

export function listFacilitatorAdapters(): PaymentFacilitatorAdapter[] {
  return Array.from(registry.values())
}
