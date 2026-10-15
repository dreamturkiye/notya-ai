-- NOTYA-ACCOUNTING-01 — payments, AR ledger, immutable audit log.

create table if not exists public.accounting_payments (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references auth.users(id) on delete cascade,
  invoice_id      uuid not null references public.accounting_invoices(id) on delete cascade,
  method          text not null check (method in ('card_3ds','nakit','havale_eft')),
  bank_key        text check (bank_key in (
                    'generic_hosted','yapi_kredi','isbank','garanti','akbank','qnb','ziraat',
                    'vakifbank','halkbank','denizbank','teb','kuveyt_turk'
                  )),
  session_id      text,
  merchant_ref     text,
  status          text not null default 'pending' check (status in ('pending','captured','failed','refunded','cancelled')),
  amount_kurus    integer not null check (amount_kurus > 0),
  raw_event       jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists accounting_payments_invoice_idx on public.accounting_payments (invoice_id);
create unique index if not exists accounting_payments_merchant_ref_idx on public.accounting_payments (merchant_ref) where merchant_ref is not null;
alter table public.accounting_payments enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_payments for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

create table if not exists public.accounting_ar_ledger (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references auth.users(id) on delete cascade,
  patient_id      uuid references public.patients(id) on delete set null,
  invoice_id      uuid references public.accounting_invoices(id) on delete set null,
  movement_type   text not null check (movement_type in ('charge','payment','credit','writeoff')),
  amount_kurus    integer not null,
  balance_kurus   integer not null,
  created_at      timestamptz not null default now()
);
create index if not exists accounting_ar_ledger_doctor_idx on public.accounting_ar_ledger (doctor_id, patient_id, created_at);
alter table public.accounting_ar_ledger enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_ar_ledger for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "accounting_hasta_sahipligi" on public.accounting_ar_ledger as restrictive for all to authenticated, anon
    using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- Immutable actor trail (docs/ARCH-NOTYA-ACCOUNTING.md §2.8: "all mutations write audit rows").
-- No update/delete policy on purpose — append-only. before/after are redacted JSON snapshots
-- (never raw credential secrets; lib/accounting/vault.ts's maskSecrets() runs before anything
-- here touches a credentials row).
create table if not exists public.accounting_audit_log (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id) on delete cascade,
  actor_id      uuid not null references auth.users(id),
  actor_role    text not null check (actor_role in ('doktor','sekreter')),
  entity_type   text not null,
  entity_id     text not null,
  action        text not null,
  before_json   jsonb,
  after_json    jsonb,
  ip            text,
  created_at    timestamptz not null default now()
);
create index if not exists accounting_audit_log_doctor_idx on public.accounting_audit_log (doctor_id, created_at desc);
create index if not exists accounting_audit_log_entity_idx on public.accounting_audit_log (entity_type, entity_id);
alter table public.accounting_audit_log enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri_okuma" on public.accounting_audit_log for select
    using (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "accounting_kendi_satiri_yazma" on public.accounting_audit_log for insert
    with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
