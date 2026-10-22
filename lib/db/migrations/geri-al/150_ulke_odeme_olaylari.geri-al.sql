-- ROLLBACK of migration 150 (AU-BETA-02). Refuses while the event ledger holds a row. One transaction.
-- NEVER RUN by the job that wrote it except on a throwaway database.
begin;
set local lock_timeout = '4s';
do $$
declare n bigint;
begin
  if to_regclass('public.ulke_odeme_olaylari') is not null then
    select count(*) into n from public.ulke_odeme_olaylari;
    if n > 0 then raise exception 'rollback 150 refused: ulke_odeme_olaylari holds % row(s)', n; end if;
  end if;
end $$;
drop table if exists public.ulke_odeme_olaylari;
commit;
