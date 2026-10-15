# Notya Accounting (Faturalama & Tahsilat)

Full architecture: `docs/ARCH-NOTYA-ACCOUNTING.md` (read §4.1 first — implementation honesty
notice). This file is the short, code-level "how do I extend this" note the build brief asked
for.

## What's real vs. stubbed, in one line

One real `BankPosAdapter` (`banks/generic_hosted.ts`) and one real `EbelgeAdapter`
(`ebelge/generic_rest.ts`) — both documented generic protocols, not fabricated bank/integrator
APIs. The 11 named banks and 3 named e-belge vendors are honest stubs (`AdapterNotImplementedError`).
See `banks/CHECKLIST.md` and `ebelge/CHECKLIST.md` for exactly what's needed to finish each one.

## Layout

```
lib/accounting/
  types.ts, rbac.ts, module.ts, audit.ts, vault.ts, grants.ts
  ledger/money.ts         # integer-kuruş math, KDV, discounts — the only place that does arithmetic
  invoices/{engine,stateMachine}.ts
  catalog/service.ts      # open-ended muayene/aşı/hizmet/paket
  ar/{ledger,aging}.ts
  payments/{types,session}.ts
  banks/{index,generic_hosted,stub,CHECKLIST.md}
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
