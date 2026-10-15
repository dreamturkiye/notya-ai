/**
 * NOTYA-ACCOUNTING-01 — Kuveyt Türk BOA "ThreeDModelPayGate" adapter. Status: **HONEST STUB — the
 * name suggests a hosted gateway, but TWO independent OSS implementations confirm it is actually a
 * merchant-collects-card flow**. Implements `BankPosAdapter` with `isReal: false`, throwing
 * `AdapterNotImplementedError` instead of a fabricated request/response shape.
 *
 * WHY THIS IS A STUB — THE EXACT CAUTION KAAN'S OWN INSTRUCTION NAMED, CONFIRMED NOT ASSUMED
 * (researched directly this pass, 2026-10-15):
 *
 * Kaan's instruction explicitly warned: "ThreeDModelPayGate" sounds like a hosted gateway by name,
 * but confirm from docs/OSS rather than assuming from the name. This pass found TWO independent,
 * concrete, fetchable open-source implementations that answer this directly and agree:
 *
 * - `emre-tarhan/kuveytturk-vpos-laravel-sdk` (Packagist README, fetched directly): documents BOTH
 *   BOA endpoints by name —
 *     `ThreeDModelPayGate` (card verification step): test
 *     `https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate`, live
 *     `https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate`;
 *     `ThreeDModelProvisionGate` (provisioning step, after the issuer's 3-D Secure OTP): test
 *     `https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate`,
 *     live `https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate`.
 *   Its own `VerifyCardRequest` fields are `merchantOrderId`, `amount`, `okUrl`, `failUrl`,
 *   `cardHolderName`, `cardNumber`, `cardExpireDateYear`, `cardExpireDateMonth`, `cardCVV2`,
 *   `email`, `clientIp`, billing-address fields, `currencyCode`, `installmentCount` — i.e. the
 *   MERCHANT'S OWN SERVER collects card number/CVV/expiry/holder name from its own form and posts
 *   them, in cleartext request fields, straight to `ThreeDModelPayGate`. Only AFTER that does the
 *   bank return an auto-submitting HTML form to its issuer's 3-D Secure (OTP) page — the redirect
 *   covers the OTP step only, never card entry. `ProvisionRequest` then completes the sale with
 *   `merchantOrderId`/`amount`/`md`/`okUrl`/`failUrl`. Callback fields: `MD`, `OrderId`,
 *   `ResponseCode`, `MerchantOrderId`, `HashData` (verified via
 *   `base64_encode(sha1(MerchantOrderId . ResponseCode . OrderId . HashPassword, true))`,
 *   `hash_equals`-compared; error code 99 = hash mismatch).
 * - `elsayed85/bank3` (Packagist README, fetched directly, independent author/implementation):
 *   names the SAME `ThreeDModelPayGate` endpoint (live `https://boa.kuveytturk.com.tr/
 *   sanalposservice/Home/ThreeDModelPayGate`, test `https://boatest.kuveytturk.com.tr/
 *   boa.virtualpos.services/Home/ThreeDModelPayGate`) and its own builder methods —
 *   `setCardNumber`, `setCardExpireDateMonth`, `setCardExpireDateYear`, `setCardCvv2` — called on
 *   the merchant's own server BEFORE `pay()` triggers the 3-D redirect. Config fields:
 *   `CustomerId`, `MerchantId`, `UserName`, `Password`, `OkUrl`, `FailUrl` — matching Kaan's own
 *   listed credentials (Merchant ID, Customer ID, API Username, Password) closely.
 *
 * Two independent, real implementations agreeing on the same endpoint names, the same
 * merchant-collects-card shape, and (for credentials) the same field semantics is exactly the
 * structural cross-reference standard this module already uses to call something confirmed (the
 * same bar `nestpay.ts` cleared, in the opposite direction here: it confirms this gateway is NOT
 * card-free, rather than confirming that it is). `ThreeDModelPayGate`'s name suggested a hosted
 * redirect; the two SDKs' own request builders settle that it is not one — the gate's "3D Model"
 * in the name refers to the classic merchant-initiated 3-D Secure MPI flow (same PCI shape as
 * VakıfBank's MPI_Enrollment and Garanti's non-3DS "additional fields" product), not a hosted
 * checkout page. This is a PCI SAQ A-EP/D flow, not the SAQ-A hosted/redirect posture this module
 * requires (Kaan's non-negotiable rule — Notya never receives PAN/CVV).
 *
 * No genuinely hosted/card-free Kuveyt Türk product (an "Ortak Ödeme"-style page, if one exists)
 * surfaced in this pass's searches — only `ThreeDModelPayGate`/`ThreeDModelProvisionGate`, and one
 * unrelated SOAP status-query/cancel/refund API with no payment-page component at all
 * (`CP.VPOS`'s "Kuveyt POS TDV2.0.0 SOAP API" listing — İptal/İade/Durum sorgulama/Özel Sorgu
 * only, no Sale).
 *
 * WHAT WOULD UNSTUB THIS: confirmation from Kuveyt Türk (most realistically, after a clinic opens
 * a real merchant account and receives Kuveyt Türk's own merchant-only integration pack) of a
 * genuinely hosted/card-free payment-page product distinct from `ThreeDModelPayGate` — not more
 * web research, since two independent, concrete OSS sources already agree on what the public
 * product actually is.
 */
import { AdapterNotImplementedError } from '../types'
import type { BankPosAdapter } from '../payments/types'

export function createKuveytTurkAdapter(): BankPosAdapter {
  const fail = () => {
    throw new AdapterNotImplementedError('banks/kuveyt_turk', 'lib/accounting/banks/CHECKLIST.md')
  }
  return {
    bankKey: 'kuveyt_turk',
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
