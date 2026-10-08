-- ROLLBACK of migration 133 (not_dil_kaydi). NOTYA-ULKE-SABLON-01.
-- Removes the country note tables.
--
-- Touches of Türkiye's objects: none (one row removed from the ledger).
-- Run the rollbacks in REVERSE order (135 first, 128 last): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while any of the tables it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.not_dil_kaydi') is not null then execute 'select count(*) from public.not_dil_kaydi' into n; if n > 0 then raise exception 'rollback refused: public.not_dil_kaydi holds % row(s). Export and empty it by hand first.', n; end if; end if;
  if to_regclass('public.ulke_notlar') is not null then execute 'select count(*) from public.ulke_notlar' into n; if n > 0 then raise exception 'rollback refused: public.ulke_notlar holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

drop table if exists public.not_dil_kaydi;
drop table if exists public.ulke_notlar;

delete from schema_migrations where version = '133';

commit;
