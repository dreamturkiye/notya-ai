-- 128 NOTYA-ULKE-01 (Kaan, 2026-10-08)
-- Country and interface language on the account (docs/COUNTRY-PACK-CHECKLIST.md, rule 4).
--
-- One deployment and one database per country; the account still carries its country so that a row can never be
-- mistaken for another country's, and login can refuse an account that does not belong to the deployment
-- (lib/ulke/hesapUlkesi.ts). Purely additive: two columns with defaults, two format checks, one guard trigger.
-- No existing column, row, policy or index is changed.
--
-- Every existing row becomes 'tr' / 'tr' through the default: every account that exists today is Türkiye's.
-- The default is for THAT backfill only. Application code writes the country explicitly at sign-up; in another
-- country's database an account that still carries the default 'tr' is refused at login (fail closed).
--
-- NOT APPLIED by the job that wrote it. Apply to a country's database before that country's sign-up is opened.
-- The application tolerates the columns being absent (they read as a pre-country account = Türkiye).

alter table public.users add column if not exists country text not null default 'tr';
alter table public.users add column if not exists ui_language text not null default 'tr';

comment on column public.users.country is
  'ISO 3166-1 alpha-2, lower case: the country deployment this account belongs to. Set at sign-up; never changed by the user.';
comment on column public.users.ui_language is
  'BCP-47 interface language (tr, uz-Latn, uz-Cyrl, ru, …). Must be a language switched on in the country''s pack.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_country_bicim') then
    alter table public.users add constraint users_country_bicim check (country ~ '^[a-z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_ui_language_bicim') then
    alter table public.users add constraint users_ui_language_bicim
      check (ui_language ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$');
  end if;
end $$;

-- The country is set by the server (service role) at sign-up. A signed-in user must not be able to move their own
-- row to another country through PostgREST with the public key, whatever the row policies on this table allow.
-- The trigger fires only when an UPDATE names the column, so no existing write path is touched.
create or replace function public.users_country_kilidi() returns trigger
language plpgsql as $$
begin
  if new.country is distinct from old.country and current_user in ('authenticated', 'anon') then
    raise exception 'users.country is set at sign-up and cannot be changed by the account';
  end if;
  return new;
end $$;

drop trigger if exists users_country_kilidi on public.users;
create trigger users_country_kilidi
  before update of country on public.users
  for each row execute function public.users_country_kilidi();

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('128', '128_hesap_ulke_dil.sql', null, now(), false,
  'NOTYA-ULKE-01: users.country + users.ui_language (default tr for every existing row), format checks, country guard trigger')
on conflict (version) do nothing;
