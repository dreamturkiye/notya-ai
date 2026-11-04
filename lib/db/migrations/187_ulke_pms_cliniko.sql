-- 187 AU-PMS-CLINIKO-01 — add Cliniko to PMS vault + outbox vendor checks.
-- Best Practice stays partner-gated (back burner). Cliniko is clinic API-key self-serve.
-- Genie / Gentu keep Magentus Partner API path (same tables).

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_pms_baglantilari') is null then
    raise exception 'country migration 187 refused: public.ulke_pms_baglantilari is missing. Apply 184 first.';
  end if;
end $$;

do $$
declare c text;
begin
  select con.conname into c
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'ulke_pms_baglantilari' and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%saglayici%';
  if c is not null then execute format('alter table public.ulke_pms_baglantilari drop constraint %I', c); end if;
  alter table public.ulke_pms_baglantilari
    add constraint ulke_pms_baglantilari_saglayici_check
    check (saglayici in ('best-practice', 'genie', 'gentu', 'cliniko'));

  select con.conname into c
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'ulke_pms_yazma_kuyrugu' and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%hedef%';
  if c is not null then execute format('alter table public.ulke_pms_yazma_kuyrugu drop constraint %I', c); end if;
  alter table public.ulke_pms_yazma_kuyrugu
    add constraint ulke_pms_yazma_kuyrugu_hedef_check
    check (hedef in ('best-practice', 'genie', 'gentu', 'cliniko'));
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('187', '187_ulke_pms_cliniko.sql', null, now(), false,
  'AU-PMS-CLINIKO-01: Cliniko vendor on vault + outbox. Bp remains partner-gated.')
on conflict (version) do nothing;

commit;
