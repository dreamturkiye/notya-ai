-- ROLLBACK of migration 138 (ulke_hasta_formu). NOTYA-ULKE-INTAKE-01.
-- Removes the intake form's table, its trigger function and the function that asks for a form.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (138 before 137).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while the table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_hasta_formlari') is not null then
    select count(*) into n from public.ulke_hasta_formlari;
    if n > 0 then raise exception 'rollback refused: public.ulke_hasta_formlari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

drop function if exists public.ulke_hasta_formu_iste(text, uuid, uuid, uuid, text, text, boolean, boolean, text, text, timestamptz, timestamptz);
drop table if exists public.ulke_hasta_formlari;
drop function if exists public.ulke_hasta_formu_kilidi();

delete from schema_migrations where version = '138';

commit;
