# Bank adapter completion checklist

Status: **1 of 12 registered adapters is real** (`generic_hosted`). The 11 named banks from
`docs/ARCH-NOTYA-ACCOUNTING.md` §2.6 are stubs — they implement `BankPosAdapter` and throw
`AdapterNotImplementedError` with a pointer here, instead of a fabricated request/response shape.

## Generic protocol (what `generic_hosted.ts` actually implements, for reference)

1. `POST {baseUrl}/sessions` with `{ merchantId, amountKurus, currency, merchantRef, returnUrl, webhookUrl }`
   → `{ sessionId, redirectUrl, expiresAt }`.
2. Doctor's customer is redirected to `redirectUrl` (bank-hosted 3DS page). Notya never sees PAN/CVV.
3. Bank calls `webhookUrl` with a signed POST; adapter verifies `HMAC-SHA256(storeKey, rawBody)`
   against an `X-Pos-Signature`-style header before trusting any field.
4. `GET {baseUrl}/sessions/{merchantRef}?merchantId=...` for out-of-band status queries.

Required merchant fields (`accounting_bank_merchants.secrets_enc`, decrypted at call time):
`baseUrl`, `merchantId`, `storeKey`.

A clinic can go live on this today against any endpoint that speaks this protocol (e.g. a
sandbox the CEO stands up, or a gateway that already implements this shape). It is intentionally
**not** presented as a specific bank's certified integration.

## Per-bank checklist to replace a stub with a real adapter

For **each** bank below, finishing it means creating `lib/accounting/banks/<key>.ts` implementing
`BankPosAdapter` for real (same shape as `generic_hosted.ts`: `createHosted3dsSession`,
`parseWebhook`, `queryStatus`), registering it in `index.ts` in place of the stub, and adding a
bank-specific test with a mocked transport. Each row is what's needed from the CEO to do that
honestly instead of guessing field names:

| Bank | Adapter key | What's needed |
|------|-------------|----------------|
| Yapı Kredi | `yapi_kredi` | Sanal POS merchant sandbox credentials (merchant id, terminal id, store key or equivalent); official API/3DS integration guide (endpoint URLs test+live, auth method, required/optional fields, response/callback field names, signature algorithm) |
| Türkiye İş Bankası | `isbank` | Same as above — İş Bankası sanal POS (often "Sanal POS 3D" / "iPara") sandbox credentials + current API doc |
| Garanti BBVA | `garanti` | Garanti Sanal POS (GVP / "VPOS") sandbox credentials + API doc (endpoint, hash/signature scheme, field names) |
| Akbank | `akbank` | Akbank Sanal POS sandbox credentials + API doc |
| QNB | `qnb` | QNB Finansbank Sanal POS (often via "FastPay"/"QNBEsolutions" infra — confirm which product) sandbox credentials + API doc |
| Ziraat Bankası | `ziraat` | Ziraat Sanal POS sandbox credentials + API doc |
| VakıfBank | `vakifbank` | VakıfBank Sanal POS sandbox credentials + API doc |
| Halkbank | `halkbank` | Halkbank Sanal POS sandbox credentials + API doc |
| Denizbank | `denizbank` | Denizbank Sanal POS sandbox credentials + API doc |
| TEB | `teb` | TEB Sanal POS sandbox credentials + API doc |
| Kuveyt Türk | `kuveyt_turk` | Kuveyt Türk Sanal POS sandbox credentials + API doc |

For every bank, the minimum to actually finish it:

1. **Sandbox merchant account** (test mode) — merchant id / terminal id / API user / store key /
   whatever that bank calls its shared secret.
2. **Current API/integration document** from the bank (many Turkish bank sanal POS integrations
   use a shared "ortak ödeme sayfası" / hosted page vendor under the hood — confirm which, since
   some banks share a provider and could reuse more code than a 1:1 per-bank file suggests).
3. **Exact field names and auth method** — request shape, hash/signature algorithm, callback
   field names, status-query endpoint and shape, void/refund endpoint if supported.
4. **A way to test it** — sandbox 3DS test cards, or a way to simulate the callback, so the new
   adapter's test can assert against something real rather than another guess.

Until these arrive, each bank stays a stub and the module only goes live on `generic_hosted` (or
whichever single bank is prioritized first per docs/ARCH-NOTYA-ACCOUNTING.md §4 Phase 1).
