-- ROLLBACK of migration 130 (hekim_dil_tercihleri). NOTYA-ULKE-SABLON-01.
-- Removes the country account table, the language choices and the two helper functions. After this the accounts of country builds still exist in Supabase Auth (auth.users) with their country stamp; remove them there by hand if they must go.
--
-- Touches of Türkiye's objects: auth.users — the foreign key from ulke_hesaplari goes with the table (short lock, no row touched); one row removed from the ledger.
-- Run the rollbacks in REVERSE order (135 first, 128 last): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while any of the tables it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.hekim_dil_tercihleri') is not null then execute 'select count(*) from public.hekim_dil_tercihleri' into n; if n > 0 then raise exception 'rollback refused: public.hekim_dil_tercihleri holds % row(s). Export and empty it by hand first.', n; end if; end if;
  if to_regclass('public.ulke_hesaplari') is not null then execute 'select count(*) from public.ulke_hesaplari' into n; if n > 0 then raise exception 'rollback refused: public.ulke_hesaplari holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

drop table if exists public.hekim_dil_tercihleri;
-- Dropping ulke_hesaplari removes its foreign key to auth.users: a short lock on auth.users, no row touched.
drop table if exists public.ulke_hesaplari;
drop function if exists public.ulke_hesaplari_ulke_kilidi();
drop function if exists public.ulke_oturum_ulkesi();

delete from schema_migrations where version = '130';

commit;
