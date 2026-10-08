-- 129 NOTYA-ULKE-01 (Kaan, 2026-10-08)
-- Invitation codes for a country whose sign-up is not open yet (docs/COUNTRY-PACK-CHECKLIST.md, rule 9:
-- "sign-ups for a country stay closed until section A passes and the clinical lead signs off").
--
-- A code is issued by hand (scripts/ulke-davet-kodu.mjs prints the code and the INSERT for its hash), shown once to
-- the person it is for, and stored here ONLY as a SHA-256 hash. The table holds no patient data and no account data.
-- Server routes use the service role; nobody else can read or write it (RLS on, no policy, privileges revoked).
--
-- Purely additive: one new table, two functions. No table Türkiye uses is changed (one row is added to the
-- migration ledger `schema_migrations`). Türkiye does not use invitation codes.
--
-- SHARED DATABASE (NOTYA-ULKE-SABLON-01): one table for every country. A code belongs to ONE country (`ulke`);
-- both functions take the build's country, so a build can neither use nor give back another country's code.
--
-- Safe to run twice. One transaction: applied completely or not at all.
-- NOT APPLIED by the job that wrote it.

begin;
set local lock_timeout = '4s';

create table if not exists public.davet_kodlari (
  kod_hash text primary key check (kod_hash ~ '^[0-9a-f]{64}$'),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  azami_kullanim integer not null default 1 check (azami_kullanim > 0),
  kullanim integer not null default 0 check (kullanim >= 0),
  son_gecerlilik timestamptz,
  -- Free text for the operator: who the code was issued to. Never shown to a visitor.
  aciklama text,
  created_at timestamptz not null default now(),
  son_kullanim_at timestamptz,
  constraint davet_kodlari_kullanim_siniri check (kullanim <= azami_kullanim)
);

alter table public.davet_kodlari enable row level security;
revoke all on table public.davet_kodlari from anon, authenticated;

-- Takes one use of a code, atomically: true only when the code exists for THIS country, is not expired and has a use
-- left. Two sign-ups racing for the last use cannot both win.
create or replace function public.davet_kodu_kullan(p_hash text, p_ulke text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  update public.davet_kodlari
     set kullanim = kullanim + 1, son_kullanim_at = now()
   where kod_hash = p_hash
     and ulke = p_ulke
     and kullanim < azami_kullanim
     and (son_gecerlilik is null or son_gecerlilik > now());
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Gives a use back when the account could not be created after the code was taken. Bound to the country as well:
-- a build can give back only a code of its own country.
drop function if exists public.davet_kodu_iade(text);
create or replace function public.davet_kodu_iade(p_hash text, p_ulke text)
returns void language sql security definer set search_path = public as $$
  update public.davet_kodlari set kullanim = greatest(kullanim - 1, 0) where kod_hash = p_hash and ulke = p_ulke;
$$;

revoke execute on function public.davet_kodu_kullan(text, text) from public, anon, authenticated;
revoke execute on function public.davet_kodu_iade(text, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.davet_kodu_kullan(text, text) to service_role;
    grant execute on function public.davet_kodu_iade(text, text) to service_role;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('129', '129_davet_kodlari.sql', null, now(), false,
  'NOTYA-ULKE-01: invitation codes (hash only, one country each) for countries whose sign-up is not open yet; atomic use / give-back functions bound to the country')
on conflict (version) do nothing;

commit;
