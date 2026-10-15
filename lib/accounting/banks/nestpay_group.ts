/**
 * NOTYA-ACCOUNTING-01 — shared stub for the six banks that sit behind the NestPay/ASSEMIST
 * (Payten) gateway: İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat, Akbank (Kaan, 2026-10-15
 * hybrid-model instruction: "one adapter covers... via that shared gateway").
 *
 * Still a STUB, not a real adapter — same honesty rule as before, applied to this group:
 *
 * What was checked (2026-10-15, WebSearch/WebFetch): no official, bank- or Asseco-published
 * developer documentation of the NestPay "3D Pay Hosting" protocol was found publicly. What
 * exists publicly is third-party reverse-engineered client libraries (node-nestpay, omnipay/
 * nestpay forks, WiseCP's integration notes) whose own sample code passes card `number`/`cvv`/
 * `year`/`month` as arguments into the same `secure3d`-style call used for the "hosting" mode —
 * which is either (a) evidence the merchant server still handles the PAN in practice, or (b) just
 * an artifact of a generic library wrapping multiple storetypes under one function signature.
 * Neither public source resolves that ambiguity either way. One potentially authoritative source
 * (QNB's own vpos.qnb.com.tr/Help/apiIntegrationDocument) could not be fetched in this research
 * pass — the fetch was blocked by a tool-level provenance/permission timeout, not refused on
 * content grounds, so it is an open lead for a human with direct browser access, not a dead end.
 *
 * Given that the two confirmed, citable Turkish-bank integration docs found in this whole project
 * (Garanti, VakıfBank — see CHECKLIST.md) both turned out to require the merchant to submit the
 * raw PAN before any 3DS step, treating NestPay's "Hosting" naming as proof of SAQ-A safety
 * without a citable source would repeat exactly the mistake this module's honesty rule exists to
 * prevent. So: stub, not BEST_EFFORT_UNVERIFIED-with-fabricated-shapes — this file documents the
 * blocked/ambiguous finding instead of guessing a request/response shape.
 *
 * All six bank keys share this ONE factory so that if/when the real protocol is confirmed (e.g.
 * once a doctor actually opens a NestPay-backed merchant account and can pull the merchant-only
 * integration PDF), only this one file needs to become real — see CHECKLIST.md.
 */
import { AdapterNotImplementedError, type BankKey } from '../types'
import type { BankPosAdapter } from '../payments/types'

export function createNestpayGroupStubAdapter(bankKey: BankKey): BankPosAdapter {
  const fail = () => {
    throw new AdapterNotImplementedError(`banks/${bankKey} (NestPay/EST group)`, 'lib/accounting/banks/CHECKLIST.md')
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
