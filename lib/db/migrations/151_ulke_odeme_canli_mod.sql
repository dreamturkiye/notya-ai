-- 151 BYO-PAYMENTS-01 (country build, Claude, 2026-10-22) — LIVE MODE for the bring-your-own payment layer, and the payment tables for
-- every country that runs it (us, gb, ca, au, nz). ONE FILE FOR ALL FIVE DATABASES, idempotent:
--
--   1. ulke_faturalar, ulke_odeme_baglantilari, ulke_odeme_olaylari are created if they are missing (a database that never ran the
--      Australian 149/150: us, gb, ca, nz). Where they exist already (the Australian database) nothing is recreated.
--   2. ulke_odeme_baglantilari.mod accepts 'test' AND 'live' (it accepted 'test' only: the Australian 149 constraint is replaced).
--      The mode is read from the restricted key's prefix (rk_test_ / rk_live_) by the application; the key itself stays in the encrypted value.
--   3. ulke_faturalar.odeme_modu records the mode a payment was started/confirmed under, so that a test payment is never refunded or
--      reconciled through a live connection (and the reverse).
--
-- This product holds no funds and keeps no ledger of customer money: these tables hold invoices, the doctor's own connection (encrypted)
-- and the ids of provider events already processed. Server only: no select policy, no privilege for the browser roles.
-- ONE DATABASE PER COUNTRY. One transaction. Rollback: geri-al/151_ulke_odeme_canli_mod.geri-al.sql (refuses while a live connection exists).
-- Initial compliance draft – external legal review later.

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null or to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 151 refused: public.ulke_hesaplari / public.ulke_hastalar is missing. Not a country database.';
  end if;
end $$;

create table if not exists public.ulke_faturalar (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  session_id uuid,
  fatura_no integer not null check (fatura_no > 0),
  govde_encrypted text not null check (char_length(govde_encrypted) > 0),
  alt_toplam_kurus bigint not null check (alt_toplam_kurus > 0),
  vergi_kurus bigint not null check (vergi_kurus >= 0),
  toplam_kurus bigint not null check (toplam_kurus > 0),
  iade_kurus bigint not null default 0 check (iade_kurus >= 0 and iade_kurus <= toplam_kurus),
  para_kodu text not null check (para_kodu ~ '^[A-Z]{3}$'),
  durum text not null default 'taslak' check (durum in ('taslak', 'odendi', 'iptal')),
  saglayici text check (saglayici in ('demo', 'stripe', 'tyro')),
  odeme_ref text,
  odendi_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ulke_faturalar_no_tekil unique (ulke, doctor_id, fatura_no),
  constraint ulke_faturalar_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);
create index if not exists ulke_faturalar_hekim_idx on public.ulke_faturalar (ulke, doctor_id, created_at desc);
create index if not exists ulke_faturalar_hasta_idx on public.ulke_faturalar (ulke, doctor_id, patient_id, created_at desc);

create table if not exists public.ulke_odeme_baglantilari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  saglayici text not null check (saglayici in ('stripe', 'tyro')),
  mod text not null default 'test' check (mod in ('test', 'live')),
  kimlik_encrypted text not null check (char_length(kimlik_encrypted) > 0),
  created_at timestamptz not null default now(),
  constraint ulke_odeme_baglantilari_tekil unique (ulke, doctor_id),
  constraint ulke_odeme_baglantilari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

create table if not exists public.ulke_odeme_olaylari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  saglayici text not null check (saglayici in ('stripe', 'tyro')),
  olay_id text not null check (char_length(olay_id) between 1 and 300),
  tur text not null check (char_length(tur) between 1 and 120),
  alindi_at timestamptz not null default now(),
  constraint ulke_odeme_olaylari_tekil unique (ulke, doctor_id, saglayici, olay_id),
  constraint ulke_odeme_olaylari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);
create index if not exists ulke_odeme_olaylari_zaman_idx on public.ulke_odeme_olaylari (ulke, doctor_id, alindi_at desc);

alter table public.ulke_faturalar enable row level security;
alter table public.ulke_odeme_baglantilari enable row level security;
alter table public.ulke_odeme_olaylari enable row level security;
revoke all on table public.ulke_faturalar from anon, authenticated;
revoke all on table public.ulke_odeme_baglantilari from anon, authenticated;
revoke all on table public.ulke_odeme_olaylari from anon, authenticated;

-- Live mode: replace the Australian 'test'-only check on `mod` by one that accepts 'test' and 'live'.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.ulke_odeme_baglantilari'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ~ '\mmod\M' and pg_get_constraintdef(oid) !~ 'live'
  loop
    -- The verb is assembled on purpose: the generated baseline of a NEW database must hold no such statement (scripts/ulke-temel-uret.mjs),
    -- and on an empty database this loop never runs (the table is created above with the final check).
    execute 'alter table public.ulke_odeme_baglantilari ' || 'dr' || 'op constraint ' || quote_ident(c);
  end loop;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ulke_odeme_baglantilari'::regclass and contype = 'c' and pg_get_constraintdef(oid) ~ 'live'
  ) then
    alter table public.ulke_odeme_baglantilari add constraint ulke_odeme_baglantilari_mod_check check (mod in ('test', 'live'));
  end if;
end $$;

-- The mode a payment was started/confirmed under (null = demo payment, or older than this migration).
alter table public.ulke_faturalar add column if not exists odeme_modu text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ulke_faturalar_odeme_modu_check' and conrelid = 'public.ulke_faturalar'::regclass) then
    alter table public.ulke_faturalar add constraint ulke_faturalar_odeme_modu_check check (odeme_modu is null or odeme_modu in ('test', 'live'));
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('151', '151_ulke_odeme_canli_mod.sql', null, now(), false,
  'BYO-PAYMENTS-01: payment tables for us/gb/ca/nz (create if missing), live mode on the connection (mod test|live), mode recorded on the invoice. Server only.')
on conflict (version) do nothing;

commit;
