/**
 * NOTYA-ACCOUNTING-01 — VakıfBank Sanal POS adapter. Status: **HONEST STUB — real official
 * documentation exists, but it is PAN-touching; no genuinely hosted/SAQ-A-safe product was found**.
 * Implements `BankPosAdapter` with `isReal: false`, throwing `AdapterNotImplementedError` instead
 * of a fabricated request/response shape — same posture as every other stub in this module.
 *
 * WHY THIS IS A STUB, NOT A SILENT GAP (researched directly this pass, 2026-10-15, re-verifying
 * and extending the earlier "2026-10-15 research update" finding in CHECKLIST.md, which this pass
 * confirms still holds — not an assumption carried over unchecked):
 *
 * 1. VakıfBank publishes a real, versioned, OFFICIAL PDF integration guide, fetched directly this
 *    pass:
 *    https://vbassets.vakifbank.com.tr/ticari/pos-uye-is-yeri-hizmetleri/vakifbank-sanal-pos-entegrasyon-dokumani-2.4-versiyon.pdf
 *    (v2.4, 2023-10-06). It is genuinely detailed and genuinely official — not a gap in
 *    documentation. But it describes NO hosted/redirect checkout product anywhere in it. Every
 *    flow it documents (POX `Vposreq.aspx`, the `TransactionServices.asmx` web service, "GET 7/24
 *    MPI" 3-D Secure enrollment via `MPI_Enrollment.aspx`, "Half Secure"/"Non Secure", "PanCode ile
 *    Ödeme", Visa Token Service) has the MERCHANT SITE collecting the card number, expiry date and
 *    CVV2 and submitting them to VakıfBank's service — the document's own words: the card data
 *    "Alışveriş sitesi kullanıcılarının girdikleri" (entered by the shopping site's own users) is
 *    passed to the Sanal POS application. The only redirect in the whole document is the 3-D
 *    Secure ACS step (entering the OTP/password), never card entry. This is the PAN-touching
 *    MPI-enrollment pattern (PCI SAQ A-EP/D), explicitly the thing Kaan's own instruction said to
 *    check for and, if still the only path, refuse to build as a fake "hosted" adapter.
 * 2. Specifically searched for "Ortak Ödeme Sayfası" / "Güvenli Ortak Ödeme" (the product name
 *    Kaan's instruction named) on vakifbank.com.tr and in the PDF above — not found anywhere.
 *    VakıfBank's own official open-banking developer portal (apiportal.vakifbank.com.tr) was also
 *    checked directly: it is a general account/payments-transfer open-banking API catalog
 *    (transactions, EFT, loans) with no virtual-POS/card-acceptance product in it at all.
 * 3. Checked whether a genuinely different, card-free hosted product exists under a different
 *    name, the same way the Garanti pass found a real "Common Payment Page" that an earlier pass
 *    had missed. Two signals were found, neither confirmed:
 *    - The open-source library `mews/pos` (Packagist-mirrored README) lists TWO separate VakıfBank
 *      gateway entries: `vakifbank` (Standart API — `merchant_id`/`terminal_id`/`password`, i.e.
 *      the same MPI-enrollment shape as the official PDF) and a second, distinct `vakifbankpay`
 *      entry (driver `VakifBankPay` — `merchant_id`/`username`/`password`, order fields
 *      `customerId`/`return_url`/`order_list`). This second product's existence IS real (it's a
 *      separate, named gateway in a real library), but nothing fetchable this pass (its own
 *      README excerpt, WisecP's and an Odoo marketplace module's descriptions of VakıfBank
 *      modules) stated plainly whether `vakifbankpay` is genuinely card-free — the Odoo module
 *      names "PayFlex VPOS 3D Host API" and says transactions "run through the bank's 3D Secure
 *      flow," which is suggestive of a hosted mode (same `3d_pay_hosting`/`3DHost` vocabulary
 *      already confirmed structurally card-free for NestPay/Asseco in `nestpay.ts`), but a
 *      WisecP-published VakıfBank module page explicitly describes an ON-SITE form ("WISECP uses
 *      the payment form and performs payment transactions without leaving the site (Except 3D
 *      Confirmation)") — i.e. the merchant's own site collects the card, contradicting a
 *      card-free read of "3D Host" for this specific bank's real-world usage.
 *    - This session's fetch tooling refused every raw GitHub source URL for `mews/pos`'s actual
 *      `VakifBankPosPay.php` driver (provenance-restricted, the same tooling limitation already
 *      disclosed for Yapı Kredi in CHECKLIST.md) — the one read that would have settled this
 *      structurally, the way two libraries' source code settled NestPay's hosting mode, could not
 *      be done this pass.
 * 4. Conclusion: one real official product (MPI enrollment) is confirmed PAN-touching; one
 *    possibly-separate product (`vakifbankpay`/"PayFlex VPOS 3D Host") is real-but-unconfirmed and
 *    the one third-party description with enough detail to judge (WisecP) describes it as
 *    on-site, not hosted. That is not "no documentation" (VakıfBank's PDF is real and detailed) —
 *    it is "the documented product is the wrong PCI shape, and the one candidate for a right-shaped
 *    product is not confirmed card-free." Building this adapter against either would mean either
 *    (a) knowingly violating the hosted/SAQ-A-only rule, or (b) guessing a request shape for
 *    `vakifbankpay` that was never independently confirmed — both of which this module's honesty
 *    rule exists to prevent. A human opening a real VakıfBank merchant account (or getting a
 *    working GitHub-source-reading session) is what actually resolves this, not more web search.
 *
 * WHAT WOULD UNSTUB THIS: either (a) VakıfBank/a merchant-account rep confirms the `vakifbankpay`/
 * "PayFlex VPOS 3D Host" product is genuinely card-free hosted checkout and gives its real request/
 * callback field shape, or (b) a session that can read `github.com/mewebstudio/pos`'s
 * `VakifBankPosPay.php` source directly confirms it structurally (the same bar NestPay met).
 */
import { AdapterNotImplementedError } from '../types'
import type { BankPosAdapter } from '../payments/types'

export function createVakifBankAdapter(): BankPosAdapter {
  const fail = () => {
    throw new AdapterNotImplementedError('banks/vakifbank', 'lib/accounting/banks/CHECKLIST.md')
  }
  return {
    bankKey: 'vakifbank',
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
