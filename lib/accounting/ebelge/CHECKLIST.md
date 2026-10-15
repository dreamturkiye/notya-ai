# e-Belge adapter completion checklist

Status: **1 of 4 registered adapters is real** (`generic_rest`). `nes`, `qnb_esolutions`, `logo`
are stubs — they implement `EbelgeAdapter` and throw `AdapterNotImplementedError` with a pointer
here instead of a fabricated request/response shape. `other` is a deliberate placeholder for
whatever integrator a practice names in the wizard's "Other" option — it stays a stub until a
real adapter is written for that specific vendor.

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
| NES | `nes` | NES sandbox account + API credentials (API key or client id/secret); current NES API documentation for e-SMM/e-Fatura/e-Arşiv issuance (endpoint URLs test+live, auth method, exact request/response field names, status codes, cancel/credit-note endpoints, webhook format if they push status) |
| QNB eSolutions | `qnb_esolutions` | QNB eSolutions sandbox credentials; current API doc (same field list as NES above) — confirm whether this is the same stack as the bank's own payment APIs or a separate e-belge product |
| Logo | `logo` | Logo e-belge module sandbox/test tenant + API credentials; current API doc. Logo is often ERP-linked (invoked via their accounting product rather than a bare REST API) — confirm the actual integration surface (REST API vs. file-based batch vs. ERP plugin) before building |
| Other (custom) | `other` | Whichever integrator a specific practice names — base URL, auth method and field names supplied by that integrator's own docs once a practice picks one |

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
