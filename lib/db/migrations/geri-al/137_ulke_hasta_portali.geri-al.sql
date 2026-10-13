-- ROLLBACK of migration 137 (ulke_hasta_portali). NOTYA-ULKE-PORTAL-01.
-- Removes the patient portal's tables and functions, and the unique constraint 137 added to ulke_randevulari.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (137 before 136).
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

-- Refuses while any of the tables it would drop still holds a row: a rollback never destroys a country's data silently.
do $$
declare n bigint; t text;
begin
  foreach t in array array['ulke_randevu_istekleri', 'ulke_portal_kayitlari', 'ulke_hasta_ozetleri', 'ulke_portal_oturumlari', 'ulke_portal_erisimleri'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then raise exception 'rollback refused: public.% holds % row(s). Export and empty it by hand first.', t, n; end if;
    end if;
  end loop;
end $$;

drop function if exists public.ulke_randevu_istegi_kabul(text, uuid, uuid, timestamptz, timestamptz, text, boolean, timestamptz);
drop function if exists public.ulke_ozet_paylas(text, uuid, uuid, boolean, timestamptz);
drop function if exists public.ulke_portal_deneme_sonucu(text, uuid, boolean, integer, text, timestamptz, timestamptz);
drop function if exists public.ulke_portal_deneme_al(text, text, integer, integer, timestamptz);
drop function if exists public.ulke_portal_erisim_iptal(text, uuid, uuid, timestamptz);
drop function if exists public.ulke_portal_erisim_ver(text, uuid, uuid, text, text, timestamptz, timestamptz);
drop table if exists public.ulke_randevu_istekleri;
drop table if exists public.ulke_portal_kayitlari;
drop table if exists public.ulke_hasta_ozetleri;
drop function if exists public.ulke_hasta_ozeti_kilidi();
drop table if exists public.ulke_portal_oturumlari;
drop table if exists public.ulke_portal_erisimleri;
do $$
begin
  if to_regclass('public.ulke_randevulari') is not null then
    alter table public.ulke_randevulari drop constraint if exists ulke_randevulari_hasta_tekil;
  end if;
end $$;

delete from schema_migrations where version = '137';

commit;
