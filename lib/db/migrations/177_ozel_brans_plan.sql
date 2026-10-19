-- 177 — Özel Branş planı. Hasta başına araç kaydı. Tanı / doz kolonu yok.
-- Yalnız ekleme. Tekrar çalıştırmak güvenli.

create table if not exists ozel_brans_plan (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  slug text not null,
  arac text not null,
  ozet text not null default '',
  portal_satir jsonb not null default '[]'::jsonb,
  vadeler jsonb not null default '[]'::jsonb,
  acil text,
  riza boolean not null default false,
  girdi jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ozel_brans_plan_hekim_hasta_arac unique (doctor_id, patient_id, arac)
);
create index if not exists ozel_brans_plan_doktor_idx on ozel_brans_plan (doctor_id, updated_at desc);
create index if not exists ozel_brans_plan_hasta_idx on ozel_brans_plan (patient_id, doctor_id);
alter table public.ozel_brans_plan add column if not exists girdi jsonb not null default '{}'::jsonb;

alter table public.ozel_brans_plan enable row level security;
do $$
begin
  begin
    create policy "hasta_izolasyon_kendi_satiri" on public.ozel_brans_plan
      for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  exception when duplicate_object then null;
  end;
  begin
    create policy "hasta_izolasyon_hasta_sahipligi" on public.ozel_brans_plan
      as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  exception when duplicate_object then null;
  end;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('177', '177_ozel_brans_plan.sql', null, now(), false, 'Özel Branş plan: ozel_brans_plan + RLS')
on conflict (version) do nothing;
