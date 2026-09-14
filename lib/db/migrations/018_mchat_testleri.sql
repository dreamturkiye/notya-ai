-- NOTYA-MCHAT-01 (Kaan 2026-09-14): M-CHAT-R/F otizm tarama testi kayıtları.
-- Her satır bir uygulama (bir hasta birden çok kez taranabilir, ör. 18. ay ve 24. ay).
-- cevaplar: {"1": true, "2": false, ...} (soru no -> Evet/Hayır). Puanlama deterministik,
-- lib/clinical/mchatR.ts'de hesaplanır; burada yalnız sonuç saklanır.

create table if not exists mchat_testleri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  cevaplar jsonb not null,
  toplam_puan int not null,
  risk_seviyesi text not null,
  sonuc_metni text not null,
  not_id uuid references notes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists mchat_testleri_patient_idx on mchat_testleri(patient_id, created_at desc);

alter table mchat_testleri enable row level security;

create policy "doktor kendi hastasinin mchat testlerini gorur"
  on mchat_testleri for select
  using (doctor_id = auth.uid());

create policy "doktor kendi hastasina mchat testi ekler"
  on mchat_testleri for insert
  with check (doctor_id = auth.uid());
