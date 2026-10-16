# e-Belge adapter completion checklist

## 2026-10-16 update — GİB Portalı is now the default MVP path; this whole directory is optional

**Everything below this point describes the OPTIONAL `integrator` e-belge mode**
(`accounting_module_settings.ebelgeMode === 'integrator'`). As of 2026-10-16
(NOTYA-ACCOUNTING-GIB-PORTAL-01), the **default** mode is `gib_portal`: Notya computes
amount/KDV/(for e-SMM) stopaj and renders a copy-ready field list for GİB's own free portal
(earsivportal.efatura.gov.tr) — the doctor issues the real document themselves there and pastes
the resulting document number back into Notya. See `lib/accounting/ebelge/gibPortal.ts` and
`lib/accounting/invoices/engine.ts`'s `prepareGibPortalInvoice`/`confirmGibPortalIssuance`. This
path:

- Requires **zero** rows in `accounting_ebelge_credentials` and **zero** entries from this
  directory's adapter registry — `getEbelgeAdapter()` is never called.
- Costs the doctor **nothing** beyond the e-imza/mali mühür they already must have for this
  legal obligation — no integrator subscription.
- Is the reason **Paraşüt moved from "the one real adapter a doctor must connect" to "one optional
  provider among several"** — it was shipped as a hard dependency of the issuance flow in the
  previous round (2026-10-15) without ever being round-tripped against a live sandbox, and it
  forced every doctor to hold their own separate Paraşüt subscription just to issue documents.
  That dependency is removed; `parasut.ts` is unchanged code-wise and still a real, working
  adapter for a doctor who explicitly switches to `ebelgeMode: 'integrator'` and wants API
  automation instead of manual GİB Portalı entry — it is simply never required and never the
  default now.

The `EbelgeAdapter` interface itself (this directory) was **already a generic, pluggable
integrator contract** before this pass — nothing about its shape needed to change to make it
"optional"; only the invoice engine's branch-on-`ebelgeMode` and the module settings' default
needed to change (see `docs/ARCH-NOTYA-ACCOUNTING.md` §4.11). A future lightweight, low-volume
entegratör (Nilvera or similar — re-checked 2026-10-15 below and found to have no public
self-serve API at that time, so not built yet) plugs into this exact same interface as a new
optional provider whenever one becomes reachable, same as Paraşüt did.

---

Status (2026-10-15 update, for the optional `integrator` mode only): **2 of 5 registered
adapters are real** (`generic_rest`, and now `parasut` — BEST-EFFORT/cross-referenced,
`esmm`+`earsiv` only, `efatura` deliberately throws pending buyer-PK capture; see the 2026-10-15
Paraşüt section below). `nes`, `qnb_esolutions`, `logo` are still stubs — they implement
`EbelgeAdapter` and throw `AdapterNotImplementedError` with a pointer here instead of a
fabricated request/response shape. `other` is a deliberate placeholder for whatever integrator a
practice names in the wizard's "Other" option — it stays a stub until a real adapter is written
for that specific vendor.

## Generic protocol (what `generic_rest.ts` actually implements, for reference)

- `POST {baseUrl}/documents` bearer-authenticated with `apiKey`, body
  `{ docType, seller, buyer, lines, totals, currency, issueDate, idempotencyKey }` (idempotency
  key = Notya `invoice_id`, so a retried submit never double-issues) → `{ uuid, documentNumber, pdfUrl }`.
- `POST {baseUrl}/documents/{uuid}/cancel` → `{ ok }`.
- `POST {baseUrl}/documents/{uuid}/credit-notes` with `{ amountKurus, reason }` → `{ creditUuid }`.
- `GET {baseUrl}/health` for the setup wizard's "Test connection" button.

Required credential fields (`accounting_ebelge_credentials.secrets_enc`, decrypted at call time):
`baseUrl`, `apiKey`.

Seller identity on every call comes from the doctor's own `accounting_tax_profiles` row, never
from a Notya-owned constant — this is enforced by `EbelgeInvoiceDto.seller` being populated by the
invoice engine from the tax profile, not by any adapter.

## Per-integrator checklist to replace a stub with a real adapter

| Vendor | Adapter key | What's needed |
|--------|-------------|----------------|
| Paraşüt | `parasut` | **Real as of 2026-10-15** (`parasut.ts`) for `esmm`/`earsiv`. Still needed: live sandbox credentials to actually exercise `testConnection()`/`issue()` once (never done in this environment); buyer GİB mailbox (PK) capture to unblock `efatura` (tracked as ACCOUNTING-11) |
| NES | `nes` | NES sandbox account + API credentials (API key or client id/secret); current NES API documentation for e-SMM/e-Fatura/e-Arşiv issuance (endpoint URLs test+live, auth method, exact request/response field names, status codes, cancel/credit-note endpoints, webhook format if they push status) |
| QNB eSolutions | `qnb_esolutions` | QNB eSolutions sandbox credentials; current API doc (same field list as NES above) — confirm whether this is the same stack as the bank's own payment APIs or a separate e-belge product |
| Logo | `logo` | Logo e-belge module sandbox/test tenant + API credentials; current API doc. Logo is often ERP-linked (invoked via their accounting product rather than a bare REST API) — confirm the actual integration surface (REST API vs. file-based batch vs. ERP plugin) before building |
| Other (custom) | `other` | Whichever integrator a specific practice names — base URL, auth method and field names supplied by that integrator's own docs once a practice picks one |

Five more names were re-checked on 2026-10-15 specifically for a public self-serve developer API +
sandbox, prioritizing ones not requiring a signed mükellef contract first (Nilvera, İzibiz, Foriba/
Digital Planet, Uyumsoft, Mikro) — see that section below for per-vendor findings; none cleared the
bar, same "pure access gap" category as NES/QNB/Logo above.

For every integrator, the minimum to actually finish it:

1. **Sandbox/test tenant** with real credentials.
2. **Current API documentation** — not assumed from general e-belge knowledge; GİB integrator
   APIs vary enough between vendors that guessing field names risks issuing a malformed document
   or, worse, one that looks accepted but isn't GİB-valid.
3. **Exact field names and auth method**, including how e-Fatura buyer mailbox (PK) lookups work
   if that vendor's e-Fatura flow needs one.
4. **A way to test issue + cancel + credit-note** against the sandbox so the new adapter's test
   suite asserts against something real.

Until these arrive, each vendor stays a stub and the module only goes live on `generic_rest` per
docs/ARCH-NOTYA-ACCOUNTING.md §4 Phase 1.

## 2026-10-15 research update

Real research (WebSearch + WebFetch) was done against NES, QNB eSolutions and Logo before a later
instruction asked for all three to be finished for real now. Result: **no vendor moved from stub
to real**, and no fabricated "best-effort" adapter was written for a named vendor — here, unlike
the bank side, it's a pure access gap rather than a protocol conflict:

- **NES**: no public developer/API reference found. Search results are limited to the vendor's
  own marketing/contact pages and unrelated third-party e-fatura tooling.
- **QNB eSolutions**: no public API reference found. Results are e-commerce marketplace app
  listings (Shopify, Wix, ikas) for their e-Fatura plugin, which confirms the product exists and
  is integrated by platforms, but exposes no field-level API documentation publicly.
- **Logo**: the one Logo-branded document found (`docs.logo.com.tr/.../Support_E-Fatura.pdf`) is
  **Netsis end-user support documentation, not a Logo developer API reference** — it describes a
  Windows COM library (`EFatAPI.dll`) used by Netsis's own desktop ERP product, not a REST/SOAP
  service a separate web app like Notya could call over HTTPS. This confirms the original
  checklist's suspicion: Logo's e-belge integration is ERP-plugin-shaped, not a bare REST API, so
  "finishing" it for real may mean a fundamentally different integration surface (possibly no
  direct server-to-server option at all) rather than just filling in field names.

None of this is surprising — all three are commercial products sold to onboarded business
customers; their real API references are reasonably expected to live behind a customer login,
which is exactly what the original checklist already anticipated. The research did not find a
shortcut around that, so each stays a stub with the same requirement: a sandbox/test account from
that vendor, obtained by Kaan or whoever sets up the merchant relationship.

## 2026-10-15 compliance audit addendum (NOTYA-ACCOUNTING-COMPLIANCE-01)

Full writeup with sources: `docs/ARCH-NOTYA-ACCOUNTING.md` §4.6. The parts specific to this
directory's adapters:

- **UBL-TR / ETTN / mali mühür are the integrator's job, not this adapter's, by design** — and
  that is exactly why none of this audit's fixes touch `generic_rest.ts`'s wire protocol. Notya's
  own code builds a business-data DTO and hands it to whichever integrator is configured; the
  integrator builds the actual GİB-compliant document. This is a legitimate common pattern, but it
  means **no adapter in this directory can be marked "GİB field-compliant"** — only "correctly
  implements its own stated (generic, for `generic_rest`; or not-yet-implemented, for the three
  stubs) protocol." Confirming real GİB-level field compliance requires picking a real integrator
  (NES / QNB eSolutions / Logo / a different "other") and verifying against ITS actual API, which
  is unchanged — still blocked on a sandbox account for any of the three, per the section above.
## 2026-10-15 re-research: Paraşüt moves to real; Nilvera/İzibiz/Foriba/Uyumsoft/Mikro re-checked, stay out of reach

Re-opened the integrator question with fresh eyes per a later instruction, prioritizing vendors
that don't require a signed mükellef contract first (since Kaan's company isn't legally formed yet,
Notya cannot itself be the GİB-connected party — the correct architecture stays BYO-entegratör:
each doctor/klinik enters **their own** integrator credentials into `accounting_ebelge_credentials`,
confirmed unchanged and correct this pass).

- **Paraşüt — moved to REAL** (`parasut.ts`). Has a genuine, documented OAuth2 ("password" grant)
  JSON:API at `https://api.parasut.com/v4` (resources `e_smms`, `sales_invoices`, `e_archives`,
  `e_invoices`), confirmed through converging third-party/SDK documentation even though this
  session's tooling could not directly fetch `apidocs.parasut.com` itself — stated at
  **BEST-EFFORT/cross-referenced** confidence, the same tier convention
  `lib/accounting/facilitators/iyzico.ts` uses for its own `VERIFIED` tier, one notch down.
  Implements `esmm` (`POST /{companyId}/e_smms`) and `earsiv` (two-step `sales_invoices` →
  `e_archives`). `issue()` for `efatura` deliberately throws (buyer PK not captured yet — see
  ACCOUNTING-11 in `docs/OPEN-COMMITMENTS.md`). `cancel()`/`credit()` return/throw an honest
  "not documented" result rather than guess an endpoint. **Never exercised against a live
  Paraşüt sandbox in this environment** — a human with real company credentials must run one
  live round trip before trusting this with a real document, same bar the bank adapters already
  carry for their own pre-go-live checks.
- **Nilvera**: no public field-level developer API reference found reachable without an existing
  account/contract. Marketing/product pages only.
- **İzibiz**: same — no public self-serve API docs found; integrator pages describe the product,
  not its wire protocol.
- **Foriba (Digital Planet)**: same pattern as Logo — material found is product/ERP-integration
  marketing, not a bare REST/SOAP reference a separate web app could call directly.
- **Uyumsoft**: no public field-level API documentation found without a customer login.
- **Mikro**: same — Mikro's e-belge integration is ERP-linked like Logo's; no standalone public API
  reference found.

None of these five is a protocol conflict (unlike the bank/PCI side) — it's a pure access-gap, the
same honest category the original 2026-10-15 NES/QNB/Logo research update above already
established. Each stays a stub (or, for the three not yet in the adapter registry at all — Nilvera/
İzibiz/Foriba/Uyumsoft/Mikro — simply unbuilt; they are not `EbelgeVendor` keys and were not added
as speculative stubs, to avoid implying a commitment the research doesn't support) until a sandbox
account materializes for one of them.

- **Buyer identity fix** (§4.6.2 of the arch doc) was made in the call site
  (`lib/accounting/invoices/engine.ts`'s `issueInvoice`), not in any adapter here — the DTO
  (`EbelgeInvoiceDto.buyer`) now carries the patient's real name (and email, when on file) instead
  of a hardcoded `"Hasta"` placeholder. Every adapter in this directory (real or stub) receives
  whatever `buyer` the DTO carries unchanged — this fix benefits `generic_rest` today and will
  benefit NES/QNB eSolutions/Logo/other automatically once any of them is built for real.
- **Credit notes** (`EbelgeAdapter.credit()`) were already implemented in `generic_rest.ts` before
  this pass — the gap was that nothing in the invoice engine ever called it (fixed in
  `lib/accounting/invoices/engine.ts`'s new `creditInvoice()`, see the arch doc §4.6.5). No change
  needed in this directory.
- **Retention**: this directory's adapters return `pdfUrl` (a vendor-hosted link) in
  `EbelgeIssueResult`; nothing here downloads or stores the actual file bytes. Flagged as an open
  gap in the arch doc §4.6.3, not fixed this pass (storage-infra and KVKK-retention-of-a-copy
  decision, not a guess to make unilaterally).
