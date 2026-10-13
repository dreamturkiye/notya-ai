-- ROLLBACK of migration 141 (ulke_hekim_sablonlari). NOTYA-ULKE-MESAJ-01.
-- Removes the table of a doctor's own templates and its trigger function.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (141 before 140).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while the table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_hekim_sablonlari') is not null then
    select count(*) into n from public.ulke_hekim_sablonlari;
    if n > 0 then raise exception 'rollback refused: public.ulke_hekim_sablonlari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

drop table if exists public.ulke_hekim_sablonlari;
drop function if exists public.ulke_hekim_sablonu_kilidi();

delete from schema_migrations where version = '141';

commit;
