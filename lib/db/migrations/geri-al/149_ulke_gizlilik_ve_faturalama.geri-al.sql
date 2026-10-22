-- ROLLBACK of migration 149 (AU-BETA-01). Refuses while any of the four tables holds a row. One transaction.
-- NEVER RUN by the job that wrote it except on a throwaway database.
begin;
set local lock_timeout = '4s';
do $$
declare n bigint; t text;
begin
  foreach t in array array['ulke_riza_kayitlari','ulke_erisim_talepleri','ulke_faturalar','ulke_odeme_baglantilari'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then raise exception 'rollback 149 refused: % holds % row(s)', t, n; end if;
    end if;
  end loop;
end $$;
drop table if exists public.ulke_odeme_baglantilari;
drop table if exists public.ulke_faturalar;
drop table if exists public.ulke_erisim_talepleri;
drop table if exists public.ulke_riza_kayitlari;
drop function if exists public.ulke_riza_kayitlari_kilidi();
commit;
