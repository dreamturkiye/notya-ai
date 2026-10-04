-- 113 — NOTYA-RANDEVU-V2 PR3 (2026-10-04): waitlist ("daha erken saat çıkarsa haber ver") and its e-mail offers.
-- New tables only. Reached only while the doctor's 'Hasta Portalı Randevu' is ON. Safe to re-run.

create table if not exists public.randevu_bekleme_listesi (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- The appointment the patient wants to bring forward (moved to the offered slot on acceptance).
  randevu_id uuid references public.randevular(id) on delete cascade,
  sure_dk integer not null check (sure_dk between 5 and 480),
  -- Only slots starting before this are worth offering (the current appointment's start).
  en_gec timestamptz not null,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'kabul', 'iptal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_randevu_bekleme_acik on public.randevu_bekleme_listesi (randevu_id) where durum = 'bekliyor';
create index if not exists idx_randevu_bekleme_sira on public.randevu_bekleme_listesi (doktor_id, durum, created_at);

-- One freed slot is offered to one waiting patient at a time, in list order; an unanswered offer expires and
-- the slot moves to the next patient. First to accept gets a request (talep) for it.
create table if not exists public.randevu_bekleme_teklifleri (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  bekleme_id uuid not null references public.randevu_bekleme_listesi(id) on delete cascade,
  baslangic timestamptz not null,
  bitis timestamptz not null,
  son_gecerlilik timestamptz not null,
  durum text not null default 'acik' check (durum in ('acik', 'kabul', 'suresi_doldu', 'gecersiz')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_randevu_bekleme_teklif_acik on public.randevu_bekleme_teklifleri (doktor_id, durum, son_gecerlilik);
create index if not exists idx_randevu_bekleme_teklif_bekleme on public.randevu_bekleme_teklifleri (bekleme_id);

alter table public.randevu_bekleme_listesi enable row level security;
alter table public.randevu_bekleme_teklifleri enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'randevu_bekleme_listesi' and policyname = 'randevu_bekleme_listesi_doktor') then
    create policy randevu_bekleme_listesi_doktor on public.randevu_bekleme_listesi for select using (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_bekleme_teklifleri' and policyname = 'randevu_bekleme_teklifleri_doktor') then
    create policy randevu_bekleme_teklifleri_doktor on public.randevu_bekleme_teklifleri for select using (auth.uid() = doktor_id);
  end if;
end $$;

-- patient_id is new on this table: the same restrictive patient-ownership policy 052 puts on every patient table.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'randevu_bekleme_listesi' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.randevu_bekleme_listesi as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('113', '113_randevu_v2_bekleme.sql', null, now(), false, 'NOTYA-RANDEVU-V2 PR3: bekleme listesi + e-posta teklifleri')
on conflict (version) do nothing;
