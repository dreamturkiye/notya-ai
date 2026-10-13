-- ROLLBACK of migration 132 (muayene_dil_kaydi). NOTYA-ULKE-SABLON-01.
-- Removes the country visit tables, the daily counter and the upload rule of the recordings bucket. THE BUCKET ITSELF IS NOT REMOVED HERE: Supabase refuses direct deletes from its storage tables. Empty and delete the bucket `muayene-sesleri` in the Storage page of the dashboard (recordings are removed right after transcription, so it should be empty).
--
-- Touches of Türkiye's objects: storage.objects — one policy of ours dropped (short ACCESS EXCLUSIVE lock, no row touched); one row removed from the ledger.
-- Run the rollbacks in REVERSE order (135 first, 128 last): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while any of the tables it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.muayene_dil_kaydi') is not null then execute 'select count(*) from public.muayene_dil_kaydi' into n; if n > 0 then raise exception 'rollback refused: public.muayene_dil_kaydi holds % row(s). Export and empty it by hand first.', n; end if; end if;
  if to_regclass('public.ulke_muayeneler') is not null then execute 'select count(*) from public.ulke_muayeneler' into n; if n > 0 then raise exception 'rollback refused: public.ulke_muayeneler holds % row(s). Export and empty it by hand first.', n; end if; end if;
  if to_regclass('public.ulke_kullanim') is not null then execute 'select count(*) from public.ulke_kullanim' into n; if n > 0 then raise exception 'rollback refused: public.ulke_kullanim holds % row(s). Export and empty it by hand first.', n; end if; end if;
end $$;

-- The only statement here that touches a table Türkiye uses: dropping OUR policy takes a short exclusive lock on
-- storage.objects. Skipped when the policy is not there (second run: no lock at all).
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'muayene_sesleri_ulke_ve_kendi_klasorune_yukle') then
    drop policy "muayene_sesleri_ulke_ve_kendi_klasorune_yukle" on storage.objects;
  end if;
end $$;
drop table if exists public.muayene_dil_kaydi;
drop table if exists public.ulke_muayeneler;
drop table if exists public.ulke_kullanim;

delete from schema_migrations where version = '132';

commit;
