-- ROLLBACK of migration 131 (hasta_ulke_bilgisi). NOTYA-ULKE-SABLON-01.
-- Removes the country patient tables.
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
  if to_regclass('public.hasta_ulke_bilgisi') is not null then execute 'select count(*) from public.hasta_ulke_bilgisi' into n; if n > 0 then raise exception 'rollback refused: public.hasta_ulke_bilgisi holds % row(s). Export and empty it by hand first.', n; end if; end if;
  if to_regclass('public.ulke_hastalar') is not null then execute 'select count(*) from public.ulke_hastalar' into n; if n > 0 then raise exception 'rollback refused: public.ulke_hastalar holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

drop table if exists public.hasta_ulke_bilgisi;
drop table if exists public.ulke_hastalar;

delete from schema_migrations where version = '131';

commit;
