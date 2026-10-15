-- NOTYA-ACCOUNTING-01 — NestPay "3D Pay Hosting" adapter (2026-10-15, second research pass).
--
-- NestPay's Hosting mode has no separate async webhook distinct from the browser's own
-- return-to-merchant POST: the bank POSTs the final result straight to okUrl/failUrl, i.e. the
-- browser itself lands on our webhook route carrying the result. So for this adapter family,
-- okUrl/failUrl point at the SAME server route as every other bank's async webhook
-- (app/api/accounting/payments/webhook/[bankKey]) — that route then has to bounce the browser on
-- to the doctor-facing return page afterwards, which needs to know what that page's URL was.
-- Every other adapter in this module never needs this (their webhook is bank-to-server only; the
-- browser is redirected by the bank directly back to the page the UI already knows), so this
-- column is nullable and unused by them.
alter table public.accounting_payments
  add column if not exists return_url text;
