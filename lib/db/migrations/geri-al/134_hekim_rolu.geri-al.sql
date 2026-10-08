-- ROLLBACK of migration 134 (hekim_rolu). NOTYA-ULKE-SABLON-01.
-- Removes the role table and the two role-field columns of the country table not_dil_kaydi.
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
  if to_regclass('public.hekim_rolu') is not null then execute 'select count(*) from public.hekim_rolu' into n; if n > 0 then raise exception 'rollback refused: public.hekim_rolu holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

do $$
declare n bigint;
begin
  if to_regclass('public.not_dil_kaydi') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'not_dil_kaydi' and column_name = 'alanlar') then
    execute 'select count(*) from public.not_dil_kaydi where alanlar is not null or ikinci_alanlar is not null' into n;
    if n > 0 then raise exception 'rollback refused: % note(s) hold role fields in not_dil_kaydi. Export them by hand first.', n; end if;
  end if;
end $$;
alter table if exists public.not_dil_kaydi drop column if exists alanlar, drop column if exists ikinci_alanlar;
drop table if exists public.hekim_rolu;

delete from schema_migrations where version = '134';

commit;
