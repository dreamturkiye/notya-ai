/**
 * NOTYA-ACCOUNTING-01 — honest stub factory for the named e-belge vendor adapters
 * (NES, QNB eSolutions, Logo). See CHECKLIST.md for what's needed to finish each.
 */
import { AdapterNotImplementedError, type EbelgeVendor } from '../types'
import type { EbelgeAdapter } from './types'

export function createStubEbelgeAdapter(vendor: EbelgeVendor): EbelgeAdapter {
  const fail = () => {
    throw new AdapterNotImplementedError(`ebelge/${vendor}`, 'lib/accounting/ebelge/CHECKLIST.md')
  }
  return {
    vendor,
    isReal: false,
    async testConnection() {
      return { ok: false, detail: `${vendor} adapter not implemented — see lib/accounting/ebelge/CHECKLIST.md` }
    },
    async issue() {
      return fail()
    },
    async cancel() {
      return fail()
    },
    async credit() {
      return fail()
    },
  }
}
