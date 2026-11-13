-- ROLLBACK of migration 198 (learning momentum of a country build: ulke_klinik_ortak_uslup, ulke_klinik_uslup_katilim,
-- ulke_ogrenme_metrik, ulke_not_duzenlemeleri, ulke_not_taslaklari). AYSE-OGRENME-V3f.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (198 before 192).
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
  foreach t in array array['ulke_klinik_ortak_uslup', 'ulke_klinik_uslup_katilim', 'ulke_ogrenme_metrik', 'ulke_not_duzenlemeleri', 'ulke_not_taslaklari'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then raise exception 'rollback refused: public.% holds % row(s). Export and empty it by hand first.', t, n; end if;
    end if;
  end loop;
end $$;

drop table if exists public.ulke_klinik_ortak_uslup;
drop table if exists public.ulke_klinik_uslup_katilim;
drop table if exists public.ulke_ogrenme_metrik;
drop table if exists public.ulke_not_duzenlemeleri;
drop table if exists public.ulke_not_taslaklari;

delete from schema_migrations where version = '198';

commit;
