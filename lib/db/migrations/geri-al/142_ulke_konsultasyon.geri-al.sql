-- ROLLBACK of migration 142 (ulke_konsultasyon). NOTYA-ULKE-MESAJ-01.
-- Removes the two tables of the consultation between doctors (the consultations and the consultation codes) and
-- their two trigger functions.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (142 before 141).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while a table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_konsultasyonlar') is not null then
    select count(*) into n from public.ulke_konsultasyonlar;
    if n > 0 then raise exception 'rollback refused: public.ulke_konsultasyonlar holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
  if to_regclass('public.ulke_konsultasyon_kodlari') is not null then
    select count(*) into n from public.ulke_konsultasyon_kodlari;
    if n > 0 then raise exception 'rollback refused: public.ulke_konsultasyon_kodlari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

drop table if exists public.ulke_konsultasyonlar;
drop table if exists public.ulke_konsultasyon_kodlari;
drop function if exists public.ulke_konsultasyon_kilidi();
drop function if exists public.ulke_konsultasyon_kodu_kilidi();

delete from schema_migrations where version = '142';

commit;
