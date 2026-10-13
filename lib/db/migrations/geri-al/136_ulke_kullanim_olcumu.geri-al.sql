-- ROLLBACK of migration 136 (ulke_kullanim_olcumu). NOTYA-ULKE-PORTAL-01.
-- Removes the usage table and its function. Run on the country's OWN database only, never on any other.
-- Run the rollbacks in REVERSE order: each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while the table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_kullanim_olcumu') is not null then execute 'select count(*) from public.ulke_kullanim_olcumu' into n; if n > 0 then raise exception 'rollback refused: public.ulke_kullanim_olcumu holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

drop function if exists public.ulke_kullanim_ekle(text, uuid, date, text, integer, numeric, bigint, bigint);
drop table if exists public.ulke_kullanim_olcumu;

delete from schema_migrations where version = '136';

commit;
