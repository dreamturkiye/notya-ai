-- 136 NOTYA-ULKE-PORTAL-01 (Kaan, 2026-10-09) — USAGE of a country build: what the checklist calls "cost per visit"
-- (docs/COUNTRY-PACK-CHECKLIST.md L1), as counts only. NO AMOUNT OF MONEY is stored anywhere.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   ulke_kullanim_olcumu   one row per ACCOUNT, per DAY (the account's own calendar day, in its time zone) and per
--                          TASK: how many times the task ran and, where the provider reports them, how many seconds
--                          of audio or how many tokens went in and came out. The tasks are named by the application
--                          (lib/ulke/uygulama/kullanimOlcumu.ts): speech first pass, speech second pass, note,
--                          rewrite, patient summary.
--   ulke_kullanim_ekle()   adds to a row, or creates it. One statement, so two visits ending at the same moment
--                          cannot lose a count.
--
-- No patient is named: the table has no patient column, and holds no text of a visit. Why a table of its own: the
-- model gateway's own usage log is a table of another database; a country database has none, so until this file a
-- country build's usage was recorded nowhere.
--
-- SERVER ONLY. Row-level security on, no rule, no privilege for the browser roles; the function is closed to them.
-- Country in the key and in the foreign key, like every country table (rules: migration 130).
--
-- Safe to run twice. One transaction. No "drop … if exists". NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 136 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
end $$;

create table if not exists public.ulke_kullanim_olcumu (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- The ACCOUNT's own calendar day (its time zone, one of the pack's list), not the server's.
  gun date not null,
  -- A task key of the application: lower-case words joined by hyphens.
  gorev text not null check (gorev ~ '^[a-z]+(-[a-z0-9]+)*$' and char_length(gorev) <= 40),
  -- How many times the task ran that day.
  adet integer not null default 0 check (adet >= 0),
  -- Seconds of audio the speech provider reported. 0 where the task has none or the provider did not say.
  saniye numeric not null default 0 check (saniye >= 0),
  -- Tokens the model provider reported. 0 where the task has none or the provider did not say.
  giris_token bigint not null default 0 check (giris_token >= 0),
  cikis_token bigint not null default 0 check (cikis_token >= 0),
  updated_at timestamptz not null default now(),
  primary key (ulke, doctor_id, gun, gorev),
  constraint ulke_kullanim_olcumu_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

alter table public.ulke_kullanim_olcumu enable row level security;
revoke all on table public.ulke_kullanim_olcumu from anon, authenticated;

create or replace function public.ulke_kullanim_ekle(
  p_ulke text,
  p_doctor_id uuid,
  p_gun date,
  p_gorev text,
  p_adet integer,
  p_saniye numeric,
  p_giris_token bigint,
  p_cikis_token bigint
) returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.ulke_kullanim_olcumu (ulke, doctor_id, gun, gorev, adet, saniye, giris_token, cikis_token)
  values (p_ulke, p_doctor_id, p_gun, p_gorev, greatest(coalesce(p_adet, 0), 0), greatest(coalesce(p_saniye, 0), 0), greatest(coalesce(p_giris_token, 0), 0), greatest(coalesce(p_cikis_token, 0), 0))
  on conflict (ulke, doctor_id, gun, gorev) do update
     set adet = public.ulke_kullanim_olcumu.adet + excluded.adet,
         saniye = public.ulke_kullanim_olcumu.saniye + excluded.saniye,
         giris_token = public.ulke_kullanim_olcumu.giris_token + excluded.giris_token,
         cikis_token = public.ulke_kullanim_olcumu.cikis_token + excluded.cikis_token,
         updated_at = now();
$$;

revoke all on function public.ulke_kullanim_ekle(text, uuid, date, text, integer, numeric, bigint, bigint) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ulke_kullanim_ekle(text, uuid, date, text, integer, numeric, bigint, bigint) to service_role;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('136', '136_ulke_kullanim_olcumu.sql', null, now(), false,
  'NOTYA-ULKE-PORTAL-01: usage of a country build per account, per day of the account, per task: counts, seconds of audio, tokens. No amount of money, no visit text. Server only.')
on conflict (version) do nothing;

commit;
