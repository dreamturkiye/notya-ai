-- ROLLBACK of migration 146 (ek_metin on ulke_notlar).
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (146 before 145).
-- Refuses while any addendum still holds text. Safe to run twice. One transaction.
-- NEVER RUN by the job that wrote it, on any database except the throwaway local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_notlar') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'ulke_notlar' and column_name = 'ek_metin'
     )
     and exists (select 1 from public.ulke_notlar where ek_metin is not null) then
    raise exception 'rollback refused: public.ulke_notlar.ek_metin holds text. Export and clear it by hand first.';
  end if;
end $$;

alter table public.ulke_notlar drop column if exists ek_metin;

delete from schema_migrations where version = '146';

commit;
