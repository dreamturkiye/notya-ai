-- NOTYA-KALKAN-01 (Kaan + Gökhan, 2026-09-26) — WhatsApp defteri ve Fısıltı ilaç taslağı.
--
-- 099 is already gelen belgeler. 102 is reserved on the unpushed QA branch (portal PIN lock).
-- This file is 103 so the two can land without a number clash.
--
-- Written only — NOT applied by the agent. Idempotent.
-- Until this file is applied, Kalkan stays off (missing table → no write, no 500) and the
-- existing one-tap + template path is unchanged. The new users column is a SEPARATE select
-- from the 095 iletişim columns.

alter table public.users add column if not exists iletisim_whatsapp_muayenehane text;

create table if not exists public.wa_konusma (
  id               uuid primary key default gen_random_uuid(),
  doctor_id        uuid not null references auth.users(id) on delete cascade,
  phone_number_id  text not null,
  from_e164        text not null,
  hasta_id         uuid references public.patients(id) on delete set null,
  eslesme          text not null default 'bilinmeyen',
  son_sinif        text,
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create unique index if not exists wa_konusma_hat_idx
  on public.wa_konusma (doctor_id, phone_number_id, from_e164);

create table if not exists public.wa_satir (
  id               uuid primary key default gen_random_uuid(),
  konusma_id       uuid references public.wa_konusma(id) on delete cascade,
  doctor_id        uuid not null references auth.users(id) on delete cascade,
  yon              text not null,
  wamid            text not null,
  kaynak_wamid     text,
  from_e164        text,
  phone_number_id  text,
  zaman            timestamptz not null default now(),
  tip              text,
  govde_encrypted  text,
  media_id         text,
  sinif            text,
  sinif_kaynagi    text,
  hasta_id         uuid references public.patients(id) on delete set null,
  eslesme          text,
  created_at       timestamptz not null default now()
);
create unique index if not exists wa_satir_wamid_idx on public.wa_satir (wamid);
create index if not exists wa_satir_doktor_zaman_idx on public.wa_satir (doctor_id, zaman desc);

create table if not exists public.wa_taslak (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  ilac_id       uuid references public.hasta_ilaclar(id) on delete set null,
  eylem         text not null,
  kapsam        text,
  emin          boolean not null default false,
  metin         text not null,
  durum         text not null default 'bekliyor',
  kaynak_wamid  text not null,
  zaman         timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create unique index if not exists wa_taslak_wamid_idx on public.wa_taslak (doctor_id, kaynak_wamid);
create index if not exists wa_taslak_bekleyen_idx on public.wa_taslak (doctor_id, durum, zaman);

alter table public.wa_konusma enable row level security;
alter table public.wa_satir enable row level security;
alter table public.wa_taslak enable row level security;

do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.wa_konusma for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.wa_konusma as restrictive for all to authenticated, anon
    using (hasta_id is null or exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()))
    with check (hasta_id is null or exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.wa_satir for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.wa_satir as restrictive for all to authenticated, anon
    using (hasta_id is null or exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()))
    with check (hasta_id is null or exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.wa_taslak for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.wa_taslak as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
