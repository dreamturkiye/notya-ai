-- 212 — EV-ACIL-SEKER + HEKIM-PUSH (Kaan, 2026-11-25). CORE: every one of the 30 medical branches and the 10 Özel
-- Branşlar (one shared Sağlığım data model; glucose only where the module is active — lib/saglikEvi/moduller.ts).
--
--   ev_olcumleri.isaret          'hi' | 'lo' — a glucometer that shows "HI" / "LO" (above / below its measuring range). Stored
--                                as a FLAG with deger = null (never a made-up number). Only for tip = 'glukoz'. Existing rows
--                                are untouched (isaret null, deger as before).
--   hekim_push_abonelikleri      the doctor's own Web Push subscriptions (one per browser endpoint). Doctor-own rows; the app
--                                writes them through the service role after doktorOturum; no PHI in the row.
--   hekim_bildirim_ayarlari      per-doctor notification settings: on/off per level (acil / hekime_bildir / morning
--                                summary), working hours (default 08:00–20:00), optional quiet hours, the doctor's time zone.
--   ev_bildirim_gunlugu          now also logs doctor pushes (tur hekim_acil / hekim_bildir / hekim_ozet / hekim_ertele).
--                                patient_id becomes nullable: the morning summary is per doctor, not per patient. The unique
--                                `anahtar` keeps every send idempotent and is what the per-doctor rate limit counts.
--
-- Access (hasta-izolasyon): service role only for every write. RLS on for the two new tables; a doctor may SELECT only his
-- own rows (doctor_id = auth.uid()); anon has no privilege at all; no write policy (writes go through the server).
-- Applied to production with the Supabase tools on 2026-11-25 UTC (migration log name: 212_ev_acil_hekim_push).

-- ── HI / LO meter readings ──────────────────────────────────────────────────────────────────────────────────────────
alter table public.ev_olcumleri add column if not exists isaret text;
alter table public.ev_olcumleri drop constraint if exists ev_olcumleri_isaret_chk;
alter table public.ev_olcumleri add constraint ev_olcumleri_isaret_chk check (isaret is null or isaret in ('hi', 'lo'));
alter table public.ev_olcumleri alter column deger drop not null;
alter table public.ev_olcumleri drop constraint if exists ev_olcumleri_deger_veya_isaret_chk;
alter table public.ev_olcumleri add constraint ev_olcumleri_deger_veya_isaret_chk check (
  (isaret is null and deger is not null) or (isaret is not null and deger is null and deger2 is null and tip = 'glukoz')
);
comment on column public.ev_olcumleri.isaret is 'EV-ACIL-SEKER: glucometer showed HI / LO (outside its range). deger is null for these rows — never a fake number.';

-- ── Doctor Web Push ─────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hekim_push_abonelikleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 1024),
  p256dh text not null,
  auth text not null,
  cihaz text check (cihaz is null or char_length(cihaz) <= 80),
  hata_sayisi integer not null default 0,
  son_basari_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hekim_push_abonelikleri_doktor_idx on public.hekim_push_abonelikleri (doctor_id);

create table if not exists public.hekim_bildirim_ayarlari (
  doctor_id uuid primary key references auth.users(id) on delete cascade,
  acil_acik boolean not null default true,
  bildir_acik boolean not null default true,
  ozet_acik boolean not null default true,
  calisma_bas text not null default '08:00' check (calisma_bas ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  calisma_bit text not null default '20:00' check (calisma_bit ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  sessiz_bas text check (sessiz_bas is null or sessiz_bas ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  sessiz_bit text check (sessiz_bit is null or sessiz_bit ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  saat_dilimi text not null default 'Europe/Istanbul' check (char_length(saat_dilimi) between 3 and 64),
  istem_kapatildi_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.ev_bildirim_gunlugu alter column patient_id drop not null;
alter table public.ev_bildirim_gunlugu drop constraint if exists ev_bildirim_gunlugu_tur_check;
alter table public.ev_bildirim_gunlugu add constraint ev_bildirim_gunlugu_tur_check check (tur in ('doz', 'kacirma', 'kritik', 'kontrol_ozeti', 'foto_okuma', 'hekim_acil', 'hekim_bildir', 'hekim_ozet', 'hekim_ertele'));
create index if not exists ev_bildirim_gunlugu_hekim_idx on public.ev_bildirim_gunlugu (doctor_id, created_at desc) where tur like 'hekim\_%';

alter table public.hekim_push_abonelikleri enable row level security;
alter table public.hekim_bildirim_ayarlari enable row level security;

do $$
declare t text;
begin
  foreach t in array array['hekim_push_abonelikleri', 'hekim_bildirim_ayarlari'] loop
    begin
      execute format('create policy "doktor kendi satirlari" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

revoke all on public.hekim_push_abonelikleri, public.hekim_bildirim_ayarlari from anon;
revoke insert, update, delete, truncate, references, trigger on public.hekim_push_abonelikleri, public.hekim_bildirim_ayarlari from authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('212', '212_ev_acil_hekim_push.sql', null, now(), false,
  'EV-ACIL-SEKER + HEKIM-PUSH: ev_olcumleri.isaret (hi/lo, deger null), hekim_push_abonelikleri, hekim_bildirim_ayarlari, ev_bildirim_gunlugu hekim_* types + nullable patient_id; RLS on, doctor select own rows, anon nothing, writes service role only')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select column_name, is_nullable from information_schema.columns where table_name = 'ev_olcumleri' and column_name in ('deger', 'isaret');
--   select relname, relrowsecurity from pg_class where relname in ('hekim_push_abonelikleri', 'hekim_bildirim_ayarlari');
--   select tablename, policyname, cmd from pg_policies where tablename like 'hekim\_%' order by 1, 2;
--   select grantee, privilege_type from information_schema.role_table_grants where table_name like 'hekim\_%' and grantee = 'anon';  -- expect 0 rows
