/**
 * NOTYA-ACCOUNTING-01 — Denizbank InterPOS adapter. Status: **HONEST STUB — real OSS evidence of
 * a "3D Host" model NAME exists, but no source confirms it is structurally card-free, and every
 * concrete implementation detail this pass could actually read shows a merchant-collected-card
 * flow instead**. Implements `BankPosAdapter` with `isReal: false`, throwing
 * `AdapterNotImplementedError` instead of a fabricated request/response shape.
 *
 * WHY THIS IS A STUB (researched directly this pass, 2026-10-15):
 *
 * 1. No official Denizbank developer portal or published API/integration PDF was found publicly
 *    for sanal POS (unlike VakıfBank, which does have one). `denizbank.com.tr`'s only public
 *    technical portal, `apiportal.denizbank.com`, is open-banking/BaaS (account transactions,
 *    EFT, loans, factoring) — confirmed directly this pass, no virtual-POS/card-acceptance product
 *    in it at all.
 * 2. Multiple independent cross-reference sources (`mews/pos` and `ankapix/sanalpos-entegrasyonlari`,
 *    the two libraries Kaan's instruction named) DO list "InterPOS"/"InterVPos" as Denizbank's own
 *    named gateway, distinct from the shared NestPay/Asseco `EstPos`/`AssecoPos` driver used by
 *    İş Bankası/Halkbank/TEB/QNB/Ziraat/Akbank in `nestpay.ts` — and `ankapix`'s own README feature
 *    table lists InterPOS's payment models as "NonSecure, 3DSecure, 3DPay, 3DHost" (the same model
 *    vocabulary — including "3DHost" — that was structurally confirmed card-free for NestPay/Asseco
 *    by reading two libraries' actual request-builder source code). That is a real, named signal
 *    that a hosting-style model exists for this bank, not nothing.
 * 3. BUT: this pass could not get the one thing that would turn that name into a confirmation —
 *    reading `InterPos.php`'s actual request-builder source the way `nestpay.ts` did for
 *    `AssecoPos.php`. Every raw GitHub/GitLab URL for `mews/pos`'s `InterPos.php` (direct, via
 *    jsdelivr's GitHub mirror, and via Sourcegraph) was refused by this session's fetch tool with
 *    a provenance error — the identical tooling limitation already disclosed for Yapı Kredi in
 *    CHECKLIST.md, not a content refusal.
 * 4. What COULD be read this pass, from several independent sources, consistently shows Denizbank
 *    flows that collect the card on the merchant side, not a card-free hosted page:
 *    - `CP.VPOS` (.NET library, cross-referenced per Kaan's instruction): Denizbank's own
 *      `SaleInfo` request object takes `cardNumber`/`cardCVV`/expiry fields directly — the
 *      merchant's code passes PAN/CVV to the library, which then POSTs to the bank and gets back
 *      either `RedirectURL` or `RedirectHTML` for the (OTP-only) 3-D Secure step. Its Denizbank
 *      credential field names (`merchantID`=Mağaza Kodu, `merchantUser`=Api Kullanıcısı Adı,
 *      `merchantPassword`=Api Kullanıcısı Şifre, `merchantStorekey`=3D Storekey) match Kaan's own
 *      listed fields (Shop Code/Merchant ID, API user, 3D key) closely — a real, useful
 *      corroboration of credential *names*, just not of a hosted *flow*.
 *    - `omerkamcili/denizbank` (PHP library): its own usage example passes the raw card number,
 *      CVV and expiry straight into `getPaid()`.
 *    - `evrenonur/sanalpos` (PHP library): explicitly groups Denizbank under the SAME field
 *      mapping as its NestPay-family banks ("alan eşlemesi aynıdır: Mağaza Kodu, Api Kullanıcısı,
 *      Api Şifresi, 3D Storekey") and lists only Satış/Satış 3D/İptal/İade (sale/3D-sale/cancel/
 *      refund) — no hosted/card-free column.
 *    - Two further, independent signals (an Odoo marketplace module's own description, and the
 *      npm `node-nestpay` library's bank list) both describe/treat Denizbank as running on the
 *      NestPay(Asseco EST) gateway family rather than a separate protocol — which, if true, would
 *      actually make `nestpay.ts` the right adapter for this bank once a merchant's real gateway
 *      URL confirms it runs that infrastructure; but that conflicts with `mews/pos`/`ankapix`
 *      treating InterPos as its own distinct driver, so this is a genuine, disclosed inconsistency
 *      across sources, not resolved this pass either way.
 * 5. Conclusion: a "3DHost" model NAME is real (point 2), but zero sources this pass could
 *    actually read gave an endpoint, a request field shape, or a hash/MAC algorithm for it — the
 *    bar `yapikredi_posnet.ts` cleared for its own BEST-EFFORT tier (it at least had concrete
 *    endpoints and a MAC skeleton from one source). Denizbank has neither here. Writing those from
 *    general protocol familiarity rather than a source actually read this pass would be exactly
 *    the kind of fabrication this module's honesty rule forbids — a stub that says so plainly is
 *    the more honest, more useful state.
 *
 * WHAT WOULD UNSTUB THIS: a session able to read `mews/pos`'s `InterPos.php` (or
 * `ankapix/sanalpos-entegrasyonlari`'s InterPOS implementation) source directly, confirming
 * whether its `3d_pay_hosting`/`3DHost` request path ever includes a card field the same way
 * `AssecoPos.php` was confirmed not to — or a real Denizbank merchant account's own integration
 * packet, which would also settle whether this bank's actual gateway is InterPOS or the shared
 * NestPay/EST infrastructure (point 4's open inconsistency).
 */
import { AdapterNotImplementedError } from '../types'
import type { BankPosAdapter } from '../payments/types'

export function createDenizbankAdapter(): BankPosAdapter {
  const fail = () => {
    throw new AdapterNotImplementedError('banks/denizbank', 'lib/accounting/banks/CHECKLIST.md')
  }
  return {
    bankKey: 'denizbank',
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
