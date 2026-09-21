-- 087 — Hasta görüntü dosyası (ceket). PACS değil: bu hastanın filmleri.
-- Orijinal vault'ta (medical_documents). Bu tablo yalnız indeks + onay durumu.
-- HASTA-IZOLASYON: her satır doctor_id + patient_id; RLS + restrictive sahiplik.

create table if not exists public.goruntu_calisma (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  doctor_id uuid not null references auth.users(id),
  tip text not null check (tip in ('xr', 'ekg', 'goz', 'derm', 'mg', 'us', 'ct', 'mr', 'pet', 'diger')),
  modalite text not null,
  bolge text,
  tarih date,
  kaynak text not null default 'klinik_yukleme'
    check (kaynak in ('klinik_yukleme', 'hasta_yukleme', 'dicom', 'hastane_link')),
  belge_id uuid references public.medical_documents(id),
  calisma_id uuid not null default gen_random_uuid(),
  dicom_var boolean not null default false,
  asistan_analiz_id uuid,
  onay_durum text not null default 'taslak'
    check (onay_durum in ('taslak', 'hekim_duzenledi', 'hekim_onay', 'hasta_paylas')),
  seans_id uuid,
  hekim_yorum text,
  hastane_link text,
  created_at timestamptz not null default now()
);

create index if not exists goruntu_calisma_hasta_tip_tarih_idx
  on public.goruntu_calisma (patient_id, tip, tarih desc nulls last, created_at desc);

create index if not exists goruntu_calisma_doktor_hasta_idx
  on public.goruntu_calisma (doctor_id, patient_id);

alter table public.goruntu_calisma enable row level security;

drop policy if exists "doctor sees own only" on public.goruntu_calisma;
create policy "doctor sees own only" on public.goruntu_calisma
  for all using (auth.uid() = doctor_id);

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.goruntu_calisma;
create policy "hasta_izolasyon_hasta_sahipligi" on public.goruntu_calisma
  as restrictive for all to authenticated, anon
  using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
  with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '087',
  '087_goruntu_calisma.sql',
  null,
  now(),
  false,
  'Hasta görüntü ceketi: XR/EKG/Göz/Derm/MG/US — vault belge_id, portal yalnız hasta_paylas'
)
on conflict (version) do nothing;
