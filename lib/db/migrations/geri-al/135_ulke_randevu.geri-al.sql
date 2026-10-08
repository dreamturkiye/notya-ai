-- ROLLBACK of migration 135 (ulke_randevu). NOTYA-ULKE-SABLON-01.
-- Removes the appointment tables and the approval function. The extension btree_gist is LEFT in place: it is harmless, and something else may have started to use it.
--
-- Touches of Türkiye's objects: none (one row removed from the ledger `schema_migrations`).
-- Run the rollbacks in REVERSE order (135 first, 128 last): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while any of the tables it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_randevulari') is not null then execute 'select count(*) from public.ulke_randevulari' into n; if n > 0 then raise exception 'rollback refused: public.ulke_randevulari holds % row(s). Export and empty it by hand first.', n; end if; end if;
  if to_regclass('public.hekim_calisma_duzeni') is not null then execute 'select count(*) from public.hekim_calisma_duzeni' into n; if n > 0 then raise exception 'rollback refused: public.hekim_calisma_duzeni holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

drop function if exists public.ulke_not_onayla(text, uuid, uuid, timestamptz, text, text, text, text, jsonb);
drop table if exists public.ulke_randevulari;
drop table if exists public.hekim_calisma_duzeni;

delete from schema_migrations where version = '135';

commit;
