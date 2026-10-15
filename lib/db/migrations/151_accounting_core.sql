-- NOTYA-ACCOUNTING-01 (Kaan's CEO brief, 2026-10-15)
-- Notya Accounting (Faturalama & Tahsilat) — module shell, tax profile, catalog, sekreter grants.
-- Optional module under Entegrasyonlar. Additive; no existing table touched. Money in kuruş
-- (integer, TRY x100) everywhere — never a float column for an amount.
-- RLS pattern: same "kendi satırı" ownership policy used throughout the app (doctor_id =
-- auth.uid()). Service-role routes bypass this and enforce ownership in application code
-- (pratikOturum / doktorOturum) — RLS here is the second line of defense per
-- .cursor/skills/hasta-izolasyon/SKILL.md.

-- 1) Module on/off + module-level defaults, one row per doktor.
create table if not exists public.accounting_module_settings (
  doctor_id                 uuid primary key references auth.users(id) on delete cascade,
  enabled                   boolean not null default false,
  default_kdv_rate_bp       integer not null default 1000, -- 1000 = 10.00% (KDV_10_HEALTH)
  default_doc_type          text not null default 'esmm' check (default_doc_type in ('esmm','efatura','earsiv')),
  portal_visible_default    boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
alter table public.accounting_module_settings enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_module_settings for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- 2) Tax identity the doctor/clinic issues documents under. Notya is never the issuer (see
--    docs/ARCH-NOTYA-ACCOUNTING.md §1) — this row IS the issuer identity used by every ebelge call.
create table if not exists public.accounting_tax_profiles (
  doctor_id       uuid primary key references auth.users(id) on delete cascade,
  id_type         text not null check (id_type in ('tckn','vkn')),
  id_value_enc    text not null, -- AES-256-GCM via lib/security/encryption.ts, never logged in clear
  unvan           text not null,
  address         text not null,
  vergi_dairesi   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.accounting_tax_profiles enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_tax_profiles for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- 3) Catalog — open-ended muayene / aşı / hizmet / paket definitions (CEO's explicit "not a
--    fixed 3 or 5" requirement). `kind` groups them in the UI; nothing limits how many a doctor
--    can define.
create table if not exists public.accounting_services (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references auth.users(id) on delete cascade,
  kind            text not null check (kind in ('muayene','asi','hizmet','paket')),
  name            text not null,
  description     text,
  price_kurus     integer not null check (price_kurus >= 0),
  kdv_rate_bp     integer not null default 1000 check (kdv_rate_bp >= 0 and kdv_rate_bp <= 10000),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists accounting_services_doctor_idx on public.accounting_services (doctor_id, kind, active);
alter table public.accounting_services enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_services for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- 4) Sekreter/asistan grants on top of the module's own default RBAC (lib/accounting/rbac.ts).
--    Doktor-only to write; a secretary row here never grants credential or module-toggle access
--    (enforced in code, not just by omission here).
create table if not exists public.accounting_role_grants (
  doctor_id                           uuid not null references auth.users(id) on delete cascade,
  personel_id                         uuid not null references auth.users(id) on delete cascade,
  can_cancel                          boolean not null default false,
  can_credit                          boolean not null default false,
  can_apply_discount_above_threshold  boolean not null default false,
  can_view_all_reports                boolean not null default false,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now(),
  primary key (doctor_id, personel_id)
);
alter table public.accounting_role_grants enable row level security;
do $$
begin
  create policy "accounting_kendi_satiri" on public.accounting_role_grants for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
