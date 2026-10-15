-- NOTYA-ACCOUNTING-01 — invoice engine tables: invoices, lines, discounts, credits/deposits.
-- patient_id is nullable (billing can stand alone per docs/ARCH-NOTYA-ACCOUNTING.md §2.2) but
-- whenever it IS set, the migration-104 RESTRICTIVE hasta-sahipliği policy applies: a row whose
-- patient_id does not belong to doctor_id is invisible even to a direct PostgREST call, on top of
-- the app-level ownership check in every /api/accounting route (lib/doktor/hastaSahipligi.ts).
-- All money columns: integer kuruş, never float. See lib/accounting/ledger/money.ts for the only
-- place that does arithmetic on them.

create table if not exists public.accounting_invoices (
  id                  uuid primary key default gen_random_uuid(),
  doctor_id           uuid not null references auth.users(id) on delete cascade,
  patient_id          uuid references public.patients(id) on delete set null,
  status              text not null default 'draft' check (status in (
                        'draft','pending_issue','issued','issue_failed','partially_paid','paid',
                        'cancel_pending','cancelled','credit_pending','credited'
                      )),
  doc_type            text not null default 'esmm' check (doc_type in ('esmm','efatura','earsiv')),
  subtotal_kurus      integer not null default 0,
  discount_kurus      integer not null default 0,
  kdv_kurus           integer not null default 0,
  total_kurus         integer not null default 0,
  paid_kurus          integer not null default 0,
  portal_visible      boolean not null default false,
  ebelge_vendor       text,
  ebelge_environment  text check (ebelge_environment in ('test','live')),
  ebelge_uuid         text,
  ebelge_doc_number   text,
  ebelge_pdf_url      text,
  ebelge_last_error   text,
  created_by          uuid not null references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  issued_at           timestamptz,
  cancelled_at        timestamptz
);
create index if not exists accounting_invoices_doctor_idx on public.accounting_invoices (doctor_id, status, created_at desc);
create index if not exists accounting_invoices_patient_idx on public.accounting_invoices (patient_id) where patient_id is not null;

alter table public.accounting_invoices enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_invoices for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "accounting_hasta_sahipligi" on public.accounting_invoices as restrictive for all to authenticated, anon
    using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

create table if not exists public.accounting_invoice_lines (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references public.accounting_invoices(id) on delete cascade,
  service_id        uuid references public.accounting_services(id) on delete set null,
  description       text not null,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price_kurus  integer not null check (unit_price_kurus >= 0),
  discount_kurus    integer not null default 0 check (discount_kurus >= 0),
  kdv_rate_bp       integer not null default 1000,
  kdv_kurus         integer not null default 0,
  line_total_kurus  integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists accounting_invoice_lines_invoice_idx on public.accounting_invoice_lines (invoice_id);
-- No doctor_id column on this child row — resolve ownership via the parent invoice, same pattern
-- as derm_lezyonlar in .cursor/skills/hasta-izolasyon/SKILL.md ("çocuk satır" rule #3).
alter table public.accounting_invoice_lines enable row level security;
do $$
begin
  create policy "accounting_ebeveyn_sahipligi" on public.accounting_invoice_lines for all
    using (exists (select 1 from public.accounting_invoices i where i.id = invoice_id and i.doctor_id = auth.uid()))
    with check (exists (select 1 from public.accounting_invoices i where i.id = invoice_id and i.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

create table if not exists public.accounting_discounts (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.accounting_invoices(id) on delete cascade,
  line_id       uuid references public.accounting_invoice_lines(id) on delete cascade,
  scope         text not null check (scope in ('line','invoice')),
  disc_type     text not null check (disc_type in ('percent','fixed')),
  value         numeric not null,
  amount_kurus  integer not null,
  reason        text not null,
  actor_id      uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);
create index if not exists accounting_discounts_invoice_idx on public.accounting_discounts (invoice_id);
alter table public.accounting_discounts enable row level security;
do $$
begin
  create policy "accounting_ebeveyn_sahipligi" on public.accounting_discounts for all
    using (exists (select 1 from public.accounting_invoices i where i.id = invoice_id and i.doctor_id = auth.uid()))
    with check (exists (select 1 from public.accounting_invoices i where i.id = invoice_id and i.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- Credit notes (tied to an issued invoice) and standalone deposits (prepayment credit balance,
-- invoice_id null, applied to a future invoice).
create table if not exists public.accounting_credits (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id) on delete cascade,
  patient_id    uuid references public.patients(id) on delete set null,
  invoice_id    uuid references public.accounting_invoices(id) on delete set null,
  kind          text not null check (kind in ('credit_note','deposit')),
  amount_kurus  integer not null check (amount_kurus > 0),
  remaining_kurus integer not null,
  reason        text,
  status        text not null default 'active' check (status in ('active','applied','void')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists accounting_credits_doctor_idx on public.accounting_credits (doctor_id, patient_id);
alter table public.accounting_credits enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_credits for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "accounting_hasta_sahipligi" on public.accounting_credits as restrictive for all to authenticated, anon
    using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
