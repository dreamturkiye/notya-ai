-- 176 — Klinik çatı katmanı. 004'teki clinics / clinic_members / clinic_invitations genişler.
-- Doktor uygulamasının tablolarına davranış eklemez. randevular.klinik_oda_id boşsa
-- mevcut randevu akışı aynı kalır. AI Resepsiyon varsayılan olarak kapalıdır.

alter table public.clinics add column if not exists adres text;
alter table public.clinics add column if not exists vergi_no text;
alter table public.clinics add column if not exists calisma jsonb;
alter table public.clinics add column if not exists rezervasyon jsonb;
alter table public.clinics add column if not exists widget jsonb;
alter table public.clinics add column if not exists mesaj jsonb;
alter table public.clinics add column if not exists resepsiyon_acik boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clinics_vergi_no_check' and conrelid = 'public.clinics'::regclass
  ) then
    alter table public.clinics
      add constraint clinics_vergi_no_check check (vergi_no is null or vergi_no ~ '^[0-9]{10}$');
  end if;
end $$;

alter table public.clinic_members add column if not exists koltuk boolean not null default true;

create table if not exists public.clinic_odalar (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  ad text not null,
  tur text not null default 'muayene' check (tur in ('muayene', 'tedavi', 'diger')),
  aktif boolean not null default true,
  sira integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_clinic_odalar_clinic on public.clinic_odalar (clinic_id, sira);

create table if not exists public.clinic_yetkileri (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  rol text not null check (rol in ('sekreter', 'asistan', 'hasta_danismani')),
  modul text not null check (modul in ('takvim', 'hasta', 'paket', 'odeme', 'mesaj', 'kurulum')),
  oku boolean not null default false,
  yaz boolean not null default false,
  sil boolean not null default false,
  primary key (clinic_id, rol, modul)
);

create table if not exists public.clinic_paketler (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  ad text not null,
  seans integer not null check (seans between 1 and 200),
  ucret_kurus integer not null default 0 check (ucret_kurus >= 0),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_clinic_paketler_clinic on public.clinic_paketler (clinic_id);

create table if not exists public.clinic_odeme_planlari (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  paket_id uuid references public.clinic_paketler(id) on delete set null,
  ad text not null,
  taksit integer not null check (taksit between 1 and 36),
  pesinat_kurus integer not null default 0 check (pesinat_kurus >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_ziyaret_kapanis (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  randevu_id uuid not null,
  kapatan_id uuid not null references auth.users(id),
  geldi boolean not null,
  paket_dus boolean not null default false,
  takip_notu text,
  created_at timestamptz not null default now(),
  unique (clinic_id, randevu_id)
);

alter table public.randevular add column if not exists klinik_oda_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'randevular_klinik_oda_fk'
  ) then
    alter table public.randevular
      add constraint randevular_klinik_oda_fk
      foreign key (klinik_oda_id) references public.clinic_odalar(id) on delete set null;
  end if;
exception when undefined_table then
  null;
end $$;

create extension if not exists btree_gist;

do $$
begin
  if to_regclass('public.randevular') is not null
     and not exists (select 1 from pg_constraint where conname = 'randevular_klinik_oda_cakisma_yok') then
    alter table public.randevular
      add constraint randevular_klinik_oda_cakisma_yok
      exclude using gist (klinik_oda_id with =, tstzrange(baslangic, bitis, '[)') with &&)
      where (klinik_oda_id is not null and durum <> 'iptal');
  end if;
end $$;

alter table public.clinic_odalar enable row level security;
alter table public.clinic_yetkileri enable row level security;
alter table public.clinic_paketler enable row level security;
alter table public.clinic_odeme_planlari enable row level security;
alter table public.clinic_ziyaret_kapanis enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'clinic_odalar' and policyname = 'clinic_odalar_uye') then
    create policy clinic_odalar_uye on public.clinic_odalar for select using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_odalar.clinic_id and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_odalar' and policyname = 'clinic_odalar_yonetici') then
    create policy clinic_odalar_yonetici on public.clinic_odalar for all using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_odalar.clinic_id and m.role = 'admin' and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_yetkileri' and policyname = 'clinic_yetkileri_uye') then
    create policy clinic_yetkileri_uye on public.clinic_yetkileri for select using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_yetkileri.clinic_id and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_yetkileri' and policyname = 'clinic_yetkileri_yonetici') then
    create policy clinic_yetkileri_yonetici on public.clinic_yetkileri for all using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_yetkileri.clinic_id and m.role = 'admin' and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_paketler' and policyname = 'clinic_paketler_uye') then
    create policy clinic_paketler_uye on public.clinic_paketler for select using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_paketler.clinic_id and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_paketler' and policyname = 'clinic_paketler_yonetici') then
    create policy clinic_paketler_yonetici on public.clinic_paketler for all using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_paketler.clinic_id and m.role = 'admin' and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_odeme_planlari' and policyname = 'clinic_plan_uye') then
    create policy clinic_plan_uye on public.clinic_odeme_planlari for select using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_odeme_planlari.clinic_id and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_odeme_planlari' and policyname = 'clinic_plan_yonetici') then
    create policy clinic_plan_yonetici on public.clinic_odeme_planlari for all using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_odeme_planlari.clinic_id and m.role = 'admin' and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_ziyaret_kapanis' and policyname = 'clinic_kapanis_uye') then
    create policy clinic_kapanis_uye on public.clinic_ziyaret_kapanis for select using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_ziyaret_kapanis.clinic_id and m.is_active)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'clinic_ziyaret_kapanis' and policyname = 'clinic_kapanis_yonetici') then
    create policy clinic_kapanis_yonetici on public.clinic_ziyaret_kapanis for all using (
      auth.uid() in (select owner_id from public.clinics c where c.id = clinic_id)
      or auth.uid() in (select user_id from public.clinic_members m where m.clinic_id = clinic_ziyaret_kapanis.clinic_id and m.role = 'admin' and m.is_active)
    );
  end if;
end $$;
