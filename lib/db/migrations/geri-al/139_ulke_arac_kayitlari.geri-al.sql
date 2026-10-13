-- ROLLBACK of migration 139 (ulke_arac_kayitlari). NOTYA-ULKE-ARACLAR-01.
-- Removes the tool records' table and its trigger function.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (139 before 138).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while the table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_arac_kayitlari') is not null then
    select count(*) into n from public.ulke_arac_kayitlari;
    if n > 0 then raise exception 'rollback refused: public.ulke_arac_kayitlari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

drop table if exists public.ulke_arac_kayitlari;
drop function if exists public.ulke_arac_kaydi_kilidi();

delete from schema_migrations where version = '139';

commit;
