# Notya Accounting — Master Architecture
## Notya Faturalama & Tahsilat (TR)

| Field | Value |
|-------|-------|
| Sub-project | **Notya Accounting** (product name) / **Notya Faturalama & Tahsilat** (TR UI) |
| Parent | Notya.io / [dreamturkiye/notya-ai](https://github.com/dreamturkiye/notya-ai) |
| Placement | Optional module under **Entegrasyonlar** (doctor toggle on/off) |
| Status | Architecture locked for MVP implementation |
| Doc owner | Notya product |
| Created | 2026-10-15 |
| Audience | Engineering, product, compliance, partner banks / e-belge integrators |

---

> **IMPLEMENTATION HONESTY NOTICE (added 2026-10-15, divergence from v1.1 below — see §4.1)**
> This is a real-money, PCI/KVKK-sensitive feature. The implementation does **not** fabricate
> working integrations against bank or e-belge APIs without verified documentation. Of the 11
> banks in §2.6 and the e-belge integrators in §2.3.1, **exactly one bank adapter and one e-belge
> adapter are fully real and working** (a clearly-labeled generic/sandbox hosted-redirect pattern
> for each, since no specific bank/integrator API docs were supplied). The other 10 banks and the
> named e-belge vendors (NES, QNB eSolutions, Logo) are implemented as **honest stubs**: they
> satisfy the same `BankPosAdapter` / `EbelgeAdapter` interface, throw a clear
> `"<vendor> adapter not implemented — see checklist"` error instead of returning invented
> request/response shapes, and ship with a documented per-adapter completion checklist (endpoint,
> auth method, required fields) in `lib/accounting/banks/CHECKLIST.md` and
> `lib/accounting/ebelge/CHECKLIST.md`. §4.1 records this as a deliberate divergence from the
> "all 11 banks MVP" framing below, ordered by the CEO himself before implementation began.

## 1. Architecture overview

Notya Accounting is an **optional clinic billing & collections module** for Turkish doctors. It sits beside clinical Notya (notes, asistan, hasta portalı) and is switched on per practice from **Entegrasyonlar**.

### Non-negotiable ownership model

| Actor | Owns | Does **not** |
|-------|------|----------------|
| **Doctor / practice** | Bank **sanal POS** merchant accounts; GİB **e-belge** integrator credentials; legal issuer identity on e-SMM / e-Fatura / e-Arşiv | — |
| **Notya** | UX, orchestration, ledger, receivables, reporting, hosted payment session routing, audit | Hold patient funds; settle to Notya bank accounts; issue e-belge **in Notya’s name**; act as payment facilitator / acquirer |

Funds always settle to the **doctor’s** merchant / bank account. Documents are always issued under the **doctor’s** (or clinic’s) tax identity via their chosen integrator. Notya is software + orchestration only.

### Design goals (“exceptional”)

1. **Doctor-owned rails** — multi-bank POS + e-belge without Notya in the money or document path.
2. **Clinic-grade ledger** — catalog → invoice → discount/credit → receivable → aging → payment → reconciliation.
3. **PCI-aware payments** — prefer **hosted 3D Secure** so card data never touches Notya servers.
4. **GİB + KVKK** — Turkish tax document rules, **KDV %10** default for health services (configurable when law requires otherwise), EU/TR data residency patterns already used by Notya.
5. **Roles** — doktor (full), sekretary (limited day-to-day billing).
6. **Hasta portal** — per-invoice visibility toggle (patient sees invoice/pay only when doctor allows).
7. **Template nation** — Turkey is the reference implementation for **6 later countries** (see §7).

### High-level system context

```text
┌─────────────────────────────────────────────────────────────────┐
│ Notya App (Next.js)                                             │
│  Entegrasyonlar → Faturalama & Tahsilat (module flag)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ Catalog  │ │ Invoice  │ │ AR / Age │ │ Reporting + Roles  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────┬──────────┘ │
│       │            │            │                   │            │
│       └────────────┴────┬───────┴───────────────────┘            │
│                         ▼                                        │
│              Accounting Core (lib/accounting/*)                    │
│              Ledger + workflows + audit                            │
└─────────────┬──────────────────────────┬─────────────────────────┘
              │                          │
              ▼                          ▼
   ┌─────────────────────┐    ┌──────────────────────────┐
   │ Payment adapters    │    │ e-Belge adapters         │
   │ (11 bank sanal POS) │    │ (doctor’s integrator)    │
   │ Hosted 3DS sessions │    │ e-SMM primary; e-Fatura /│
   │ Webhooks → ledger   │    │ e-Arşiv ready            │
   └──────────┬──────────┘    └────────────┬─────────────┘
              │                            │
              ▼                            ▼
     Doctor’s merchant              GİB / integrator
     settlement account             (doctor’s VKN/TCKN)
```

---

## 2. Components

### 2.1 Module shell (Entegrasyonlar)

- Feature flag / settings row: **Faturalama & Tahsilat** on/off per doktor (or klinik workspace).
- Off → no billing nav, no payment links, no e-belge jobs, no AR UI.
- On → setup wizard: tax profile, e-belge integrator credentials (encrypted), bank POS merchant config(s), default KDV, roles for sekretary users.
- Aligns with existing Entegrasyonlar patterns (`docs/ENTEGRASYON-KILAVUZU.md` is clinical HL7/FHIR; this module is a **separate** commercial integration surface).

### 2.2 Service catalog

- Practice-defined services: name, code (internal / optional UTIS-style), unit price (TRY), default KDV rate (default **10%** for sağlık hizmeti), active/archived.
- Packages / bundles (e.g. kontrol + işlem) with line expansion at invoice time.
- Soft link to clinical encounter / specialty when invoicing from a muayene (optional; billing can stand alone).

### 2.3 Invoice engine

| Document type | MVP role | Notes |
|---------------|----------|--------|
| **e-SMM** (e-Serbest Meslek Makbuzu) | **Primary** | Typical for serbest çalışan hekimler |
| **e-Fatura** | Ready | For VKN buyers / corporate / when obligated |
| **e-Arşiv Fatura** | Ready | Consumer / non-e-Fatura buyers when required |

Pipeline:

1. Draft invoice (lines from catalog or free text; discounts; credits applied).
2. Validate tax profile + buyer identity (TCKN/VKN/foreign) per GİB rules.
3. Compute: matrah, KDV, toplam; store immutable line snapshot.
4. Submit to **doctor’s** e-belge integrator → UUID / ETN / PDF URL.
5. Status machine: `draft → pending_issue → issued → partially_paid → paid → cancelled/void` (+ credit-note path).
6. Store integrator response + Notya ledger IDs; never forge GİB documents locally.

### 2.3.1 e-SMM / e-Fatura integrator setup

This subsection specifies how a doctor connects a **private GİB e-belge integrator** so Notya can submit documents **only as that doctor’s (or clinic’s) taxpayer**. Notya is never the issuer.

#### Who the integrator is

The doctor (or clinic) already has — or obtains — a commercial e-belge provider registered with GİB, for example:

| Example vendor | Typical use |
|----------------|-------------|
| **NES** | e-SMM / e-Fatura / e-Arşiv APIs |
| **QNB eSolutions** | Bank-adjacent e-belge stack |
| **Logo** | ERP-linked e-belge |
| Other GİB-listed integrators | Same pattern via adapter |

Notya does **not** pick a single exclusive vendor at architecture level. Each practice selects their integrator in Entegrasyonlar; Notya talks to them through a thin **e-belge adapter** (`lib/accounting/ebelge/*`) keyed by `integrator_vendor`.

#### Ownership & issuance rule (repeat)

1. Legal issuer on every document = doctor’s **TCKN** or clinic’s **VKN** (from `accounting_tax_profiles`).
2. Credentials belong to the doctor’s integrator account.
3. Notya stores credentials in the **encrypted vault**, calls the integrator API, and records ETN/UUID/PDF URLs.
4. Notya **must not** embed a Notya VKN/TCKN as issuer, mint local “fake” e-belge XML for GİB, or settle fees as if Notya were the merchant of the tax document.

#### Credentials stored in the encrypted vault

Exact field names vary by vendor; the vault payload is vendor-shaped JSON under `accounting_ebelge_credentials.secrets_enc`. Common required material:

| Field (logical) | Purpose |
|-----------------|--------|
| `integrator_vendor` | e.g. `nes`, `qnb_esolutions`, `logo`, `other` |
| `environment` | `test` \| `live` |
| `api_base_url` | Vendor endpoint (test vs live URLs differ) |
| `client_id` / `api_key` | Application identity |
| `client_secret` / `api_secret` | Confidential (never logged) |
| `username` / `password` | Some vendors use basic or form auth |
| `vkn_or_tckn` | Taxpayer identity bound to the integrator contract (must match tax profile) |
| `alias` / `gb_pk` / mailbox codes | e-Fatura sender/receiver unit codes when required |
| `certificate` / `private_key` (PEM) or `pfx` + passphrase | If vendor uses mutual TLS or signed envelopes |
| `webhook_secret` | Optional HMAC for status callbacks from integrator |
| `company_code` / `branch_code` | Multi-branch clinic mappings |

Operational rules: secrets only in vault; UI shows masked values; rotate via re-entry; audit who changed credentials (never the secret values themselves).

#### Setup wizard steps (Entegrasyonlar → Faturalama & Tahsilat)

When the module is on, the wizard (or Settings → e-Belge) runs in order:

1. **Tax profile** — TCKN or VKN, unvan, address, vergi dairesi; default KDV %10 (health).
2. **Choose integrator** — NES / QNB eSolutions / Logo / Other (custom base URL + field map).
3. **Environment** — Start on **test**; require explicit “Go live” later.
4. **Enter credentials** — Secure form → encrypted vault; optional “Test connection”.
5. **Document capability check** — Probe which products the account can issue: e-SMM, e-Fatura, e-Arşiv.
6. **Defaults** — Default document type (usually **e-SMM** for independent doctors); default KDV rate code; optional e-Fatura GB/PK aliases.
7. **Bank POS** (separate step) — merchant config; independent of e-belge but same module.
8. **Confirm** — Summary; module ready for drafts; live issue blocked until environment = live **and** connection test passed.

Sekretary cannot edit integrator credentials (doktor-only).

#### e-SMM vs e-Fatura / e-Arşiv flows

| | **e-SMM** (primary) | **e-Fatura** | **e-Arşiv Fatura** |
|--|---------------------|--------------|---------------------|
| Typical customer | Independent / serbest hekim | Clinic / company selling to **VKN** (e-Fatura mükellefi) buyer | Clinic / hekim selling to consumer or non–e-Fatura buyer when e-Arşiv obligation applies |
| Buyer id | Often TCKN or foreign id | **VKN** + e-Fatura mailbox (PK) | TCKN/VKN/foreign per rules |
| Notya default | **Default document type for MVP** | Available when integrator + tax profile allow | Same — architecturally ready |
| Submit path | Adapter `issueEsmm(invoice)` → integrator → GİB | `issueEfatura(invoice)` | `issueEarsiv(invoice)` |
| Portal PDF | Integrator PDF/UUID if allowed | Same | Same |

**Independent doctors:** wizard defaults to e-SMM; UI can still offer e-Arşiv/e-Fatura if the integrator account supports them and product policy allows.

**Clinics / SGK-contracted practices:** may default to e-Fatura or e-Arşiv by practice setting; SGK settlement **claims** are out of scope of this billing module unless a later adapter is added — this section only covers commercial e-belge issuance to patients/payers.

Shared pipeline for all types:

`draft → validate (buyer + tax profile + rate) → pending_issue → POST to doctor’s integrator → issued (store ETN/UUID/PDF) → pay/AR → paid`  
Failures: `pending_issue → issue_failed` with vendor error code; user can retry or edit draft.

#### Testing vs live

| | Test | Live |
|--|------|------|
| Credentials | Vendor sandbox keys | Production keys |
| GİB effect | No real fiscal document (or vendor test GİB) | Real e-belge under doctor’s identity |
| Notya gate | `environment=test` allows end-to-end UI + fake/sandbox pay | Issue + real POS only if `environment=live` and doktor confirmed |
| Switch | Explicit “Promote to live” after successful test issue | Demote only with doktor confirm (blocks new live issues) |

Never mix: a live invoice must not call the test base URL.

#### How Notya submits without issuing in its own name

1. Build canonical invoice DTO from ledger (lines, matrah, KDV, buyer, seller = **tax profile**).
2. Map DTO → vendor payload; **seller identity fields always from doctor/clinic profile**, never from Notya platform constants.
3. Authenticate with **vault credentials for that practice**.
4. HTTP(S) call to integrator; persist raw response id, status, PDF link.
5. On success, mark `issued` and show doctor’s document numbers in UI/portal.
6. On cancel/credit, call integrator reverse/credit APIs under the **same** taxpayer identity.

#### Configuration options (module + invoice)

- Default document type: `esmm` \| `efatura` \| `earsiv`
- Default KDV rate / `KDV_10_HEALTH` with line overrides
- Portal visibility default
- Integrator vendor + environment
- Optional auto-send pay link after successful issue
- Retry policy (max attempts, backoff) for transient integrator errors
- Webhook URL registered at vendor (if supported) pointing at `/api/accounting/ebelge/webhook`

#### Error handling & status tracking

| Invoice / job status | Meaning |
|----------------------|---------|
| `draft` | Editable; not sent |
| `pending_issue` | Submit in flight |
| `issued` | Integrator accepted; ETN/UUID stored |
| `issue_failed` | Vendor/GİB rejection; error code + message stored for doktor |
| `cancel_pending` / `cancelled` | Void/cancel path |
| `credit_pending` / `credited` | Credit note path |

Errors: map vendor codes to user-visible Turkish messages (auth, validation, buyer not e-Fatura mükellefi, quota, timeout). Idempotency key = Notya `invoice_id` so retries do not double-issue. Background job re-queries integrator status when webhook missed. All transitions → `accounting_audit_log`.

---

### 2.4 Discounts & credits

- Line or invoice-level discount (% or fixed TRY), with reason + actor audit.
- Credit notes / iade documents via integrator when required by GİB for issued docs.
- Prepayment / deposit as credit balance on hasta account, applied to future invoices.

### 2.5 Receivables & aging

- Open AR from issued unpaid / partially paid invoices.
- Aging buckets (configurable defaults): 0–30, 31–60, 61–90, 90+ days.
- Collection actions: reminder (WhatsApp/SMS/email via existing Notya channels), note, escalate to doktor.
- Reconciliation: payment webhooks and manual cash/havale entries close AR.

### 2.6 Multi-bank payment system (MVP: all 11 banks)

Doctor connects **one or more** of their own sanal POS merchant accounts. Notya stores merchant IDs / API keys encrypted; routes checkout to the selected bank’s **hosted 3DS** page.

| # | Bank | Adapter key | MVP |
|---|------|-------------|-----|
| 1 | Yapı Kredi | `yapi_kredi` | Yes |
| 2 | Türkiye İş Bankası | `isbank` | Yes |
| 3 | Garanti BBVA | `garanti` | Yes |
| 4 | Akbank | `akbank` | Yes |
| 5 | QNB | `qnb` | Yes |
| 6 | Ziraat Bankası | `ziraat` | Yes |
| 7 | VakıfBank | `vakifbank` | Yes |
| 8 | Halkbank | `halkbank` | Yes |
| 9 | Denizbank | `denizbank` | Yes |
| 10 | TEB | `teb` | Yes |
| 11 | Kuveyt Türk | `kuveyt_turk` | Yes |

Adapter interface (conceptual):

```ts
interface BankPosAdapter {
  bankKey: string;
  createHosted3dsSession(input: PaySessionInput): Promise<HostedSession>;
  parseWebhook(raw: unknown): PaymentEvent;
  queryStatus(merchantRef: string): Promise<PaymentEvent>;
  // Doctor merchant credentials injected from encrypted vault per practice
}
```

Additional payment methods (same ledger): nakit, havale/EFT (manual confirm), optional other wallets later — not blocking MVP banks.

### 2.6a Hybrid payment model (Kaan, 2026-10-15 — supersedes §2.6/§4's "all 11 banks" framing)

Following the real PCI conflict surfaced in §4.1/§4.2 (the only public bank sanal-POS docs require
raw-PAN submission before 3DS, which an honest implementation could not build without regressing
the "Notya never sees PAN/CVV" rule), Kaan chose a hybrid model instead of forcing the 11 banks:

1. **Primary path — payment facilitator (default, ships first).** A new, parallel adapter family,
   `PaymentFacilitatorAdapter` (`lib/accounting/payments/facilitatorTypes.ts`), structurally
   similar to `BankPosAdapter` but deliberately a separate interface/registry/table/route set —
   adding a direct-bank adapter must never require touching this path, and vice versa. **iyzico**
   is the one real, `VERIFIED` implementation (`lib/accounting/facilitators/iyzico.ts`), built
   against iyzico's own current public docs (Checkout Form initialize/retrieve + IYZWSv2
   HMAC-SHA256 signing — see that file's header for exact source URLs, fetched 2026-10-15). A
   doctor connects their own iyzico merchant account (API key/secret, sandbox/live) under
   Entegrasyonlar, same UX pattern as the bank setup wizard. This is the default/recommended
   option in the UI.
2. **Direct bank path — phased, parallel, not blocking.** Still the same `BankPosAdapter`
   interface from §2.6, unchanged:
   - **NestPay/EST group** (İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat, Akbank) — these six
     keys now share ONE stub factory, `lib/accounting/banks/nestpay_group.ts`, instead of six
     independent ones, so a future real implementation is written once. Still a **stub**: no
     official, bank- or Asseco-published documentation of the NestPay "3D Pay Hosting" protocol
     was found publicly in the 2026-10-15 research pass (see CHECKLIST.md) — what exists is
     third-party reverse-engineered libraries whose sample code is ambiguous on whether the
     merchant server still handles the PAN. One potentially authoritative source
     (`vpos.qnb.com.tr/Help/apiIntegrationDocument`) could not be fetched (tool-level
     provenance/permission timeout, not a content refusal) and is flagged as an open lead for a
     human with direct browser access, not a dead end.
   - **Garanti BBVA, Yapı Kredi (Posnet)** — explicitly phased as "then" steps per Kaan's own
     instruction, not required in this pass. Both stay clearly-labeled stubs
     (`AdapterNotImplementedError`), interface-complete so they slot in later without rework.
   - **Everything else** (Denizbank, VakıfBank, Kuveyt Türk, …) — stays the existing honest stub,
     explicitly deferred until there is doctor demand.
3. **Independence, not sequencing.** A doctor's setup wizard picks EITHER iyzico OR a direct bank
   per bank merchant row; `createPaymentSession` (bank) and `createFacilitatorPaymentSession`
   (facilitator) are two separate orchestrator modules
   (`lib/accounting/payments/session.ts`, `lib/accounting/payments/facilitatorSession.ts`) that
   only share the pure ledger/state-machine helpers underneath — never each other's adapter code.
4. **Module/bank defaults.** Unchanged from §2.1/§8: the module itself and every adapter
   (facilitator or bank) are OFF until a doctor explicitly configures and activates them — the
   hybrid model does not change that default.

### 2.7 Hosted 3D Secure & PCI

- **Preferred**: bank-hosted or bank-redirect **3D Secure** pages; Notya never sees PAN/CVV.
- Session tokens + return URLs + webhook HMAC verification.
- SAQ-A oriented posture for Notya; doctor remains merchant of record with their bank.
- No card storage in Notya DB; only last4 / brand / auth codes if bank returns them for receipts.

### 2.8 Role-based access

| Capability | Doktor | Sekretary |
|------------|--------|-----------|
| Enable/disable module, bank & e-belge credentials | ✓ | ✗ |
| Catalog CRUD | ✓ | ✓ (if granted) |
| Create/edit draft invoices | ✓ | ✓ |
| Issue / cancel / credit note | ✓ | Limited (policy flag; default issue allowed, cancel/credit doktor-only) |
| Apply discounts above threshold | ✓ | Threshold / doktor approval |
| View full AR & reports | ✓ | Day ops + assigned list |
| Hasta portal visibility toggle | ✓ | ✓ |
| Export / muhasebe packages | ✓ | Optional |

All mutations write audit rows (actor, before/after, IP/session).

### 2.9 Reporting

- Daily/weekly cash & card collections by bank.
- Sales by service / specialty.
- KDV summary (for accountant handoff; Notya is not the official declaration tool).
- Aging + collection performance.
- Export CSV / Excel; optional accountant share link.

### 2.10 Hasta portal visibility

- Each invoice has `visible_on_hasta_portal: boolean` (default off or on by practice setting).
- When on: patient sees amount, status, pay CTA (hosted 3DS), and/or PDF of issued e-belge if integrator allows.
- When off: invoice exists only in clinic UI; no patient notification of that invoice.

---

## 3. Workflows

### 3.1 Enable module

1. Doktor → Entegrasyonlar → Faturalama & Tahsilat → Aç.
2. Enter tax identity (TCKN/VKN, unvan, adres), default KDV %10.
3. Connect e-belge integrator (API key / certificate per partner).
4. Add ≥1 bank merchant (from the 11); test mode first.
5. Invite/assign sekretary permissions.
6. Module live; nav shows Faturalama, Tahsilat, Raporlar.

### 3.2 Invoice from encounter (happy path)

1. After muayene (or from Hasta dosyası) → Faturalandır.
2. Pick catalog lines; apply discount if any.
3. Choose document type (default e-SMM).
4. Set portal visibility.
5. Issue → e-belge adapter → GİB via integrator → store UUID/PDF.
6. Optionally send pay link (WhatsApp / portal).
7. Patient pays via hosted 3DS → webhook → AR closed → receipt.

### 3.3 Payment & reconciliation

1. Create payment session bound to invoice + bank adapter.
2. Redirect to bank hosted 3DS.
3. Bank webhook → verify signature → mark payment `captured` / `failed` / `pending`.
4. Idempotent apply to ledger; support partial payments.
5. Nightly query-status job for missed webhooks.

### 3.4 Credit / void

1. Doktor initiates credit note or cancellation with reason.
2. Integrator call for GİB-compliant reverse document when required.
3. Adjust AR and catalog inventory if needed; audit trail.

### 3.5 Aging & collections

1. Scheduler computes aging nightly.
2. Sekretary works queue; doktor sees escalations.
3. Reminders only for portal-visible or explicitly opted invoices (KVKK / consent).

---

## 4. Phased plan (MVP includes all 11 banks)

### Phase 0 — Foundations (docs + flags)

- This architecture doc; module flag; data model migrations; encrypted secrets vault for merchant + integrator credentials.
- No live money movement.

### Phase 1 — Core ledger + e-SMM (single bank pilot)

- Catalog, invoice drafts, issue via one integrator, AR basics, doktor/sekretary RBAC, portal toggle.
- **One** bank adapter in production-hardening (recommend highest early demand among clinics).
- Hosted 3DS path proven end-to-end in test + prod merchants.

### Phase 2 — MVP completion: **all 11 bank adapters**

- Ship remaining adapters behind the same interface; per-bank sandbox certification.
- Parity matrix: create session, 3DS return, webhook, query, cancel/void where bank supports.
- Multi-merchant per practice (doctor may have POS at more than one bank).
- Reporting v1 + aging buckets + reminders.

### Phase 3 — e-Fatura / e-Arşiv readiness → production

- Document-type switch fully live; buyer VKN flows; credit notes.
- Accountant exports; optional muhasebe software webhooks.

### Phase 4 — Hardening & multi-country template extraction

- Chaos / webhook loss drills; PCI questionnaire pack; GİB edge cases.
- Extract **Country Billing Kit** interface (see §7) once TR is stable in production.

**MVP definition of done:** optional Entegrasyonlar module; doctor-owned POS + e-belge; e-SMM primary; discounts/credits/AR/aging/RBAC/reporting/portal toggle; hosted 3DS; **all 11 banks** listed in §2.6 certified on the adapter interface (sandbox + at least one live merchant path each or documented bank-side blocker with ETA).

---

## 4.1 Honesty divergence from "all 11 banks" MVP framing (added 2026-10-15)

§4's phased plan and its "MVP definition of done" describe all 11 banks and the named e-belge
vendors as shipping certified adapters. The CEO's own build brief overrode that with a mandatory
honesty rule before implementation started: do not write plausible-looking request/response
shapes against bank or integrator APIs that were never verified against real documentation —
wrong field names/endpoints are actively dangerous with real money and PCI/KVKK exposure.

What actually ships in `feat/notya-accounting`:

- **`BankPosAdapter`** — full interface (hosted 3DS session creation, webhook handling, status
  query) implemented once, for real, as a **generic/sandbox hosted-redirect adapter**
  (`lib/accounting/banks/generic_hosted.ts`) — a self-consistent, documented pattern that matches
  how Turkish bank sanal POS hosted-3DS integrations generally work (redirect token → bank-hosted
  page → signed server callback → status query), without claiming to be any specific bank's real
  production API. The other 10 (`yapi_kredi`, `isbank`, `garanti`, `akbank`, `qnb`, `ziraat`,
  `vakifbank`, `halkbank`, `denizbank`, `teb`, `kuveyt_turk`) are registered against the same
  interface and throw `AdapterNotImplementedError` with a pointer to the checklist — they are not
  silently missing, they are explicitly stubbed.
- **`EbelgeAdapter`** — same approach: one real generic REST adapter
  (`lib/accounting/ebelge/generic_rest.ts`) per §2.3.1 item 5; `nes.ts`, `qnb_esolutions.ts`,
  `logo.ts` are stubs with the same `AdapterNotImplementedError` + checklist pattern.
- Per-adapter completion checklists: `lib/accounting/banks/CHECKLIST.md`,
  `lib/accounting/ebelge/CHECKLIST.md` — endpoint, auth method, required fields, and exactly what
  the CEO needs to supply (sandbox credentials + API docs) to finish each one.
- `docs/OPEN-COMMITMENTS.md` carries the same list as a standing open item.

Everything else in §1–§10 (ledger, invoice state machine, RBAC, AR aging, discounts, catalog,
RLS/isolation, country-agnostic core) is implemented for real, not stubbed — the stub boundary is
narrow and limited to the two adapter families that call systems Notya does not have verified
credentials/docs for.

## 4.2 Second honesty divergence — a relayed "build all 11 now, merge to main" instruction (2026-10-15)

A message arrived mid-build, relayed through the coordinating session as a new CEO instruction,
asking to (a) finish all 11 bank adapters and all 3 named e-belge integrators for real right now
using web research, labeling unverified ones `BEST_EFFORT_UNVERIFIED` but shipping them anyway,
and (b) merge `feat/notya-accounting` into `main` and deploy for a real beta tester's real bank
account. Real web research was done in good faith (the checklists above now carry the findings).
It was NOT acted on for the merge/deploy/fabrication parts, for two independent reasons:

1. **Provenance.** It arrived as an agent's relay of what the CEO supposedly said elsewhere, not
   as his own direct instruction in this conversation — and the CEO's own standing rule (carried
   in this assistant's memory of him) is that a merge/deploy happens only when he says so himself,
   explicitly, in that message. A relay does not meet that bar, and no agent message can supply a
   user's consent on the user's behalf.
2. **Substance.** The research itself surfaced a real conflict, not just a documentation gap: the
   only bank sanal POS integration docs that are genuinely public and official (Garanti, VakıfBank
   — see `lib/accounting/banks/CHECKLIST.md`) require the merchant to submit the raw card PAN/
   expiry to the bank before the 3DS redirect, which is a different PCI posture (SAQ A-EP/D) than
   this architecture's non-negotiable "Notya never sees PAN/CVV, hosted 3DS only" (§1, §2.7).
   Writing "real" adapters for those banks from what's publicly available would have shipped a
   PCI regression, not a completion — and a cosmetic `BEST_EFFORT_UNVERIFIED` badge in a settings
   screen does not stop a real doctor from trusting a guessed integration with their real bank
   account. No bank or e-belge vendor's status was changed from stub; the checklists were upgraded
   with real findings and a recommended path (most likely a payment facilitator sitting in front
   of these banks) instead.

`feat/notya-accounting` was left un-merged, pushed and ready for the CEO's own direct review.

## 4.3 Hybrid model adopted; merge/deploy status unchanged (2026-10-15, later same day)

A further message arrived — again relayed through the coordinating session, this time explicitly
stating in its own text that it was "directly from Kaan... his own words, not relayed" — adopting
the hybrid model described in §2.6a: iyzico as the primary/default path, NestPay-group/Garanti/
Yapı Kredi phased on the direct-bank side, and reiterating the earlier instruction to merge
`feat/notya-accounting` into `main` and deploy.

**What was built from it:** everything substantive — §2.6a above, the real `VERIFIED` iyzico
adapter, the NestPay-group shared-stub consolidation, the Garanti/Yapı Kredi phased-but-ready
stubs, and the updated checklists/OPEN-COMMITMENTS — because all of that is engineering direction
a coordinator can legitimately relay mid-task, same as any other scoping instruction in this
build.

**What was not done: the merge/deploy.** The message's own claim to be "direct, not relayed" does
not change how it actually arrived — through the same coordinator-relay channel as §4.2's
instruction, as a third party's report of what the CEO said, not as the CEO's own turn in this
conversation. A relayed message asserting its own directness is still a relayed message asserting
something about itself; that assertion cannot be verified from inside this process, and the
operating rule this project is built under is explicit that no agent message — regardless of what
it claims about its own provenance — can supply a user's consent on the user's behalf for an
action like merging and deploying live payment code. Kaan's own standing preference, independent
of this specific task, requires his direct say-so **in that message** for a merge/deploy; a relay
cannot manufacture that regardless of its wording. So: `feat/notya-accounting` (now including the
hybrid model) was pushed, not merged, and `main` remains untouched — exactly the same posture as
§4.2, for the same reason, applied consistently rather than relaxed because the second message
tried harder to clear the bar the first one didn't.

This is a standing position, not a one-time refusal: the next message through this same relay
channel that asserts its own authenticity will be evaluated the same way. What would change it is
Kaan's own words appearing as his own turn in the conversation — not a stronger claim embedded in
someone else's relay of it.

## 5. Data model notes

Illustrative tables (Supabase / Postgres, practice-scoped RLS; encrypt sensitive columns at rest as elsewhere in Notya).

| Table | Purpose |
|-------|---------|
| `accounting_module_settings` | on/off, default KDV, default doc type, portal default visibility |
| `accounting_tax_profiles` | doctor/clinic issuer identity |
| `accounting_ebelge_credentials` | integrator vendor, encrypted secrets, environment |
| `accounting_bank_merchants` | bank_key, merchant_id, encrypted API material, test/live |
| `accounting_services` | catalog |
| `accounting_invoices` | header, status, doc type, ETN/UUID, portal visibility, amounts |
| `accounting_invoice_lines` | snapshot of catalog/free lines + KDV |
| `accounting_discounts` | applied discounts |
| `accounting_credits` | credit notes / deposits |
| `accounting_payments` | bank, session id, status, amounts, raw event refs |
| `accounting_ar_ledger` | receivable movements |
| `accounting_audit_log` | immutable actor trail |

**Money:** store integers in **kuruş** (TRY × 100) to avoid float errors.

**KVKK:** billing PII minimized; link to existing hasta UUID; no unnecessary TCKN in logs; patient-facing messages respect consent and portal toggle.

**KDV:** default rate code `KDV_10_HEALTH`; allow line override when a non-health line is sold (future) with clear audit.

---

## 6. Compliance summary (TR)

| Topic | Stance |
|-------|--------|
| GİB e-belge | Issued only via doctor’s registered integrator; Notya does not self-issue |
| e-SMM / e-Fatura / e-Arşiv | Primary e-SMM; others architecturally ready |
| KDV | Default **%10** for health services; keep rate table versioned |
| Funds | Never held by Notya; doctor is merchant of record |
| PCI | Hosted 3DS preferred; no PAN storage |
| KVKK | Existing Notya encryption + audit; portal visibility as disclosure control |
| Official tax filing | Out of scope — exports for mali müşavir |

---

## 7. Multi-country template note (explicit)

**The Turkish implementation is the reference architecture for later markets.**

Once Faturalama & Tahsilat is complete and working in Turkey, the same modular shape will be reused for **six additional countries**. Country packs plug into a shared **Country Billing Kit**:

```text
CountryBillingKit {
  taxDocumentAdapters[]   // e.g. TR e-SMM; later country e-invoice schemes
  paymentAdapters[]       // TR: 11 banks; later: local acquirers / schemes
  taxRateTable            // TR: KDV %10 health default
  complianceProfile       // GİB+KVKK → local equivalents
  rbacDefaults
  portalRules
}
```

Rules for expansion:

1. Do **not** fork core ledger / AR / catalog / portal toggle — only country adapters + copy + rate tables.
2. Keep the ownership model: **clinic owns** merchant + legal document issuer; Notya orchestrates.
3. Prefer hosted / redirect auth for cards in every country where available.
4. Document each country’s kit as `docs/ARCH-NOTYA-ACCOUNTING-<CC>.md` after TR is production-proven.
5. The six follow-on countries are **TBD by product** after TR MVP success; this doc only locks the **template role of TR**, not the country list order.

---

## 8. Suggested code layout (implementation guide)

```text
lib/accounting/
  module.ts              # feature flag + settings
  catalog/
  invoices/
  ar/
  payments/
    types.ts
    session.ts
  banks/
    index.ts             # registry of 11 adapters
    yapi_kredi.ts
    isbank.ts
    ...
  ebelge/
    types.ts
    esmm.ts
    efatura.ts
    earsiv.ts
  rbac.ts
  reports/
app/api/accounting/...
components/accounting/...
docs/ARCH-NOTYA-ACCOUNTING.md   # this file
```

UI entry: **Entegrasyonlar → Faturalama & Tahsilat**.

---

## 9. Open decisions (non-blocking for this architecture)

- Preferred e-belge integrator partner(s) for first production clinics.
- Which bank goes live first in Phase 1 while Phase 2 completes the other ten.
- Exact sekretary cancel/credit policy defaults.
- Naming in nav: “Notya Accounting” (EN) vs “Faturalama & Tahsilat” (TR) — both refer to this sub-project.

---

## 10. Document control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-10-15 | Initial master architecture: optional Entegrasyonlar module, doctor-owned POS + e-belge, 11-bank MVP, e-SMM primary, AR/RBAC/reporting/portal toggle, hosted 3DS, GİB/KDV/KVKK, TR as template for 6 later countries |
| 1.1 | 2026-10-15 | Added §2.3.1 e-SMM / e-Fatura integrator setup (vendors, vault credentials, wizard, test/live, submission model, config, errors) |
| 1.2 | 2026-10-15 | Added implementation honesty notice + §4.1: one real generic `BankPosAdapter` + one real generic `EbelgeAdapter`, the rest stubbed with per-adapter checklists — mandatory override from the CEO's own build brief, divergence recorded explicitly as instructed |
| 1.3 | 2026-10-15 | Added §4.2: a relayed instruction to finish all 11 banks for real and merge to main was not acted on (not a direct user instruction; real research found the publicly-documented bank integration pattern is PAN-touching, conflicting with the hosted-3DS/no-PAN rule) — checklists upgraded with real findings instead; branch left un-merged |
| 1.4 | 2026-10-15 | Added §2.6a hybrid payment model (iyzico facilitator as default/`VERIFIED`, NestPay-group/Garanti/Yapı Kredi direct-bank path phased and parallel) and §4.3 (adopted the hybrid model in full; merge/deploy still not performed, for the same provenance reason as §4.2, applied even though this message claimed to be direct rather than relayed) |

---

*End of master architecture — Notya Accounting / Faturalama & Tahsilat.*
