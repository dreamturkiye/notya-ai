# Notya Accounting — international country billing kits

Extends `lib/accounting/README.md`'s "Adding a future country's billing kit" section, now that 6
country kits actually exist: **US, GB, CA, AU, NZ, UZ** (confirmed against `release/us|gb|ca|au|
nz|uz` and `docs/OPEN-COMMITMENTS.md`'s six-country list — not Azerbaijan, despite being a
plausible candidate before checking).

## What this is, in one line

A country-agnostic tax-document-flow layer: for each country, whether a free official e-invoicing
channel is legally mandated (→ `portal_prepare_pastback`, UZ only, and only once VAT-registered)
or whether a correctly-localized compliant invoice/receipt is the complete answer (→
`simple_invoice`, the other 5) — plus each country's real tax-exemption rule for an ordinary
medical consultation and its stopaj-equivalent (withholding) finding.

## Layout

```
lib/accounting/international/
  types.ts                  # CountryBillingKit contract
  countries/{us,gb,ca,au,nz,uz}.ts  # one kit per country, with citations
  registry.ts                # getCountryBillingKit(code), listCountryBillingKits()
  compliance.ts               # computeTaxLine(), summarizeWithholdingForPatientInvoice()
  simpleInvoiceAdapter.ts     # the 'simple_invoice' flow (US/GB/CA/AU/NZ, and UZ below threshold)
  portalAdapter.ts            # the 'portal_prepare_pastback' flow (UZ, once VAT-registered)
```

Full per-country research, with citations and confidence levels, lives in
`docs/ARCH-NOTYA-ACCOUNTING-<CC>.md` (one per country), not duplicated into code comments beyond
what each decision needs to be traceable.

## Why this doesn't import from `lib/accounting/ebelge/*` or touch `lib/accounting/types.ts`

Both were being actively rewritten by a parallel session the same day this was built
(`NOTYA-ACCOUNTING-GIB-PORTAL-01`, replacing Paraşüt as the default integrator with a free GİB
Portalı flow — `lib/accounting/ebelge/gibPortal.ts`, `lib/accounting/stopaj.ts`). Editing either
file concurrently risked a destructive collision with uncommitted work in a shared checkout, so
this module was built as a parallel, self-contained layer instead, with its own `Money`-equivalent
(`MinorUnits`) and its own doc-flow types.

**Reconciling with the TR GİB Portalı work (open, tracked in `docs/OPEN-COMMITMENTS.md`):** once
that work lands, the two prepare/paste-back flows (TR's `gibPortal.ts` and this module's
`portalAdapter.ts`) should very likely be unified behind one shared interface — they do the exact
same thing (prepare data → doctor submits externally → paste back a reference) for two different
governments' portals. That unification is a follow-up, not done here, specifically to avoid
editing a file mid-rewrite by another session.

## Why the invoice engine / Entegrasyonlar UI isn't wired up yet

Two independent reasons, both honest limitations rather than oversights:

1. `lib/accounting/invoices/engine.ts` and the e-belge registry are the exact files the parallel
   GİB-Portalı session owns this round — wiring a country branch into them risked the same
   collision described above.
2. This codebase's actual multi-country mechanism is build-time, not a runtime per-doctor
   selector: each `release/<cc>` branch has its own `countries/active/{index,demo,arayuz,...}.ts`
   that branches on `process.env.NOTYA_COUNTRY` (confirmed by reading `release/us`) — `main` has
   no `countries/` directory at all. Every other cross-cutting feature in this product reaches
   the country branches by being built on `main` first and then cherry-picked into each
   `release/<cc>` branch (see the many `cherry/<cc>-*` branches already in this repo) — not by
   `main` itself gaining a country switch. This module follows that same convention: it is the
   piece to cherry-pick, plus a new `countries/active/accounting.ts` per release branch (one
   doesn't exist yet in any of them) that calls `getCountryBillingKit('US')` etc. with that
   branch's fixed country. That propagation step is tracked in `docs/OPEN-COMMITMENTS.md`, not
   done in this pass — six more full checkouts was also not possible this session (disk space).

## Localization

Tax-document copy (portal instructions, invoice tax-line labels) is in English in the kit data
itself — intentionally, since this module's job is the compliance/data layer, not the UI strings.
Each country's actual UI copy belongs in that `release/<cc>` branch's own translation-key file
(found via the same `countries/active/` mechanism above, not inspected directly this pass to avoid
another 6 checkouts) — `kit.languageTag` is exposed specifically so that wiring step knows which
locale file to route the UI copy through.
