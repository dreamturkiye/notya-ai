/**
 * NOTYA-ACCOUNTING-01 — honest stub factory for the 10 named-bank adapters.
 *
 * Every method throws `AdapterNotImplementedError` instead of returning a fabricated
 * request/response shape. See CHECKLIST.md in this directory for exactly what each bank needs
 * before its stub can be replaced with a real implementation (same shape as generic_hosted.ts).
 */
import { AdapterNotImplementedError, type BankKey } from '../types'
import type { BankPosAdapter } from '../payments/types'

export function createStubBankAdapter(bankKey: BankKey): BankPosAdapter {
  const fail = () => {
    throw new AdapterNotImplementedError(`banks/${bankKey}`, 'lib/accounting/banks/CHECKLIST.md')
  }
  return {
    bankKey,
    isReal: false,
    async createHosted3dsSession() {
      return fail()
    },
    async parseWebhook() {
      return fail()
    },
    async queryStatus() {
      return fail()
    },
  }
}
