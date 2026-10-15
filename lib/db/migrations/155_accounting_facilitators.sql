-- NOTYA-ACCOUNTING-01 — hybrid payment model (Kaan, 2026-10-15): payment facilitator merchants
-- (iyzico), parallel to accounting_bank_merchants, plus an optional facilitator_key column on
-- accounting_payments so the existing ledger/AR application code (postArPayment, the invoice
-- state machine) is reused unchanged regardless of which provider family collected the money.

create table if not exists public.accounting_facilitator_merchants (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references auth.users(id) on delete cascade,
  facilitator_key   text not null check (facilitator_key in ('iyzico')),
  environment       text not null default 'test' check (environment in ('test','live')),
  secrets_enc       text not null,
  is_active         boolean not null default true,
  last_tested_at    timestamptz,
  last_test_ok      boolean,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists accounting_facilitator_merchants_doctor_key_idx
  on public.accounting_facilitator_merchants (doctor_id, facilitator_key);
alter table public.accounting_facilitator_merchants enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_facilitator_merchants for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

alter table public.accounting_payments
  add column if not exists facilitator_key text check (facilitator_key in ('iyzico'));

-- Exactly one of bank_key/facilitator_key for a card_3ds payment; both null for nakit/havale_eft.
do $$
begin
  alter table public.accounting_payments
    add constraint accounting_payments_one_provider_chk
    check (
      (bank_key is not null and facilitator_key is null) or
      (facilitator_key is not null and bank_key is null) or
      (bank_key is null and facilitator_key is null)
    );
exception when duplicate_object then null;
end $$;

-- Note: accounting_payments_merchant_ref_idx (migration 154) already enforces a globally unique
-- merchant_ref across both provider families, so no separate facilitator-scoped index is needed.
