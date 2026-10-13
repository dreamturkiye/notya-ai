-- ROLLBACK of migration 145 (clinic accounts: ulke_klinikler, ulke_klinik_uyeleri, ulke_klinik_davetleri,
-- ulke_klinik_yetkileri, ulke_klinik_erisim_kayitlari and their functions). NOTYA-ULKE-KLINIK-01.
-- Run on the country's OWN database only, never on any other. Run the rollbacks in REVERSE order (145 before 139).
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
  foreach t in array array['ulke_klinik_erisim_kayitlari', 'ulke_klinik_yetkileri', 'ulke_klinik_davetleri', 'ulke_klinik_uyeleri', 'ulke_klinikler'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then raise exception 'rollback refused: public.% holds % row(s). Export and empty it by hand first.', t, n; end if;
    end if;
  end loop;
end $$;

drop function if exists public.ulke_klinik_yetki_geri_al(text, uuid, uuid, timestamptz);
drop function if exists public.ulke_klinik_yetki_ver(text, uuid, uuid, uuid, text, uuid, timestamptz, timestamptz, uuid, timestamptz);
drop function if exists public.ulke_klinik_konum_degistir(text, uuid, uuid, text, uuid, timestamptz);
drop function if exists public.ulke_klinik_uye_cikar(text, uuid, uuid, uuid, timestamptz);
drop function if exists public.ulke_klinik_katil(text, text, uuid, timestamptz);
drop function if exists public.ulke_klinik_kur(text, uuid, text, timestamptz);
drop function if exists public.ulke_klinik_yonetebilir(text, text);

drop table if exists public.ulke_klinik_erisim_kayitlari;
drop table if exists public.ulke_klinik_yetkileri;
drop table if exists public.ulke_klinik_davetleri;
drop table if exists public.ulke_klinik_uyeleri;
drop table if exists public.ulke_klinikler;

drop function if exists public.ulke_klinik_erisim_kaydi_kilidi();
drop function if exists public.ulke_klinik_yetki_kilidi();
drop function if exists public.ulke_klinik_davet_kilidi();
drop function if exists public.ulke_klinik_uye_kilidi();
drop function if exists public.ulke_klinik_kilidi();

delete from schema_migrations where version = '145';

commit;
