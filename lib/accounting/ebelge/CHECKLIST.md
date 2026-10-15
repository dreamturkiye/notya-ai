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
