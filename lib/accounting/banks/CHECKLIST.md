# Bank adapter completion checklist

Status: **1 of 12 registered DIRECT-BANK adapters is real** (`generic_hosted`). The 11 named banks
from `docs/ARCH-NOTYA-ACCOUNTING.md` §2.6 are stubs — they implement `BankPosAdapter` and throw
`AdapterNotImplementedError` with a pointer here, instead of a fabricated request/response shape.
This file covers the **direct-bank path only**. For the facilitator path (iyzico — the
default/recommended path under the 2026-10-15 hybrid model, §2.6a) see
`lib/accounting/facilitators/CHECKLIST.md`, which IS real/`VERIFIED`.

## 2026-10-15 hybrid-model update (later same day) — NestPay group consolidated, still stub

Per Kaan's hybrid-model instruction (§2.6a), İş Bankası/Halkbank/TEB/QNB Finansbank/Ziraat/Akbank
now share **one** stub factory (`lib/accounting/banks/nestpay_group.ts`) instead of six, since they
all sit behind the same NestPay/ASSEMIST (Payten) gateway. Research done (WebSearch/WebFetch,
same standard applied to every other bank in this file — named banks are not exempt from
verification just because the CEO named them):

- No official, bank- or Asseco-published developer documentation of the NestPay **"3D Pay
  Hosting"** protocol was found publicly. `see.asseco.com` (NestPay's own vendor) describes the
  product at a marketing level only — no technical docs, no banks named.
- What is public: third-party reverse-engineered client libraries — `node-nestpay`
  ([cdn.jsdelivr.net/npm/node-nestpay@2.1.0/README.md](https://cdn.jsdelivr.net/npm/node-nestpay@2.1.0/README.md)),
  Omnipay/NestPay forks, and WiseCP's integration notes
  ([docs.wisecp.com/en/turkish-bank-virtual-pos-modules.md](https://docs.wisecp.com/en/turkish-bank-virtual-pos-modules.md)).
  Every one of them shows sample code where the merchant's own server function takes `number`,
  `cvv`, `year`, `month` as arguments even for the "hosting" storetype — which is either evidence
  the merchant server still handles the PAN in practice, or just a generic-library artifact that
  wraps several storetypes under one call signature. No source resolves that ambiguity.
- One potentially authoritative source — QNB's own
  `vpos.qnb.com.tr/Help/apiIntegrationDocument` — could not be fetched in this research pass. The
  fetch failed with a tool-level provenance/permission timeout (`PROVENANCE_REQUIRED`), not a
  content refusal, on two attempts. **This is an open lead, not a dead end** — a human with direct
  browser access should check it before concluding either way.
- WiseCP's page also links Garanti's and QNB's own integration-doc URLs directly
  (`dev.garantibbva.com.tr/sanalpos-satis-on-otorizasyon-3dli`,
  `vpos.qnb.com.tr/Help/apiIntegrationDocument`) — worth a human revisiting both with a real
  browser session, since this research pass's automated fetch tooling could reach one and not the
  other.

**Verdict applied, consistently with the rest of this file:** given that the two confirmed, citable
Turkish-bank docs anywhere in this whole project (Garanti's non-3DS page, VakıfBank's PDF) both
turned out to require raw-PAN submission, treating NestPay's own "Hosting" branding as proof of
SAQ-A safety without a citable source would repeat the exact mistake this file's honesty rule
exists to prevent. So: **stub**, with the finding documented plainly, not a guessed
`BEST_EFFORT_UNVERIFIED` shape. See `lib/accounting/banks/nestpay_group.ts` for the code-level
note.

| Banks | Adapter keys | Status |
|-------|--------------|--------|
| İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat, Akbank | `isbank`, `halkbank`, `teb`, `qnb`, `ziraat`, `akbank` (one shared stub factory) | STUB — protocol ambiguous/unconfirmed from public sources; one lead (QNB's own doc) blocked by a tool-level fetch timeout, not resolved either way |

**Garanti BBVA and Yapı Kredi (Posnet)** are explicitly phased as "then" steps after NestPay per
Kaan's own instruction — not attempted again in this pass. Garanti's status is unchanged from the
finding below (public doc found, but it's the PAN-touching non-3DS product). Yapı Kredi/Posnet:
no additional research was done this pass, consistent with "then," not "now" — it remains exactly
where §4.1 left it (no public API doc found). Both remain interface-complete stubs
(`AdapterNotImplementedError`) so they slot in cleanly once their phase comes.

## 2026-10-15 research update — why this is still the honest state, not an oversight

A later instruction asked for all 11 banks to be finished for real now, via web research, with a
`BEST_EFFORT_UNVERIFIED` status for ones without solid docs, live on `main`. Real research was
done (WebSearch + WebFetch against each bank's own domains). The findings below are why none of
the 11 moved from stub to real, and it is not a documentation gap — it is a **PCI conflict**:

- **Garanti BBVA** has a public developer page
  ([dev.garantibbva.com.tr/en/virtualpos-additional-fields-product-information-shipping-non-3ds](https://dev.garantibbva.com.tr/en/virtualpos-additional-fields-product-information-shipping-non-3ds)),
  but it documents a **non-3DS direct-sale** request that takes the raw card `Number` and `CVV2`
  fields from the merchant. No hosted 3DS session flow is shown there.
- **VakıfBank** publishes a full, versioned, official PDF integration guide
  ([vbassets.vakifbank.com.tr/.../vakifbank-sanal-pos-entegrasyon-dokumani-2.4-versiyon.pdf](https://vbassets.vakifbank.com.tr/ticari/pos-uye-is-yeri-hizmetleri/vakifbank-sanal-pos-entegrasyon-dokumani-2.4-versiyon.pdf),
  v2.4, 2023-10-06). It is genuinely detailed — `MPI_Enrollment.aspx` endpoints (test/live),
  `MerchantId`/`MerchantPassword` auth, `VeRes`/`PaReq`/`ACSUrl` fields — **but the merchant
  collects and submits the raw `Pan` and `ExpiryDate` to the bank's enrollment endpoint before the
  3DS redirect happens.** The 3DS redirect only covers the issuer's OTP/ACS step, not card entry.
- **Türkiye İş Bankası** has a modern developer portal (developer.isbank.com.tr) and a public API
  catalog PDF, but the only payments product in it is the **Payment Facilitator (PF) API**,
  restricted to firms licensed as a payment institution under Law 6493 with a signed
  cooperation agreement — not usable for a single doctor's own merchant account, and inaccessible
  without that license regardless of documentation.
- **Yapı Kredi, Akbank, QNB, Ziraat, Halkbank, Denizbank, TEB, Kuveyt Türk**: no official
  developer-portal API reference was found publicly for any of them. Search results surface only
  (a) third-party reverse-engineered unified libraries (the `mews/pos`-family forks — `ankapix/
  sanalpos-entegrasyonlari`, `evrenonur/sanalpos`, `enver/pos`, `medre/pos`, `rasim/pos`), which
  are **not official bank documentation** and were not used as a source for exactly that reason,
  and (b) e-commerce platform setup guides (ideasoft.com.tr) that assume a signed merchant
  agreement is already in place.

**The pattern, stated plainly:** every classic Turkish bank sanal POS API that is publicly
documented at all (Garanti, VakıfBank) uses the merchant-submits-PAN-then-redirects-for-OTP
shape (PCI SAQ A-EP/D territory), not a true hosted-card-entry page (PCI SAQ-A, what this
architecture requires — "Notya never sees PAN/CVV"). That is almost certainly *why* so many
Turkish SaaS products sit a payment facilitator (iyzico, Craftgate, PayTR, Param — note
`craftgate.io` surfaced directly in the search results) in front of these banks instead of
integrating bank-by-bank: the facilitator absorbs the PCI scope, the merchant never does. Writing
"real" adapters for these 11 banks from what is publicly available would mean Notya's backend
receiving raw card numbers — a regression against the architecture's own non-negotiable rule, not
a completion of it. That is not a stub that needs more info; it is a conflict between two
instructions ("implement these 11 banks for real" vs. "never process raw PAN/CVV, hosted 3DS is
mandatory") that has to be resolved by a human decision (most likely: adopt a facilitator as the
`generic_hosted`-shaped real path, or get each bank's actual hosted-page product, which per the
İş Bankası page's own access rules is typically disclosed only after a signed merchant agreement
— i.e. after Kaan or a clinic actually opens a merchant account with that bank).

## Generic protocol (what `generic_hosted.ts` actually implements, for reference)

1. `POST {baseUrl}/sessions` with `{ merchantId, amountKurus, currency, merchantRef, returnUrl, webhookUrl }`
   → `{ sessionId, redirectUrl, expiresAt }`.
2. Doctor's customer is redirected to `redirectUrl` (bank-hosted 3DS page). Notya never sees PAN/CVV.
3. Bank calls `webhookUrl` with a signed POST; adapter verifies `HMAC-SHA256(storeKey, rawBody)`
   against an `X-Pos-Signature`-style header before trusting any field.
4. `GET {baseUrl}/sessions/{merchantRef}?merchantId=...` for out-of-band status queries.

Required merchant fields (`accounting_bank_merchants.secrets_enc`, decrypted at call time):
`baseUrl`, `merchantId`, `storeKey`.

A clinic can go live on this today against any endpoint that speaks this protocol — in practice
that means a payment facilitator/gateway (iyzico, Craftgate, PayTR, Param, …) whose hosted
checkout already matches this shape, or a sandbox the CEO stands up. It is intentionally **not**
presented as a specific bank's certified integration.

## Per-bank status

| Bank | Adapter key | Status | What was found | What's actually needed to finish it for real |
|------|-------------|--------|------------------|------------------------------------------------|
| Yapı Kredi | `yapi_kredi` | STUB — no public API doc found | Only third-party unified-library forks, not official docs | A real merchant account with Yapı Kredi (sanal POS), and whatever hosted-page product (if any) they offer beyond the classic MPI pattern, from their own merchant-only documentation |
| Türkiye İş Bankası | `isbank` | STUB — found docs are the wrong product | Public developer portal + API catalog PDF exist, but the only payment API is the licensed-PF-only product | Not applicable for a single doctor's own merchant account; would need İş Bankası's merchant-only sanal POS docs (not public) |
| Garanti BBVA | `garanti` | STUB — found doc is PAN-touching, non-3DS | Public dev page, but it's the raw-card non-3DS "additional fields" product | Garanti's actual hosted 3DS product docs (merchant-only), or confirmation Garanti offers no true hosted-page option |
| Akbank | `akbank` | STUB — no public API doc found | Nothing official found | Merchant account + Akbank's own sanal POS integration doc |
| QNB | `qnb` | STUB — no public API doc found | Nothing official found (only e-commerce-platform help pages) | Merchant account + QNB's own sanal POS integration doc |
| Ziraat Bankası | `ziraat` | STUB — no public API doc found | Nothing official found | Merchant account + Ziraat's own sanal POS integration doc |
| VakıfBank | `vakifbank` | STUB — real official doc found, but it's PAN-touching | Public, versioned, official PDF (`vakifbank-sanal-pos-entegrasyon-dokumani-2.4-versiyon.pdf`) — MPI enrollment pattern requires the merchant to submit raw `Pan`/`ExpiryDate` before the 3DS redirect | Confirmation from VakıfBank of a true hosted-card-entry product (if one exists), since the documented flow as-is conflicts with "Notya never sees PAN/CVV" |
| Halkbank | `halkbank` | STUB — no public API doc found | Nothing official found | Merchant account + Halkbank's own sanal POS integration doc |
| Denizbank | `denizbank` | STUB — no public API doc found | Nothing official found | Merchant account + Denizbank's own sanal POS integration doc |
| TEB | `teb` | STUB — no public API doc found | Nothing official found | Merchant account + TEB's own sanal POS integration doc |
| Kuveyt Türk | `kuveyt_turk` | STUB — no public API doc found | Nothing official found | Merchant account + Kuveyt Türk's own sanal POS integration doc |

No bank in this table was promoted to a fabricated "best-effort" implementation. A guessed
adapter that happens to compile is not a safer state than an honest stub for a feature that moves
real money through a real bank account — it is a worse one, because it looks finished.

## Recommended real path — DECIDED (2026-10-15): hybrid model, see §2.6a

The facilitator recommendation below was acted on. Kaan chose a **hybrid model**: iyzico as the
real, `VERIFIED`, default payment path (`lib/accounting/facilitators/iyzico.ts`, checklist at
`lib/accounting/facilitators/CHECKLIST.md`) shipping now, with the direct-bank path kept alive in
parallel and phased (NestPay group → Garanti/Yapı Kredi → rest-on-demand) rather than abandoned.
This file's per-bank table below is therefore the **direct-bank path's** status only; it is not
the only way a doctor can take real card payments through this module — see §2.6a.

The paragraph that led to that decision, kept for the record:

The fastest way to get a genuinely real, PCI-safe, hosted-3DS path across many/all of these banks
at once is very likely a **payment facilitator** (iyzico, Craftgate, PayTR, Param, or similar) —
they already provide exactly the `generic_hosted`-shaped hosted checkout, already support most of
these 11 banks' cards under one merchant agreement, and keep the PCI scope off Notya. Direct
bank-by-bank integration remains an option, but — per the VakıfBank and Garanti findings above —
only once each bank's own *hosted-page* product (not the classic MPI/enrollment one) is confirmed,
which in practice means after a clinic has actually opened a merchant account with that bank and
can request their merchant-only documentation.

For every bank, the minimum to finish it for real, whichever path is chosen:

1. **Merchant account** (test/sandbox first) with that bank or facilitator.
2. **Current API/integration document**, confirmed to describe a hosted-card-entry flow, not a
   PAN-to-merchant flow.
3. **Exact field names and auth method** from that document.
4. **A way to test it** — sandbox 3DS test cards or a way to simulate the callback — so the new
   adapter's test asserts against something real.

Until one of these arrives, every named bank stays a stub and the module only goes live on
`generic_hosted` against whatever real hosted endpoint (facilitator or bank) Kaan actually
connects it to.
