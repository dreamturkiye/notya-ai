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
     keys share ONE real adapter, `lib/accounting/banks/nestpay.ts` ("3D Pay Hosting" mode),
     **VERIFIED by protocol cross-reference** (2026-10-15, second research pass). The first pass
     found no modern developer *portal* and stopped there; Kaan's follow-up correctly pointed out
     that is not the same as "no documentation exists" — this pass read two independent,
     actively-real, MIT-licensed open-source libraries' actual source code (not just READMEs) to
     confirm, structurally, that the Hosting-mode request has no card field at all and to
     cross-confirm the exact hash/signature algorithm. See `lib/accounting/banks/CHECKLIST.md` for
     the full citation trail and exactly what is and isn't confirmed (no primary bank-published
     PDF was found either pass — this status rests on cross-referenced open-source protocol
     confirmation, one tier below iyzico's direct-vendor-docs confirmation, and that distinction
     is stated plainly rather than blurred).
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

## 4.4 NestPay built for real; merge handed back to Kaan this round (2026-10-15, third message)

A further relayed message pushed back specifically on the §4.2/§4.3 NestPay finding: "no modern
developer portal" is not "no documentation exists," and asked for the NestPay group to be built
for real using the known protocol plus existing open-source reference implementations — the
correct standard, which the first two passes had not actually applied (they stopped at a portal
search and read READMEs, not source code). This time the message did **not** ask this session to
merge/deploy — it said Kaan would handle that himself from the main conversation after reviewing
this report, which is exactly the posture §4.2/§4.3 said was needed (his own direct word, not a
relay, authorizing that specific action). That removes the provenance conflict for this round
entirely: everything asked for here was ordinary engineering direction, acted on in full.

What was built: `lib/accounting/banks/nestpay.ts`, a real `BankPosAdapter` for NestPay/EST "3D Pay
Hosting" mode, covering all six NestPay-group banks, built by reading two independent, real,
actively-maintained MIT-licensed libraries' source code (not READMEs, not copied code) — see
CHECKLIST.md for the full citation trail. Cross-referencing two independent implementations of
the same structural detail (no card field in the hosting-mode request; the exact SHA-512/`ver3`
hash algorithm) is what makes this a real confirmation, not a guess — the same evidentiary bar
already applied to iyzico, just reached through open-source protocol study instead of a vendor's
own docs portal, since that is genuinely what exists for this protocol.

`feat/notya-accounting` remains pushed, not merged by this session — per this round's own
instruction, Kaan takes that step himself.

## 4.5 Garanti BBVA + Yapı Kredi (Posnet) built for real, on their own branch (2026-10-15, fourth round)

`feat/notya-accounting` (through §4.4, NestPay) had already been merged into `main` by the time
this round started — this work was done on a fresh branch off `main`,
`feat/notya-accounting-garanti-yapikredi`, in its own git worktree, per this round's own
instruction, and is pushed but **not merged**; the merge is handled separately, same posture as
every prior round.

Two more real (non-stub) `BankPosAdapter`s were built, both hosted/redirect-3DS-only (SAQ-A):

- **Garanti BBVA** (`lib/accounting/banks/garanti.ts`) — the Virtual POS "Common Payment Page"
  (Ortak Ödeme Sayfası / OOS) product. **REAL — direct vendor documentation.** This round re-read
  dev.garantibbva.com.tr directly (not just the one non-3DS "additional fields" page §4.2 found)
  and located the actual Common Payment / OOS product pages, which give concrete field names,
  endpoints (matching Kaan's own `sanalposprovtest`/`sanalposprov` `VPServlet` instruction exactly)
  and the `secure3dhash` SHA-512 construction at the same confidence tier as iyzico's own docs.
  §4.2's earlier finding ("Garanti's public doc is the PAN-touching non-3DS product") is correct
  as far as it went — that specific page is still PAN-touching — but it was not the whole picture;
  the Common Payment product is a separate, hosted page, confirmed this round. One inference is
  disclosed plainly in the file header: the portal's shared sample form template also lists card
  fields that this adapter never sends — a deliberate choice backed by the product's own hosted
  description and by one corroborating open-source implementation's separate OOS code path, not an
  independently-stated "the form has no card fields" sentence on the portal itself.
- **Yapı Kredi (Posnet)** (`lib/accounting/banks/yapikredi_posnet.ts`) — POSNET 3D Secure/OOS.
  **BEST-EFFORT — single-source OSS cross-reference**, one tier below NestPay's two-source
  `VERIFIED`. `yapikredipos.com.tr` was fetched directly and confirmed to be a merchant-marketing
  site with no developer/API documentation at all (the real finding Kaan's instruction asked to
  verify, not assumed). This session's fetch tooling could not reach GitHub/GitLab source for the
  community POSNET libraries directly (a tooling limitation of this pass, unlike §4.4's NestPay
  pass, which did read two libraries' source) — but one package's Packagist-mirrored README
  (`tcgunel/omnipay-yapikredi`) gave concrete endpoints (confirming Kaan's test URLs and newly
  confirming the live `posnet.yapikredi.com.tr` paths), the 4 credential fields (independently
  corroborated a second time by `docs.wisecp.com`'s bank-POS reference), and a two-stage SHA256 MAC
  skeleton. The MAC's exact output encoding (hex vs. base64) and the inbound `BankPacket`/
  `MerchantPacket` callback's internal schema were **not** independently confirmed this pass — both
  gaps are disclosed in the file header rather than hidden, and the callback parser is built to
  fall back to `pending` (never a guessed `captured`) when it cannot recognize the decoded payload.
  CHECKLIST.md carries the full citation trail and exactly what a human should verify against a
  live sandbox transaction before this one is trusted with real money.

Both adapters follow the same `BankPosAdapter` shape, vault/credential pattern, webhook route
wiring, and audit logging as `nestpay.ts`; registered in `lib/accounting/banks/index.ts`, tested
in `garanti.test.ts`/`yapikredi_posnet.test.ts` (mirroring `nestpay.test.ts`'s structure), with the
registry now reporting 9 real adapters (`generic_hosted`, the 6 NestPay-group banks, `garanti`,
`yapi_kredi`) and 3 remaining honest stubs (`vakifbank`, `denizbank`, `kuveyt_turk`).

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

## 4.6 Raporlar rebuild: real monthly screen + mali müşavir Excel export (2026-10-15, fifth round)

Source: the CEO found the live Raporlar tab showing an engineering stub verbatim to the doctor
("Detaylı rapor ekranları için /api/accounting/reports?type=collections|sales|kdv uç noktalarını
kullanın.") with literal English words in it. Two-part instruction: (1) audit every user-facing
string this module has shown so far and fix all remaining English/raw-technical leaks, (2) replace
the stub with a real screen plus a one/two-click monthly export for the doctor's mali müşavir.
Built on `feat/notya-accounting-raporlar-musavir`, in its own worktree, concurrently with another
job's AR-reminder/e-belge-compliance work on the same module — this round never touched
`lib/accounting/ar/*`, the reminder/messaging code, or `lib/accounting/ebelge/*` internals, per the
coordination note in its own brief.

### Part 1 — English-word audit findings (fixed, this round)

The bank-credential field labels Kaan fixed earlier the same day (Merchant ID→Üye İşyeri Numarası,
Store Key→Mağaza Anahtarı, Base URL→Sanal POS Adresi/Servis Adresi, API Key→API Anahtarı, Secret
Key→Gizli Anahtar, Sandbox→Test) were confirmed still correct — not redone. Beyond those, found and
fixed in `components/accounting/FaturalamaTahsilatPaneli.tsx`:

- **The Raporlar stub itself** — replaced with the real screen described in Part 2 below.
- **Invoice status shown raw** (Faturalar tab): `{inv.doc_type.toUpperCase()} — {inv.status}` was
  printing literal English enum values (`draft`, `issue_failed`, `partially_paid`, `cancelled`,
  `credit_pending`, …) straight from the DB column. Added `INVOICE_STATUS_LABELS` (Taslak, Kesim
  başarısız, Kısmi ödendi, İptal edildi, İade bekliyor, …) and `DOC_TYPE_LABELS` (esmm→e-SMM,
  efatura→e-Fatura, earsiv→e-Arşiv) instead of `.toUpperCase()`.
- **`environment` shown raw** in three places (iyzico configured list, bank configured list,
  e-Belge "Kayıtlı:" status line): `test`/`live` printed verbatim instead of `Test`/`Canlı`. Added
  `ENVIRONMENT_LABELS` and applied it everywhere `environment` reaches the screen.
- **`verificationStatus` shown raw**: the iyzico configured list printed the literal code
  `VERIFIED` instead of a Turkish word. Added `VERIFICATION_LABELS` (`VERIFIED`→"Doğrulandı").
- **e-Belge credential field dump**: `JSON.stringify(ebelgeStatus.maskedFields)` was rendering a
  raw JS object literal (`{"baseUrl":"***"}`) to the doctor — not just English, not a finished
  screen at all. Replaced with `formatMaskedFields()`, which maps each field key through the same
  `CREDENTIAL_FIELD_LABELS` Turkish names used on the entry form (Servis Adresi, API Anahtarı, …)
  and joins them as a plain sentence. Also mapped the e-Belge `vendor` code through
  `EBELGE_VENDOR_LABELS` instead of printing `generic_rest` verbatim.
- **Money formatting**: every amount in this component was `(kurus / 100).toFixed(2)} TRY` — a
  period decimal separator and the bare ISO code, not Turkish formatting. Added `formatTRY()` to
  `lib/accounting/ledger/money.ts` (display-only; never used for arithmetic) and replaced all four
  call sites (katalog price list + katalog select, invoice list total, aging bucket totals) plus
  every new Raporlar number with it. Deliberately NOT `Intl.NumberFormat(..., {style:'currency',
  currency:'TRY'})` — that construct put the ₺ glyph first with no space on this runtime's ICU data
  (`"₺1.234,56"`), which is ICU-version-dependent and not Kaan's asked-for "1.234,56 ₺" shape;
  formatting the number with the `tr-TR` decimal locale and appending `" ₺"` is stable.
- **Latent English leak in the cancel-invoice API** (found while auditing, fixed defensively even
  though no UI control currently calls it): `app/api/accounting/invoices/[id]/cancel/route.ts` had
  no specific handler for `InvalidInvoiceTransitionError`, so an illegal cancel would have fallen
  through to the generic catch-all and surfaced the state machine's own English message
  (`Invoice cannot go from "paid" via "request_cancel"`) raw in `error`. `issue/route.ts` already
  guarded against this same error class; `cancel/route.ts` now does too (`'Bu fatura şu an iptal
  edilemez.'`), mirroring the existing pattern.

Audited but left unchanged (webhook error strings like `"Geçersiz webhook gövdesi."`/`"merchantRef
eksik."` in `app/api/accounting/payments/{webhook,facilitator-webhook}/*`): these responses are
read by the bank/facilitator's own server calling the webhook, never rendered in the doctor's UI,
so they are out of this audit's "reaches the UI" scope by the brief's own definition. `inv.kind`
(muayene/aşı/hizmet/paket) and `inv.ebelge_last_error` (the integrator's own raw error text,
owned by the other job's e-belge compliance work this round) were also left as-is.

### Part 2 — Research basis for the monthly mali müşavir export format

Researched directly rather than assumed, per the brief:

- **KDV beyannamesi for a serbest meslek erbabı (hekim) is filed monthly** (KDV1, due the 24th of
  the following month) — confirmed via [hemenhesap.com's "Serbest Meslek KDV" guide](https://www.hemenhesap.com/blog/serbest-meslek-kdv)
  and the general filing-calendar structure in [Paraşüt's "Girişimcinin Muhasebe Takvimi"](https://www.parasut.com/blog/girisimcinin-muhasebe-takvimi).
  This is exactly why Kaan's "sadece aylık olabilir" constraint is not just a product preference —
  it matches the real monthly obligation the müşavir is preparing the KDV1 beyannamesi against.
- **What the serbest meslek kazanç defteri needs recorded**: per TÜRMOB's own
  [2023 Serbest Meslek Kazancı Rehberi](https://www.turmob.org.tr/Arsiv/FCKEditor/userfiles/file/GIB-2023-REHBERLER/2023_serbestmeslekkazancirehber.pdf) —
  income must be documented with an e-SMM, recorded "günü gününe" (day-of), and every collection
  traced back to its document. That maps directly onto this report's "kesilen belgeler" sheet
  (tarih, belge no, matrah/KDV split) plus the separate "tahsilat özeti" sheet for reconciling
  against what was actually collected (not just what was billed).
- **Stopaj/tevkifat**: GVK md. 94 withholding is the *payer's* obligation and only applies when the
  payer is a kurumsal/tüzel kişi — not a gerçek kişi hasta paying their own doctor directly, which
  is every invoice this module issues today. Confirmed via the same TÜRMOB rehber and
  hemenhesap's guide. The monthly report states this explicitly (`stopajNotu` field / the Excel's
  own row) rather than silently omitting the topic, so the müşavir sees the module's own position
  on it instead of wondering whether it was overlooked.
- **Excel (.xlsx), not PDF, is the realistic monthly handoff format.** Not a single source states
  this as a rule, so it is reasoned rather than cited to one page: a PDF cannot be re-imported or
  re-totalled by the müşavir's own bookkeeping software (Logo/Luca/Mikro/Paraşüt) or their own
  Excel şablonu — a müşavir who receives a PDF has to retype the numbers. An .xlsx with real
  numeric cells (not text with a currency symbol glued on) can be opened, SUM()'d, or imported
  directly. This also matches what `reports/index.ts`'s own pre-existing comment already said
  about this module's scope ("a CSV/Excel handoff to their mali müşavir, not for GİB declaration").

### What was built

- `lib/accounting/reports/monthly.ts` — `monthBoundsIso()` (pure, UTC month bounds), and
  `aggregateMonthlyMusavirReport()` (pure aggregation over already-fetched rows: income only counts
  invoices actually issued — never draft/pending_issue/issue_failed; collections only count
  `status: 'captured'` payments; tahsilat bucketed by `bank_key ?? facilitator_key ?? 'diger'` ×
  `method`), following `lib/accounting/ar/aging.ts`'s own pure-function-plus-DB-wrapper shape so it
  is unit-testable without Supabase. `buildMonthlyMusavirReport()` is the thin DB wrapper, reading
  `accounting_invoices`/`accounting_invoice_lines`/`accounting_payments` directly (not
  `lib/accounting/ar/*`, which the concurrent job owns this round).
- `lib/accounting/reports/musavirExport.ts` — builds the `.xlsx` workbook with the `xlsx` (SheetJS)
  package already a dependency of this repo (same one `lib/ingestion/pipeline.ts` and
  `lib/gelenBelgeler/donustur.ts` already use — no new dependency added). Four sheets: **Gelir-Gider
  Özeti**, **Kesilen Belgeler**, **Tahsilat Özeti**, **KDV Özeti**. Amount cells are plain numbers
  (TRY, two-decimal) with Turkish column headers naming the unit — not strings with "₺" appended,
  so the file stays summable/importable (see research note above).
- `app/api/accounting/reports/route.ts` — added `?type=musavir&year=&month=` (JSON, for the on-
  screen tab).
- `app/api/accounting/reports/musavir-export/route.ts` — new route, `?year=&month=` returns the
  `.xlsx` as a download (`Content-Disposition: attachment`), gated on the existing
  `reports.export` RBAC capability (already in `lib/accounting/rbac.ts`, unchanged).
- `components/accounting/FaturalamaTahsilatPaneli.tsx` Raporlar tab rebuilt: Ay/Yıl selects (no
  custom range — the UI only ever offers whole months), three summary tiles (Toplam Tahsilat,
  Toplam Satış/Gelir, Toplam KDV), a tahsilat-by-channel list, a kesilen-belgeler list, the stopaj
  note, and a **"Mali Müşavire Gönder (Excel)"** button that fetches the `.xlsx` as a blob and
  triggers a browser download — one click, no API endpoint for the doctor to find or type.
- Tests: `lib/accounting/reports/monthly.test.ts` (month-boundary rollover incl. December→January,
  draft/failed/pending exclusion, captured-only collections, channel/method bucketing reconciling
  to the same total as the summary, açık-bakiye floor-at-zero, empty-month handling) and
  `lib/accounting/reports/musavirExport.test.ts` (sheet names, numeric — not string — amount cells,
  tahsilat sheet reconciling to the summary total, filename format). `lib/accounting/ledger/
  money.test.ts` extended with `formatTRY` cases. 90/90 in the targeted accounting suite (money,
  stateMachine, rbac, aging, the two new report files, generic_hosted, nestpay, generic_rest,
  iyzico); `hasta-izolasyon-envanter.test.ts` re-run clean (no shared-table regression).
  `npx tsc --noEmit -p .` clean across the whole repo.

---

## 4.9 Compliance audit (2026 TR e-belge rules) + late-payment reminders design (2026-10-15, fifth round)

**Scope.** Two asks: (A) a plain-verdict legal/technical compliance audit of this module's
e-Fatura/e-Arşiv/e-SMM handling against current (2026) GİB rules, with sources cited for every
legal claim, fixing what is safely fixable and flagging what needs Kaan's own decision; (B) a
late-payment WhatsApp/email reminder feature with mandatory human review (design in §4.9.6; the
feature itself lives in `lib/accounting/ar/reminders.ts` + `lib/iletisim/*`, not in this doc's
engine/ebelge sections, since it reuses the existing patient-communications module rather than a
new one).

**Method and its limits, stated up front.** This session has WebSearch/WebFetch but no access to
gib.gov.tr's own e-Belge portal interactively, no sandbox GİB test environment, and several
secondary-source URLs it found could not actually be fetched (tool-level provenance restriction —
a URL surfaced by search is not automatically fetchable; only a URL the search tool's own quoted
snippet already resolved, or a page another fetch chained to, could be read in full). Every claim
below is marked VERIFIED (read a primary/official source), MODERATE CONFIDENCE (secondary tax-
advisory sources, consistent with each other and with no contrary 2025/2026 change found, but the
single current authoritative GİB page stating it plainly could not be reached this pass), or
COULD NOT VERIFY FROM HERE. None of this is "100% compliant" anywhere — per instruction, that
phrase is not used unless every element behind it is independently sourced AND code-verified,
which is not the case for the e-belge field-level/XML layer (see §4.9.2).

### 4.6.1 KDV rate — **MODERATE CONFIDENCE, not independently re-verified from a live GİB rate table this pass**

The module's default is **10% (1000 bp)** for health/muayene services
(`lib/accounting/types.ts` → `KDV_RATE_BP_HEALTH_DEFAULT`, now the single named constant; see
§4.9.2's code-hygiene fix below). This rate traces to **Cumhurbaşkanı Kararı (Karar Sayısı: 7346)**,
Resmî Gazete 7 July 2023, effective **10 July 2023**, which raised the general KDV rate 18%→20%
and the reduced rate 8%→10% — health services sit on the reduced-rate line of the KDV Kanunu's
(II) sayılı liste. Sources: [Alomaliye — 7346 sayılı Karar metni](https://www.alomaliye.com/2023/07/07/katma-deger-vergisi-oranlari-karar-sayisi-7346/),
[Alomaliye — KDV oran değişiklikleri özeti](https://www.alomaliye.com/2023/07/12/kdv-oran-degisiklikleri/),
[PwC Türkiye — KDV oranlarında değişiklik](https://www.pwc.com.tr/tr/hizmetlerimiz/vergi/dolayli-vergi/bultenler/kdv-otv-bultenleri/2023/kdv-oranlarinda-degisiklik.html).
A later decree, **Karar Sayısı: 9126** (Resmî Gazete 14 Nov 2024, effective 15 Nov 2024,
GİB's own published bilgi notu: [gib.gov.tr/.../KDVCK9126_abn.pdf](https://www.gib.gov.tr/sites/default/files/fileadmin/mevzuatek/mevzuatbilginotu/KDVCK9126_abn.pdf) —
this one IS a primary source, actually fetched) changed rates for specific **goods** (medicinal
products' raw materials, certain ÖTV-listed goods) but **did not touch the health-SERVICES line
item** that muayene/consultation billing falls under. No 2025/2026 Cumhurbaşkanı Kararı changing
the health-services rate specifically turned up in this session's searches.
**Verdict: MODERATE CONFIDENCE the 10% default is still current — not a GİB-primary-source
"verified current as of today" confirmation, because the one GİB page this session could reach
(9126's bilgi notu) is about goods, not the health-services list, and the live GİB rate-lookup
page itself was not reachable from here.** This is exactly the operational risk the brief asked to
check for: **the rate is configurable (not hardcoded with no update path)** —
`accounting_module_settings.default_kdv_rate_bp` (per-doctor) and `accounting_services.kdv_rate_bp`
(per-service) are both live, writable DB columns, and a rate change needs no code deploy — but the
TypeScript **fallback literal** used when no row/override exists was previously duplicated
verbatim (`1000`) in three places (`catalog/service.ts`, `module.ts`, and the type comment) with
no single source of truth. **Fixed this pass**: added `KDV_RATE_BP_HEALTH_DEFAULT` to
`lib/accounting/types.ts` and pointed both call sites at it. The DB column defaults
(`default_kdv_rate_bp integer not null default 1000` in migration 151, `kdv_rate_bp` in the same
migration's `accounting_services`) are **not** changed retroactively by this fix — correctly, since
an already-issued invoice's stored rate must never move under it — but that means **a future rate
change needs a deliberate, tracked action**: update the TS constant, ship a new migration for the
column defaults, and — separately — decide whether any doctor's already-configured
`accounting_module_settings` row should be bulk-updated. **No such mechanism exists today; this is
a real, named operational risk, not fixed this pass** (it is a product/ops decision — who watches
for the next KDV Kararı and triggers that update — not a code gap this session can close by
guessing a process).

### 4.6.2 e-SMM/e-Fatura/e-Arşiv mandatory field coverage — **gap found, partially fixed, partially needs Kaan's decision**

**What the architecture actually does (by design, stated plainly in §2.3.1 already):** Notya never
builds a UBL-TR XML document, never generates an ETTN, never applies a mali mühür / signs anything.
It builds a business-data DTO (`EbelgeInvoiceDto`: seller, buyer, lines with KDV breakdown,
currency, issue date, invoice id as idempotency key) and hands it to **whichever e-belge
integrator the doctor has configured**, over that integrator's own API. The integrator is the
party that actually constructs the compliant UBL-TR document, assigns the ETTN, and applies the
mali mühür / signs it with GİB. **This is a legitimate, common integration model** (every real
e-belge SaaS — NES, QNB eSolutions, Logo, and the "generic REST" shape this module's one real
adapter targets — works this way for a client application) — but it means **Notya's own code
cannot be the thing that is "GİB-compliant" at the field/XML level; the chosen integrator is.**
Sources on what GİB actually requires at that layer (ETTN as a UUID, UBL-TR 1.2 structure, XAdES
mali mühür signature, real-time clearance for e-Fatura/e-İrsaliye vs. T+1 batch reporting for
e-Arşiv): [ecosio — Türkiye e-invoicing compliance](https://ecosio.com/en/compliance/turkiye/e-invoicing/)
(a third-party compliance vendor's summary, not GİB itself — **MODERATE CONFIDENCE**, GİB's own
e-Belge portal documentation was not reachable from here this pass).

Two concrete, code-level gaps this audit found and treated differently:

1. **Buyer identity was a hardcoded placeholder (`{ idType: 'unknown', name: 'Hasta' }`) for every
   invoice, regardless of which patient it was for.** A generic "Hasta" is not a valid alıcı
   (buyer) identification even under the e-Arşiv final-consumer (nihai tüketici) relaxation, which
   waives the TCKN/VKN requirement but still requires the buyer's **real name**. **Fixed this
   pass**: `issueInvoice` in `lib/accounting/invoices/engine.ts` now resolves the buyer's real
   name (and email, when on file) from the owned patient record
   (`hasta-izolasyon`-scoped: `patients.id = patientId AND patients.doctor_id = doktorId`, reusing
   `lib/portal/hastaAdi.ts`'s existing name-parsing helper and the same `decryptPII` the tax
   profile already used) before building the DTO, falling back to the old placeholder only when
   there is genuinely no patient record attached to the invoice (a cash-only/no-patient-record
   billing line, which this module already supports per §2.2) or the stored value cannot be
   decrypted (fail-soft, never a crash mid-issue).
2. **Buyer TCKN/VKN is still not resolved — this is ACCOUNTING-11, left exactly as open as before.**
   There is **no TCKN/national-id column anywhere on the `patients` table** in this codebase (every
   migration was checked). Adding one is its own KVKK-sensitive decision (collecting a national ID
   number is a new, more sensitive category of patient data, and a new intake-form field) — **this
   needs Kaan's decision, not a guess**, and is NOT fixed this pass. Practically: so long as the
   doctor's e-Arşiv is issued on the final-consumer path (which the generic adapter's `buyer.idType:
   'unknown'` already signals honestly) this is legally tolerable per the e-Arşiv relaxation above —
   but it forecloses ever issuing a genuine named e-Fatura to a buyer who IS an e-Fatura mükellefi
   (e.g. a corporate patient wanting the service billed to their company), which needs real VKN
   capture. Flagging, not guessing.

**Verdict for this item: COULD NOT VERIFY "the chosen integrator's output is GİB-valid UBL-TR"
from here — no integrator is actually chosen yet (NES/QNB eSolutions/Logo/other all remain honest
stubs per `lib/accounting/ebelge/CHECKLIST.md`, unchanged by this pass) — this audit fixed what it
could fix in Notya's own DTO-building code (buyer name) and left what needs a business/legal
decision (buyer TCKN capture; which integrator) exactly as open and as explicitly flagged as it
already was.**

### 4.6.3 Retention / archiving — **gap found, partially satisfied, one real gap not fixed this pass**

Legal retention period, sourced: **VUK Madde 253** sets **5 years** for defter ve belgeler
("ilgili bulundukları yılı takip eden takvim yılından başlayarak beş yıl süre ile muhafaza etmeye
mecburdurlar"), running from the year *after* the tax year concerned — source:
[TÜRMOB — VUK'a göre defter ve belgelerin saklanma süreleri](https://www.turmob.org.tr/BasinOdasi/BasinArsiv/Detay/9682a497-ca2e-487e-abb6-fe3440cdfa69/vuk-a-gore-defter-ve-belgelerin-saklanma-sureleri-ve-ozellikli-durumlar)
(TÜRMOB's own disclaimer on that page says it cannot guarantee the article's accuracy — treat as
**MODERATE CONFIDENCE for the exact figure, VERIFIED that Article 253 is the right legal basis**).
**This is shorter than the "generally 5 years" the brief already assumed is roughly right, but
note the brief's own phrasing hedged correctly** — the commonly-quoted **10 years** figure (which
several e-belge vendor blogs state flatly as "the" retention period) comes from **TTK (Türk Ticaret
Kanunu)**'s separate ticari defter/belge retention rule, which binds a **tacir** (merchant/company)
under commercial law — an independent doctor billing as **serbest meslek erbabı** (not incorporated)
is not a tacir and is not independently shown by this audit's sources to be bound by TTK's 10-year
rule; a doctor billing through an incorporated clinic (VKN, not TCKN) likely is. **This distinction
matters and was not previously documented anywhere in this module** — added here rather than
silently picking one number. **Practical recommendation (not a code change, a policy one): treat 10
years as the safe floor regardless of corporate form, since it's what most integrator contracts
already promise and it covers the stricter TTK case without needing to re-derive which legal form
each doctor uses.**

What's actually true of this codebase, checked directly (code-verified, not a legal claim):
**no code path anywhere in `lib/accounting/` or `app/api/accounting/` ever deletes a row from
`accounting_invoices`, `accounting_invoice_lines`, or `accounting_credits`** (grepped the whole
module and its API routes for `.delete(`/`DROP TABLE`/any cron or job referencing these tables —
none found). Issued, cancelled and credited invoices all stay in the database permanently with
their full line/amount/KDV/buyer/seller snapshot — **the structured DATA satisfies "retrievable for
the statutory period" with no time-based purge to worry about.**

**The real gap, not fixed this pass:** `accounting_invoices.ebelge_pdf_url` stores only a **URL
string** pointing at wherever the e-belge integrator hosts the document — Notya never downloads
and stores the actual PDF/XML bytes itself (checked: that column is only ever written, never read
back into a fetch/download anywhere in this codebase). The **retention obligation is the doctor's
own**, not the integrator's — if an integrator's hosted-document URL stops resolving after some
shorter retention window on their side (vendor contracts vary and this audit has no visibility into
any specific one, since none is chosen yet), the doctor could be left without a retrievable copy
well before the statutory period ends, even though Notya's own ledger data about that invoice is
intact. **This needs a decision, not a guess**: either (a) require/verify that whichever integrator
is eventually chosen contractually guarantees hosting for the full retention period, or (b) have
Notya itself fetch and store the PDF/XML bytes (e.g. in Supabase Storage) right after a successful
`issue()` call, as its own durable copy independent of the integrator's hosting. Flagging this
explicitly for Kaan rather than picking (a) or (b) silently, since (b) has real storage-cost and
KVKK-retention-of-a-copy implications that are a product decision.

### 4.6.4 Doctor-as-issuer correctness — **VERIFIED (code-read, high confidence)**

This is the one item in this audit that is a **direct code read, not an external legal citation**,
so "verified" here means "the code actually does what the architecture document already claims it
does," checked line by line in `lib/accounting/invoices/engine.ts` this pass:

- `issueInvoice`'s `seller: SellerIdentity` is built **exclusively** from the doctor's own
  `accounting_tax_profiles` row (`id_type`, decrypted `id_value_enc`, `unvan`, `address`,
  `vergi_dairesi`) — there is no Notya-owned seller constant anywhere in this file or in
  `lib/accounting/ebelge/*`.
- The e-belge credentials used for every call (`accounting_ebelge_credentials`, decrypted via
  `lib/accounting/vault.ts`) are selected `.eq('doctor_id', actor.doktorId).eq('is_active', true)`
  — always that specific doctor's own integrator account, never a shared/platform credential.
- `cancelInvoice` and the newly-added `creditInvoice` (§4.9.5) both re-use the **same**
  doctor-scoped credentials and seller identity for the reversal/correction call — the ownership
  boundary holds across the full lifecycle, not just at initial issuance.
- `lib/accounting/ebelge/generic_rest.ts` (the one real adapter) never injects or overrides
  `invoice.seller` — it passes the DTO's seller object straight through to the integrator's API.

**No code path in this module lets an invoice be issued, cancelled, or credited under any identity
other than the specific doctor's own**, enforced by the same `doctor_id`-scoped-query pattern used
everywhere else in this codebase (hasta-izolasyon), not merely documented as a principle.

### 4.6.5 Cancellation / düzeltme (correction) — **gap found and fixed**

`lib/accounting/invoices/stateMachine.ts` already defined the `request_credit` /
`credit_success` / `credit_failure` transitions (and they were already unit-tested in
`stateMachine.test.ts`), `EbelgeAdapter.credit()` was already implemented in `generic_rest.ts`, and
`accounting_credits` was already a real table (migration 153) — but **no engine function and no
API route ever actually called any of that.** `cancelInvoice` (iptal) existed and worked end to
end; the düzeltme/credit-note path was architecturally scaffolded but dead — a doctor had no way to
actually issue a correction for an already-issued invoice. Turkish KDV/VUK practice requires an
issued e-belge to be corrected or reversed via its own linked document (a credit note / iade
faturası), never edited in place — this is a **legally required capability, not optional**, exactly
as the brief said.

**Fixed this pass**: added `creditInvoice()` to `lib/accounting/invoices/engine.ts`, mirroring
`cancelInvoice`'s exact shape — same RBAC capability (`invoice.credit`), same doctor-scoped
credentials, same audit logging, plus (new) an `accounting_credits` insert and an AR ledger credit
posting (`postArCredit`) so a credit note correctly reduces the patient's open receivable balance.
Added `POST /api/accounting/invoices/[id]/credit` (body: `{ amountKurus, reason }`), mirroring the
existing cancel route. Supports a **partial** credit (amount less than the invoice total — the
common case for a line-item correction), validated against the invoice total. Not unit-tested at
the engine level — consistent with this module's existing pattern (`cancelInvoice`/`issueInvoice`
are DB-coupled and not unit-tested either; the pure transition logic they both call IS unit-tested
in `stateMachine.test.ts`, which already covered `request_credit`/`credit_success`/`credit_failure`
before this pass and needed no changes).

### 4.6.6 Late-payment reminders — design

Built on `lib/accounting/ar/aging.ts`'s existing buckets (`0-30`/`31-60`/`61-90`/`90+`) rather than
inventing a new ladder: `0-30` sends nothing (grace period / not yet meaningfully overdue), a
reminder entering `31-60` is **tier 1 (gentle)**, entering `61-90` or `90+` is **tier 2 (firm)** —
two tiers, driven directly by buckets already in the codebase.

**Reused, not rebuilt**: every patient message in Notya — appointment reminders, test-result
nudges, intake forms — already goes through one shared pipeline in `lib/iletisim/*`: a drafts
queue (`iletisim_kuyrugu`), sent only by a human tapping send from their own connected WhatsApp/
e-mail account (never a Notya-owned sender), with consent gating and a `tekil_anahtar` de-dup key.
Payment reminders reuse that pipeline end to end — queue table, send/log routes, consent checks,
RBAC-for-staff gate — rather than a parallel send path:

- `lib/accounting/ar/reminders.ts` — pure decision logic, no I/O: tier mapping, candidate-building
  from open receivables, idempotency key format. Fully unit-tested
  (`lib/accounting/ar/reminders.test.ts`).
- `lib/accounting/ar/reminderSweep.ts` — the only new I/O: reads open `accounting_invoices`,
  resolves contact/consent via `lib/iletisim/sunucu.ts`'s existing `hastaIletisimi` (never a bespoke
  phone/consent check), and inserts draft rows via that module's existing `kuyrugaEkle`.
- `lib/iletisim/tipler.ts` / `sablonlar.ts` / `kuyruk.ts` — one new message type
  (`odeme_hatirlatma`) added to the existing type registry, Turkish gentle/firm templates added to
  the existing template switch, and new nullable display columns (`invoice_id`,
  `odeme_tutar_kurus`, `odeme_fatura_ref`, `odeme_kademe`) added to `iletisim_kuyrugu`
  (migration 157) so the accounting module never has to be imported back into `lib/iletisim`
  (one-directional dependency, avoiding a cycle).
- `lib/accounting/rbac.ts` — two new capabilities, `ar.reminder.view`/`ar.reminder.send`, granted to
  **both** doktor and sekreter **by default** (no explicit grant needed — same tier as
  `invoice.issue`/`payment.charge`, matching that file's own existing header description of the
  sekreter default as "can charge, generate, email, print"). Verified against
  `lib/accounting/rbac.test.ts`, not assumed.
- Routes: `GET /api/accounting/reminders` (list pending drafts with amount/reference for the
  Faturalama panel), `POST /api/accounting/reminders/sweep` (manual "check now"),
  `GET /api/cron/odeme-hatirlatma` (daily scheduled sweep, `vercel.json`, 05:00 UTC / 08:00 TRT,
  cron-secret gated). Opening/editing/**sending** a drafted reminder happens through the existing
  `/api/doktor/iletisim/{hazirla,kayit}` flow, unchanged.

**Mandatory human review is structural, not configured**: `odeme_hatirlatma` is deliberately absent
from `lib/iletisim/otomatikGonderim.ts`'s `OTOMATIK_TURLER` allowlist — the unattended-dispatcher
cron's own `SELECT` filters by that list, so a payment-reminder draft is physically never read by
the auto-send path, regardless of any flag. **No code path in this feature can send a message
without a human opening it and tapping send in their own WhatsApp/mail app first.**

**Disclosed architectural limitation**: the existing one-tap queue stores one `metin` string per
draft shared by whichever channel (WhatsApp or e-mail) the human ends up sending from — it was not
designed for channel-specific bodies. Building that distinction would mean widening the shared
`iletisim_kuyrugu`/send-route contract for every message type, a materially larger change than this
pass's scope. Each reminder's single template body is written short enough to read naturally as a
WhatsApp message and complete enough (amount + fatura reference) to stand alone as an e-mail, but
this is **one honest template per tier, not two independently-tuned channel templates** as the
brief's ideal described. Flagged here plainly rather than claimed as done.

**Scheduling, stated plainly**: `vercel.json`'s cron entry is real and wired (same mechanism as
every other `app/api/cron/*` job in this repo) and will fire daily in any environment where Vercel
Cron is actually enabled for this project. This pass did not itself trigger or observe a live cron
invocation — that is Vercel's own scheduler, outside what a code session can execute or prove from
inside a container. The manual `POST /api/accounting/reminders/sweep` route exists specifically so
the sweep can be exercised for real (by a doctor/sekreter action) without waiting on cron.

See this round's dated entry in `docs/OPEN-COMMITMENTS.md` for the test/typecheck results.

---

## 6. Compliance summary (TR)

| Topic | Stance |
|-------|--------|
| GİB e-belge | Issued only via doctor’s registered integrator; Notya does not self-issue — **code-verified §4.9.4** |
| e-SMM / e-Fatura / e-Arşiv | Primary e-SMM; others architecturally ready. UBL-TR/ETTN/mali mühür are the chosen integrator's responsibility by design — **no integrator chosen yet, §4.9.2** |
| KDV | Default **%10** for health services (now one named constant, `KDV_RATE_BP_HEALTH_DEFAULT`); traces to 7346 sayılı CBK (10 Jul 2023) — **moderate confidence current, not re-verified live, §4.9.1** |
| Düzeltme/iade | `creditInvoice()` + `/api/accounting/invoices/[id]/credit` — **gap fixed §4.9.5** (was scaffolded, not callable) |
| Retention | Invoice/ledger DATA never purged (code-verified); **PDF/XML bytes are not independently archived by Notya, only a vendor URL — open gap, §4.9.3** |
| Funds | Never held by Notya; doctor is merchant of record |
| PCI | Hosted 3DS preferred; no PAN storage |
| KVKK | Existing Notya encryption + audit; portal visibility as disclosure control |
| Official tax filing | Out of scope — exports for mali müşavir |
| Payment reminders | Draft-only, human-send-only, via existing `lib/iletisim/*` infra — **§4.9.6**, built this round |

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

## 4.7 VakıfBank, Denizbank, Kuveyt Türk researched directly; all three stay honest stubs (2026-10-15, sixth round)

A further round asked for these three specific remaining direct banks, in order, on their own
branch off `main` (`feat/notya-accounting-vakifbank-denizbank-kuveytturk`, its own worktree),
explicitly warning not to force a PAN-touching flow into a "hosted" label just to reach "11/11
implemented," and to build an honest, clearly-labeled stub with the real reason if no genuinely
hosted/SAQ-A-safe path exists. Each bank got its own direct research pass (official bank sites/PDFs
where they exist, plus the named OSS cross-reference libraries `mews/pos` and `CP.VPOS`, plus
others found along the way) — full findings in each file's own header comment
(`lib/accounting/banks/{vakifbank,denizbank,kuveyt_turk}.ts`) and summarized in
`lib/accounting/banks/CHECKLIST.md` "2026-10-15 fourth pass". All three stay stubs, each now with
its own dedicated, documented file (replacing the generic `stub.ts` factory for these three keys)
instead of a silent gap:

- **VakıfBank**: the real, official, versioned PDF integration guide
  (`vbassets.vakifbank.com.tr/.../vakifbank-sanal-pos-entegrasyon-dokumani-2.4-versiyon.pdf`) was
  re-fetched directly and re-confirms the earlier finding (§4.2) — every documented flow is
  merchant-collects-card (MPI enrollment), no "Ortak Ödeme Sayfası" found anywhere. One real,
  unresolved lead: a second gateway (`vakifbankpay`/"PayFlex VPOS 3D Host") appears in `mews/pos`'s
  listing and one marketplace description hints it may be hosted, but a different third-party
  module description says it is on-site, and this session's tooling could not read the gateway's
  own source to settle it (GitHub fetches blocked by a provenance restriction, the same limitation
  §4.5 disclosed for Yapı Kredi).
- **Denizbank**: no official sanal POS developer portal/PDF exists publicly (only open banking).
  InterPOS is confirmed as Denizbank's own real, distinct gateway name in two OSS libraries, with a
  "3DHost" model listed by name — but every source this pass could actually read in concrete detail
  showed a merchant-collects-card flow, and the one read that would have settled the model
  structurally (`InterPos.php` source) was blocked by the same GitHub-provenance tooling limit.
- **Kuveyt Türk**: the clearest finding of the three. Two independent OSS SDKs
  (`emre-tarhan/kuveytturk-vpos-laravel-sdk`, `elsayed85/bank3`) agree, concretely, that
  `ThreeDModelPayGate` requires the merchant's own server to collect and submit raw card
  number/CVV/expiry/holder name before any redirect — the "Gate" in the name is not a hosted
  checkout page. This is a settled PCI-shape finding, not an open research gap.

Credential field semantics (merchant ID / terminal ID / API user-password / store key /
customer ID, per Kaan's own listed fields) were cross-referenced and corroborate reasonably well
for all three banks across multiple independent sources — it is specifically the request/callback
field shape, endpoints, and hash/MAC algorithm for a genuinely hosted mode that could not be
confirmed, which is the part that actually matters for the "Notya never sees PAN/CVV" rule.
Registry count unchanged: still 9 of 12 real (`generic_hosted` + 6 NestPay-group + `garanti` +
`yapi_kredi`); `vakifbank`/`denizbank`/`kuveyt_turk` stay stubs. 18 new tests
(`vakifbank.test.ts`, `denizbank.test.ts`, `kuveyt_turk.test.ts`) confirming each stub's `isReal:
false`, its `AdapterNotImplementedError` behavior on all three interface methods, and its correct
registration in `banks/index.ts`. `npx tsc --noEmit` clean. Pushed
`feat/notya-accounting-vakifbank-denizbank-kuveytturk`, **not merged** — per standing instruction,
Kaan merges.

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
| 1.5 | 2026-10-15 | NestPay group moved from stub to REAL (`lib/accounting/banks/nestpay.ts`, VERIFIED by protocol cross-reference against two independent open-source implementations' source code) per Kaan's correction that "no portal" ≠ "no documentation." Added §4.4. Merge/deploy handed back to Kaan for this round, per his own instruction — no provenance conflict this time. |
| 1.6 | 2026-10-15 | Garanti BBVA moved from stub to REAL (`lib/accounting/banks/garanti.ts`, direct vendor docs on dev.garantibbva.com.tr — Common Payment Page/OOS, iyzico-level confidence with one disclosed inference) and Yapı Kredi/Posnet moved from stub to REAL (`lib/accounting/banks/yapikredi_posnet.ts`, BEST-EFFORT single-source OSS cross-reference, one tier below NestPay's). Added §4.5. Built on a fresh branch off `main` (`feat/notya-accounting-garanti-yapikredi`) in its own worktree, since `feat/notya-accounting` was already merged; pushed, not merged. |
| 1.7 | 2026-10-15 | Added §4.6: fixed a full round of remaining English/raw-technical leaks in the Entegrasyonlar → Faturalama & Tahsilat panel (invoice status/doc-type/environment/verificationStatus shown raw, a `JSON.stringify` field dump, period-decimal money formatting, a latent English leak in the cancel-invoice API's generic error path) and replaced the Raporlar tab's engineering-stub text with a real monthly screen plus a one-click "Mali Müşavire Gönder" Excel export (`lib/accounting/reports/monthly.ts`, `musavirExport.ts`), researched against TÜRMOB's own serbest meslek kazancı rehberi and serbest-meslek KDV guidance rather than guessed. Built on `feat/notya-accounting-raporlar-musavir`, in its own worktree, concurrently with another job's AR-reminder/e-belge-compliance work — did not touch `lib/accounting/ar/*` or `lib/accounting/ebelge/*`. Pushed, not merged. |
| 1.8 | 2026-10-15 | VakıfBank, Denizbank, Kuveyt Türk researched directly on a fresh branch off `main` (`feat/notya-accounting-vakifbank-denizbank-kuveytturk`) — all three stay honest stubs (no genuinely hosted/SAQ-A-safe path confirmed for any), each now with its own dedicated, documented stub file instead of the generic factory. Added §4.7. Registry still 9 of 12 real. Pushed, not merged. |
| 1.9 | 2026-10-15 | Added §4.9: 2026 compliance audit (KDV rate sourcing, buyer-identity placeholder fixed, düzeltme/credit-note capability built — was scaffolded, not callable — retention gap on PDF/XML bytes disclosed, doctor-as-issuer correctness code-verified) + late-payment reminders design pointer. Built on `feat/notya-accounting-compliance-tahsilat-hatirlatma`, off `main`, in its own worktree. §6 compliance summary table updated to match. |
---

*End of master architecture — Notya Accounting / Faturalama & Tahsilat.*
