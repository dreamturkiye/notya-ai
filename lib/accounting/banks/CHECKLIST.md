# Bank adapter completion checklist

Status (updated 2026-10-15, third pass): **9 of 12 registered DIRECT-BANK adapters are real** —
`generic_hosted`, the 6 NestPay-group banks (İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat,
Akbank, sharing one adapter, `nestpay.ts`, VERIFIED by protocol cross-reference), **Garanti BBVA**
(`garanti.ts`, REAL — direct vendor documentation) and **Yapı Kredi/Posnet** (`yapikredi_posnet.ts`,
REAL — BEST-EFFORT single-source OSS cross-reference). See "2026-10-15 third pass" below for both.
The remaining 3 (VakıfBank, Denizbank, Kuveyt Türk) are stubs — they implement `BankPosAdapter` and
throw `AdapterNotImplementedError` with a pointer here, instead of a fabricated request/response
shape; they stay deferred pending doctor demand. This file covers the **direct-bank path only**.
For the facilitator path (iyzico — the default/recommended path under the 2026-10-15 hybrid
model, §2.6a) see `lib/accounting/facilitators/CHECKLIST.md`, which IS real/`VERIFIED`.

## 2026-10-15 third pass — Garanti BBVA and Yapı Kredi (Posnet) are now REAL

Built on a fresh branch off `main` (`feat/notya-accounting-garanti-yapikredi`, in its own git
worktree — `feat/notya-accounting` through the NestPay pass was already merged). Both adapters
follow `nestpay.ts`'s exact shape: `BankPosAdapter`, hosted/redirect 3DS only (SAQ-A, never touches
PAN/CVV), vault-sourced merchant credentials, a test/live endpoint toggle, webhook handling wired
into `app/api/accounting/payments/webhook/[bankKey]/route.ts`, and audit logging via
`lib/accounting/audit.ts`.

### Garanti BBVA — `garanti.ts` — **REAL, direct vendor documentation (iyzico-level, one disclosed inference)**

Product: Virtual POS **Common Payment Page** (Ortak Ödeme Sayfası / OOS), `secure3dsecuritylevel=
3D_OOS_PAY`. This supersedes the earlier finding in "2026-10-15 research update" below, which only
checked the non-3DS "additional fields" page and correctly found THAT page PAN-touching — it was
not the whole picture. This pass fetched the portal's Common Payment pages directly:

- [dev.garantibbva.com.tr/en/virtual-pos-common-payment-term](https://dev.garantibbva.com.tr/en/virtual-pos-common-payment-term)
  ("Virtual POS Transactions General Concepts") — the shared Common Payment form, endpoints, and
  the `secure3dhash` construction.
- [dev.garantibbva.com.tr/en/virtual-pos-common-payment-dcc](https://dev.garantibbva.com.tr/en/virtual-pos-common-payment-dcc)
  and [dev.garantibbva.com.tr/en/virtualpos-common-payment-cash](https://dev.garantibbva.com.tr/en/virtualpos-common-payment-cash)
  — per-variant pages confirming `OOS_PAY`/`3D_OOS_PAY` and which template blocks each variant keeps.
- [dev.garantibbva.com.tr/en/virtualpos-sales-fixed-amount-non-3ds](https://dev.garantibbva.com.tr/en/virtualpos-sales-fixed-amount-non-3ds)
  — confirms the `Amount` minor-unit format ("1,00 TL -> 100"), so `amountKurus` needs no conversion.
- Cross-reference (corroborating, not primary): `developertugrul/garanti-pos`
  (github.com/developertugrul/garanti-pos, read via its Packagist listing) has a dedicated
  `buildOOSForm()`/`buildGarantiPayForm()` entry point separate from its card-collecting
  `build3DForm()` — independent corroboration that OOS is a structurally separate, redirect-only
  flow, not just an inference from the product's name.

**Confirmed directly from the portal:** endpoints (`https://sanalposprovtest.garantibbva.com.tr/VPServlet`
test, `https://sanalposprov.garanti.com.tr/VPServlet` live — exactly matching Kaan's own
instruction); field names (`terminalmerchantid`, `terminalid`, `terminalprovuserid`,
`terminaluserid`, `orderid`, `successurl`/`errorurl`, `txnamount`, `txntype`, `txncurrencycode`,
`txninstallmentcount`, `txntimestamp`, `secure3dhash`); the two-step hash (`hashedpassword =
UPPER(SHA1(ProvisionPassword + "0" + TerminalID))`, then `secure3dhash =
UPPER(SHA512(TerminalID+OrderID+Amount+CurrencyCode+SuccessURL+ErrorURL+Type+InstallmentCount+
StoreKey+hashedpassword))`, ISO-8859-9 encoded); callback fields (`mdstatus`, `mderrormessage`,
`procreturncode`, `oid`/`orderid`, echoes, `secure3dhash`).

**What is NOT directly stated, disclosed plainly:** the portal's shared sample HTML form template
(reused across several product pages) also lists card fields; the portal never states in so many
words "the OOS-submitted form omits them." `garanti.ts` never sends them — backed by the product's
own hosted description and the OSS corroboration above, but this is the file's one inference, not
an independently-stated fact. The portal also doesn't document a callback-specific hash
verification formula — `garanti.ts` reuses the request formula symmetrically (same posture as
`nestpay.ts`). Numeric `mdstatus`/`procreturncode` value tables weren't reached (a separate
error-codes page) — mapping is conservative: only `mdstatus === '1'` is `captured`, same rule
NestPay applies to its own confirmed field.

### Yapı Kredi (Posnet) — `yapikredi_posnet.ts` — **REAL, BEST-EFFORT single-source OSS cross-reference (one tier below NestPay's two-source VERIFIED)**

`yapikredipos.com.tr` was fetched directly this pass and confirmed to be a merchant-marketing site
only (POS products, campaigns, application forms) — **no developer portal, no "POSNET 3D Secure
XML Service Integration"/"POSNET XML Services" document exists there or anywhere else publicly
reachable this pass.** That is the real finding Kaan's instruction asked to verify, confirmed by
fetching the site, not assumed.

OSS cross-reference was attempted the same way as NestPay's, but this session's fetch tool refused
every raw GitHub/GitLab URL with a provenance error (`ankapix/sanalpos-entegrasyonlari` on GitLab,
`hasandz/posnet-oos`, `mertbuldur/posnet-oos`, `tcgunel/omnipay-yapikredi` on GitHub) — a tooling
limitation of this pass, unlike the NestPay pass, which did read two libraries' actual source. One
package's Packagist-mirrored README (which IS fetchable) gave real, concrete detail:

- [packagist.org/packages/tcgunel/omnipay-yapikredi](https://packagist.org/packages/tcgunel/omnipay-yapikredi)
  (repo: github.com/tcgunel/omnipay-yapikredi) — test/live endpoints, credential field names, a
  two-stage SHA256 MAC skeleton, the `BankPacket`/`MerchantPacket`/`Sign` callback field names, and
  amount/currency/installment conventions.
- [docs.wisecp.com/en/turkish-bank-virtual-pos-modules.md](https://docs.wisecp.com/en/turkish-bank-virtual-pos-modules.md)
  — independently corroborates the 4 credential field names (`mid`=Üye İşyeri No, `tid`=Terminal
  No, `posnetID`=bank-issued POSNET identifier, `encKey`="Store Key"/POSNET ENC key). This part IS
  genuinely two-source-confirmed.

**Confirmed (single OSS source, not independently cross-confirmed — stated honestly):**

| Environment | XML endpoint | 3DS endpoint |
|---|---|---|
| Test | `https://setmpos.ykb.com/PosnetWebService/XML` (matches Kaan's instruction) | `https://setmpos.ykb.com/3DSWebService/YKBPaymentService` (matches Kaan's instruction) |
| Live | `https://posnet.yapikredi.com.tr/PosnetWebService/XML` | `https://posnet.yapikredi.com.tr/3DSWebService/YKBPaymentService` |

MAC: `firstHash = SHA256(encKey + ";" + terminalId)`; `mac = SHA256(xid + ";" + amount + ";" +
currency + ";" + mid + ";" + firstHash)`. The source's README does not state the digest's output
encoding (hex vs. base64) — `yapikredi_posnet.ts` base64-encodes it (matching this module's own
NestPay `ver3` convention), **explicitly flagged as not independently confirmed**. Amount is
integer kuruş (no decimal), currency `"TL"`.

**What is NOT confirmed, disclosed plainly, rather than guessed into something that looks
finished:**
- The request XML's exact element names (`<posnetRequest><mid>…</oosRequestData>…`) follow the
  long-standing, widely-replicated public POSNET structure from general protocol familiarity, not
  a source read live this pass — the file's most-flagged gap.
- The inbound `BankPacket`/`MerchantPacket` callback's internal schema (what's actually inside
  those two strings) is not confirmed. `yapikredi_posnet.ts` verifies `Sign` over the opaque
  strings, then best-effort-decodes `MerchantPacket` for a plain-text approval marker — an
  unrecognized or undecodable packet maps to `pending`, **never** a guessed `captured`.
- **Before this is trusted with real money:** a human should run one real test-sandbox transaction
  against the test endpoints above and confirm the actual `BankPacket`/`MerchantPacket` field
  shape and the MAC's hex-vs-base64 encoding against what the bank/sandbox actually returns, or
  pull the OSS source directly (this session's tooling could not, a later one might).

| Bank | Adapter key | Status | What was found | What's actually needed to finish it for real |
|------|-------------|--------|------------------|------------------------------------------------|
| Garanti BBVA | `garanti` | **REAL — direct vendor docs** | Common Payment Page (OOS) product fully documented on dev.garantibbva.com.tr: endpoints, fields, hash | Nothing blocking; a human should still run one real sandbox transaction before go-live, same as any new payment code |
| Yapı Kredi | `yapi_kredi` | **REAL — BEST-EFFORT, single-source OSS** | Endpoints/credentials/MAC-skeleton from one Packagist README; no live XML schema source reached | A human running one real sandbox transaction to confirm the exact XML tags, MAC encoding, and callback packet schema — or a successful live-source pull once tooling allows |

## 2026-10-15 hybrid-model update, second pass — NestPay group is now REAL

The first pass (below, kept for the record) stopped at "no modern developer *portal*" and treated
that as blocking. Kaan's follow-up correctly pushed back: NestPay/EST is a real, long-standing
protocol, documented as PDFs/vendor guides rather than a web portal, and implemented by mature
open-source libraries used in real production systems — "no portal" is not "no documentation."
This pass read two independent, actively-real, MIT-licensed libraries' **source code** (not just
READMEs) to confirm the protocol structurally:

- [github.com/uskur/omnipay-nestpay](https://github.com/uskur/omnipay-nestpay) — `src/Message/PostRequest.php`
  (the "3D Pay Hosting" request builder), `src/ThreeDPayHostingGateway.php`, `src/Message/PostResponse.php`.
- [github.com/mewebstudio/pos](https://github.com/mewebstudio/pos) — actively maintained,
  `src/Gateway/AssecoPos.php`, `src/Crypt/AssecoPosCrypt.php`,
  `src/DataMapper/Request/Mapper/AssecoPosRequestDataMapper.php`,
  `src/DataMapper/Response/Mapper/AssecoPosResponseDataMapper.php` — explicitly supports
  `MODEL_3D_PAY_HOSTING`/`MODEL_3D_HOST`, with its own dedicated hash and response-mapping classes.

**The structural confirmation (not an inference from the word "Hosting"):** in BOTH libraries, the
exact same request-builder function used for every NestPay storetype only adds card PAN/expiry/
CVV fields `if ($creditCard instanceof CreditCardInterface)` — the hosting-mode call path passes
no card object at all, so the resulting form has no card field. Cross-referencing two independent
implementations of this detail (not just one) is what makes this a real confirmation rather than a
guess.

**Hash algorithm (`ver3`), identical in both libraries:** sort fields by key (natural,
case-insensitive), escape `\`→`\\` and `|`→`\|` in each value, join with `|`, append the escaped
store key as the final joined element, SHA-512 the UTF-8 string, base64-encode the **raw digest
bytes** (not hex text). The same function verifies an inbound callback — recompute over its own
fields (excluding `hash`/`HASH`/`encoding`/`nationalidno`) and compare to its `HASH` field.
Implemented in `lib/accounting/banks/nestpay.ts` → `buildNestpayHash`, with a test that
independently reproduces the algorithm rather than calling the function under test twice.

**Confirmed callback fields** (from `AssecoPosResponseDataMapper::map3DHostResponseData` /
`extractMdStatus` / `is3dAuthSuccess`): `oid`, `mdStatus` (`'1'` = full 3D Secure success only —
`'2'`/`'3'`/`'4'` = "half 3D Secure", mapped to `failed` here out of caution, not `captured`),
`amount`, `currency`, `taksit`, `maskedCreditCard` (masked, never full PAN), `mdErrorMsg`. For the
Hosting model the callback IS the final result — no separate provisioning call follows it.

**What is still NOT verified, disclosed plainly (so this doesn't read as more certain than it
is):** no primary bank-published PDF was located this pass either — this status rests on
cross-referencing two independent, real, production-used implementations, which is the standard
Kaan asked for, but is one tier below reading a bank's own current spec directly (iyzico's
status). Exact field-name casing is known to vary slightly bank-to-bank in practice (e.g.
`Instalment` vs `taksit`, `HASH` vs `hash`) — the adapter sends both common hash-field casings
defensively rather than guessing one, and does NOT hardcode any bank's hostname: `gatewayUrl` is a
required merchant-supplied field (Kaan's own instruction), which is also the honest choice given
that variance. The offline XML status-query API (needed only if a webhook/callback is missed) was
**not** built this pass — `queryStatus` throws a clear, actionable error rather than fabricating
an XML-API caller from a shape that wasn't independently confirmed.

One lead from the first pass remains genuinely open, not resolved either way: QNB's own
`vpos.qnb.com.tr/Help/apiIntegrationDocument` still could not be fetched (tool-level
provenance/permission timeout, not a content refusal) — worth a human checking with a real
browser session, independent of the above (this file's VERIFIED status does not depend on it).

| Banks | Adapter keys | Status |
|-------|--------------|--------|
| İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat, Akbank | `isbank`, `halkbank`, `teb`, `qnb`, `ziraat`, `akbank` (one shared real adapter, `nestpay.ts`) | **REAL — VERIFIED by protocol cross-reference** (3D Pay Hosting mode; see above for exactly what was and wasn't confirmed) |

### First-pass findings (2026-10-15, superseded above, kept for the record)

The earlier pass found no official, bank- or Asseco-published developer documentation of the
NestPay "3D Pay Hosting" protocol in a modern web portal, and stopped there rather than reading
open-source implementations' actual source code (it only read their READMEs, which were
genuinely ambiguous on card handling). That was the gap Kaan's follow-up instruction closed.

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

## Per-bank status (historical — Yapı Kredi and Garanti BBVA rows superseded 2026-10-15 third pass, see above)

| Bank | Adapter key | Status | What was found | What's actually needed to finish it for real |
|------|-------------|--------|------------------|------------------------------------------------|
| Yapı Kredi | `yapi_kredi` | SUPERSEDED — now REAL (BEST-EFFORT, single-source OSS), see "2026-10-15 third pass" above | This row documents the earlier "no public API doc found" finding, which is still true (confirmed again, directly, third pass) — but OSS cross-reference later supplied enough to build a real adapter | — |
| Türkiye İş Bankası | `isbank` | Registered to `nestpay.ts` (NestPay-group, REAL) — this historical row is stale | Public developer portal + API catalog PDF exist, but the only payment API described there is the licensed-PF-only product | — (superseded; İş Bankası's actual sanal POS runs on the shared NestPay/EST protocol, not the PF API this row originally found) |
| Garanti BBVA | `garanti` | SUPERSEDED — now REAL (direct vendor docs), see "2026-10-15 third pass" above | This row's finding (the non-3DS "additional fields" page is PAN-touching) is still correct — it just wasn't the whole picture; the separate Common Payment/OOS product is hosted and real | — |
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
NestPay, Garanti and Yapı Kredi are now all done (2026-10-15, see "2026-10-15 third pass" above);
only VakıfBank/Denizbank/Kuveyt Türk remain on the rest-on-demand tier. This file's per-bank table
below is therefore the **direct-bank path's** status only; it is not the only way a doctor can
take real card payments through this module — see §2.6a.

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
