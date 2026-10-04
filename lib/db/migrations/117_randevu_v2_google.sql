-- 117 — NOTYA-RANDEVU-V2 PR2 (2026-10-04): Google Takvim two-way sync. New tables only; nothing existing changes.
-- Dormant until GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET exist and a doctor connects. Safe to re-run.

-- ── 1. One connection per doctor (refresh token encrypted at rest with lib/security/encryption.ts) ──
create table if not exists public.google_takvim_baglantilari (
  doktor_id uuid primary key references auth.users(id) on delete cascade,
  adres text,
  refresh_token_encrypted text not null,
  takvim_id text not null default 'primary',
  durum text not null default 'bagli' check (durum in ('bagli', 'yenilenmeli')),
  -- KVKK: event title = patient initials unless the doctor turns this on.
  tam_ad boolean not null default false,
  sync_token text,
  -- Initial full sync may span several cron ticks.
  sayfa_jetonu text,
  kanal_id text,
  kanal_kaynak_id text,
  kanal_jeton_hash text,
  kanal_bitis timestamptz,
  son_senk timestamptz,
  son_hata text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_google_takvim_kanal on public.google_takvim_baglantilari (kanal_id);

-- ── 2. Google → Notya: busy blocks only (start/end; no title, description, attendees or location stored) ──
create table if not exists public.randevu_dis_mesgul (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  kaynak text not null default 'google' check (kaynak in ('google')),
  dis_id text not null,
  baslangic timestamptz not null,
  bitis timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (doktor_id, kaynak, dis_id),
  check (bitis > baslangic)
);
create index if not exists idx_randevu_dis_mesgul_zaman on public.randevu_dis_mesgul (doktor_id, baslangic);

-- ── 3. Notya → Google: which event mirrors which appointment (no FK: a deleted appointment's event must still be removed) ──
create table if not exists public.randevu_google_eslesme (
  randevu_id uuid primary key,
  doktor_id uuid not null references auth.users(id) on delete cascade,
  google_event_id text not null,
  baslangic timestamptz not null,
  bitis timestamptz not null,
  durum text not null default 'aktif' check (durum in ('aktif', 'silindi')),
  updated_at timestamptz not null default now()
);
create index if not exists idx_randevu_google_eslesme_doktor on public.randevu_google_eslesme (doktor_id, durum);

-- ── 4. A Notya event moved or deleted in Google → a proposal for the doctor, never applied silently ──
create table if not exists public.randevu_takvim_onerileri (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  randevu_id uuid not null,
  tur text not null check (tur in ('tasindi', 'silindi')),
  yeni_baslangic timestamptz,
  yeni_bitis timestamptz,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'uygulandi', 'yoksayildi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_randevu_takvim_onerisi_bekleyen on public.randevu_takvim_onerileri (randevu_id) where durum = 'bekliyor';
create index if not exists idx_randevu_takvim_onerileri_doktor on public.randevu_takvim_onerileri (doktor_id, durum);

alter table public.google_takvim_baglantilari enable row level security;
alter table public.randevu_dis_mesgul enable row level security;
alter table public.randevu_google_eslesme enable row level security;
alter table public.randevu_takvim_onerileri enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'google_takvim_baglantilari' and policyname = 'google_takvim_baglantilari_doktor') then
    -- Read-only for the doctor's own session; the token column is never selected by any route.
    create policy google_takvim_baglantilari_doktor on public.google_takvim_baglantilari for select using (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_dis_mesgul' and policyname = 'randevu_dis_mesgul_doktor') then
    create policy randevu_dis_mesgul_doktor on public.randevu_dis_mesgul for select using (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_google_eslesme' and policyname = 'randevu_google_eslesme_doktor') then
    create policy randevu_google_eslesme_doktor on public.randevu_google_eslesme for select using (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_takvim_onerileri' and policyname = 'randevu_takvim_onerileri_doktor') then
    create policy randevu_takvim_onerileri_doktor on public.randevu_takvim_onerileri for select using (auth.uid() = doktor_id);
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('117', '117_randevu_v2_google.sql', null, now(), false, 'NOTYA-RANDEVU-V2 PR2: Google Takvim bağlantısı, dış meşgul blokları, eşleşme, öneriler')
on conflict (version) do nothing;
