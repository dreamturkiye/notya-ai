-- NOTYA-GELISIM-01 (Kaan 2026-09-14): Gelişim taraması (GİDR bazlı) kayıtları.
-- "Denver II" değil — ticari test adı kullanılmıyor. Sağlık Bakanlığı GİDR itemlerine
-- doktorun işaretlediği yanıtlar + AI'nin SOAP-stili yorumu (asla sahte bir "Denver skoru" değil).

create table if not exists gelisim_taramalari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  ay_yas numeric not null,
  yas_basamak_etiket text not null,
  yanitlar jsonb not null,
  ai_yorum text,
  sevk_onerisi boolean not null default false,
  not_id uuid references notes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists gelisim_taramalari_patient_idx on gelisim_taramalari(patient_id, created_at desc);

alter table gelisim_taramalari enable row level security;

create policy "doktor kendi hastasinin gelisim taramalarini gorur"
  on gelisim_taramalari for select
  using (doctor_id = auth.uid());

create policy "doktor kendi hastasina gelisim taramasi ekler"
  on gelisim_taramalari for insert
  with check (doctor_id = auth.uid());
