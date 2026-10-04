-- 122 — KONSULTASYONLAR-01 (2026-10-04): Defter · portal jeton · beklenen gün · fısıltı bağı · dönüş.
--
-- Mevcut kapıyı bozma: ikinci konsültasyon tablosu YOK. `sevkler` satırı genişler (058 deseni).
-- Defter: hekimin güvendiği konsültanlar — hekime özel (başka hekim görmez).
-- Portal: hesap/şifre yok; jeton HMAC (randevu eylem deseni) + isteğe bağlı hash (iptal/yenile).
-- Fısıltı: yalnız hekim isterse `fisilti_oge_id` ile ilişkilendirilir; servis/ekran değişmez.
--
-- ADDITIVE only. Idempotent.

-- ─── 1. Defter (hekime özel adres defteri) ───────────────────────────────────
create table if not exists public.konsultasyon_defter (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  ad_soyad text not null,
  brans text not null,                 -- kanonik SpecialtyKey veya serbest branş etiketi
  telefon text,
  adres text,
  eposta text,
  whatsapp text,
  kurum_ici boolean not null default false,
  not_metni text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists konsultasyon_defter_doktor_idx
  on public.konsultasyon_defter (doctor_id, ad_soyad);

alter table public.konsultasyon_defter enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'konsultasyon_defter' and policyname = 'doktor kendi defteri') then
    create policy "doktor kendi defteri" on public.konsultasyon_defter
      for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
end $$;

-- ─── 2. sevkler genişlemesi (nullable; mevcut satırlar dokunulmaz) ───────────
alter table sevkler add column if not exists beklenen_gun date;
alter table sevkler add column if not exists defter_id uuid;
alter table sevkler add column if not exists fisilti_oge_id text;
alter table sevkler add column if not exists portal_jeton_hash text;
alter table sevkler add column if not exists portal_jeton_son timestamptz;
alter table sevkler add column if not exists konsultan_notu text;
alter table sevkler add column if not exists asistan_on_not text;
alter table sevkler add column if not exists asistan_on_not_at timestamptz;
alter table sevkler add column if not exists hekim_onay_at timestamptz;
alter table sevkler add column if not exists hastaya_verildi_at timestamptz;
alter table sevkler add column if not exists kaynak_not_id uuid;
alter table sevkler add column if not exists portal_gonderildi_at timestamptz;
-- Konsültanın yüklediği ek belgeler (birden fazla; belge_id birincil rapor kalır)
alter table sevkler add column if not exists belge_idler uuid[];

do $$
begin
  if to_regclass('public.konsultasyon_defter') is not null and not exists (
    select 1 from pg_constraint where conname = 'sevkler_defter_id_fkey'
  ) then
    alter table sevkler add constraint sevkler_defter_id_fkey
      foreign key (defter_id) references konsultasyon_defter(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sevkler_kaynak_not_id_fkey') then
    alter table sevkler add constraint sevkler_kaynak_not_id_fkey
      foreign key (kaynak_not_id) references notes(id) on delete set null;
  end if;
end $$;

create index if not exists sevkler_portal_hash_idx on sevkler (portal_jeton_hash)
  where portal_jeton_hash is not null;
create index if not exists sevkler_beklenen_gun_idx on sevkler (doctor_id, beklenen_gun)
  where durum in ('acik', 'yanit_bekleniyor');

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('122', '122_konsultasyonlar.sql', null, now(), false,
  'KONSULTASYONLAR-01: defter + sevkler portal/beklenen/fisilti/dönüş kolonları')
on conflict (version) do nothing;
