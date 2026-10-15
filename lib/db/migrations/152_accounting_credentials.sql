-- NOTYA-ACCOUNTING-01 — encrypted credential vault tables: e-belge integrator + bank merchants.
-- Secrets are AES-256-GCM JSON blobs (lib/accounting/vault.ts -> lib/security/encryption.ts).
-- Never select secrets_enc in a route response; only lib/accounting/vault.ts decrypts, just
-- before an adapter call. Doktor-only writes (sekreter cannot touch credentials, ever — see
-- lib/accounting/rbac.ts, which is enforced independently of this RLS).

create table if not exists public.accounting_ebelge_credentials (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references auth.users(id) on delete cascade,
  vendor            text not null check (vendor in ('generic_rest','nes','qnb_esolutions','logo','other')),
  environment       text not null default 'test' check (environment in ('test','live')),
  secrets_enc       text not null, -- vendor-shaped JSON, encrypted (never logged / selected to client)
  is_active         boolean not null default true,
  last_tested_at    timestamptz,
  last_test_ok      boolean,
  last_test_detail  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- One active integrator per practice for now (docs/ARCH-NOTYA-ACCOUNTING.md §2.3.1 item 2: "start
-- with one active integrator"); multiple rows can exist (history / inactive), only one active.
create unique index if not exists accounting_ebelge_credentials_one_active
  on public.accounting_ebelge_credentials (doctor_id) where is_active;
alter table public.accounting_ebelge_credentials enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_ebelge_credentials for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

create table if not exists public.accounting_bank_merchants (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references auth.users(id) on delete cascade,
  bank_key          text not null check (bank_key in (
                      'generic_hosted','yapi_kredi','isbank','garanti','akbank','qnb','ziraat',
                      'vakifbank','halkbank','denizbank','teb','kuveyt_turk'
                    )),
  environment       text not null default 'test' check (environment in ('test','live')),
  secrets_enc       text not null,
  is_active         boolean not null default true,
  last_tested_at    timestamptz,
  last_test_ok      boolean,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists accounting_bank_merchants_doctor_bank_idx
  on public.accounting_bank_merchants (doctor_id, bank_key);
alter table public.accounting_bank_merchants enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_bank_merchants for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
