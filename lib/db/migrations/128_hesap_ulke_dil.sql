-- 128 NOTYA-ULKE-01 (Kaan, 2026-10-08)
--
-- ██ SUPERSEDED — DO NOT RUN. NOT PART OF THE COUNTRY ROLLOUT. (NOTYA-ULKE-SABLON-01, 2026-10-08) ██
--
-- What it is: country and interface language as two columns on Türkiye's own account table (`users`), written when
-- each country was going to have a database of its own.
--
-- Why it is superseded: Kaan, 2026-10-08 19:09 — "use the same database as what we are using for notya turkiye".
-- In the shared database a country's accounts live in `ulke_hesaplari` (migration 130), never in `users`.
-- NO COUNTRY BUILD NEEDS IT: no country code reads or writes `users` (lib/ulke/ulkeVeritabani.paket.test.ts fails if
-- one does). THIS IS THE ONLY FILE FROM 128 ON THAT WOULD CHANGE A TABLE TÜRKİYE USES, which is the reason to leave
-- it out: docs/COUNTRY-PACK-DB-ROLLOUT.md runs 129–135 and skips this file.
--
-- Does the Turkish application need it for its own country check? No. That check (pull request #565, not on `main`)
-- reads the country stamped on the SESSION (auth `app_metadata.country`): no stamp = an account of Türkiye, a stamp of
-- another country = refused. It needs nothing in the database. The two places on that branch that touch
-- `users.country` (a second look at the row in /api/users/me; a best-effort stamp at first onboarding,
-- lib/ulke/hesapDamga.ts) both tolerate the column being absent. Whether those two are dropped, or this file is
-- revived for them, is a separate, later decision of the owner's — see docs/OPEN-COMMITMENTS.md.
--
-- The file is kept, not deleted, so that the record of what was written stays. If it is ever run: purely additive
-- (two columns with constant defaults — no table rewrite — two format checks, one guard trigger), safe to run twice,
-- one transaction with a lock timeout; rollback in geri-al/128_hesap_ulke_dil.geri-al.sql. The local proof
-- (scripts/ulke-goc-kaniti.mjs, part F) runs it only to put on record what it would change.
--
-- NOT APPLIED to any database.

begin;
set local lock_timeout = '4s';

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

commit;
