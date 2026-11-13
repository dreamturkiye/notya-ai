-- ROLLBACK of migration 200 (prematurity records of a country build: ulke_erken_dogum_kayitlari, ulke_prematur_kayitlari,
-- the trigger function ulke_prematur_kilidi). PREMATUR-ULKE-01.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (200 before 198).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while a table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array['ulke_erken_dogum_kayitlari', 'ulke_prematur_kayitlari'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then raise exception 'rollback refused: public.% holds % row(s). Export and empty it by hand first.', t, n; end if;
    end if;
  end loop;
end $$;

drop table if exists public.ulke_erken_dogum_kayitlari;
drop table if exists public.ulke_prematur_kayitlari;
drop function if exists public.ulke_prematur_kilidi();

delete from schema_migrations where version = '200';

commit;
