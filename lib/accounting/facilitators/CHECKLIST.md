# Payment facilitator adapter completion checklist

Status: **1 of 1 registered facilitator adapter is real — `iyzico`, `VERIFIED`.** This is the
default/recommended payment path under the 2026-10-15 hybrid model
(`docs/ARCH-NOTYA-ACCOUNTING.md` §2.6a), separate from the 11 direct-bank adapters in
`lib/accounting/banks/CHECKLIST.md`.

## iyzico — VERIFIED

What "VERIFIED" means here, concretely (fetched 2026-10-15, all from `docs.iyzico.com`, iyzico's
own current public docs — not a third-party library, not memory/assumption):

| Piece | Source | Finding |
|-------|--------|---------|
| Checkout Form initialize — endpoint, request fields, response fields | [cf-implementation/cf-initialize](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize) | `POST /payment/iyzipos/checkoutform/initialize/auth/ecom`. Request schema (`CFInitializeRequest`) has **no card number/CVV/expiry field at all**. Response returns `token`, `checkoutFormContent` (hosted form HTML) and `paymentPageUrl` (hosted redirect) — confirms card entry happens on iyzico's own page/iframe, never the merchant's. |
| Checkout Form retrieve (status) — endpoint, request/response fields | [checkoutform/cf-implementation/cf-retrieve](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-retrieve) | `POST /payment/iyzipos/checkoutform/auth/ecom/detail`. Response includes `paymentStatus`, `fraudStatus` (1/0/-1), `paidPrice`, masked card info (`binNumber`, `lastFourDigits`) — never a full PAN. |
| IYZWSv2 request signing | [authentication/hmacsha256-auth](https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth) | `payload = randomKey + uriPath + rawJsonBody`; `signature = hex(HMAC_SHA256(payload, secretKey))`; `Authorization: IYZWSv2 ` + base64(`apiKey:...&randomKey:...&signature:...`). Implemented exactly as documented in `buildIyzicoAuthHeader` (`iyzico.ts`), with a unit test reproducing the documented construction byte-for-byte. |
| Sandbox/live base URLs | [live-vs-sandbox](https://docs.iyzico.com/en/getting-started/preliminaries/live-vs-sandbox) | Sandbox `https://sandbox-api.iyzipay.com`, live `https://api.iyzipay.com`. |

**PCI conclusion (the reason this is the facilitator that shipped, not a guess):** unlike every
Turkish bank's own public documentation found in this whole project (Garanti, VakıfBank, NestPay —
see `lib/accounting/banks/CHECKLIST.md`), iyzico's Checkout Form request schema has no PAN/CVV
field to begin with. This is a structural, citable confirmation, not an inference from naming (the
mistake the NestPay "Hosting" finding specifically warns against).

### What a human still needs to do before the first real charge

1. **Open a real iyzico merchant account** (sandbox first, then live) — this adapter has not been
   run against a live iyzico account; it was built and tested against the documented request/
   response shapes with a mocked transport (`lib/accounting/facilitators/iyzico.test.ts`).
2. **Get sandbox API key/secret** from iyzico's merchant panel and enter them under Entegrasyonlar
   → Faturalama & Tahsilat → "Ödeme kuruluşu — iyzico".
3. **Run one real sandbox transaction end-to-end** (create invoice → "Ödeme bağlantısı" → iyzico's
   sandbox hosted page → 3DS test card → webhook/callback lands → invoice marked paid) before
   trusting it with a live account. This is also why `docs/OPEN-COMMITMENTS.md` recommends the
   beta tester's very first *live* transaction be a small deliberate test, not a real patient
   charge.
4. **NOT verified in this pass, left honestly out of scope:**
   - The exact response-integrity `signature` field's own verification algorithm (this adapter
     always re-queries `cf-retrieve` server-to-server instead of trusting the callback body
     directly — see `iyzico.ts` header comment — so this gap does not weaken the trust model, but
     it means iyzico's own response-signature check specifically was not implemented).
   - Refund/void/cancel endpoints (not needed for the MVP charge flow).
   - Marketplace/sub-merchant fields (`subMerchantKey`/`subMerchantPrice`) — not relevant to a
     single-doctor merchant account.
   - Buyer identity (TCKN/address/city) is collected from the doctor at charge time in the UI
     (see `docs/OPEN-COMMITMENTS.md` ACCOUNTING-11) rather than auto-resolved from the patient
     record — that auto-resolution is still open, independent of this adapter being real.
