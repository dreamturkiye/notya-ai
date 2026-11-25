-- 206 — TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24): monthly edition check of the Turkish protocol library.
--
-- The registry itself is code (lib/kaynaklar/protokolKutuphanesi/belgeler.ts). These tables hold only what the monthly check
-- observed and what the founder decided:
--   protokol_takip_durum        last answer of each watched official URL (hash / ETag / Last-Modified / listing links)
--   protokol_inceleme_kuyrugu   flagged changes waiting for founder review (never applied automatically)
--   protokol_surum_duyurulari   a reviewed new edition → one Fısıltı to the doctors of the affected branşlar
--   protokol_duyuru_gorulen     which doctor has seen / dismissed which announcement (one Fısıltı per doctor)
--
-- No patient data anywhere. RLS on every table. Service role only, except: signed-in users may read announcements
-- (public, non-personal), and a doctor reads / writes only their own "seen" rows. ADDITIVE ONLY; idempotent.

create table if not exists protokol_takip_durum (
  url text primary key check (char_length(url) between 8 and 1000),
  hash text,
  etag text,
  son_degisiklik text,
  http_durum integer,
  liste_ogeleri jsonb,
  kontrol_at timestamptz not null default now(),
  degisti_at timestamptz
);
alter table protokol_takip_durum enable row level security;

create table if not exists protokol_inceleme_kuyrugu (
  id uuid primary key default gen_random_uuid(),
  tur text not null check (tur in ('icerik-degisti', 'erisilemiyor', 'yeni-surum-adayi', 'yeni-belge-adayi', 'listeden-kalkti')),
  url text not null check (char_length(url) between 8 and 1000),
  belge_idleri text[] not null default '{}',
  ayrinti jsonb not null default '{}'::jsonb,
  imza text not null unique check (char_length(imza) between 3 and 1500),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'onaylandi', 'reddedildi')),
  created_at timestamptz not null default now(),
  karar_at timestamptz,
  karar_veren uuid references auth.users(id) on delete set null,
  karar_notu text check (karar_notu is null or char_length(karar_notu) <= 1000)
);
create index if not exists protokol_inceleme_kuyrugu_bekleyen_idx on protokol_inceleme_kuyrugu (created_at desc) where durum = 'bekliyor';
alter table protokol_inceleme_kuyrugu enable row level security;

create table if not exists protokol_surum_duyurulari (
  id uuid primary key default gen_random_uuid(),
  belge_id text not null check (char_length(belge_id) between 2 and 120),
  baslik text not null check (char_length(baslik) between 3 and 300),
  branslar text[] not null check (cardinality(branslar) between 1 and 40),
  surum text check (surum is null or char_length(surum) <= 200),
  yil integer check (yil is null or yil between 1990 and 2100),
  url text check (url is null or char_length(url) <= 1000),
  kuyruk_id uuid references protokol_inceleme_kuyrugu(id) on delete set null,
  yayin_at timestamptz not null default now()
);
create index if not exists protokol_surum_duyurulari_yayin_idx on protokol_surum_duyurulari (yayin_at desc);
create index if not exists protokol_surum_duyurulari_brans_idx on protokol_surum_duyurulari using gin (branslar);
alter table protokol_surum_duyurulari enable row level security;

create table if not exists protokol_duyuru_gorulen (
  doctor_id uuid not null references auth.users(id) on delete cascade,
  duyuru_id uuid not null references protokol_surum_duyurulari(id) on delete cascade,
  gorulme_at timestamptz not null default now(),
  primary key (doctor_id, duyuru_id)
);
alter table protokol_duyuru_gorulen enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'protokol_surum_duyurulari' and policyname = 'oturum acmis okur') then
    create policy "oturum acmis okur" on protokol_surum_duyurulari for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'protokol_duyuru_gorulen' and policyname = 'doktor kendi gorulenleri') then
    create policy "doktor kendi gorulenleri" on protokol_duyuru_gorulen for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
end $$;

-- Default privileges hand authenticated TRUNCATE / UPDATE / TRIGGER, which RLS does not stop: revoke everything, grant exactly.
revoke all on protokol_takip_durum, protokol_inceleme_kuyrugu, protokol_surum_duyurulari, protokol_duyuru_gorulen from anon, authenticated;
grant select on protokol_surum_duyurulari to authenticated;
grant select, insert, delete on protokol_duyuru_gorulen to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('206', '206_protokol_kutuphanesi.sql', null, now(), false,
  'TR-PROTOKOL-KUTUPHANESI: protokol_takip_durum, protokol_inceleme_kuyrugu (service role only); protokol_surum_duyurulari (authenticated read); protokol_duyuru_gorulen (doctor own rows); RLS on all')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select relname, relrowsecurity from pg_class where relname like 'protokol_%' and relkind = 'r';
--   select tablename, policyname, cmd, roles from pg_policies where tablename like 'protokol_%';
--   select grantee, table_name, privilege_type from information_schema.role_table_grants where table_name like 'protokol_%' and grantee in ('anon', 'authenticated');
