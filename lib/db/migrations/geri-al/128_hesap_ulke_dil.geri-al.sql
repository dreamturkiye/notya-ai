-- ROLLBACK of migration 128 (hesap_ulke_dil). NOTYA-ULKE-SABLON-01.
-- Removes the two columns, the two checks and the guard trigger that 128 added to Türkiye's `users`. THIS IS THE ONE ROLLBACK THAT CHANGES A TABLE TÜRKİYE USES. Dropping a column does not rewrite the table (the column is only marked as dropped), but it takes an ACCESS EXCLUSIVE lock on `users` for an instant. Deploy no Turkish code that reads users.country or users.ui_language before running it (the code on the country branches tolerates their absence).
--
-- Touches of Türkiye's objects: public.users — trigger, two constraints and two columns dropped (ACCESS EXCLUSIVE lock for an instant, no table rewrite, no other column or row changed); one row removed from the ledger.
-- Run the rollbacks in REVERSE order (135 first, 128 last): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

do $$
declare n bigint;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'country') then
    execute 'select count(*) from public.users where country <> ''tr''' into n;
    if n > 0 then raise exception 'rollback refused: % row(s) of public.users carry a country other than tr. Decide about them by hand first.', n; end if;
  end if;
end $$;
drop trigger if exists users_country_kilidi on public.users;
drop function if exists public.users_country_kilidi();
alter table public.users drop constraint if exists users_country_bicim;
alter table public.users drop constraint if exists users_ui_language_bicim;
alter table public.users drop column if exists country, drop column if exists ui_language;

delete from schema_migrations where version = '128';

commit;
