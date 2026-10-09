-- ROLLBACK of migration 140 (ulke_hasta_mesajlari). NOTYA-ULKE-MESAJ-01.
-- Removes the two tables of the messages between a doctor and a patient, and their two trigger functions.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (140 before 139).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while a table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_hasta_mesajlari') is not null then
    select count(*) into n from public.ulke_hasta_mesajlari;
    if n > 0 then raise exception 'rollback refused: public.ulke_hasta_mesajlari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
  if to_regclass('public.ulke_mesaj_yazismalari') is not null then
    select count(*) into n from public.ulke_mesaj_yazismalari;
    if n > 0 then raise exception 'rollback refused: public.ulke_mesaj_yazismalari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

drop table if exists public.ulke_hasta_mesajlari;
drop table if exists public.ulke_mesaj_yazismalari;
drop function if exists public.ulke_hasta_mesaji_kilidi();
drop function if exists public.ulke_mesaj_yazismasi_kilidi();

delete from schema_migrations where version = '140';

commit;
