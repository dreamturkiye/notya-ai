-- ROLLBACK of migration 148 (ulke_muayene_ekleri_ve_foto). MUAYENE-EKLERI-07 + FOTO-ARSIV-01.
-- Removes the two tables (exam attachments, patient photo archive), their two trigger functions, and the two
-- upload-only policies on storage.objects. THE BUCKETS THEMSELVES ARE NOT REMOVED HERE: Supabase refuses direct
-- deletes from its storage tables. Empty and delete `muayene-ekleri` and `hasta-fotograflari` in the Storage page
-- of the dashboard (both buckets hold nothing once their rows are deleted by hand first, per the refusal below).
--
-- Touches of Türkiye's objects: storage.objects — two policies of ours dropped (each a short ACCESS EXCLUSIVE
-- lock, no row touched); one row removed from the ledger.
-- Run the rollbacks in REVERSE order (this one before 145): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while either table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_muayene_ekleri') is not null then
    select count(*) into n from public.ulke_muayene_ekleri;
    if n > 0 then raise exception 'rollback refused: public.ulke_muayene_ekleri holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
  if to_regclass('public.ulke_hasta_fotograflari') is not null then
    select count(*) into n from public.ulke_hasta_fotograflari;
    if n > 0 then raise exception 'rollback refused: public.ulke_hasta_fotograflari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

-- The only statements here that touch a table Türkiye uses: dropping OUR two policies, each a short exclusive
-- lock on storage.objects. Skipped when a policy is not there (second run: no lock at all).
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'muayene_ekleri_ulke_ve_kendi_klasorune_yukle') then
    drop policy "muayene_ekleri_ulke_ve_kendi_klasorune_yukle" on storage.objects;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'hasta_fotograflari_ulke_ve_kendi_klasorune_yukle') then
    drop policy "hasta_fotograflari_ulke_ve_kendi_klasorune_yukle" on storage.objects;
  end if;
end $$;

drop table if exists public.ulke_muayene_ekleri;
drop table if exists public.ulke_hasta_fotograflari;
drop function if exists public.ulke_muayene_ekleri_degismez();
drop function if exists public.ulke_hasta_fotograflari_kilidi();

delete from schema_migrations where version = '148';

commit;
