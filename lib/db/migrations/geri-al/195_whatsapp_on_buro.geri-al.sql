-- Rollback of 195 (WHATSAPP-ONBURO-01). Switch the feature off first: no doctor row may still say 'onay' / 'otomatik'.
-- Rows the feature wrote keep their meaning for the audit trail: front-desk cards (niyet 'randevu') are relabelled
-- 'diger', and appointments made in the chat (kaynak 'whatsapp') are relabelled 'portal' so the double-booking guarantee
-- (scoped to kaynak IS NOT NULL) keeps covering them. The doctors' practice sheets are lost with the settings table.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.randevular') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'randevular' and column_name = 'kaynak') then
    alter table public.randevular drop constraint if exists randevular_kaynak_check;
    update public.randevular set kaynak = 'portal' where kaynak = 'whatsapp';
    alter table public.randevular add constraint randevular_kaynak_check check (kaynak is null or kaynak in ('portal')) not valid;
  end if;
  if to_regclass('public.whatsapp_yanitlar') is not null then
    drop index if exists public.whatsapp_yanitlar_on_buro_idx;
    alter table public.whatsapp_yanitlar drop constraint if exists whatsapp_yanitlar_niyet_check;
    update public.whatsapp_yanitlar set niyet = 'diger' where niyet = 'randevu';
    alter table public.whatsapp_yanitlar add constraint whatsapp_yanitlar_niyet_check
      check (niyet in ('onay', 'iptal', 'yeniden_planla', 'soru', 'vazgec', 'diger'));
    alter table public.whatsapp_yanitlar drop column if exists on_buro;
  end if;
end $$;

drop table if exists public.whatsapp_on_buro_ayarlari;
delete from schema_migrations where version = '195';
commit;
