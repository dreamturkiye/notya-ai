-- 196 (Claude, 2026-11-12) — GERI-CAGIRMA-01 (Kaan, 2026-11-12): "Recall engine with a revenue counter."
--
-- ONE FILE FOR ALL SEVEN DATABASES (the 188 pattern): Türkiye and the six country databases (us, gb, ca, au, nz, uz).
-- Every table carries `ulke`; Türkiye writes 'tr', a country build writes its own code. There is deliberately NO
-- foreign key to a patient or account table: those tables are named differently in a country database
-- (ulke_hastalar / ulke_hesaplari) than in Türkiye (patients / auth.users). Ownership is enforced by the application
-- (service role + doctor id AND patient id in every statement, .cursor/skills/hasta-izolasyon/SKILL.md) and repeated
-- here by row-level security. ADDITIVE and idempotent; no existing row changes. Number 195 is left to the job that
-- runs in parallel (WhatsApp front desk).
--
--   geri_cagirma_kayitlari   one row per patient per "Çağır" tap: why (reason keys only, never free clinical text),
--                            which channel, whether it left, and — filled in later by the application — whether the
--                            SAME patient then booked (through the tagged link or any other route), attended, and
--                            what recorded payment followed. unique (ulke, doctor_id, istek_anahtari, patient_id) is
--                            the idempotency gate: the row is inserted BEFORE anything is sent, so a double tap or a
--                            retried request cannot send twice.
--   geri_cagirma_ayarlari    per doctor: the cool-down in days, the "estimate" switch (off by default) and the last
--                            stored "patients who can be recalled now" number the home card reads.
--   geri_cagirma_aylik       per doctor and month: stored counters (sent, booked, attended, recorded payments). The
--                            home card and the founder console read THESE rows; nothing is recomputed on a page load.
begin;
set local lock_timeout = '4s';

create table if not exists public.geri_cagirma_kayitlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  istek_anahtari text not null check (char_length(istek_anahtari) between 8 and 80),
  nedenler text[] not null default '{}',
  kaynak text not null default '' check (char_length(kaynak) <= 60),
  vade date,
  kanal text not null check (kanal in ('whatsapp', 'sms', 'eposta', 'elle')),
  sablon text not null default 'kontrol' check (char_length(sablon) <= 40),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'gonderildi', 'basarisiz', 'atlandi')),
  hata text check (hata is null or char_length(hata) <= 500),
  saglayici_mesaj_id text,
  baglanti_var boolean not null default false,
  gonderen_user_id uuid,
  gonderen_personel_id uuid,
  gonderen_rol text,
  gonderildi_at timestamptz,
  randevu_id uuid,
  randevu_at timestamptz,
  randevu_yolu text check (randevu_yolu is null or randevu_yolu in ('baglanti', 'diger')),
  geldi_at timestamptz,
  tahsilat_kurus bigint check (tahsilat_kurus is null or tahsilat_kurus >= 0),
  para_birimi text check (para_birimi is null or para_birimi ~ '^[A-Z]{3}$'),
  atif_guncellendi_at timestamptz,
  created_at timestamptz not null default now(),
  unique (ulke, doctor_id, istek_anahtari, patient_id)
);
create index if not exists geri_cagirma_kayitlari_doktor_idx on public.geri_cagirma_kayitlari (ulke, doctor_id, gonderildi_at desc);
create index if not exists geri_cagirma_kayitlari_hasta_idx on public.geri_cagirma_kayitlari (ulke, doctor_id, patient_id, created_at desc);

create table if not exists public.geri_cagirma_ayarlari (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  bekleme_gun integer not null default 30 check (bekleme_gun between 7 and 365),
  tahmini_goster boolean not null default false,
  cagrilabilir integer check (cagrilabilir is null or cagrilabilir >= 0),
  cagrilabilir_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (ulke, doctor_id)
);

create table if not exists public.geri_cagirma_aylik (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  ay date not null check (extract(day from ay) = 1),
  gonderilen integer not null default 0 check (gonderilen >= 0),
  randevu_alan integer not null default 0 check (randevu_alan >= 0),
  gelen integer not null default 0 check (gelen >= 0),
  tahsilat_kurus bigint not null default 0 check (tahsilat_kurus >= 0),
  para_birimi text check (para_birimi is null or para_birimi ~ '^[A-Z]{3}$'),
  guncellendi_at timestamptz not null default now(),
  primary key (ulke, doctor_id, ay)
);

alter table public.geri_cagirma_kayitlari enable row level security;
alter table public.geri_cagirma_ayarlari enable row level security;
alter table public.geri_cagirma_aylik enable row level security;
revoke all on table public.geri_cagirma_kayitlari from anon;
revoke all on table public.geri_cagirma_ayarlari from anon;
revoke all on table public.geri_cagirma_aylik from anon;
revoke insert, update, delete, truncate on table public.geri_cagirma_kayitlari from authenticated;
revoke insert, update, delete, truncate on table public.geri_cagirma_ayarlari from authenticated;
revoke insert, update, delete, truncate on table public.geri_cagirma_aylik from authenticated;

-- Own rows only, read only, for a signed-in browser session (second line behind the server routes). Created only
-- where absent, so the file can be run again.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geri_cagirma_kayitlari' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.geri_cagirma_kayitlari for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geri_cagirma_ayarlari' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.geri_cagirma_ayarlari for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geri_cagirma_aylik' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.geri_cagirma_aylik for select to authenticated using (doctor_id = auth.uid());
  end if;
  -- Türkiye only (the table `patients` exists there): the 052-style restrictive rule — a row is visible only while
  -- its patient is the same doctor's patient. A country database has no `patients` table and skips this block.
  if to_regclass('public.patients') is not null
     and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geri_cagirma_kayitlari' and policyname = 'hasta sahibi doktor') then
    execute 'create policy "hasta sahibi doktor" on public.geri_cagirma_kayitlari as restrictive for select to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))';
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('196', '196_geri_cagirma.sql', null, now(), false,
  'GERI-CAGIRMA-01: recall log with attribution columns, per-doctor recall settings, stored monthly counters')
on conflict (version) do nothing;

commit;
