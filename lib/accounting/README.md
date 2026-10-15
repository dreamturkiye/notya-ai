# Notya Accounting (Faturalama & Tahsilat)

Full architecture: `docs/ARCH-NOTYA-ACCOUNTING.md` (read §4.1 first — implementation honesty
notice). This file is the short, code-level "how do I extend this" note the build brief asked
for.

## What's real vs. stubbed, in one line

Payment path (hybrid model, `docs/ARCH-NOTYA-ACCOUNTING.md` §2.6a): **iyzico** is a real, `VERIFIED`
`PaymentFacilitatorAdapter` (`facilitators/iyzico.ts`) and the default/recommended path. Of the 11
named direct banks, 6 (İş Bankası, Halkbank, TEB, QNB Finansbank, Ziraat, Akbank) share one real
adapter (`banks/nestpay.ts`, NestPay/EST "3D Pay Hosting", VERIFIED by protocol cross-reference)
plus `generic_hosted.ts` (one real documented generic protocol); the remaining 5 (Yapı Kredi,
Garanti BBVA, VakıfBank, Denizbank, Kuveyt Türk) are stubs — see `banks/CHECKLIST.md`. One real `EbelgeAdapter`
(`ebelge/generic_rest.ts`); the 3 named e-belge vendors are honest stubs
(`AdapterNotImplementedError`). See `banks/CHECKLIST.md`, `facilitators/CHECKLIST.md` and
`ebelge/CHECKLIST.md` for exactly what's needed to finish each one.

## Layout

```
lib/accounting/
  types.ts, rbac.ts, module.ts, audit.ts, vault.ts, grants.ts
  ledger/money.ts         # integer-kuruş math, KDV, discounts — the only place that does arithmetic
  invoices/{engine,stateMachine}.ts
  catalog/service.ts      # open-ended muayene/aşı/hizmet/paket
  ar/{ledger,aging}.ts
  payments/{types,session}.ts                    # direct-bank orchestrator
  payments/{facilitatorTypes,facilitatorSession}.ts  # facilitator orchestrator — parallel, independent
  banks/{index,generic_hosted,nestpay,stub,CHECKLIST.md}
  facilitators/{index,iyzico,CHECKLIST.md}
  ebelge/{index,generic_rest,stub,types,CHECKLIST.md}
  reports/index.ts
```

## Adding a new bank adapter

1. Read `banks/CHECKLIST.md` for that bank's row — you need sandbox merchant credentials and the
   bank's current API/integration doc before writing a line of code (never guess field names for
   a payments feature).
2. Create `lib/accounting/banks/<bank_key>.ts` implementing `BankPosAdapter`
   (`createHosted3dsSession`, `parseWebhook`, `queryStatus`) — use `generic_hosted.ts` as the
   shape to follow, not as something to copy verbatim (that bank's real fields will differ).
3. In `banks/index.ts`, replace that key's `createStubBankAdapter(key)` registration with your new
   adapter, keep `isReal: true`.
4. Add `lib/accounting/banks/<bank_key>.test.ts` with a mocked `HttpTransport`, same pattern as
   `generic_hosted.test.ts`.
5. Update the checklist row to `DONE` and update `docs/ARCH-NOTYA-ACCOUNTING.md` §4.1's "1 of 12"
   count.

## Adding a new payment facilitator (parallel to the bank path, not instead of it)

1. Read/update `facilitators/CHECKLIST.md` — same honesty rule as banks: real public docs for
   the hosted/checkout flow, confirmed to have no PAN/CVV field, before writing any code.
2. Create `lib/accounting/facilitators/<key>.ts` implementing `PaymentFacilitatorAdapter`
   (`payments/facilitatorTypes.ts`) — use `iyzico.ts` as the shape, not something to copy
   verbatim.
3. Register it in `facilitators/index.ts`. Do **not** touch `banks/index.ts`,
   `payments/session.ts` or anything under `banks/` — the two provider families are deliberately
   independent (Kaan, 2026-10-15).
4. Add a mocked-transport test file, same pattern as `facilitators/iyzico.test.ts`, including an
   explicit assertion that the request body never contains a card field.

## Adding a new e-belge integrator

Same shape, in `lib/accounting/ebelge/`: implement `EbelgeAdapter` for that vendor (see
`generic_rest.ts`), register it in `ebelge/index.ts` in place of the stub, add a mocked-transport
test, update `ebelge/CHECKLIST.md`.

## Adding a future country's billing kit

The core (ledger, invoice state machine, catalog, RBAC, AR aging) is deliberately country-agnostic
— nothing in those files is Turkey-specific. A second country adds its own:

- Tax document adapter family (like `ebelge/`, but for that country's e-invoicing scheme) and
  payment adapter family (like `banks/`, for that country's card acquirers/schemes).
- A tax-rate table (like `KDV_10_HEALTH`) for that country's health-service tax rules.
- Its own `docs/ARCH-NOTYA-ACCOUNTING-<CC>.md` per `docs/ARCH-NOTYA-ACCOUNTING.md` §7, once this
  TR implementation is production-proven.

Do **not** fork `ledger/`, `invoices/`, `rbac.ts`, `ar/`, or the catalog shape — only the country
adapter layer and its own copy/rates change.
