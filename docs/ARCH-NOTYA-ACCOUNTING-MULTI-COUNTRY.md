# Notya Accounting – Multi-Country Template (TR reference for US, UK, Canada, Uzbekistan, Australia, New Zealand)

> Status: Standing template · Version 1.0 · 2026-10-15
> Parent doc: [`ARCH-NOTYA-ACCOUNTING.md`](./ARCH-NOTYA-ACCOUNTING.md)
> Scope: Accounting module (Faturalama & Tahsilat) under **Entegrasyonlar**

## 1. Reference implementation

The **Turkish implementation is the reference Country Billing Kit (CBK)**. All shared core abstractions are designed, built and hardened against Türkiye first (e-SMM / e-Fatura / e-Arşiv via the doctor's private integrator, doctor-owned sanal POS, KDV, KVKK).

**Once the Turkish side is complete and stable**, the same architecture will be extended to six countries:

1. United States
2. United Kingdom
3. Canada
4. Uzbekistan
5. Australia
6. New Zealand

"Stable" means: TR CBK in production for paying doctors, e-belge submission and payment reconciliation passing without manual intervention, and the core interfaces frozen (no breaking changes to adapter contracts for one release cycle).

## 2. What reuses cleanly from the Turkish core

| Core component | Reuse | Notes |
|---|---|---|
| Module shell (Entegrasyonlar → Faturalama & Tahsilat, feature flag, onboarding wizard frame) | As-is | Wizard steps are supplied by each CBK. |
| Invoice engine (drafts, line items, numbering, PDF, credit notes, versioning) | As-is | Numbering format and mandatory fields come from CBK rules. |
| Receivables (balances, partial payments, aging, reminders, reconciliation) | As-is | Currency and rounding per CBK. |
| RBAC (doctor, assistant/secretary, accountant, clinic admin) | As-is | Country may add roles (e.g. US biller). |
| Patient portal flag (view/pay invoices) | As-is | Language/locale per country. |
| Encrypted vault (per-tenant credentials, KMS envelope encryption, rotation, audit) | As-is | Stores each country's processor/e-invoice/tax credentials. |
| Adapter pattern (`TaxAdapter`, `PaymentAdapter`, `EDocumentAdapter`, status tracking, retries, webhooks) | As-is | New countries = new adapter implementations only. |
| Document status machine and error handling | As-is | Country-specific error codes mapped to shared statuses. |
| Principle: Notya never issues documents or collects funds in its own name | As-is | Doctor/clinic is always the issuer and merchant of record. |

## 3. Country-specific work

### 3.1 United States
- **Payments:** Doctor-owned Stripe (Connect Standard) or Square; card + ACH; patient portal pay links. Consider HSA/FSA card acceptance.
- **Invoicing / e-document:** No federal B2C e-invoicing mandate. Patient statements/superbills (CPT/ICD-10 codes) instead of tax invoices. Insurance claims (837/835 via clearinghouse) are a separate, later phase.
- **Tax:** Medical services generally exempt from state sales tax; rules vary by state, so keep a per-state rate table (default 0% for medical services).
- **Compliance:** HIPAA (BAA with processors and hosting), PCI DSS via hosted fields, state privacy laws.

### 3.2 United Kingdom
- **Payments:** Doctor-owned Stripe / GoCardless (Direct Debit) / SumUp.
- **Invoicing / e-document:** No B2C e-invoicing mandate today; monitor HMRC e-invoicing consultation. Plain compliant VAT invoices/receipts.
- **Tax:** Medical care by registered health professionals generally VAT-exempt; cosmetic/non-medical services may be standard-rated (20%). Rate table must flag exempt vs taxable service types. Making Tax Digital integration optional (export to Xero/QuickBooks).
- **Compliance:** UK GDPR, ICO registration, GMC/CQC-related record keeping.

### 3.3 Canada
- **Payments:** Doctor-owned Stripe / Moneris / Square; Interac e-Transfer as an option.
- **Invoicing / e-document:** No national e-invoicing mandate. Receipts suitable for patient insurance claims. Provincial health plan (OHIP, MSP, RAMQ etc.) billing out of scope for MVP.
- **Tax:** Most health services GST/HST-exempt; taxable services need GST/HST/PST/QST by province. Per-province rate table.
- **Compliance:** PIPEDA plus provincial health privacy acts (PHIPA in Ontario, etc.); Quebec Law 25; data residency preferences.

### 3.4 Australia
- **Payments:** Doctor-owned Stripe / Tyro / Square; Medicare/private health rebates via Tyro or similar is a later phase.
- **Invoicing / e-document:** Peppol e-invoicing available (mainly B2B/B2G), not mandatory for B2C. Tax invoices with ABN.
- **Tax:** Most medical services GST-free; cosmetic services may attract 10% GST.
- **Compliance:** Privacy Act 1988 / APPs, My Health Records rules where applicable.

### 3.5 New Zealand
- **Payments:** Doctor-owned Stripe / Windcave; bank transfer common.
- **Invoicing / e-document:** Peppol e-invoicing available, not mandatory for B2C. Taxable supply information (GST invoices) with GST number.
- **Tax:** GST 15% generally applies to private health services (fewer exemptions than AU); confirm per service type with a local accountant.
- **Compliance:** Privacy Act 2020, Health Information Privacy Code 2020.

### 3.6 Uzbekistan
- **Payments:** Local rails (Uzcard, Humo; Payme, Click wallets) through doctor-owned merchant accounts; international cards secondary.
- **Invoicing / e-document:** Mandatory electronic invoicing and online fiscal receipts (state e-invoice operators such as Didox / Soliq ecosystem, online cash registers). Requires an `EDocumentAdapter` similar to TR's integrator model.
- **Tax:** VAT regime and medical-service exemptions must be confirmed with local tax advisors; many medical services are VAT-exempt.
- **Compliance:** Personal data law (incl. data localization requirement for citizens' data), Russian/Uzbek localization.

> All tax/compliance points above are planning assumptions and must be validated with a local accountant/lawyer before each country's build starts.

## 4. Summary table

| Country | E-invoicing status | Tax on health services | Recommended payment path | Effort | Key notes |
|---|---|---|---|---|---|
| United States | No B2C mandate | Generally exempt (state-dependent) | Stripe Connect (doctor-owned), ACH | Medium | HIPAA/BAA is the main work; superbills; insurance later |
| United Kingdom | No mandate (consultation ongoing) | VAT-exempt for medical care; 20% for non-medical | Stripe / GoCardless | Low–Medium | Exempt vs taxable service flags; UK GDPR |
| Canada | No mandate | Mostly GST/HST-exempt; provincial variance | Stripe / Moneris, Interac | Medium | Per-province rate table; Quebec Law 25 |
| Australia | Peppol available, B2C not mandatory | Mostly GST-free; cosmetic 10% | Stripe / Tyro | Low–Medium | ABN on invoices; Medicare rebates later |
| New Zealand | Peppol available, B2C not mandatory | GST 15% generally applies | Stripe / Windcave | Low | Shares AU kit structure |
| Uzbekistan | Mandatory e-invoice + fiscal receipts | To be confirmed locally | Uzcard/Humo, Payme/Click | High | Closest to TR integrator model; data localization |

## 5. Recommended rollout order

1. **United States**
2. **United Kingdom**
3. **Canada**
4. **Australia / New Zealand** (shared kit structure, separate rate tables)
5. **Uzbekistan**

Rationale: start where no mandatory e-document adapter is needed and Stripe-style processors cover payments, then add multi-jurisdiction tax (Canada), then the AU/NZ pair, finishing with Uzbekistan, which needs a full TR-style e-document integration and local payment rails.

## 6. CountryBillingKit contract

**Each country gets its own `CountryBillingKit` plugged into the shared core.** The core never contains country logic.

```ts
interface CountryBillingKit {
  country: 'TR' | 'US' | 'GB' | 'CA' | 'UZ' | 'AU' | 'NZ';
  taxAdapter: TaxAdapter;            // tax calculation, exemptions, invoice tax lines
  paymentAdapter: PaymentAdapter;    // doctor-owned processor(s), hosted checkout, webhooks
  eDocumentAdapter?: EDocumentAdapter; // only where e-invoicing/fiscal receipts apply (TR, UZ)
  rateTable: RateTable;              // rates by region/service type, effective dates
  complianceRules: ComplianceRules;  // mandatory fields, numbering, retention, privacy, locale
  setupWizard: WizardStep[];         // Entegrasyonlar onboarding steps and vault fields
}
```

Definition of done per country: kit implemented, sandbox + live verified, rate table reviewed by a local accountant, compliance checklist signed off, feature flag enabled per tenant.
