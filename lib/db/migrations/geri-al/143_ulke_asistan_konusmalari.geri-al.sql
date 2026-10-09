-- ROLLBACK of migration 143 (ulke_asistan_konusmalari, ulke_asistan_mesajlari). NOTYA-ULKE-ASISTAN-01.
-- Removes the assistant's conversations, their messages and the two trigger functions.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (143 before 139).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while a table it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_asistan_mesajlari') is not null then
    select count(*) into n from public.ulke_asistan_mesajlari;
    if n > 0 then raise exception 'rollback refused: public.ulke_asistan_mesajlari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
  if to_regclass('public.ulke_asistan_konusmalari') is not null then
    select count(*) into n from public.ulke_asistan_konusmalari;
    if n > 0 then raise exception 'rollback refused: public.ulke_asistan_konusmalari holds % row(s). Export and empty it by hand first.', n; end if;
  end if;
end $$;

drop table if exists public.ulke_asistan_mesajlari;
drop table if exists public.ulke_asistan_konusmalari;
drop function if exists public.ulke_asistan_mesaj_kilidi();
drop function if exists public.ulke_asistan_konusma_kilidi();

delete from schema_migrations where version = '143';

commit;
